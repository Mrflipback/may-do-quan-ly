import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Banknote,
  Package,
  ShoppingBag,
  TriangleExclamationPoint,
  UserPlus,
  Users,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { BadgeTrangThai } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { BaoLoi, DangTaiBang, KhoiCho } from '@/components/ui/TrangThaiTai'
import {
  dinhDangNgay,
  dinhDangSo,
  dinhDangTien,
  phanTramThayDoi,
  soNgayConLai,
} from '@/lib/utils'
import { useThongKeTongQuan } from '@/data/heThong'
import { useDonSapToHan } from '@/data/donHang'
import { useVatTuSapHet } from '@/data/kho'
import { useAuth } from '@/auth/AuthProvider'

export function DashboardPage() {
  const { laQuanTri, hoSo } = useAuth()
  const thongKe = useThongKeTongQuan()
  const donSapHan = useDonSapToHan(8)
  const sapHet = useVatTuSapHet()

  const tk = thongKe.data

  return (
    <div>
      <PageHeader
        tieuDe={`Xin chào, ${hoSo?.ho_ten ?? ''}`}
        moTa="Tình hình kinh doanh của tiệm"
        hanhDong={
          <>
            <Link to="/khach-hang">
              <Button kieu="phu" iconTrai={<UserPlus className="size-4" />}>
                Thêm khách
              </Button>
            </Link>
            <Link to="/don-hang">
              <Button iconTrai={<ShoppingBag className="size-4" />}>Tạo đơn hàng</Button>
            </Link>
          </>
        }
      />

      {/* Bốn chỉ số chính */}
      {thongKe.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <KhoiCho key={i} className="h-32" />
          ))}
        </div>
      ) : thongKe.isError ? (
        <Card>
          <BaoLoi loi={thongKe.error} thuLai={() => void thongKe.refetch()} />
        </Card>
      ) : tk ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {laQuanTri ? (
            <StatCard
              nhan="Doanh thu tháng này"
              giaTri={dinhDangTien(tk.doanhThuThang ?? 0)}
              icon={<Banknote className="size-5" />}
              mauIcon="bg-emerald-50 text-emerald-600"
              thayDoi={phanTramThayDoi(tk.doanhThuThang ?? 0, tk.doanhThuThangTruoc ?? 0)}
              chuThich="so với tháng trước"
            />
          ) : (
            <StatCard
              nhan="Tổng khách hàng"
              giaTri={`${dinhDangSo(tk.tongKhachHang)} khách`}
              icon={<Users className="size-5" />}
              mauIcon="bg-emerald-50 text-emerald-600"
            />
          )}

          <StatCard
            nhan="Đơn đang may"
            giaTri={`${tk.soDonDangMay} đơn`}
            icon={<ShoppingBag className="size-5" />}
            mauIcon="bg-brand-50 text-brand-700"
            chuThich={
              tk.soDonTreHen > 0 ? `${tk.soDonTreHen} đơn đã trễ hẹn` : 'không có đơn trễ hẹn'
            }
          />
          <StatCard
            nhan="Khách hàng mới"
            giaTri={`${tk.khachHangMoiThang} khách`}
            icon={<Users className="size-5" />}
            mauIcon="bg-violet-50 text-violet-600"
            chuThich="trong tháng này"
          />
          <StatCard
            nhan="Tổng công nợ"
            giaTri={dinhDangTien(tk.tongCongNo)}
            icon={<TriangleExclamationPoint className="size-5" />}
            mauIcon="bg-rose-50 text-rose-600"
            chuThich={`${tk.soKhachNoQuaHan} khách quá hạn`}
          />
        </div>
      ) : null}

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
        {/* Đơn sắp tới hạn */}
        <Card className="xl:col-span-2">
          <CardHeader
            tieuDe="Đơn hàng sắp tới hạn giao"
            moTa="Sắp xếp theo ngày hẹn gần nhất"
            hanhDong={
              <Link to="/don-hang">
                <Button kieu="mo" co="nho" iconPhai={<ArrowRight className="size-3.5" />}>
                  Tất cả đơn
                </Button>
              </Link>
            }
          />

          {donSapHan.isLoading ? (
            <DangTaiBang />
          ) : donSapHan.isError ? (
            <BaoLoi loi={donSapHan.error} thuLai={() => void donSapHan.refetch()} />
          ) : (donSapHan.data?.length ?? 0) === 0 ? (
            <EmptyState
              icon={<ShoppingBag className="size-6" />}
              tieuDe="Chưa có đơn nào đang làm"
              moTa="Tạo đơn hàng đầu tiên để bắt đầu theo dõi tiến độ."
              hanhDong={
                <Link to="/don-hang">
                  <Button>Tạo đơn hàng</Button>
                </Link>
              }
            />
          ) : (
            <>
              <div className="scrollbar-slim hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs tracking-wide text-slate-500 uppercase">
                      <th className="px-5 py-2.5 font-semibold">Mã đơn</th>
                      <th className="px-5 py-2.5 font-semibold">Khách hàng</th>
                      <th className="px-5 py-2.5 font-semibold">Hẹn giao</th>
                      <th className="px-5 py-2.5 font-semibold">Trạng thái</th>
                      <th className="px-5 py-2.5 text-right font-semibold">Còn lại</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {donSapHan.data!.map((d) => (
                      <tr key={d.id} className="transition-colors hover:bg-slate-50">
                        <td className="px-5 py-3 font-semibold text-brand-700">{d.ma_don}</td>
                        <td className="px-5 py-3 text-slate-700">{d.ten_khach}</td>
                        <td className="px-5 py-3">
                          <NhanHanGiao ngayHen={d.ngay_hen_giao} />
                        </td>
                        <td className="px-5 py-3">
                          <BadgeTrangThai trangThai={d.trang_thai} />
                        </td>
                        <td className="px-5 py-3 text-right font-semibold tabular-nums">
                          {Number(d.con_lai) > 0 ? (
                            <span className="text-rose-600">{dinhDangTien(Number(d.con_lai))}</span>
                          ) : (
                            <span className="text-emerald-600">Đã thu đủ</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="divide-y divide-slate-100 md:hidden">
                {donSapHan.data!.map((d) => (
                  <li key={d.id} className="px-4 py-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-brand-700">{d.ma_don}</p>
                        <p className="truncate text-sm text-slate-600">{d.ten_khach}</p>
                      </div>
                      <BadgeTrangThai trangThai={d.trang_thai} />
                    </div>
                    <div className="mt-2.5 flex items-center justify-between gap-3 text-sm">
                      <NhanHanGiao ngayHen={d.ngay_hen_giao} />
                      <span className="font-semibold tabular-nums">
                        {Number(d.con_lai) > 0 ? (
                          <span className="text-rose-600">{dinhDangTien(Number(d.con_lai))}</span>
                        ) : (
                          <span className="text-emerald-600">Đã thu đủ</span>
                        )}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>

        {/* Vật tư sắp hết */}
        <Card>
          <CardHeader
            tieuDe="Vật tư sắp hết"
            moTa={
              sapHet.data
                ? `${sapHet.data.length} mặt hàng dưới mức tối thiểu`
                : 'Đang kiểm tra kho…'
            }
          />
          {sapHet.isLoading ? (
            <DangTaiBang soDong={3} />
          ) : sapHet.isError ? (
            <BaoLoi loi={sapHet.error} thuLai={() => void sapHet.refetch()} />
          ) : (sapHet.data?.length ?? 0) === 0 ? (
            <EmptyState
              icon={<Package className="size-6" />}
              tieuDe="Kho đang đủ hàng"
              moTa="Không có mặt hàng nào dưới mức tồn tối thiểu."
            />
          ) : (
            <CardBody className="space-y-3">
              {sapHet.data!.map((v) => {
                const ton = Number(v.ton_kho)
                const toiThieu = Number(v.ton_toi_thieu) || 1
                const tyLe = Math.max(0, Math.min(100, (ton / toiThieu) * 100))
                return (
                  <div key={v.id}>
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-medium text-slate-800">{v.ten_vat_tu}</p>
                      <p className="shrink-0 text-xs tabular-nums text-slate-500">
                        <span className="font-semibold text-rose-600">{dinhDangSo(ton)}</span>
                        {' / '}
                        {dinhDangSo(Number(v.ton_toi_thieu))} {v.don_vi_tinh}
                      </p>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-rose-500" style={{ width: `${tyLe}%` }} />
                    </div>
                  </div>
                )
              })}
              <Link to="/kho" className="block pt-1">
                <Button kieu="phu" co="nho" rongHet iconTrai={<Package className="size-3.5" />}>
                  Mở kho hàng
                </Button>
              </Link>
            </CardBody>
          )}
        </Card>
      </div>
    </div>
  )
}

/** Hiển thị ngày hẹn kèm cảnh báo trễ hẹn. */
function NhanHanGiao({ ngayHen }: { ngayHen: string }) {
  const con = soNgayConLai(ngayHen)
  const mau = con < 0 ? 'text-rose-600' : con <= 3 ? 'text-amber-600' : 'text-slate-600'
  const ghi = con < 0 ? `trễ ${Math.abs(con)} ngày` : con === 0 ? 'hôm nay' : `còn ${con} ngày`

  return (
    <span className={`inline-flex flex-wrap items-baseline gap-1.5 ${mau}`}>
      <span className="tabular-nums">{dinhDangNgay(ngayHen)}</span>
      <span className="text-xs font-medium">({ghi})</span>
    </span>
  )
}
