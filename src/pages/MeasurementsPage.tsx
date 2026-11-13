import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Ruler, Save, Trash } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input, Select, Textarea } from '@/components/ui/Field'
import { BaoLoi, DangTaiBang } from '@/components/ui/TrangThaiTai'
import { HopThoaiXacNhan, useThongBao } from '@/components/ui/ThongBao'
import { NHOM_SO_DO } from '@/lib/constants'
import { dinhDangNgay } from '@/lib/utils'
import { dichLoi } from '@/lib/loi'
import { useAuth } from '@/auth/AuthProvider'
import { useKhachHangRutGon } from '@/data/khachHang'
import { useDanhSachSoDo, useSuaSoDo, useThemSoDo, useXoaSoDo } from '@/data/soDo'
import type { HoSoSoDo } from '@/types'

const HOM_NAY = () => new Date().toISOString().slice(0, 10)

export function MeasurementsPage() {
  const { hoSo, laQuanTri } = useAuth()
  const tb = useThongBao()

  const khachHang = useKhachHangRutGon()
  const [khachId, setKhachId] = useState('')
  const danhSachSoDo = useDanhSachSoDo(khachId || null)

  const [hoSoId, setHoSoId] = useState<string | null>(null)
  const [xoaHoSo, setXoaHoSo] = useState<HoSoSoDo | null>(null)

  // Nội dung biểu mẫu
  const [tenHoSo, setTenHoSo] = useState('')
  const [ngayDo, setNgayDo] = useState(HOM_NAY())
  const [nguoiDo, setNguoiDo] = useState('')
  const [soDo, setSoDo] = useState<Record<string, string>>({})
  const [ghiChu, setGhiChu] = useState('')

  const them = useThemSoDo()
  const sua = useSuaSoDo()
  const xoa = useXoaSoDo()

  // Chọn sẵn khách đầu tiên
  useEffect(() => {
    if (!khachId && khachHang.data && khachHang.data.length > 0) {
      setKhachId(khachHang.data[0].id)
    }
  }, [khachHang.data, khachId])

  const hoSoDangChon = useMemo(
    () => danhSachSoDo.data?.find((h) => h.id === hoSoId) ?? null,
    [danhSachSoDo.data, hoSoId],
  )

  // Nạp hồ sơ đang chọn vào biểu mẫu
  useEffect(() => {
    if (hoSoDangChon) {
      setTenHoSo(hoSoDangChon.ten_ho_so)
      setNgayDo(hoSoDangChon.ngay_do)
      setNguoiDo(hoSoDangChon.nguoi_do ?? '')
      setGhiChu(hoSoDangChon.ghi_chu ?? '')
      const chuyen: Record<string, string> = {}
      for (const [k, v] of Object.entries(hoSoDangChon.so_do ?? {})) {
        if (v !== null && v !== undefined) chuyen[k] = String(v)
      }
      setSoDo(chuyen)
    }
  }, [hoSoDangChon])

  // Đổi khách thì bỏ hồ sơ đang chọn
  useEffect(() => {
    setHoSoId(null)
    lamMoiForm()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [khachId])

  function lamMoiForm() {
    setTenHoSo('')
    setNgayDo(HOM_NAY())
    setNguoiDo(hoSo?.ho_ten ?? '')
    setSoDo({})
    setGhiChu('')
  }

  const batDauTaoMoi = () => {
    setHoSoId(null)
    lamMoiForm()
  }

  const luu = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!khachId) return tb.loi('Bạn chưa chọn khách hàng.')
    if (!tenHoSo.trim()) return tb.loi('Bạn chưa đặt tên cho lần đo này.')

    // Chuyển các ô đã nhập thành số, bỏ qua ô trống
    const soDoSach: Record<string, number> = {}
    for (const [ma, v] of Object.entries(soDo)) {
      const txt = v.trim().replace(',', '.')
      if (!txt) continue
      const so = Number(txt)
      if (!Number.isFinite(so) || so < 0) {
        const ten = NHOM_SO_DO.flatMap((n) => n.chiSo).find((c) => c.ma === ma)?.ten ?? ma
        return tb.loi(`Chỉ số "${ten}" không hợp lệ. Hãy nhập một số dương.`)
      }
      soDoSach[ma] = so
    }

    if (Object.keys(soDoSach).length === 0) {
      return tb.loi('Bạn chưa nhập chỉ số đo nào.')
    }

    const duLieu = {
      khach_hang_id: khachId,
      ten_ho_so: tenHoSo.trim(),
      ngay_do: ngayDo,
      nguoi_do: nguoiDo.trim() || null,
      so_do: soDoSach,
      ghi_chu: ghiChu.trim() || null,
    }

    try {
      if (hoSoId) {
        await sua.mutateAsync({ id: hoSoId, nhap: duLieu })
        tb.thanhCong('Đã lưu thay đổi số đo.')
      } else {
        const moi = await them.mutateAsync(duLieu)
        setHoSoId(moi.id)
        tb.thanhCong(`Đã lưu lần đo "${moi.ten_ho_so}".`)
      }
    } catch (err) {
      tb.loi(dichLoi(err))
    }
  }

  const xacNhanXoa = async () => {
    if (!xoaHoSo) return
    try {
      await xoa.mutateAsync(xoaHoSo.id)
      tb.thanhCong('Đã xóa lần đo.')
      if (hoSoId === xoaHoSo.id) batDauTaoMoi()
      setXoaHoSo(null)
    } catch (e) {
      tb.loi(dichLoi(e))
    }
  }

  const dangLuu = them.isPending || sua.isPending
  const tenKhach = khachHang.data?.find((k) => k.id === khachId)?.ho_ten ?? ''

  /* --------------------------- Hiển thị --------------------------- */

  if (khachHang.isLoading) {
    return (
      <div>
        <PageHeader tieuDe="Hồ sơ số đo" />
        <Card>
          <DangTaiBang />
        </Card>
      </div>
    )
  }

  if ((khachHang.data?.length ?? 0) === 0) {
    return (
      <div>
        <PageHeader tieuDe="Hồ sơ số đo" />
        <Card>
          <EmptyState
            icon={<Ruler className="size-6" />}
            tieuDe="Chưa có khách hàng nào"
            moTa="Hồ sơ số đo luôn gắn với một khách hàng. Hãy thêm khách hàng trước."
            hanhDong={
              <Link to="/khach-hang">
                <Button>Sang trang Khách hàng</Button>
              </Link>
            }
          />
        </Card>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        tieuDe="Hồ sơ số đo"
        moTa="Lưu nhiều lần đo cho cùng một khách hàng, tiện so sánh theo thời gian"
        hanhDong={
          <Button iconTrai={<Plus className="size-4" />} onClick={batDauTaoMoi}>
            Tạo lần đo mới
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[300px_1fr]">
        {/* Cột trái */}
        <div className="space-y-5">
          <Card>
            <CardBody>
              <Select
                nhan="Chọn khách hàng"
                batBuoc
                value={khachId}
                onChange={(e) => setKhachId(e.target.value)}
              >
                {khachHang.data!.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.ho_ten} — {k.so_dien_thoai}
                  </option>
                ))}
              </Select>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              tieuDe="Các lần đã đo"
              moTa={
                danhSachSoDo.data ? `${danhSachSoDo.data.length} hồ sơ` : 'Đang tải…'
              }
            />
            {danhSachSoDo.isLoading ? (
              <DangTaiBang soDong={3} />
            ) : danhSachSoDo.isError ? (
              <BaoLoi loi={danhSachSoDo.error} thuLai={() => void danhSachSoDo.refetch()} />
            ) : (danhSachSoDo.data?.length ?? 0) === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-500">
                {tenKhach} chưa có lần đo nào. Nhập chỉ số bên cạnh rồi bấm Lưu.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {danhSachSoDo.data!.map((h) => {
                  const dangChon = h.id === hoSoId
                  return (
                    <li key={h.id} className="flex items-center">
                      <button
                        type="button"
                        onClick={() => setHoSoId(h.id)}
                        className={`min-w-0 flex-1 px-4 py-3 text-left transition-colors ${
                          dangChon ? 'bg-brand-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <p
                          className={`truncate text-sm font-semibold ${
                            dangChon ? 'text-brand-800' : 'text-slate-800'
                          }`}
                        >
                          {h.ten_ho_so}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {dinhDangNgay(h.ngay_do)}
                          {h.nguoi_do ? ` · ${h.nguoi_do}` : ''} ·{' '}
                          {Object.keys(h.so_do ?? {}).length} chỉ số
                        </p>
                      </button>
                      {laQuanTri && (
                        <button
                          type="button"
                          onClick={() => setXoaHoSo(h)}
                          aria-label={`Xóa ${h.ten_ho_so}`}
                          className="mr-2 rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash className="size-4" />
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </div>

        {/* Cột phải: biểu mẫu nhập số đo */}
        <Card>
          <CardHeader
            tieuDe={hoSoId ? 'Sửa lần đo' : 'Lần đo mới'}
            moTa={`Khách: ${tenKhach} · đơn vị centimet, riêng cân nặng tính bằng kilogam`}
            hanhDong={
              <Button
                co="nho"
                type="submit"
                form="form-so-do"
                iconTrai={<Save className="size-3.5" />}
                dangTai={dangLuu}
              >
                Lưu số đo
              </Button>
            }
          />
          <CardBody>
            <form id="form-so-do" onSubmit={luu} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Input
                  nhan="Tên lần đo"
                  batBuoc
                  value={tenHoSo}
                  onChange={(e) => setTenHoSo(e.target.value)}
                  placeholder="Ví dụ: Đo may vest cưới"
                />
                <Input
                  nhan="Ngày đo"
                  batBuoc
                  type="date"
                  value={ngayDo}
                  onChange={(e) => setNgayDo(e.target.value)}
                />
                <Input
                  nhan="Người đo"
                  value={nguoiDo}
                  onChange={(e) => setNguoiDo(e.target.value)}
                  placeholder="Tên thợ đo"
                />
              </div>

              {NHOM_SO_DO.map((nhom) => (
                <fieldset key={nhom.tieuDe}>
                  <legend className="mb-3 text-sm font-semibold text-slate-900">
                    {nhom.tieuDe}
                  </legend>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                    {nhom.chiSo.map((cs) => (
                      <div key={cs.ma} className="space-y-1.5">
                        <label
                          htmlFor={`cs-${cs.ma}`}
                          className="block text-xs font-medium text-slate-600"
                        >
                          {cs.ten}
                        </label>
                        <div className="relative">
                          <input
                            id={`cs-${cs.ma}`}
                            type="number"
                            step="0.5"
                            min="0"
                            inputMode="decimal"
                            placeholder="0"
                            value={soDo[cs.ma] ?? ''}
                            onChange={(e) =>
                              setSoDo((cu) => ({ ...cu, [cs.ma]: e.target.value }))
                            }
                            className="h-10 w-full rounded-lg bg-paper pr-10 pl-3 text-sm tabular-nums ring-1 ring-slate-300 placeholder:text-slate-300 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                          />
                          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-medium text-slate-400">
                            {cs.donVi}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </fieldset>
              ))}

              <Textarea
                nhan="Ghi chú của thợ"
                value={ghiChu}
                onChange={(e) => setGhiChu(e.target.value)}
                placeholder="Ví dụ: vai lệch 1cm bên phải, bụng hơi to, cần chừa rộng eo 2cm…"
              />
            </form>
          </CardBody>
        </Card>
      </div>

      <HopThoaiXacNhan
        moRa={Boolean(xoaHoSo)}
        tieuDe="Xóa lần đo này?"
        noiDung={
          xoaHoSo ? `Hồ sơ "${xoaHoSo.ten_ho_so}" sẽ bị xóa vĩnh viễn, không khôi phục được.` : ''
        }
        dangXuLy={xoa.isPending}
        dongY={xacNhanXoa}
        huy={() => setXoaHoSo(null)}
      />
    </div>
  )
}
