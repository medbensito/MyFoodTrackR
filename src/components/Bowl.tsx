/**
 * Illustration décorative d'un bol (pas de photo : l'app fonctionne hors ligne
 * et n'embarque aucune image externe). La variante change la garniture.
 */
type Variant = 'chicken' | 'salmon' | 'salad' | 'pasta' | 'oats'

const TOPPINGS: Record<Variant, { base: string; items: { x: number; y: number; r: number; c: string }[] }> = {
  chicken: {
    base: '#f3ead7',
    items: [
      { x: 38, y: 40, r: 11, c: '#d99a4e' }, { x: 56, y: 36, r: 10, c: '#c9853d' },
      { x: 70, y: 46, r: 9, c: '#5fa83a' }, { x: 28, y: 52, r: 8, c: '#4a8f2c' },
      { x: 50, y: 52, r: 7, c: '#e8553f' }, { x: 64, y: 58, r: 6, c: '#f2c14b' },
    ],
  },
  salmon: {
    base: '#efe6d3',
    items: [
      { x: 46, y: 40, r: 13, c: '#f08a5d' }, { x: 66, y: 44, r: 9, c: '#5fa83a' },
      { x: 30, y: 48, r: 8, c: '#4a8f2c' }, { x: 56, y: 56, r: 7, c: '#e8553f' },
      { x: 38, y: 58, r: 6, c: '#f7f3e8' },
    ],
  },
  salad: {
    base: '#e3efcf',
    items: [
      { x: 36, y: 40, r: 10, c: '#5fa83a' }, { x: 54, y: 36, r: 10, c: '#7cc14b' },
      { x: 68, y: 48, r: 8, c: '#e8553f' }, { x: 44, y: 54, r: 8, c: '#f2c14b' },
      { x: 28, y: 54, r: 6, c: '#3f7f27' }, { x: 60, y: 58, r: 6, c: '#d84a6b' },
    ],
  },
  pasta: {
    base: '#f4d58a',
    items: [
      { x: 40, y: 42, r: 11, c: '#e9b949' }, { x: 58, y: 40, r: 10, c: '#f0c75e' },
      { x: 50, y: 54, r: 8, c: '#d8553f' }, { x: 30, y: 52, r: 6, c: '#5fa83a' },
      { x: 68, y: 52, r: 6, c: '#c47a3c' },
    ],
  },
  oats: {
    base: '#ece0c7',
    items: [
      { x: 40, y: 42, r: 9, c: '#f2d16b' }, { x: 56, y: 40, r: 8, c: '#f2d16b' },
      { x: 66, y: 50, r: 7, c: '#7a4a8c' }, { x: 32, y: 52, r: 6, c: '#c7473f' },
      { x: 50, y: 56, r: 6, c: '#b88a5a' },
    ],
  },
}

export function Bowl({ variant = 'chicken', size = 88 }: { variant?: Variant; size?: number }) {
  const t = TOPPINGS[variant]
  const id = `bowl-${variant}`
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" aria-hidden className="bowl">
      <defs>
        <radialGradient id={`${id}-dish`} cx="40%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#d9ddd8" />
        </radialGradient>
      </defs>
      <ellipse cx="50" cy="82" rx="34" ry="6" fill="rgba(0,0,0,0.12)" />
      <circle cx="48" cy="48" r="38" fill={`url(#${id}-dish)`} />
      <circle cx="48" cy="48" r="30" fill={t.base} />
      {t.items.map((i, k) => (
        <circle key={k} cx={i.x} cy={i.y} r={i.r} fill={i.c} opacity={0.95} />
      ))}
      <ellipse cx="36" cy="26" rx="12" ry="4" fill="rgba(255,255,255,0.55)" transform="rotate(-25 36 26)" />
    </svg>
  )
}

export const BOWL_VARIANTS: Variant[] = ['chicken', 'salad', 'salmon', 'pasta', 'oats']
