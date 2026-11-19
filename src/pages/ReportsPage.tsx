import { useMemo, useState } from 'react'
import { ChartColumn, Download, Printer } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { EmptyState } from '@/components/ui/EmptyState'
import { BaoLoi, DangTaiBang } from '@/components/ui/TrangThaiTai'
import { useThongBao } from '@/components/ui/ThongBao'
import { cn, dinhDangSo, dinhDangTien, ngayDiaPhuong } from '@/lib/utils'
import { useBaoCaoDoanhThu, type NhomBaoCao } from '@/data/heThong'

const NHAN_KY: Record<NhomBaoCao, string> = {
  ngay: 'Theo ngày',
  thang: 'Theo tháng',
  nam: 'Theo năm',
}

/**
 * Khoảng thời gian mặc định cho từng cách nhóm.
 *
 * Hai điều phải giữ đúng ở đây:
 *
 * 1. Dùng ngayDiaPhuong(), KHÔNG dùng toISOString(). Nếu không, mở báo
 *    cáo trước 7 giờ sáng sẽ đặt "Đến ngày" thành hôm qua và bỏ sót
 *    toàn bộ doanh thu hôm nay mà không báo gì.
 *
 * 2. Khi nhóm theo tháng/năm thì mốc bắt đầu phải là NGÀY ĐẦU của kỳ.
 *    Trước đây lấy "hôm nay trừ 11 tháng" nên mốc rơi vào giữa tháng,
 *    mà máy chủ lại gom theo date_trunc('month') — kỳ đầu tiên chỉ có
 *    nửa tháng nhưng vẫn ghi nhãn như một tháng đủ, làm tổng cộng thiếu
 *    tiền và biểu đồ so sánh sai.
 *    Dùng new Date(năm, tháng, 1) thay cho setMonth() cũng tránh luôn
 *    lỗi tràn ngày (31/03 lùi 11 tháng bằng setMonth sẽ nhảy mất tháng).
 */
function khoangMacDinh(nhom: NhomBaoCao): { tu: string; den: string } {
  const nay = new Date()
  const den = ngayDiaPhuong(nay)

  let tu: Date
  if (nhom === 'ngay') {
    tu = new Date(nay)
    tu.setDate(tu.getDate() - 30)
  } else if (nhom === 'thang') {
    // Ngày 1 của tháng cách đây 11 tháng -> đủ trọn 12 tháng.
    tu = new Date(nay.getFullYear(), nay.getMonth() - 11, 1)
  } else {
    // Ngày 1 tháng 1 của năm cách đây 4 năm -> đủ trọn 5 năm.
    tu = new Date(nay.getFullYear() - 4, 0, 1)
  }

  return { tu: ngayDiaPhuong(tu), den }
}

export function ReportsPage() {
  const tb = useThongBao()
  const [nhom, setNhom] = useState<NhomBaoCao>('thang')
  const [khoang, setKhoang] = useState(() => khoangMacDinh('thang'))

  const baoCao = useBaoCaoDoanhThu(khoang.tu, khoang.den, nhom)
  const ds = useMemo(() => baoCao.data ?? [], [baoCao.data])

  const tongDoanhThu = ds.reduce((s, d) => s + Number(d.doanh_thu), 0)
  const tongDon = ds.reduce((s, d) => s + Number(d.so_don), 0)
  const trungBinh = tongDon > 0 ? Math.round(tongDoanhThu / tongDon) : 0
  const caoNhat = ds.length > 0 ? Math.max(...ds.map((d) => Number(d.doanh_thu))) : 0

  const doiNhom = (moi: NhomBaoCao) => {
    setNhom(moi)
    setKhoang(khoangMacDinh(moi))
  }

  const xuatCsv = () => {
    if (ds.length === 0) return tb.loi('Chưa có số liệu để xuất.')

    const dong = [
      ['Ky', 'So don', 'Doanh thu (VND)'],
      ...ds.map((d) => [d.nhan, String(d.so_don), String(Number(d.doanh_thu))]),
      ['TONG CONG', String(tongDon), String(tongDoanhThu)],
    ]
    // Thêm BOM để Excel mở ra không bị lỗi font tiếng Việt
    const csv = '﻿' + dong.map((d) => d.map((o) => `"${o}"`).join(';')).join('\r\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bao-cao-doanh-thu-${khoang.tu}-den-${khoang.den}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    tb.thanhCong('Đã tải file báo cáo. Mở bằng Excel để xem.')
  }

  return (
    <div>
      <div className="no-print">
        <PageHeader
          tieuDe="Báo cáo doanh thu"
          moTa="Thống kê dựa trên tiền đã thực nhận của khách"
          hanhDong={
            <>
              <Button
                kieu="phu"
                iconTrai={<Printer className="size-4" />}
                onClick={() => window.print()}
              >
                In báo cáo
              </Button>
              <Button kieu="phu" iconTrai={<Download className="size-4" />} onClick={xuatCsv}>
                Xuất Excel
              </Button>
            </>
          }
        />

        <Card className="mb-5">
          <CardBody className="flex flex-wrap items-end gap-4">
            <div className="inline-flex rounded-lg bg-slate-100 p-1">
              {(Object.keys(NHAN_KY) as NhomBaoCao[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => doiNhom(k)}
                  className={cn(
                    'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
                    k === nhom ? 'bg-brand-700 text-white shadow-sm' : 'text-slate-600',
                  )}
                >
                  {NHAN_KY[k]}
                </button>
              ))}
            </div>

            <Input
              nhan="Từ ngày"
              type="date"
              value={khoang.tu}
              onChange={(e) => setKhoang((c) => ({ ...c, tu: e.target.value }))}
              boxClassName="w-40"
            />
            <Input
              nhan="Đến ngày"
              type="date"
              value={khoang.den}
              onChange={(e) => setKhoang((c) => ({ ...c, den: e.target.value }))}
              boxClassName="w-40"
            />
          </CardBody>
        </Card>
      </div>

      {baoCao.isLoading ? (
        <Card>
          <DangTaiBang />
        </Card>
      ) : baoCao.isError ? (
        <Card>
          <BaoLoi loi={baoCao.error} thuLai={() => void baoCao.refetch()} />
        </Card>
      ) : ds.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ChartColumn className="size-6" />}
            tieuDe="Chưa có doanh thu trong khoảng này"
            moTa="Doanh thu được tính từ các khoản tiền đã thu của khách. Hãy chọn khoảng thời gian khác hoặc ghi nhận thanh toán."
          />
        </Card>
      ) : (
        <div className="print-area">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <ThongSo nhan="Tổng doanh thu" giaTri={dinhDangTien(tongDoanhThu)} mauChu="text-brand-800" />
            <ThongSo nhan="Số đơn có thu tiền" giaTri={`${dinhDangSo(tongDon)} đơn`} />
            <ThongSo nhan="Trung bình mỗi đơn" giaTri={dinhDangTien(trungBinh)} />
            <ThongSo nhan="Số kỳ thống kê" giaTri={`${ds.length} kỳ`} />
          </div>

          {/* Biểu đồ cột */}
          <Card className="mt-5">
            <CardHeader
              tieuDe={`Biểu đồ doanh thu ${NHAN_KY[nhom].toLowerCase()}`}
              moTa="Đơn vị: triệu đồng"
            />
            <CardBody>
              <div className="scrollbar-slim overflow-x-auto">
                <div
                  className="flex h-56 items-end gap-1.5 sm:gap-2.5"
                  style={{ minWidth: `${Math.max(320, ds.length * 44)}px` }}
                >
                  {ds.map((d, i) => {
                    const gt = Number(d.doanh_thu)
                    const cuoi = i === ds.length - 1
                    return (
                      <div
                        key={`${d.nhan}-${i}`}
                        className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5"
                      >
                        <span
                          className={cn(
                            'text-[10px] font-semibold tabular-nums transition-opacity sm:text-xs',
                            cuoi
                              ? 'text-brand-800'
                              : 'text-slate-400 opacity-0 group-hover:opacity-100',
                          )}
                        >
                          {(gt / 1_000_000).toFixed(gt >= 10_000_000 ? 0 : 1)}
                        </span>
                        <div
                          className={cn(
                            'w-full rounded-t-md transition-colors',
                            cuoi ? 'bg-gold-400' : 'bg-brand-200 group-hover:bg-brand-400',
                          )}
                          style={{
                            height: caoNhat > 0 ? `${Math.max(2, (gt / caoNhat) * 100)}%` : '2%',
                          }}
                          title={`${d.nhan}: ${dinhDangTien(gt)} · ${d.so_don} đơn`}
                        />
                        <span className="text-[10px] whitespace-nowrap text-slate-500 sm:text-xs">
                          {d.nhan}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Bảng chi tiết */}
          <Card className="mt-5">
            <CardHeader tieuDe="Bảng doanh thu chi tiết" />
            <div className="scrollbar-slim overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs tracking-wide text-slate-500 uppercase">
                    <th className="px-5 py-2.5 font-semibold">Kỳ</th>
                    <th className="px-5 py-2.5 text-right font-semibold">Số đơn</th>
                    <th className="px-5 py-2.5 text-right font-semibold">Doanh thu</th>
                    <th className="px-5 py-2.5 text-right font-semibold">TB / đơn</th>
                    <th className="hidden px-5 py-2.5 font-semibold sm:table-cell">So sánh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[...ds].reverse().map((d, i) => {
                    const gt = Number(d.doanh_thu)
                    const sd = Number(d.so_don)
                    return (
                      <tr key={`${d.nhan}-${i}`} className="transition-colors hover:bg-slate-50">
                        <td className="px-5 py-3 font-semibold text-slate-900">{d.nhan}</td>
                        <td className="px-5 py-3 text-right tabular-nums text-slate-700">{sd}</td>
                        <td className="px-5 py-3 text-right font-semibold tabular-nums text-slate-900">
                          {dinhDangTien(gt)}
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums text-slate-600">
                          {dinhDangTien(sd > 0 ? Math.round(gt / sd) : 0)}
                        </td>
                        <td className="hidden px-5 py-3 sm:table-cell">
                          <div className="h-2 w-full max-w-40 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-brand-500"
                              style={{ width: caoNhat > 0 ? `${(gt / caoNhat) * 100}%` : '0%' }}
                            />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold">
                    <td className="px-5 py-3 text-slate-900">Tổng cộng</td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-900">{tongDon}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-brand-800">
                      {dinhDangTien(tongDoanhThu)}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-slate-700">
                      {dinhDangTien(trungBinh)}
                    </td>
                    <td className="hidden sm:table-cell" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

function ThongSo({
  nhan,
  giaTri,
  mauChu = 'text-slate-900',
}: {
  nhan: string
  giaTri: string
  mauChu?: string
}) {
  return (
    <Card>
      <CardBody>
        <p className="text-sm font-medium text-slate-500">{nhan}</p>
        <p className={cn('mt-2 text-xl font-bold tracking-tight tabular-nums', mauChu)}>{giaTri}</p>
      </CardBody>
    </Card>
  )
}
