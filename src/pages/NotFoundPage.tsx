import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { useT } from '@/i18n'

export function NotFoundPage() {
  const { t: dich } = useT()
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <p className="text-6xl font-bold text-brand-200">404</p>
      <h1 className="mt-4 text-xl font-bold text-slate-900">{dich('baoVe.khongTimThayTrang')}</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        {dich('baoVe.khongTimThayMoTa')}
      </p>
      <Link to="/" className="mt-6">
        <Button>{dich('baoVe.veBangDieuKhien')}</Button>
      </Link>
    </div>
  )
}
