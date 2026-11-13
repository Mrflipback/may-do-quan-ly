import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  HandCoins,
  PiggyBank,
  Printer,
  Trash,
  TriangleExclamationPoint,
  Wallet,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { StatCard } from '@/components/ui/StatCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { BaoLoi, DangTaiBang } from '@/components/ui/TrangThaiTai'
import { HopThoaiXacNhan, useThongBao } from '@/components/ui/ThongBao'
import { NHAN_HINH_THUC_TT } from '@/lib/constants'
import { cn, dinhDangNgay, dinhDangTien, soNgayConLai } from '@/lib/utils'
import { dichLoi } from '@/lib/loi'
import { useAuth } from '@/auth/AuthProvider'
import { useDanhSachDonHang } from '@/data/donHang'
import { useLichSuThanhToan, useXoaThanhToan } from '@/data/thanhToan'
import { FormThanhToan } from './orders/FormThanhToan'
import type { DonHangDayDu, ThanhToanDayDu } from '@/types'

export function PaymentsPage() {
  const [donThu, setDonThu] = useState<DonHangDayDu | null>(null)
  const [ttXoa, setTtXoa] = useState<ThanhToanDayDu | null>(null)

  const { laQuanTri } = useAuth()
  const tb = useThongBao()
  const dieuHuong = useNavigate()

  const donHang = useDanhSachDonHang('tat_ca')
  const lichSu = useLichSuThanhToan(null, 30)
  const xoa = useXoaThanhToan()

  const conNo = (donHang.data ?? [])
    .filter((d) => Number(d.con_lai) > 0 && d.trang_thai !== 'da_huy')
    .sort((a, b) => a.ngay_hen_giao.localeCompare(b.ngay_hen_giao))

  const tongNo = conNo.reduce((s, d) => s + Number(d.con_lai), 0)
  const tongThu = (lichSu.data ?? []).reduce((s, t) => s + Number(t.so_tien), 0)
  const tongCoc = (lichSu.data ?? [])
    .filter((t) => t.la_tien_coc)
    .reduce((s, t) => s + Number(t.so_tien), 0)

  const xacNhanXoa = async () => {
    if (!ttXoa) return
    try {
      await xoa.mutateAsync(ttXoa.id)
      tb.thanhCong('Đã xóa giao dịch thanh toán.')
      setTtXoa(null)
    } catch (e) {
      tb.loi(dichLoi(e))
    }
  }

  return (
    <div>
      <PageHeader
        tieuDe="Thanh toán & công nợ"
        moTa="Ghi nhận tiền cọc, thanh toán nhiều lần và theo dõi khách còn nợ"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          nhan="Đã thu (30 giao dịch gần nhất)"
          giaTri={dinhDangTien(tongThu)}
          icon={<HandCoins className="size-5" />}
          mauIcon="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          nhan="Trong đó là tiền cọc"
          giaTri={dinhDangTien(tongCoc)}
          icon={<PiggyBank className="size-5" />}
          mauIcon="bg-brand-50 text-brand-700"
        />
        <StatCard
          nhan="Công nợ phải thu"
          giaTri={dinhDangTien(tongNo)}
          icon={<TriangleExclamationPoint className="size-5" />}
          mauIcon="bg-rose-50 text-rose-600"
          chuThich={`${conNo.length} đơn chưa thu đủ`}
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
        {/* Đơn còn nợ */}
        <Card>
          <CardHeader
            tieuDe="Đơn hàng còn phải thu"
            moTa={donHang.data ? `${conNo.length} đơn` : 'Đang tải…'}
          />
          {donHang.isLoading ? (
            <DangTaiBang />
          ) : donHang.isError ? (
            <BaoLoi loi={donHang.error} thuLai={() => void donHang.refetch()} />
          ) : conNo.length === 0 ? (
            <EmptyState
              icon={<Wallet className="size-6" />}
              tieuDe="Không có khoản nợ nào"
              moTa="Tất cả đơn hàng đều đã thu đủ tiền."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {conNo.map((d) => {
                const thanhTien = Number(d.thanh_tien)
                const daTra = Number(d.da_tra)
                const conLai = Number(d.con_lai)
                const tyLe = thanhTien > 0 ? Math.round((daTra / thanhTien) * 100) : 0
                const treHen = soNgayConLai(d.ngay_hen_giao) < 0

                return (
                  <li key={d.id} className="px-4 py-3.5 sm:px-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-brand-700">{d.ma_don}</p>
                          {treHen && (
                            <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                              Quá hạn
                            </span>
                          )}
                        </div>
                        <p className="truncate text-sm text-slate-600">{d.ten_khach}</p>
                        <p className="text-xs text-slate-500">
                          Hẹn giao {dinhDangNgay(d.ngay_hen_giao)}
                        </p>
                      </div>
                      <p className="shrink-0 font-bold tabular-nums text-rose-600">
                        {dinhDangTien(conLai)}
                      </p>
                    </div>

                    <div className="mt-2.5">
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${tyLe}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs tabular-nums text-slate-500">
                        Đã trả {dinhDangTien(daTra)} / {dinhDangTien(thanhTien)} ({tyLe}%)
                      </p>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <Button
                        kieu="phu"
                        co="nho"
                        iconTrai={<HandCoins className="size-3.5" />}
                        onClick={() => setDonThu(d)}
                      >
                        Thu tiền
                      </Button>
                      <Button
                        kieu="mo"
                        co="nho"
                        iconTrai={<Printer className="size-3.5" />}
                        onClick={() => dieuHuong(`/in-phieu?mau=thanh_toan&don=${d.id}`)}
                      >
                        In phiếu
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        {/* Lịch sử thanh toán */}
        <Card>
          <CardHeader
            tieuDe="Lịch sử thanh toán gần đây"
            moTa={lichSu.data ? `${lichSu.data.length} giao dịch` : 'Đang tải…'}
          />
          {lichSu.isLoading ? (
            <DangTaiBang />
          ) : lichSu.isError ? (
            <BaoLoi loi={lichSu.error} thuLai={() => void lichSu.refetch()} />
          ) : (lichSu.data?.length ?? 0) === 0 ? (
            <EmptyState
              icon={<HandCoins className="size-6" />}
              tieuDe="Chưa có giao dịch nào"
              moTa="Khi bạn thu tiền của khách, giao dịch sẽ hiện ở đây."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {lichSu.data!.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">{t.ma_don}</p>
                      <Badge
                        className={cn(
                          t.la_tien_coc
                            ? 'bg-brand-100 text-brand-800 ring-brand-600/20'
                            : 'bg-emerald-100 text-emerald-800 ring-emerald-600/20',
                        )}
                      >
                        {t.la_tien_coc ? 'Tiền cọc' : 'Thanh toán'}
                      </Badge>
                    </div>
                    <p className="truncate text-sm text-slate-600">{t.ten_khach}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {dinhDangNgay(t.ngay_thanh_toan)} · {NHAN_HINH_THUC_TT[t.hinh_thuc]}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <p className="font-bold tabular-nums text-emerald-600">
                      +{dinhDangTien(Number(t.so_tien))}
                    </p>
                    {laQuanTri && (
                      <Button
                        kieu="mo"
                        co="nho"
                        aria-label="Xóa giao dịch"
                        className="text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        onClick={() => setTtXoa(t)}
                      >
                        <Trash className="size-4" />
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <FormThanhToan don={donThu} dong={() => setDonThu(null)} />

      <HopThoaiXacNhan
        moRa={Boolean(ttXoa)}
        tieuDe="Xóa giao dịch thanh toán này?"
        noiDung={
          ttXoa
            ? `Khoản ${dinhDangTien(Number(ttXoa.so_tien))} của đơn ${ttXoa.ma_don} sẽ bị xóa, ` +
              'công nợ của khách sẽ tăng lên tương ứng.'
            : ''
        }
        dangXuLy={xoa.isPending}
        dongY={xacNhanXoa}
        huy={() => setTtXoa(null)}
      />
    </div>
  )
}
