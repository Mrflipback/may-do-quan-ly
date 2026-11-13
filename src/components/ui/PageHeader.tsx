import type { ReactNode } from 'react'

interface PageHeaderProps {
  tieuDe: string
  moTa?: string
  hanhDong?: ReactNode
}

export function PageHeader({ tieuDe, moTa, hanhDong }: PageHeaderProps) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{tieuDe}</h1>
        {moTa && <p className="mt-1 text-sm text-slate-500">{moTa}</p>}
      </div>
      {hanhDong && <div className="flex shrink-0 flex-wrap items-center gap-2">{hanhDong}</div>}
    </div>
  )
}
