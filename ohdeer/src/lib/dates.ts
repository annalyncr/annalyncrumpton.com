// Date helpers. Months are 1–12 here (like humans count), not 0–11 like
// JavaScript's Date. Dates are stored as 'YYYY-MM-DD' text so time zones
// can never shift an entry onto the wrong day.

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
// Weeks start on Sunday.
export const WEEKDAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export interface DayParts { year: number; month: number; day: number }

const pad = (n: number) => String(n).padStart(2, '0')

/** (2026, 11, 4) → '2026-11-04' */
export function isoDate(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`
}

export function todayParts(): DayParts {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() }
}

export function todayISO(): string {
  const t = todayParts()
  return isoDate(t.year, t.month, t.day)
}

export function daysInMonth(year: number, month: number): number {
  // "Day 0 of next month" is a trick for "the last day of this month".
  return new Date(year, month, 0).getDate()
}

/**
 * The boxes of a calendar grid: some empty boxes (null) before the 1st so it
 * lands under the right weekday, then 1, 2, 3 … up to the last day.
 */
export function monthCells(year: number, month: number): (number | null)[] {
  const firstWeekday = new Date(year, month - 1, 1).getDay() // 0 = Sunday
  const blanks: null[] = Array(firstWeekday).fill(null)
  const days = Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1)
  return [...blanks, ...days]
}

/** Move forward/back by days (handles month and year changes for us). */
export function addDays({ year, month, day }: DayParts, n: number): DayParts {
  const d = new Date(year, month - 1, day + n)
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() }
}

export function addMonths(year: number, month: number, n: number) {
  const d = new Date(year, month - 1 + n, 1)
  return { year: d.getFullYear(), month: d.getMonth() + 1 }
}

/** 'Tuesday, November 24, 2026' */
export function formatLongDate({ year, month, day }: DayParts): string {
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
}

/** 'Tuesday' */
export function formatWeekday({ year, month, day }: DayParts): string {
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { weekday: 'long' })
}

// Web addresses for each screen, kept in one place.
export const yearPath = (year: number) => `/${year}`
export const monthPath = (year: number, month: number) => `/${year}/${month}`
export const dayPath = ({ year, month, day }: DayParts) => `/${year}/${month}/${day}`
