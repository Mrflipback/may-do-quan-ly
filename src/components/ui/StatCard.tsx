import type { ReactNode } from 'react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  nhan: string
  giaTri: string
  icon: ReactNode
  mauIcon?: string
  thayDoi?: number
  chuThich?: string
}

export function StatCard({
  nhan,
  giaTri,
  icon,
  mauIcon = 'bg-brand-50 text-brand-700',
  thayDoi,
  chuThich,
}: StatCardProps) {
  const tang = (thayDoi ?? 0) >= 0

  return (
    <div className="rounded-xl bg-paper p-4 ring-1 ring-slate-200/80 shadow-sm shadow-slate-200/50 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{nhan}</p>
        <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', mauIcon)}>
          {icon}
        </span>
      </div>

      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900 tabular-nums">{giaTri}</p>

      {(thayDoi !== undefined || chuThich) && (
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          {thayDoi !== undefined && (
            <span
              className={cn(
                'inline-flex items-center gap-1 font-semibold',
                tang ? 'text-emerald-600' : 'text-rose-600',
              )}
            >
              {tang ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
              {tang ? '+' : ''}
              {thayDoi.toFixed(1)}%
            </span>
          )}
          {chuThich && <span className="text-slate-400">{chuThich}</span>}
        </div>
      )}
    </div>
  )
}
