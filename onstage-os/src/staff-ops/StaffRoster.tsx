import { useEffect, useState, useCallback, type FormEvent } from 'react'
import { Plus, UserCheck, Coffee, LogIn, LogOut, Radio, Download } from 'lucide-react'
import { supabase } from '../core/supabaseClient'
import { useAuth } from '../core/auth/AuthProvider'
import { TopBar } from '../core/layout/TopBar'
import { Button } from '../core/components/Button'
import { EmptyState } from '../core/components/EmptyState'
import { CueLight } from '../core/components/CueLight'
import { Modal, Field, inputClass } from '../core/components/Modal'
import { shiftStatusMeta } from '../core/statusMeta'
import { useShiftRealtime } from '../core/useShiftRealtime'
import type { EventRecord, Shift, Staff } from '../core/types'

export function StaffRoster() {
  const { organization } = useAuth()
  const [staff, setStaff] = useState<Staff[]>([])
  const [events, setEvents] = useState<EventRecord[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  async function loadBase() {
    if (!organization) return
    setLoading(true)
    const [staffRes, eventsRes] = await Promise.all([
      supabase
        .from('staff')
        .select('*')
        .eq('organization_id', organization.id)
        .order('full_name'),
      supabase
        .from('events')
        .select('*')
        .eq('organization_id', organization.id)
        .in('status', ['published', 'live'])
        .order('start_time', { ascending: false }),
    ])
    const staffData = (staffRes.data as Staff[]) || []
    const eventsData = (eventsRes.data as EventRecord[]) || []
    setStaff(staffData)
    setEvents(eventsData)
    if (!selectedEventId && eventsData.length > 0) setSelectedEventId(eventsData[0].id)
    setLoading(false)
  }

  async function loadShifts(eventId: string) {
    const { data } = await supabase.from('shifts').select('*').eq('event_id', eventId)
    setShifts((data as Shift[]) || [])
  }

  // Realtime — merge incoming shift changes without a full reload
  const handleShiftChange = useCallback(() => {
    if (selectedEventId) loadShifts(selectedEventId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEventId])

  useShiftRealtime(selectedEventId || null, handleShiftChange)

  useEffect(() => {
    loadBase()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization])

  useEffect(() => {
    if (selectedEventId) loadShifts(selectedEventId)
    else setShifts([])
  }, [selectedEventId])

  async function assignShift(staffId: string) {
    if (!selectedEventId) return
    await supabase
      .from('shifts')
      .insert({ event_id: selectedEventId, staff_id: staffId, status: 'scheduled' })
    loadShifts(selectedEventId)
  }

  async function updateShift(shiftId: string, patch: Partial<Shift>) {
    await supabase.from('shifts').update(patch).eq('id', shiftId)
    loadShifts(selectedEventId)
  }

  function exportTimesheet() {
    if (!shifts.length || !staff.length) return
    const eventName = events.find((e) => e.id === selectedEventId)?.name || 'event'
    const rows: string[][] = [['Name', 'Role', 'Status', 'Clock In', 'Clock Out', 'Hours Worked']]
    for (const member of staff) {
      const shift = shiftFor(member.id)
      if (!shift) continue
      const cin  = shift.clock_in  ? new Date(shift.clock_in)  : null
      const cout = shift.clock_out ? new Date(shift.clock_out) : null
      const hours = cin && cout
        ? ((cout.getTime() - cin.getTime()) / 3600000).toFixed(2)
        : shift.status === 'clocked_in' ? 'In progress' : '—'
      rows.push([
        member.full_name,
        member.role_title || '—',
        shift.status,
        cin  ? cin.toLocaleString('en-ZA')  : '—',
        cout ? cout.toLocaleString('en-ZA') : '—',
        String(hours),
      ])
    }
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `timesheet-${eventName.replace(/\s+/g, '-').toLowerCase()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function shiftFor(staffId: string) {
    return shifts.find((s) => s.staff_id === staffId)
  }

  return (
    <div>
      <TopBar title="Crew" />
      <div className="p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-cuesheet/45">
            {staff.length} crew member{staff.length === 1 ? '' : 's'} on record
          </p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={exportTimesheet}>
              <Download size={15} /> Export timesheet
            </Button>
            <Button onClick={() => setShowForm(true)}>
              <Plus size={15} /> Add crew member
            </Button>
          </div>
        </div>

        {!loading && staff.length === 0 ? (
          <EmptyState
            icon={<UserCheck size={28} />}
            title="No crew on record yet"
            body="Add your team — once they're assigned to an event you can track clock-in, breaks, and clock-out live."
            action={
              <Button onClick={() => setShowForm(true)} variant="secondary">
                <Plus size={15} /> Add crew member
              </Button>
            }
          />
        ) : (
          <div className="rounded-lg border border-graphite-line bg-riser">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-graphite-line px-4 py-3">
              <div className="flex items-center gap-2">
                <p className="font-display text-sm font-medium text-cuesheet">Shift board</p>
                {selectedEventId && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber/20 bg-amber/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-amber">
                    <Radio size={10} className="cue-pulse" />
                    Live
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {shifts.length > 0 && (
                  <button
                    onClick={exportTimesheet}
                    className="inline-flex items-center gap-1.5 rounded-md border border-graphite-line bg-blackout px-2.5 py-1.5 text-xs text-cuesheet/55 hover:text-cuesheet"
                  >
                    <Download size={13} /> Timesheet CSV
                  </button>
                )}
              {events.length > 0 ? (
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="rounded-md border border-graphite-line bg-blackout px-2.5 py-1.5 text-xs text-cuesheet"
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs text-cuesheet/35">Publish an event to start tracking</span>
              )}
              </div>
            </div>

            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-cuesheet/40">
                <tr>
                  <th className="px-4 py-2 font-normal">Crew member</th>
                  <th className="px-4 py-2 font-normal">Role</th>
                  <th className="px-4 py-2 font-normal">Status</th>
                  <th className="px-4 py-2 font-normal">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((member) => {
                  const shift = selectedEventId ? shiftFor(member.id) : undefined
                  const meta = shift ? shiftStatusMeta(shift.status) : null
                  return (
                    <tr key={member.id} className="border-t border-graphite-line/70">
                      <td className="px-4 py-3 text-cuesheet">{member.full_name}</td>
                      <td className="px-4 py-3 text-cuesheet/55">
                        {member.role_title || '—'}
                      </td>
                      <td className="px-4 py-3">
                        {meta ? (
                          <CueLight tone={meta.tone} label={meta.label} pulse={meta.pulse} />
                        ) : (
                          <span className="text-xs text-cuesheet/30">Not assigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {!selectedEventId ? null : !shift ? (
                          <button
                            onClick={() => assignShift(member.id)}
                            className="text-xs text-wash hover:text-cuesheet"
                          >
                            Assign to event
                          </button>
                        ) : (
                          <ShiftActions shift={shift} onUpdate={updateShift} />
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <NewStaffModal
          organizationId={organization!.id}
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false)
            loadBase()
          }}
        />
      )}
    </div>
  )
}

function ShiftActions({
  shift,
  onUpdate,
}: {
  shift: Shift
  onUpdate: (id: string, patch: Partial<Shift>) => void
}) {
  const base = 'inline-flex items-center gap-1 text-xs hover:text-cuesheet'
  if (shift.status === 'scheduled') {
    return (
      <button
        className={`${base} text-amber-bright`}
        onClick={() => onUpdate(shift.id, { status: 'clocked_in', clock_in: new Date().toISOString() })}
      >
        <LogIn size={13} /> Clock in
      </button>
    )
  }
  if (shift.status === 'clocked_in') {
    return (
      <div className="flex items-center gap-3">
        <button
          className={`${base} text-wash`}
          onClick={() => onUpdate(shift.id, { status: 'on_break' })}
        >
          <Coffee size={13} /> Start break
        </button>
        <button
          className={`${base} text-cuesheet/50`}
          onClick={() =>
            onUpdate(shift.id, { status: 'clocked_out', clock_out: new Date().toISOString() })
          }
        >
          <LogOut size={13} /> Clock out
        </button>
      </div>
    )
  }
  if (shift.status === 'on_break') {
    return (
      <button
        className={`${base} text-amber-bright`}
        onClick={() => onUpdate(shift.id, { status: 'clocked_in' })}
      >
        <LogIn size={13} /> End break
      </button>
    )
  }
  return <span className="text-xs text-cuesheet/30">Shift complete</span>
}

function NewStaffModal({
  organizationId,
  onClose,
  onCreated,
}: {
  organizationId: string
  onClose: () => void
  onCreated: () => void
}) {
  const [fullName, setFullName] = useState('')
  const [roleTitle, setRoleTitle] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error } = await supabase.from('staff').insert({
      organization_id: organizationId,
      full_name: fullName,
      role_title: roleTitle || null,
      phone: phone || null,
    })
    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    onCreated()
  }

  return (
    <Modal title="Add crew member" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <Field label="Full name">
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={inputClass}
            placeholder="Crew member name"
          />
        </Field>
        <Field label="Role">
          <input
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
            className={inputClass}
            placeholder="e.g. Bar lead, Security, Stage hand"
          />
        </Field>
        <Field label="Phone">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
            placeholder="+27…"
          />
        </Field>
        {error && <p className="mb-3 text-sm text-standby">{error}</p>}
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? 'Adding…' : 'Add crew member'}
        </Button>
      </form>
    </Modal>
  )
}