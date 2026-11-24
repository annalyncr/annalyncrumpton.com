// Reading and changing your list of occurrence types.
import { supabase } from './client'
import type { NewOccurrenceType, OccurrenceType } from './models'

/** All your types, oldest first. Pass `true` to include archived ones. */
export async function listTypes(includeArchived = false): Promise<OccurrenceType[]> {
  let query = supabase.from('occurrence_types').select('*').order('created_at')
  if (!includeArchived) query = query.eq('archived', false)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function createType(type: NewOccurrenceType): Promise<OccurrenceType> {
  const { data, error } = await supabase.from('occurrence_types').insert(type).select().single()
  if (error) throw error
  return data
}

export async function updateType(
  id: string,
  changes: Partial<NewOccurrenceType & { archived: boolean }>,
): Promise<OccurrenceType> {
  const { data, error } = await supabase
    .from('occurrence_types').update(changes).eq('id', id).select().single()
  if (error) throw error
  return data
}

export const archiveType = (id: string) => updateType(id, { archived: true })
export const unarchiveType = (id: string) => updateType(id, { archived: false })
