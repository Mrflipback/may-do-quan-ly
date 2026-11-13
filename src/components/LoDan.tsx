import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * HIỆN DẦN KHI CUỘN TỚI
 * ------------------------------------------------------------------
 * Bọc quanh một khối nội dung: khối đó nằm im cho tới khi người xem cuộn
 * tới, rồi mới nổi lên. Dùng ở trang khách xem cho đỡ "đổ ụp" một lúc.
 *
 * Tôn trọng mục Giao diện: ai chọn "Tắt hiệu ứng" thì nội dung hiện ra
 * ngay, không chờ gì cả.
 *
 * Trình duyệt cũ không có IntersectionObserver cũng hiện ngay — thà bỏ
 * hiệu ứng còn hơn để trang trắng trơn.
 */
export function LoDan({
  children,
  tre = 0,
  className,
}: {
  children: ReactNode
  /** Chậm hơn mấy phần nghìn giây, để các khối nối nhau cho mượt. */
  tre?: number
  className?: string
}) {
  const o = useRef<HTMLDivElement>(null)
  const [hien, setHien] = useState(false)

  useEffect(() => {
    const el = o.current
    if (!el) return

    const tat = document.documentElement.dataset.hieuUng === 'tat'
    if (tat || typeof IntersectionObserver === 'undefined') {
      setHien(true)
      return
    }

    const theoDoi = new IntersectionObserver(
      (muc) => {
        if (muc.some((m) => m.isIntersecting)) {
          setHien(true)
          theoDoi.disconnect()
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.05 },
    )
    theoDoi.observe(el)

    // Lưới an toàn: quá 2 giây mà chưa thấy gì thì cứ hiện ra
    const hen = window.setTimeout(() => setHien(true), 2000)

    return () => {
      theoDoi.disconnect()
      window.clearTimeout(hen)
    }
  }, [])

  return (
    <div
      ref={o}
      className={cn('lo-dan', hien && 'hien', className)}
      style={tre ? { transitionDelay: `${tre}ms` } : undefined}
    >
      {children}
    </div>
  )
}
