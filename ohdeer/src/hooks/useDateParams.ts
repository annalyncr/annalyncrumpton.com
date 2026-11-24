// Reads the year/month/day out of the web address (e.g. /2026/11/24) and
// checks they make sense. Returns null for nonsense like /2026/13 or /hello.
import { useParams } from 'react-router'
import { daysInMonth, type DayParts } from '../lib/dates'

export function useDateParams(): DayParts | null {
  const params = useParams()
  const year = Number(params.year)
  const month = params.month ? Number(params.month) : 1
  const day = params.day ? Number(params.day) : 1

  const ok =
    Number.isInteger(year) && year >= 1900 && year <= 2200 &&
    Number.isInteger(month) && month >= 1 && month <= 12 &&
    Number.isInteger(day) && day >= 1 && day <= daysInMonth(year, month)

  return ok ? { year, month, day } : null
}
