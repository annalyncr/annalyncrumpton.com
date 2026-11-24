// Manage your occurrence types: create, edit, archive, unarchive.
// Archiving hides a type from the "What happened?" picker but keeps all its
// past entries. (Types can't be deleted, so history never breaks.)
import { useState } from 'react'
import { archiveType, unarchiveType, type OccurrenceType } from '../data'
import { useTypes } from '../hooks/TypesContext'
import TypeBadge from '../components/TypeBadge'
import TypeForm from '../components/TypeForm'

export default function TypesView() {
  const { types, loading, reload } = useTypes()
  // Which form is open: a type's id, 'new', or null for none.
  const [editing, setEditing] = useState<string | null>(null)

  const active = types.filter((t) => !t.archived)
  const archived = types.filter((t) => t.archived)

  async function toggleArchive(type: OccurrenceType) {
    try {
      if (type.archived) await unarchiveType(type.id)
      else await archiveType(type.id)
      await reload()
    } catch (err) {
      window.alert((err as Error).message)
    }
  }

  async function handleSaved() {
    await reload()
    setEditing(null)
  }

  function renderRow(type: OccurrenceType) {
    if (editing === type.id) {
      return (
        <li key={type.id}>
          <TypeForm type={type} onSaved={handleSaved} onCancel={() => setEditing(null)} />
        </li>
      )
    }
    return (
      <li key={type.id} className="type-row">
        <TypeBadge type={type} />
        <div className="entry-actions">
          <button className="link" onClick={() => setEditing(type.id)}>Edit</button>
          <button className="link" onClick={() => toggleArchive(type)}>
            {type.archived ? 'Unarchive' : 'Archive'}
          </button>
        </div>
      </li>
    )
  }

  return (
    <section>
      <header className="view-header"><h1>Your types</h1></header>
      <div className="paper">
        {loading && <p className="muted">Loading…</p>}
        {!loading && active.length === 0 && (
          <p className="empty">No types yet. Make your first one!</p>
        )}
        <ul className="type-list">{active.map(renderRow)}</ul>

        {editing === 'new' ? (
          <TypeForm onSaved={handleSaved} onCancel={() => setEditing(null)} />
        ) : (
          <button onClick={() => setEditing('new')}>+ New type</button>
        )}

        {archived.length > 0 && (
          <>
            <h2>Archived</h2>
            <ul className="type-list archived">{archived.map(renderRow)}</ul>
          </>
        )}
      </div>
    </section>
  )
}
