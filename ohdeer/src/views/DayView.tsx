// One day: the list of entries, with add / edit / delete.
import { useState } from 'react'
import { Link, Navigate } from 'react-router'
import { deleteEntry, type Entry } from '../data'
import { useDateParams } from '../hooks/useDateParams'
import { useEntries } from '../hooks/useEntries'
import { useTypes } from '../hooks/TypesContext'
import { MONTH_NAMES, addDays, dayPath, formatLongDate, formatWeekday, isoDate, monthPath, todayISO, type DayParts } from '../lib/dates'
import { sceneFor } from '../lib/scenes'
import EntryForm from '../components/EntryForm'
import Deer from '../components/Deer'
import TypeBadge from '../components/TypeBadge'

export default function DayRoute() {
  const params = useDateParams()
  if (!params) return <Navigate to="/" replace />
  // `key` tells React "this is a different day", so moving to the next day
  // starts fresh (any half-filled form is cleared).
  const date = isoDate(params.year, params.month, params.day)
  return <DayView key={date} day={params} />
}

function DayView({ day }: { day: DayParts }) {
  const date = isoDate(day.year, day.month, day.day)
  const { entries, loading, error, reload } = useEntries(date, date)
  const { typeById } = useTypes()
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  async function handleDelete(entry: Entry) {
    if (!window.confirm('Delete this entry?')) return
    try {
      await deleteEntry(entry.id)
      reload()
    } catch (err) {
      window.alert((err as Error).message)
    }
  }

  return (
    <section>
      <p className="breadcrumb">
        <Link to={monthPath(day.year, day.month)}>‹ {MONTH_NAMES[day.month - 1]} {day.year}</Link>
      </p>
      <header className="view-header">
        <Link to={dayPath(addDays(day, -1))} className="nav-arrow" aria-label="Previous day">‹</Link>
        {/* Two lines: a small weekday above the big date (the year is in the link above) */}
        <h1 className="day-title" aria-label={formatLongDate(day)}>
          <small>{formatWeekday(day)}</small>
          {MONTH_NAMES[day.month - 1]} {day.day}
        </h1>
        <Link to={dayPath(addDays(day, 1))} className="nav-arrow" aria-label="Next day">›</Link>
      </header>

      <div className="paper day-paper">
        {/* A strip of this month's scene, torn along the bottom like a
            scrap of a calendar page */}
        <img src={sceneFor(day.month)} alt="" className="day-band torn-bottom" />
        {error && <p className="error">{error}</p>}
        {loading && entries.length === 0 && <p className="muted">Loading…</p>}
        {!loading && entries.length === 0 && !adding && (
          // Today: a curious deer waiting. Other days: a sleeping one.
          date === todayISO() ? (
            <div className="empty">
              <Deer pose="peeking" width={130} />
              <p>Nothing logged today.</p>
            </div>
          ) : (
            <div className="empty">
              <Deer pose="sleeping" width={170} />
              <p>A quiet day. Nothing logged.</p>
            </div>
          )
        )}

        {entries.length > 0 && <ul className="entry-list">
          {entries.map((entry) => {
            const type = typeById(entry.type_id)
            if (editingId === entry.id) {
              return (
                <li key={entry.id}>
                  <EntryForm date={date} entry={entry}
                    onDone={() => { setEditingId(null); reload() }}
                    onCancel={() => setEditingId(null)} />
                </li>
              )
            }
            // Only show the details you actually filled in, joined by " · ".
            const details = [entry.time_of_day, entry.intensity].filter(Boolean).join(' · ')
            return (
              <li key={entry.id} className="entry">
                <div>
                  {type ? <TypeBadge type={type} /> : <span className="muted">Unknown type</span>}
                  {details && <span className="details">{details}</span>}
                  {entry.note && <p className="note">{entry.note}</p>}
                </div>
                <div className="entry-actions">
                  <button className="link" onClick={() => { setEditingId(entry.id); setAdding(false) }}>Edit</button>
                  <button className="link danger" onClick={() => handleDelete(entry)}>Delete</button>
                </div>
              </li>
            )
          })}
        </ul>}

        {adding ? (
          <EntryForm date={date}
            onDone={() => { setAdding(false); reload() }}
            onCancel={() => setAdding(false)} />
        ) : (
          <button className="add-button" onClick={() => { setAdding(true); setEditingId(null) }}>+ Add an entry</button>
        )}
      </div>
    </section>
  )
}
