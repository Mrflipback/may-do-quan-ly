import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type KieuNut = 'chinh' | 'phu' | 'vien' | 'mo' | 'nguyHiem' | 'vang'
type CoNut = 'nho' | 'vua' | 'lon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  kieu?: KieuNut
  co?: CoNut
  dangTai?: boolean
  iconTrai?: ReactNode
  iconPhai?: ReactNode
  rongHet?: boolean
}

const KIEU: Record<KieuNut, string> = {
  chinh: 'bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-900 shadow-sm',
  phu: 'bg-paper text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 active:bg-slate-100 shadow-sm',
  vien: 'bg-transparent text-brand-700 ring-1 ring-brand-300 hover:bg-brand-50 active:bg-brand-100',
  mo: 'bg-transparent text-slate-600 hover:bg-slate-200/70 active:bg-slate-300/70',
  nguyHiem: 'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm',
  vang: 'bg-gold-400 text-brand-950 hover:bg-gold-500 active:bg-gold-600 shadow-sm',
}

const CO: Record<CoNut, string> = {
  nho: 'h-8 px-3 text-xs gap-1.5',
  vua: 'h-10 px-4 text-sm gap-2',
  lon: 'h-12 px-6 text-base gap-2.5',
}

export function Button({
  kieu = 'chinh',
  co = 'vua',
  dangTai = false,
  iconTrai,
  iconPhai,
  rongHet = false,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || dangTai}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        KIEU[kieu],
        CO[co],
        rongHet && 'w-full',
        className,
      )}
    >
      {dangTai ? <SpinnerNho /> : iconTrai}
      {children}
      {!dangTai && iconPhai}
    </button>
  )
}

function SpinnerNho() {
  return (
    <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z"
      />
    </svg>
  )
}
