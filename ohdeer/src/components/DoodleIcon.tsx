// Draws one doodle icon from src/assets/doodles/icons/.
// It uses the SVG file as a CSS "mask" (a stencil) and paints through it with
// the current text color, so the same file can be shown in any color.
import type { CSSProperties } from 'react'
import { iconFor } from '../lib/icons'

export default function DoodleIcon({ icon, className = '' }: { icon: string; className?: string }) {
  const style = { '--icon': `url("${iconFor(icon).url}")` } as CSSProperties
  return <span className={`doodle-icon ${className}`} style={style} aria-hidden="true" />
}
