import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Database, ExternalLink, Globe, Inbox, MapPin, Phone, Ruler, Trash2, Truck } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { BaoLoi, DangTaiBang } from '@/components/ui/TrangThaiTai'
import { HopThoaiXacNhan, useThongBao } from '@/components/ui/ThongBao'
import {
  useDanhSachDonOnline,
  useDoiTrangThaiDonOnline,
  useTaoDonTuPhieu,
  useXoaDonOnline,
  useXoaPhieuDaHuy,
} from '@/data/datMayOnline'
import { NHAN_LOAI_TRANG_PHUC, TAT_CA_CHI_SO } from '@/lib/constants'
import { dinhDangNgay, dinhDangNgayGio } from '@/lib/utils'
import { dichLoi } from '@/lib/loi'
import { useAuth } from '@/auth/AuthProvider'
import type { DonOnline, TrangThaiDonOnline } from '@/types'

const BO_LOC: { ma: TrangThaiDonOnline | 'tat_ca'; nhan: string }[] = [
  { ma: 'moi', nhan: 'Phiếu mới' },
  { ma: 'da_lien_he', nhan: 'Đã liên hệ' },
  { ma: 'da_tao_don', nhan: 'Đã tạo đơn' },
  { ma: 'huy', nhan: 'Đã huỷ' },
  { ma: 'tat_ca', nhan: 'Tất cả' },
]

const MAU_TRANG_THAI: Record<TrangThaiDonOnline, string> = {
  moi: 'bg-gold-100 text-gold-700',
  da_lien_he: 'bg-brand-100 text-brand-800',
  da_tao_don: 'bg-emerald-100 text-emerald-700',
  huy: 'bg-slate-200 text-slate-600',
}

const NHAN_TRANG_THAI: Record<TrangThaiDonOnline, string> = {
  moi: 'Phiếu mới',
  da_lien_he: 'Đã liên hệ',
  da_tao_don: 'Đã tạo đơn',
  huy: 'Đã huỷ',
}

function tenChiSo(ma: string): string {
  return TAT_CA_CHI_SO.find((c) => c.ma === ma)?.ten ?? ma
}

export function OnlineOrdersPage() {
  const [loc, setLoc] = useState<TrangThaiDonOnline | 'tat_ca'>('moi')
  const danhSach = useDanhSachDonOnline(loc)
  const doiTrangThai = useDoiTrangThaiDonOnline()
  const taoDon = useTaoDonTuPhieu()
  const xoaMot = useXoaDonOnline()
  const xoaHet = useXoaPhieuDaHuy()
  const { laQuanTri } = useAuth()
  const [phieuXoa, setPhieuXoa] = useState<DonOnline | null>(null)
  const [hoiXoaHet, setHoiXoaHet] = useState(false)
  const tb = useThongBao()
  const dieuHuong = useNavigate()
  const [dangLam, setDangLam] = useState<string | null>(null)

  async function doi(phieu: DonOnline, trangThai: TrangThaiDonOnline) {
    setDangLam(phieu.id)
    try {
      await doiTrangThai.mutateAsync({ id: phieu.id, trangThai })
      tb.thanhCong(`Phiếu ${phieu.ma_phieu}: ${NHAN_TRANG_THAI[trangThai]}.`)
    } catch (e) {
      tb.loi(dichLoi(e))
    } finally {
      setDangLam(null)
    }
  }

  async function tao(phieu: DonOnline) {
    setDangLam(phieu.id)
    try {
      const kq = await taoDon.mutateAsync(phieu)
      tb.thanhCong(
        `${kq.khachMoi ? `Đã tạo khách mới ${kq.maKhach}` : `Khách cũ ${kq.maKhach}`} — đơn ${kq.maDon}. ` +
          'Bạn vào Đơn hàng điền đơn giá và tiền cọc.',
      )
      dieuHuong('/don-hang')
    } catch (e) {
      tb.loi(dichLoi(e))
    } finally {
      setDangLam(null)
    }
  }

  async function xoaPhieu() {
    const p = phieuXoa
    if (!p) return
    try {
      const soDong = await xoaMot.mutateAsync(p.id)
      if (soDong === 0) {
        tb.loi('Không xoá được. Chỉ Quản trị viên mới xoá được phiếu.')
      } else {
        tb.thanhCong(`Đã xoá hẳn phiếu ${p.ma_phieu}.`)
      }
    } catch (e) {
      tb.loi(dichLoi(e))
    } finally {
      setPhieuXoa(null)
    }
  }

  async function donPhieuHuy() {
    try {
      const soDong = await xoaHet.mutateAsync()
      if (soDong === 0) {
        tb.loi('Không xoá được phiếu nào. Chỉ Quản trị viên mới xoá được phiếu.')
      } else {
        tb.thanhCong(`Đã xoá ${soDong} phiếu đã huỷ.`)
      }
    } catch (e) {
      tb.loi(dichLoi(e))
    } finally {
      setHoiXoaHet(false)
    }
  }

  const ds = danhSach.data ?? []
  const soPhieuHuy = ds.filter((p) => p.trang_thai === 'huy').length

  // Chua chay file 05_dat_may_online.sql thi bang chua ton tai.
  // Day la viec phai lam mot lan, nen chi dan thang thay vi bao loi kho hieu.
  const maLoi = (danhSach.error as { code?: string } | null)?.code
  const thieuBang = danhSach.isError && (maLoi === 'PGRST205' || maLoi === '42P01')

  return (
    <div className="space-y-5">
      <PageHeader
        tieuDe="Đơn đặt online"
        moTa="Phiếu khách tự gửi từ trang web của tiệm. Tạo đơn là phần mềm tự thêm khách, hồ sơ số đo và đơn hàng."
        hanhDong={
          <Link to="/tiem" target="_blank" rel="noopener noreferrer">
            <Button kieu="phu" iconTrai={<Globe className="size-4" />}>
              Xem trang khách đặt
            </Button>
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {soPhieuHuy > 0 && laQuanTri && (
          <Button
            kieu="nguyHiem"
            co="nho"
            className="order-last ml-auto"
            iconTrai={<Trash2 className="size-4" />}
            onClick={() => setHoiXoaHet(true)}
          >
            Xoá hẳn {soPhieuHuy} phiếu đã huỷ
          </Button>
        )}
        {BO_LOC.map((b) => (
          <button
            key={b.ma}
            type="button"
            onClick={() => setLoc(b.ma)}
            className={
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors ' +
              (loc === b.ma
                ? 'bg-brand-700 text-white'
                : 'bg-paper text-slate-600 ring-1 ring-slate-300 hover:bg-slate-50')
            }
          >
            {b.nhan}
          </button>
        ))}
      </div>

      {danhSach.isPending ? (
        <DangTaiBang />
      ) : thieuBang ? (
        <Card>
          <CardBody className="space-y-4">
            <span className="flex size-12 items-center justify-center rounded-xl bg-gold-100 text-gold-700">
              <Database className="size-6" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Còn một bước nữa là chạy được</h3>
              <p className="mt-1.5 max-w-2xl text-sm text-slate-600">
                Supabase chưa có bảng lưu phiếu đặt online. Đây là việc làm một lần duy nhất, khoảng
                một phút.
              </p>
            </div>
            <ol className="max-w-2xl list-decimal space-y-2 pl-5 text-sm text-slate-700">
              <li>
                Mở <b>Supabase</b> &rsaquo; dự án của tiệm &rsaquo; <b>SQL Editor</b> &rsaquo;{' '}
                <b>New query</b>.
              </li>
              <li>
                Mở file <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">supabase/05_dat_may_online.sql</code>{' '}
                trong thư mục phần mềm bằng Notepad, chọn tất cả rồi copy.
              </li>
              <li>Dán vào ô SQL, bấm <b>Run</b>. Thấy chữ Success là xong.</li>
              <li>Quay lại đây bấm <b>Tải lại</b>.</li>
            </ol>
            <p className="max-w-2xl text-sm text-slate-500">
              Trang web khách xem vẫn mở bình thường trong lúc chờ, chỉ nút gửi phiếu là chưa dùng
              được.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => void danhSach.refetch()}>Tải lại</Button>
              <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">
                <Button kieu="phu" iconTrai={<ExternalLink className="size-4" />}>
                  Mở Supabase
                </Button>
              </a>
            </div>
          </CardBody>
        </Card>
      ) : danhSach.isError ? (
        <BaoLoi loi={danhSach.error} thuLai={() => void danhSach.refetch()} />
      ) : ds.length === 0 ? (
        <EmptyState
          icon={<Inbox className="size-7" />}
          tieuDe={loc === 'moi' ? 'Chưa có phiếu mới nào' : 'Không có phiếu nào ở mục này'}
          moTa="Khách đặt may trên trang web của tiệm thì phiếu hiện ngay tại đây."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {ds.map((p) => {
            const soDo = Object.entries(p.so_do ?? {})
            const ban = dangLam === p.id
            return (
              <Card key={p.id}>
                <CardBody className="space-y-4">
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs text-slate-500">{p.ma_phieu}</p>
                      <h3 className="truncate text-lg font-bold text-slate-900">{p.ho_ten}</h3>
                      <p className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Phone className="size-3.5" />
                        <span className="select-all tabular-nums">{p.so_dien_thoai}</span>
                      </p>
                    </div>
                    <Badge className={'ml-auto ' + MAU_TRANG_THAI[p.trang_thai]}>
                      {NHAN_TRANG_THAI[p.trang_thai]}
                    </Badge>
                  </div>

                  <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-slate-500">Trang phục</dt>
                      <dd className="font-medium text-slate-900">
                        {NHAN_LOAI_TRANG_PHUC[p.loai_trang_phuc]} × {p.so_luong}
                        {p.mo_ta_trang_phuc && (
                          <span className="font-normal text-slate-600"> — {p.mo_ta_trang_phuc}</span>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Ngày khách cần</dt>
                      <dd className="font-medium text-slate-900">
                        {p.ngay_can_lay ? dinhDangNgay(p.ngay_can_lay) : 'Khách chưa chọn'}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-xs text-slate-500">Nhận hàng</dt>
                      <dd className="flex items-start gap-1.5 font-medium text-slate-900">
                        {p.nhan_hang === 'giao_tan_noi' ? (
                          <>
                            <Truck className="mt-0.5 size-3.5 shrink-0" />
                            <span>Giao tận nơi — {p.dia_chi}</span>
                          </>
                        ) : (
                          <>
                            <MapPin className="mt-0.5 size-3.5 shrink-0" />
                            <span>Khách đến tiệm lấy</span>
                          </>
                        )}
                      </dd>
                    </div>
                  </dl>

                  {soDo.length > 0 && (
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                        <Ruler className="size-3.5" /> Khách tự khai {soDo.length} số đo
                      </p>
                      <p className="mt-1.5 text-sm text-slate-700">
                        {soDo.map(([ma, v]) => `${tenChiSo(ma)} ${v}`).join(' · ')}
                      </p>
                    </div>
                  )}

                  {p.ghi_chu && (
                    <p className="rounded-lg bg-gold-50 p-3 text-sm text-slate-700">{p.ghi_chu}</p>
                  )}

                  <p className="text-xs text-slate-400">Khách gửi lúc {dinhDangNgayGio(p.ngay_gui)}</p>

                  {p.trang_thai !== 'da_tao_don' && p.trang_thai !== 'huy' && (
                    <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
                      <Button co="nho" dangTai={ban} onClick={() => void tao(p)}>
                        Tạo khách &amp; đơn hàng
                      </Button>
                      {p.trang_thai === 'moi' && (
                        <Button kieu="phu" co="nho" disabled={ban} onClick={() => void doi(p, 'da_lien_he')}>
                          Đã gọi khách
                        </Button>
                      )}
                      <Button kieu="mo" co="nho" disabled={ban} onClick={() => void doi(p, 'huy')}>
                        Huỷ phiếu
                      </Button>
                    </div>
                  )}

                  {(p.trang_thai === 'da_tao_don' || p.trang_thai === 'huy') && (
                    <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
                      {p.trang_thai === 'da_tao_don' && (
                        <Button kieu="phu" co="nho" onClick={() => dieuHuong('/don-hang')}>
                          Mở mục Đơn hàng
                        </Button>
                      )}
                      {p.trang_thai === 'huy' && (
                        <Button kieu="phu" co="nho" disabled={ban} onClick={() => void doi(p, 'moi')}>
                          Mở lại phiếu
                        </Button>
                      )}
                      {laQuanTri && (
                        <Button
                          kieu="nguyHiem"
                          co="nho"
                          iconTrai={<Trash2 className="size-4" />}
                          onClick={() => setPhieuXoa(p)}
                        >
                          Xoá hẳn
                        </Button>
                      )}
                    </div>
                  )}
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}

      <HopThoaiXacNhan
        moRa={Boolean(phieuXoa)}
        tieuDe="Xoá hẳn phiếu này?"
        noiDung={
          phieuXoa
            ? `Phiếu ${phieuXoa.ma_phieu} của ${phieuXoa.ho_ten} (${phieuXoa.so_dien_thoai}) sẽ bị xoá khỏi cơ sở dữ liệu. ` +
              'Khách hàng và đơn hàng đã tạo từ phiếu này thì vẫn giữ nguyên. Không thể hoàn tác.'
            : ''
        }
        nhanDongY="Xoá hẳn"
        dangXuLy={xoaMot.isPending}
        dongY={() => void xoaPhieu()}
        huy={() => setPhieuXoa(null)}
      />

      <HopThoaiXacNhan
        moRa={hoiXoaHet}
        tieuDe={`Xoá hẳn ${soPhieuHuy} phiếu đã huỷ?`}
        noiDung={
          'Mọi phiếu đang ở trạng thái Đã huỷ sẽ bị xoá khỏi cơ sở dữ liệu. ' +
          'Khách hàng và đơn hàng đã tạo từ các phiếu đó thì vẫn giữ nguyên. Không thể hoàn tác.'
        }
        nhanDongY="Xoá hết"
        dangXuLy={xoaHet.isPending}
        dongY={() => void donPhieuHuy()}
        huy={() => setHoiXoaHet(false)}
      />
    </div>
  )
}
