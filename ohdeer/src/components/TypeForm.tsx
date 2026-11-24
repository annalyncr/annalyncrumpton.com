// Create a new type, or edit an existing one (when `type` is passed in).
// Used on the Manage Types screen AND inline while adding an entry.
import { useState, type FormEvent } from 'react'
import { createType, updateType, type OccurrenceType } from '../data'
import { ICONS } from '../lib/icons'
import { PALETTE } from '../lib/palette'
import TypeBadge from './TypeBadge'

interface Props {
  type?: OccurrenceType
  onSaved: (saved: OccurrenceType) => void
  onCancel: () => void
}

export default function TypeForm({ type, onSaved, onCancel }: Props) {
  const [label, setLabel] = useState(type?.label ?? '')
  const [icon, setIcon] = useState(type?.icon ?? 'leaf')
  const [color, setColor] = useState(type?.color ?? 'moss')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const fields = { label: label.trim(), icon, color }
      const saved = type ? await updateType(type.id, fields) : await createType(fields)
      onSaved(saved)
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <label htmlFor="type-label">Name</label>
      <input id="type-label" required maxLength={60} placeholder="e.g. Rain storm"
        value={label} onChange={(e) => setLabel(e.target.value)} />

      <fieldset className="chips">
        <legend>Icon</legend>
        {ICONS.map((option) => (
          <button key={option.key} type="button" className="chip icon-choice"
            aria-pressed={icon === option.key} title={option.name} aria-label={option.name}
            onClick={() => setIcon(option.key)}>
            {option.emoji}
          </button>
        ))}
      </fieldset>

      <fieldset className="chips">
        <legend>Color</legend>
        {PALETTE.map((option) => (
          <button key={option.key} type="button" className="swatch"
            aria-pressed={color === option.key} title={option.name} aria-label={option.name}
            style={{ background: option.hex }}
            onClick={() => setColor(option.key)} />
        ))}
      </fieldset>

      <p className="preview">Preview: <TypeBadge type={{ label: label.trim() || 'New type', icon, color }} /></p>

      {error && <p className="error">{error}</p>}
      <div className="actions">
        <button disabled={busy}>{busy ? 'Saving…' : type ? 'Save type' : 'Create type'}</button>
        <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}
