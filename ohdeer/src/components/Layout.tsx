// The frame around every screen: the nav bar on top, the current screen
// below. <Outlet /> is where React Router puts the current screen.
import { Link, NavLink, Outlet } from 'react-router'
import { signOut } from '../data'
import { useTypes } from '../hooks/TypesContext'
import { dayPath, todayParts, yearPath } from '../lib/dates'
import DoodleIcon from './DoodleIcon'

export default function Layout() {
  const today = todayParts()
  const { error } = useTypes()
  return (
    <div className="app">
      <nav className="top-nav">
        <Link to={yearPath(today.year)} className="brand">
          <DoodleIcon icon="deer" /> ohdeer
        </Link>
        <NavLink to={dayPath(today)}>Today</NavLink>
        <NavLink to="/types">Types</NavLink>
        <button className="link" onClick={() => signOut()}>Log out</button>
      </nav>
      {error && <p className="error">Couldn't load your types: {error}</p>}
      <main className="screen">
        <Outlet />
      </main>
    </div>
  )
}
