import { Database, Scissors } from 'lucide-react'

/**
 * Màn hình hiện ra khi file .env chưa có khóa Supabase.
 * Thà hướng dẫn rõ ràng còn hơn để người dùng gặp màn hình trắng.
 */
export function ChuaCauHinh() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-100 p-5">
      <div className="w-full max-w-2xl rounded-2xl bg-paper p-7 shadow-sm ring-1 ring-slate-200 sm:p-10">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-brand-800 text-gold-400">
            <Scissors className="size-6" />
          </span>
          <div className="leading-tight">
            <p className="font-bold text-slate-900">MAY ĐO QUẢN LÝ</p>
            <p className="text-xs font-semibold tracking-widest text-brand-700">PRO</p>
          </div>
        </div>

        <div className="mt-7 flex gap-3 rounded-xl bg-gold-50 p-4 ring-1 ring-gold-600/20">
          <Database className="size-5 shrink-0 text-gold-700" />
          <div>
            <h1 className="font-semibold text-gold-900">Chưa kết nối cơ sở dữ liệu</h1>
            <p className="mt-1 text-sm text-gold-800">
              Phần mềm đã cài xong nhưng chưa biết lưu dữ liệu vào đâu. Làm 5 bước dưới đây là
              xong, chỉ mất khoảng 10 phút.
            </p>
          </div>
        </div>

        <ol className="mt-7 space-y-5">
          <Buoc so={1} tieuDe="Tạo tài khoản Supabase">
            Mở{' '}
            <a
              href="https://supabase.com"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-brand-700 underline"
            >
              supabase.com
            </a>{' '}
            và đăng ký miễn phí. Bấm <Nut>New project</Nut>, đặt tên bất kỳ, chọn vùng{' '}
            <Nut>Southeast Asia (Singapore)</Nut> cho nhanh, rồi đặt một mật khẩu cơ sở dữ liệu và{' '}
            <strong>lưu mật khẩu đó lại</strong>.
          </Buoc>

          <Buoc so={2} tieuDe="Tạo các bảng dữ liệu">
            Trong dự án Supabase, bấm <Nut>SQL Editor</Nut> ở menu trái, bấm <Nut>New query</Nut>.
            Mở file <Ma>supabase/01_schema.sql</Ma> trong thư mục phần mềm, chép toàn bộ nội dung
            dán vào rồi bấm <Nut>Run</Nut>. Làm y như vậy với file <Ma>supabase/02_storage.sql</Ma>.
          </Buoc>

          <Buoc so={3} tieuDe="Lấy 2 khóa kết nối">
            Bấm <Nut>Project Settings</Nut> → <Nut>Data API</Nut>. Chép giá trị{' '}
            <Nut>Project URL</Nut>. Sau đó sang <Nut>API Keys</Nut> và chép{' '}
            <Nut>anon public</Nut> (còn gọi là publishable key).
            <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-800 ring-1 ring-rose-600/20">
              <strong>Đừng chép nhầm</strong> khóa <Ma>service_role</Ma>. Khóa đó là khóa bí mật,
              không được đưa vào phần mềm chạy trên trình duyệt.
            </p>
          </Buoc>

          <Buoc so={4} tieuDe="Điền khóa vào file .env">
            Trong thư mục phần mềm có file <Ma>.env.example</Ma>. Chép nó ra thành file tên{' '}
            <Ma>.env</Ma> rồi điền 2 giá trị vừa lấy:
            <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-900 p-3 text-xs leading-relaxed text-slate-100">
              {`VITE_SUPABASE_URL=https://abcxyz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...`}
            </pre>
          </Buoc>

          <Buoc so={5} tieuDe="Chạy lại phần mềm">
            Quay lại cửa sổ PowerShell đang chạy, bấm <Ma>Ctrl + C</Ma> để dừng, rồi gõ lại{' '}
            <Ma>npm run dev</Ma>. Màn hình này sẽ biến mất và hiện ra trang đăng nhập.
            <p className="mt-2 text-xs text-slate-500">
              Vite chỉ đọc file <Ma>.env</Ma> lúc khởi động, nên bắt buộc phải chạy lại.
            </p>
          </Buoc>
        </ol>

        <p className="mt-7 border-t border-slate-200 pt-5 text-sm text-slate-500">
          Hướng dẫn đầy đủ có ảnh minh họa nằm trong file{' '}
          <Ma>HUONG-DAN-CAI-DAT.md</Ma> ở thư mục phần mềm.
        </p>
      </div>
    </div>
  )
}

function Buoc({
  so,
  tieuDe,
  children,
}: {
  so: number
  tieuDe: string
  children: React.ReactNode
}) {
  return (
    <li className="flex gap-4">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white">
        {so}
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="font-semibold text-slate-900">{tieuDe}</h2>
        <div className="mt-1 text-sm leading-relaxed text-slate-600">{children}</div>
      </div>
    </li>
  )
}

function Nut({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[13px] font-semibold text-slate-800">
      {children}
    </span>
  )
}

function Ma({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[13px] text-brand-800">
      {children}
    </code>
  )
}
