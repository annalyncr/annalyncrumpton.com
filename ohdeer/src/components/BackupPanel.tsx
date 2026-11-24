// Export all your data to a file, or import a backup file (merge only).
import { useRef, useState, type ChangeEvent } from 'react'
import { exportAll, importBackup, parseBackup, type Backup } from '../data'
import { useTypes } from '../hooks/TypesContext'
import { todayISO } from '../lib/dates'

/** Makes the browser download `text` as a file. */
function downloadFile(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export default function BackupPanel() {
  const { reload: reloadTypes } = useTypes()
  const fileInput = useRef<HTMLInputElement>(null) // a handle on the hidden file picker
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState<Backup | null>(null) // a file waiting for "yes, import"

  async function handleExport() {
    setBusy(true); setError(''); setMessage('')
    try {
      const backup = await exportAll()
      downloadFile(`ohdeer-backup-${todayISO()}.json`, JSON.stringify(backup, null, 2))
      setMessage(`Saved ${backup.types.length} types and ${backup.entries.length} entries.`)
    } catch (err) {
      setError((err as Error).message)
    }
    setBusy(false)
  }

  async function handleFileChosen(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = '' // so choosing the same file again still triggers this
    if (!file) return
    setError(''); setMessage('')
    try {
      setPending(parseBackup(await file.text()))
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function handleConfirmImport() {
    if (!pending) return
    setBusy(true); setError('')
    try {
      const added = await importBackup(pending)
      await reloadTypes()
      setMessage(added.types + added.entries === 0
        ? 'Everything in that file was already here. Nothing to add.'
        : `Added ${added.types} types and ${added.entries} entries.`)
      setPending(null)
    } catch (err) {
      setError((err as Error).message)
    }
    setBusy(false)
  }

  return (
    <section className="more-section">
      <div className="paper">
        <h2 className="squiggle-heading">Backup</h2>
        <p className="muted">Save all your types and entries to a file, or bring a backup file back in.</p>

        <div className="actions">
          <button onClick={handleExport} disabled={busy}>Export backup</button>
          <button className="secondary" onClick={() => fileInput.current?.click()} disabled={busy}>Import backup…</button>
          <input ref={fileInput} type="file" accept=".json,application/json" hidden onChange={handleFileChosen} />
        </div>

        {pending && (
          <div className="panel">
            <p>
              This backup has <strong>{pending.types.length} types</strong> and{' '}
              <strong>{pending.entries.length} entries</strong>
              {pending.exported_at && <> (saved {new Date(pending.exported_at).toLocaleDateString()})</>}.
            </p>
            <p className="muted">Nothing you already have will be changed or deleted. Only items that are missing get added.</p>
            <div className="actions">
              <button onClick={handleConfirmImport} disabled={busy}>{busy ? 'Adding…' : 'Add to my data'}</button>
              <button className="secondary" onClick={() => setPending(null)} disabled={busy}>Cancel</button>
            </div>
          </div>
        )}

        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}
      </div>
    </section>
  )
}
