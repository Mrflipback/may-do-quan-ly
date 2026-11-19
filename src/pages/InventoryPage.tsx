import { useEffect, useState } from 'react'
import { Boxes, Download, Package, Pencil, Plus, Search, Trash, Upload } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { StatCard } from '@/components/ui/StatCard'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input, Select, Textarea } from '@/components/ui/Field'
import { BaoLoi, DangTaiBang } from '@/components/ui/TrangThaiTai'
import { HopThoaiXacNhan, useThongBao } from '@/components/ui/ThongBao'
import { cn, dinhDangSo, dinhDangTien, ngayHomNay } from '@/lib/utils'
import { dichLoi } from '@/lib/loi'
import { useAuth } from '@/auth/AuthProvider'
import { useDanhSachVatTu, useGhiGiaoDichKho, useLuuVatTu, useXoaVatTu } from '@/data/kho'
import { useDanhSachNcc } from '@/data/chiTieu'
import { useDanhSachDonHang } from '@/data/donHang'
import type { LoaiGiaoDichKho, LoaiVatTu, VatTuDayDu, VatTuNhap } from '@/types'

const RONG: VatTuNhap = {
  ma_vat_tu: '',
  ten_vat_tu: '',
  loai: 'vai',
  don_vi_tinh: 'mét',
  ton_toi_thieu: 0,
  gia_nhap: 0,
  nha_cung_cap: null,
}

export function InventoryPage() {
  const [loc, setLoc] = useState<LoaiVatTu | 'tat_ca'>('tat_ca')
  const [tuKhoa, setTuKhoa] = useState('')
  const [moForm, setMoForm] = useState(false)
  const [vatTuSua, setVatTuSua] = useState<VatTuDayDu | null>(null)
  const [giaoDich, setGiaoDich] = useState<{ vt: VatTuDayDu; loai: LoaiGiaoDichKho } | null>(null)
  const [vatTuXoa, setVatTuXoa] = useState<VatTuDayDu | null>(null)

  const { laQuanTri } = useAuth()
  const tb = useThongBao()
  const danhSach = useDanhSachVatTu(loc, tuKhoa)
  const xoa = useXoaVatTu()

  const ds = danhSach.data ?? []
  const tongGiaTri = ds.reduce((s, v) => s + Number(v.gia_tri_ton), 0)
  const soSapHet = ds.filter((v) => Number(v.ton_kho) < Number(v.ton_toi_thieu)).length

  const xacNhanXoa = async () => {
    if (!vatTuXoa) return
    try {
      await xoa.mutateAsync(vatTuXoa.id)
      tb.thanhCong(`Đã xóa vật tư ${vatTuXoa.ten_vat_tu}.`)
      setVatTuXoa(null)
    } catch (e) {
      tb.loi(dichLoi(e))
    }
  }

  return (
    <div>
      <PageHeader
        tieuDe="Kho vải & phụ liệu"
        moTa="Tồn kho được tính tự động từ các phiếu nhập và phiếu xuất"
        hanhDong={
          <Button
            iconTrai={<Plus className="size-4" />}
            onClick={() => {
              setVatTuSua(null)
              setMoForm(true)
            }}
          >
            Thêm vật tư
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          nhan="Tổng giá trị tồn kho"
          giaTri={dinhDangTien(tongGiaTri)}
          icon={<Boxes className="size-5" />}
          mauIcon="bg-brand-50 text-brand-700"
        />
        <StatCard
          nhan="Số mặt hàng"
          giaTri={`${ds.length} loại`}
          icon={<Package className="size-5" />}
          mauIcon="bg-violet-50 text-violet-600"
        />
        <StatCard
          nhan="Sắp hết hàng"
          giaTri={`${soSapHet} mặt hàng`}
          icon={<Boxes className="size-5" />}
          mauIcon="bg-rose-50 text-rose-600"
          chuThich="dưới mức tồn tối thiểu"
        />
      </div>

      <Card className="mt-5">
        <CardHeader
          tieuDe="Danh sách vật tư"
          hanhDong={
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <div className="relative min-w-0 flex-1 sm:w-56 sm:flex-none">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={tuKhoa}
                  onChange={(e) => setTuKhoa(e.target.value)}
                  placeholder="Tìm mã hoặc tên vật tư…"
                  aria-label="Tìm vật tư"
                  className="h-9 w-full rounded-lg bg-paper pr-3 pl-9 text-sm ring-1 ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
              <select
                value={loc}
                onChange={(e) => setLoc(e.target.value as LoaiVatTu | 'tat_ca')}
                aria-label="Lọc theo loại"
                className="h-9 cursor-pointer rounded-lg bg-paper px-3 text-sm ring-1 ring-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="tat_ca">Tất cả</option>
                <option value="vai">Vải</option>
                <option value="phu_lieu">Phụ liệu</option>
              </select>
            </div>
          }
        />

        {danhSach.isLoading ? (
          <DangTaiBang />
        ) : danhSach.isError ? (
          <BaoLoi loi={danhSach.error} thuLai={() => void danhSach.refetch()} />
        ) : ds.length === 0 ? (
          <EmptyState
            icon={<Package className="size-6" />}
            tieuDe={tuKhoa ? 'Không tìm thấy vật tư nào' : 'Kho đang trống'}
            moTa={
              tuKhoa
                ? 'Thử đổi từ khóa tìm kiếm.'
                : 'Thêm loại vải hoặc phụ liệu đầu tiên, sau đó lập phiếu nhập để có tồn kho.'
            }
            hanhDong={
              <Button
                onClick={() => {
                  setVatTuSua(null)
                  setMoForm(true)
                }}
              >
                Thêm vật tư
              </Button>
            }
          />
        ) : (
          <>
            {/* Bảng cho máy tính */}
            <div className="scrollbar-slim hidden overflow-x-auto lg:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs tracking-wide text-slate-500 uppercase">
                    <th className="px-5 py-2.5 font-semibold">Mã</th>
                    <th className="px-5 py-2.5 font-semibold">Tên vật tư</th>
                    <th className="px-5 py-2.5 font-semibold">Loại</th>
                    <th className="px-5 py-2.5 text-right font-semibold">Tồn kho</th>
                    <th className="px-5 py-2.5 text-right font-semibold">Tối thiểu</th>
                    <th className="px-5 py-2.5 text-right font-semibold">Giá nhập</th>
                    <th className="px-5 py-2.5 text-right font-semibold">Thành tiền</th>
                    <th className="px-5 py-2.5 text-right font-semibold">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ds.map((v) => {
                    const ton = Number(v.ton_kho)
                    const thieu = ton < Number(v.ton_toi_thieu)
                    return (
                      <tr key={v.id} className="transition-colors hover:bg-slate-50">
                        <td className="px-5 py-3 font-mono text-xs font-semibold text-slate-500">
                          {v.ma_vat_tu}
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-medium text-slate-900">{v.ten_vat_tu}</p>
                          {v.nha_cung_cap && (
                            <p className="text-xs text-slate-500">{v.nha_cung_cap}</p>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <Badge>{v.loai === 'vai' ? 'Vải' : 'Phụ liệu'}</Badge>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span
                            className={cn(
                              'font-semibold tabular-nums',
                              thieu ? 'text-rose-600' : 'text-slate-900',
                            )}
                          >
                            {dinhDangSo(ton)}
                          </span>
                          <span className="ml-1 text-xs text-slate-400">{v.don_vi_tinh}</span>
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums text-slate-500">
                          {dinhDangSo(Number(v.ton_toi_thieu))}
                        </td>
                        <td className="px-5 py-3 text-right tabular-nums text-slate-700">
                          {dinhDangTien(Number(v.gia_nhap))}
                        </td>
                        <td className="px-5 py-3 text-right font-semibold tabular-nums text-slate-900">
                          {dinhDangTien(Number(v.gia_tri_ton))}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              kieu="mo"
                              co="nho"
                              aria-label="Nhập kho"
                              className="text-emerald-700 hover:bg-emerald-50"
                              onClick={() => setGiaoDich({ vt: v, loai: 'nhap' })}
                            >
                              <Upload className="size-4" />
                            </Button>
                            <Button
                              kieu="mo"
                              co="nho"
                              aria-label="Xuất kho"
                              className="text-amber-700 hover:bg-amber-50"
                              onClick={() => setGiaoDich({ vt: v, loai: 'xuat' })}
                            >
                              <Download className="size-4" />
                            </Button>
                            <Button
                              kieu="mo"
                              co="nho"
                              aria-label="Sửa vật tư"
                              onClick={() => {
                                setVatTuSua(v)
                                setMoForm(true)
                              }}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            {laQuanTri && (
                              <Button
                                kieu="mo"
                                co="nho"
                                aria-label="Xóa vật tư"
                                className="text-rose-600 hover:bg-rose-50"
                                onClick={() => setVatTuXoa(v)}
                              >
                                <Trash className="size-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Thẻ cho điện thoại */}
            <ul className="divide-y divide-slate-100 lg:hidden">
              {ds.map((v) => {
                const ton = Number(v.ton_kho)
                const thieu = ton < Number(v.ton_toi_thieu)
                return (
                  <li key={v.id} className="px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">{v.ten_vat_tu}</p>
                        <p className="font-mono text-xs text-slate-500">{v.ma_vat_tu}</p>
                      </div>
                      <Badge>{v.loai === 'vai' ? 'Vải' : 'Phụ liệu'}</Badge>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between gap-3 text-sm">
                      <span>
                        Tồn:{' '}
                        <span
                          className={cn(
                            'font-semibold tabular-nums',
                            thieu ? 'text-rose-600' : 'text-slate-900',
                          )}
                        >
                          {dinhDangSo(ton)} {v.don_vi_tinh}
                        </span>
                      </span>
                      <span className="tabular-nums text-slate-600">
                        {dinhDangTien(Number(v.gia_tri_ton))}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        kieu="phu"
                        co="nho"
                        iconTrai={<Upload className="size-3.5" />}
                        onClick={() => setGiaoDich({ vt: v, loai: 'nhap' })}
                      >
                        Nhập
                      </Button>
                      <Button
                        kieu="phu"
                        co="nho"
                        iconTrai={<Download className="size-3.5" />}
                        onClick={() => setGiaoDich({ vt: v, loai: 'xuat' })}
                      >
                        Xuất
                      </Button>
                      <Button
                        kieu="mo"
                        co="nho"
                        iconTrai={<Pencil className="size-3.5" />}
                        onClick={() => {
                          setVatTuSua(v)
                          setMoForm(true)
                        }}
                      >
                        Sửa
                      </Button>
                      {laQuanTri && (
                        <Button
                          kieu="mo"
                          co="nho"
                          className="text-rose-600"
                          iconTrai={<Trash className="size-3.5" />}
                          onClick={() => setVatTuXoa(v)}
                        >
                          Xóa
                        </Button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </Card>

      <FormVatTu moRa={moForm} dong={() => setMoForm(false)} vatTuDangSua={vatTuSua} />
      <FormGiaoDich giaoDich={giaoDich} dong={() => setGiaoDich(null)} />

      <HopThoaiXacNhan
        moRa={Boolean(vatTuXoa)}
        tieuDe="Xóa vật tư này?"
        noiDung={
          vatTuXoa
            ? `"${vatTuXoa.ten_vat_tu}" cùng toàn bộ lịch sử nhập xuất sẽ bị xóa vĩnh viễn.`
            : ''
        }
        dangXuLy={xoa.isPending}
        dongY={xacNhanXoa}
        huy={() => setVatTuXoa(null)}
      />
    </div>
  )
}

/* ------------------------- Biểu mẫu vật tư ------------------------- */

function FormVatTu({
  moRa,
  dong,
  vatTuDangSua,
}: {
  moRa: boolean
  dong: () => void
  vatTuDangSua: VatTuDayDu | null
}) {
  const tb = useThongBao()
  const luu = useLuuVatTu()
  const [form, setForm] = useState<VatTuNhap>(RONG)
  const [loi, setLoi] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!moRa) return
    setLoi({})
    if (vatTuDangSua) {
      setForm({
        ma_vat_tu: vatTuDangSua.ma_vat_tu,
        ten_vat_tu: vatTuDangSua.ten_vat_tu,
        loai: vatTuDangSua.loai,
        don_vi_tinh: vatTuDangSua.don_vi_tinh,
        ton_toi_thieu: Number(vatTuDangSua.ton_toi_thieu),
        gia_nhap: Number(vatTuDangSua.gia_nhap),
        nha_cung_cap: vatTuDangSua.nha_cung_cap,
      })
    } else {
      setForm(RONG)
    }
  }, [moRa, vatTuDangSua])

  const dat = <K extends keyof VatTuNhap>(k: K, v: VatTuNhap[K]) => {
    setForm((cu) => ({ ...cu, [k]: v }))
    setLoi((cu) => ({ ...cu, [k]: '' }))
  }

  const gui = async (e: React.FormEvent) => {
    e.preventDefault()
    const l: Record<string, string> = {}
    if (!form.ma_vat_tu.trim()) l.ma_vat_tu = 'Bạn chưa nhập mã vật tư.'
    if (!form.ten_vat_tu.trim()) l.ten_vat_tu = 'Bạn chưa nhập tên vật tư.'
    if (!form.don_vi_tinh.trim()) l.don_vi_tinh = 'Bạn chưa nhập đơn vị tính.'
    if (form.ton_toi_thieu < 0) l.ton_toi_thieu = 'Không được là số âm.'
    if (form.gia_nhap < 0) l.gia_nhap = 'Không được là số âm.'
    setLoi(l)
    if (Object.keys(l).length > 0) return

    try {
      await luu.mutateAsync({
        id: vatTuDangSua?.id ?? null,
        nhap: {
          ...form,
          ten_vat_tu: form.ten_vat_tu.trim(),
          don_vi_tinh: form.don_vi_tinh.trim(),
          nha_cung_cap: form.nha_cung_cap?.trim() || null,
        },
      })
      tb.thanhCong(vatTuDangSua ? 'Đã lưu thay đổi vật tư.' : 'Đã thêm vật tư mới.')
      dong()
    } catch (err) {
      tb.loi(dichLoi(err))
    }
  }

  return (
    <Modal
      moRa={moRa}
      dong={dong}
      tieuDe={vatTuDangSua ? 'Sửa vật tư' : 'Thêm vật tư mới'}
      moTa="Tồn kho nhập bằng phiếu nhập, không gõ trực tiếp ở đây"
      coLon="lon"
      chanTrang={
        <>
          <Button kieu="phu" onClick={dong} disabled={luu.isPending}>
            Hủy
          </Button>
          <Button type="submit" form="form-vat-tu" dangTai={luu.isPending}>
            Lưu
          </Button>
        </>
      }
    >
      <form id="form-vat-tu" onSubmit={gui} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          nhan="Mã vật tư"
          batBuoc
          value={form.ma_vat_tu}
          onChange={(e) => dat('ma_vat_tu', e.target.value)}
          loi={loi.ma_vat_tu}
          placeholder="V001"
          disabled={Boolean(vatTuDangSua)}
          goiY={vatTuDangSua ? 'Mã vật tư không đổi được sau khi tạo.' : undefined}
        />
        <Input
          nhan="Tên vật tư"
          batBuoc
          value={form.ten_vat_tu}
          onChange={(e) => dat('ten_vat_tu', e.target.value)}
          loi={loi.ten_vat_tu}
          placeholder="Vải len Ý xám đậm"
        />
        <Select
          nhan="Loại"
          value={form.loai}
          onChange={(e) => dat('loai', e.target.value as LoaiVatTu)}
        >
          <option value="vai">Vải</option>
          <option value="phu_lieu">Phụ liệu</option>
        </Select>
        <Input
          nhan="Đơn vị tính"
          batBuoc
          value={form.don_vi_tinh}
          onChange={(e) => dat('don_vi_tinh', e.target.value)}
          loi={loi.don_vi_tinh}
          placeholder="mét, cái, cuộn…"
        />
        <Input
          nhan="Tồn tối thiểu"
          type="number"
          min="0"
          step="0.5"
          value={form.ton_toi_thieu}
          onChange={(e) => dat('ton_toi_thieu', Number(e.target.value))}
          loi={loi.ton_toi_thieu}
          goiY="Dưới mức này phần mềm sẽ cảnh báo"
        />
        <Input
          nhan="Giá nhập (đồng)"
          type="number"
          min="0"
          step="1000"
          value={form.gia_nhap}
          onChange={(e) => dat('gia_nhap', Number(e.target.value))}
          loi={loi.gia_nhap}
        />
        <Input
          nhan="Nhà cung cấp"
          value={form.nha_cung_cap ?? ''}
          onChange={(e) => dat('nha_cung_cap', e.target.value)}
          boxClassName="sm:col-span-2"
        />
      </form>
    </Modal>
  )
}

/* ---------------------- Biểu mẫu nhập / xuất ---------------------- */

function FormGiaoDich({
  giaoDich,
  dong,
}: {
  giaoDich: { vt: VatTuDayDu; loai: LoaiGiaoDichKho } | null
  dong: () => void
}) {
  const tb = useThongBao()
  const ghi = useGhiGiaoDichKho()
  const [soLuong, setSoLuong] = useState('')
  const [donGia, setDonGia] = useState('')
  const [ngay, setNgay] = useState(ngayHomNay())
  const [ghiChu, setGhiChu] = useState('')
  const [donId, setDonId] = useState('')
  const [nccId, setNccId] = useState('')

  const laNhap = giaoDich?.loai === 'nhap'

  /*
   * Hai danh sách này là chỗ nối để tính được LÃI LỖ và CÔNG NỢ.
   *
   * Xuất vải mà không chọn đơn thì không biết tiền vải đó thuộc đơn nào
   * -> lãi của từng đơn sai. Nhập vải mà không chọn nhà cung cấp thì
   * không biết mình nợ ai -> sổ nợ thiếu.
   *
   * Cả hai đều KHÔNG bắt buộc: vải dùng chung, vải hỏng, hàng mua lẻ
   * ngoài chợ đều có thật. Nhưng màn hình có nhắc, và báo cáo nói rõ
   * có bao nhiêu tiền chưa gắn.
   */
  const dsDon = useDanhSachDonHang()
  const dsNcc = useDanhSachNcc()

  useEffect(() => {
    if (!giaoDich) return
    setSoLuong('')
    setDonGia(String(Number(giaoDich.vt.gia_nhap) || 0))
    setNgay(ngayHomNay())
    setGhiChu('')
    setDonId('')
    setNccId('')
  }, [giaoDich])

  const gui = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!giaoDich) return

    const sl = Number(soLuong.replace(',', '.'))
    if (!Number.isFinite(sl) || sl <= 0) return tb.loi('Số lượng phải lớn hơn 0.')

    try {
      await ghi.mutateAsync({
        vat_tu_id: giaoDich.vt.id,
        loai: giaoDich.loai,
        so_luong: sl,
        don_gia: laNhap ? Number(donGia) || null : null,
        ngay,
        ghi_chu: ghiChu.trim() || null,
        don_hang_id: laNhap ? null : donId || null,
        nha_cung_cap_id: laNhap ? nccId || null : null,
      })
      tb.thanhCong(
        `Đã ${laNhap ? 'nhập' : 'xuất'} ${dinhDangSo(sl)} ${giaoDich.vt.don_vi_tinh} ` +
          `${giaoDich.vt.ten_vat_tu}.`,
      )
      dong()
    } catch (err) {
      tb.loi(dichLoi(err))
    }
  }

  return (
    <Modal
      moRa={Boolean(giaoDich)}
      dong={dong}
      tieuDe={laNhap ? 'Phiếu nhập kho' : 'Phiếu xuất kho'}
      moTa={giaoDich ? `${giaoDich.vt.ma_vat_tu} — ${giaoDich.vt.ten_vat_tu}` : ''}
      chanTrang={
        <>
          <Button kieu="phu" onClick={dong} disabled={ghi.isPending}>
            Hủy
          </Button>
          <Button type="submit" form="form-giao-dich" dangTai={ghi.isPending}>
            {laNhap ? 'Nhập kho' : 'Xuất kho'}
          </Button>
        </>
      }
    >
      {giaoDich && (
        <form id="form-giao-dich" onSubmit={gui} className="space-y-4">
          <div className="rounded-xl bg-slate-50 p-4 text-center ring-1 ring-slate-200">
            <p className="text-xs text-slate-500">Tồn kho hiện tại</p>
            <p className="mt-0.5 text-xl font-bold tabular-nums text-slate-900">
              {dinhDangSo(Number(giaoDich.vt.ton_kho))} {giaoDich.vt.don_vi_tinh}
            </p>
          </div>

          <Input
            nhan={`Số lượng ${laNhap ? 'nhập' : 'xuất'}`}
            batBuoc
            type="number"
            min="0"
            step="0.5"
            inputMode="decimal"
            value={soLuong}
            onChange={(e) => setSoLuong(e.target.value)}
            autoFocus
            goiY={
              laNhap
                ? undefined
                : `Tối đa ${dinhDangSo(Number(giaoDich.vt.ton_kho))} ${giaoDich.vt.don_vi_tinh}`
            }
          />

          {laNhap && (
            <Input
              nhan="Đơn giá nhập (đồng)"
              type="number"
              min="0"
              step="1000"
              value={donGia}
              onChange={(e) => setDonGia(e.target.value)}
            />
          )}

          {laNhap ? (
            <Select
              nhan="Nhập từ nhà cung cấp nào"
              value={nccId}
              onChange={(e) => setNccId(e.target.value)}
              goiY={
                (dsNcc.data ?? []).length === 0
                  ? 'Chưa có nhà cung cấp nào. Thêm ở mục Chi tiêu.'
                  : 'Chọn thì sổ nợ nhà cung cấp mới cộng đúng.'
              }
            >
              <option value="">— không ghi nợ ai —</option>
              {(dsNcc.data ?? []).map((n) => (
                <option key={n.id} value={n.id}>
                  {n.ten}
                </option>
              ))}
            </Select>
          ) : (
            <Select
              nhan="Xuất cho đơn hàng nào"
              value={donId}
              onChange={(e) => setDonId(e.target.value)}
              goiY="Chọn thì mới tính được đơn đó lãi bao nhiêu. Vải dùng chung thì để trống."
            >
              <option value="">— không thuộc đơn nào —</option>
              {(dsDon.data ?? [])
                .filter((x) => x.trang_thai !== 'da_giao' && x.trang_thai !== 'da_huy')
                .map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.ma_don} — {x.ten_khach}
                  </option>
                ))}
            </Select>
          )}

          <Input
            nhan="Ngày"
            type="date"
            value={ngay}
            onChange={(e) => setNgay(e.target.value)}
          />

          <Textarea
            nhan="Ghi chú"
            value={ghiChu}
            onChange={(e) => setGhiChu(e.target.value)}
            placeholder={laNhap ? 'Nhập hàng từ nhà cung cấp…' : 'Xuất vải may đơn DH00001…'}
          />
        </form>
      )}
    </Modal>
  )
}
