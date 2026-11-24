// Backups: export everything to one JSON file, and import it back.
//
// Importing MERGES and never deletes: anything already in your database is
// left untouched; only items missing from it are added. Every type and entry
// keeps its original id, so importing the same file twice adds nothing.
import { supabase } from './client'
import { listTypes } from './occurrenceTypes'
import { listEntries } from './entries'
import { INTENSITIES, TIMES_OF_DAY, type Entry, type OccurrenceType } from './models'

export interface Backup {
  app: 'ohdeer'
  version: 1
  exported_at: string
  types: OccurrenceType[]
  entries: Entry[]
}

export async function exportAll(): Promise<Backup> {
  const [types, entries] = await Promise.all([
    listTypes(true),
    listEntries('0001-01-01', '9999-12-31'), // "all dates"
  ])
  return { app: 'ohdeer', version: 1, exported_at: new Date().toISOString(), types, entries }
}

/** Reads a backup file's text and checks it really is an ohdeer backup. */
export function parseBackup(text: string): Backup {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error("That file isn't valid JSON.")
  }
  const b = data as Partial<Backup>
  if (b?.app !== 'ohdeer' || !Array.isArray(b.types) || !Array.isArray(b.entries)) {
    throw new Error("That doesn't look like an ohdeer backup file.")
  }
  const isDate = (s: unknown) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s)
  for (const t of b.types) {
    if (typeof t?.id !== 'string' || typeof t.label !== 'string') throw new Error('A type in the backup is missing its id or label.')
  }
  for (const e of b.entries) {
    if (typeof e?.id !== 'string' || typeof e.type_id !== 'string' || !isDate(e.date)) {
      throw new Error('An entry in the backup is missing its id, type, or date.')
    }
  }
  return b as Backup
}

const BATCH = 500

/** Adds whatever is missing. Returns how many types and entries were new. */
export async function importBackup(backup: Backup): Promise<{ types: number; entries: number }> {
  // Only copy known fields. user_id is left out on purpose: the database
  // fills in YOUR id, so a backup can never write rows for someone else.
  const types = backup.types.map((t) => ({
    id: t.id,
    label: t.label.slice(0, 60),
    icon: t.icon ?? 'leaf',
    color: t.color ?? 'moss',
    archived: Boolean(t.archived),
    created_at: t.created_at,
  }))
  const entries = backup.entries.map((e) => ({
    id: e.id,
    date: e.date,
    type_id: e.type_id,
    time_of_day: TIMES_OF_DAY.includes(e.time_of_day as never) ? e.time_of_day : null,
    intensity: INTENSITIES.includes(e.intensity as never) ? e.intensity : null,
    note: e.note ? String(e.note).slice(0, 2000) : null,
    created_at: e.created_at,
  }))

  let addedTypes = 0
  let addedEntries = 0
  // Types first, because entries point at them.
  for (let i = 0; i < types.length; i += BATCH) {
    const { data, error } = await supabase
      .from('occurrence_types')
      // ignoreDuplicates = "if this id already exists, skip it" (never overwrite)
      .upsert(types.slice(i, i + BATCH), { onConflict: 'id', ignoreDuplicates: true })
      .select('id')
    if (error) throw error
    addedTypes += data.length
  }
  for (let i = 0; i < entries.length; i += BATCH) {
    const { data, error } = await supabase
      .from('entries')
      .upsert(entries.slice(i, i + BATCH), { onConflict: 'id', ignoreDuplicates: true })
      .select('id')
    if (error) throw error
    addedEntries += data.length
  }
  return { types: addedTypes, entries: addedEntries }
}
