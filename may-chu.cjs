/**
 * Máy chủ nhỏ gọn để mở phần mềm trên máy tiệm.
 *
 * Không dùng thư viện ngoài nên khởi động gần như tức thì, và tự mở luôn
 * cửa sổ phần mềm nên file .bat không phải chờ đợi gì cả.
 *
 *   node may-chu.cjs --kiem-tra   Bản đóng gói còn mới không?
 *                                 thoát 0 = còn mới, 1 = cần đóng gói lại
 *   node may-chu.cjs --mo         Chạy máy chủ rồi tự mở cửa sổ phần mềm.
 *                                 Nếu phần mềm đang chạy sẵn thì chỉ mở
 *                                 thêm cửa sổ, không chạy máy chủ thứ hai.
 *   node may-chu.cjs              Chỉ chạy máy chủ, không mở cửa sổ.
 */
const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const { spawn } = require('node:child_process')

const GOC = __dirname
const THU_MUC = path.join(GOC, 'dist')
const CONG = Number(process.env.MAY_DO_CONG) || 5178
const DIA_CHI = `http://localhost:${CONG}`

const thamSo = process.argv.slice(2)
const TU_MO = thamSo.includes('--mo')

/* ================================================================
   Kiểm tra bản đóng gói còn mới không
   ================================================================ */

/** Thời điểm sửa gần nhất trong một thư mục (tính cả thư mục con). */
function moiNhatTrong(duongDan) {
  let moiNhat = 0
  let dsMuc
  try {
    dsMuc = fs.readdirSync(duongDan, { withFileTypes: true })
  } catch {
    return 0
  }
  for (const muc of dsMuc) {
    const con = path.join(duongDan, muc.name)
    if (muc.isDirectory()) {
      moiNhat = Math.max(moiNhat, moiNhatTrong(con))
    } else {
      try {
        moiNhat = Math.max(moiNhat, fs.statSync(con).mtimeMs)
      } catch {
        /* bỏ qua file đọc không được */
      }
    }
  }
  return moiNhat
}

/** true = cần đóng gói lại. */
function canDongGoiLai() {
  const trangChu = path.join(THU_MUC, 'index.html')
  if (!fs.existsSync(trangChu)) return true

  let lucDongGoi
  try {
    lucDongGoi = fs.statSync(trangChu).mtimeMs
  } catch {
    return true
  }

  let moiNhat = moiNhatTrong(path.join(GOC, 'src'))
  for (const ten of ['index.html', 'vite.config.ts', 'package.json', '.env']) {
    try {
      moiNhat = Math.max(moiNhat, fs.statSync(path.join(GOC, ten)).mtimeMs)
    } catch {
      /* file không có thì thôi */
    }
  }
  // Trừ hao 2 giây cho sai số thời gian ghi file.
  return moiNhat > lucDongGoi + 2000
}

if (thamSo.includes('--kiem-tra')) {
  process.exit(canDongGoiLai() ? 1 : 0)
}

/* ================================================================
   Mở cửa sổ phần mềm
   ================================================================ */

function moCuaSoPhanMem() {
  const PF = process.env.ProgramFiles || 'C:\Program Files'
  const PF86 = process.env['ProgramFiles(x86)'] || 'C:\Program Files (x86)'

  // Ưu tiên chế độ "ứng dụng": cửa sổ riêng, không thanh địa chỉ, không tab.
  const ungVien = [
    path.join(PF, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(PF86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(PF86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    path.join(PF, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
  ]

  for (const trinhDuyet of ungVien) {
    if (!fs.existsSync(trinhDuyet)) continue
    try {
      spawn(trinhDuyet, [`--app=${DIA_CHI}`, '--window-size=1440,900'], {
        detached: true,
        stdio: 'ignore',
      }).unref()
      return
    } catch {
      /* thử trình duyệt kế tiếp */
    }
  }

  // Không có Chrome/Edge thì mở bằng trình duyệt mặc định.
  try {
    spawn('cmd', ['/c', 'start', '""', DIA_CHI], { detached: true, stdio: 'ignore' }).unref()
  } catch {
    console.log(`Hay mo trinh duyet va go: ${DIA_CHI}`)
  }
}

/* ================================================================
   Máy chủ file tĩnh
   ================================================================ */

const KIEU = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
}

if (!fs.existsSync(path.join(THU_MUC, 'index.html'))) {
  console.error('Chua co ban dong goi. Hay chay: npm run build')
  process.exit(1)
}

/** Chặn truy cập ra ngoài thư mục dist. */
function duongDanAnToan(urlPath) {
  let ten
  try {
    ten = decodeURIComponent(urlPath.split('?')[0].split('#')[0])
  } catch {
    return null
  }
  const tuyetDoi = path.join(THU_MUC, path.normalize(ten).replace(/^[\/]+/, ''))
  if (tuyetDoi !== THU_MUC && !tuyetDoi.startsWith(THU_MUC + path.sep)) return null
  return tuyetDoi
}

function guiFile(res, file, statusCode) {
  const duoi = path.extname(file).toLowerCase()
  const laBanDongGoi = /[-.][A-Za-z0-9_-]{8,}\.(js|css)$/.test(path.basename(file))
  res.writeHead(statusCode, {
    'Content-Type': KIEU[duoi] || 'application/octet-stream',
    // File js/css có mã băm trong tên thì không bao giờ đổi -> cho nhớ lâu.
    'Cache-Control': laBanDongGoi ? 'public, max-age=31536000, immutable' : 'no-cache',
  })
  fs.createReadStream(file).pipe(res)
}

const mayChu = http.createServer((req, res) => {
  const trangChu = path.join(THU_MUC, 'index.html')
  const file = duongDanAnToan(req.url || '/')
  if (!file) return guiFile(res, trangChu, 200)

  fs.stat(file, (loi, tt) => {
    if (!loi && tt.isFile()) return guiFile(res, file, 200)
    // Đường dẫn của React Router (ví dụ /bao-cao) -> trả trang chủ.
    return guiFile(res, trangChu, 200)
  })
})

mayChu.on('error', (loi) => {
  if (loi.code === 'EADDRINUSE') {
    // Phần mềm đã chạy sẵn: chỉ cần mở thêm một cửa sổ nữa.
    if (TU_MO) moCuaSoPhanMem()
    process.exit(0)
  }
  console.error(loi.message)
  process.exit(1)
})

mayChu.listen(CONG, '0.0.0.0', () => {
  if (TU_MO) moCuaSoPhanMem()

  const dsIp = Object.values(os.networkInterfaces())
    .flat()
    .filter((c) => c && c.family === 'IPv4' && !c.internal)
    .map((c) => c.address)
    // Bỏ địa chỉ tự sinh khi rớt mạng (169.254.x.x) - không dùng được.
    .filter((ip) => !ip.startsWith('169.254.'))

  console.log('')
  console.log('  MAY DO QUAN LY PRO dang chay')
  console.log('  ------------------------------------------------')
  console.log(`  Tren may nay   : ${DIA_CHI}`)
  for (const ip of dsIp) console.log(`  Dien thoai/wifi: http://${ip}:${CONG}`)
  console.log('  ------------------------------------------------')
  console.log('  DE YEN cua so nay. Dong no la tat phan mem.')
  console.log('')
})
