import { useEffect, useState } from 'react'
import { LogIn, LogOut, Coffee, Clock } from 'lucide-react'
import { supabase } from '../core/supabaseClient'
import { useAuth } from '../core/auth/AuthProvider'
import { TopBar } from '../core/layout/TopBar'
import { CueLight } from '../core/components/CueLight'
import { shiftStatusMeta } from '../core/statusMeta'
import { formatTime } from '../core/utils'
import type { EventRecord, Shift, Staff } from '../core/types'

interface ShiftWithEvent extends Shift {
  events: EventRecord
}

export function SelfClockIn() {
  const { profile, organization } = useAuth()
  const [staffRecord, setStaffRecord] = useState<Staff | null>(null)
  const [shifts, setShifts] = useState<ShiftWithEvent[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    if (!profile || !organization) return
    setLoading(true)

    // Find the staff record linked to this profile
    const { data: staffData } = await supabase
      .from('staff')
      .select('*')
      .eq('organization_id', organization.id)
      .eq('profile_id', profile.id)
      .maybeSingle()

    if (!staffData) { setLoading(false); return }
    setStaffRecord(staffData as Staff)

    // Load their upcoming/active shifts with event details
    const { data: shiftData } = await supabase
      .from('shifts')
      .select('*, events(*)')
      .eq('staff_id', staffData.id)
      .in('status', ['scheduled', 'clocked_in', 'on_break'])
      .order('created_at', { ascending: false })

    setShifts((shiftData as ShiftWithEvent[]) || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [profile, organization]) // eslint-disable-line react-hooks/exhaustive-deps

  async function updateShift(shiftId: string, patch: Partial<Shift>) {
    await supabase.from('shifts').update(patch).eq('id', shiftId)
    load()
  }

  const meta = (s: ShiftWithEvent) => shiftStatusMeta(s.status)

  return (
    <div>
      <TopBar title="My shifts" />
      <div className="p-4">
        {/* Identity bar */}
        <div className="mb-6 rounded-lg border border-graphite-line bg-riser px-4 py-3">
          <p className="font-display text-sm font-medium text-cuesheet">
            {profile?.full_name || 'Crew member'}
          </p>
          <p className="mt-0.5 font-mono text-xs uppercase tracking-wider text-cuesheet/40">
            {organization?.name} · {profile?.role}
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-cuesheet/40">Loading your shifts…</p>
        ) : !staffRecord ? (
          <div className="rounded-lg border border-dashed border-graphite-line p-8 text-center">
            <p className="text-sm text-cuesheet/50">
              No staff record linked to your account yet.
            </p>
            <p className="mt-1 text-xs text-cuesheet/30">
              Ask your manager to link your profile to your crew record.
            </p>
          </div>
        ) : shifts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-graphite-line p-8 text-center">
            <Clock size={28} className="mx-auto mb-3 text-cuesheet/20" />
            <p className="text-sm text-cuesheet/50">No active shifts scheduled.</p>
            <p className="mt-1 text-xs text-cuesheet/30">Check with your manager.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {shifts.map((shift) => {
              const m = meta(shift)
              return (
                <div key={shift.id} className="rounded-xl border border-graphite-line bg-riser p-5">
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <p className="font-display text-base font-semibold text-cuesheet">
                        {shift.events?.name || 'Event'}
                      </p>
                      {shift.clock_in && (
                        <p className="mt-0.5 font-mono text-xs text-cuesheet/40">
                          Clocked in at {formatTime(shift.clock_in)}
                        </p>
                      )}
                    </div>
                    <CueLight tone={m.tone} label={m.label} pulse={m.pulse} />
                  </div>

                  {/* Big action buttons — mobile thumb-friendly */}
                  <div className="flex flex-col gap-2">
                    {shift.status === 'scheduled' && (
                      <button
                        onClick={() => updateShift(shift.id, {
                          status: 'clocked_in',
                          clock_in: new Date().toISOString(),
                        })}
                        className="flex items-center justify-center gap-2 rounded-lg bg-amber py-3.5 font-display text-sm font-semibold text-blackout hover:bg-amber-bright"
                      >
                        <LogIn size={18} /> Clock in
                      </button>
                    )}

                    {shift.status === 'clocked_in' && (
                      <>
                        <button
                          onClick={() => updateShift(shift.id, { status: 'on_break' })}
                          className="flex items-center justify-center gap-2 rounded-lg border border-graphite-line bg-blackout py-3.5 font-display text-sm font-semibold text-wash hover:text-cuesheet"
                        >
                          <Coffee size={18} /> Start break
                        </button>
                        <button
                          onClick={() => updateShift(shift.id, {
                            status: 'clocked_out',
                            clock_out: new Date().toISOString(),
                          })}
                          className="flex items-center justify-center gap-2 rounded-lg border border-graphite-line bg-blackout py-3.5 font-display text-sm font-semibold text-cuesheet/50 hover:text-cuesheet"
                        >
                          <LogOut size={18} /> Clock out
                        </button>
                      </>
                    )}

                    {shift.status === 'on_break' && (
                      <button
                        onClick={() => updateShift(shift.id, { status: 'clocked_in' })}
                        className="flex items-center justify-center gap-2 rounded-lg bg-amber py-3.5 font-display text-sm font-semibold text-blackout hover:bg-amber-bright"
                      >
                        <LogIn size={18} /> End break
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
