import type { DayReview } from '../lib/review'

const DN = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

/**
 * Protéines par jour sur une semaine : une colonne par jour, une ligne de cible.
 * Une seule série (pas de légende) ; la valeur s'affiche sur la colonne choisie,
 * le détail de chaque jour reste lisible dans le tableau sous le graphique.
 */
export function ProteinWeekChart({ days, selected, onSelect }: {
  days: DayReview[]
  selected: string | null
  onSelect: (date: string) => void
}) {
  const W = 350, H = 200, padL = 30, padR = 8, padT = 22, padB = 26
  const plotW = W - padL - padR, plotH = H - padT - padB
  const target = Math.max(...days.map((d) => d.target.protein))
  const maxVal = Math.max(target, ...days.map((d) => d.consumed?.protein ?? 0))
  const yMax = Math.ceil((maxVal * 1.15) / 50) * 50
  const y = (v: number) => padT + plotH - (v / yMax) * plotH
  const slot = plotW / days.length
  const barW = Math.min(24, slot - 12)
  const ticks = Array.from({ length: yMax / 50 + 1 }, (_, i) => i * 50)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img"
      aria-label={`Protéines par jour : ${days.map((d) => `${d.consumed ? d.consumed.protein + ' g' : 'rien saisi'}`).join(', ')}. Cible ${target} g.`}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="#262c28" strokeWidth="1" />
          <text x={padL - 6} y={y(t) + 3.5} textAnchor="end" fontSize="10" fill="#8e978f" fontFamily="Inter, sans-serif">{t}</text>
        </g>
      ))}

      {days.map((d, i) => {
        const cx = padL + slot * i + slot / 2
        const v = d.consumed?.protein ?? 0
        const top = y(v)
        const base = y(0)
        const r = Math.min(4, (base - top) / 2)
        const isSel = d.date === selected
        const [yy, mm, dd] = d.date.split('-').map(Number)
        const dow = new Date(yy, mm - 1, dd).getDay()
        return (
          <g key={d.date}>
            {isSel && <rect x={cx - slot / 2 + 2} y={padT - 18} width={slot - 4} height={plotH + 18} rx="8" fill="#1b201d" />}
            {d.consumed && v > 0 && (
              <path
                d={`M${cx - barW / 2},${base} V${top + r} Q${cx - barW / 2},${top} ${cx - barW / 2 + r},${top} H${cx + barW / 2 - r} Q${cx + barW / 2},${top} ${cx + barW / 2},${top + r} V${base} Z`}
                fill="#c8f560"
              />
            )}
            {isSel && d.consumed && (
              <text x={cx} y={top - 6} textAnchor="middle" fontSize="13" fontWeight="700" fill="#f2f5f0" fontFamily="'Barlow Condensed', sans-serif">{v}</text>
            )}
            {!d.consumed && <text x={cx} y={base - 4} textAnchor="middle" fontSize="11" fill="#8e978f" fontFamily="Inter, sans-serif">—</text>}
            <text x={cx} y={H - 8} textAnchor="middle" fontSize="11" fontWeight={isSel ? 700 : 600}
              fill={isSel ? '#f2f5f0' : '#8e978f'} fontFamily="Inter, sans-serif">{DN[dow]}</text>
            {d.training && <rect x={cx - 6} y={H - 4} width="12" height="2" rx="1" fill="#8e978f" />}
            {/* Zone de toucher : toute la colonne, plus large que la barre. */}
            <rect x={cx - slot / 2} y={padT - 18} width={slot} height={plotH + padB + 18} fill="transparent"
              role="button" tabIndex={0} aria-label={`Voir le ${d.date}`} style={{ cursor: 'pointer' }}
              onClick={() => onSelect(d.date)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(d.date) } }} />
          </g>
        )
      })}

      <line x1={padL} x2={W - padR} y1={y(target)} y2={y(target)} stroke="#f2f5f0" strokeWidth="1.5" opacity="0.7" />
      <text x={W - padR} y={y(target) - 5} textAnchor="end" fontSize="10.5" fontWeight="600" fill="#c9d0c8" fontFamily="Inter, sans-serif">cible {target} g</text>
    </svg>
  )
}
