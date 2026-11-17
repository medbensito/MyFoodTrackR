import { useEffect, useState } from 'react'

type Status = { standalone: boolean; offline: boolean; persisted: boolean | null; online: boolean }

function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean }
  return nav.standalone === true || window.matchMedia?.('(display-mode: standalone)').matches === true
}

async function readStatus(): Promise<Status> {
  let persisted: boolean | null = null
  try { persisted = navigator.storage?.persisted ? await navigator.storage.persisted() : null } catch { persisted = null }
  let offline = false
  try { offline = !!(await navigator.serviceWorker?.getRegistration())?.active } catch { offline = false }
  return { standalone: isStandalone(), offline, persisted, online: navigator.onLine }
}

/** Demande au navigateur de ne pas effacer les données en cas de manque d'espace. */
export async function requestPersistentStorage(): Promise<boolean> {
  try { return navigator.storage?.persist ? await navigator.storage.persist() : false } catch { return false }
}

function Row({ ok, label, detail }: { ok: boolean | null; label: string; detail: string }) {
  return (
    <div className="status-row">
      <span className={`status-dot ${ok === null ? '' : ok ? 'status-dot--ok' : 'status-dot--warn'}`} aria-hidden />
      <span className="ing-name"><strong>{label}</strong><span className="small muted">{detail}</span></span>
    </div>
  )
}

export function InstallCard() {
  const [s, setS] = useState<Status | null>(null)
  useEffect(() => {
    let alive = true
    const refresh = () => readStatus().then((v) => alive && setS(v))
    refresh()
    window.addEventListener('online', refresh); window.addEventListener('offline', refresh)
    return () => { alive = false; window.removeEventListener('online', refresh); window.removeEventListener('offline', refresh) }
  }, [])
  if (!s) return null

  return (
    <div className="card">
      <h2>Installation</h2>
      <Row ok={s.standalone} label={s.standalone ? 'Installée sur l\'écran d\'accueil' : 'Ouverte dans le navigateur'}
        detail={s.standalone ? 'L\'app s\'ouvre en plein écran.' : 'Dans Safari : Partager → « Sur l\'écran d\'accueil ».'} />
      <Row ok={s.offline} label={s.offline ? 'Disponible hors ligne' : 'Hors ligne pas encore prêt'}
        detail={s.offline ? 'Tout fonctionne sans connexion.' : 'Rouvre l\'app une fois connecté pour terminer la mise en cache.'} />
      <Row ok={s.persisted} label={s.persisted ? 'Stockage protégé' : 'Stockage standard'}
        detail={s.persisted
          ? 'Le système ne doit pas effacer tes données.'
          : s.standalone ? 'Installée, l\'app est protégée contre l\'effacement automatique de Safari.' : 'Installe l\'app pour éviter que Safari n\'efface les données après une longue absence.'} />
      {s.persisted === false && (
        <button className="btn btn--sm" style={{ marginTop: 6 }} onClick={async () => { await requestPersistentStorage(); setS(await readStatus()) }}>
          Demander la protection du stockage
        </button>
      )}
      <p className="small muted">{s.online ? 'Connecté' : 'Hors connexion'} · version {__APP_VERSION__}</p>
    </div>
  )
}
