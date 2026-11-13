import { useEffect, useRef, useState } from 'react'
import {
  Check,
  Monitor,
  Moon,
  Play,
  RotateCcw,
  Scissors,
  Sun,
  Type,
  Zap,
  ZapOff,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useThongBao } from '@/components/ui/ThongBao'
import { cn } from '@/lib/utils'
import {
  HIEU_UNG,
  MAU_CHU_DAO,
  NHAN_BO_GOC,
  NHAN_CO_CHU,
  NHAN_GIAO_DIEN,
  NHAN_TOC_DO,
  apDung,
  mayGiamChuyenDong,
  useGiaoDien,
  type BoGoc,
  type CaiDatGiaoDien,
  type ChoDoGiaoDien,
  type CoChu,
  type TocDo,
} from '@/lib/giaoDien'

/* ------------------------------------------------------------------ */
/*  Nút chọn dùng chung                                                */
/* ------------------------------------------------------------------ */

function NutChon({
  ma,
  dangChon,
  onClick,
  children,
  className,
}: {
  /** Mã nhận dạng, ví dụ "coChu:lon". Dùng cho bản thu thử tự động. */
  ma: string
  dangChon: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      data-chon={ma}
      onClick={onClick}
      aria-pressed={dangChon}
      className={cn(
        'relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-3 py-3 text-xs font-medium transition-colors',
        dangChon
          ? 'bg-brand-700 text-white ring-2 ring-brand-700 ring-offset-2 ring-offset-paper'
          : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-200',
        className,
      )}
    >
      {children}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/*  Khung xem thử — chạy lại hiệu ứng mỗi lần bấm một lựa chọn          */
/* ------------------------------------------------------------------ */

function KhungXemThu({ lanThu, dangChayThu }: { lanThu: number; dangChayThu: string }) {
  return (
    <Card>
      <CardHeader
        tieuDe="Xem thử"
        moTa={dangChayThu ? `Đang chạy thử: ${dangChayThu}` : 'Bấm vào lựa chọn nào cũng chạy lại ở đây'}
      />
      <CardBody>
        {/* key đổi là React vẽ lại từ đầu, nên hiệu ứng chạy lại từ đầu */}
        <div key={lanThu} className="hieu-ung space-y-3 rounded-xl bg-slate-100 p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-800 text-gold-400">
              <Scissors className="size-5" />
            </span>
            <div className="min-w-0 leading-tight">
              <p className="truncate font-bold text-slate-900">Nguyễn Thị Hoa</p>
              <p className="truncate text-xs text-slate-500">Áo dài lụa · hen 20/12</p>
            </div>
            <Badge className="ml-auto bg-brand-100 text-brand-800 ring-brand-600/20">Đang may</Badge>
          </div>

          <div className="rounded-xl bg-paper p-3 ring-1 ring-slate-200">
            <p className="text-xs text-slate-500">Còn lại</p>
            <p className="text-lg font-bold text-slate-900">1.250.000 ₫</p>
          </div>

          <div className="flex gap-2">
            <Button co="nho">Nút chính</Button>
            <Button co="nho" kieu="phu">
              Nút phụ
            </Button>
            <Button co="nho" kieu="vang">
              Nhấn
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/*  Trang Giao diện                                                     */
/* ------------------------------------------------------------------ */

export function GiaoDienPage() {
  const tb = useThongBao()
  const { cai, doi, traVeMacDinh } = useGiaoDien()

  /** Tăng lên mỗi lần bấm một lựa chọn, để khung xem thử chạy lại. */
  const [lanThu, setLanThu] = useState(0)
  const [dangChayThu, setDangChayThu] = useState('')
  const hen = useRef<number[]>([])

  const giamChuyenDong = mayGiamChuyenDong()

  // Rời trang giữa chừng thì dọn sạch mấy cái hen giờ của "Chạy thử tất cả"
  useEffect(() => {
    const ds = hen
    return () => {
      ds.current.forEach((id) => window.clearTimeout(id))
      ds.current = []
    }
  }, [])

  /** Mọi lựa chọn đều đi qua đây, để khung xem thử luôn chạy lại. */
  function chon<K extends keyof CaiDatGiaoDien>(khoa: K, gt: CaiDatGiaoDien[K]) {
    doi(khoa, gt)
    setLanThu((n) => n + 1)
  }

  /**
   * Chạy thử lần lượt từng hiệu ứng, mỗi cái một nhịp, rồi trả về lựa chọn
   * cũ. Đổi thẳng trên thẻ <html> chứ không lưu, nên chạy thử xong không
   * làm mất lựa chọn người dùng đang để.
   */
  const chayThuTatCa = () => {
    if (dangChayThu) return
    const ds = HIEU_UNG.filter((h) => h.ma !== 'tat')
    const nhip = cai.tocDo === 'cham' ? 1000 : cai.tocDo === 'nhanh' ? 560 : 760

    ds.forEach((h, i) => {
      hen.current.push(
        window.setTimeout(() => {
          document.documentElement.dataset.hieuUng = h.ma
          document.documentElement.dataset.hieuUngTay = '1'
          setDangChayThu(h.ten)
          setLanThu((n) => n + 1)
        }, i * nhip),
      )
    })

    hen.current.push(
      window.setTimeout(() => {
        apDung(cai) // trả lại đúng lựa chọn đang lưu
        setDangChayThu('')
        setLanThu((n) => n + 1)
      }, ds.length * nhip),
    )
  }

  const khoiPhuc = () => {
    traVeMacDinh()
    setLanThu((n) => n + 1)
    tb.tin('Đã trả giao diện về như lúc mới cài.')
  }

  return (
    <div>
      <PageHeader
        tieuDe="Giao diện"
        moTa="Màu sắc, cỡ chữ và hiệu ứng chuyển động. Lựa chọn lưu riêng trên máy này."
      />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          {/* ---------------- Nền sáng / tối ---------------- */}
          <Card>
            <CardHeader tieuDe="Nền sáng hay nền tối" moTa="“Theo máy” là nghe theo cài đặt của Windows" />
            <CardBody>
              <div className="flex gap-2">
                {(['sang', 'toi', 'theo_may'] as ChoDoGiaoDien[]).map((c) => (
                  <NutChon
                    key={c}
                    ma={`che:${c}`}
                    dangChon={cai.che === c}
                    onClick={() => chon('che', c)}
                  >
                    {c === 'sang' ? (
                      <Sun className="size-5" />
                    ) : c === 'toi' ? (
                      <Moon className="size-5" />
                    ) : (
                      <Monitor className="size-5" />
                    )}
                    {NHAN_GIAO_DIEN[c]}
                  </NutChon>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* ---------------- Màu chủ đạo ---------------- */}
          <Card>
            <CardHeader
              tieuDe="Màu chủ đạo"
              moTa="Đổi màu thanh bên trái, nút bấm và liên kết của cả phần mềm"
            />
            <CardBody>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {MAU_CHU_DAO.map((m) => (
                  <button
                    key={m.ma}
                    type="button"
                    data-chon={`mau:${m.ma}`}
                    onClick={() => chon('mau', m.ma)}
                    aria-pressed={cai.mau === m.ma}
                    className={cn(
                      'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                      cai.mau === m.ma
                        ? 'bg-slate-100 text-slate-900 ring-2 ring-slate-400'
                        : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100',
                    )}
                  >
                    <span
                      className="flex size-7 shrink-0 items-center justify-center rounded-lg"
                      style={{ backgroundColor: m.xem }}
                    >
                      {cai.mau === m.ma && <Check className="size-4 text-white" />}
                    </span>
                    <span className="truncate">{m.ten}</span>
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* ---------------- Cỡ chữ & bo góc ---------------- */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Card>
              <CardHeader tieuDe="Cỡ chữ" moTa="To nhỏ cả phần mềm, hợp với người mắt kém" />
              <CardBody>
                <div className="flex gap-2">
                  {(['nho', 'vua', 'lon'] as CoChu[]).map((c) => (
                    <NutChon
                      key={c}
                      ma={`coChu:${c}`}
                      dangChon={cai.coChu === c}
                      onClick={() => chon('coChu', c)}
                    >
                      <Type className={c === 'nho' ? 'size-3.5' : c === 'vua' ? 'size-4' : 'size-5'} />
                      {NHAN_CO_CHU[c]}
                    </NutChon>
                  ))}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader tieuDe="Bo góc" moTa="Góc của thẻ, nút và ô nhập" />
              <CardBody>
                <div className="flex gap-2">
                  {(['vuong', 'vua', 'tron'] as BoGoc[]).map((b) => (
                    <NutChon
                      key={b}
                      ma={`bo:${b}`}
                      dangChon={cai.bo === b}
                      onClick={() => chon('bo', b)}
                    >
                      <span
                        className={cn(
                          'size-5 bg-current opacity-80',
                          b === 'vuong' ? 'rounded-none' : b === 'vua' ? 'rounded-md' : 'rounded-full',
                        )}
                      />
                      {NHAN_BO_GOC[b]}
                    </NutChon>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>

          {/* ---------------- Hiệu ứng ---------------- */}
          <Card>
            <CardHeader
              tieuDe="Hiệu ứng chuyển động"
              moTa="Bấm vào từng kiểu để xem thử ngay ở khung bên cạnh"
              hanhDong={
                <Button
                  co="nho"
                  kieu="phu"
                  iconTrai={<Play className="size-3.5" />}
                  data-chon="lenh:chay-thu"
                  onClick={chayThuTatCa}
                  disabled={Boolean(dangChayThu)}
                >
                  {dangChayThu ? 'Đang chạy…' : 'Chạy thử tất cả'}
                </Button>
              }
            />
            <CardBody className="space-y-4">
              {giamChuyenDong && !cai.tuChonHieuUng && (
                <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800 ring-1 ring-amber-600/20">
                  Máy của bạn đang bật <strong>“giảm chuyển động”</strong> (Windows › Cài đặt ›
                  Trợ năng › Hiệu ứng hình ảnh), nên phần mềm đang tạm tắt hiệu ứng cho hợp với
                  máy. Bấm chọn một kiểu bên dưới là phần mềm nghe theo bạn.
                </p>
              )}

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {HIEU_UNG.map((h) => (
                  <button
                    key={h.ma}
                    type="button"
                    data-chon={`hieuUng:${h.ma}`}
                    onClick={() => chon('hieuUng', h.ma)}
                    aria-pressed={cai.hieuUng === h.ma}
                    className={cn(
                      'flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors',
                      cai.hieuUng === h.ma
                        ? 'bg-brand-50 ring-2 ring-brand-500'
                        : 'bg-slate-50 ring-1 ring-slate-200 hover:bg-slate-100',
                    )}
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg',
                        h.ma === 'tat'
                          ? 'bg-slate-200 text-slate-600'
                          : 'bg-brand-100 text-brand-700',
                      )}
                    >
                      {h.ma === 'tat' ? <ZapOff className="size-4" /> : <Zap className="size-4" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-slate-900">{h.ten}</span>
                      <span className="block text-xs text-slate-500">{h.moTa}</span>
                    </span>
                  </button>
                ))}
              </div>

              <div>
                <p className="mb-1.5 text-xs font-medium text-slate-500">Tốc độ chạy</p>
                <div className="flex gap-2">
                  {(['cham', 'vua', 'nhanh'] as TocDo[]).map((t) => (
                    <NutChon
                      key={t}
                      ma={`tocDo:${t}`}
                      dangChon={cai.tocDo === t}
                      onClick={() => chon('tocDo', t)}
                      className={cai.hieuUng === 'tat' ? 'opacity-50' : undefined}
                    >
                      {NHAN_TOC_DO[t]}
                    </NutChon>
                  ))}
                </div>
                {cai.hieuUng === 'tat' && (
                  <p className="mt-2 text-xs text-slate-500">
                    Đang tắt hiệu ứng nên tốc độ chưa có tác dụng. Chọn một kiểu hiệu ứng ở trên là
                    dùng được.
                  </p>
                )}
              </div>
            </CardBody>
          </Card>

          <Button
            kieu="phu"
            iconTrai={<RotateCcw className="size-4" />}
            data-chon="lenh:khoi-phuc"
            onClick={khoiPhuc}
          >
            Khôi phục giao diện mặc định
          </Button>
        </div>

        {/* ---------------- Cột xem thử ---------------- */}
        <div className="xl:sticky xl:top-20 xl:self-start">
          <KhungXemThu lanThu={lanThu} dangChayThu={dangChayThu} />
          <p className="mt-3 px-1 text-xs text-slate-500">
            Những lựa chọn này lưu trên <strong>máy này</strong> thôi. Người khác trong tiệm mở
            phần mềm trên máy của họ vẫn thấy giao diện riêng của họ.
          </p>
        </div>
      </div>
    </div>
  )
}
