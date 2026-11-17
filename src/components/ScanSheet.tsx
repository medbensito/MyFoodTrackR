import { useEffect, useRef, useState } from 'react'
import { db } from '../db/db'
import type { Food } from '../types'
import { kcalFromMacros, newId } from '../lib/nutrition'
import { isValidBarcode, lookupOff, normalizeBarcode, type FoodDraft } from '../lib/off'
import { BackIcon } from './icons'

type Step =
  | { kind: 'scan' }
  | { kind: 'loading'; code: string }
  | { kind: 'review'; code: string; origin: 'found' | 'not-found' | 'offline' | 'error'; draft: FoodDraft }

type CamState = 'starting' | 'on' | 'denied' | 'unavailable'

const MISSING_LABEL = { kcal: 'calories', protein: 'protéines', carbs: 'glucides', fat: 'lipides' } as const

const emptyDraft = (code: string): FoodDraft => ({
  name: '', category: 'autre', state: 'nature', kcal: NaN, protein: NaN, carbs: NaN, fat: NaN,
  defaultPortionG: 100, source: 'étiquette', verified: false, custom: true, barcode: code, missing: [],
})

/** Caméra + décodage en continu. Appelle `onCode` une seule fois, avec un code valide. */
function Camera({ onCode }: { onCode: (code: string) => void }) {
  const video = useRef<HTMLVideoElement>(null)
  const latest = useRef(onCode)
  const [state, setState] = useState<CamState>('starting')
  useEffect(() => { latest.current = onCode })

  useEffect(() => {
    let stream: MediaStream | null = null
    let stopped = false
    let timer = 0
    ;(async () => {
      if (!navigator.mediaDevices?.getUserMedia) { setState('unavailable'); return }
      try {
        const detectorP = import('../lib/scanner').then((m) => m.getDetector())
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        })
        if (stopped) return
        const v = video.current!
        v.srcObject = stream
        await v.play()
        setState('on')
        const detector = await detectorP
        const tick = async () => {
          if (stopped) return
          if (v.readyState >= 2) {
            try {
              const hit = (await detector.detect(v)).map((c) => c.rawValue).find(isValidBarcode)
              if (hit && !stopped) {
                stopped = true
                navigator.vibrate?.(40)
                latest.current(normalizeBarcode(hit))
                return
              }
            } catch { /* image illisible : on réessaie */ }
          }
          timer = window.setTimeout(tick, 120)
        }
        tick()
      } catch (e) {
        if (!stopped) setState((e as Error)?.name === 'NotAllowedError' ? 'denied' : 'unavailable')
      }
    })()
    return () => {
      stopped = true
      clearTimeout(timer)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  return (
    <div className={`scan-cam ${state === 'on' ? 'scan-cam--on' : ''}`}>
      <video ref={video} playsInline muted autoPlay aria-hidden />
      <div className="scan-frame" aria-hidden><span /><span /><span /><span /><i /></div>
      <p className="scan-cam-msg" role="status">
        {state === 'starting' && 'Ouverture de la caméra…'}
        {state === 'on' && 'Vise le code-barres, à 15 cm environ'}
        {state === 'denied' && "Accès à la caméra refusé : autorise-le dans Réglages › Safari › Caméra, ou saisis le code."}
        {state === 'unavailable' && 'Caméra indisponible : saisis le code ci-dessous.'}
      </p>
    </div>
  )
}

function Num({ label, unit, value, missing, onChange }: { label: string; unit: string; value: number; missing?: boolean; onChange: (v: number) => void }) {
  return (
    <label className={`field ${missing ? 'field--missing' : ''}`}>
      <span>{label}</span>
      <span className="field-input">
        <input className="input input--num" type="number" inputMode="decimal" step="0.1" aria-label={label}
          value={Number.isFinite(value) ? value : ''} placeholder={missing ? '?' : undefined}
          onChange={(e) => onChange(e.target.value === '' ? NaN : Number(e.target.value))} />
        <span className="unit">{unit}</span>
      </span>
    </label>
  )
}

/**
 * Scan d'un produit : aliment déjà connu → rendu tout de suite ; sinon fiche Open Food Facts
 * pré-remplie (ou formulaire vide hors ligne) à vérifier, puis enregistrée dans les aliments.
 */
export function ScanSheet({ onFood, onClose, saveLabel = "Enregistrer l'aliment" }: {
  onFood: (food: Food) => void
  onClose: () => void
  saveLabel?: string
}) {
  const [step, setStep] = useState<Step>({ kind: 'scan' })
  const [manual, setManual] = useState('')
  const manualOk = isValidBarcode(manual)

  const handle = async (raw: string) => {
    const code = normalizeBarcode(raw)
    const known = await db.foods.where('barcode').equals(code).first()
    if (known) { onFood(known); return }
    setStep({ kind: 'loading', code })
    const res = await lookupOff(code)
    setStep(res.status === 'found'
      ? { kind: 'review', code, origin: 'found', draft: res.draft }
      : { kind: 'review', code, origin: res.status, draft: emptyDraft(code) })
  }

  const retry = async (code: string) => {
    setStep({ kind: 'loading', code })
    const res = await lookupOff(code)
    if (res.status === 'found') setStep({ kind: 'review', code, origin: 'found', draft: res.draft })
    else setStep({ kind: 'review', code, origin: res.status, draft: emptyDraft(code) })
  }

  return (
    <div className="scan" role="dialog" aria-modal="true" aria-label="Scanner un produit">
      <div className="scan-head">
        {step.kind !== 'scan'
          ? <button className="sq-btn" aria-label="Scanner un autre produit" onClick={() => { setManual(''); setStep({ kind: 'scan' }) }}><BackIcon size={20} /></button>
          : <span />}
        <div className="bs-titles">
          <span className="caps caps--lime">{step.kind === 'scan' ? 'Code-barres' : step.code}</span>
          <strong>{step.kind === 'review' ? 'Vérifier' : 'Scanner un produit'}</strong>
        </div>
        <button className="bs-close" onClick={onClose}>Fermer</button>
      </div>

      <div className="scan-body">
        {step.kind === 'scan' && (
          <>
            <Camera onCode={handle} />
            <div className="card scan-manual">
              <label className="stack-field" style={{ marginTop: 0 }}>
                <span>Ou saisis le code</span>
                <span className="scan-manual-row">
                  <input className="input input--full" inputMode="numeric" autoComplete="off" placeholder="Ex. 6111245591063"
                    value={manual} onChange={(e) => setManual(e.target.value.replace(/\D/g, '').slice(0, 13))}
                    onKeyDown={(e) => { if (e.key === 'Enter' && manualOk) handle(manual) }} />
                  <button className="btn btn--lime btn--sm" disabled={!manualOk} onClick={() => handle(manual)}>Chercher</button>
                </span>
              </label>
              {manual.length >= 8 && !manualOk && <p className="small warn" style={{ marginTop: 8 }}>Code incomplet ou mal recopié (la clé de contrôle ne correspond pas).</p>}
            </div>
          </>
        )}

        {step.kind === 'loading' && (
          <div className="scan-loading" role="status">
            <span className="spinner" aria-hidden />
            <p>Recherche sur Open Food Facts…</p>
          </div>
        )}

        {step.kind === 'review' && (
          <Review key={step.code} step={step} saveLabel={saveLabel} onSaved={onFood} onRetry={() => retry(step.code)} />
        )}
      </div>
    </div>
  )
}

function Review({ step, saveLabel, onSaved, onRetry }: {
  step: Extract<Step, { kind: 'review' }>
  saveLabel: string
  onSaved: (f: Food) => void
  onRetry: () => void
}) {
  const [d, setD] = useState<FoodDraft>(step.draft)
  const update = (patch: Partial<FoodDraft>) => setD({ ...d, ...patch })
  const nums = [d.kcal, d.protein, d.carbs, d.fat]
  const numsOk = nums.every((n) => Number.isFinite(n) && n >= 0)
  const sumOk = !numsOk || d.protein + d.carbs + d.fat <= 100
  const valid = d.name.trim().length > 0 && numsOk && sumOk && d.defaultPortionG > 0
  const computed = numsOk ? Math.round(kcalFromMacros(d.protein, d.carbs, d.fat)) : null
  const gap = computed !== null && d.kcal > 0 ? Math.abs(computed - d.kcal) / d.kcal : 0
  const missing = new Set(step.draft.missing)

  const save = async () => {
    if (!valid) return
    const { missing: _m, ...rest } = d
    const food: Food = { ...rest, id: newId('scan'), name: d.name.trim() }
    await db.foods.put(food)
    onSaved(food)
  }

  return (
    <>
      {step.origin === 'found' ? (
        <p className="scan-note">
          <strong className="lime">Trouvé sur Open Food Facts.</strong> Base collaborative : compare avec l'étiquette avant d'enregistrer.
          {missing.size > 0 && <> Valeurs absentes de la fiche : {[...missing].map((k) => MISSING_LABEL[k]).join(', ')}.</>}
        </p>
      ) : (
        <p className="scan-note">
          <strong className="amber">
            {step.origin === 'not-found' && 'Produit absent d’Open Food Facts.'}
            {step.origin === 'offline' && 'Hors connexion.'}
            {step.origin === 'error' && 'Open Food Facts ne répond pas.'}
          </strong>{' '}
          Recopie les valeurs de l'étiquette, colonne « pour 100 g ». Au prochain scan, le produit sera reconnu même sans réseau.
          {step.origin !== 'not-found' && <> <button className="link" onClick={onRetry}>Réessayer</button></>}
        </p>
      )}

      <div className="card">
        <label className="stack-field" style={{ marginTop: 0 }}>
          <span>Nom</span>
          <input className="input input--full" placeholder="Ex. Skyr nature Jaouda" value={d.name} onChange={(e) => update({ name: e.target.value })} />
        </label>
      </div>

      <div className="card">
        <h2>Pour 100 g</h2>
        <Num label="Calories" unit="kcal" value={d.kcal} missing={missing.has('kcal')} onChange={(v) => update({ kcal: v })} />
        <Num label="Protéines" unit="g" value={d.protein} missing={missing.has('protein')} onChange={(v) => update({ protein: v })} />
        <Num label="Glucides" unit="g" value={d.carbs} missing={missing.has('carbs')} onChange={(v) => update({ carbs: v })} />
        <Num label="Lipides" unit="g" value={d.fat} missing={missing.has('fat')} onChange={(v) => update({ fat: v })} />
        {computed !== null && gap > 0.12 && (
          <p className="small warn" style={{ marginTop: 8 }}>Calcul depuis les macros : {computed} kcal — écart important, vérifie les valeurs.</p>
        )}
        {!sumOk && <p className="small error">Protéines + glucides + lipides dépassent 100 g.</p>}
        <Num label="Portion habituelle" unit="g" value={d.defaultPortionG} onChange={(v) => update({ defaultPortionG: v })} />
      </div>

      {!valid && <p className="footnote">Renseigne un nom et les quatre valeurs pour enregistrer.</p>}
      <button className="btn btn--lime btn--block" disabled={!valid} onClick={save}>{saveLabel}</button>
    </>
  )
}
