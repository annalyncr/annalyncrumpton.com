// The numbers on the Stats screen, worked out from your entries.
import type { Entry, OccurrenceType } from '../data'
import { daysBetween } from './dates'

export interface TypeStats {
  type: OccurrenceType
  thisMonth: number      // entries in the current calendar month
  thisYear: number       // entries in the current calendar year
  perMonth: number[]     // 12 numbers: entries per month of the CHOSEN year
  chosenYearTotal: number
  currentStreak: number  // consecutive days up to today (or yesterday)
  longestStreak: number  // best run of consecutive days, ever
  lastDate: string | null
  daysSinceLast: number | null
}

/**
 * @param entries ALL your entries (streaks and "last happened" look at everything)
 * @param year    the year shown in the bar chart
 * @param today   today's date as 'YYYY-MM-DD'
 */
export function computeStats(types: OccurrenceType[], entries: Entry[], year: number, today: string): TypeStats[] {
  const thisMonthPrefix = today.slice(0, 7) // '2026-11'
  const thisYearPrefix = today.slice(0, 4)  // '2026'
  const chosenPrefix = String(year)

  return types.map((type) => {
    const mine = entries.filter((e) => e.type_id === type.id)
    const perMonth = Array(12).fill(0)
    let thisMonth = 0
    let thisYear = 0
    for (const e of mine) {
      if (e.date.startsWith(thisMonthPrefix)) thisMonth++
      if (e.date.startsWith(thisYearPrefix)) thisYear++
      if (e.date.startsWith(chosenPrefix)) perMonth[Number(e.date.slice(5, 7)) - 1]++
    }

    // Streaks count DAYS, so two entries on one day still count as one day.
    // Future-dated entries are ignored for streaks and "last happened".
    const days = [...new Set(mine.map((e) => e.date))].filter((d) => d <= today).sort()
    let longestStreak = 0
    let run = 0
    for (let i = 0; i < days.length; i++) {
      run = i > 0 && daysBetween(days[i - 1], days[i]) === 1 ? run + 1 : 1
      longestStreak = Math.max(longestStreak, run)
    }
    const lastDate = days.length ? days[days.length - 1] : null
    const daysSinceLast = lastDate ? daysBetween(lastDate, today) : null
    // The streak is still "alive" if the last day was today or yesterday.
    const currentStreak = daysSinceLast !== null && daysSinceLast <= 1 ? run : 0

    return {
      type, thisMonth, thisYear, perMonth,
      chosenYearTotal: perMonth.reduce((a, b) => a + b, 0),
      currentStreak, longestStreak, lastDate, daysSinceLast,
    }
  })
}

/** 0 → 'today', 1 → 'yesterday', 5 → '5 days ago' */
export function agoText(days: number | null): string {
  if (days === null) return 'never'
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  return `${days} days ago`
}
