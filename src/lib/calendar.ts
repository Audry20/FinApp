import type { Reminder, ReminderStatus } from '@/types/reminder'

export interface CalendarMonth {
  year: number
  month: number // 0 = January ... 11 = December
}

const FIRST_MONTH: CalendarMonth = { year: 2026, month: 9 } // October 2026
const MONTHS_SHOWN = 4

const toIndex = (m: CalendarMonth) => m.year * 12 + m.month
const fromIndex = (i: number): CalendarMonth => ({
  year: Math.floor(i / 12),
  month: i % 12,
})

/** The 4 months to display for a given "today". */
export function getVisibleMonths(today: Date = new Date()): CalendarMonth[] {
  const current = toIndex({ year: today.getFullYear(), month: today.getMonth() })
  const start = Math.max(current - 2, toIndex(FIRST_MONTH))
  return Array.from({ length: MONTHS_SHOWN }, (_, i) => fromIndex(start + i))
}

/** 'YYYY-MM-DD' key of a local date. */
export function toDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** "November 2026" */
export function formatMonthTitle({ year, month }: CalendarMonth): string {
  return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(
    new Date(year, month, 1)
  )
}

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/**
 * Weeks of a month, starting on Monday (British usage).
 * Each cell is a 'YYYY-MM-DD' key, or null for an empty cell.
 */
export function buildMonthGrid({ year, month }: CalendarMonth): (string | null)[][] {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const offset = (new Date(year, month, 1).getDay() + 6) % 7 // Monday = 0

  const cells: (string | null)[] = [
    ...Array<null>(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => toDateKey(new Date(year, month, i + 1))),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks: (string | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

/** Yellow (PENDING) while one reminder of the day is not done, green when all are DONE. */
export function getDayStatus(statuses: ReminderStatus[]): ReminderStatus | null {
  if (statuses.length === 0) return null
  return statuses.some((s) => s === 'PENDING') ? 'PENDING' : 'DONE'
}

/** Map 'YYYY-MM-DD' -> status of the day, from WORK and ADD reminders only. */
export function buildDayStatusMap(reminders: Reminder[]): Map<string, ReminderStatus> {
  const byDay = new Map<string, ReminderStatus[]>()
  for (const r of reminders) {
    if ((r.type !== 'WORK' && r.type !== 'ADD') || !r.date_prevue) continue
    const list = byDay.get(r.date_prevue) ?? []
    list.push(r.statut)
    byDay.set(r.date_prevue, list)
  }
  const result = new Map<string, ReminderStatus>()
  for (const [day, statuses] of byDay) {
    const status = getDayStatus(statuses)
    if (status) result.set(day, status)
  }
  return result
}