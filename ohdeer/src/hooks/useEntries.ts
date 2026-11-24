// A "custom hook": a reusable bundle of state + loading logic.
// Usage: const { entries, loading, error, reload } = useEntries('2026-01-01', '2026-12-31')
import { useCallback, useEffect, useState } from 'react'
import { listEntries, type Entry } from '../data'

export function useEntries(fromDate: string, toDate: string) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  // Bumping this number makes the effect below run again (= reload).
  const [version, setVersion] = useState(0)

  useEffect(() => {
    // If you navigate away before the data arrives, `cancelled` stops us from
    // showing old data on the new screen.
    let cancelled = false
    setLoading(true)
    listEntries(fromDate, toDate)
      .then((data) => { if (!cancelled) { setEntries(data); setError('') } })
      .catch((err) => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [fromDate, toDate, version])

  const reload = useCallback(() => setVersion((v) => v + 1), [])
  return { entries, loading, error, reload }
}
