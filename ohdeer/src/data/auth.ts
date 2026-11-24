// Logging in and out with email + password.
// There is deliberately no "sign up" function: your one account is created
// in the Supabase dashboard, and public sign-ups are switched off there.
import type { Session } from '@supabase/supabase-js'
import { supabase } from './client'

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession()
  return data.session
}

/** Calls `callback` whenever you log in or out. Returns a function to stop listening. */
export function onAuthChange(callback: (session: Session | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session))
  return () => data.subscription.unsubscribe()
}
