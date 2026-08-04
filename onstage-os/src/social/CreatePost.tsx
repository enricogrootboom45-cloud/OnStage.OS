import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ImagePlus, Loader2, Send, Ticket, Users, Globe, X } from 'lucide-react'
import { supabase } from '../core/supabaseClient'
import { useAuth } from '../core/auth/AuthProvider'
import { TopBar } from '../core/layout/TopBar'
import { Button } from '../core/components/Button'
import { Field, inputClass } from '../core/components/Modal'
import { uploadMedia, detectAspectRatio } from '../core/hooks/useUpload'
import type { EventRecord } from '../core/types'

interface MediaDraft {
  file: File
  previewUrl: string
  aspectRatio: string
}

export function CreatePost() {
  const { organization, profile } = useAuth()
  const navigate = useNavigate()

  const [events, setEvents] = useState<EventRecord[]>([])
  const [eventId, setEventId] = useState<string>('')
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'ticket_holders'>('followers')
  const [body, setBody] = useState('')
  const [media, setMedia] = useState<MediaDraft[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [posted, setPosted] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!organization) return
    supabase
      .from('events')
      .select('*')
      .eq('organization_id', organization.id)
      .in('status', ['published', 'live', 'completed'])
      .order('start_time', { ascending: false })
      .then(({ data }) => setEvents((data as EventRecord[]) || []))
  }, [organization])

  async function handleImageSelect(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    for (const file of files.slice(0, 10 - media.length)) {
      const previewUrl = URL.createObjectURL(file)
      const img = new Image()
      img.src = previewUrl
      await new Promise((r) => { img.onload = r })
      setMedia((m) => [...m, { file, previewUrl, aspectRatio: detectAspectRatio(img.naturalWidth, img.naturalHeight) }])
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  function removeMedia(i: number) {
    setMedia((m) => m.filter((_, idx) => idx !== i))
  }

  async function handleSubmit() {
    if (!organization || !profile) return
    if (!body.trim() && media.length === 0) return
    if (visibility === 'ticket_holders' && !eventId) {
      setError('Ticket-holders-only posts need an event selected, so we know who to show it to.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const uploaded = await Promise.all(
        media.map(async (m) => ({
          url: await uploadMedia(m.file, profile.id),
          aspectRatio: m.aspectRatio,
        })),
      )

      const { data: post, error: postErr } = await supabase
        .from('posts')
        .insert({
          organisation_id: organization.id,
          event_id: eventId || null,
          body: body.trim() || null,
          visibility,
        })
        .select('id')
        .single()
      if (postErr) throw postErr

      if (uploaded.length > 0) {
        await supabase.from('post_media').insert(
          uploaded.map((m, i) => ({
            post_id: post.id,
            url: m.url,
            media_type: 'image',
            aspect_ratio: m.aspectRatio,
            display_order: i,
          })),
        )
      }

      setPosted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post')
    } finally {
      setBusy(false)
    }
  }

  if (posted) {
    return (
      <div>
        <TopBar title="Post to community" />
        <div className="flex flex-col items-center gap-4 p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-riser shadow-glow text-amber-bright">
            <Send size={24} />
          </div>
          <p className="font-display text-lg font-semibold text-cuesheet">Posted to your community</p>
          <p className="max-w-sm text-sm text-cuesheet/45">
            This is now live on your organiser wall in the fan app — anyone following {organization?.name} will see it in their feed.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => { setPosted(false); setBody(''); setMedia([]); setEventId('') }}>
              Post another
            </Button>
            <Button onClick={() => navigate('/')}>Back to dashboard</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <TopBar title="Post to community" />
      <div className="mx-auto max-w-xl p-6">
        <p className="mb-5 text-sm text-cuesheet/45">
          Posts here land directly on your organiser wall in the OnStage app — the same feed your followers already see.
        </p>

        <Field label="Attach to event (optional)">
          <select
            value={eventId}
            onChange={(e) => {
              setEventId(e.target.value)
              if (!e.target.value && visibility === 'ticket_holders') setVisibility('followers')
            }}
            className={inputClass}
          >
            <option value="">No specific event</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>{ev.name}</option>
            ))}
          </select>
        </Field>

        <Field label="Who can see this">
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: 'ticket_holders', label: 'Ticket holders', icon: Ticket, hint: 'Only people with a ticket to the event above' },
              { value: 'followers', label: 'Followers', icon: Users, hint: 'Your org wall + followers\u2019 feed' },
              { value: 'public', label: 'Public', icon: Globe, hint: 'Also shows in the Community feed' },
            ] as const).map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setVisibility(opt.value)}
                disabled={opt.value === 'ticket_holders' && events.length === 0}
                className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-3 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
                  visibility === opt.value
                    ? 'border-amber/40 bg-amber/10 text-amber-bright'
                    : 'border-graphite-line text-cuesheet/50 hover:text-cuesheet'
                }`}
              >
                <opt.icon size={16} />
                <span className="text-xs font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-cuesheet/35">
            {visibility === 'ticket_holders' && 'Only people with a ticket to the event above will see this.'}
            {visibility === 'followers' && 'Shows on your org wall and in followers\u2019 Following feed — not in the public Community feed.'}
            {visibility === 'public' && 'Shows everywhere, including the global Community feed — best reach, use for real announcements.'}
          </p>
        </Field>

        <Field label="Message">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            placeholder="What's happening? Announce a lineup change, share a moment, hype the next show…"
            className={`${inputClass} resize-none`}
          />
        </Field>

        {media.length > 0 && (
          <div className="mb-3 grid grid-cols-4 gap-2">
            {media.map((m, i) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-md bg-blackout">
                <img src={m.previewUrl} alt="" className="h-full w-full object-cover" />
                <button
                  onClick={() => removeMedia(i)}
                  className="absolute right-1 top-1 rounded-full bg-blackout/80 p-1"
                  aria-label="Remove image"
                >
                  <X size={12} className="text-cuesheet" />
                </button>
              </div>
            ))}
          </div>
        )}

        {error && <p className="mb-3 text-sm text-standby">{error}</p>}

        <div className="flex items-center justify-between">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 text-sm text-cuesheet/50 hover:text-amber"
          >
            <ImagePlus size={18} /> Add photos
          </button>
          <Button onClick={handleSubmit} disabled={busy || (!body.trim() && media.length === 0)}>
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            Post to community
          </Button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageSelect} />
      </div>
    </div>
  )
}