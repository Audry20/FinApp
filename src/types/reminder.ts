export type Currency = 'USD' | 'EUR' | 'GBP' | 'TRY'
export const CURRENCIES: Currency[] = ['USD', 'EUR', 'GBP', 'TRY']

export type ReminderType = 'WORK' | 'ADD' | 'RETRAIT' | 'OTHER'
export type ReminderStatus = 'PENDING' | 'DONE'

export interface Reminder {
  id: string
  user_id: string
  type: ReminderType
  statut: ReminderStatus

  // OTHER only
  titre: string | null
  // ADD (source), RETRAIT (reason), OTHER (description)
  description: string | null

  // WORK only
  lieu: string | null
  client: string | null
  heure_travail: string | null // optional, 'HH:MM:SS'

  // WORK (date of the work) and ADD (expected date), 'YYYY-MM-DD'
  date_prevue: string | null

  // ADD and RETRAIT: expected amount
  somme: number | null
  devise: Currency | null

  // RETRAIT only, 'YYYY-MM-DD'
  date_limite: string | null

  created_at: string // set by the database when the reminder is configured
  completed_at: string | null // set by the database when it is confirmed
  transaction_id: string | null // empty while PENDING, and always empty for OTHER
}

// Label shown on the badge, per type and per status.
export const STATUS_LABELS: Record<ReminderType, Record<ReminderStatus, string>> = {
  WORK: { PENDING: 'Not paid', DONE: 'Paid' },
  ADD: { PENDING: 'Not paid', DONE: 'Paid' },
  RETRAIT: { PENDING: 'Pending', DONE: 'Withdrawn' },
  OTHER: { PENDING: 'Pending', DONE: 'Done' },
}

// Label of the confirmation button, per type.
export const CONFIRM_LABELS: Record<ReminderType, string> = {
  WORK: 'Get Paid',
  ADD: 'Add',
  RETRAIT: 'Withdraw',
  OTHER: 'Confirm',
}