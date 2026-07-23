import { ButtonHTMLAttributes } from 'react'
import { clsx } from '../utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md'
}

export function Button({ variant = 'primary', size = 'md', className, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' && 'px-2.5 py-1.5 text-xs',
        size === 'md' && 'px-3.5 py-2 text-sm',
        variant === 'primary' && 'bg-amber text-blackout hover:bg-amber-bright',
        variant === 'secondary' && 'bg-riser text-white hover:bg-riser/80 border border-graphite-line',
        variant === 'ghost' && 'text-cuesheet hover:bg-riser hover:text-white',
        className
      )}
      {...props}
    />
  )
}