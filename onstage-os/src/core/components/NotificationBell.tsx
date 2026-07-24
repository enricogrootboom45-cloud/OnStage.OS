import { useEffect, useState, useRef } from 'react'
import { Bell, PackageX, Ticket, PartyPopper, AlarmClock, Radio } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../auth/AuthProvider'
import { clsx } from '../utils'
import type { AppNotification, NotificationType } from '../types'

function timeAgo(ts: string) {
  const s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

const ICON: Record<NotificationType, typeof Bell> = {
  low_stock: PackageX,
  ticket_sale: Ticket,
  milestone: PartyPopper,
  crew_late: AlarmClock,
  event_live: Radio,
}

export function NotificationBell() {
  const { organization } = useAuth()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<AppNotification[]>([])
  const panelRef = useRef<HTMLDivElement>(null)

  const unread = items.filter((n) => !n.read).length

  async function load() {
    if (!organization) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('organization_id', organization.id)
      .order('created_at', { ascending: false })
      .limit(30)
    setItems((data as AppNotification[]) || [])
  }

  async function markAllRead() {
    if (!organization) return
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('organization_id', organization.id)
      .eq('read', false)
    setItems((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  useEffect(() => {
    load()
    if (!organization) return

    const channel = supabase
      .channel('notifications-bell')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `organization_id=eq.${organization.id}`,
      }, (payload) => {
        setItems((prev) => [payload.new as AppNotification, ...prev])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [organization]) // eslint-disable-line react-hooks/exhaustive-deps

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => { setOpen((o) => !o); if (!open) load() }}
        aria-label="Notifications"
        className="relative rounded-md border border-graphite-line p-2 text-cuesheet/50 hover:text-cuesheet"
      >
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber text-[9px] font-bold text-blackout">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 rounded-lg border border-graphite-line bg-riser shadow-2xl">
          <div className="flex items-center justify-between border-b border-graphite-line px-4 py-3">
            <p className="font-display text-sm font-medium text-cuesheet">Notifications</p>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-cuesheet/40 hover:text-cuesheet"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-cuesheet/30">
                Nothing yet — alerts for low stock and ticket milestones will appear here.
              </p>
            ) : (
              items.map((n) => {
                const NIcon = ICON[n.type] || Bell
                return (
                <div
                  key={n.id}
                  className={clsx(
                    'border-b border-graphite-line/50 px-4 py-3',
                    !n.read && 'bg-amber/5',
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-riser text-amber/80">
                      <NIcon size={13} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={clsx('text-sm', n.read ? 'text-cuesheet/60' : 'text-cuesheet')}>
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="mt-0.5 text-xs text-cuesheet/40">{n.body}</p>
                      )}
                      <p className="mt-1 font-mono text-[10px] text-cuesheet/25">
                        {timeAgo(n.created_at)}
                      </p>
                    </div>
                    {!n.read && (
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />
                    )}
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