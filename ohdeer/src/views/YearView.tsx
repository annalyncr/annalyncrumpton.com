// 12 mini months. Each day with entries gets a colored dot per type
// (max 3 dots, then "+"). Tap a month to open it.
import { useMemo } from 'react'
import { Link, Navigate } from 'react-router'
import { useDateParams } from '../hooks/useDateParams'
import { useEntries } from '../hooks/useEntries'
import { useTypes } from '../hooks/TypesContext'
import {
  MONTH_NAMES, WEEKDAY_LETTERS, isoDate, monthCells, monthPath, todayISO, yearPath,
} from '../lib/dates'
import { uniqueTypesByDate } from '../lib/entryUtils'
import { typeColor } from '../lib/palette'
import { sceneFor } from '../lib/scenes'

const MAX_DOTS = 3

// This small "route" component checks the address, then hands a clean
// year number to the real screen below.
export default function YearRoute() {
  const params = useDateParams()
  if (!params) return <Navigate to="/" replace />
  return <YearView year={params.year} />
}

function YearView({ year }: { year: number }) {
  const { entries, loading, error } = useEntries(isoDate(year, 1, 1), isoDate(year, 12, 31))
  const { typeById } = useTypes()
  // useMemo: only re-group the entries when they actually change.
  const typesByDate = useMemo(() => uniqueTypesByDate(entries), [entries])
  const today = todayISO()

  return (
    <section>
      <header className="view-header">
        <Link to={yearPath(year - 1)} className="nav-arrow" aria-label="Previous year">‹</Link>
        <h1>{year}</h1>
        <Link to={yearPath(year + 1)} className="nav-arrow" aria-label="Next year">›</Link>
      </header>
      {error && <p className="error">{error}</p>}

      <div className={loading ? 'year-grid is-loading' : 'year-grid'}>
        {MONTH_NAMES.map((name, index) => {
          const month = index + 1
          return (
            <Link key={month} to={monthPath(year, month)} className="mini-month">
              {/* A thin slice of this month's scene, torn along the bottom */}
              <img src={sceneFor(month)} alt="" className="mini-scene torn-bottom" />
              <h2>{name}</h2>
              <div className="mini-grid">
                {WEEKDAY_LETTERS.map((letter, i) => (
                  <span key={`w${i}`} className="weekday">{letter}</span>
                ))}
                {monthCells(year, month).map((day, i) => {
                  if (day === null) return <span key={i} />
                  const date = isoDate(year, month, day)
                  const typeIds = typesByDate.get(date) ?? []
                  return (
                    <span key={i} className={date === today ? 'mini-day today' : 'mini-day'}>
                      {day}
                      {typeIds.length > 0 && (
                        <span className="dots">
                          {typeIds.slice(0, MAX_DOTS).map((id) => (
                            <span key={id} className="dot"
                              style={{ background: typeColor(typeById(id)?.color ?? 'moss') }} />
                          ))}
                          {typeIds.length > MAX_DOTS && <span className="more">+</span>}
                        </span>
                      )}
                    </span>
                  )
                })}
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
