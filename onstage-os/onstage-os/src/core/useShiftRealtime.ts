import { useEffect, useCallback } from 'react'
import { supabase } from './supabaseClient'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { Shift } from './types'

type ShiftPayload = RealtimePostgresChangesPayload<Shift>

/**
 * Subscribes to INSERT/UPDATE changes on the shifts table for a given event.
 * Calls onShiftChange whenever a row changes — the parent component re-fetches
 * or merges state from the payload as needed.
 *
 * Returns an unsubscribe function — call it in the useEffect cleanup.
 */
export function useShiftRealtime(
  eventId: string | null,
  onShiftChange: (payload: ShiftPayload) => void,
) {
  // Stable callback ref so the channel subscription doesn't thrash
  const stableCallback = useCallback(onShiftChange, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!eventId) return

    const channel = supabase
      .channel(`shifts:event_id=eq.${eventId}`)
      .on<Shift>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shifts',
          filter: `event_id=eq.${eventId}`,
        },
        stableCallback,
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [eventId, stableCallback])
}
