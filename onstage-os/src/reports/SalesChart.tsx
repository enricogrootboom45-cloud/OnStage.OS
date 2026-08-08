import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { EmptyState } from '../core/components/EmptyState'
import type { DayBucket } from './dashboardHelpers'

export function SalesChart({
  loading, eventCount, dailyBuckets, chartWindow, onWindowChange, chartData,
}: {
  loading: boolean
  eventCount: number
  dailyBuckets: DayBucket[]
  chartWindow: 7 | 30
  onWindowChange: (w: 7 | 30) => void
  chartData: DayBucket[]
}) {
  return (
    <div className="rounded-lg border border-graphite-line bg-riser p-5 lg:col-span-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-sm font-medium text-cuesheet">Ticket sales</p>
          <p className="mt-0.5 text-xs text-cuesheet/40">
            New tickets sold per day, {eventCount} production{eventCount === 1 ? '' : 's'} total
          </p>
        </div>
        <select
          value={chartWindow}
          onChange={(e) => onWindowChange(Number(e.target.value) as 7 | 30)}
          className="rounded-md border border-graphite-line bg-blackout px-2.5 py-1.5 text-xs text-cuesheet"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
        </select>
      </div>

      {!loading && dailyBuckets.every((b) => b.sold === 0) ? (
        <div className="mt-2">
          <EmptyState title="No ticket sales yet" body="Once productions go on sale, this chart fills in automatically — no setup needed." />
        </div>
      ) : (
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#E8893A" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#E8893A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#332F25" vertical={false} />
              <XAxis dataKey="label" stroke="#5A5544" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#5A5544" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
              <Tooltip
                contentStyle={{ background: '#1E1B14', border: '1px solid #332F25', borderRadius: 6, fontSize: 12 }}
                labelStyle={{ color: '#F6F2E7' }}
                formatter={(v: number) => [`${v} sold`, '']}
              />
              <Area type="monotone" dataKey="sold" stroke="#E8893A" strokeWidth={2} fill="url(#salesFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}