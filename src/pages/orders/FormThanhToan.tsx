import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Field'
import { useThongBao } from '@/components/ui/ThongBao'
import { NHAN_HINH_THUC_TT } from '@/lib/constants'
import { dinhDangTien } from '@/lib/utils'
import { dichLoi } from '@/lib/loi'
import { useGhiThanhToan } from '@/data/thanhToan'
import type { DonHangDayDu, HinhThucThanhToan } from '@/types'

interface Props {
  don: DonHangDayDu | null
  dong: () => void
}

export function FormThanhToan({ don, dong }: Props) {
  const tb = useThongBao()
  const ghi = useGhiThanhToan()

  const [soTien, setSoTien] = useState('')
  const [hinhThuc, setHinhThuc] = useState<HinhThucThanhToan>('tien_mat')
  const [laCoc, setLaCoc] = useState(false)
  const [ngay, setNgay] = useState(new Date().toISOString().slice(0, 10))
  const [ghiChu, setGhiChu] = useState('')

  const conLai = Number(don?.con_lai ?? 0)
  const daTra = Number(don?.da_tra ?? 0)

  useEffect(() => {
    if (!don) return
    setSoTien(String(Math.max(0, conLai)))
    setHinhThuc('tien_mat')
    setLaCoc(daTra === 0)
    setNgay(new Date().toISOString().slice(0, 10))
    setGhiChu('')
  }, [don, conLai, daTra])

  const luu = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!don) return

    const tien = Number(soTien)
    if (!Number.isFinite(tien) || tien <= 0) return tb.loi('Số tiền phải lớn hơn 0.')
    if (tien > conLai + 0.5)
      return tb.loi(`Đơn này chỉ còn phải thu ${dinhDangTien(conLai)}.`)

    try {
      await ghi.mutateAsync({
        don_hang_id: don.id,
        so_tien: tien,
        hinh_thuc: hinhThuc,
        la_tien_coc: laCoc,
        ngay_thanh_toan: ngay,
        ghi_chu: ghiChu.trim() || null,
      })
      tb.thanhCong(`Đã ghi nhận ${dinhDangTien(tien)} cho đơn ${don.ma_don}.`)
      dong()
    } catch (err) {
      tb.loi(dichLoi(err))
    }
  }

  return (
    <Modal
      moRa={Boolean(don)}
      dong={dong}
      tieuDe="Ghi nhận thanh toán"
      moTa={don ? `Đơn ${don.ma_don} — ${don.ten_khach}` : ''}
      chanTrang={
        <>
          <Button kieu="phu" onClick={dong} disabled={ghi.isPending}>
            Hủy
          </Button>
          <Button type="submit" form="form-thanh-toan" dangTai={ghi.isPending}>
            Ghi nhận
          </Button>
        </>
      }
    >
      {don && (
        <form id="form-thanh-toan" onSubmit={luu} className="space-y-4">
          <div className="grid grid-cols-3 gap-3 rounded-xl bg-slate-50 p-4 text-center ring-1 ring-slate-200">
            <div>
              <p className="text-xs text-slate-500">Thành tiền</p>
              <p className="mt-0.5 text-sm font-bold tabular-nums text-slate-900">
                {dinhDangTien(Number(don.thanh_tien))}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Đã trả</p>
              <p className="mt-0.5 text-sm font-bold tabular-nums text-emerald-600">
                {dinhDangTien(daTra)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Còn lại</p>
              <p className="mt-0.5 text-sm font-bold tabular-nums text-rose-600">
                {dinhDangTien(conLai)}
              </p>
            </div>
          </div>

          <Input
            nhan="Số tiền nhận"
            batBuoc
            type="number"
            min="0"
            step="1000"
            inputMode="numeric"
            value={soTien}
            onChange={(e) => setSoTien(e.target.value)}
            goiY={`Tối đa ${dinhDangTien(conLai)}`}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              nhan="Hình thức"
              value={hinhThuc}
              onChange={(e) => setHinhThuc(e.target.value as HinhThucThanhToan)}
            >
              {(Object.keys(NHAN_HINH_THUC_TT) as HinhThucThanhToan[]).map((h) => (
                <option key={h} value={h}>
                  {NHAN_HINH_THUC_TT[h]}
                </option>
              ))}
            </Select>
            <Input
              nhan="Ngày thu"
              type="date"
              value={ngay}
              onChange={(e) => setNgay(e.target.value)}
            />
          </div>

          <label className="flex items-center gap-2.5 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={laCoc}
              onChange={(e) => setLaCoc(e.target.checked)}
              className="size-4 rounded border-slate-300 text-brand-700 focus:ring-brand-500"
            />
            Đây là tiền đặt cọc
          </label>

          <Textarea
            nhan="Ghi chú"
            value={ghiChu}
            onChange={(e) => setGhiChu(e.target.value)}
            placeholder="Ví dụ: khách chuyển khoản Vietcombank…"
          />
        </form>
      )}
    </Modal>
  )
}
