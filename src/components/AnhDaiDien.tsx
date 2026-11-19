import { useState } from 'react'
import { ANH_DAI_DIEN, duongDanAnhNho } from '@/data/anhMau'
import { chuCaiDau, cn } from '@/lib/utils'

/*
 * Ảnh đại diện trên đầu phần mềm.
 *
 * Cột nguoi_dung.anh_dai_dien giữ MÃ ảnh (ví dụ "vest-3-manh-be"), không
 * giữ đường dẫn. Làm vậy để đổi chỗ chứa ảnh hay đổi đuôi file sau này
 * không phải sửa dữ liệu đã lưu.
 *
 * Chưa chọn ảnh, hoặc mã không còn trong danh sách, thì quay về vòng tròn
 * chữ cái đầu tên như cũ — không bao giờ để ô trống.
 */

type Props = {
  hoTen: string
  /** Mã ảnh đã lưu trong cơ sở dữ liệu. */
  ma?: string | null
  /** Cỡ theo lớp Tailwind, mặc định size-8 như thanh trên cùng. */
  lopCo?: string
  className?: string
}

export function AnhDaiDien({ hoTen, ma, lopCo = 'size-8', className }: Props) {
  const [anhHong, setAnhHong] = useState(false)

  const coAnh = Boolean(ma) && ANH_DAI_DIEN.some((a) => a.ma === ma) && !anhHong

  if (!coAnh) {
    return (
      <span
        className={cn(
          lopCo,
          'flex shrink-0 items-center justify-center rounded-full bg-brand-700 text-xs font-bold text-white',
          className,
        )}
      >
        {chuCaiDau(hoTen)}
      </span>
    )
  }

  return (
    <img
      src={duongDanAnhNho(ma as string)}
      alt={`Ảnh đại diện của ${hoTen}`}
      loading="lazy"
      decoding="async"
      // Ảnh thiếu hoặc hỏng thì lặng lẽ quay về chữ cái đầu tên,
      // đừng để biểu tượng ảnh vỡ nằm giữa thanh công cụ.
      onError={() => setAnhHong(true)}
      className={cn(lopCo, 'shrink-0 rounded-full object-cover ring-1 ring-slate-200', className)}
    />
  )
}

/* ------------------------------------------------------------------ */

type PropsChon = {
  maDangChon?: string | null
  chon: (ma: string | null) => void
  dangLuu?: boolean
}

/** Dải 7 ảnh để người dùng tự chọn ảnh đại diện cho mình. */
export function ChonAnhDaiDien({ maDangChon, chon, dangLuu }: PropsChon) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        type="button"
        disabled={dangLuu}
        onClick={() => chon(null)}
        aria-pressed={!maDangChon}
        title="Dùng chữ cái đầu tên"
        className={cn(
          'flex size-9 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600 transition',
          'hover:ring-2 hover:ring-brand-400 disabled:opacity-50',
          !maDangChon && 'ring-2 ring-brand-600',
        )}
      >
        A
      </button>

      {ANH_DAI_DIEN.map((a) => (
        <button
          key={a.ma}
          type="button"
          disabled={dangLuu}
          onClick={() => chon(a.ma)}
          aria-pressed={maDangChon === a.ma}
          title={a.ten}
          className={cn(
            'rounded-full transition hover:ring-2 hover:ring-brand-400 disabled:opacity-50',
            maDangChon === a.ma && 'ring-2 ring-brand-600',
          )}
        >
          <img
            src={duongDanAnhNho(a.ma)}
            alt={a.ten}
            loading="lazy"
            decoding="async"
            className="size-9 rounded-full object-cover"
          />
        </button>
      ))}
    </div>
  )
}
