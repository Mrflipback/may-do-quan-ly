import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  tieuDe: string
  moTa?: string
  hanhDong?: ReactNode
}

export function EmptyState({ icon, tieuDe, moTa, hanhDong }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      {icon && (
        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-900">{tieuDe}</h3>
      {moTa && <p className="mt-1.5 max-w-md text-sm text-slate-500">{moTa}</p>}
      {hanhDong && <div className="mt-5">{hanhDong}</div>}
    </div>
  )
}
