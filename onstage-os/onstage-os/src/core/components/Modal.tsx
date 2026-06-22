import type { ReactNode } from 'react'
import { X } from 'lucide-react'

export function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-blackout/80 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-graphite-line bg-riser shadow-2xl">
        <div className="flex items-center justify-between border-b border-graphite-line px-5 py-4">
          <h2 className="font-display text-sm font-medium text-cuesheet">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-cuesheet/40 hover:text-cuesheet"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  )
}

export function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-xs uppercase tracking-wide text-cuesheet/40">{label}</span>
      {children}
    </label>
  )
}

export const inputClass =
  'w-full rounded-md border border-graphite-line bg-blackout px-3 py-2 text-sm text-cuesheet placeholder:text-cuesheet/30 focus:border-amber/60'
