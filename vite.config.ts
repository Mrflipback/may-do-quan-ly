import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import fs from 'node:fs'
import crypto from 'node:crypto'
import type { Plugin } from 'vite'

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

/* ------------------------------------------------------------------ */
/*  HEADER BẢO MẬT                                                   */
/* ------------------------------------------------------------------ */
/**
 * Gắn Content-Security-Policy vào index.html lúc đóng gói.
 *
 * VÌ SAO PHẢI NHÉT VÀO TRANG CHỨ KHÔNG ĐẶT HEADER THẬT:
 * GitHub Pages không cho đặt header HTTP. Không có chỗ nào để khai cả.
 * Nhét thẻ <meta http-equiv> vào trang thì trình duyệt vẫn áp dụng
 * đầy đủ — trừ ba thứ chỉ sống được ở header thật: frame-ancestors,
 * report-uri và sandbox. Xem vercel.json cho bản header đầy đủ.
 *
 * VÌ SAO TÍNH MÃ BĂM TỰ ĐỘNG:
 * index.html có hai đoạn script viết thẳng trong trang. CSP chặt thì
 * phải khai mã băm của chúng. Viết tay mã băm là bẫy: sửa một dấu
 * phẩy trong script là mã băm lệch, trang trắng trơn mà không báo gì rõ
 * ràng. Tính tự động lúc build thì không bao giờ lệch được.
 *
 * CHỈ CHẠY LÚC ĐÓNG GÓI. Lúc `npm run dev`, Vite tự chèn script riêng
 * và dùng WebSocket để nạp lại nóng — áp CSP chặt vào là chết bản chạy
 * thử trên máy.
 */
function themHeaderBaoMat(diaChiMayChu: string): Plugin {
  let thuMucRa = ""

  return {
    name: 'them-header-bao-mat',
    apply: 'build',

    configResolved(c) {
      thuMucRa = path.resolve(c.root, c.build.outDir)
    },

    // closeBundle chay SAU khi Vite da ghi file ra dia.
    //
    // Truoc day toi gan CSP trong transformIndexHtml, tuc la bam ban
    // HTML con nam trong bo nho. Ban do con xuong dong kieu Windows
    // (CRLF) trong khi file ghi ra lai dung LF - lech mot ky tu moi
    // dong, ma bam khac han, CSP chan luon script cua chinh minh va
    // trang chet cam. Bam dung file da ghi ra thi khong the lech.
    closeBundle() {
      const f = path.join(thuMucRa, 'index.html')
      if (!fs.existsSync(f)) return
      let html = fs.readFileSync(f, 'utf8')

      // Da gan roi thi thoi (build chay hai lan trong mot lenh)
      if (html.includes('http-equiv="Content-Security-Policy"')) return

      // Tach THUOC TINH khoi THAN the, roi loc bang hai cau if doc la
      // hieu - khong dung lookahead cho kho doan.
      const bam: string[] = []
      for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
        const thuocTinh = m[1]
        const than = m[2]
        // Script tai tu file rieng - 'self' da cho phep, khong can ma bam
        if (/\bsrc\s*=/.test(thuocTinh)) continue
        if (than.trim() === '') continue
        // CHO NAY TUNG LAM TRANG CHET CAM, nen doc ky truoc khi sua:
        //
        // File tren dia nay xuong dong kieu Windows (CRLF). Nhung khi
        // trinh duyet doc trang, no doi het CRLF thanh LF theo dung
        // chuan HTML, ROI MOI bam de doi chieu voi CSP. Bam ban CRLF o
        // day la ra ma bam khac han -> CSP chan luon hai doan script
        // cua chinh minh -> trang ra trang tron, khong bao loi gi ca.
        const noiDung = than.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
        const h = crypto.createHash('sha256').update(noiDung, 'utf8').digest('base64')
        bam.push(`'sha256-${h}'`)
      }

      // CHOT CHAN: index.html co hai doan script viet thang trong trang.
      // Tim duoc 0 doan nghia la cach doc da hong - chang han ban Vite
      // moi doi cach sinh HTML. Luc do CSP se chan luon hai doan do va
      // TRANG RA TRANG TRON. Tha hong build con hon ship trang chet.
      if (bam.length === 0) {
        throw new Error(
          'them-header-bao-mat: khong tim thay doan script nao viet thang trong index.html. ' +
            'Khong gan CSP vi lam vay se chan mat script chong nhay nen va script ' +
            'khoi phuc duong dan -> trang ra trang tron.',
        )
      }

      // Dia chi Supabase cua tiem. Khong khai thi phan mem khong goi
      // duoc may chu nua. Khong ro thi mo chung cho moi supabase.co.
      const mayChu = (diaChiMayChu || "").trim()
      const noiToi = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(mayChu)
        ? mayChu.replace(/\/$/, "")
        : 'https://*.supabase.co'

      const csp = [
        "default-src 'self'",
        "base-uri 'self'",
        "object-src 'none'",
        `script-src 'self' ${bam.join(' ')}`,
        // unsafe-inline cho KIEU DANG: React dat style thang tren the
        // (do tre hieu ung, thanh tien do...). Kieu dang noi dong nguy
        // hiem thap hon han script noi dong.
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' data: https://fonts.gstatic.com",
        "img-src 'self' data: blob:",
        `connect-src 'self' ${noiToi} https://api.country.is`,
        "form-action 'self'",
        "frame-src 'none'",
        "worker-src 'self' blob:",
        "manifest-src 'self'",
        // Trusted Types: chan han viec gan chuoi tho vao innerHTML,
        // script.text va may cho tuong tu — ngay o TANG DOM, truoc khi
        // ma kip chay. Da quet het 11 trang quan ly, khong cho nao dung
        // toi may ham do nen khong hong gi.
        //
        // Chi Chromium (Chrome, Edge, Cot Cot) hieu. Firefox va Safari bo
        // qua dong nay — khong hong gi, chi la khong duoc bao ve them.
        "require-trusted-types-for 'script'",
        'upgrade-insecure-requests',
      ].join('; ')

      // Dat NGAY SAU <head> - CSP chi co hieu luc voi nhung gi nam SAU no.
      html = html.replace(
        '<head>',
        `<head>\n    <meta http-equiv="Content-Security-Policy" content="${csp}" />`,
      )
      fs.writeFileSync(f, html, 'utf8')
    },
  }
}

export default defineConfig(({ mode }) => {
  // loadEnv doc file .env giong het cach Vite doc cho phan mem.
  // Chi lay tien to VITE_ — dung tham so rong, vi lam vay la keo CA
  // bien moi truong cua may vao, de lo thu khong dinh lo.
  const env = loadEnv(mode, import.meta.dirname, 'VITE_')

  return {
  base,
  plugins: [react(), tailwindcss(), themHeaderBaoMat(env.VITE_SUPABASE_URL ?? '')],
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
  }
})
