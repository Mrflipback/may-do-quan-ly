import { TriangleExclamationPoint } from 'lucide-react'
import { dichLoi } from '@/lib/loi'
import { cn } from '@/lib/utils'
import { Button } from './Button'

/** Khối xám nhấp nháy trong lúc chờ dữ liệu. */
export function KhoiCho({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-slate-200', className)} />
}

export function DangTaiBang({ soDong = 5 }: { soDong?: number }) {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: soDong }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <KhoiCho className="size-9 rounded-full" />
          <KhoiCho className="h-4 flex-1" />
          <KhoiCho className="h-4 w-24" />
        </div>
      ))}
    </div>
  )
}

interface BaoLoiProps {
  loi: unknown
  thuLai?: () => void
}

export function BaoLoi({ loi, thuLai }: BaoLoiProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
        <TriangleExclamationPoint className="size-6" />
      </span>
      <h3 className="mt-4 text-base font-semibold text-slate-900">Không tải được dữ liệu</h3>
      <p className="mt-1.5 max-w-md text-sm text-slate-600">{dichLoi(loi)}</p>
      {thuLai && (
        <Button kieu="phu" className="mt-5" onClick={thuLai}>
          Thử lại
        </Button>
      )}
    </div>
  )
}
