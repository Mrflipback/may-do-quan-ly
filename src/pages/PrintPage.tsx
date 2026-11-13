import { Fragment, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Printer } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Field'
import { EmptyState } from '@/components/ui/EmptyState'
import { DangTaiBang } from '@/components/ui/TrangThaiTai'
import { NHOM_SO_DO, NHAN_HINH_THUC_TT, NHAN_TRANG_THAI } from '@/lib/constants'
import { dinhDangNgay, dinhDangTien } from '@/lib/utils'
import { useCaiDat } from '@/data/heThong'
import { useDanhSachDonHang, useDongSanPham, useDonHang } from '@/data/donHang'
import { useKhachHangRutGon } from '@/data/khachHang'
import { useDanhSachSoDo } from '@/data/soDo'
import { useLichSuThanhToan } from '@/data/thanhToan'
import type { ChiSoDo } from '@/types'

type MauPhieu = 'so_do' | 'don_hang' | 'thanh_toan'

const NHAN_PHIEU: Record<MauPhieu, string> = {
  so_do: 'Phiếu số đo',
  don_hang: 'Phiếu đơn hàng',
  thanh_toan: 'Phiếu thanh toán',
}

export function PrintPage() {
  const [thamSo, setThamSo] = useSearchParams()
  const mauBanDau = (thamSo.get('mau') as MauPhieu) || 'don_hang'

  const [mau, setMau] = useState<MauPhieu>(
    ['so_do', 'don_hang', 'thanh_toan'].includes(mauBanDau) ? mauBanDau : 'don_hang',
  )
  const [donId, setDonId] = useState(thamSo.get('don') ?? '')
  const [khachId, setKhachId] = useState(thamSo.get('khach') ?? '')
  const [soDoId, setSoDoId] = useState('')

  const caiDat = useCaiDat()
  const dsDon = useDanhSachDonHang('tat_ca')
  const dsKhach = useKhachHangRutGon()
  const dsSoDo = useDanhSachSoDo(khachId || null)

  // Chọn sẵn bản ghi đầu tiên nếu chưa chọn gì
  useEffect(() => {
    if (!donId && dsDon.data && dsDon.data.length > 0) setDonId(dsDon.data[0].id)
  }, [dsDon.data, donId])

  useEffect(() => {
    if (!khachId && dsKhach.data && dsKhach.data.length > 0) setKhachId(dsKhach.data[0].id)
  }, [dsKhach.data, khachId])

  useEffect(() => {
    if (dsSoDo.data && dsSoDo.data.length > 0) setSoDoId(dsSoDo.data[0].id)
    else setSoDoId('')
  }, [dsSoDo.data])

  const doiMau = (m: MauPhieu) => {
    setMau(m)
    setThamSo({}, { replace: true })
  }

  const tiem = {
    ten: caiDat.data?.ten_tiem?.trim() || 'MAY ĐO QUẢN LÝ PRO',
    khauHieu: caiDat.data?.khau_hieu?.trim() || '',
    diaChi: caiDat.data?.dia_chi?.trim() || '',
    dienThoai: caiDat.data?.dien_thoai?.trim() || '',
  }

  const dangTai = caiDat.isLoading || dsDon.isLoading || dsKhach.isLoading

  return (
    <div>
      <div className="no-print">
        <PageHeader
          tieuDe="In phiếu"
          moTa="Xem trước và in trên khổ giấy A4"
          hanhDong={
            <Button iconTrai={<Printer className="size-4" />} onClick={() => window.print()}>
              In phiếu này
            </Button>
          }
        />

        <Card className="mb-5 p-4 sm:p-5">
          <div className="flex flex-wrap items-end gap-4">
            <div className="inline-flex flex-wrap rounded-lg bg-slate-100 p-1">
              {(Object.keys(NHAN_PHIEU) as MauPhieu[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => doiMau(m)}
                  className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                    m === mau ? 'bg-brand-700 text-white shadow-sm' : 'text-slate-600'
                  }`}
                >
                  {NHAN_PHIEU[m]}
                </button>
              ))}
            </div>

            {mau === 'so_do' ? (
              <>
                <Select
                  nhan="Khách hàng"
                  value={khachId}
                  onChange={(e) => setKhachId(e.target.value)}
                  boxClassName="min-w-56"
                >
                  {(dsKhach.data ?? []).map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.ho_ten} — {k.so_dien_thoai}
                    </option>
                  ))}
                </Select>
                <Select
                  nhan="Lần đo"
                  value={soDoId}
                  onChange={(e) => setSoDoId(e.target.value)}
                  boxClassName="min-w-56"
                >
                  {(dsSoDo.data ?? []).map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.ten_ho_so} ({dinhDangNgay(h.ngay_do)})
                    </option>
                  ))}
                </Select>
              </>
            ) : (
              <Select
                nhan="Đơn hàng"
                value={donId}
                onChange={(e) => setDonId(e.target.value)}
                boxClassName="min-w-72"
              >
                {(dsDon.data ?? []).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.ma_don} — {d.ten_khach} ({NHAN_TRANG_THAI[d.trang_thai]})
                  </option>
                ))}
              </Select>
            )}
          </div>
        </Card>
      </div>

      {dangTai ? (
        <Card>
          <DangTaiBang />
        </Card>
      ) : (
        <Card className="print-area mx-auto max-w-[820px] p-8 sm:p-12">
          <DauPhieu tieuDe={NHAN_PHIEU[mau].toUpperCase()} tiem={tiem} />
          {mau === 'so_do' && <NoiDungSoDo khachId={khachId} soDoId={soDoId} />}
          {mau === 'don_hang' && <NoiDungDonHang donId={donId} />}
          {mau === 'thanh_toan' && <NoiDungThanhToan donId={donId} />}
          <ChanKy />
        </Card>
      )}
    </div>
  )
}

/* --------------------------- Các phần phiếu --------------------------- */

function DauPhieu({
  tieuDe,
  tiem,
}: {
  tieuDe: string
  tiem: { ten: string; khauHieu: string; diaChi: string; dienThoai: string }
}) {
  return (
    <header className="mb-6 border-b-2 border-slate-800 pb-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-lg font-bold tracking-tight text-slate-900">{tiem.ten}</p>
          {tiem.khauHieu && <p className="text-sm text-slate-600">{tiem.khauHieu}</p>}
          {tiem.diaChi && <p className="mt-1 text-xs text-slate-500">Địa chỉ: {tiem.diaChi}</p>}
          {tiem.dienThoai && <p className="text-xs text-slate-500">Điện thoại: {tiem.dienThoai}</p>}
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Ngày in</p>
          <p className="text-sm font-semibold tabular-nums text-slate-800">
            {dinhDangNgay(new Date())}
          </p>
        </div>
      </div>
      <h2 className="mt-5 text-center text-xl font-bold tracking-wide text-slate-900">{tieuDe}</h2>
    </header>
  )
}

function Hang({ nhan, giaTri }: { nhan: string; giaTri: string }) {
  return (
    <div className="flex gap-2 text-sm">
      <span className="shrink-0 text-slate-500">{nhan}:</span>
      <span className="font-medium text-slate-900">{giaTri}</span>
    </div>
  )
}

function NoiDungSoDo({ khachId, soDoId }: { khachId: string; soDoId: string }) {
  const dsKhach = useKhachHangRutGon()
  const dsSoDo = useDanhSachSoDo(khachId || null)

  const khach = dsKhach.data?.find((k) => k.id === khachId)
  const hoSo = dsSoDo.data?.find((h) => h.id === soDoId)

  if (!khach) {
    return <EmptyState tieuDe="Chưa chọn khách hàng" moTa="Hãy chọn khách ở ô phía trên." />
  }
  if (!hoSo) {
    return (
      <EmptyState
        tieuDe="Khách này chưa có lần đo nào"
        moTa="Phiếu dưới đây sẽ in các ô trống để thợ ghi tay."
      />
    )
  }

  const soDo = hoSo.so_do ?? {}

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
        <Hang nhan="Khách hàng" giaTri={khach.ho_ten} />
        <Hang nhan="Mã khách" giaTri={khach.ma_khach} />
        <Hang nhan="Điện thoại" giaTri={khach.so_dien_thoai} />
        <Hang nhan="Ngày đo" giaTri={dinhDangNgay(hoSo.ngay_do)} />
        <Hang nhan="Tên lần đo" giaTri={hoSo.ten_ho_so} />
        <Hang nhan="Người đo" giaTri={hoSo.nguoi_do || '—'} />
      </div>

      {NHOM_SO_DO.map((nhom) => (
        <div key={nhom.tieuDe}>
          <p className="mb-2 text-sm font-bold text-slate-900">{nhom.tieuDe}</p>
          <table className="w-full border-collapse text-sm">
            <tbody>
              {chiaDoi(nhom.chiSo).map((cap, i) => (
                <tr key={i}>
                  {cap.map((cs) => (
                    <Fragment key={cs.ma}>
                      <td className="w-1/4 border border-slate-300 px-3 py-1.5 text-slate-600">
                        {cs.ten}
                      </td>
                      <td className="w-1/4 border border-slate-300 px-3 py-1.5 text-right font-semibold tabular-nums">
                        {soDo[cs.ma] !== undefined ? `${soDo[cs.ma]} ${cs.donVi}` : '………'}
                      </td>
                    </Fragment>
                  ))}
                  {cap.length === 1 && (
                    <>
                      <td className="border border-slate-300 px-3 py-1.5" />
                      <td className="border border-slate-300 px-3 py-1.5" />
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <div>
        <p className="mb-1.5 text-sm font-bold text-slate-900">Ghi chú của thợ</p>
        <div className="min-h-16 rounded border border-slate-300 p-2 text-sm text-slate-700">
          {hoSo.ghi_chu || ''}
        </div>
      </div>
    </div>
  )
}

function NoiDungDonHang({ donId }: { donId: string }) {
  const don = useDonHang(donId || null)
  const dong = useDongSanPham(donId || null)

  if (!don.data) {
    return <EmptyState tieuDe="Chưa chọn đơn hàng" moTa="Hãy chọn đơn ở ô phía trên." />
  }

  const d = don.data

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
        <Hang nhan="Mã đơn" giaTri={d.ma_don} />
        <Hang nhan="Khách hàng" giaTri={d.ten_khach} />
        <Hang nhan="Điện thoại" giaTri={d.sdt_khach} />
        <Hang nhan="Trạng thái" giaTri={NHAN_TRANG_THAI[d.trang_thai]} />
        <Hang nhan="Ngày nhận" giaTri={dinhDangNgay(d.ngay_nhan)} />
        <Hang nhan="Ngày hẹn giao" giaTri={dinhDangNgay(d.ngay_hen_giao)} />
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-100">
            <th className="border border-slate-300 px-3 py-2 text-left font-semibold">STT</th>
            <th className="border border-slate-300 px-3 py-2 text-left font-semibold">Sản phẩm</th>
            <th className="border border-slate-300 px-3 py-2 text-right font-semibold">SL</th>
            <th className="border border-slate-300 px-3 py-2 text-right font-semibold">Đơn giá</th>
            <th className="border border-slate-300 px-3 py-2 text-right font-semibold">
              Thành tiền
            </th>
          </tr>
        </thead>
        <tbody>
          {(dong.data ?? []).map((sp, i) => (
            <tr key={sp.id}>
              <td className="border border-slate-300 px-3 py-2 tabular-nums">{i + 1}</td>
              <td className="border border-slate-300 px-3 py-2">
                {sp.ten_san_pham}
                {sp.ghi_chu && (
                  <span className="block text-xs text-slate-500">{sp.ghi_chu}</span>
                )}
              </td>
              <td className="border border-slate-300 px-3 py-2 text-right tabular-nums">
                {sp.so_luong}
              </td>
              <td className="border border-slate-300 px-3 py-2 text-right tabular-nums">
                {dinhDangTien(Number(sp.don_gia))}
              </td>
              <td className="border border-slate-300 px-3 py-2 text-right font-semibold tabular-nums">
                {dinhDangTien(Number(sp.thanh_tien))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="ml-auto w-full max-w-xs space-y-1.5 text-sm">
        <DongTien nhan="Tổng tiền hàng" giaTri={dinhDangTien(Number(d.tong_tien_hang))} />
        <DongTien nhan="Giảm giá" giaTri={`− ${dinhDangTien(Number(d.giam_gia))}`} />
        <DongTien nhan="Thành tiền" giaTri={dinhDangTien(Number(d.thanh_tien))} dam />
        <DongTien nhan="Đã thanh toán" giaTri={dinhDangTien(Number(d.da_tra))} />
        <DongTien nhan="Còn phải trả" giaTri={dinhDangTien(Number(d.con_lai))} dam />
      </div>

      {d.ghi_chu && (
        <div>
          <p className="mb-1 text-sm font-bold text-slate-900">Ghi chú</p>
          <p className="text-sm text-slate-700">{d.ghi_chu}</p>
        </div>
      )}
    </div>
  )
}

function NoiDungThanhToan({ donId }: { donId: string }) {
  const don = useDonHang(donId || null)
  const lichSu = useLichSuThanhToan(donId || null)

  if (!don.data) {
    return <EmptyState tieuDe="Chưa chọn đơn hàng" moTa="Hãy chọn đơn ở ô phía trên." />
  }

  const d = don.data
  const ds = lichSu.data ?? []

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
        <Hang nhan="Mã đơn" giaTri={d.ma_don} />
        <Hang nhan="Khách hàng" giaTri={d.ten_khach} />
        <Hang nhan="Điện thoại" giaTri={d.sdt_khach} />
        <Hang nhan="Ngày lập phiếu" giaTri={dinhDangNgay(new Date())} />
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-100">
            <th className="border border-slate-300 px-3 py-2 text-left font-semibold">Ngày</th>
            <th className="border border-slate-300 px-3 py-2 text-left font-semibold">Hình thức</th>
            <th className="border border-slate-300 px-3 py-2 text-left font-semibold">Nội dung</th>
            <th className="border border-slate-300 px-3 py-2 text-right font-semibold">Số tiền</th>
          </tr>
        </thead>
        <tbody>
          {ds.length === 0 ? (
            <tr>
              <td colSpan={4} className="border border-slate-300 px-3 py-4 text-center text-slate-500">
                Chưa có khoản thanh toán nào
              </td>
            </tr>
          ) : (
            [...ds].reverse().map((t) => (
              <tr key={t.id}>
                <td className="border border-slate-300 px-3 py-2 tabular-nums">
                  {dinhDangNgay(t.ngay_thanh_toan)}
                </td>
                <td className="border border-slate-300 px-3 py-2">
                  {NHAN_HINH_THUC_TT[t.hinh_thuc]}
                </td>
                <td className="border border-slate-300 px-3 py-2">
                  {t.la_tien_coc ? 'Đặt cọc' : 'Thanh toán'}
                  {t.ghi_chu ? ` — ${t.ghi_chu}` : ''}
                </td>
                <td className="border border-slate-300 px-3 py-2 text-right font-semibold tabular-nums">
                  {dinhDangTien(Number(t.so_tien))}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="ml-auto w-full max-w-xs space-y-1.5 text-sm">
        <DongTien nhan="Thành tiền đơn hàng" giaTri={dinhDangTien(Number(d.thanh_tien))} />
        <DongTien nhan="Tổng đã thu" giaTri={dinhDangTien(Number(d.da_tra))} dam />
        <DongTien nhan="Còn phải trả" giaTri={dinhDangTien(Number(d.con_lai))} dam />
      </div>
    </div>
  )
}

function DongTien({ nhan, giaTri, dam }: { nhan: string; giaTri: string; dam?: boolean }) {
  return (
    <div
      className={`flex justify-between gap-4 ${
        dam ? 'border-t border-slate-300 pt-1.5 text-base font-bold' : 'text-slate-600'
      }`}
    >
      <span>{nhan}</span>
      <span className="tabular-nums text-slate-900">{giaTri}</span>
    </div>
  )
}

function ChanKy() {
  return (
    <footer className="mt-10 grid grid-cols-2 gap-6 text-center text-sm">
      <div>
        <p className="font-semibold text-slate-900">Khách hàng</p>
        <p className="text-xs text-slate-500">(Ký, ghi rõ họ tên)</p>
        <div className="h-20" />
      </div>
      <div>
        <p className="font-semibold text-slate-900">Đại diện nhà may</p>
        <p className="text-xs text-slate-500">(Ký, ghi rõ họ tên)</p>
        <div className="h-20" />
      </div>
    </footer>
  )
}

/** Chia danh sách chỉ số thành từng cặp để xếp 2 cột trên giấy. */
function chiaDoi(ds: ChiSoDo[]): ChiSoDo[][] {
  const kq: ChiSoDo[][] = []
  for (let i = 0; i < ds.length; i += 2) kq.push(ds.slice(i, i + 2))
  return kq
}
