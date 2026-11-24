// TypeScript "types" describe the shape of our data, so the editor can warn
// us if we misspell a field or pass the wrong kind of value.
// These mirror the tables in supabase/migrations/001_tables_and_rls.sql.

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night'
export type Intensity = 'light' | 'moderate' | 'heavy'

export const TIMES_OF_DAY: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'night']
export const INTENSITIES: Intensity[] = ['light', 'moderate', 'heavy']

export interface OccurrenceType {
  id: string
  user_id: string
  label: string
  icon: string   // doodle icon key, e.g. 'cloud-rain'
  color: string  // palette color key, e.g. 'teal'
  archived: boolean
  created_at: string
}

export interface Entry {
  id: string
  user_id: string
  date: string   // 'YYYY-MM-DD' (a plain calendar day, no time zone)
  type_id: string
  time_of_day: TimeOfDay | null
  intensity: Intensity | null
  note: string | null
  created_at: string
}

// What you provide when creating something. The database fills in
// id, user_id and created_at by itself.
export type NewOccurrenceType = Pick<OccurrenceType, 'label' | 'icon' | 'color'>
export type NewEntry = Pick<Entry, 'date' | 'type_id'> &
  Partial<Pick<Entry, 'time_of_day' | 'intensity' | 'note'>>
