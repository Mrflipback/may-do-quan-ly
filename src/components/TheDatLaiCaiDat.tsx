import { useRef, useState } from 'react'
import { CircleCheck, KeyRound, RotateCcw, ShieldAlert, Users, X } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { Badge } from '@/components/ui/Badge'
import { useThongBao } from '@/components/ui/ThongBao'
import { useAuth } from '@/auth/AuthProvider'
import { supabase } from '@/lib/supabase'
import { dichLoi } from '@/lib/loi'
import { cauLoi, loiMatKhauMoi } from '@/lib/matKhauXoa'
import { OTichHCaptcha, type TayCamHCaptcha } from '@/components/OTichHCaptcha'
import {
  useChayDatLai,
  useHuyPhieu,
  useKyPhieu,
  useMatKhauDatLai,
  usePhieuDatLai,
  useTaoPhieu,
} from '@/data/datLaiCaiDat'

/**
 * Hỏi Supabase xem mật khẩu đăng nhập của chính người này có đúng không.
 *
 * Supabase đang bật chống bot nên phải kèm mã captcha, nếu không nó chặn
 * trước cả khi xét tới mật khẩu.
 */
async function dungMatKhauDangNhap(
  email: string | null,
  mk: string,
  maCaptcha: string | null,
): Promise<boolean> {
  if (!email) return false
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: mk,
    options: { captchaToken: maCaptcha ?? undefined },
  })
  return !error
}

function conBaoLau(han: string): string {
  const con = new Date(han).getTime() - Date.now()
  if (!Number.isFinite(con) || con <= 0) return 'đã hết hạn'
  const gio = Math.floor(con / 3_600_000)
  return gio >= 1 ? `còn ${gio} tiếng` : `còn ${Math.max(1, Math.round(con / 60_000))} phút`
}

/* ================================================================== */
/*  Thẻ đặt mật khẩu khôi phục                                         */
/* ================================================================== */

export function TheMatKhauDatLai() {
  const tb = useThongBao()
  const mk = useMatKhauDatLai()
  const [hienTai, setHienTai] = useState('')
  const [moi, setMoi] = useState('')
  const [lai, setLai] = useState('')
  const [loi, setLoi] = useState('')

  const gui = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoi('')
    const l = loiMatKhauMoi(moi)
    if (l) return setLoi(l)
    if (moi !== lai) return setLoi('Hai ô mật khẩu mới chưa giống nhau.')
    try {
      const kq = await mk.dat(moi, hienTai)
      if (!kq.ok) {
        setHienTai('')
        return setLoi(cauLoi(kq))
      }
      setHienTai('')
      setMoi('')
      setLai('')
      tb.thanhCong('Đã lưu mật khẩu khôi phục cài đặt.')
    } catch (err) {
      setLoi(dichLoi(err))
    }
  }

  return (
    <Card>
      <CardHeader
        tieuDe="Mật khẩu khôi phục cài đặt"
        moTa={mk.daDat ? 'Đang bật' : 'Chưa đặt — chưa khôi phục được'}
      />
      <CardBody className="space-y-4">
        <div className="flex gap-3">
          <KeyRound
            className={mk.daDat ? 'size-5 shrink-0 text-emerald-600' : 'size-5 shrink-0 text-amber-600'}
          />
          <p className="text-sm text-slate-600">
            Mật khẩu <strong>thứ ba</strong>, khác cả mật khẩu đăng nhập lẫn mật khẩu xoá. Chỉ
            dùng cho việc đưa cài đặt hệ thống về mặc định.
          </p>
        </div>

        <form onSubmit={gui} className="space-y-3">
          {mk.daDat && (
            <Input
              nhan="Mật khẩu khôi phục hiện tại"
              type="password"
              value={hienTai}
              onChange={(e) => setHienTai(e.target.value)}
              autoComplete="off"
            />
          )}
          <Input
            nhan={mk.daDat ? 'Mật khẩu mới' : 'Đặt mật khẩu khôi phục'}
            type="password"
            value={moi}
            onChange={(e) => setMoi(e.target.value)}
            autoComplete="new-password"
            placeholder="Ít nhất 6 ký tự"
          />
          <Input
            nhan="Nhập lại cho chắc"
            type="password"
            value={lai}
            onChange={(e) => setLai(e.target.value)}
            autoComplete="new-password"
          />
          {loi && (
            <p className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700 ring-1 ring-rose-600/20">
              {loi}
            </p>
          )}
          <Button type="submit" dangTai={mk.dangLuu}>
            {mk.daDat ? 'Đổi mật khẩu' : 'Đặt mật khẩu'}
          </Button>
        </form>
      </CardBody>
    </Card>
  )
}

/* ================================================================== */
/*  Thẻ phiếu khôi phục                                                */
/* ================================================================== */

export function TheDatLaiCaiDat() {
  const tb = useThongBao()
  const { hoSo } = useAuth()
  const phieu = usePhieuDatLai()
  const mk = useMatKhauDatLai()
  const taoPhieu = useTaoPhieu()
  const kyPhieu = useKyPhieu()
  const huyPhieu = useHuyPhieu()
  const chay = useChayDatLai()

  const [lyDo, setLyDo] = useState('')
  const [mkDangNhap, setMkDangNhap] = useState('')
  const [maCaptcha, setMaCaptcha] = useState<string | null>(null)
  const oCaptcha = useRef<TayCamHCaptcha>(null)
  const [mkKhoiPhuc, setMkKhoiPhuc] = useState('')
  const [loi, setLoi] = useState('')

  const p = phieu.data
  const duChuKy = p ? p.da_duyet >= p.tong_tai_khoan : false

  const tao = async () => {
    setLoi('')
    try {
      const kq = await taoPhieu.mutateAsync(lyDo.trim())
      if (!kq.ok) return setLoi(cauLoi(kq))
      setLyDo('')
      tb.thanhCong('Đã tạo phiếu. Giờ chờ mọi người trong tiệm bấm đồng ý.')
    } catch (e) {
      setLoi(dichLoi(e))
    }
  }

  /** Ký đồng ý. Hỏi lại mật khẩu đăng nhập để chặn người ngồi vào máy đang mở. */
  const ky = async () => {
    if (!p) return
    setLoi('')
    const dung = await dungMatKhauDangNhap(hoSo?.email ?? null, mkDangNhap, maCaptcha)
    // Mã captcha chỉ dùng được một lần, kể cả khi mật khẩu đúng
    oCaptcha.current?.datLai()
    if (!dung) {
      setMkDangNhap('')
      return setLoi('Mật khẩu đăng nhập không đúng.')
    }
    try {
      const kq = await kyPhieu.mutateAsync(p.id)
      if (!kq.ok) return setLoi(cauLoi(kq))
      setMkDangNhap('')
      tb.thanhCong('Đã ghi nhận bạn đồng ý.')
    } catch (e) {
      setLoi(dichLoi(e))
    }
  }

  /** Bấm nút cuối. Hỏi CẢ HAI mật khẩu. */
  const batDau = async () => {
    if (!p) return
    setLoi('')
    const dungMk = await dungMatKhauDangNhap(hoSo?.email ?? null, mkDangNhap, maCaptcha)
    oCaptcha.current?.datLai()
    if (!dungMk) {
      setMkDangNhap('')
      return setLoi('Mật khẩu đăng nhập không đúng.')
    }
    try {
      const kq = await chay.mutateAsync({ id: p.id, matKhau: mkKhoiPhuc })
      if (!kq.ok) {
        setMkKhoiPhuc('')
        return setLoi(cauLoi(kq))
      }
      // Giao diện lưu trên từng máy, máy chủ không với tới — dọn ở đây
      try {
        localStorage.removeItem('may-do-giao-dien-v2')
        localStorage.removeItem('may-do-giao-dien')
      } catch {
        /* trình duyệt chặn bộ nhớ thì thôi */
      }
      setMkDangNhap('')
      setMkKhoiPhuc('')
      tb.thanhCong('Đã đưa cài đặt hệ thống về mặc định. Tải lại trang để thấy thay đổi.')
    } catch (e) {
      setLoi(dichLoi(e))
    }
  }

  return (
    <Card>
      <CardHeader
        tieuDe="Khôi phục cài đặt hệ thống"
        moTa="Đưa cài đặt bảo mật và giao diện về mặc định — cần cả tiệm đồng ý"
      />
      <CardBody className="space-y-4">
        <div className="flex gap-3">
          <ShieldAlert className="size-5 shrink-0 text-amber-600" />
          <div className="space-y-2 text-sm text-slate-600">
            <p>
              Đưa về mặc định: <strong>khoá màn hình</strong>, <strong>nuốt phím tắt</strong>,{' '}
              <strong>giờ tiệm đóng cửa</strong>, và <strong>giao diện riêng</strong> của máy
              này.
            </p>
            <p className="text-slate-500">
              <strong className="text-slate-700">Không đụng tới:</strong> thông tin tiệm, khách
              hàng, đơn hàng, tiền nong — không mất một dòng nào. Mật khẩu xoá và mật khẩu khôi
              phục cũng giữ nguyên.
            </p>
          </div>
        </div>

        {!mk.daDat ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm font-medium text-amber-800 ring-1 ring-amber-600/20">
            Chưa đặt <strong>mật khẩu khôi phục cài đặt</strong>. Hãy đặt ở thẻ ngay trên đây
            trước đã.
          </p>
        ) : !p ? (
          /* ---------- Chưa có phiếu: tạo phiếu ---------- */
          <div className="space-y-3 border-t border-slate-200/80 pt-4">
            <Input
              nhan="Vì sao cần khôi phục"
              value={lyDo}
              onChange={(e) => setLyDo(e.target.value)}
              placeholder="Ví dụ: đặt nhầm giờ khoá màn hình, không ai vào được"
              goiY="Câu này hiện cho mọi người trong tiệm đọc trước khi họ bấm đồng ý."
            />
            {loi && (
              <p className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700 ring-1 ring-rose-600/20">
                {loi}
              </p>
            )}
            <Button
              kieu="phu"
              iconTrai={<RotateCcw className="size-4" />}
              onClick={() => void tao()}
              dangTai={taoPhieu.isPending}
            >
              Tạo phiếu xin khôi phục
            </Button>
          </div>
        ) : (
          /* ---------- Đang có phiếu ---------- */
          <div className="space-y-4 border-t border-slate-200/80 pt-4">
            <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <Users className="size-4 text-slate-500" />
                <span className="font-semibold text-slate-900">
                  {p.da_duyet}/{p.tong_tai_khoan} người đã đồng ý
                </span>
                <Badge
                  className={
                    duChuKy
                      ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                      : 'bg-amber-50 text-amber-700 ring-amber-600/20'
                  }
                >
                  {duChuKy ? 'đủ chữ ký' : conBaoLau(p.han_den)}
                </Badge>
              </div>

              <p className="mt-2 text-sm text-slate-600">
                {p.ten_nguoi_yeu_cau} tạo phiếu
                {p.ly_do ? (
                  <>
                    {' '}
                    — <em>“{p.ly_do}”</em>
                  </>
                ) : null}
              </p>

              {p.ai_chua_ky.length > 0 && (
                <p className="mt-2 text-sm text-slate-500">
                  Chưa bấm: <strong className="text-slate-700">{p.ai_chua_ky.join(', ')}</strong>
                </p>
              )}
            </div>

            {loi && (
              <p className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700 ring-1 ring-rose-600/20">
                {loi}
              </p>
            )}

            {!p.toi_da_ky ? (
              /* Tôi chưa ký */
              <div className="space-y-3">
                <Input
                  nhan="Mật khẩu đăng nhập của bạn"
                  type="password"
                  value={mkDangNhap}
                  onChange={(e) => setMkDangNhap(e.target.value)}
                  autoComplete="current-password"
                  goiY="Hỏi lại để người ngồi vào máy đang mở sẵn không bấm hộ bạn được."
                />
                <OTichHCaptcha ref={oCaptcha} khiCoMa={setMaCaptcha} />
                <Button
                  iconTrai={<CircleCheck className="size-4" />}
                  onClick={() => void ky()}
                  dangTai={kyPhieu.isPending}
                  disabled={mkDangNhap.length === 0 || !maCaptcha}
                >
                  Tôi đồng ý khôi phục
                </Button>
              </div>
            ) : duChuKy ? (
              /* Đủ chữ ký — bấm nút cuối */
              <div className="space-y-3 rounded-xl bg-rose-50/60 p-4 ring-1 ring-rose-200">
                <p className="text-sm font-medium text-rose-800">
                  Đủ chữ ký. Gõ cả hai mật khẩu để chạy.
                </p>
                <Input
                  nhan="Mật khẩu đăng nhập của bạn"
                  type="password"
                  value={mkDangNhap}
                  onChange={(e) => setMkDangNhap(e.target.value)}
                  autoComplete="current-password"
                />
                <Input
                  nhan="Mật khẩu khôi phục cài đặt"
                  type="password"
                  value={mkKhoiPhuc}
                  onChange={(e) => setMkKhoiPhuc(e.target.value)}
                  autoComplete="off"
                />
                <OTichHCaptcha ref={oCaptcha} khiCoMa={setMaCaptcha} />
                <Button
                  kieu="nguyHiem"
                  iconTrai={<RotateCcw className="size-4" />}
                  onClick={() => void batDau()}
                  dangTai={chay.isPending}
                  disabled={mkDangNhap.length === 0 || mkKhoiPhuc.length === 0 || !maCaptcha}
                >
                  Khôi phục cài đặt ngay
                </Button>
              </div>
            ) : (
              <p className="rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-600 ring-1 ring-slate-200">
                Bạn đã đồng ý. Chờ nốt những người còn lại — họ vào mục Cài đặt này là thấy
                phiếu.
              </p>
            )}

            <button
              type="button"
              onClick={() => void huyPhieu.mutateAsync(p.id)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700"
            >
              <X className="size-4" />
              Huỷ phiếu này
            </button>
          </div>
        )}
      </CardBody>
    </Card>
  )
}
