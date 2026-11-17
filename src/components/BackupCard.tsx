import { useRef, useState } from 'react'
import { db } from '../db/db'
import { exportAll, importAll } from '../db/backupDb'
import { backupFileName, daysSince, parseBackup, type Backup, type BackupCounts } from '../lib/backup'

const DATE_FMT = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`

export function lastExportLabel(ts: number | undefined): string {
  const d = daysSince(ts)
  if (d === null) return 'Jamais'
  if (d === 0) return 'Aujourd\'hui'
  if (d === 1) return 'Hier'
  return `Il y a ${d} jours`
}

export function BackupCard({ lastExportAt }: { lastExportAt?: number }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)
  const [pending, setPending] = useState<{ backup: Backup; counts: BackupCounts } | null>(null)
  const stale = (daysSince(lastExportAt) ?? Infinity) > 7

  const doExport = async () => {
    setBusy(true); setMessage(null)
    try {
      const backup = await exportAll(db)
      const name = backupFileName()
      const json = JSON.stringify(backup, null, 1)
      const file = new File([json], name, { type: 'application/json' })
      let done = false
      // Sur iPhone, la feuille de partage permet « Enregistrer dans Fichiers ».
      if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'Sauvegarde MyFoodTrackR' })
          done = true
        } catch (e) {
          if ((e as DOMException).name === 'AbortError') { setBusy(false); return }
        }
      }
      if (!done) {
        const url = URL.createObjectURL(file)
        const a = document.createElement('a')
        a.href = url; a.download = name
        document.body.appendChild(a); a.click(); a.remove()
        setTimeout(() => URL.revokeObjectURL(url), 10_000)
      }
      await db.settings.update('main', { lastExportAt: Date.now() })
      setMessage({ tone: 'ok', text: `Sauvegarde créée : ${name}` })
    } catch {
      setMessage({ tone: 'error', text: 'L\'export a échoué. Réessaie.' })
    }
    setBusy(false)
  }

  const onFile = async (file: File | undefined) => {
    setMessage(null); setPending(null)
    if (!file) return
    const result = parseBackup(await file.text())
    if (!result.ok) { setMessage({ tone: 'error', text: result.error }); return }
    setPending({ backup: result.backup, counts: result.counts })
  }

  const confirmImport = async () => {
    if (!pending) return
    setBusy(true)
    try {
      // La date du dernier export reste celle de cet appareil : l'import ne doit pas la faire oublier.
      const keep = (await db.settings.get('main'))?.lastExportAt
      await importAll(db, pending.backup)
      if (keep) await db.settings.update('main', { lastExportAt: Math.max(keep, (await db.settings.get('main'))?.lastExportAt ?? 0) })
      window.location.reload()
    } catch {
      setMessage({ tone: 'error', text: 'L\'import a échoué : tes données actuelles n\'ont pas été modifiées.' })
      setBusy(false)
    }
  }

  return (
    <div className="card">
      <h2>Sauvegarde</h2>
      <p className="small muted">
        Tes données ne sont que sur cet iPhone. Exporte-les régulièrement dans Fichiers ou iCloud Drive pour ne rien perdre.
      </p>
      <div className="field">
        <span>Dernier export</span>
        <strong className={stale ? 'warn' : 'ok'}>{lastExportLabel(lastExportAt)}</strong>
      </div>

      {pending ? (
        <div className="import-confirm">
          <p>
            Sauvegarde du <strong>{DATE_FMT.format(new Date(pending.backup.exportedAt))}</strong> :
            {' '}{plural(pending.counts.foods, 'aliment')}, {plural(pending.counts.recipes, 'recette')},
            {' '}{pending.counts.plannedMeals} repas planifié{pending.counts.plannedMeals > 1 ? 's' : ''},
            {' '}{plural(pending.counts.logEntries, 'entrée')} du journal.
          </p>
          <p className="small warn">Toutes tes données actuelles seront remplacées par celles de ce fichier.</p>
          <div className="danger-actions">
            <button className="secondary" onClick={() => setPending(null)} disabled={busy}>Annuler</button>
            <button className="danger" onClick={confirmImport} disabled={busy}>Remplacer mes données</button>
          </div>
        </div>
      ) : (
        <div className="backup-actions">
          <button className="primary" onClick={doExport} disabled={busy}>Exporter</button>
          <button className="secondary" onClick={() => fileRef.current?.click()} disabled={busy}>Importer…</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden
            onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = '' }} />
        </div>
      )}
      {message && <p className={`small ${message.tone === 'ok' ? 'ok' : 'error'}`} role="status">{message.text}</p>}
    </div>
  )
}
