import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { CheckCircle, XCircle, Camera, CameraOff, Loader2 } from 'lucide-react'
import { supabase } from '../core/supabaseClient'
import { TopBar } from '../core/layout/TopBar'
import { useAuth } from '../core/auth/AuthProvider'
import type { Ticket, TicketType, EventRecord } from '../core/types'

type ScanResult =
  | { ok: true;  ticket: Ticket; tierName: string; buyerName: string }
  | { ok: false; message: string }

interface FullTicket extends Ticket {
  ticket_types: TicketType & { events: EventRecord }
}

export function DoorScanner() {
  const { organization } = useAuth()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef   = useRef<number>(0)
  const scanLock  = useRef(false)

  const [cameraOn,   setCameraOn]   = useState(false)
  const [cameraErr,  setCameraErr]  = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<ScanResult | null>(null)
  const [checking,   setChecking]   = useState(false)

  async function startCamera() {
    setCameraErr(null)
    setLastResult(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setCameraOn(true)
        scanLock.current = false
        tick()
      }
    } catch {
      setCameraErr('Camera permission denied. Please allow camera access in your browser settings.')
    }
  }

  function stopCamera() {
    cancelAnimationFrame(animRef.current)
    const stream = videoRef.current?.srcObject as MediaStream | null
    stream?.getTracks().forEach((t) => t.stop())
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraOn(false)
  }

  function tick() {
    animRef.current = requestAnimationFrame(tick)
    if (!videoRef.current || !canvasRef.current || scanLock.current) return
    const video  = videoRef.current
    const canvas = canvasRef.current
    if (video.readyState !== video.HAVE_ENOUGH_DATA) return

    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(video, 0, 0)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const qr = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    })
    if (qr?.data) handleScan(qr.data)
  }

  async function handleScan(raw: string) {
    if (scanLock.current) return
    scanLock.current = true
    setChecking(true)
    setLastResult(null)

    // Extract UUID — QR encodes the ticket UUID directly
    const uuid = raw.trim().split('/').pop() || raw.trim()
    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRe.test(uuid)) {
      setLastResult({ ok: false, message: 'Not a valid OnStage OS ticket QR code.' })
      setChecking(false)
      setTimeout(() => { scanLock.current = false; setLastResult(null) }, 3000)
      return
    }

    const { data: t } = await supabase
      .from('tickets')
      .select('*, ticket_types(name, events(name, organization_id))')
      .eq('id', uuid)
      .maybeSingle()

    const ticket = t as FullTicket | null

    if (!ticket) {
      setLastResult({ ok: false, message: 'Ticket not found.' })
    } else if (ticket.status === 'checked_in') {
      setLastResult({ ok: false, message: 'Already checked in.' })
    } else if (ticket.status === 'cancelled' || ticket.status === 'refunded') {
      setLastResult({ ok: false, message: `Ticket is ${ticket.status}.` })
    } else if (
      organization &&
      ticket.ticket_types?.events?.organization_id !== organization.id
    ) {
      setLastResult({ ok: false, message: 'Ticket belongs to a different organization.' })
    } else {
      // Mark as checked in
      const { error } = await supabase
        .from('tickets')
        .update({ status: 'checked_in', checked_in_at: new Date().toISOString() })
        .eq('id', uuid)

      if (error) {
        setLastResult({ ok: false, message: 'Database error — try again.' })
      } else {
        setLastResult({
          ok: true,
          ticket: { ...ticket, status: 'checked_in' },
          tierName: ticket.ticket_types?.name ?? '',
          buyerName: ticket.buyer_name ?? 'Guest',
        })
      }
    }

    setChecking(false)
    // Auto-clear after 4 seconds and resume scanning
    setTimeout(() => { setLastResult(null); scanLock.current = false }, 4000)
  }

  useEffect(() => () => stopCamera(), [])

  return (
    <div>
      <TopBar title="Door scanner" />
      <div className="flex flex-col items-center px-4 py-6">

        {/* Camera viewfinder */}
        <div className="relative mb-4 w-full max-w-sm overflow-hidden rounded-2xl border border-graphite-line bg-blackout">
          <video
            ref={videoRef}
            className="w-full"
            playsInline
            muted
            style={{ display: cameraOn ? 'block' : 'none' }}
          />
          <canvas ref={canvasRef} className="hidden" />

          {!cameraOn && (
            <div className="flex h-64 flex-col items-center justify-center gap-3">
              <CameraOff size={32} className="text-cuesheet/20" />
              <p className="text-sm text-cuesheet/40">Camera off</p>
            </div>
          )}

          {/* Scanning overlay */}
          {cameraOn && !checking && !lastResult && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-52 w-52 rounded-xl border-2 border-amber opacity-60" />
            </div>
          )}

          {/* Result overlay */}
          {lastResult && (
            <div
              className={`absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl ${
                lastResult.ok ? 'bg-wash/90' : 'bg-standby/90'
              }`}
            >
              {lastResult.ok ? (
                <>
                  <CheckCircle size={52} className="text-cuesheet" />
                  <p className="font-display text-lg font-bold text-cuesheet">Admitted</p>
                  <p className="text-sm text-cuesheet/80">{lastResult.buyerName}</p>
                  <p className="font-mono text-xs text-cuesheet/60">{lastResult.tierName}</p>
                </>
              ) : (
                <>
                  <XCircle size={52} className="text-cuesheet" />
                  <p className="font-display text-base font-bold text-cuesheet">Denied</p>
                  <p className="text-sm text-cuesheet/80">{lastResult.message}</p>
                </>
              )}
            </div>
          )}

          {/* Checking spinner */}
          {checking && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-blackout/70">
              <Loader2 size={36} className="animate-spin text-amber" />
            </div>
          )}
        </div>

        {cameraErr && (
          <p className="mb-4 max-w-sm text-center text-sm text-standby">{cameraErr}</p>
        )}

        {/* Toggle button */}
        <button
          onClick={cameraOn ? stopCamera : startCamera}
          className={`flex items-center gap-2 rounded-full px-6 py-3 font-display text-sm font-semibold transition-colors ${
            cameraOn
              ? 'bg-graphite text-cuesheet/70 hover:bg-graphite/70'
              : 'bg-amber text-blackout hover:bg-amber-bright'
          }`}
        >
          {cameraOn ? (
            <><CameraOff size={17} /> Stop camera</>
          ) : (
            <><Camera size={17} /> Start scanning</>
          )}
        </button>

        <p className="mt-4 max-w-xs text-center text-xs text-cuesheet/30">
          Point the camera at a ticket QR code. Check-in is instant and logged automatically.
        </p>
      </div>
    </div>
  )
}
