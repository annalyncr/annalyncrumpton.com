// The "More" page: your types, backups, and logging out.
import { signOut } from '../data'
import BackupPanel from '../components/BackupPanel'
import TypesView from './TypesView'

export default function MoreView() {
  return (
    <>
      <TypesView />
      <BackupPanel />
      <section className="more-section">
        <div className="paper">
          <h2 className="squiggle-heading">Account</h2>
          <button className="secondary" onClick={() => signOut()}>Log out</button>
        </div>
      </section>
    </>
  )
}
