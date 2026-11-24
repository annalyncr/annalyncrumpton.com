import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getSession, isConfigured, onAuthChange, signOut } from './data'
import Login from './Login'

// App decides what to show: a setup message, the login screen, or the app.
export default function App() {
  // "State" = values React remembers and re-draws the screen for when they change.
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // useEffect runs once when the app starts: check if we're already logged in,
  // then keep listening for log-ins / log-outs.
  useEffect(() => {
    getSession().then((s) => {
      setSession(s)
      setLoading(false)
    })
    return onAuthChange(setSession)
  }, [])

  if (!isConfigured) {
    return (
      <main className="card">
        <h1>ohdeer</h1>
        <p>Almost there: add your Supabase keys to a <code>.env</code> file (see <code>.env.example</code>), then restart <code>npm run dev</code>.</p>
      </main>
    )
  }

  if (loading) return <main className="card"><p>Loading…</p></main>
  if (!session) return <Login />

  return (
    <main className="card">
      <h1>hello from ohdeer 🦌</h1>
      <p>You're logged in as <strong>{session.user.email}</strong>.</p>
      <button onClick={() => signOut()}>Log out</button>
    </main>
  )
}
