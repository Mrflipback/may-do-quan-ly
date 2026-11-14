import { useEffect, useRef, useState } from 'react'
import { ChevronDown, LogOut, Menu, Monitor, Moon, Palette, Search, Settings, Sun } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { chuCaiDau } from '@/lib/utils'
import { NHAN_VAI_TRO } from '@/lib/constants'
import { useAuth } from '@/auth/AuthProvider'
import { useThongBao } from '@/components/ui/ThongBao'
import { dichLoi } from '@/lib/loi'
import { useT } from '@/i18n'
import { useGiaoDien, type ChoDoGiaoDien } from '@/lib/giaoDien'
import { useNhanGiaoDien } from '@/i18n/nhan'
import type { NguoiDung } from '@/types'

/** Bấm nút tròn trên thanh: Sáng -> Tối -> Theo máy -> Sáng… */
const KE_TIEP: Record<ChoDoGiaoDien, ChoDoGiaoDien> = {
  sang: 'toi',
  toi: 'theo_may',
  theo_may: 'sang',
}

interface TopbarProps {
  nguoiDung: NguoiDung
  moMenu: () => void
}

export function Topbar({ nguoiDung, moMenu }: TopbarProps) {
  const [moTaiKhoan, setMoTaiKhoan] = useState(false)
  const [tuKhoa, setTuKhoa] = useState('')
  const vungTaiKhoan = useRef<HTMLDivElement>(null)
  const dieuHuong = useNavigate()
  const { dangXuat, laQuanTri } = useAuth()
  const { t: dich } = useT()
  const { cai, doiCheDo } = useGiaoDien()
  const { NHAN_GIAO_DIEN } = useNhanGiaoDien()
  const che = cai.che
  const tb = useThongBao()

  useEffect(() => {
    if (!moTaiKhoan) return
    const xuLy = (e: MouseEvent) => {
      if (vungTaiKhoan.current && !vungTaiKhoan.current.contains(e.target as Node)) {
        setMoTaiKhoan(false)
      }
    }
    document.addEventListener('mousedown', xuLy)
    return () => document.removeEventListener('mousedown', xuLy)
  }, [moTaiKhoan])

  const thoat = async () => {
    try {
      await dangXuat()
      dieuHuong('/dang-nhap', { replace: true })
    } catch (e) {
      tb.loi(dichLoi(e))
    }
  }

  const timKiem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!tuKhoa.trim()) return
    dieuHuong(`/khach-hang?tim=${encodeURIComponent(tuKhoa.trim())}`)
    setTuKhoa('')
  }

  return (
    <header className="no-print sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-paper/90 px-4 backdrop-blur-sm sm:px-6">
      <button
        type="button"
        onClick={moMenu}
        aria-label={dich('chung.moMenu')}
        className="-ml-1 rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 lg:hidden"
      >
        <Menu className="size-5" />
      </button>

      <form onSubmit={timKiem} className="relative hidden max-w-sm flex-1 sm:block">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={tuKhoa}
          onChange={(e) => setTuKhoa(e.target.value)}
          placeholder={dich('chung.timKhachGoiY')}
          aria-label={dich('chung.timKiemNhanh')}
          className="h-10 w-full rounded-lg bg-slate-100 pr-3 pl-9 text-sm text-slate-900 ring-1 ring-transparent transition placeholder:text-slate-400 focus:bg-paper focus:ring-brand-500 focus:outline-none"
        />
      </form>

      <div className="flex-1 sm:hidden" />

      <button
        type="button"
        onClick={() => doiCheDo(KE_TIEP[che])}
        aria-label={`${dich('menu.giaoDien')}: ${NHAN_GIAO_DIEN[che]}`}
        title={`${dich('menu.giaoDien')}: ${NHAN_GIAO_DIEN[che]}`}
        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        {che === 'sang' ? (
          <Sun className="size-5" />
        ) : che === 'toi' ? (
          <Moon className="size-5" />
        ) : (
          <Monitor className="size-5" />
        )}
      </button>

      <div className="relative" ref={vungTaiKhoan}>
        <button
          type="button"
          onClick={() => setMoTaiKhoan((v) => !v)}
          aria-expanded={moTaiKhoan}
          aria-haspopup="menu"
          className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-slate-100"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-700 text-xs font-bold text-white">
            {chuCaiDau(nguoiDung.ho_ten)}
          </span>
          <span className="hidden text-left leading-tight sm:block">
            <span className="block text-sm font-semibold text-slate-800">{nguoiDung.ho_ten}</span>
            <span className="block text-[11px] text-slate-500">
              {NHAN_VAI_TRO[nguoiDung.vai_tro]}
            </span>
          </span>
          <ChevronDown className="hidden size-4 text-slate-400 sm:block" />
        </button>

        {moTaiKhoan && (
          <div
            role="menu"
            className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl bg-paper py-1.5 ring-1 ring-slate-200 shadow-lg"
          >
            <div className="border-b border-slate-100 px-4 py-2.5">
              <p className="truncate text-sm font-semibold text-slate-800">{nguoiDung.ho_ten}</p>
              <p className="truncate text-xs text-slate-500">{nguoiDung.email}</p>
              <p className="mt-1 text-[11px] font-medium text-brand-700">
                {NHAN_VAI_TRO[nguoiDung.vai_tro]}
              </p>
            </div>

            <div className="border-b border-slate-100 px-4 py-2">
              <p className="mb-1.5 text-[11px] font-medium text-slate-400">{dich('giaoDien.nenSang')} / {dich('giaoDien.nenToi')}</p>
              <div className="flex gap-1">
                {(['sang', 'toi', 'theo_may'] as ChoDoGiaoDien[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => doiCheDo(c)}
                    className={
                      'flex-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition-colors ' +
                      (che === c
                        ? 'bg-brand-700 text-white'
                        : 'text-slate-600 hover:bg-slate-100')
                    }
                  >
                    {NHAN_GIAO_DIEN[c]}
                  </button>
                ))}
              </div>
            </div>

            <Link
              to="/giao-dien"
              onClick={() => setMoTaiKhoan(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Palette className="size-4 text-slate-400" />
              {dich('menu.giaoDien')}
            </Link>

            {laQuanTri && (
              <Link
                to="/cai-dat"
                onClick={() => setMoTaiKhoan(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
              >
                <Settings className="size-4 text-slate-400" />
                {dich('menu.caiDat')}
              </Link>
            )}

            <button
              type="button"
              onClick={thoat}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 transition-colors hover:bg-rose-50"
            >
              <LogOut className="size-4" />
              {dich('chung.dangXuat')}
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
