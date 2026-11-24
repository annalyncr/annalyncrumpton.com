// Reading and changing your logged entries.
import { supabase } from './client'
import type { Entry, NewEntry } from './models'

// Supabase sends at most 1000 rows per request, so we ask in pages.
const PAGE_SIZE = 1000

/** Entries between two dates, inclusive. Dates are 'YYYY-MM-DD' strings. */
export async function listEntries(fromDate: string, toDate: string): Promise<Entry[]> {
  const all: Entry[] = []
  for (let start = 0; ; start += PAGE_SIZE) {
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .gte('date', fromDate)
      .lte('date', toDate)
      .order('date')
      .order('created_at')
      .order('id') // a tie-breaker so pages never overlap
      .range(start, start + PAGE_SIZE - 1)
    if (error) throw error
    all.push(...data)
    if (data.length < PAGE_SIZE) return all // last page reached
  }
}

export const listEntriesForDay = (date: string) => listEntries(date, date)

export async function createEntry(entry: NewEntry): Promise<Entry> {
  const { data, error } = await supabase.from('entries').insert(entry).select().single()
  if (error) throw error
  return data
}

export async function updateEntry(id: string, changes: Partial<NewEntry>): Promise<Entry> {
  const { data, error } = await supabase
    .from('entries').update(changes).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteEntry(id: string): Promise<void> {
  const { error } = await supabase.from('entries').delete().eq('id', id)
  if (error) throw error
}
