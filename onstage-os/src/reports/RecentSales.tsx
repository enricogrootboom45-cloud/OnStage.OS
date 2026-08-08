import { Ticket as TicketIcon, ArrowUpRight } from 'lucide-react'
import { ticketStatusMeta } from '../core/statusMeta'
import { formatMoney } from '../core/utils'
import { TONE_DOT, type RecentTicket } from './dashboardHelpers'

export function RecentSales({
  loading, recentTickets,
}: {
  loading: boolean
  recentTickets: RecentTicket[]
}) {
  return (
    <div className="rounded-lg border border-graphite-line bg-riser p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-sm font-medium text-cuesheet">Recent ticket sales</p>
          <p className="mt-0.5 text-xs text-cuesheet/40">Latest activity across all productions</p>
        </div>
        <TicketIcon size={16} className="text-cuesheet/25" />
      </div>
      <div className="mt-4 space-y-3">
        {!loading && recentTickets.length === 0 ? (
          <p className="py-4 text-center text-xs text-cuesheet/30">No tickets sold yet</p>
        ) : (
          recentTickets.map((t) => {
            const meta = ticketStatusMeta(t.status)
            return (
              <div key={t.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-cuesheet">{t.buyer_name || 'Guest'}</p>
                  <p className="truncate text-xs text-cuesheet/40">
                    {t.ticket_types?.events?.name} · {t.ticket_types?.name}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-mono text-xs text-amber">
                    {t.amount_paid != null ? formatMoney(Number(t.amount_paid)) : '—'}
                  </span>
                  <span className={`h-1.5 w-1.5 rounded-full ${TONE_DOT[meta.tone]}`} title={meta.label} />
                </div>
              </div>
            )
          })
        )}
      </div>
      <a href="/customers" className="mt-4 flex items-center gap-1 text-xs text-wash hover:text-cuesheet">
        View all audience <ArrowUpRight size={12} />
      </a>
    </div>
  )
}