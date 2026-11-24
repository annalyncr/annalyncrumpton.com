import { useState, type FormEvent } from 'react'
import { signIn } from './data'

// Email + password login. The autoComplete hints let iPhone's Passwords /
// Face ID offer to save and fill in your login.
export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault() // stop the browser from reloading the page
    setBusy(true)
    setError('')
    try {
      await signIn(email.trim(), password)
      // Nothing else to do: App hears the login and switches screens.
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <main className="card">
      <h1>ohdeer</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" required autoComplete="username"
          value={email} onChange={(e) => setEmail(e.target.value)} />
        <label htmlFor="password">Password</label>
        <input id="password" type="password" required autoComplete="current-password"
          value={password} onChange={(e) => setPassword(e.target.value)} />
        <button disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
      </form>
      {error && <p className="error">{error}</p>}
    </main>
  )
}
