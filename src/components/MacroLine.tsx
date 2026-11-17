import type { Macros } from '../types'

export function MacroLine({ m }: { m: Macros }) {
  return (
    <div className="macro-line">
      <span className="macro macro--kcal">{m.kcal} kcal</span>
      <span className="macro macro--p">P {m.protein} g</span>
      <span className="macro">G {m.carbs} g</span>
      <span className="macro">L {m.fat} g</span>
    </div>
  )
}
