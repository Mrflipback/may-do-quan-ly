/**
 * SOÁT CÚ PHÁP CƠ BẢN CỦA CÁC FILE SQL
 * ==================================================================
 * Chạy:  node kiem-sql.mjs
 *
 * BẮT ĐÚNG MỘT LOẠI LỖI, nhưng là loại chỉ lộ ra khi đã dán vào
 * Supabase và bấm Run — lúc đó mới biết thì mất công.
 *
 * PostgreSQL bọc thân hàm trong cặp dấu đô la: $$ … $$ hoặc $ten$ … $ten$.
 * Mở mà không đóng, hoặc mở bằng $cp$ mà đóng bằng $ham$, là lỗi cú pháp.
 *
 * LỖI NÀY ĐÃ XẢY RA THẬT: tôi viết một đoạn SQL qua lệnh bash dùng dấu
 * nháy KÉP, nên bash thấy $cp$ và $ham$ là tên biến môi trường rồi thay
 * bằng rỗng — "do $cp$" thành "do $". File dán vào Supabase báo
 * "syntax error at or near $". Bộ soát này canh để không lặp lại.
 */
import fs from 'node:fs'
import path from 'node:path'

const THU_MUC = path.join(import.meta.dirname, 'supabase')

/** Bỏ chú thích để không bắt nhầm ví dụ trong phần giải thích. */
function boChuThich(s) {
  return s
    .split('\n')
    .map((d) => (d.trimStart().startsWith('--') ? '' : d))
    .join('\n')
}

const loi = []
let soFile = 0
let soKhoi = 0

for (const f of fs.readdirSync(THU_MUC).sort()) {
  if (!f.endsWith('.sql')) continue
  soFile++
  const ma = boChuThich(fs.readFileSync(path.join(THU_MUC, f), 'utf8'))

  // Dấu đô la lạc loài: một $ không đi kèm $ nào và không có tên hợp lệ
  const dong = ma.split('\n')
  dong.forEach((d, i) => {
    for (const m of d.matchAll(/\$/g)) {
      const truoc = d[m.index - 1] ?? ''
      const sau = d[m.index + 1] ?? ''
      const hopLe = truoc === '$' || sau === '$' || /[a-zA-Z_]/.test(sau) || /[a-zA-Z_]/.test(truoc)
      if (!hopLe) {
        loi.push(`${f}:${i + 1}  dấu $ lạc loài → ${d.trim().slice(0, 60)}`)
        return
      }
    }
  })

  // Mỗi nhãn $ten$ (kể cả $$) phải xuất hiện SỐ CHẴN lần
  const dem = new Map()
  for (const m of ma.matchAll(/\$[a-zA-Z_]*\$/g)) {
    dem.set(m[0], (dem.get(m[0]) ?? 0) + 1)
  }
  for (const [nhan, n] of dem) {
    soKhoi += Math.floor(n / 2)
    if (n % 2 !== 0) {
      loi.push(`${f}  nhãn ${nhan} xuất hiện ${n} lần — phải chẵn, mở rồi phải đóng`)
    }
  }
}

const hang = (n, v) => console.log(`   ${String(n).padEnd(40)} ${v}`)

console.log('\n=== DẤU ĐÔ LA CÓ CÂN ĐỐI KHÔNG ===')
if (loi.length === 0) hang('Mọi khối đều cân đối', 'OK')
else loi.forEach((l) => console.log('   HONG   ' + l))

console.log('\n=== TỔNG ===')
hang('File SQL đã soát', soFile)
hang('Khối $…$ tìm thấy', soKhoi)
hang('Chỗ hỏng', loi.length)

process.exit(loi.length > 0 ? 1 : 0)
