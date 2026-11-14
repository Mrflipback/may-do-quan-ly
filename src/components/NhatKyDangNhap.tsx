import { useMemo, useState } from 'react'
import {
  Download,
  Globe,
  KeyRound,
  LogIn,
  LogOut,
  MailQuestion,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input, Select } from '@/components/ui/Field'
import { StatCard } from '@/components/ui/StatCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { BaoLoi, DangTaiBang } from '@/components/ui/TrangThaiTai'
import { useThongBao } from '@/components/ui/ThongBao'
import { NHAN_VAI_TRO } from '@/lib/constants'
import { cn, dinhDangSo } from '@/lib/utils'
import { dichLoi } from '@/lib/loi'
import { useDanhSachNguoiDung } from '@/data/heThong'
import {
  SO_DONG_TOI_DA,
  taiDangNhapCsv,
  useNhatKyDangNhap,
  useTongKetDangNhap,
  type BoLocDangNhap,
  type DongDangNhap,
  type LoaiSuKienDangNhap,
} from '@/data/nhatKyDangNhap'
import type { VaiTro } from '@/types'

/* ------------------------------------------------------------------ */
/*  Nhãn và màu cho từng loại việc                                     */
/* ------------------------------------------------------------------ */

const NHAN_VIEC: Record<LoaiSuKienDangNhap, string> = {
  vao: 'Đăng nhập',
  xin_doi_mk: 'Xin đặt lại mật khẩu',
  doi_mk_xong: 'Đã đổi mật khẩu',
  ra: 'Đăng xuất',
  khac: 'Việc khác',
}

const MAU_VIEC: Record<LoaiSuKienDangNhap, string> = {
  vao: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  xin_doi_mk: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  doi_mk_xong: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  ra: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  khac: 'bg-slate-100 text-slate-600 ring-slate-500/20',
}

const HINH_VIEC: Record<LoaiSuKienDangNhap, typeof LogIn> = {
  vao: LogIn,
  xin_doi_mk: MailQuestion,
  doi_mk_xong: KeyRound,
  ra: LogOut,
  khac: Globe,
}

/* ------------------------------------------------------------------ */
/*  Tiện ích ngày giờ                                                  */
/* ------------------------------------------------------------------ */

function ngayISO(lui = 0): string {
  const d = new Date()
  d.setDate(d.getDate() - lui)
  const hai = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${hai(d.getMonth() + 1)}-${hai(d.getDate())}`
}

/**
 * Ngày theo giờ địa phương, dạng yyyy-mm-dd.
 *
 * KHÔNG dùng toISOString() ở đây — hàm đó trả về ngày theo giờ quốc tế,
 * mà Việt Nam sớm hơn 7 tiếng, nên từ nửa đêm tới 7 giờ sáng mọi việc
 * sẽ bị xếp nhầm sang hôm trước.
 */
function ngayDiaPhuong(d: Date): string {
  const hai = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${hai(d.getMonth() + 1)}-${hai(d.getDate())}`
}

function gioPhut(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

function ngayDaiDong(ngay: string): string {
  const d = new Date(`${ngay}T12:00:00`)
  if (Number.isNaN(d.getTime())) return ngay
  const chu = d.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return chu.charAt(0).toUpperCase() + chu.slice(1)
}

function luc(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('vi-VN')
}

/* ------------------------------------------------------------------ */
/*  Một dòng trong sổ                                                  */
/* ------------------------------------------------------------------ */

function DongDN({ d }: { d: DongDangNhap }) {
  const Hinh = HINH_VIEC[d.loai_su_kien] ?? Globe
  const vai = NHAN_VAI_TRO[d.vai_tro as VaiTro] ?? d.vai_tro

  return (
    <li className="flex gap-3 px-4 py-3 transition-colors hover:bg-slate-50/70 sm:px-5">
      <span
        className={cn(
          'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset',
          MAU_VIEC[d.loai_su_kien],
        )}
      >
        <Hinh className="size-4" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-semibold text-slate-900">{d.ten_nguoi}</span>
          {vai && <span className="text-xs text-slate-400">{vai}</span>}
          <Badge className={MAU_VIEC[d.loai_su_kien]}>{NHAN_VIEC[d.loai_su_kien]}</Badge>
          {d.qua_quen_mk && (
            <Badge className="bg-amber-50 text-amber-700 ring-amber-600/20">
              có vẻ vào bằng liên kết quên mật khẩu
            </Badge>
          )}
        </div>

        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-slate-500">
          <span className="tabular-nums">{gioPhut(d.thoi_diem)}</span>
          {d.dia_chi_ip ? (
            <span className="inline-flex items-center gap-1 font-mono text-xs text-slate-600">
              <Globe className="size-3.5 text-slate-400" />
              {d.dia_chi_ip}
            </span>
          ) : (
            <span className="text-xs text-slate-400">không rõ IP</span>
          )}
          {d.email && <span className="truncate text-xs text-slate-400">{d.email}</span>}
        </p>
      </div>
    </li>
  )
}

/* ------------------------------------------------------------------ */
/*  Thẻ "Đăng nhập" trong trang Nhật ký                                */
/* ------------------------------------------------------------------ */

export function NhatKyDangNhap() {
  const tb = useThongBao()
  const nhanSu = useDanhSachNguoiDung()

  const [loc, setLoc] = useState<BoLocDangNhap>({
    tuNgay: ngayISO(29),
    denNgay: ngayISO(0),
    nguoiId: '',
    loai: 'tat_ca',
  })
  const [dangTaiFile, setDangTaiFile] = useState(false)

  const doiLoc = <K extends keyof BoLocDangNhap>(khoa: K, v: BoLocDangNhap[K]) =>
    setLoc((c) => ({ ...c, [khoa]: v }))

  const so = useNhatKyDangNhap(loc, true)
  const tongKet = useTongKetDangNhap(loc, true)
  const tk = tongKet.data

  /** Gom theo ngày để đọc như một cuốn sổ. */
  const theoNgay = useMemo(() => {
    const nhom = new Map<string, DongDangNhap[]>()
    for (const d of so.data ?? []) {
      const ngay = ngayDiaPhuong(new Date(d.thoi_diem))
      const cu = nhom.get(ngay) ?? []
      cu.push(d)
      nhom.set(ngay, cu)
    }
    return [...nhom.entries()]
  }, [so.data])

  const taiFile = async () => {
    setDangTaiFile(true)
    try {
      const n = await taiDangNhapCsv(loc, (l) => NHAN_VIEC[l] ?? l)
      tb.thanhCong(`Đã tải ${dinhDangSo(n)} dòng ra file CSV.`)
    } catch (e) {
      tb.loi(dichLoi(e))
    } finally {
      setDangTaiFile(false)
    }
  }

  const soDong = so.data?.length ?? 0
  const dayTran = soDong >= SO_DONG_TOI_DA

  return (
    <div>
      {/* ----------------------------- Bộ lọc ----------------------------- */}
      <Card className="mb-5">
        <CardBody className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Input
            nhan="Từ ngày"
            type="date"
            value={loc.tuNgay}
            onChange={(e) => doiLoc('tuNgay', e.target.value)}
          />
          <Input
            nhan="Đến ngày"
            type="date"
            value={loc.denNgay}
            onChange={(e) => doiLoc('denNgay', e.target.value)}
          />
          <Select
            nhan="Người"
            value={loc.nguoiId}
            onChange={(e) => doiLoc('nguoiId', e.target.value)}
          >
            <option value="">Tất cả mọi người</option>
            {(nhanSu.data ?? []).map((u) => (
              <option key={u.id} value={u.id}>
                {u.ho_ten}
              </option>
            ))}
          </Select>
          <Select
            nhan="Loại việc"
            value={loc.loai}
            onChange={(e) => doiLoc('loai', e.target.value as BoLocDangNhap['loai'])}
          >
            <option value="tat_ca">Tất cả</option>
            <option value="chi_vao">Chỉ lần đăng nhập</option>
            <option value="chi_mat_khau">Chỉ việc đổi mật khẩu</option>
          </Select>
          <div className="flex items-end">
            <Button
              kieu="phu"
              className="w-full"
              iconTrai={<Download className="size-4" />}
              onClick={() => void taiFile()}
              dangTai={dangTaiFile}
            >
              Tải ra Excel
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* --------------------------- Mấy con số --------------------------- */}
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          nhan="Số lần đăng nhập"
          giaTri={dinhDangSo(tk?.so_lan_vao ?? 0)}
          icon={<LogIn className="size-4.5" />}
          mauIcon="bg-emerald-50 text-emerald-700"
          chuThich={tk?.lan_gan_nhat ? `Gần nhất: ${luc(tk.lan_gan_nhat)}` : undefined}
        />
        <StatCard
          nhan="Số người đã vào"
          giaTri={dinhDangSo(tk?.so_nguoi ?? 0)}
          icon={<Users className="size-4.5" />}
          mauIcon="bg-brand-50 text-brand-700"
        />
        <StatCard
          nhan="Số địa chỉ IP khác nhau"
          giaTri={dinhDangSo(tk?.so_ip ?? 0)}
          icon={<Globe className="size-4.5" />}
          mauIcon="bg-sky-50 text-sky-700"
          chuThich="Nhiều IP lạ là điều đáng để ý"
        />
        <StatCard
          nhan="Vào bằng quên mật khẩu"
          giaTri={dinhDangSo(tk?.so_lan_quen ?? 0)}
          icon={<KeyRound className="size-4.5" />}
          mauIcon="bg-amber-50 text-amber-700"
        />
      </div>

      {/* ------------------------------ Cuốn sổ ------------------------------ */}
      <Card>
        <CardHeader
          tieuDe="Sổ đăng nhập"
          moTa="Do máy chủ Supabase tự ghi — phần mềm chỉ đọc, không ai sửa được dòng nào"
        />
        <CardBody className="p-0">
          {so.isLoading ? (
            <DangTaiBang />
          ) : so.isError ? (
            <div className="p-4">
              <BaoLoi loi={so.error} thuLai={() => void so.refetch()} />
              <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-600/20">
                Nếu báo lỗi là <em>không tìm thấy hàm</em>, nghĩa là bạn chưa chạy file{' '}
                <code className="font-mono">supabase/10_nhat_ky_dang_nhap.sql</code> trên Supabase.
                Mở hướng dẫn cài đặt để xem cách chạy.
              </p>
            </div>
          ) : theoNgay.length === 0 ? (
            <EmptyState
              icon={<ShieldCheck className="size-6" />}
              tieuDe="Chưa có lần đăng nhập nào trong khoảng này"
              moTa="Thử nới rộng khoảng ngày ở trên."
            />
          ) : (
            <>
              {dayTran && (
                <p className="border-b border-slate-200/80 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 sm:px-5">
                  Khoảng ngày này có nhiều hơn {dinhDangSo(SO_DONG_TOI_DA)} dòng. Đây là{' '}
                  {dinhDangSo(SO_DONG_TOI_DA)} dòng mới nhất — thu hẹp khoảng ngày để xem cho đủ,
                  hoặc tải ra Excel.
                </p>
              )}
              <div className="divide-y divide-slate-200/70">
                {theoNgay.map(([ngay, ds]) => (
                  <section key={ngay}>
                    <h3 className="sticky top-0 z-10 bg-slate-50/95 px-4 py-2 text-xs font-semibold tracking-wide text-slate-500 uppercase backdrop-blur sm:px-5">
                      {ngayDaiDong(ngay)} · {dinhDangSo(ds.length)} việc
                    </h3>
                    <ul className="divide-y divide-slate-200/60">
                      {ds.map((d, i) => (
                        <DongDN key={`${d.thoi_diem}-${i}`} d={d} />
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </>
          )}
        </CardBody>
      </Card>

      {/* ---------------------------- Nói thẳng ---------------------------- */}
      <Card className="mt-5">
        <CardBody className="space-y-2 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">Vài điều nên biết về cuốn sổ này</p>
          <p>
            <strong>Địa chỉ IP cho biết cái mạng, không cho biết con người.</strong> Cả tiệm dùng
            chung một wifi thì mọi người hiện cùng một IP. Dùng 4G thì IP đổi luôn. Nên IP lạ là
            thứ đáng <em>để ý</em>, không phải bằng chứng.
          </p>
          <p>
            <strong>Nhãn “có vẻ vào bằng liên kết quên mật khẩu” là suy đoán.</strong> Phần mềm
            thấy ngay trước lần vào đó có một lần xin đặt lại mật khẩu của cùng người, trong vòng
            một tiếng. Dòng xin đặt lại vẫn hiện riêng ở trên để bạn tự đối chiếu.
          </p>
          <p>
            <strong>Sổ này không ghi lần gõ sai mật khẩu.</strong> Máy chủ chỉ ghi những lần vào
            được. Nếu bạn muốn thấy cả lần gõ sai thì nói, phần đó phải làm thêm trong phần mềm.
          </p>
        </CardBody>
      </Card>
    </div>
  )
}
