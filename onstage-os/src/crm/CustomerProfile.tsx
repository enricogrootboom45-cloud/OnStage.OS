import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Ticket as TicketIcon } from 'lucide-react'

export function CustomerProfile() {
  return (
    <div className="p-6">
      <Link to="/crm" className="inline-flex items-center gap-2 text-sm text-cuesheet hover:text-white mb-4">
        <ArrowLeft size={16} /> Back to CRM
      </Link>
      <div className="rounded-lg border border-dashed border-graphite-line p-8 text-center">
        <TicketIcon size={24} className="mx-auto mb-3 text-cuesheet/40" />
        <p className="text-sm text-cuesheet/60">Customer ticket history details</p>
      </div>
    </div>
  )
}