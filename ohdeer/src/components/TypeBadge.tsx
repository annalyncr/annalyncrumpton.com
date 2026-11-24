// Shows one occurrence type: its doodle icon (in the type's color) and,
// unless iconOnly, its label on a soft wash of that color.
import type { CSSProperties } from 'react'
import type { OccurrenceType } from '../data'
import { typeColor } from '../lib/palette'
import DoodleIcon from './DoodleIcon'

interface Props {
  // Pick<…> = "only these fields are needed", so a form preview works too.
  type: Pick<OccurrenceType, 'label' | 'icon' | 'color'>
  iconOnly?: boolean
}

export default function TypeBadge({ type, iconOnly = false }: Props) {
  // A CSS variable set from JavaScript; index.css uses var(--type-color).
  const style = { '--type-color': typeColor(type.color) } as CSSProperties
  return (
    <span className={iconOnly ? 'badge icon-only' : 'badge'} style={style} title={type.label}>
      <DoodleIcon icon={type.icon} />
      {iconOnly ? <span className="visually-hidden">{type.label}</span> : type.label}
    </span>
  )
}
