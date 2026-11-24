// Shows one occurrence type: its icon and (unless iconOnly) its label,
// on a soft wash of the type's color.
import type { CSSProperties } from 'react'
import type { OccurrenceType } from '../data'
import { iconFor } from '../lib/icons'
import { colorHex } from '../lib/palette'

interface Props {
  // Pick<…> = "only these fields are needed", so a form preview works too.
  type: Pick<OccurrenceType, 'label' | 'icon' | 'color'>
  iconOnly?: boolean
}

export default function TypeBadge({ type, iconOnly = false }: Props) {
  // A CSS variable set from JavaScript; index.css uses var(--type-color).
  const style = { '--type-color': colorHex(type.color) } as CSSProperties
  return (
    <span className={iconOnly ? 'badge icon-only' : 'badge'} style={style} title={type.label}>
      <span aria-hidden="true">{iconFor(type.icon).emoji}</span>
      {iconOnly ? <span className="visually-hidden">{type.label}</span> : type.label}
    </span>
  )
}
