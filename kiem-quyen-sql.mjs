/**
 * SOÁT QUYỀN GỌI HÀM TRONG CÁC FILE SQL
 * ==================================================================
 * Chạy:  node kiem-quyen-sql.mjs
 *
 * BẮT ĐÚNG MỘT LỖI, nhưng là lỗi dễ mắc và khó thấy:
 *
 *   Trong PostgreSQL, hàm mới tạo thì MẶC ĐỊNH AI CŨNG GỌI ĐƯỢC.
 *   Viết "grant execute ... to authenticated" KHÔNG đóng cửa với
 *   người lạ — nó chỉ mở thêm một cửa nữa. Muốn đóng phải "revoke".
 *
 * Lỗi này đã xảy ra thật: sáu hàm của file 11 để hở cho người chưa
 * đăng nhập gọi vào, phải viết hẳn file 12 để vá. Bộ soát này canh
 * để không lặp lại.
 *
 * Cách soát: mọi hàm có "grant execute" thì phải có "revoke" đi kèm,
 * trừ những cái nằm trong danh sách CO_Y_DE_MO bên dưới.
 */
import fs from 'node:fs'
import path from 'node:path'

const THU_MUC = path.join(import.meta.dirname, 'supabase')

/**
 * Ba hàm cố ý để người lạ gọi được. Lý do đầy đủ nằm trong phần 2 của
 * file 12_siet_quyen_goi_ham.sql — tóm tắt: chúng chỉ trả về `false`
 * nên không hở gì, mà chúng lại được gọi bên trong các quy tắc Row
 * Level Security, chặn đi có thể làm hỏng chỗ khác.
 */
const CO_Y_DE_MO = new Set(['la_quan_tri', 'la_quan_ly', 'da_dang_nhap'])

/** Cắt chú thích để khỏi bắt nhầm ví dụ trong phần giải thích. */
function boChuThich(s) {
  return s
    .split('\n')
    .filter((d) => !d.trimStart().startsWith('--'))
    .join('\n')
}

const grant = new Map() // tên hàm -> file
const revoke = new Set()

for (const f of fs.readdirSync(THU_MUC).sort()) {
  if (!f.endsWith('.sql')) continue
  const ma = boChuThich(fs.readFileSync(path.join(THU_MUC, f), 'utf8'))

  for (const m of ma.matchAll(/grant\s+execute\s+on\s+function\s+public\.(\w+)/gi)) {
    if (!grant.has(m[1])) grant.set(m[1], f)
  }
  for (const m of ma.matchAll(/revoke\s+all\s+on\s+function\s+public\.(\w+)/gi)) {
    revoke.add(m[1])
  }
}

const hong = []
for (const [ten, f] of grant) {
  if (CO_Y_DE_MO.has(ten)) continue
  if (!revoke.has(ten)) hong.push(`${f} :: ${ten}`)
}

const hang = (n, v) => console.log(`   ${String(n).padEnd(44)} ${v}`)

console.log('\n=== HÀM ĐƯỢC CẤP QUYỀN MÀ QUÊN THU HỒI ===')
if (hong.length === 0) {
  hang('Không hàm nào bị hở', 'OK')
} else {
  for (const h of hong) console.log('   HO     ' + h)
  console.log('\n   Thêm một dòng như sau ngay TRƯỚC dòng grant:')
  console.log('      revoke all on function public.<tên hàm>(<tham số>) from public, anon;')
}

console.log('\n=== CỐ Ý ĐỂ NGƯỜI LẠ GỌI ĐƯỢC ===')
for (const t of CO_Y_DE_MO) {
  hang(t, grant.has(t) ? 'có cấp quyền — đúng như dự tính' : 'KHÔNG thấy trong file SQL nào')
}
console.log('   (lý do đầy đủ ở phần 2 của 12_siet_quyen_goi_ham.sql)')

console.log('\n=== TỔNG ===')
hang('Hàm có cấp quyền', grant.size)
hang('Hàm có thu hồi', revoke.size)
hang('Hàm bị hở', hong.length)

process.exit(hong.length > 0 ? 1 : 0)
