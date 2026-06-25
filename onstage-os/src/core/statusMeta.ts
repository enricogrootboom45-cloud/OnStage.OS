import type { CueTone } from './components/CueLight'
import type { EventStatus, ShiftStatus, TicketStatus } from './types'

interface StatusMeta {
  tone: CueTone
  label: string
  pulse?: boolean
}

export function eventStatusMeta(status: EventStatus): StatusMeta {
  switch (status) {
    case 'draft':
      return { tone: 'graphite', label: 'Draft' }
    case 'published':
      return { tone: 'wash', label: 'Published' }
    case 'live':
      return { tone: 'amber', label: 'Live now', pulse: true }
    case 'completed':
      return { tone: 'cuesheet', label: 'Completed' }
    case 'cancelled':
      return { tone: 'standby', label: 'Cancelled' }
  }
}

export function shiftStatusMeta(status: ShiftStatus): StatusMeta {
  switch (status) {
    case 'scheduled':
      return { tone: 'graphite', label: 'Scheduled' }
    case 'clocked_in':
      return { tone: 'amber', label: 'Clocked in', pulse: true }
    case 'on_break':
      return { tone: 'wash', label: 'On break' }
    case 'clocked_out':
      return { tone: 'cuesheet', label: 'Clocked out' }
  }
}

export function ticketStatusMeta(status: TicketStatus): StatusMeta {
  switch (status) {
    case 'valid':
      return { tone: 'wash', label: 'Valid' }
    case 'checked_in':
      return { tone: 'amber', label: 'Checked in' }
    case 'refunded':
      return { tone: 'standby', label: 'Refunded' }
    case 'cancelled':
      return { tone: 'standby', label: 'Cancelled' }
  }
}

export function stockMeta(available: number, threshold: number): StatusMeta {
  if (available <= 0) return { tone: 'standby', label: 'Out of stock' }
  if (available <= threshold) return { tone: 'standby', label: 'Low stock' }
  return { tone: 'wash', label: 'In stock' }
}
