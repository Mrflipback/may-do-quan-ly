import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HandCoins, Pencil, Plus, Printer, ShoppingBag, Trash } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { BaoLoi, DangTaiBang } from '@/components/ui/TrangThaiTai'
import { HopThoaiXacNhan, useThongBao } from '@/components/ui/ThongBao'
import { MAU_TRANG_THAI, NHAN_TRANG_THAI } from '@/lib/constants'
import { cn, dinhDangNgay, dinhDangTien, soNgayConLai } from '@/lib/utils'
import { dichLoi } from '@/lib/loi'
import { useAuth } from '@/auth/AuthProvider'
import { useDanhSachDonHang, useDoiTrangThaiDon, useXoaDonHang } from '@/data/donHang'
import { FormDonHang } from './orders/FormDonHang'
import { FormThanhToan } from './orders/FormThanhToan'
import type { DonHangDayDu, TrangThaiDonHang } from '@/types'

const CAC_TRANG_THAI: Array<TrangThaiDonHang | 'tat_ca'> = [
  'tat_ca',
  'moi',
  'dang_may',
  'cho_thu',
  'hoan_thanh',
  'da_giao',
  'da_huy',
]

export function OrdersPage() {
  const [loc, setLoc] = useState<TrangThaiDonHang | 'tat_ca'>('tat_ca')
  const [moForm, setMoForm] = useState(false)
  const [donSua, setDonSua] = useState<DonHangDayDu | null>(null)
  const [donThu, setDonThu] = useState<DonHangDayDu | null>(null)
  const [donXoa, setDonXoa] = useState<DonHangDayDu | null>(null)

  const { laQuanTri } = useAuth()
  const tb = useThongBao()
  const dieuHuong = useNavigate()

  const danhSach = useDanhSachDonHang(loc)
  const doiTrangThai = useDoiTrangThaiDon()
  const xoa = useXoaDonHang()

  const ds = danhSach.data ?? []

  const capNhatTrangThai = async (don: DonHangDayDu, moi: TrangThaiDonHang) => {
    try {
      await doiTrangThai.mutateAsync({ id: don.id, trangThai: moi })
      tb.thanhCong(`Đơn ${don.ma_don} chuyển sang "${NHAN_TRANG_THAI[moi]}".`)
    } catch (e) {
      tb.loi(dichLoi(e))
    }
  }

  const xacNhanXoa = async () => {
    if (!donXoa) return
    try {
      await xoa.mutateAsync(donXoa.id)
      tb.thanhCong(`Đã xóa đơn ${donXoa.ma_don}.`)
      setDonXoa(null)
    } catch (e) {
      tb.loi(dichLoi(e))
    }
  }

  return (
    <div>
      <PageHeader
        tieuDe="Đơn hàng"
        moTa="Theo dõi đơn từ lúc nhận đo đến khi giao hàng"
        hanhDong={
          <Button
            iconTrai={<Plus className="size-4" />}
            onClick={() => {
              setDonSua(null)
              setMoForm(true)
            }}
          >
            Tạo đơn hàng
          </Button>
        }
      />

      {/* Bộ lọc trạng thái */}
      <div className="scrollbar-slim mb-4 flex gap-2 overflow-x-auto pb-1">
        {CAC_TRANG_THAI.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setLoc(t)}
            className={cn(
              'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              t === loc
                ? 'bg-brand-700 text-white shadow-sm'
                : 'bg-paper text-slate-600 ring-1 ring-slate-300 hover:bg-slate-50',
            )}
          >
            {t === 'tat_ca' ? 'Tất cả' : NHAN_TRANG_THAI[t]}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader
          tieuDe="Danh sách đơn hàng"
          moTa={danhSach.data ? `${ds.length} đơn` : 'Đang tải…'}
        />

        {danhSach.isLoading ? (
          <DangTaiBang />
        ) : danhSach.isError ? (
          <BaoLoi loi={danhSach.error} thuLai={() => void danhSach.refetch()} />
        ) : ds.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag className="size-6" />}
            tieuDe={loc === 'tat_ca' ? 'Chưa có đơn hàng nào' : 'Không có đơn ở trạng thái này'}
            moTa={
              loc === 'tat_ca'
                ? 'Bấm "Tạo đơn hàng" để ghi nhận đơn đầu tiên.'
                : 'Chọn trạng thái khác để xem các đơn còn lại.'
            }
            hanhDong={
              loc === 'tat_ca' ? (
                <Button
                  onClick={() => {
                    setDonSua(null)
                    setMoForm(true)
                  }}
                >
                  Tạo đơn hàng
                </Button>
              ) : (
                <Button kieu="phu" onClick={() => setLoc('tat_ca')}>
                  Xem tất cả đơn
                </Button>
              )
            }
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {ds.map((d) => {
              const con = soNgayConLai(d.ngay_hen_giao)
              const dangLam = d.trang_thai !== 'da_giao' && d.trang_thai !== 'da_huy'
              const treHen = con < 0 && dangLam
              const conLai = Number(d.con_lai)

              return (
                <li key={d.id} className="px-4 py-4 transition-colors hover:bg-slate-50 sm:px-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-brand-700">{d.ma_don}</p>
                        <select
                          value={d.trang_thai}
                          onChange={(e) =>
                            capNhatTrangThai(d, e.target.value as TrangThaiDonHang)
                          }
                          aria-label={`Đổi trạng thái đơn ${d.ma_don}`}
                          className={cn(
                            'cursor-pointer rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset focus:ring-2 focus:ring-brand-500 focus:outline-none',
                            MAU_TRANG_THAI[d.trang_thai],
                          )}
                        >
                          {(Object.keys(NHAN_TRANG_THAI) as TrangThaiDonHang[]).map((t) => (
                            <option key={t} value={t}>
                              {NHAN_TRANG_THAI[t]}
                            </option>
                          ))}
                        </select>
                        {treHen && (
                          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                            Trễ {Math.abs(con)} ngày
                          </span>
                        )}
                      </div>
                      <p className="mt-1 font-medium text-slate-800">{d.ten_khach}</p>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {d.so_mon} món · {d.sdt_khach}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-1">
                      {conLai > 0 && dangLam && (
                        <Button
                          kieu="vien"
                          co="nho"
                          iconTrai={<HandCoins className="size-3.5" />}
                          onClick={() => setDonThu(d)}
                        >
                          Thu tiền
                        </Button>
                      )}
                      <Button
                        kieu="mo"
                        co="nho"
                        aria-label="Sửa đơn"
                        onClick={() => {
                          setDonSua(d)
                          setMoForm(true)
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        kieu="mo"
                        co="nho"
                        aria-label="In phiếu đơn hàng"
                        onClick={() => dieuHuong(`/in-phieu?mau=don_hang&don=${d.id}`)}
                      >
                        <Printer className="size-4" />
                      </Button>
                      {laQuanTri && (
                        <Button
                          kieu="mo"
                          co="nho"
                          aria-label="Xóa đơn"
                          className="text-rose-600 hover:bg-rose-50"
                          onClick={() => setDonXoa(d)}
                        >
                          <Trash className="size-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-slate-100 pt-3 text-sm sm:grid-cols-4">
                    <div>
                      <dt className="text-xs text-slate-500">Ngày nhận</dt>
                      <dd className="tabular-nums text-slate-700">{dinhDangNgay(d.ngay_nhan)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Hẹn giao</dt>
                      <dd
                        className={cn(
                          'tabular-nums',
                          treHen ? 'font-semibold text-rose-600' : 'text-slate-700',
                        )}
                      >
                        {dinhDangNgay(d.ngay_hen_giao)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Thành tiền</dt>
                      <dd className="font-semibold tabular-nums text-slate-900">
                        {dinhDangTien(Number(d.thanh_tien))}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Còn phải thu</dt>
                      <dd
                        className={cn(
                          'font-semibold tabular-nums',
                          conLai > 0 ? 'text-rose-600' : 'text-emerald-600',
                        )}
                      >
                        {conLai > 0 ? dinhDangTien(conLai) : 'Đã thu đủ'}
                      </dd>
                    </div>
                  </dl>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <FormDonHang moRa={moForm} dong={() => setMoForm(false)} donDangSua={donSua} />
      <FormThanhToan don={donThu} dong={() => setDonThu(null)} />

      <HopThoaiXacNhan
        moRa={Boolean(donXoa)}
        tieuDe="Xóa đơn hàng này?"
        noiDung={
          donXoa
            ? `Đơn ${donXoa.ma_don} của ${donXoa.ten_khach} cùng toàn bộ sản phẩm và lịch sử ` +
              'thanh toán sẽ bị xóa vĩnh viễn.'
            : ''
        }
        dangXuLy={xoa.isPending}
        dongY={xacNhanXoa}
        huy={() => setDonXoa(null)}
      />
    </div>
  )
}
