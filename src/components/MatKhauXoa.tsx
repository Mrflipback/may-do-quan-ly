import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { KeyRound, ShieldAlert, TriangleExclamationPoint } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { useThongBao } from '@/components/ui/ThongBao'
import { useCaiDat, useLuuCaiDat } from '@/data/heThong'
import { dichLoi } from '@/lib/loi'
import {
  KHOA_BAM,
  KHOA_MUOI,
  dungMatKhau,
  loiMatKhauMoi,
  taoVanTay,
} from '@/lib/matKhauXoa'

/* ------------------------------------------------------------------ */
/*  Đọc và đổi mật khẩu xoá                                            */
/* ------------------------------------------------------------------ */

export function useMatKhauXoa() {
  const caiDat = useCaiDat()
  const luu = useLuuCaiDat()

  const muoi = caiDat.data?.[KHOA_MUOI]
  const bam = caiDat.data?.[KHOA_BAM]
  const daDat = Boolean(muoi && bam)

  return {
    dangTai: caiDat.isLoading,
    daDat,
    /** Mật khẩu người dùng vừa gõ có khớp không. */
    kiemTra: (mk: string) => dungMatKhau(muoi, bam, mk),
    dangLuu: luu.isPending,
    /** Đặt mật khẩu mới (hoặc đổi mật khẩu cũ). */
    dat: async (mkMoi: string) => {
      const v = taoVanTay(mkMoi)
      await luu.mutateAsync({ [KHOA_MUOI]: v.muoi, [KHOA_BAM]: v.bam })
    },
    /** Gỡ bỏ mật khẩu: để trống hai ô trong cai_dat. */
    go: async () => {
      await luu.mutateAsync({ [KHOA_MUOI]: '', [KHOA_BAM]: '' })
    },
  }
}

/* ------------------------------------------------------------------ */
/*  Thẻ trong trang Cài đặt                                            */
/* ------------------------------------------------------------------ */

export function TheMatKhauXoa() {
  const tb = useThongBao()
  const mk = useMatKhauXoa()

  const [hienTai, setHienTai] = useState('')
  const [moi, setMoi] = useState('')
  const [lai, setLai] = useState('')
  const [loi, setLoi] = useState('')

  const donForm = () => {
    setHienTai('')
    setMoi('')
    setLai('')
    setLoi('')
  }

  const gui = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoi('')

    if (mk.daDat && !mk.kiemTra(hienTai)) {
      return setLoi('Mật khẩu xoá hiện tại không đúng.')
    }
    const loiMoi = loiMatKhauMoi(moi)
    if (loiMoi) return setLoi(loiMoi)
    if (moi !== lai) return setLoi('Hai ô mật khẩu mới chưa giống nhau.')

    try {
      await mk.dat(moi)
      donForm()
      tb.thanhCong(
        mk.daDat
          ? 'Đã đổi mật khẩu xoá tài khoản.'
          : 'Đã đặt mật khẩu xoá tài khoản. Từ giờ muốn xoá tài khoản nào cũng phải gõ mật khẩu này.',
      )
    } catch (err) {
      setLoi(dichLoi(err))
    }
  }

  const goBo = async () => {
    setLoi('')
    if (!mk.kiemTra(hienTai)) return setLoi('Gõ đúng mật khẩu hiện tại thì mới gỡ bỏ được.')
    try {
      await mk.go()
      donForm()
      tb.tin('Đã gỡ mật khẩu xoá. Giờ xoá tài khoản chỉ cần bấm xác nhận.')
    } catch (err) {
      setLoi(dichLoi(err))
    }
  }

  return (
    <Card>
      <CardHeader
        tieuDe="Mật khẩu xoá tài khoản"
        moTa={mk.daDat ? 'Đang bật — xoá tài khoản phải gõ mật khẩu' : 'Chưa đặt'}
      />
      <CardBody className="space-y-4">
        <div className="flex gap-3">
          <KeyRound
            className={mk.daDat ? 'size-5 shrink-0 text-emerald-600' : 'size-5 shrink-0 text-amber-600'}
          />
          <p className="text-sm text-slate-600">
            Đây là mật khẩu <strong>riêng</strong>, bạn tự đặt, khác mật khẩu đăng nhập. Mỗi lần
            xoá một tài khoản khỏi tiệm, phần mềm sẽ hỏi mật khẩu này — để không ai bấm nhầm, và
            để người lạ ngồi vào máy đang mở sẵn cũng không xoá được ai.
          </p>
        </div>

        <form onSubmit={gui} className="space-y-3">
          {mk.daDat && (
            <Input
              nhan="Mật khẩu xoá hiện tại"
              type="password"
              value={hienTai}
              onChange={(e) => setHienTai(e.target.value)}
              autoComplete="off"
              placeholder="Gõ mật khẩu đang dùng"
            />
          )}
          <Input
            nhan={mk.daDat ? 'Mật khẩu xoá mới' : 'Đặt mật khẩu xoá'}
            type="password"
            value={moi}
            onChange={(e) => setMoi(e.target.value)}
            autoComplete="new-password"
            placeholder="Ít nhất 6 ký tự"
            goiY="Nên chọn câu dễ nhớ với bạn nhưng người khác không đoán ra."
          />
          <Input
            nhan="Nhập lại cho chắc"
            type="password"
            value={lai}
            onChange={(e) => setLai(e.target.value)}
            autoComplete="new-password"
            placeholder="Gõ lại mật khẩu mới"
          />

          {loi && (
            <p className="rounded-lg bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700 ring-1 ring-rose-600/20">
              {loi}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" dangTai={mk.dangLuu}>
              {mk.daDat ? 'Đổi mật khẩu' : 'Đặt mật khẩu'}
            </Button>
            {mk.daDat && (
              <Button type="button" kieu="phu" onClick={() => void goBo()} dangTai={mk.dangLuu}>
                Gỡ bỏ
              </Button>
            )}
          </div>
        </form>

        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 ring-1 ring-slate-200">
          Phần mềm <strong>không lưu mật khẩu nguyên văn</strong>, chỉ lưu dấu vân tay của nó, nên
          nhìn vào cơ sở dữ liệu cũng không đọc ngược ra được. Đổi lại: quên là không ai lấy lại
          hộ được — lúc đó phải vào Supabase xoá hai dòng <code>xoa_tk_muoi</code> và{' '}
          <code>xoa_tk_bam</code> trong bảng <code>cai_dat</code> để đặt lại từ đầu.
        </p>
      </CardBody>
    </Card>
  )
}

/* ------------------------------------------------------------------ */
/*  Hộp thoại xoá có hỏi mật khẩu                                      */
/* ------------------------------------------------------------------ */

interface HopThoaiProps {
  moRa: boolean
  tieuDe: string
  noiDung: string
  /** Dòng cảnh báo đậm hơn, ví dụ khi tự xoá tài khoản của chính mình. */
  canhBao?: string
  nhanDongY?: string
  dangXuLy?: boolean
  /** Chưa đặt mật khẩu xoá thì chặn luôn, bắt đi đặt trước. */
  daDatMatKhau: boolean
  kiemTra: (mk: string) => boolean
  dongY: () => void
  huy: () => void
}

export function HopThoaiXoaCanMatKhau({
  moRa,
  tieuDe,
  noiDung,
  canhBao,
  nhanDongY = 'Xoá tài khoản',
  dangXuLy = false,
  daDatMatKhau,
  kiemTra,
  dongY,
  huy,
}: HopThoaiProps) {
  const [mk, setMk] = useState('')
  const [loi, setLoi] = useState('')

  // Mở hộp thoại mới thì ô mật khẩu phải trống, không giữ lại lần trước
  useEffect(() => {
    if (moRa) {
      setMk('')
      setLoi('')
    }
  }, [moRa])

  useEffect(() => {
    if (!moRa) return
    const xuLy = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !dangXuLy) huy()
    }
    document.addEventListener('keydown', xuLy)
    return () => document.removeEventListener('keydown', xuLy)
  }, [moRa, huy, dangXuLy])

  if (!moRa) return null

  const gui = (e: React.FormEvent) => {
    e.preventDefault()
    if (!daDatMatKhau) return
    if (!kiemTra(mk)) {
      setLoi('Mật khẩu xoá không đúng. Tài khoản chưa bị xoá.')
      setMk('')
      return
    }
    setLoi('')
    dongY()
  }

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={tieuDe}
        className="hieu-ung relative w-full max-w-md rounded-2xl bg-paper p-6 shadow-2xl"
      >
        <div className="flex gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <TriangleExclamationPoint className="size-6" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900">{tieuDe}</h2>
            <p className="mt-1.5 text-sm text-slate-600">{noiDung}</p>
          </div>
        </div>

        {canhBao && (
          <p className="mt-4 flex gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-sm font-medium text-amber-800 ring-1 ring-amber-600/20">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" />
            <span>{canhBao}</span>
          </p>
        )}

        {daDatMatKhau ? (
          <form onSubmit={gui} className="mt-5">
            <Input
              nhan="Mật khẩu xoá tài khoản"
              batBuoc
              type="password"
              value={mk}
              onChange={(e) => setMk(e.target.value)}
              autoFocus
              autoComplete="off"
              placeholder="Gõ mật khẩu bạn đã đặt trong Cài đặt"
              loi={loi}
              iconTrai={<KeyRound className="size-4" />}
            />
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={huy}
                disabled={dangXuLy}
                className="h-10 rounded-lg bg-paper px-4 text-sm font-medium text-slate-700 ring-1 ring-slate-300 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={dangXuLy || mk.length === 0}
                className="h-10 rounded-lg bg-rose-600 px-4 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
              >
                {dangXuLy ? 'Đang xoá…' : nhanDongY}
              </button>
            </div>
          </form>
        ) : (
          <>
            <p className="mt-5 rounded-lg bg-amber-50 px-3 py-2.5 text-sm font-medium text-amber-800 ring-1 ring-amber-600/20">
              Tiệm chưa đặt mật khẩu xoá tài khoản. Hãy kéo xuống thẻ{' '}
              <strong>“Mật khẩu xoá tài khoản”</strong> ngay trong trang Cài đặt này để đặt trước
              đã, rồi quay lại xoá.
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={huy}
                className="h-10 rounded-lg bg-brand-700 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-800"
              >
                Đã hiểu
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}
