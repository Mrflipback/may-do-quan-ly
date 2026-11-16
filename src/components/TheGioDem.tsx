import { useEffect, useState } from 'react'
import { Moon } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Field'
import { useThongBao } from '@/components/ui/ThongBao'
import { useCaiDat, useLuuCaiDat } from '@/data/heThong'
import { dichLoi } from '@/lib/loi'
import { KHOA_GIO_DEN, KHOA_GIO_TU, KHUNG_GIO_MAC_DINH, docKhungGio } from '@/lib/dauHieuLa'

const GIO = Array.from({ length: 24 }, (_, i) => i)
const nhanGio = (g: number) => `${String(g).padStart(2, '0')}:00`

export function TheGioDem() {
  const tb = useThongBao()
  const { data: caiDat } = useCaiDat()
  const luu = useLuuCaiDat()

  const [tu, setTu] = useState(KHUNG_GIO_MAC_DINH.tu)
  const [den, setDen] = useState(KHUNG_GIO_MAC_DINH.den)

  useEffect(() => {
    if (!caiDat) return
    const k = docKhungGio(caiDat)
    setTu(k.tu)
    setDen(k.den)
  }, [caiDat])

  const ghi = async () => {
    try {
      await luu.mutateAsync({ [KHOA_GIO_TU]: String(tu), [KHOA_GIO_DEN]: String(den) })
      tb.thanhCong('Đã lưu khung giờ. Nhật ký sẽ đánh dấu lại theo mốc mới.')
    } catch (e) {
      tb.loi(dichLoi(e))
    }
  }

  const khungRong = tu === den

  return (
    <Card>
      <CardHeader
        tieuDe="Giờ tiệm đóng cửa"
        moTa="Dùng để đánh dấu việc làm ngoài giờ trong nhật ký"
      />
      <CardBody className="space-y-4">
        <div className="flex gap-3">
          <Moon className="size-5 shrink-0 text-brand-700" />
          <p className="text-sm text-slate-600">
            Trong hai cuốn nhật ký, những lần đăng nhập và những thao tác rơi vào khung giờ này
            sẽ được <strong>đánh dấu</strong> để bạn nhìn kỹ. Chỉ là dấu hiệu — nhân viên ở lại
            muộn dọn sổ sách cũng rơi vào đây.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Select nhan="Từ" value={String(tu)} onChange={(e) => setTu(Number(e.target.value))}>
            {GIO.map((g) => (
              <option key={g} value={g}>
                {nhanGio(g)}
              </option>
            ))}
          </Select>
          <Select nhan="Đến" value={String(den)} onChange={(e) => setDen(Number(e.target.value))}>
            {GIO.map((g) => (
              <option key={g} value={g}>
                {nhanGio(g)}
              </option>
            ))}
          </Select>
        </div>

        <p
          className={
            khungRong
              ? 'rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800 ring-1 ring-amber-600/20'
              : 'rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-600 ring-1 ring-slate-200'
          }
        >
          {khungRong ? (
            <>
              Hai ô đang giống nhau nên <strong>không đánh dấu giờ giấc nữa</strong>. Đặt vậy
              cũng được, nếu bạn thấy dấu này phiền.
            </>
          ) : (
            <>
              Đang đánh dấu mọi việc làm từ <strong>{nhanGio(tu)}</strong> tối hôm trước tới{' '}
              <strong>{nhanGio(den)}</strong> sáng hôm sau. Tính theo giờ trên máy bạn đang dùng.
            </>
          )}
        </p>

        <Button onClick={() => void ghi()} dangTai={luu.isPending}>
          Lưu khung giờ
        </Button>
      </CardBody>
    </Card>
  )
}
