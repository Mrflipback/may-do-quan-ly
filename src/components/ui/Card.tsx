import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-paper ring-1 ring-slate-200/80 shadow-sm shadow-slate-200/50',
        className,
      )}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  tieuDe: string
  moTa?: string
  hanhDong?: ReactNode
  className?: string
}

export function CardHeader({ tieuDe, moTa, hanhDong, className }: CardHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-start justify-between gap-3 border-b border-slate-200/80 px-4 py-3.5 sm:px-5',
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="truncate text-sm font-semibold text-slate-900 sm:text-base">{tieuDe}</h2>
        {moTa && <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">{moTa}</p>}
      </div>
      {hanhDong && <div className="flex shrink-0 items-center gap-2">{hanhDong}</div>}
    </div>
  )
}

export function CardBody({ children, className }: CardProps) {
  return <div className={cn('p-4 sm:p-5', className)}>{children}</div>
}
