import type { ButtonHTMLAttributes } from 'react'
import { clsx } from '../utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
}

export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' &&
          'bg-amber text-blackout hover:bg-amber-bright',
        variant === 'secondary' &&
          'border border-graphite-line bg-riser text-cuesheet hover:border-cuesheet/30',
        variant === 'ghost' && 'text-cuesheet/60 hover:text-cuesheet',
        className,
      )}
      {...props}
    />
  )
}
