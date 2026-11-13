import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <p className="text-6xl font-bold text-brand-200">404</p>
      <h1 className="mt-4 text-xl font-bold text-slate-900">Không tìm thấy trang này</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        Đường dẫn bạn vừa mở không tồn tại hoặc đã bị đổi tên.
      </p>
      <Link to="/" className="mt-6">
        <Button>Về bảng điều khiển</Button>
      </Link>
    </div>
  )
}
