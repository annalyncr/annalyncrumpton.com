// The single Supabase connection for the whole app.
// Only files inside src/data/ should import this. The rest of the app
// uses the friendly functions in auth.ts, occurrenceTypes.ts and entries.ts.
import { createClient } from '@supabase/supabase-js'

// Vite reads these from the .env file (locally) or from Vercel's
// Environment Variables (online). Only names starting with VITE_ are exposed.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

/** True when the .env values are missing, so the UI can show a helpful message. */
export const isConfigured = Boolean(url && key)

export const supabase = createClient(
  url ?? 'https://missing.supabase.co',
  key ?? 'missing-key',
)
