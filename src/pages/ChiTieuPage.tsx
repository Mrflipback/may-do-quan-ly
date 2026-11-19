import { useMemo, useState } from 'react'
import {
  Banknote,
  Building2,
  HandCoins,
  Plus,
  Receipt,
  Trash2,
  TriangleAlert,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input, Select, Textarea } from '@/components/ui/Field'
import { StatCard } from '@/components/ui/StatCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { BaoLoi, DangTaiBang } from '@/components/ui/TrangThaiTai'
import { useThongBao } from '@/components/ui/ThongBao'
import { NHAN_HINH_THUC_TT } from '@/lib/constants'
import { cn, dinhDangSo, dinhDangTien } from '@/lib/utils'
import { dichLoi } from '@/lib/loi'
import {
  NHAN_LOAI_CHI_PHI,
  useChiPhi,
  useCongNoNcc,
  useThemChiPhi,
  useThemNcc,
  useTraNcc,
  useXoaChiPhi,
  type LoaiChiPhi,
} from '@/data/chiTieu'
import type { HinhThucThanhToan } from '@/types'

function ngayISO(lui = 0): string {
  const d = new Date()
  d.setDate(d.getDate() - lui)
  const hai = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${hai(d.getMonth() + 1)}-${hai(d.getDate())}`
}

type The = 'chi_phi' | 'ncc'

/**
 * CHI TIÊU
 * ------------------------------------------------------------------
 * Hai mảng TIỀN RA, bù lại cho phần tiền VÀO vốn đã theo dõi rất kỹ:
 *
 *   · Chi phí chung — thuê nhà, điện nước, lương thợ
 *   · Công nợ nhà cung cấp — mình nợ ai bao nhiêu
 *
 * Tiền vải không nằm ở đây, nó đã có trong mục Kho.
 */
export function ChiTieuPage() {
  const [the, setThe] = useState<The>('chi_phi')

  return (
    <div>
      <PageHeader
        tieuDe="Chi tiêu"
        moTa="Tiền ra: chi phí chung và công nợ nhà cung cấp"
      />

      <div
        role="tablist"
        aria-label="Loại chi tiêu"
        className="mb-5 inline-flex rounded-xl bg-slate-100 p-1"
      >
        {(
          [
            { ma: 'chi_phi', nhan: 'Chi phí chung', Hinh: Receipt },
            { ma: 'ncc', nhan: 'Nhà cung cấp', Hinh: Building2 },
          ] as const
        ).map(({ ma, nhan, Hinh }) => (
          <button
            key={ma}
            type="button"
            role="tab"
            data-the={ma}
            aria-selected={the === ma}
            onClick={() => setThe(ma)}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all',
              the === ma ? 'bg-paper text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700',
            )}
          >
            <Hinh className="size-4" />
            {nhan}
          </button>
        ))}
      </div>

      {the === 'chi_phi' ? <PhanChiPhi /> : <PhanNcc />}
    </div>
  )
}

/* ================================================================== */
/*  Chi phí chung                                                      */
/* ================================================================== */

function PhanChiPhi() {
  const tb = useThongBao()
  const [tuNgay, setTuNgay] = useState(ngayISO(29))
  const [denNgay, setDenNgay] = useState(ngayISO(0))

  const ds = useChiPhi(tuNgay, denNgay)
  const them = useThemChiPhi()
  const xoa = useXoaChiPhi()

  const [ngay, setNgay] = useState(ngayISO(0))
  const [loai, setLoai] = useState<LoaiChiPhi>('khac')
  const [soTien, setSoTien] = useState('')
  const [ghiChu, setGhiChu] = useState('')

  const tong = useMemo(
    () => (ds.data ?? []).reduce((s, c) => s + Number(c.so_tien), 0),
    [ds.data],
  )

  /** Cộng theo từng loại, để thấy tiền đi đâu nhiều nhất. */
  const theoLoai = useMemo(() => {
    const m = new Map<LoaiChiPhi, number>()
    for (const c of ds.data ?? []) m.set(c.loai, (m.get(c.loai) ?? 0) + Number(c.so_tien))
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [ds.data])

  const gui = async (e: React.FormEvent) => {
    e.preventDefault()
    const n = Number(soTien.replace(/[^\d]/g, ''))
    if (!Number.isFinite(n) || n <= 0) return tb.loi('Số tiền phải lớn hơn 0.')
    try {
      await them.mutateAsync({ ngay, loai, so_tien: n, ghi_chu: ghiChu.trim() || null })
      setSoTien('')
      setGhiChu('')
      tb.thanhCong(`Đã ghi khoản chi ${dinhDangTien(n)}.`)
    } catch (err) {
      tb.loi(dichLoi(err))
    }
  }

  return (
    <>
      <Card className="mb-5">
        <CardBody className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input nhan="Từ ngày" type="date" value={tuNgay} onChange={(e) => setTuNgay(e.target.value)} />
          <Input nhan="Đến ngày" type="date" value={denNgay} onChange={(e) => setDenNgay(e.target.value)} />
        </CardBody>
      </Card>

      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <StatCard
          nhan="Tổng chi phí trong kỳ"
          giaTri={dinhDangTien(tong)}
          icon={<Receipt className="size-5" />}
          mauIcon="bg-rose-50 text-rose-700"
          chuThich={`${dinhDangSo((ds.data ?? []).length)} khoản`}
        />
        <StatCard
          nhan="Khoản tốn nhất"
          giaTri={theoLoai.length > 0 ? dinhDangTien(theoLoai[0][1]) : '—'}
          icon={<Banknote className="size-5" />}
          mauIcon="bg-amber-50 text-amber-700"
          chuThich={theoLoai.length > 0 ? NHAN_LOAI_CHI_PHI[theoLoai[0][0]] : undefined}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader tieuDe="Các khoản đã chi" />
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
            ) : (ds.data ?? []).length === 0 ? (
              <EmptyState
                icon={<Receipt className="size-6" />}
                tieuDe="Chưa ghi khoản chi nào"
                moTa="Ghi ở ô bên phải. Có đủ chi phí thì báo cáo mới tính được lãi thật."
              />
            ) : (
              <ul className="divide-y divide-slate-200/70">
                {(ds.data ?? []).map((c) => (
                  <li key={c.id} data-chi-phi className="flex items-center gap-3 px-4 py-3 sm:px-5">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-900">
                          {dinhDangTien(Number(c.so_tien))}
                        </span>
                        <Badge>{NHAN_LOAI_CHI_PHI[c.loai]}</Badge>
                      </div>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {new Date(`${c.ngay}T12:00:00`).toLocaleDateString('vi-VN')}
                        {c.ghi_chu ? ` · ${c.ghi_chu}` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label={`Xoá khoản chi ${dinhDangTien(Number(c.so_tien))}`}
                      onClick={() => void xoa.mutateAsync(c.id).catch((e) => tb.loi(dichLoi(e)))}
                      className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader tieuDe="Ghi một khoản chi" />
          <CardBody>
            <form onSubmit={gui} className="space-y-3">
              <Input nhan="Ngày" type="date" value={ngay} onChange={(e) => setNgay(e.target.value)} />
              <Select
                nhan="Khoản gì"
                value={loai}
                onChange={(e) => setLoai(e.target.value as LoaiChiPhi)}
              >
                {(Object.keys(NHAN_LOAI_CHI_PHI) as LoaiChiPhi[]).map((l) => (
                  <option key={l} value={l}>
                    {NHAN_LOAI_CHI_PHI[l]}
                  </option>
                ))}
              </Select>
              <Input
                nhan="Số tiền"
                batBuoc
                inputMode="numeric"
                value={soTien}
                onChange={(e) => setSoTien(e.target.value)}
                placeholder="2.000.000"
              />
              <Textarea
                nhan="Ghi chú"
                value={ghiChu}
                onChange={(e) => setGhiChu(e.target.value)}
                rows={2}
                placeholder="Tiền nhà tháng 11…"
              />
              <Button type="submit" className="w-full" iconTrai={<Plus className="size-4" />} dangTai={them.isPending}>
                Ghi khoản chi
              </Button>
            </form>

            <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-500 ring-1 ring-slate-200">
              <strong>Tiền vải không ghi ở đây</strong> — nó đã nằm trong mục Kho rồi. Ghi lại
              lần nữa là tính hai lần, lãi sẽ thành âm oan.
            </p>
          </CardBody>
        </Card>
      </div>
    </>
  )
}

/* ================================================================== */
/*  Nhà cung cấp và công nợ                                            */
/* ================================================================== */

function PhanNcc() {
  const tb = useThongBao()
  const ds = useCongNoNcc()
  const themNcc = useThemNcc()
  const tra = useTraNcc()

  const [ten, setTen] = useState('')
  const [sdt, setSdt] = useState('')
  const [diaChi, setDiaChi] = useState('')

  const [traAi, setTraAi] = useState('')
  const [traTien, setTraTien] = useState('')
  const [traHinhThuc, setTraHinhThuc] = useState<HinhThucThanhToan>('tien_mat')
  const [traNgay, setTraNgay] = useState(ngayISO(0))

  const tongNo = useMemo(
    () => (ds.data ?? []).reduce((s, n) => s + Math.max(0, Number(n.con_no)), 0),
    [ds.data],
  )
  const dangNo = (ds.data ?? []).filter((n) => Number(n.con_no) > 0)

  const them = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ten.trim()) return tb.loi('Phải có tên nhà cung cấp.')
    try {
      await themNcc.mutateAsync({
        ten: ten.trim(),
        so_dien_thoai: sdt.trim(),
        dia_chi: diaChi.trim() || null,
        ghi_chu: null,
      })
      setTen('')
      setSdt('')
      setDiaChi('')
      tb.thanhCong('Đã thêm nhà cung cấp.')
    } catch (err) {
      tb.loi(dichLoi(err))
    }
  }

  const ghiTra = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!traAi) return tb.loi('Chọn trả cho ai đã.')
    const n = Number(traTien.replace(/[^\d]/g, ''))
    if (!Number.isFinite(n) || n <= 0) return tb.loi('Số tiền phải lớn hơn 0.')
    try {
      await tra.mutateAsync({
        nha_cung_cap_id: traAi,
        so_tien: n,
        hinh_thuc: traHinhThuc,
        ngay: traNgay,
        ghi_chu: null,
      })
      setTraTien('')
      tb.thanhCong(`Đã ghi trả ${dinhDangTien(n)}.`)
    } catch (err) {
      tb.loi(dichLoi(err))
    }
  }

  return (
    <>
      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <StatCard
          nhan="Tiệm đang nợ"
          giaTri={dinhDangTien(tongNo)}
          icon={<HandCoins className="size-5" />}
          mauIcon={tongNo > 0 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}
          chuThich={`${dinhDangSo(dangNo.length)} nhà cung cấp`}
        />
        <StatCard
          nhan="Tổng nhà cung cấp"
          giaTri={dinhDangSo((ds.data ?? []).length)}
          icon={<Building2 className="size-5" />}
          mauIcon="bg-brand-50 text-brand-700"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader tieuDe="Sổ nợ nhà cung cấp" moTa="Đã nhập bao nhiêu, đã trả bao nhiêu" />
          <CardBody className="p-0">
            {ds.isLoading ? (
              <DangTaiBang />
            ) : ds.isError ? (
              <div className="p-4">
                <BaoLoi loi={ds.error} thuLai={() => void ds.refetch()} />
                <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-600/20">
                  Nếu báo <em>không tìm thấy</em>, nghĩa là chưa chạy file{' '}
                  <code className="font-mono">supabase/17_tho_may_chi_phi_ncc.sql</code>.
                </p>
              </div>
            ) : (ds.data ?? []).length === 0 ? (
              <EmptyState
                icon={<Building2 className="size-6" />}
                tieuDe="Chưa có nhà cung cấp nào"
                moTa="Thêm ở ô bên phải, rồi chọn nhà cung cấp mỗi lần nhập vải."
              />
            ) : (
              <ul className="divide-y divide-slate-200/70">
                {(ds.data ?? []).map((n) => {
                  const no = Number(n.con_no)
                  return (
                    <li key={n.id} data-ncc className="px-4 py-3.5 sm:px-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-slate-900">{n.ten}</span>
                        {no > 0 ? (
                          <Badge className="bg-rose-50 text-rose-700 ring-rose-600/20">
                            còn nợ {dinhDangTien(no)}
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-600/20">
                            đã trả đủ
                          </Badge>
                        )}
                        {!n.dang_hop_tac && <Badge>ngừng hợp tác</Badge>}
                      </div>
                      <p className="mt-0.5 text-sm text-slate-500">
                        Tiền hàng {dinhDangTien(Number(n.tien_hang))} · đã trả{' '}
                        {dinhDangTien(Number(n.da_tra))}
                        {n.so_dien_thoai ? ` · ${n.so_dien_thoai}` : ''}
                      </p>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardBody>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader tieuDe="Ghi trả tiền" />
            <CardBody>
              <form onSubmit={ghiTra} className="space-y-3">
                <Select nhan="Trả cho ai" value={traAi} onChange={(e) => setTraAi(e.target.value)}>
                  <option value="">— chọn nhà cung cấp —</option>
                  {(ds.data ?? []).map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.ten}
                      {Number(n.con_no) > 0 ? ` (nợ ${dinhDangTien(Number(n.con_no))})` : ''}
                    </option>
                  ))}
                </Select>
                <Input
                  nhan="Số tiền"
                  batBuoc
                  inputMode="numeric"
                  value={traTien}
                  onChange={(e) => setTraTien(e.target.value)}
                  placeholder="5.000.000"
                />
                <Select
                  nhan="Hình thức"
                  value={traHinhThuc}
                  onChange={(e) => setTraHinhThuc(e.target.value as HinhThucThanhToan)}
                >
                  {(Object.keys(NHAN_HINH_THUC_TT) as HinhThucThanhToan[]).map((h) => (
                    <option key={h} value={h}>
                      {NHAN_HINH_THUC_TT[h]}
                    </option>
                  ))}
                </Select>
                <Input nhan="Ngày" type="date" value={traNgay} onChange={(e) => setTraNgay(e.target.value)} />
                <Button type="submit" className="w-full" dangTai={tra.isPending}>
                  Ghi đã trả
                </Button>
              </form>
            </CardBody>
          </Card>

          <Card>
            <CardHeader tieuDe="Thêm nhà cung cấp" />
            <CardBody>
              <form onSubmit={them} className="space-y-3">
                <Input nhan="Tên" batBuoc value={ten} onChange={(e) => setTen(e.target.value)} placeholder="Vải Phúc Thịnh" />
                <Input nhan="Số điện thoại" value={sdt} onChange={(e) => setSdt(e.target.value)} />
                <Input nhan="Địa chỉ" value={diaChi} onChange={(e) => setDiaChi(e.target.value)} />
                <Button type="submit" kieu="phu" className="w-full" iconTrai={<Plus className="size-4" />} dangTai={themNcc.isPending}>
                  Thêm
                </Button>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>

      <Card className="mt-5">
        <CardBody className="flex gap-3">
          <TriangleAlert className="size-5 shrink-0 text-amber-600" />
          <p className="text-sm text-slate-600">
            Sổ nợ chỉ tính được những lần nhập vải <strong>có chọn nhà cung cấp</strong>. Mấy
            lần nhập từ trước khi có mục này đều chưa gắn, nên không nằm trong con số nợ.
          </p>
        </CardBody>
      </Card>
    </>
  )
}
