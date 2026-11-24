import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import type { Session } from '@supabase/supabase-js'
import { getSession, isConfigured, onAuthChange } from './data'
import { TypesProvider } from './hooks/TypesContext'
import { todayParts, yearPath } from './lib/dates'
import Layout from './components/Layout'
import Login from './Login'
import YearView from './views/YearView'
import MonthView from './views/MonthView'
import DayView from './views/DayView'
import TypesView from './views/TypesView'

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

  // The screens and their web addresses. ":year" etc. are placeholders,
  // so "/2026/11/24" opens the day view for November 24, 2026.
  return (
    <BrowserRouter>
      <TypesProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Navigate to={yearPath(todayParts().year)} replace />} />
            <Route path="types" element={<TypesView />} />
            <Route path=":year" element={<YearView />} />
            <Route path=":year/:month" element={<MonthView />} />
            <Route path=":year/:month/:day" element={<DayView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </TypesProvider>
    </BrowserRouter>
  )
}
