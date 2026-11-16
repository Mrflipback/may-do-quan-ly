import { useState } from 'react'
import { Camera, Download, ShieldCheck } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { useThongBao } from '@/components/ui/ThongBao'
import { dinhDangSo } from '@/lib/utils'
import { dichLoi } from '@/lib/loi'
import { taiBanChup, useDanhSachBanChup, type BanChup } from '@/data/datLaiCaiDat'

/**
 * Danh sách bản lưu mà cơ sở dữ liệu TỰ chụp khi có việc nặng về tiền.
 * Xem supabase/14_sao_luu_khan.sql.
 */
export function TheBanChupKhan() {
  const tb = useThongBao()
  const ds = useDanhSachBanChup()
  const [dangTai, setDangTai] = useState<number | null>(null)

  const tai = async (b: BanChup) => {
    setDangTai(b.id)
    try {
      await taiBanChup(b)
      tb.thanhCong('Đã tải bản chụp về máy.')
    } catch (e) {
      tb.loi(dichLoi(e))
    } finally {
      setDangTai(null)
    }
  }

  const luc = (iso: string) => {
    const d = new Date(iso)
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('vi-VN')
  }

  return (
    <Card>
      <CardHeader
        tieuDe="Bản lưu tự chụp"
        moTa="Cơ sở dữ liệu tự cất một bản khi có việc nặng về tiền"
      />
      <CardBody className="space-y-4">
        <div className="flex gap-3">
          <Camera className="size-5 shrink-0 text-brand-700" />
          <div className="space-y-1.5 text-sm text-slate-600">
            <p>
              Khi có người <strong>xoá tiền khách đã trả</strong>,{' '}
              <strong>sửa tiền thấp xuống</strong>, hoặc <strong>xoá nhiều thứ liên tiếp</strong>,
              máy chủ tự chụp lại toàn bộ sổ sách ngay lúc đó.
            </p>
            <p className="text-slate-500">
              Giữ 10 bản gần nhất, mỗi 30 phút chỉ chụp một lần. Việc chụp làm ở tầng cơ sở dữ
              liệu nên không ai tắt được.
            </p>
          </div>
        </div>

        {ds.isLoading ? (
          <p className="text-sm text-slate-500">Đang xem có bản nào…</p>
        ) : ds.isError ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800 ring-1 ring-amber-600/20">
            Chưa chạy <code className="font-mono">supabase/14_sao_luu_khan.sql</code> trên
            Supabase nên phần này chưa hoạt động.
          </p>
        ) : (ds.data ?? []).length === 0 ? (
          <EmptyState
            icon={<ShieldCheck className="size-6" />}
            tieuDe="Chưa có bản chụp nào"
            moTa="Tốt — nghĩa là chưa có việc nặng nào về tiền xảy ra."
          />
        ) : (
          <ul className="divide-y divide-slate-200/70 rounded-xl ring-1 ring-slate-200">
            {(ds.data ?? []).map((b) => (
              <li key={b.id} data-ban-chup className="flex flex-wrap items-center gap-3 p-3.5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900">{b.ly_do}</span>
                    <Badge className="bg-rose-50 text-rose-700 ring-rose-600/20">
                      {b.ten_nguoi}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {luc(b.thoi_diem)} · {dinhDangSo(b.so_dong)} dòng ·{' '}
                    {dinhDangSo(b.co_bao_nhieu_kb)} KB
                  </p>
                </div>
                <Button
                  kieu="phu"
                  co="nho"
                  iconTrai={<Download className="size-4" />}
                  onClick={() => void tai(b)}
                  dangTai={dangTai === b.id}
                >
                  Tải về
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  )
}
