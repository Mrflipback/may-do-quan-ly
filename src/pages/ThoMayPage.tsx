import { useMemo, useState } from 'react'
import { Scissors, TriangleAlert, UserPlus, Users } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input, Textarea } from '@/components/ui/Field'
import { StatCard } from '@/components/ui/StatCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { BaoLoi, DangTaiBang } from '@/components/ui/TrangThaiTai'
import { useThongBao } from '@/components/ui/ThongBao'
import { dinhDangSo, dinhDangTien } from '@/lib/utils'
import { dichLoi } from '@/lib/loi'
import {
  useChoThoNghi,
  useDanhSachTho,
  useThemTho,
  useThongKeTho,
} from '@/data/thoMay'

function ngayISO(lui = 0): string {
  const d = new Date()
  d.setDate(d.getDate() - lui)
  const hai = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${hai(d.getMonth() + 1)}-${hai(d.getDate())}`
}

/**
 * THỢ MAY
 * ------------------------------------------------------------------
 * Trước đây đơn hàng chỉ ghi `nguoi_tao` — người NHẬP đơn vào máy,
 * không phải người MAY. Nên khách phàn nàn đường chỉ thì không tra
 * được ai làm, và không biết ai đang ôm mấy đơn.
 */
export function ThoMayPage() {
  const tb = useThongBao()
  const [tuNgay, setTuNgay] = useState(ngayISO(29))
  const [denNgay, setDenNgay] = useState(ngayISO(0))

  const ds = useDanhSachTho(true)
  const tk = useThongKeTho(tuNgay, denNgay)
  const themTho = useThemTho()
  const choNghi = useChoThoNghi()

  const [tenMoi, setTenMoi] = useState('')
  const [sdtMoi, setSdtMoi] = useState('')
  const [ghiChuMoi, setGhiChuMoi] = useState('')

  /** Ghép danh sách thợ với số liệu, để một thợ chưa có đơn vẫn hiện ra. */
  const bang = useMemo(() => {
    const soLieu = new Map((tk.data ?? []).map((t) => [t.tho_may_id, t]))
    return (ds.data ?? []).map((t) => ({
      ...t,
      so_don: soLieu.get(t.id)?.so_don ?? 0,
      dang_may: soLieu.get(t.id)?.dang_may ?? 0,
      tre_hen: soLieu.get(t.id)?.tre_hen ?? 0,
      tien_hang: Number(soLieu.get(t.id)?.tien_hang ?? 0),
    }))
  }, [ds.data, tk.data])

  const dangLam = bang.filter((t) => t.dang_lam_viec)
  const tongDon = bang.reduce((s, t) => s + t.so_don, 0)
  const tongTre = bang.reduce((s, t) => s + t.tre_hen, 0)

  const them = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenMoi.trim()) return tb.loi('Phải có tên thợ.')
    try {
      await themTho.mutateAsync({
        ho_ten: tenMoi.trim(),
        so_dien_thoai: sdtMoi.trim(),
        ghi_chu: ghiChuMoi.trim() || null,
      })
      setTenMoi('')
      setSdtMoi('')
      setGhiChuMoi('')
      tb.thanhCong('Đã thêm thợ vào danh sách.')
    } catch (err) {
      tb.loi(dichLoi(err))
    }
  }

  const doiTrangThai = async (id: string, ten: string, dangLamViec: boolean) => {
    try {
      await choNghi.mutateAsync({ id, nghi: dangLamViec })
      tb.tin(dangLamViec ? `${ten} đã chuyển sang nghỉ việc.` : `${ten} đã đi làm lại.`)
    } catch (err) {
      tb.loi(dichLoi(err))
    }
  }

  return (
    <div>
      <PageHeader
        tieuDe="Thợ may"
        moTa="Ai đang may đơn nào, ai đang ôm nhiều việc, ai có đơn trễ hẹn"
      />

      {/* ----------------------------- Khoảng ngày ----------------------------- */}
      <Card className="mb-5">
        <CardBody className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            nhan="Từ ngày"
            type="date"
            value={tuNgay}
            onChange={(e) => setTuNgay(e.target.value)}
          />
          <Input
            nhan="Đến ngày"
            type="date"
            value={denNgay}
            onChange={(e) => setDenNgay(e.target.value)}
            goiY="Số liệu đếm theo ngày NHẬN đơn."
          />
        </CardBody>
      </Card>

      {/* ----------------------------- Mấy con số ----------------------------- */}
      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          nhan="Thợ đang làm việc"
          giaTri={dinhDangSo(dangLam.length)}
          icon={<Users className="size-5" />}
          mauIcon="bg-brand-50 text-brand-700"
          chuThich={
            bang.length > dangLam.length
              ? `${bang.length - dangLam.length} người đã nghỉ`
              : undefined
          }
        />
        <StatCard
          nhan="Đơn đã phân công"
          giaTri={dinhDangSo(tongDon)}
          icon={<Scissors className="size-5" />}
          mauIcon="bg-sky-50 text-sky-700"
          chuThich="Trong khoảng ngày đang chọn"
        />
        <StatCard
          nhan="Đơn trễ hẹn"
          giaTri={dinhDangSo(tongTre)}
          icon={<TriangleAlert className="size-5" />}
          mauIcon={tongTre > 0 ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-500'}
          chuThich="Quá ngày hẹn mà chưa giao"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* ------------------------- Danh sách thợ ------------------------- */}
        <Card className="lg:col-span-2">
          <CardHeader tieuDe="Danh sách thợ" moTa={`${bang.length} người`} />
          <CardBody className="p-0">
            {ds.isLoading ? (
              <DangTaiBang />
            ) : ds.isError ? (
              <div className="p-4">
                <BaoLoi loi={ds.error} thuLai={() => void ds.refetch()} />
                <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-600/20">
                  Nếu báo <em>không tìm thấy bảng</em>, nghĩa là chưa chạy file{' '}
                  <code className="font-mono">supabase/17_tho_may_chi_phi_ncc.sql</code>.
                </p>
              </div>
            ) : bang.length === 0 ? (
              <EmptyState
                icon={<Scissors className="size-6" />}
                tieuDe="Chưa có thợ nào"
                moTa="Thêm thợ ở ô bên phải, rồi gán vào đơn hàng."
              />
            ) : (
              <ul className="divide-y divide-slate-200/70">
                {bang.map((t) => (
                  <li key={t.id} data-tho className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:px-5">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-900">{t.ho_ten}</span>
                        {!t.dang_lam_viec && (
                          <Badge className="bg-slate-100 text-slate-600 ring-slate-500/20">
                            đã nghỉ
                          </Badge>
                        )}
                        {t.tre_hen > 0 && (
                          <Badge className="bg-rose-50 text-rose-700 ring-rose-600/20">
                            {t.tre_hen} đơn trễ hẹn
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {t.so_don} đơn · đang may {t.dang_may} · {dinhDangTien(t.tien_hang)}
                        {t.so_dien_thoai ? ` · ${t.so_dien_thoai}` : ''}
                      </p>
                      {t.ghi_chu && <p className="mt-0.5 text-xs text-slate-400">{t.ghi_chu}</p>}
                    </div>
                    <Button
                      kieu="phu"
                      co="nho"
                      onClick={() => void doiTrangThai(t.id, t.ho_ten, t.dang_lam_viec)}
                    >
                      {t.dang_lam_viec ? 'Cho nghỉ' : 'Đi làm lại'}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* ---------------------------- Thêm thợ ---------------------------- */}
        <Card>
          <CardHeader tieuDe="Thêm thợ" moTa="Không cần tài khoản đăng nhập" />
          <CardBody>
            <form onSubmit={them} className="space-y-3">
              <Input
                nhan="Tên thợ"
                batBuoc
                value={tenMoi}
                onChange={(e) => setTenMoi(e.target.value)}
                placeholder="Cô Hoa"
              />
              <Input
                nhan="Số điện thoại"
                value={sdtMoi}
                onChange={(e) => setSdtMoi(e.target.value)}
                placeholder="09xx xxx xxx"
              />
              <Textarea
                nhan="Ghi chú"
                value={ghiChuMoi}
                onChange={(e) => setGhiChuMoi(e.target.value)}
                rows={2}
                placeholder="Chuyên áo dài, làm thứ 2–6…"
              />
              <Button
                type="submit"
                className="w-full"
                iconTrai={<UserPlus className="size-4" />}
                dangTai={themTho.isPending}
              >
                Thêm vào danh sách
              </Button>
            </form>

            <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-500 ring-1 ring-slate-200">
              Thợ nghỉ việc thì bấm <strong>Cho nghỉ</strong>, đừng xoá. Xoá là mấy đơn cũ mất
              tên người may — mà đó đúng là thứ cần tra lại khi khách phàn nàn.
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
