import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

/**
 * Địa chỉ gốc của trang.
 *
 * Chạy trên máy và chạy trên Vercel thì trang nằm ở gốc "/".
 * GitHub Pages lại chạy trang trong THƯ MỤC CON theo tên kho, ví dụ
 * https://tiemmay.github.io/may-do/ — nên lúc đó phải là "/may-do/".
 *
 * Không viết cứng tên kho ở đây: file .github/workflows/deploy.yml tự đặt
 * biến BASE_PATH theo đúng tên kho, nên đổi tên kho cũng không hỏng.
 *
 * Giá trị này chui vào import.meta.env.BASE_URL, và mọi chỗ trong phần mềm
 * cần đường dẫn tuyệt đối (ảnh mẫu, basename của router, link đặt lại mật
 * khẩu) đều lấy từ đó — nên chỉ cần đúng ở một chỗ duy nhất là đây.
 */
function chuanHoaBase(v: string | undefined): string {
  const t = (v ?? '').trim()
  if (!t || t === '/') return '/'
  // Thieu dau gach dau hoac cuoi la Vite sinh ra duong dan dinh lien nhau
  // kieu "/may-doassets/index.js" -> trang trang, rat kho doan ra vi sao.
  return '/' + t.replace(/^\/+|\/+$/g, '') + '/'
}

const base = chuanHoaBase(process.env.BASE_PATH)

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  // Máy chủ chạy thử trên máy tiệm.
  // host: true -> điện thoại, máy tính bảng trong cùng wifi mở được bằng
  // địa chỉ "Network" mà cửa sổ đen in ra (dạng http://192.168.x.x:5173).
  server: {
    port: 5173,
    strictPort: false,
    host: true,
    open: true,
  },
  // Dùng khi xem thử bản đã đóng gói (npm run preview).
  preview: {
    port: 4173,
    strictPort: false,
    host: true,
    open: true,
  },
  build: {
    chunkSizeWarningLimit: 1200,
  },
})
