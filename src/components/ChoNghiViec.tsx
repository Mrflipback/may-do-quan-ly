import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, KeyRound, ShieldAlert, TriangleAlert, UserMinus } from 'lucide-react'
import { Input } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { NHAN_VAI_TRO } from '@/lib/constants'
import type { NguoiDung, VaiTro } from '@/types'

/**
 * HỘP THOẠI CHO NGHỈ VIỆC — BA BƯỚC
 * ------------------------------------------------------------------
 * Ba bước này CỐ Ý KHÁC NHAU, không phải ba lần bấm "chắc chưa" giống
 * hệt. Bấm ba lần cùng một nút thì người ta bấm theo quán tính, chẳng
 * đọc gì — còn tệ hơn một lần hỏi tử tế.
 *
 *   Bước 1 — Nói rõ SẼ XẢY RA GÌ
 *   Bước 2 — Nói rõ KHÔNG LẤY LẠI ĐƯỢC, và cảnh báo riêng cho mấy
 *            trường hợp nặng (xoá Quản trị viên, xoá chính mình)
 *   Bước 3 — Bắt GÕ ĐÚNG TÊN người đó, cộng mật khẩu xoá
 *
 * Bước 3 là chốt thật: gõ đúng tên thì không thể bấm nhầm người được.
 */

interface Props {
  nguoi: NguoiDung | null
  /** Người đang bấm có phải chính người bị xoá không. */
  laChinhMinh: boolean
  /** Tiệm đã đặt mật khẩu xoá chưa. */
  daDatMatKhau: boolean
  /** Câu báo lỗi do máy chủ trả về. */
  loiMayChu?: string
  dangXuLy?: boolean
  dongY: (matKhau: string) => void
  huy: () => void
}

export function HopThoaiChoNghiViec({
  nguoi,
  laChinhMinh,
  daDatMatKhau,
  loiMayChu,
  dangXuLy = false,
  dongY,
  huy,
}: Props) {
  const [buoc, setBuoc] = useState(1)
  const [goTen, setGoTen] = useState('')
  const [matKhau, setMatKhau] = useState('')
  const [loi, setLoi] = useState('')

  // Mở hộp thoại mới thì quay về bước 1, dọn sạch mọi ô
  useEffect(() => {
    if (nguoi) {
      setBuoc(1)
      setGoTen('')
      setMatKhau('')
      setLoi('')
    }
  }, [nguoi])

  // Máy chủ báo sai thì dọn ô mật khẩu cho gõ lại
  useEffect(() => {
    if (loiMayChu) setMatKhau('')
  }, [loiMayChu])

  useEffect(() => {
    if (!nguoi) return
    const xuLy = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !dangXuLy) huy()
    }
    document.addEventListener('keydown', xuLy)
    return () => document.removeEventListener('keydown', xuLy)
  }, [nguoi, huy, dangXuLy])

  if (!nguoi) return null

  const ten = nguoi.ho_ten
  const vai = NHAN_VAI_TRO[nguoi.vai_tro as VaiTro] ?? nguoi.vai_tro
  const laQuanTri = nguoi.vai_tro === 'quan_tri'
  const tenKhop = goTen.trim() === ten.trim()

  const gui = (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenKhop) {
      return setLoi(`Chưa khớp. Gõ đúng “${ten}” thì mới bấm được.`)
    }
    setLoi('')
    dongY(matKhau)
  }

  return createPortal(
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/55 backdrop-blur-[2px]" />
      <div
        role="alertdialog"
        aria-modal="true"
        data-buoc={buoc}
        className="relative w-full max-w-lg rounded-2xl bg-paper p-6 shadow-2xl"
      >
        {/* Thanh đếm bước */}
        <div className="mb-4 flex items-center gap-2">
          {[1, 2, 3].map((b) => (
            <span
              key={b}
              className={
                'h-1.5 flex-1 rounded-full transition-colors ' +
                (b <= buoc ? 'bg-rose-500' : 'bg-slate-200')
              }
            />
          ))}
          <span className="ml-1 text-xs font-semibold text-slate-400">{buoc}/3</span>
        </div>

        {/* ---------------------------- Bước 1 ---------------------------- */}
        {buoc === 1 && (
          <>
            <div className="flex gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <UserMinus className="size-5" />
              </span>
              <div>
                <h2 className="font-display text-lg font-bold text-slate-900">
                  Cho {ten} nghỉ việc?
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">{vai}</p>
              </div>
            </div>

            <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-4 text-sm text-slate-600 ring-1 ring-slate-200">
              <p className="font-semibold text-slate-900">Bấm xong sẽ xảy ra ba việc:</p>
              <ul className="list-inside list-disc space-y-1">
                <li>Đánh dấu {ten} đã nghỉ việc</li>
                <li>Xoá hồ sơ khỏi tiệm — mất quyền vào phần mềm ngay lập tức</li>
                <li>
                  Xoá luôn <strong>email đăng nhập</strong> trong Supabase
                </li>
              </ul>
            </div>

            <p className="mt-3 text-sm text-slate-500">
              Khách hàng, đơn hàng và số đo do {ten} nhập <strong>vẫn giữ nguyên</strong>. Những
              việc {ten} đã làm vẫn còn trong nhật ký.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <NutPhu onClick={huy}>Thôi, để sau</NutPhu>
              <Button kieu="phu" iconPhai={<ArrowRight className="size-4" />} onClick={() => setBuoc(2)}>
                Tôi hiểu, đi tiếp
              </Button>
            </div>
          </>
        )}

        {/* ---------------------------- Bước 2 ---------------------------- */}
        {buoc === 2 && (
          <>
            <div className="flex gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <TriangleAlert className="size-5" />
              </span>
              <h2 className="font-display text-lg font-bold text-slate-900">
                Việc này không lấy lại được
              </h2>
            </div>

            <p className="mt-4 text-sm text-slate-600">
              Xoá xong thì <strong>không có nút hoàn tác</strong>. Muốn {ten} vào lại thì phải tạo
              tài khoản mới từ đầu, và người đó phải đăng ký lại bằng email.
            </p>

            {laQuanTri && (
              <p className="mt-3 flex gap-2 rounded-xl bg-rose-50 p-3.5 text-sm font-medium text-rose-800 ring-1 ring-rose-600/20">
                <ShieldAlert className="mt-0.5 size-4 shrink-0" />
                <span>
                  {ten} là <strong>Quản trị viên</strong>. Xoá xong là mất một người có toàn
                  quyền. Nếu đây là Quản trị viên cuối cùng thì cơ sở dữ liệu sẽ chặn lại — tiệm
                  không bao giờ bị khoá ngoài cửa.
                </span>
              </p>
            )}

            {laChinhMinh && (
              <p className="mt-3 flex gap-2 rounded-xl bg-rose-50 p-3.5 text-sm font-medium text-rose-800 ring-1 ring-rose-600/20">
                <ShieldAlert className="mt-0.5 size-4 shrink-0" />
                <span>
                  Đây là <strong>tài khoản của chính bạn</strong>. Xoá xong phần mềm sẽ đăng xuất
                  bạn ra ngay, và bạn không vào lại được trừ khi có người khác tạo tài khoản mới
                  cho bạn.
                </span>
              </p>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <NutPhu onClick={() => setBuoc(1)}>Quay lại</NutPhu>
              <Button kieu="phu" iconPhai={<ArrowRight className="size-4" />} onClick={() => setBuoc(3)}>
                Vẫn tiếp tục
              </Button>
            </div>
          </>
        )}

        {/* ---------------------------- Bước 3 ---------------------------- */}
        {buoc === 3 && (
          <>
            <div className="flex gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <KeyRound className="size-5" />
              </span>
              <h2 className="font-display text-lg font-bold text-slate-900">Xác nhận lần cuối</h2>
            </div>

            {!daDatMatKhau ? (
              <>
                <p className="mt-4 rounded-xl bg-amber-50 p-3.5 text-sm font-medium text-amber-800 ring-1 ring-amber-600/20">
                  Tiệm chưa đặt <strong>mật khẩu xoá</strong>. Kéo xuống thẻ “Mật khẩu xoá tài
                  khoản” ngay trong trang Cài đặt này để đặt trước đã, rồi quay lại.
                </p>
                <div className="mt-6 flex justify-end">
                  <NutPhu onClick={huy}>Đóng</NutPhu>
                </div>
              </>
            ) : (
              <form onSubmit={gui} className="mt-4 space-y-3">
                <Input
                  nhan={`Gõ đúng tên “${ten}” để xác nhận`}
                  value={goTen}
                  onChange={(e) => {
                    setGoTen(e.target.value)
                    setLoi('')
                  }}
                  autoFocus
                  autoComplete="off"
                  placeholder={ten}
                  loi={loi}
                  goiY="Gõ tay để không bấm nhầm người."
                />
                <Input
                  nhan="Mật khẩu xoá tài khoản"
                  batBuoc
                  type="password"
                  value={matKhau}
                  onChange={(e) => setMatKhau(e.target.value)}
                  autoComplete="off"
                  loi={loiMayChu}
                  iconTrai={<KeyRound className="size-4" />}
                />

                <div className="flex justify-end gap-2 pt-2">
                  <NutPhu onClick={() => setBuoc(2)} disabled={dangXuLy}>
                    Quay lại
                  </NutPhu>
                  <button
                    type="submit"
                    disabled={dangXuLy || !tenKhop || matKhau.length === 0}
                    className="h-10 rounded-lg bg-rose-600 px-4 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
                  >
                    {dangXuLy ? 'Đang xoá…' : 'Cho nghỉ việc và xoá tài khoản'}
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}

function NutPhu({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="h-10 rounded-lg bg-paper px-4 text-sm font-medium text-slate-700 ring-1 ring-slate-300 transition-colors hover:bg-slate-50 disabled:opacity-50"
    >
      {children}
    </button>
  )
}
