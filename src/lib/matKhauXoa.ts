/**
 * MẬT KHẨU XOÁ TÀI KHOẢN
 * ------------------------------------------------------------------
 * Chủ tiệm tự đặt một mật khẩu riêng, khác mật khẩu đăng nhập. Mỗi lần
 * xoá tài khoản nào đó phải gõ đúng mật khẩu này mới xoá được. Mục đích
 * là chặn tai nạn: bấm nhầm nút, hoặc ai đó ngồi vào máy đang mở sẵn.
 *
 * Mật khẩu KHÔNG được lưu nguyên văn. Phần mềm chỉ lưu "dấu vân tay"
 * của nó (mã băm SHA-256 kèm một chuỗi muối ngẫu nhiên) vào bảng cai_dat.
 * Nhìn vào cơ sở dữ liệu không đọc ngược ra được mật khẩu.
 *
 * NÓI THẲNG CHO RÕ: đây là khoá cửa chống bấm nhầm, không phải két sắt.
 * Người nào vào được trang quản trị Supabase của tiệm thì vẫn xoá được
 * dấu vân tay này rồi đặt mật khẩu khác. Hãy giữ kỹ tài khoản Supabase.
 */

/* ----------------------- SHA-256 viết thuần JavaScript -----------------------
   Không dùng crypto.subtle của trình duyệt, vì hàm đó chỉ chạy khi trang
   mở bằng https hoặc localhost. Tiệm nào chạy phần mềm trong mạng nội bộ
   bằng địa chỉ IP thường sẽ không có nó, và tính năng sẽ chết không rõ lý
   do. Bản viết tay này chạy ở mọi nơi, cho ra cùng một kết quả.
   --------------------------------------------------------------------------- */

const HANG_SO = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
])

function xoayPhai(x: number, n: number): number {
  return ((x >>> n) | (x << (32 - n))) >>> 0
}

function bam256(chuoi: string): string {
  const byte = new TextEncoder().encode(chuoi)
  const dai = byte.length
  const soBit = dai * 8

  const dem = new Uint8Array(((((dai + 8) >> 6) + 1) << 6) as number)
  dem.set(byte)
  dem[dai] = 0x80

  const dv = new DataView(dem.buffer)
  dv.setUint32(dem.length - 8, Math.floor(soBit / 4294967296), false)
  dv.setUint32(dem.length - 4, soBit >>> 0, false)

  const H = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ])
  const w = new Uint32Array(64)

  for (let i = 0; i < dem.length; i += 64) {
    for (let t = 0; t < 16; t++) w[t] = dv.getUint32(i + t * 4, false)
    for (let t = 16; t < 64; t++) {
      const a15 = w[t - 15]
      const a2 = w[t - 2]
      const s0 = (xoayPhai(a15, 7) ^ xoayPhai(a15, 18) ^ (a15 >>> 3)) >>> 0
      const s1 = (xoayPhai(a2, 17) ^ xoayPhai(a2, 19) ^ (a2 >>> 10)) >>> 0
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0
    }

    let a = H[0]
    let b = H[1]
    let c = H[2]
    let d = H[3]
    let e = H[4]
    let f = H[5]
    let g = H[6]
    let h = H[7]

    for (let t = 0; t < 64; t++) {
      const S1 = (xoayPhai(e, 6) ^ xoayPhai(e, 11) ^ xoayPhai(e, 25)) >>> 0
      const ch = ((e & f) ^ (~e & g)) >>> 0
      const t1 = (h + S1 + ch + HANG_SO[t] + w[t]) >>> 0
      const S0 = (xoayPhai(a, 2) ^ xoayPhai(a, 13) ^ xoayPhai(a, 22)) >>> 0
      const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0
      const t2 = (S0 + maj) >>> 0

      h = g
      g = f
      f = e
      e = (d + t1) >>> 0
      d = c
      c = b
      b = a
      a = (t1 + t2) >>> 0
    }

    H[0] = (H[0] + a) >>> 0
    H[1] = (H[1] + b) >>> 0
    H[2] = (H[2] + c) >>> 0
    H[3] = (H[3] + d) >>> 0
    H[4] = (H[4] + e) >>> 0
    H[5] = (H[5] + f) >>> 0
    H[6] = (H[6] + g) >>> 0
    H[7] = (H[7] + h) >>> 0
  }

  let hex = ''
  for (let i = 0; i < 8; i++) hex += H[i].toString(16).padStart(8, '0')
  return hex
}

/* --------------------------- Đóng gói để dùng --------------------------- */

/** Tên hai ô lưu trong bảng cai_dat. */
export const KHOA_MUOI = 'xoa_tk_muoi'
export const KHOA_BAM = 'xoa_tk_bam'

/** Số vòng băm lại. Nhiều vòng thì dò mò mật khẩu chậm hẳn đi. */
const SO_VONG = 1200

function muoiMoi(): string {
  const b = new Uint8Array(16)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(b)
  } else {
    for (let i = 0; i < b.length; i++) b[i] = Math.floor(Math.random() * 256)
  }
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
}

/** Tính dấu vân tay của mật khẩu. Cùng mật khẩu + cùng muối = cùng kết quả. */
export function vanTay(muoi: string, matKhau: string): string {
  let v = bam256(`may-do-xoa-tk:${muoi}:${matKhau}`)
  for (let i = 0; i < SO_VONG; i++) v = bam256(`${muoi}:${v}`)
  return v
}

/** Tạo cặp muối + vân tay để lưu vào cai_dat. */
export function taoVanTay(matKhau: string): { muoi: string; bam: string } {
  const muoi = muoiMoi()
  return { muoi, bam: vanTay(muoi, matKhau) }
}

/** So mật khẩu người dùng gõ với vân tay đã lưu. */
export function dungMatKhau(
  muoi: string | undefined,
  bamDaLuu: string | undefined,
  matKhau: string,
): boolean {
  if (!muoi || !bamDaLuu) return false
  return vanTay(muoi, matKhau) === bamDaLuu
}

/** Mật khẩu mới có đủ chặt không. Chuỗi rỗng nghĩa là đạt. */
export function loiMatKhauMoi(mk: string): string {
  if (mk.length < 6) return 'Mật khẩu xoá phải có ít nhất 6 ký tự.'
  if (mk.length > 72) return 'Mật khẩu xoá quá dài, tối đa 72 ký tự.'
  if (!/\S/.test(mk)) return 'Mật khẩu xoá không được toàn khoảng trắng.'
  return ''
}
