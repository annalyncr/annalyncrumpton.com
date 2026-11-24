import type { Entry } from '../data'

/**
 * For each date, the list of DIFFERENT type ids logged that day, in the order
 * they were logged. (Two rain storms on one day → one rain dot.)
 */
export function uniqueTypesByDate(entries: Entry[]): Map<string, string[]> {
  const map = new Map<string, string[]>()
  for (const entry of entries) {
    const list = map.get(entry.date) ?? []
    if (!list.includes(entry.type_id)) list.push(entry.type_id)
    map.set(entry.date, list)
  }
  return map
}
