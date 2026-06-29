export type Role = 'owner' | 'admin' | 'manager' | 'staff'

export type EventStatus = 'draft' | 'published' | 'live' | 'completed' | 'cancelled'

export type ShiftStatus = 'scheduled' | 'clocked_in' | 'on_break' | 'clocked_out'

export type TicketStatus = 'valid' | 'checked_in' | 'refunded' | 'cancelled'

export type EquipmentChangeType = 'checkout' | 'checkin' | 'sold' | 'restock' | 'adjustment'

export interface Organization {
  id: string
  name: string
  slug: string
  logo_url: string | null
  banner_url: string | null
  primary_color: string | null
  secondary_color: string | null
  theme: string | null
  tagline: string | null
  description: string | null
  website: string | null
  instagram_handle: string | null
  created_at: string
}

export interface Profile {
  id: string
  organization_id: string | null
  full_name: string | null
  role: Role
  phone: string | null
  created_at: string
}

export interface Venue {
  id: string
  organization_id: string
  name: string
  address: string | null
  capacity: number | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  notes: string | null
  created_at: string
}

export interface EventRecord {
  id: string
  organization_id: string
  venue_id: string | null
  name: string
  description: string | null
  start_time: string
  end_time: string | null
  status: EventStatus
  slug: string | null
  created_at: string
}

export interface Staff {
  id: string
  organization_id: string
  profile_id: string | null
  full_name: string
  role_title: string | null
  phone: string | null
  created_at: string
}

export interface Shift {
  id: string
  event_id: string
  staff_id: string
  clock_in: string | null
  clock_out: string | null
  status: ShiftStatus
  created_at: string
}

export interface Equipment {
  id: string
  organization_id: string
  name: string
  category: string | null
  unit: string
  quantity_total: number
  quantity_available: number
  low_stock_threshold: number
  created_at: string
}

export interface EquipmentLog {
  id: string
  equipment_id: string
  event_id: string | null
  change_type: EquipmentChangeType
  quantity: number
  logged_by: string | null
  notes: string | null
  created_at: string
}

export interface Customer {
  id: string
  organization_id: string
  full_name: string | null
  email: string | null
  phone: string | null
  source: string | null
  created_at: string
}

export interface TicketType {
  id: string
  event_id: string
  name: string
  price: number
  quantity_total: number | null
  quantity_sold: number
  created_at: string
}

export interface Ticket {
  id: string
  ticket_type_id: string
  customer_id: string | null
  status: TicketStatus
  checked_in_at: string | null
  buyer_name: string | null
  buyer_email: string | null
  stripe_session_id: string | null
  amount_paid: number | null
  created_at: string
}

export interface EventCost {
  id: string
  event_id: string
  description: string
  amount: number
  category: string | null
  created_at: string
}

export type NotificationType = 'low_stock' | 'ticket_sale' | 'crew_late' | 'event_live' | 'milestone'

export interface AppNotification {
  id: string
  organization_id: string
  type: NotificationType
  title: string
  body: string | null
  entity_id: string | null
  entity_type: string | null
  read: boolean
  created_at: string
}

export interface Invite {
  id: string
  organization_id: string
  email: string
  role: Role
  invited_by: string | null
  accepted: boolean
  created_at: string
}
