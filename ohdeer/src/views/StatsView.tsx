// Stats for each type: counts, a per-month bar chart for the chosen year,
// streaks, and when it last happened.
import { useMemo } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { useEntries } from '../hooks/useEntries'
import { useTypes } from '../hooks/TypesContext'
import { statsPath, todayISO, todayParts } from '../lib/dates'
import { agoText, computeStats } from '../lib/stats'
import { typeColor } from '../lib/palette'
import Deer from '../components/Deer'
import MonthBars from '../components/MonthBars'
import TypeBadge from '../components/TypeBadge'

// /stats shows this year; /stats/2025 shows 2025.
export default function StatsRoute() {
  const { year: yearParam } = useParams()
  const year = yearParam === undefined ? todayParts().year : Number(yearParam)
  if (!Number.isInteger(year) || year < 1900 || year > 2200) return <Navigate to="/stats" replace />
  return <StatsView year={year} />
}

function StatsView({ year }: { year: number }) {
  // Streaks and "last happened" need ALL entries, not just this year's.
  const { entries, loading, error } = useEntries('0001-01-01', '9999-12-31')
  const { types } = useTypes()
  const today = todayISO()
  const current = todayParts()

  const stats = useMemo(() => {
    const all = computeStats(types, entries, year, today)
    // Show active types, plus archived ones that have entries in this year.
    return all
      .filter((s) => !s.type.archived || s.chosenYearTotal > 0)
      .sort((a, b) => b.chosenYearTotal - a.chosenYearTotal || a.type.label.localeCompare(b.type.label))
  }, [types, entries, year, today])

  return (
    <section>
      <header className="view-header">
        <Link to={statsPath(year - 1)} className="nav-arrow" aria-label="Previous year">‹</Link>
        <h1>Stats <span className="scene-year">{year}</span></h1>
        <Link to={statsPath(year + 1)} className="nav-arrow" aria-label="Next year">›</Link>
      </header>
      <p className="stats-note">Month and Year count this month and this year. Bars show {year}.</p>
      {error && <p className="error">{error}</p>}

      {!loading && stats.length === 0 ? (
        <div className="paper">
          <div className="empty">
            <Deer pose="standing" width={110} />
            <p>Stats appear once you've made a type and logged something.</p>
          </div>
        </div>
      ) : (
        <div className={loading ? 'stats-list is-loading' : 'stats-list'}>
          {stats.map((s) => (
            <article key={s.type.id} className="paper stat-card">
              <header className="stat-card-header">
                <TypeBadge type={s.type} />
                {s.type.archived && <span className="muted">archived</span>}
              </header>

              <dl className="stat-numbers">
                <div><dt>Month</dt><dd>{s.thisMonth}</dd></div>
                <div><dt>Year</dt><dd>{s.thisYear}</dd></div>
                <div><dt>Streak</dt><dd>{s.currentStreak}<small> {s.currentStreak === 1 ? 'day' : 'days'}</small></dd></div>
                <div><dt>Best</dt><dd>{s.longestStreak}<small> {s.longestStreak === 1 ? 'day' : 'days'}</small></dd></div>
              </dl>

              <MonthBars counts={s.perMonth} color={typeColor(s.type.color)}
                highlightMonth={year === current.year ? current.month : undefined} />

              <p className="stat-footer">
                <span>{s.chosenYearTotal} in {year}</span>
                <span>Last happened <strong>{agoText(s.daysSinceLast)}</strong></span>
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
