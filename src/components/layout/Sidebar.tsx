import { NavLink } from 'react-router-dom'
import { Scissors, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { menuTheoVaiTro } from './nav'
import { useT } from '@/i18n'
import type { VaiTro } from '@/types'

interface SidebarProps {
  vaiTro: VaiTro
  tenTiem: string
  /** Trạng thái mở của thanh bên trên điện thoại. */
  moTrenDienThoai: boolean
  dong: () => void
}

export function Sidebar({ vaiTro, tenTiem, moTrenDienThoai, dong }: SidebarProps) {
  const { t: dich } = useT()
  const nhomMenu = menuTheoVaiTro(vaiTro)

  return (
    <>
      {/* Lớp nền mờ khi mở menu trên điện thoại */}
      {moTrenDienThoai && (
        <button
          type="button"
          aria-label={dich('chung.dongMenu')}
          onClick={dong}
          className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-brand-900 text-brand-100',
          'transition-transform duration-200 ease-out',
          'lg:translate-x-0',
          moTrenDienThoai ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-white/10 px-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gold-400 text-brand-950">
              <Scissors className="size-5" />
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-bold text-white">{tenTiem}</p>
              <p className="text-[11px] font-semibold tracking-widest text-gold-300">PRO</p>
            </div>
          </div>
          <button
            type="button"
            onClick={dong}
            aria-label={dich('chung.dongMenu')}
            className="rounded-lg p-1.5 text-brand-200 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Danh mục */}
        <nav className="scrollbar-slim flex-1 overflow-y-auto px-3 py-4">
          {nhomMenu.map((nhom) => (
            <div key={nhom.tieuDe} className="mb-5 last:mb-0">
              <p className="mb-1.5 px-3 text-[11px] font-semibold tracking-wider text-brand-300 uppercase">
                {dich(nhom.tieuDe)}
              </p>
              <ul className="space-y-0.5">
                {nhom.muc.map((muc) => (
                  <li key={muc.duongDan}>
                    <NavLink
                      to={muc.duongDan}
                      end={muc.duongDan === '/'}
                      onClick={dong}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-white/15 text-white shadow-sm'
                            : 'text-brand-200 hover:bg-white/10 hover:text-white',
                        )
                      }
                    >
                      <muc.icon className="size-[18px] shrink-0" />
                      <span className="truncate">{dich(muc.nhan)}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-white/10 px-4 py-3">
          <p className="text-[11px] text-brand-300">
            {dich('chung.luuTru')}
          </p>
        </div>
      </aside>
    </>
  )
}
