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

  return (
    <section>
      <p className="breadcrumb"><Link to={yearPath(year)}>‹ {year}</Link></p>
      <header className="view-header">
        <Link to={monthPath(prev.year, prev.month)} className="nav-arrow" aria-label="Previous month">‹</Link>
        <h1>{MONTH_NAMES[month - 1]} {year}</h1>
        <Link to={monthPath(next.year, next.month)} className="nav-arrow" aria-label="Next month">›</Link>
      </header>
      {error && <p className="error">{error}</p>}

      <div className={loading ? 'month-grid is-loading' : 'month-grid'}>
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
