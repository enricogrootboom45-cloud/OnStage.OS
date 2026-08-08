import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { formatMoney } from '../core/utils'
import { DONUT_COLORS } from './dashboardHelpers'

export function TierDonut({
  loading, tierRevenue,
}: {
  loading: boolean
  tierRevenue: { name: string; value: number }[]
}) {
  const tierTotal = tierRevenue.reduce((s, t) => s + t.value, 0)

  return (
    <div className="rounded-lg border border-graphite-line bg-riser p-5">
      <p className="font-display text-sm font-medium text-cuesheet">Revenue by tier</p>
      <p className="mt-0.5 text-xs text-cuesheet/40">Last 30 days</p>

      {!loading && tierRevenue.length === 0 ? (
        <div className="mt-8 text-center text-sm text-cuesheet/30">No sales yet</div>
      ) : (
        <>
          <div className="mt-2 h-36">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={tierRevenue} dataKey="value" nameKey="name" innerRadius={42} outerRadius={62} paddingAngle={2}>
                  {tierRevenue.map((_, i) => (
                    <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1E1B14', border: '1px solid #332F25', borderRadius: 6, fontSize: 12 }}
                  formatter={(v: number) => formatMoney(v)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-1.5">
            {tierRevenue.map((t, i) => (
              <div key={t.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-cuesheet/60">
                  <span className="h-2 w-2 rounded-full" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                  {t.name}
                </span>
                <span className="font-mono text-cuesheet/40">{tierTotal > 0 ? Math.round((t.value / tierTotal) * 100) : 0}%</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}