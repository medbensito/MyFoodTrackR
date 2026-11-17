import type { Macros } from '../types'

export function MacroLine({ m }: { m: Macros }) {
  return (
    <p className="macro-line">
      {m.kcal} kcal <span className="dot">•</span> P {m.protein} g <span className="dot">•</span> G {m.carbs} g{' '}
      <span className="dot">•</span> L {m.fat} g
    </p>
  )
}
