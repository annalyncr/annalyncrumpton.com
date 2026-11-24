// A full calendar grid for one month. Each day shows the icons of the types
// logged that day. Tap a day to open it.
import { useMemo } from 'react'
import { Link, Navigate } from 'react-router'
import { useDateParams } from '../hooks/useDateParams'
import { useEntries } from '../hooks/useEntries'
import { useTypes } from '../hooks/TypesContext'
import {
  MONTH_NAMES, WEEKDAY_LETTERS, addMonths, dayPath, daysInMonth, isoDate,
  monthCells, monthPath, todayISO, yearPath,
} from '../lib/dates'
import { uniqueTypesByDate } from '../lib/entryUtils'
import { sceneFor } from '../lib/scenes'
import TypeBadge from '../components/TypeBadge'

const MAX_ICONS = 3

export default function MonthRoute() {
  const params = useDateParams()
  if (!params) return <Navigate to="/" replace />
  return <MonthView year={params.year} month={params.month} />
}

function MonthView({ year, month }: { year: number; month: number }) {
  const { entries, loading, error } = useEntries(
    isoDate(year, month, 1),
    isoDate(year, month, daysInMonth(year, month)),
  )
  const { typeById } = useTypes()
  const typesByDate = useMemo(() => uniqueTypesByDate(entries), [entries])
  const prev = addMonths(year, month, -1)
  const next = addMonths(year, month, 1)
  const today = todayISO()
  const scene = sceneFor(month)

  return (
    <section className="month-view">
      {/* The illustrated landscape, full width, with the month name over the sky */}
      <div className="scene torn-bottom">
        {scene && <img src={scene} alt="" className="scene-img" />}
        <div className="scene-inner">
          <p className="breadcrumb"><Link to={yearPath(year)}>‹ {year}</Link></p>
          <header className="view-header scene-header">
            <Link to={monthPath(prev.year, prev.month)} className="nav-arrow" aria-label="Previous month">‹</Link>
            <h1>{MONTH_NAMES[month - 1]} <span className="scene-year">{year}</span></h1>
            <Link to={monthPath(next.year, next.month)} className="nav-arrow" aria-label="Next month">›</Link>
          </header>
        </div>
      </div>
      {error && <p className="error">{error}</p>}

      {/* The calendar sheet, below the scene */}
      <div className={loading ? 'month-grid month-sheet is-loading' : 'month-grid month-sheet'}>
        {WEEKDAY_LETTERS.map((letter, i) => (
          <span key={`w${i}`} className="weekday">{letter}</span>
        ))}
        {monthCells(year, month).map((day, i) => {
          if (day === null) return <span key={i} />
          const date = isoDate(year, month, day)
          const typeIds = typesByDate.get(date) ?? []
          return (
            <Link key={i} to={dayPath({ year, month, day })}
              className={date === today ? 'month-day today' : 'month-day'}>
              <span className="day-number">{day}</span>
              <span className="day-icons">
                {typeIds.slice(0, MAX_ICONS).map((id) => {
                  const type = typeById(id)
                  return type ? <TypeBadge key={id} type={type} iconOnly /> : null
                })}
                {typeIds.length > MAX_ICONS && <span className="more">+{typeIds.length - MAX_ICONS}</span>}
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
