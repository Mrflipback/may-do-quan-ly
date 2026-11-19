import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Lock, LogOut, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/auth/AuthProvider'
import { useCaiDat } from '@/data/heThong'
import { Input } from '@/components/ui/Field'
import { OTichHCaptcha, type TayCamHCaptcha } from '@/components/OTichHCaptcha'
import { Button } from '@/components/ui/Button'

/**
 * KHOÁ MÀN HÌNH KHI ĐỂ KHÔNG LÂU
 * ------------------------------------------------------------------
 * Không đụng chuột gõ phím một lúc thì phần mềm che màn hình lại, phải
 * gõ mật khẩu đăng nhập mới vào tiếp. Khác với đăng xuất hẳn: phiên vẫn
 * còn, công việc đang làm dở vẫn nguyên, mở khoá xong là làm tiếp.
 *
 * MỤC ĐÍCH: chủ tiệm đi ăn cơm, máy vẫn đăng nhập, ai đó ngồi vào.
 *
 * NÓI RÕ NÓ KHÔNG LÀM ĐƯỢC GÌ:
 * Đây là một tấm che vẽ bằng HTML. Người biết việc vẫn gỡ được nó bằng
 * công cụ lập trình của trình duyệt, vì mọi thứ chạy trong trình duyệt
 * đều nằm trong tay người ngồi trước máy. Nó chặn người tiện tay, không
 * chặn người cố tình.
 *
 * Thứ thật sự giữ dữ liệu vẫn là phân quyền ở máy chủ (Row Level
 * Security) và mật khẩu xoá — xem supabase/11_khoa_xoa_tren_may_chu.sql.
 */

/** Tên hai ô lưu trong bảng cai_dat. */
export const KHOA_PHUT = 'khoa_man_hinh_phut'

/** Nhớ trạng thái đang khoá, để bấm F5 không thoát ra được. */
const O_NHO = 'may-do-dang-khoa'

/** Những việc tính là "còn ngồi đó". */
const VIEC = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'wheel'] as const

export function KhoaManHinh() {
  const { hoSo, dangXuat } = useAuth()
  const { data: caiDat } = useCaiDat()

  const soPhut = Number(caiDat?.[KHOA_PHUT] ?? '0')
  const bat = Number.isFinite(soPhut) && soPhut > 0

  const [dangKhoa, setDangKhoa] = useState(false)
  const [matKhau, setMatKhau] = useState('')
  const [loi, setLoi] = useState('')
  const [dangMo, setDangMo] = useState(false)
  const [maCaptcha, setMaCaptcha] = useState<string | null>(null)
  const oCaptcha = useRef<TayCamHCaptcha>(null)
  const dongHo = useRef<number | null>(null)

  /* Khôi phục trạng thái khoá sau khi tải lại trang */
  useEffect(() => {
    if (!bat || !hoSo) return
    try {
      if (sessionStorage.getItem(O_NHO) === '1') setDangKhoa(true)
    } catch {
      /* trình duyệt chặn bộ nhớ thì thôi, không sao */
    }
  }, [bat, hoSo])

  const khoaLai = useCallback(() => {
    setDangKhoa(true)
    setMatKhau('')
    setLoi('')
    try {
      sessionStorage.setItem(O_NHO, '1')
    } catch {
      /* bỏ qua */
    }
  }, [])

  /* Đếm giờ nhàn rỗi */
  useEffect(() => {
    if (!bat || !hoSo || dangKhoa) return

    const datLai = () => {
      if (dongHo.current !== null) window.clearTimeout(dongHo.current)
      dongHo.current = window.setTimeout(khoaLai, soPhut * 60_000)
    }

    datLai()
    for (const v of VIEC) window.addEventListener(v, datLai, { passive: true })
    return () => {
      if (dongHo.current !== null) window.clearTimeout(dongHo.current)
      for (const v of VIEC) window.removeEventListener(v, datLai)
    }
  }, [bat, hoSo, dangKhoa, soPhut, khoaLai])

  const moKhoa = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hoSo?.email) {
      return setLoi('Hồ sơ này không có email, không mở khoá được. Hãy đăng xuất rồi vào lại.')
    }
    setDangMo(true)
    setLoi('')
    try {
      // Hỏi thẳng Supabase xem mật khẩu đúng không. Trình duyệt không
      // giữ mật khẩu nên không tự so được — mà như vậy mới đúng.
      const { error } = await supabase.auth.signInWithPassword({
        email: hoSo.email,
        password: matKhau,
        options: { captchaToken: maCaptcha ?? undefined },
      })
      if (error) {
        setMatKhau('')
        return setLoi('Mật khẩu không đúng.')
      }
      setDangKhoa(false)
      setMatKhau('')
      try {
        sessionStorage.removeItem(O_NHO)
      } catch {
        /* bỏ qua */
      }
    } catch {
      setLoi('Không hỏi được máy chủ. Kiểm tra lại đường mạng.')
    } finally {
      // Mã captcha chỉ dùng được MỘT LẦN. Không lấy mã mới thì lần gõ
      // lại sẽ nhận lỗi captcha chứ không phải lỗi mật khẩu.
      oCaptcha.current?.datLai()
      setDangMo(false)
    }
  }

  const thoatHan = async () => {
    try {
      sessionStorage.removeItem(O_NHO)
    } catch {
      /* bỏ qua */
    }
    setDangKhoa(false)
    await dangXuat()
  }

  if (!dangKhoa || !hoSo) return null

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/80 p-4 backdrop-blur-md">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Màn hình đang khoá"
        className="w-full max-w-sm rounded-2xl bg-paper p-6 text-center shadow-2xl"
      >
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
          <Lock className="size-7" />
        </span>

        <h2 className="mt-4 font-display text-xl font-bold text-slate-900">Màn hình đang khoá</h2>
        <p className="mt-1.5 text-sm text-slate-500">
          Đã để máy không dùng quá {soPhut} phút. Gõ mật khẩu đăng nhập của{' '}
          <strong className="text-slate-700">{hoSo.ho_ten}</strong> để làm tiếp.
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Việc bạn đang làm dở vẫn còn nguyên, không mất gì cả.
        </p>

        <form onSubmit={moKhoa} className="mt-5 space-y-3 text-left">
          <Input
            type="password"
            value={matKhau}
            onChange={(e) => setMatKhau(e.target.value)}
            autoFocus
            autoComplete="current-password"
            placeholder="Mật khẩu đăng nhập"
            loi={loi}
          />
          <OTichHCaptcha ref={oCaptcha} khiCoMa={setMaCaptcha} />

          <Button
            type="submit"
            className="w-full"
            dangTai={dangMo}
            disabled={matKhau.length === 0 || !maCaptcha}
          >
            Mở khoá
          </Button>
        </form>

        <button
          type="button"
          onClick={() => void thoatHan()}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700"
        >
          <LogOut className="size-4" />
          Không phải tôi — đăng xuất
        </button>

        <p className="mt-5 flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-left text-xs text-slate-500 ring-1 ring-slate-200">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-slate-400" />
          <span>
            Đây là tấm che chống người tiện tay ngồi vào. Dữ liệu thật được giữ bởi phân quyền ở
            máy chủ, không phải bởi màn hình này.
          </span>
        </p>
      </div>
    </div>,
    document.body,
  )
}
