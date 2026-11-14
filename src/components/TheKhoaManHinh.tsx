import { useEffect, useState } from 'react'
import { Lock, MonitorOff } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Field'
import { useThongBao } from '@/components/ui/ThongBao'
import { useCaiDat, useLuuCaiDat } from '@/data/heThong'
import { dichLoi } from '@/lib/loi'
import { KHOA_PHUT } from '@/components/KhoaManHinh'

const KHOA_CHAN = 'chan_devtools'

const MUC_PHUT = [
  { v: '0', nhan: 'Không khoá' },
  { v: '5', nhan: 'Sau 5 phút' },
  { v: '10', nhan: 'Sau 10 phút' },
  { v: '15', nhan: 'Sau 15 phút' },
  { v: '30', nhan: 'Sau 30 phút' },
  { v: '60', nhan: 'Sau 1 tiếng' },
]

export function TheKhoaManHinh() {
  const tb = useThongBao()
  const { data: caiDat } = useCaiDat()
  const luu = useLuuCaiDat()

  const [phut, setPhut] = useState('0')
  const [chan, setChan] = useState(false)

  useEffect(() => {
    if (!caiDat) return
    setPhut(caiDat[KHOA_PHUT] ?? '0')
    setChan(caiDat[KHOA_CHAN] === '1')
  }, [caiDat])

  const ghi = async () => {
    try {
      await luu.mutateAsync({ [KHOA_PHUT]: phut, [KHOA_CHAN]: chan ? '1' : '0' })
      tb.thanhCong('Đã lưu. Áp dụng cho mọi máy trong tiệm.')
    } catch (e) {
      tb.loi(dichLoi(e))
    }
  }

  return (
    <Card>
      <CardHeader
        tieuDe="Khoá máy khi để không"
        moTa="Áp dụng cho tất cả mọi người trong tiệm"
      />
      <CardBody className="space-y-4">
        <div className="flex gap-3">
          <Lock className="size-5 shrink-0 text-brand-700" />
          <p className="text-sm text-slate-600">
            Không đụng chuột gõ phím một lúc thì phần mềm <strong>che màn hình lại</strong>, phải
            gõ mật khẩu đăng nhập mới làm tiếp. Việc đang làm dở vẫn còn nguyên — khác với đăng
            xuất hẳn.
          </p>
        </div>

        <Select
          nhan="Khoá màn hình sau bao lâu"
          value={phut}
          onChange={(e) => setPhut(e.target.value)}
          goiY="Chọn mốc ngắn nếu máy đặt chỗ khách qua lại nhìn thấy."
        >
          {MUC_PHUT.map((m) => (
            <option key={m.v} value={m.v}>
              {m.nhan}
            </option>
          ))}
        </Select>

        <label className="flex cursor-pointer gap-3 border-t border-slate-200/80 pt-4">
          <input
            type="checkbox"
            checked={chan}
            onChange={(e) => setChan(e.target.checked)}
            className="mt-0.5 size-4 shrink-0 accent-brand-700"
          />
          <span className="text-sm text-slate-600">
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
              <MonitorOff className="size-4" />
              Nuốt phím tắt mở công cụ lập trình
            </span>
            <span className="mt-1 block text-slate-500">
              Bấm F12, Ctrl+Shift+I hay Ctrl+U sẽ không ăn gì. Ô này chỉ ăn cho{' '}
              <strong>phần quản lý</strong> — trang giới thiệu và trang đăng nhập luôn bật
              sẵn, không tắt được. Khi nào cần xem lỗi thì tắt ô này đi.
            </span>
          </span>
        </label>

        <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-xs text-amber-800 ring-1 ring-amber-600/20">
          <strong>Nói thẳng về mục vừa rồi:</strong> nó chặn người tiện tay, không chặn người cố
          tình. Ai biết việc vẫn mở công cụ qua menu của trình duyệt trong ba giây, hoặc bỏ qua
          trình duyệt luôn. Mã nguồn phần mềm cũng đang công khai trên GitHub. Thứ thật sự giữ
          dữ liệu là <strong>phân quyền ở máy chủ</strong> và <strong>mật khẩu xoá</strong>, không
          phải ô này. Bật cho đỡ ngứa mắt thì được, đừng vì có nó mà yên tâm hơn.
        </p>

        <Button onClick={() => void ghi()} dangTai={luu.isPending}>
          Lưu cài đặt
        </Button>
      </CardBody>
    </Card>
  )
}
