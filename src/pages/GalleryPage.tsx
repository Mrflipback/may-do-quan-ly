import { useEffect, useRef, useState } from 'react'
import { CloudUpload, Image as ImageIcon, Tag, Trash } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input, Select, Textarea } from '@/components/ui/Field'
import { BaoLoi, KhoiCho } from '@/components/ui/TrangThaiTai'
import { HopThoaiXacNhan, useThongBao } from '@/components/ui/ThongBao'
import { NHAN_LOAI_TRANG_PHUC } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { dichLoi } from '@/lib/loi'
import { useAuth } from '@/auth/AuthProvider'
import { kiemTraAnh } from '@/data/anh'
import { useThemAnhMau, useThuVienMau, useXoaAnhMau, type AnhMauCoVe } from '@/data/anhMau'
import { ANH_CO_SAN, NHAN_NGUON, anhNho, anhTo } from '@/data/anhCoSan'
import { HopXemAnh, type AnhXem } from '@/components/XemAnh'
import type { LoaiTrangPhuc } from '@/types'

const BO_LOC: Array<LoaiTrangPhuc | 'tat_ca'> = [
  'tat_ca',
  'ao_so_mi',
  'quan_tay',
  'vest',
  'vay',
  'ao_dai',
  'khac',
]

/**
 * Một ô trong lưới. Gộp hai nguồn ảnh làm một:
 *   · ảnh có sẵn đi kèm phần mềm (coSan = true, không xoá được)
 *   · ảnh tiệm tự tải lên, nằm trên Supabase (xoá được)
 */
interface MucMau {
  khoa: string
  ten: string
  loai: LoaiTrangPhuc
  moTa: string | null
  urlNho: string | null
  urlTo: string | null
  tags: string[]
  coSan: boolean
  goc: AnhMauCoVe | null
}

export function GalleryPage() {
  const [loc, setLoc] = useState<LoaiTrangPhuc | 'tat_ca'>('tat_ca')
  const [fileChon, setFileChon] = useState<File | null>(null)
  const [anhXoa, setAnhXoa] = useState<AnhMauCoVe | null>(null)
  const [anhDangXem, setAnhDangXem] = useState<number | null>(null)
  const oChonFile = useRef<HTMLInputElement>(null)

  const { laQuanTri } = useAuth()
  const tb = useThongBao()
  const thuVien = useThuVienMau(loc)
  const xoa = useXoaAnhMau()

  const chonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = '' // cho phép chọn lại đúng file đó lần sau
    if (!f) return

    const loi = kiemTraAnh(f)
    if (loi) return tb.loi(loi)
    setFileChon(f)
  }

  const xacNhanXoa = async () => {
    if (!anhXoa) return
    try {
      await xoa.mutateAsync(anhXoa)
      tb.thanhCong(`Đã xóa mẫu "${anhXoa.ten_mau}".`)
      setAnhXoa(null)
    } catch (e) {
      tb.loi(dichLoi(e))
    }
  }

  // Ảnh đi kèm phần mềm — hiện ngay, không phải chờ mạng
  const dsCoSan: MucMau[] = ANH_CO_SAN.filter((a) => loc === 'tat_ca' || a.loai === loc).map(
    (a) => ({
      khoa: 'co-san-' + a.ma,
      ten: a.ten,
      loai: a.loai,
      moTa: `${a.moTa} — ${NHAN_NGUON[a.nguon]}`,
      urlNho: anhNho(a.ma),
      urlTo: anhTo(a.ma),
      tags: [],
      coSan: true,
      goc: null,
    }),
  )

  // Ảnh tiệm tự tải lên, xếp lên trước cho dễ thấy
  const dsTaiLen: MucMau[] = (thuVien.data ?? []).map((m) => ({
    khoa: m.id,
    ten: m.ten_mau,
    loai: m.loai,
    moTa: m.mo_ta,
    urlNho: m.urlXem,
    urlTo: m.urlXem,
    tags: m.the_tag,
    coSan: false,
    goc: m,
  }))

  const ds: MucMau[] = [...dsTaiLen, ...dsCoSan]

  const dsXem: AnhXem[] = ds.map((m) => ({
    khoa: m.khoa,
    ten: m.ten,
    moTa: m.moTa,
    urlTo: m.urlTo,
    urlNho: m.urlNho,
    nhan: NHAN_LOAI_TRANG_PHUC[m.loai],
  }))

  return (
    <div>
      <PageHeader
        tieuDe="Thư viện mẫu"
        moTa={`Ảnh mẫu quần, áo, vest, váy, áo dài — dùng để tư vấn khách. Có sẵn ${ANH_CO_SAN.length} ảnh của tiệm.`}
        hanhDong={
          <Button
            iconTrai={<CloudUpload className="size-4" />}
            onClick={() => oChonFile.current?.click()}
          >
            Tải ảnh mẫu lên
          </Button>
        }
      />

      <input
        ref={oChonFile}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={chonFile}
        className="hidden"
      />

      {/* Bộ lọc loại trang phục */}
      <div className="scrollbar-slim mb-4 flex gap-2 overflow-x-auto pb-1">
        {BO_LOC.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLoc(l)}
            className={cn(
              'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              l === loc
                ? 'bg-brand-700 text-white shadow-sm'
                : 'bg-paper text-slate-600 ring-1 ring-slate-300 hover:bg-slate-50',
            )}
          >
            {l === 'tat_ca' ? 'Tất cả' : NHAN_LOAI_TRANG_PHUC[l]}
          </button>
        ))}
      </div>

      {thuVien.isError && (
        <Card className="mb-4">
          <BaoLoi loi={thuVien.error} thuLai={() => void thuVien.refetch()} />
        </Card>
      )}

      {ds.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ImageIcon className="size-6" />}
            tieuDe={loc === 'tat_ca' ? 'Thư viện còn trống' : 'Chưa có mẫu loại này'}
            moTa="Tải ảnh mẫu lên để lần sau tư vấn khách cho nhanh. Ảnh được lưu riêng tư trên Supabase, người ngoài không xem được."
            hanhDong={
              <Button
                iconTrai={<CloudUpload className="size-4" />}
                onClick={() => oChonFile.current?.click()}
              >
                Tải ảnh mẫu lên
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          <button
            type="button"
            onClick={() => oChonFile.current?.click()}
            className="flex aspect-3/4 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-paper/60 p-4 text-center transition-colors hover:border-brand-400 hover:bg-brand-50"
          >
            <CloudUpload className="size-7 text-slate-400" />
            <span className="text-sm font-medium text-slate-600">Tải ảnh mẫu lên</span>
            <span className="text-xs text-slate-400">JPG, PNG — tối đa 5MB</span>
          </button>

          {thuVien.isLoading && <KhoiCho className="aspect-3/4" />}

          {ds.map((m, i) => (
            <Card key={m.khoa} className="group relative overflow-hidden">
              <button
                type="button"
                onClick={() => setAnhDangXem(i)}
                aria-label={`Xem ảnh ${m.ten}`}
                className="flex aspect-3/4 w-full items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200"
              >
                {m.urlNho ? (
                  <img
                    src={m.urlNho}
                    alt={m.ten}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                  />
                ) : (
                  <ImageIcon className="size-8 text-slate-400" />
                )}
              </button>

              {/* Ảnh đi kèm phần mềm: không có nút xoá, vì xóa cũng không mất */}
              {laQuanTri && !m.coSan && m.goc && (
                <button
                  type="button"
                  onClick={() => setAnhXoa(m.goc)}
                  aria-label={`Xóa mẫu ${m.ten}`}
                  className="absolute top-2 right-2 rounded-lg bg-paper/90 p-1.5 text-slate-500 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:text-rose-600 focus:opacity-100"
                >
                  <Trash className="size-4" />
                </button>
              )}

              <CardBody className="p-3">
                <p className="truncate text-sm font-semibold text-slate-900">{m.ten}</p>
                <p className="mt-0.5 text-xs text-slate-500">{NHAN_LOAI_TRANG_PHUC[m.loai]}</p>
                {m.moTa && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{m.moTa}</p>}
                <div className="mt-2 flex flex-wrap gap-1">
                  {m.coSan && (
                    <Badge className="bg-brand-50 text-brand-700 ring-brand-600/20">
                      <ImageIcon className="mr-1 size-2.5" />
                      Ảnh có sẵn
                    </Badge>
                  )}
                  {m.tags.map((t) => (
                    <Badge key={t} className="bg-gold-50 text-gold-700 ring-gold-600/20">
                      <Tag className="mr-1 size-2.5" />
                      {t}
                    </Badge>
                  ))}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <HopXemAnh ds={dsXem} viTri={anhDangXem} dat={setAnhDangXem} />

      <FormTaiAnh file={fileChon} dong={() => setFileChon(null)} />

      <HopThoaiXacNhan
        moRa={Boolean(anhXoa)}
        tieuDe="Xóa ảnh mẫu này?"
        noiDung={anhXoa ? `Mẫu "${anhXoa.ten_mau}" và tấm ảnh sẽ bị xóa vĩnh viễn.` : ''}
        dangXuLy={xoa.isPending}
        dongY={xacNhanXoa}
        huy={() => setAnhXoa(null)}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */

function FormTaiAnh({ file, dong }: { file: File | null; dong: () => void }) {
  const tb = useThongBao()
  const them = useThemAnhMau()
  const [tenMau, setTenMau] = useState('')
  const [loai, setLoai] = useState<LoaiTrangPhuc>('vest')
  const [moTa, setMoTa] = useState('')
  const [tag, setTag] = useState('')
  const [xemTruoc, setXemTruoc] = useState<string | null>(null)

  // Tạo ảnh xem trước từ file vừa chọn
  useEffect(() => {
    if (!file) {
      setXemTruoc(null)
      return
    }
    const url = URL.createObjectURL(file)
    setXemTruoc(url)
    setTenMau(file.name.replace(/\.[^.]+$/, ''))
    setLoai('vest')
    setMoTa('')
    setTag('')
    return () => URL.revokeObjectURL(url)
  }, [file])

  const gui = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    if (!tenMau.trim()) return tb.loi('Bạn chưa đặt tên cho mẫu này.')

    try {
      await them.mutateAsync({
        file,
        ten_mau: tenMau.trim(),
        loai,
        mo_ta: moTa.trim() || null,
        the_tag: tag
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      })
      tb.thanhCong(`Đã thêm mẫu "${tenMau.trim()}" vào thư viện.`)
      dong()
    } catch (err) {
      tb.loi(dichLoi(err))
    }
  }

  return (
    <Modal
      moRa={Boolean(file)}
      dong={dong}
      tieuDe="Thêm ảnh mẫu"
      moTa="Đặt tên và phân loại để sau này tìm cho nhanh"
      coLon="lon"
      chanTrang={
        <>
          <Button kieu="phu" onClick={dong} disabled={them.isPending}>
            Hủy
          </Button>
          <Button type="submit" form="form-anh-mau" dangTai={them.isPending}>
            Tải lên
          </Button>
        </>
      }
    >
      {file && (
        <form id="form-anh-mau" onSubmit={gui} className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <div className="overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200">
              {xemTruoc && (
                <img src={xemTruoc} alt="Xem trước" className="aspect-3/4 w-full object-cover" />
              )}
            </div>
            <p className="mt-2 truncate text-xs text-slate-500">
              {file.name} · {(file.size / 1024 / 1024).toFixed(2)}MB
            </p>
          </div>

          <div className="space-y-4">
            <Input
              nhan="Tên mẫu"
              batBuoc
              value={tenMau}
              onChange={(e) => setTenMau(e.target.value)}
              placeholder="Vest 2 khuy xanh navy"
            />
            <Select
              nhan="Loại trang phục"
              value={loai}
              onChange={(e) => setLoai(e.target.value as LoaiTrangPhuc)}
            >
              {(Object.keys(NHAN_LOAI_TRANG_PHUC) as LoaiTrangPhuc[]).map((l) => (
                <option key={l} value={l}>
                  {NHAN_LOAI_TRANG_PHUC[l]}
                </option>
              ))}
            </Select>
            <Input
              nhan="Thẻ phân loại"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="công sở, cưới, dự tiệc"
              goiY="Ngăn cách bằng dấu phẩy"
            />
            <Textarea
              nhan="Mô tả"
              value={moTa}
              onChange={(e) => setMoTa(e.target.value)}
              placeholder="Chất liệu, kiểu dáng, ghi chú khi may…"
            />
          </div>
        </form>
      )}
    </Modal>
  )
}
