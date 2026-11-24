// Add a new entry for a day, or edit one (when `entry` is passed in).
// Step 1: pick a type (or create one). Step 2: optional details.
import { useState, type FormEvent } from 'react'
import {
  createEntry, updateEntry, INTENSITIES, TIMES_OF_DAY,
  type Entry, type Intensity, type TimeOfDay,
} from '../data'
import { useTypes } from '../hooks/TypesContext'
import ChoiceChips from './ChoiceChips'
import TypeBadge from './TypeBadge'
import TypeForm from './TypeForm'

interface Props {
  date: string       // 'YYYY-MM-DD'
  entry?: Entry
  onDone: () => void // called after a successful save
  onCancel: () => void
}

export default function EntryForm({ date, entry, onDone, onCancel }: Props) {
  const { activeTypes, typeById, reload: reloadTypes } = useTypes()
  const [typeId, setTypeId] = useState(entry?.type_id ?? '')
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay | null>(entry?.time_of_day ?? null)
  const [intensity, setIntensity] = useState<Intensity | null>(entry?.intensity ?? null)
  const [note, setNote] = useState(entry?.note ?? '')
  const [creatingType, setCreatingType] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // If you're editing an entry whose type was archived, still offer that type.
  const current = entry ? typeById(entry.type_id) : undefined
  const choices = current?.archived ? [...activeTypes, current] : activeTypes

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!typeId) { setError('Pick a type first.'); return }
    setBusy(true)
    setError('')
    const fields = {
      date,
      type_id: typeId,
      time_of_day: timeOfDay,
      intensity,
      note: note.trim() || null, // an empty note is saved as "no note"
    }
    try {
      if (entry) await updateEntry(entry.id, fields)
      else await createEntry(fields)
      onDone()
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <div className="panel entry-form">
      {/* The type picker sits OUTSIDE the <form> below, because the inline
          "new type" form can't be nested inside another form in HTML. */}
      <fieldset className="chips">
        <legend>What happened?</legend>
        {choices.map((t) => (
          <button key={t.id} type="button" className="chip type-choice"
            aria-pressed={typeId === t.id} onClick={() => setTypeId(t.id)}>
            <TypeBadge type={t} />
          </button>
        ))}
        {!creatingType && (
          <button type="button" className="chip" onClick={() => setCreatingType(true)}>
            + new type
          </button>
        )}
      </fieldset>

      {creatingType && (
        <TypeForm
          onSaved={async (newType) => {
            await reloadTypes()
            setTypeId(newType.id) // select the type you just made
            setCreatingType(false)
          }}
          onCancel={() => setCreatingType(false)}
        />
      )}

      <form onSubmit={handleSubmit}>
        <ChoiceChips label="Time of day (optional)" options={TIMES_OF_DAY}
          value={timeOfDay} onChange={setTimeOfDay} />
        <ChoiceChips label="Intensity (optional)" options={INTENSITIES}
          value={intensity} onChange={setIntensity} />

        <label htmlFor="entry-note">Note (optional)</label>
        <textarea id="entry-note" rows={2} maxLength={2000} placeholder="afternoon showers"
          value={note} onChange={(e) => setNote(e.target.value)} />

        {error && <p className="error">{error}</p>}
        <div className="actions">
          <button disabled={busy}>{busy ? 'Saving…' : entry ? 'Save changes' : 'Add entry'}</button>
          <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  )
}
