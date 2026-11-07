import type { Reminder } from '@/types/reminder'

// British formats used everywhere in the app:
// dates 14/11/2026, times 24 h, amounts 1,200.00

const LOCALE = 'en-GB'

// 'YYYY-MM-DD' (a DATE column) must not go through new Date(string):
// that parses it as UTC and can shift the day. We build it from its parts.
function parseDateOnly(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

function toDate(value: string | Date): Date | null {
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value
  const dateOnly = parseDateOnly(value)
  if (dateOnly) return dateOnly
  const parsed = new Date(value)
  return isNaN(parsed.getTime()) ? null : parsed
}

/** 14/11/2026 */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '-'
  const date = toDate(value)
  if (!date) return '-'
  return new Intl.DateTimeFormat(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

/** 18:05 (24 h). Accepts a timestamp or a 'HH:MM[:SS]' time column. */
export function formatTime(value: string | Date | null | undefined): string {
  if (!value) return '-'
  if (typeof value === 'string') {
    const timeOnly = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(value)
    if (timeOnly) return `${timeOnly[1]}:${timeOnly[2]}`
  }
  const date = toDate(value)
  if (!date) return '-'
  return new Intl.DateTimeFormat(LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

/** 14/11/2026 18:05 */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '-'
  return `${formatDate(value)} ${formatTime(value)}`
}

/** 1,200.00 */
export function formatAmount(value: number): string {
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/** 1,200.00 USD */
export function formatMoney(value: number, currency: string): string {
  return `${formatAmount(value)} ${currency}`
}

/** The line shown for a reminder in the Reminders list. */
export function describeReminder(reminder: Reminder): string {
  switch (reminder.type) {
    case 'WORK':
      return `Work for ${reminder.client ?? ''} ${reminder.lieu ?? ''} At ${formatDate(reminder.date_prevue)}`
        .replace(/\s+/g, ' ')
        .trim()
    case 'ADD':
      return `Add ${reminder.somme !== null ? formatAmount(reminder.somme) : ''} ${reminder.devise ?? ''} ${reminder.description ?? ''}`
        .replace(/\s+/g, ' ')
        .trim()
    case 'RETRAIT':
      return `Withdraw ${reminder.somme !== null ? formatAmount(reminder.somme) : ''} ${reminder.devise ?? ''}`
        .replace(/\s+/g, ' ')
        .trim()
    case 'OTHER':
      return reminder.titre ?? ''
  }
}