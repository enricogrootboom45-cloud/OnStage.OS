import { useState, useRef } from 'react'
import { Bell, PackageX, Ticket, PartyPopper, AlarmClock, Radio } from 'lucide-react'
import { clsx } from '../utils'
import type { AppNotification, NotificationType } from '../types'

const ICON: Record<NotificationType, typeof Bell> = {
  low_stock: PackageX,
  ticket_sale: Ticket,
  milestone: PartyPopper,
  crew_late: AlarmClock,
  event_live: Radio,
}

export function NotificationBell() {
  const [items] = useState<AppNotification[]>([])
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg bg-riser p-2 text-cuesheet hover:text-white"
      >
        <Bell size={18} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-graphite-line bg-blackout p-4 shadow-riser z-50">
          <h4 className="text-xs font-bold uppercase tracking-wider text-cuesheet mb-3">Notifications</h4>
          <div className="flex flex-col gap-2">
            {items.length === 0 ? (
              <p className="text-xs text-cuesheet/60">No new alerts right now.</p>
            ) : (
              items.map((n) => {
                const NIcon = ICON[n.type] || Bell
                return (
                  <div key={n.id} className="flex items-start gap-2.5 rounded-lg bg-riser p-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blackout text-amber">
                      <NIcon size={13} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-white">{n.title}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}