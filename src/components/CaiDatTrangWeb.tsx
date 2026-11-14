import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, Globe, Plus, Trash2 } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Field'
import { BaoLoi, DangTaiBang } from '@/components/ui/TrangThaiTai'
import { useThongBao } from '@/components/ui/ThongBao'
import { useCaiDat, useLuuCaiDat } from '@/data/heThong'
import { BANG_GIA_MAU } from '@/data/thongTinTiem'
import { dichLoi } from '@/lib/loi'
import type { DongBangGia } from '@/types'

function docBangGia(tho: string | undefined): DongBangGia[] {
  if (!tho) return BANG_GIA_MAU
  try {
    const d = JSON.parse(tho)
    if (!Array.isArray(d) || d.length === 0) return BANG_GIA_MAU
    return d.map((r: Partial<DongBangGia>) => ({
      trang_phuc: String(r.trang_phuc ?? ''),
      cong_may: String(r.cong_may ?? ''),
      gia_tu: String(r.gia_tu ?? ''),
      thoi_gian: String(r.thoi_gian ?? ''),
    }))
  } catch {
    return BANG_GIA_MAU
  }
}

/**
 * Nội dung hiện trên trang web khách đặt may.
 *
 * Tên tiệm, số điện thoại và địa chỉ lấy luôn từ thẻ "Thông tin tiệm may"
 * bên cạnh, nên ở đây chỉ còn phần riêng của trang web.
 */
export function CaiDatTrangWeb() {
  const caiDat = useCaiDat()
  const luu = useLuuCaiDat()
  const tb = useThongBao()

  const [gioiThieu, setGioiThieu] = useState('')
  const [gioMoCua, setGioMoCua] = useState('')
  const [ghiChuGia, setGhiChuGia] = useState('')
  const [bangGia, setBangGia] = useState<DongBangGia[]>([])

  useEffect(() => {
    if (!caiDat.data) return
    setGioiThieu(caiDat.data.gioi_thieu ?? '')
    setGioMoCua(caiDat.data.gio_mo_cua ?? '')
    setGhiChuGia(caiDat.data.ghi_chu_gia ?? '')
    setBangGia(docBangGia(caiDat.data.bang_gia))
  }, [caiDat.data])

  function suaDong(i: number, cot: keyof DongBangGia, v: string) {
    setBangGia((cu) => cu.map((d, j) => (i === j ? { ...d, [cot]: v } : d)))
  }

  async function luuLai(e: React.FormEvent) {
    e.preventDefault()
    const sach = bangGia
      .map((d) => ({
        trang_phuc: d.trang_phuc.trim(),
        cong_may: d.cong_may.trim(),
        gia_tu: d.gia_tu.trim(),
        thoi_gian: d.thoi_gian.trim(),
      }))
      .filter((d) => d.trang_phuc)

    try {
      await luu.mutateAsync({
        gioi_thieu: gioiThieu.trim(),
        gio_mo_cua: gioMoCua.trim(),
        ghi_chu_gia: ghiChuGia.trim(),
        bang_gia: JSON.stringify(sach),
      })
      setBangGia(sach.length ? sach : BANG_GIA_MAU)
      tb.thanhCong('Đã lưu. Khách tải lại trang web là thấy nội dung mới.')
    } catch (err) {
      tb.loi(dichLoi(err))
    }
  }

  return (
    <Card>
      <CardHeader
        tieuDe="Trang web khách đặt may"
        moTa="Nội dung hiện trên trang khách xem. Tên tiệm, số điện thoại và địa chỉ lấy từ thẻ Thông tin tiệm may."
        hanhDong={
          <Link to="/tiem" target="_blank" rel="noopener noreferrer">
            <Button kieu="phu" co="nho" iconTrai={<ExternalLink className="size-4" />}>
              Xem trang
            </Button>
          </Link>
        }
      />

      {caiDat.isLoading ? (
        <DangTaiBang soDong={4} />
      ) : caiDat.isError ? (
        <BaoLoi loi={caiDat.error} thuLai={() => void caiDat.refetch()} />
      ) : (
        <CardBody>
          <form onSubmit={luuLai} className="space-y-4">
            <Textarea
              nhan="Dòng giới thiệu ở đầu trang"
              rows={2}
              value={gioiThieu}
              onChange={(e) => setGioiThieu(e.target.value)}
              placeholder="Áo dài, vest, sơ mi, quần âu, váy đầm và đồng phục — cắt theo số đo riêng."
            />
            <Textarea
              nhan="Giờ mở cửa"
              rows={2}
              goiY="Xuống dòng được, mỗi dòng một mốc giờ."
              value={gioMoCua}
              onChange={(e) => setGioMoCua(e.target.value)}
              placeholder={'Thứ 2 – Thứ 7: 8h00 – 19h00\nChủ nhật: 8h00 – 12h00'}
            />

            <div>
              <p className="text-sm font-medium text-slate-700">Bảng giá</p>
              <p className="mt-1 text-xs text-slate-500">
                Cột giá và thời gian nhận cả chữ, ví dụ “Báo giá theo số lượng” hay “2–3 ngày”. Dòng
                nào bỏ trống tên trang phục sẽ bị loại khi lưu.
              </p>

              <div className="mt-3 space-y-2">
                {bangGia.map((d, i) => (
                  <div key={i} className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-2 sm:grid-cols-9">
                    <Input
                      boxClassName="sm:col-span-3"
                      className="h-9"
                      aria-label="Trang phục"
                      placeholder="Trang phục"
                      value={d.trang_phuc}
                      onChange={(e) => suaDong(i, 'trang_phuc', e.target.value)}
                    />
                    <Input
                      boxClassName="sm:col-span-3"
                      className="h-9"
                      aria-label="Công may"
                      placeholder="Công may"
                      value={d.cong_may}
                      onChange={(e) => suaDong(i, 'cong_may', e.target.value)}
                    />
                    <Input
                      boxClassName="sm:col-span-1"
                      className="h-9"
                      aria-label="Giá từ"
                      placeholder="Giá từ"
                      value={d.gia_tu}
                      onChange={(e) => suaDong(i, 'gia_tu', e.target.value)}
                    />
                    <Input
                      boxClassName="sm:col-span-1"
                      className="h-9"
                      aria-label="Thời gian"
                      placeholder="Thời gian"
                      value={d.thoi_gian}
                      onChange={(e) => suaDong(i, 'thoi_gian', e.target.value)}
                    />
                    <div className="col-span-2 sm:col-span-1 sm:justify-self-end">
                      <Button
                        type="button"
                        kieu="mo"
                        co="nho"
                        aria-label={`Xoá dòng ${d.trang_phuc || i + 1}`}
                        onClick={() => setBangGia((cu) => cu.filter((_, j) => j !== i))}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  kieu="phu"
                  co="nho"
                  iconTrai={<Plus className="size-4" />}
                  onClick={() =>
                    setBangGia((cu) => [...cu, { trang_phuc: '', cong_may: '', gia_tu: '', thoi_gian: '' }])
                  }
                >
                  Thêm dòng
                </Button>
                <Button type="button" kieu="mo" co="nho" onClick={() => setBangGia(BANG_GIA_MAU)}>
                  Khôi phục bảng giá mẫu
                </Button>
              </div>
            </div>

            <Input
              nhan="Ghi chú dưới bảng giá"
              value={ghiChuGia}
              onChange={(e) => setGhiChuGia(e.target.value)}
              placeholder="Giá là công may, chưa gồm tiền vải. Khách mang vải đến được giảm."
            />

            <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4">
              <Button type="submit" dangTai={luu.isPending} iconTrai={<Globe className="size-4" />}>
                Lưu nội dung trang web
              </Button>
              <p className="text-xs text-slate-500">
                Khách vào địa chỉ web của tiệm là thấy trang này, không cần đăng nhập.
              </p>
            </div>
          </form>
        </CardBody>
      )}
    </Card>
  )
}
