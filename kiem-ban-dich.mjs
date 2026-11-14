/**
 * SOÁT BẢN DỊCH
 * ==================================================================
 * Chạy:  node kiem-ban-dich.mjs
 *
 * Làm ba việc:
 *   1. Tìm mọi lời gọi dich('...') / t('...') trong mã, đối chiếu với
 *      en.json. Gõ sai một chữ trong khoá thì màn hình sẽ hiện ra cái
 *      mã khó hiểu thay vì câu chữ — việc này bắt được ngay.
 *   2. So bảy file bản dịch với nhau, chỉ ra thứ tiếng nào còn thiếu câu.
 *   3. Chỉ ra khoá nào đã khai nhưng không còn ai dùng.
 *
 * Khoá ghép động kiểu `soDo.${ma}` thì không soát được, nên được bỏ qua
 * và đếm riêng cho biết.
 */
import fs from 'node:fs'
import path from 'node:path'

const GOC = path.join(import.meta.dirname, 'src')
const THU_MUC_DICH = path.join(GOC, 'i18n', 'ban-dich')

/* ---------------- đọc bản dịch ---------------- */
function phang(o, tien = '') {
  const r = new Set()
  for (const [k, v] of Object.entries(o)) {
    if (v && typeof v === 'object') for (const x of phang(v, `${tien}${k}.`)) r.add(x)
    else r.add(`${tien}${k}`)
  }
  return r
}

const cacBan = {}
for (const f of fs.readdirSync(THU_MUC_DICH)) {
  if (!f.endsWith('.json')) continue
  cacBan[f.replace('.json', '')] = phang(JSON.parse(fs.readFileSync(path.join(THU_MUC_DICH, f), 'utf8')))
}
const goc = cacBan.en
if (!goc) throw new Error('Không thấy en.json')

/* ---------------- quét mã nguồn ---------------- */
function quet(thuMuc, ds = []) {
  for (const t of fs.readdirSync(thuMuc, { withFileTypes: true })) {
    const p = path.join(thuMuc, t.name)
    if (t.isDirectory()) quet(p, ds)
    else if (/\.tsx?$/.test(t.name)) ds.push(p)
  }
  return ds
}

const dungTinh = new Map() // khoá -> số lần dùng
let soDong = 0
const thieu = []

for (const p of quet(GOC)) {
  let ma = fs.readFileSync(p, 'utf8')
  // Bỏ chú thích trước khi quét, không thì ví dụ minh hoạ trong chú thích
  // bị tính là khoá thật và báo thiếu oan.
  ma = ma.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ 	]*\/\/.*$/gm, '')
  // dich('a.b')  hoặc  t('a.b')
  for (const m of ma.matchAll(/\b(?:dich|t)\(\s*'([a-zA-Z0-9_.]+)'/g)) {
    const k = m[1]
    if (!k.includes('.')) continue // không phải khoá bản dịch
    dungTinh.set(k, (dungTinh.get(k) ?? 0) + 1)
    if (!goc.has(k)) thieu.push(`${path.relative(GOC, p)} :: ${k}`)
  }
  // khoá ghép động: dich(`soDo.${ma}`)
  soDong += [...ma.matchAll(/\b(?:dich|t)\(\s*`[^`]*\$\{/g)].length
}

/* ---------------- báo cáo ---------------- */
const hang = (n, v) => console.log(`   ${String(n).padEnd(42)} ${v}`)

console.log('\n=== 1. KHOÁ DÙNG TRONG MÃ NHƯNG KHÔNG CÓ BẢN DỊCH ===')
if (thieu.length === 0) hang('Không thiếu khoá nào', 'OK')
else thieu.forEach((x) => console.log('   THIEU  ' + x))

console.log('\n=== 2. BẢY THỨ TIẾNG CÓ ĐỦ CÂU KHÔNG ===')
for (const [ma, ban] of Object.entries(cacBan)) {
  if (ma === 'en') { hang(`${ma}.json (bản gốc)`, `${ban.size} khoá`); continue }
  const t = [...goc].filter((k) => !ban.has(k) && k !== '_ghiChu')
  hang(`${ma}.json`, `${ban.size} khoá | thiếu ${t.length}${t.length ? ': ' + t.slice(0, 4).join(', ') : ''}`)
}

console.log('\n=== 3. KHOÁ KHAI RỒI NHƯNG KHÔNG AI DÙNG ===')
const thua = [...goc].filter((k) => !dungTinh.has(k) && k !== '_ghiChu')
hang(`${thua.length} khoá`, thua.length ? thua.slice(0, 12).join(', ') + (thua.length > 12 ? '…' : '') : 'không có')
console.log('   (khoá ghép động như `soDo.${ma}` sẽ lọt vào đây, là bình thường)')

console.log('\n=== 4. TỔNG ===')
hang('Khoá bản dịch', goc.size)
hang('Lời gọi dich() tĩnh', [...dungTinh.values()].reduce((a, b) => a + b, 0))
hang('Lời gọi ghép động (không soát được)', soDong)

process.exit(thieu.length > 0 ? 1 : 0)
