import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

/** Parse ISO or date-only string for sorting; missing/invalid → 0 */
export function dateTimeSortValue(d: string | undefined | null): number {
  if (d == null) return 0
  const s = String(d).trim()
  if (!s) return 0
  const normalized = DATE_ONLY.test(s) ? `${s}T12:00:00` : s
  const t = Date.parse(normalized)
  return Number.isNaN(t) ? 0 : t
}

/** Latest timestamp among optional date fields (row sort key). */
export function latestOfDates(...dates: (string | undefined | null)[]): number {
  let m = 0
  for (const d of dates) {
    const t = dateTimeSortValue(d)
    if (t > m) m = t
  }
  return m
}

/** Newest-first; optional id tie-break (descending lexicographic). */
export function sortLatestFirst<T>(
  rows: readonly T[],
  getSortTime: (row: T) => number,
  tieBreakDescendingId?: (row: T) => string
): T[] {
  return [...rows].sort((a, b) => {
    const tb = getSortTime(b)
    const ta = getSortTime(a)
    if (tb !== ta) return tb - ta
    if (tieBreakDescendingId) {
      return tieBreakDescendingId(b).localeCompare(tieBreakDescendingId(a))
    }
    return 0
  })
}
