import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { MAU_TRANG_THAI, NHAN_TRANG_THAI } from '@/lib/constants'
import type { TrangThaiDonHang } from '@/types'

interface BadgeProps {
  children: ReactNode
  className?: string
}

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap',
        className ?? 'bg-slate-100 text-slate-700 ring-slate-500/20',
      )}
    >
      {children}
    </span>
  )
}

export function BadgeTrangThai({ trangThai }: { trangThai: TrangThaiDonHang }) {
  return <Badge className={MAU_TRANG_THAI[trangThai]}>{NHAN_TRANG_THAI[trangThai]}</Badge>
}
