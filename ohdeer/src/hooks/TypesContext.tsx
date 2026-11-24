// Almost every screen needs your list of types, so we load it ONCE here and
// share it. React "context" is a way to hand data to any component inside
// <TypesProvider> without passing it down through every layer by hand.
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { listTypes, type OccurrenceType } from '../data'

interface TypesState {
  types: OccurrenceType[]        // all types, including archived
  activeTypes: OccurrenceType[]  // only the non-archived ones (for pickers)
  typeById: (id: string) => OccurrenceType | undefined
  loading: boolean
  error: string
  reload: () => Promise<void>
}

const TypesContext = createContext<TypesState | null>(null)

export function TypesProvider({ children }: { children: ReactNode }) {
  const [types, setTypes] = useState<OccurrenceType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // useCallback keeps the same `reload` function between re-draws.
  const reload = useCallback(async () => {
    try {
      // Archived types are included so old entries can still show their label.
      setTypes(await listTypes(true))
      setError('')
    } catch (err) {
      setError((err as Error).message)
    }
    setLoading(false)
  }, [])

  useEffect(() => { reload() }, [reload])

  const value: TypesState = {
    types,
    activeTypes: types.filter((t) => !t.archived),
    typeById: (id) => types.find((t) => t.id === id),
    loading,
    error,
    reload,
  }
  return <TypesContext.Provider value={value}>{children}</TypesContext.Provider>
}

/** Use inside any component: const { activeTypes } = useTypes() */
export function useTypes(): TypesState {
  const ctx = useContext(TypesContext)
  if (!ctx) throw new Error('useTypes must be used inside <TypesProvider>')
  return ctx
}
