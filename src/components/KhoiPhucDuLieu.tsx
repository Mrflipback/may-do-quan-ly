import { useRef, useState } from 'react'
import {
  CircleCheck,
  FileJson,
  RotateCcw,
  TriangleExclamationPoint,
  Upload,
  X,
} from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { HopThoaiXacNhan, useThongBao } from '@/components/ui/ThongBao'
import { HopThoaiXoaCanMatKhau, useMatKhauXoa } from '@/components/MatKhauXoa'
import { dinhDangNgayGio, dinhDangSo } from '@/lib/utils'
import { dichLoi } from '@/lib/loi'
import {
  khoiPhucDuLieu,
  soiFileSaoLuu,
  taiBanSaoLuu,
  type KetQuaKhoiPhuc,
  type SoiGoi,
  type TienDo,
} from '@/data/saoLuu'

/**
 * KHÔI PHỤC DỮ LIỆU TỪ BẢN SAO LƯU
 * ------------------------------------------------------------------
 * Ba bước, không bước nào làm lén sau lưng người dùng:
 *   1. Chọn file  -> phần mềm soi xem trong đó có gì, đếm từng loại
 *   2. Chọn cách nạp (nạp thêm hay thay toàn bộ) và xem lại cho kỹ
 *   3. Xác nhận  -> chạy, có thanh tiến độ, xong thì báo cáo đầy đủ
 *
 * Cách "thay toàn bộ" phải gõ mật khẩu xoá — vì nó xoá sạch dữ liệu
 * đang có, mà bấm nhầm thì không lấy lại được.
 */
export function KhoiPhucDuLieu() {
  const tb = useThongBao()
  const matKhauXoa = useMatKhauXoa()
  const oChonFile = useRef<HTMLInputElement>(null)

  const [soi, setSoi] = useState<SoiGoi | null>(null)
  const [loiDoc, setLoiDoc] = useState('')
  const [xoaTruoc, setXoaTruoc] = useState(false)
  const [luuTruoc, setLuuTruoc] = useState(true)

  const [hoiNapThem, setHoiNapThem] = useState(false)
  const [hoiThayHet, setHoiThayHet] = useState(false)

  const [tienDo, setTienDo] = useState<TienDo | null>(null)
  const [ketQua, setKetQua] = useState<KetQuaKhoiPhuc | null>(null)

  const dangChay = tienDo !== null

  /* ----------------------------- Chọn file ----------------------------- */
  const chonFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = '' // cho phép chọn lại đúng file đó lần sau
    if (!f) return

    setLoiDoc('')
    setKetQua(null)
    try {
      setSoi(await soiFileSaoLuu(f))
    } catch (err) {
      setSoi(null)
      setLoiDoc(err instanceof Error ? err.message : dichLoi(err))
    }
  }

  const boFile = () => {
    setSoi(null)
    setLoiDoc('')
    setKetQua(null)
    setXoaTruoc(false)
  }

  /* ----------------------------- Chạy thật ----------------------------- */
  const chay = async () => {
    if (!soi) return
    setHoiNapThem(false)
    setHoiThayHet(false)
    setKetQua(null)
    setTienDo({ buoc: 'Đang chuẩn bị…', phanTram: 0 })

    try {
      // Lưới an toàn: cất bản hiện tại xuống máy trước khi đụng vào gì
      if (luuTruoc) {
        setTienDo({ buoc: 'Đang cất bản sao lưu của dữ liệu hiện tại…', phanTram: 1 })
        try {
          const cu = await taiBanSaoLuu()
          tb.tin(`Đã cất bản sao lưu hiện tại: ${cu.tenFile}`)
        } catch {
          tb.loi('Không cất được bản sao lưu hiện tại. Phần khôi phục vẫn chạy tiếp.')
        }
      }

      const kq = await khoiPhucDuLieu(soi.goi, { xoaTruoc }, setTienDo)
      setKetQua(kq)

      if (kq.loi.length > 0) {
        tb.loi('Khôi phục xong nhưng có phần không vào được. Bạn đọc báo cáo bên dưới.')
      } else {
        const tong = kq.daNap.reduce((t, d) => t + d.soDong, 0)
        tb.thanhCong(`Đã khôi phục ${dinhDangSo(tong)} dòng dữ liệu.`)
      }
    } catch (err) {
      tb.loi(dichLoi(err))
    } finally {
      setTienDo(null)
    }
  }

  /* ------------------------------- Giao diện ------------------------------- */
  return (
    <Card>
      <CardHeader
        tieuDe="Khôi phục dữ liệu"
        moTa="Nạp lại từ file sao lưu đã tải về máy"
      />
      <CardBody className="space-y-4">
        <input
          ref={oChonFile}
          type="file"
          accept="application/json,.json"
          onChange={chonFile}
          className="hidden"
        />

        {/* ---------- Chưa chọn file ---------- */}
        {!soi && (
          <>
            <p className="text-sm text-slate-600">
              Dùng khi bạn đổi sang dự án Supabase khác, hoặc lỡ tay xoá mất dữ liệu. Chọn file{' '}
              <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">sao-luu-may-do-….json</code>{' '}
              mà phần mềm đã tải về trước đó.
            </p>
            {loiDoc && (
              <p className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700 ring-1 ring-rose-600/20">
                {loiDoc}
              </p>
            )}
            <Button
              kieu="phu"
              iconTrai={<Upload className="size-4" />}
              onClick={() => oChonFile.current?.click()}
            >
              Chọn file sao lưu
            </Button>
          </>
        )}

        {/* ---------- Đã soi xong file ---------- */}
        {soi && !dangChay && !ketQua && (
          <>
            <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3.5 ring-1 ring-slate-200">
              <FileJson className="mt-0.5 size-5 shrink-0 text-brand-600" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">
                  Bản sao lưu lúc {dinhDangNgayGio(soi.thoiDiem) || '—'}
                </p>
                <p className="text-xs text-slate-500">
                  {dinhDangSo(soi.tongDong)} dòng dữ liệu, {soi.cacBang.length} loại
                </p>
              </div>
              <button
                type="button"
                onClick={boFile}
                aria-label="Bỏ file này, chọn file khác"
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
              >
                <X className="size-4" />
              </button>
            </div>

            <ul className="grid grid-cols-1 gap-x-5 gap-y-1 sm:grid-cols-2">
              {soi.cacBang.map((b) => (
                <li
                  key={b.bang}
                  className="flex items-baseline justify-between gap-3 border-b border-slate-100 py-1.5 text-sm"
                >
                  <span className="truncate text-slate-600">{b.nhan}</span>
                  <span className="shrink-0 font-semibold tabular-nums text-slate-900">
                    {dinhDangSo(b.soDong)}
                  </span>
                </li>
              ))}
            </ul>

            {soi.bangLa.length > 0 && (
              <p className="text-xs text-slate-500">
                File còn có {soi.bangLa.length} mục phần mềm không nhận ra ({soi.bangLa.join(', ')})
                — sẽ bỏ qua.
              </p>
            )}

            {/* Chọn cách nạp */}
            <fieldset className="space-y-2.5 rounded-xl border border-slate-200 p-4">
              <legend className="px-2 text-xs font-semibold uppercase tracking-wider text-gold-600">
                Nạp theo cách nào
              </legend>

              <label className="flex cursor-pointer gap-3">
                <input
                  type="radio"
                  name="cach_nap"
                  checked={!xoaTruoc}
                  onChange={() => setXoaTruoc(false)}
                  className="mt-1 size-4 shrink-0 accent-brand-700"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-900">
                    Nạp thêm, giữ dữ liệu đang có
                  </span>
                  <span className="block text-xs leading-relaxed text-slate-500">
                    Khách và đơn đang có vẫn còn nguyên. Dòng nào trong file trùng mã với dòng đang
                    có thì lấy theo file. An toàn, nên dùng cách này.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer gap-3">
                <input
                  type="radio"
                  name="cach_nap"
                  checked={xoaTruoc}
                  onChange={() => setXoaTruoc(true)}
                  className="mt-1 size-4 shrink-0 accent-rose-600"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-rose-700">
                    Xoá sạch rồi nạp lại từ đầu
                  </span>
                  <span className="block text-xs leading-relaxed text-slate-500">
                    Xoá hết khách, đơn, số đo, kho, thanh toán đang có rồi nạp lại đúng như trong
                    file. Dùng khi muốn quay về nguyên trạng ngày sao lưu. Phải gõ mật khẩu xoá.
                  </span>
                </span>
              </label>
            </fieldset>

            <label className="flex cursor-pointer gap-3">
              <input
                type="checkbox"
                checked={luuTruoc}
                onChange={(e) => setLuuTruoc(e.target.checked)}
                className="mt-0.5 size-4 shrink-0 accent-brand-700"
              />
              <span className="text-sm text-slate-600">
                Cất một bản sao lưu của dữ liệu <b>hiện tại</b> xuống máy trước khi nạp.{' '}
                <span className="text-slate-500">Nên bật — lỡ nạp nhầm file thì còn đường lui.</span>
              </span>
            </label>

            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                kieu={xoaTruoc ? 'nguyHiem' : 'chinh'}
                iconTrai={<RotateCcw className="size-4" />}
                onClick={() => (xoaTruoc ? setHoiThayHet(true) : setHoiNapThem(true))}
              >
                {xoaTruoc ? 'Xoá sạch và nạp lại' : 'Khôi phục dữ liệu'}
              </Button>
              <Button kieu="phu" onClick={boFile}>
                Chọn file khác
              </Button>
            </div>
          </>
        )}

        {/* ---------- Đang chạy ---------- */}
        {dangChay && (
          <div className="space-y-3 py-2">
            <p className="text-sm font-medium text-slate-900">{tienDo.buoc}</p>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-brand-600 transition-[width] duration-300"
                style={{ width: `${tienDo.phanTram}%` }}
              />
            </div>
            <p className="text-xs text-slate-500">
              {tienDo.phanTram}% — đừng đóng hay tải lại trang cho tới khi xong.
            </p>
          </div>
        )}

        {/* ---------- Báo cáo kết quả ---------- */}
        {ketQua && !dangChay && (
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              {ketQua.loi.length > 0 ? (
                <TriangleExclamationPoint className="mt-0.5 size-5 shrink-0 text-amber-600" />
              ) : (
                <CircleCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" />
              )}
              <p className="text-sm font-semibold text-slate-900">
                {ketQua.loi.length > 0
                  ? 'Khôi phục xong, nhưng có phần không vào được'
                  : 'Khôi phục xong'}
              </p>
            </div>

            {ketQua.daNap.length > 0 && (
              <ul className="space-y-1 rounded-xl bg-emerald-50 p-3.5 text-sm text-emerald-900 ring-1 ring-emerald-600/20">
                {ketQua.daNap.map((d) => (
                  <li key={d.nhan} className="flex justify-between gap-3">
                    <span className="truncate">{d.nhan}</span>
                    <span className="shrink-0 font-semibold tabular-nums">
                      {dinhDangSo(d.soDong)} dòng
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {ketQua.boQua.map((d) => (
              <p
                key={d.nhan}
                className="rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600 ring-1 ring-slate-200"
              >
                <b className="text-slate-900">Bỏ qua {d.nhan}</b> ({dinhDangSo(d.soDong)} dòng) —{' '}
                {d.viSao}.
              </p>
            ))}

            {ketQua.canhBao.map((c) => (
              <p
                key={c}
                className="rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 ring-1 ring-amber-600/20"
              >
                {c}
              </p>
            ))}

            {ketQua.loi.map((l) => (
              <p
                key={l}
                className="rounded-xl bg-rose-50 p-3 text-xs leading-relaxed text-rose-700 ring-1 ring-rose-600/20"
              >
                {l}
              </p>
            ))}

            <p className="text-xs text-slate-500">
              Bạn mở lại các màn hình Khách hàng, Đơn hàng, Kho để kiểm tra lại cho chắc.
            </p>

            <Button kieu="phu" onClick={boFile}>
              Xong
            </Button>
          </div>
        )}
      </CardBody>

      {/* Hỏi lại: nạp thêm */}
      <HopThoaiXacNhan
        moRa={hoiNapThem}
        tieuDe="Nạp dữ liệu từ bản sao lưu?"
        noiDung={
          soi
            ? `${dinhDangSo(soi.tongDong)} dòng sẽ được nạp vào tiệm. Dữ liệu đang có vẫn giữ nguyên; ` +
              'dòng nào trùng mã với dòng trong file thì sẽ lấy theo file. Việc này không huỷ được.'
            : ''
        }
        nhanDongY="Nạp dữ liệu"
        dongY={() => void chay()}
        huy={() => setHoiNapThem(false)}
      />

      {/* Hỏi lại: xoá sạch rồi nạp — phải gõ mật khẩu */}
      <HopThoaiXoaCanMatKhau
        moRa={hoiThayHet}
        tieuDe="Xoá sạch dữ liệu rồi nạp lại?"
        noiDung={
          soi
            ? 'Toàn bộ khách hàng, số đo, đơn hàng, thanh toán và kho đang có sẽ bị xoá, ' +
              `rồi nạp lại ${dinhDangSo(soi.tongDong)} dòng từ file sao lưu. Tài khoản nhân sự được giữ nguyên.`
            : ''
        }
        canhBao="Việc này KHÔNG huỷ lại được. Hãy chắc chắn bạn đã cất một bản sao lưu của dữ liệu hiện tại."
        nhanDongY="Xoá sạch và nạp lại"
        daDatMatKhau={matKhauXoa.daDat}
        kiemTra={matKhauXoa.kiemTra}
        dongY={() => void chay()}
        huy={() => setHoiThayHet(false)}
      />
    </Card>
  )
}
