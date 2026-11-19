import { supabase } from '@/lib/supabase'
import { nhanThoiGianTenFile } from '@/lib/utils'
import { dichLoi } from '@/lib/loi'
import { cauLoi, type KetQuaMatKhau } from '@/lib/matKhauXoa'

/**
 * Máy chủ từ chối vì mật khẩu xoá sai hoặc đang bị khoá tạm.
 *
 * Tách riêng ra một kiểu lỗi để màn hình biết đường giữ hộp thoại mở
 * cho người dùng gõ lại, thay vì đóng đi rồi hiện một câu báo trôi qua.
 * Dữ liệu chưa bị đụng tới gì khi lỗi này bật ra.
 */
export class LoiMatKhauXoa extends Error {}
import { queryClient } from './chung'

/**
 * SAO LƯU VÀ KHÔI PHỤC DỮ LIỆU
 * ==================================================================
 * Sao lưu  : tải toàn bộ các bảng về máy thành MỘT file JSON.
 * Khôi phục: đọc lại file đó và nạp ngược lên Supabase.
 *
 * ĐIỀU QUAN TRỌNG NHẤT PHẢI BIẾT: file sao lưu chỉ chứa dữ liệu trong
 * các bảng, không chứa file nào khác nằm trong mục Storage của Supabase.
 */

/* ------------------------------------------------------------------ */
/*  Danh sách bảng và thứ tự                                           */
/* ------------------------------------------------------------------ */

/** Khoá chính của từng bảng, dùng khi nạp đè lên dòng cũ. */
const KHOA_CHINH: Record<string, string> = {
  cai_dat: 'khoa',
  nguoi_dung: 'id',
  khach_hang: 'id',
  ho_so_so_do: 'id',
  don_hang: 'id',
  dong_san_pham: 'id',
  thanh_toan: 'id',
  vat_tu: 'id',
  giao_dich_kho: 'id',
  tho_may: 'id',
  nha_cung_cap: 'id',
  tra_nha_cung_cap: 'id',
  chi_phi: 'id',
}

/**
 * THỨ TỰ NẠP — không được đổi.
 *
 * Cơ sở dữ liệu không cho tạo một đơn hàng của ông khách chưa tồn tại.
 * Nên phải nạp khách hàng xong mới tới đơn hàng, nạp đơn hàng xong mới
 * tới dòng sản phẩm và thanh toán. Sai thứ tự là hỏng cả mẻ.
 */
export const THU_TU_NAP = [
  'cai_dat',
  'nguoi_dung',
  'tho_may',
  'nha_cung_cap',
  'khach_hang',
  'ho_so_so_do',
  'vat_tu',
  'don_hang',
  'dong_san_pham',
  'thanh_toan',
  'giao_dich_kho',
  'tra_nha_cung_cap',
  'chi_phi',
] as const

export type TenBang = (typeof THU_TU_NAP)[number]

/** Tên tiếng Việt của từng bảng, để báo cho người dùng dễ hiểu. */
export const NHAN_BANG: Record<TenBang, string> = {
  cai_dat: 'Cài đặt tiệm',
  nguoi_dung: 'Tài khoản nhân sự',
  khach_hang: 'Khách hàng',
  ho_so_so_do: 'Hồ sơ số đo',
  vat_tu: 'Kho vải & phụ liệu',
  don_hang: 'Đơn hàng',
  dong_san_pham: 'Dòng sản phẩm trong đơn',
  thanh_toan: 'Thanh toán',
  giao_dich_kho: 'Xuất nhập kho',
  tho_may: 'Thợ may',
  nha_cung_cap: 'Nhà cung cấp',
  tra_nha_cung_cap: 'Trả nhà cung cấp',
  chi_phi: 'Chi phí chung',
}

/** Bảng chưa chắc đã có (phải chạy file SQL 05 mới sinh ra). */
const BANG_CO_THE_THIEU: TenBang[] = []

/* ------------------------------------------------------------------ */
/*  Sao lưu                                                            */
/* ------------------------------------------------------------------ */

export interface GoiSaoLuu {
  phan_mem: string
  phien_ban_sao_luu: number
  thoi_diem: string
  so_dong: number
  du_lieu: Record<string, unknown[]>
}

/**
 * Tải toàn bộ dữ liệu về máy dưới dạng một file JSON.
 * Ảnh không nằm trong file này — ảnh ở Supabase Storage.
 */
export async function taiBanSaoLuu(): Promise<{ tenFile: string; soDong: number }> {
  const goi = await gomDuLieu()
  const nhan = nhanThoiGianTenFile()
  const tenFile = `sao-luu-may-do-${nhan}.json`
  taiVeMay(tenFile, JSON.stringify(goi, null, 2))
  return { tenFile, soDong: goi.so_dong }
}

/** Gom dữ liệu các bảng lại thành một gói. */
async function gomDuLieu(): Promise<GoiSaoLuu> {
  const du_lieu: Record<string, unknown[]> = {}
  let tong = 0

  for (const bang of THU_TU_NAP) {
    const { data, error } = await supabase.from(bang).select('*')
    if (error) {
      // Bảng chưa tạo thì bỏ qua, không làm hỏng cả bản sao lưu
      if (BANG_CO_THE_THIEU.includes(bang)) continue
      throw error
    }
    du_lieu[bang] = data ?? []
    tong += data?.length ?? 0
  }

  return {
    phan_mem: 'MAY DO QUAN LY PRO',
    phien_ban_sao_luu: 1,
    thoi_diem: new Date().toISOString(),
    so_dong: tong,
    du_lieu,
  }
}

function taiVeMay(tenFile: string, noiDung: string): void {
  const blob = new Blob([noiDung], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = tenFile
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/* ------------------------------------------------------------------ */
/*  Đọc và soi file sao lưu                                            */
/* ------------------------------------------------------------------ */

export interface DongTrongGoi {
  bang: TenBang
  nhan: string
  soDong: number
}

export interface SoiGoi {
  goi: GoiSaoLuu
  thoiDiem: string
  tongDong: number
  cacBang: DongTrongGoi[]
  /** Bảng có trong file nhưng phần mềm không biết là bảng gì. */
  bangLa: string[]
}

/**
 * Đọc file người dùng chọn, kiểm tra xem có đúng là bản sao lưu không,
 * rồi đếm xem trong đó có bao nhiêu dòng mỗi loại.
 */
export async function soiFileSaoLuu(file: File): Promise<SoiGoi> {
  if (file.size > 80 * 1024 * 1024) {
    throw new Error('File lớn hơn 80MB. Đây nhiều khả năng không phải bản sao lưu của phần mềm.')
  }

  let tho: string
  try {
    tho = await file.text()
  } catch {
    throw new Error('Không đọc được file. Bạn thử chọn lại.')
  }

  let goi: GoiSaoLuu
  try {
    goi = JSON.parse(tho) as GoiSaoLuu
  } catch {
    throw new Error(
      'File này không phải bản sao lưu. Bản sao lưu là file .json do chính phần mềm tải về, tên dạng “sao-luu-may-do-....json”.',
    )
  }

  if (!goi || typeof goi !== 'object' || !goi.du_lieu || typeof goi.du_lieu !== 'object') {
    throw new Error('File không đúng dạng bản sao lưu của phần mềm này.')
  }
  if (goi.phan_mem && goi.phan_mem !== 'MAY DO QUAN LY PRO') {
    throw new Error(`Bản sao lưu này của phần mềm khác (“${goi.phan_mem}”), không nạp vào đây được.`)
  }

  const cacBang: DongTrongGoi[] = []
  const bangLa: string[] = []
  let tongDong = 0

  for (const [ten, ds] of Object.entries(goi.du_lieu)) {
    if (!Array.isArray(ds)) continue
    if (!(THU_TU_NAP as readonly string[]).includes(ten)) {
      bangLa.push(ten)
      continue
    }
    const bang = ten as TenBang
    cacBang.push({ bang, nhan: NHAN_BANG[bang], soDong: ds.length })
    tongDong += ds.length
  }

  cacBang.sort((a, b) => THU_TU_NAP.indexOf(a.bang) - THU_TU_NAP.indexOf(b.bang))

  if (tongDong === 0) {
    throw new Error('Bản sao lưu này rỗng, không có dòng dữ liệu nào để nạp.')
  }

  return {
    goi,
    thoiDiem: goi.thoi_diem ?? '',
    tongDong,
    cacBang,
    bangLa,
  }
}

/* ------------------------------------------------------------------ */
/*  Khôi phục                                                          */
/* ------------------------------------------------------------------ */

export interface LuaChonKhoiPhuc {
  /**
   * true  — xoá sạch dữ liệu đang có rồi nạp lại từ file
   * false — giữ nguyên dữ liệu cũ, chỉ nạp thêm; dòng nào trùng mã thì
   *         lấy theo file
   */
  xoaTruoc: boolean
  /**
   * Mật khẩu xoá, chỉ cần khi xoaTruoc = true.
   * MÁY CHỦ kiểm cái này, không phải trình duyệt.
   */
  matKhau?: string
}

export interface TienDo {
  buoc: string
  phanTram: number
}

export interface KetQuaKhoiPhuc {
  daNap: { nhan: string; soDong: number }[]
  boQua: { nhan: string; soDong: number; viSao: string }[]
  canhBao: string[]
  loi: string[]
  soDemDaChinh: boolean
}

const CO_MOT_LAN = 400

/**
 * Nạp dữ liệu từ bản sao lưu lên Supabase.
 *
 * Làm theo đúng thứ tự THU_TU_NAP. Bảng nào lỗi thì ghi lại rồi đi tiếp,
 * để cuối cùng còn báo được cho người dùng biết cái gì vào, cái gì không
 * — thay vì dừng giữa chừng và để lại một mớ nửa vời không ai hiểu.
 */
export async function khoiPhucDuLieu(
  goi: GoiSaoLuu,
  chon: LuaChonKhoiPhuc,
  bao: (t: TienDo) => void,
): Promise<KetQuaKhoiPhuc> {
  const kq: KetQuaKhoiPhuc = {
    daNap: [],
    boQua: [],
    canhBao: [],
    loi: [],
    soDemDaChinh: false,
  }

  const canNap = THU_TU_NAP.filter((b) => Array.isArray(goi.du_lieu[b]) && goi.du_lieu[b].length > 0)
  const tongViec = canNap.length + (chon.xoaTruoc ? 1 : 0) + 1
  let daLam = 0
  const nhich = (viec: string) => {
    daLam += 1
    bao({ buoc: viec, phanTram: Math.round((daLam / tongViec) * 100) })
  }

  /* --- Bước 1: xoá sạch nếu người dùng chọn thay toàn bộ ---
     Việc xoá do MÁY CHỦ làm, qua hàm xoa_sach_du_lieu. Trình duyệt
     không tự xoá từng bảng nữa — làm vậy thì ai bỏ qua ô mật khẩu
     cũng xoá được. Xem supabase/11_khoa_xoa_tren_may_chu.sql. */
  if (chon.xoaTruoc) {
    bao({ buoc: 'Đang dọn dữ liệu cũ…', phanTram: 2 })
    const { data, error } = await supabase.rpc('xoa_sach_du_lieu', {
      mk_xoa: chon.matKhau ?? '',
    })
    if (error) throw error

    const traLoi = (data ?? { ok: false }) as KetQuaMatKhau
    // Sai mật khẩu không phải lỗi, máy chủ trả về ok:false. Dừng hẳn tại
    // đây — tuyệt đối không được nạp chồng lên dữ liệu cũ.
    if (!traLoi.ok) throw new LoiMatKhauXoa(cauLoi(traLoi))

    nhich('Đã dọn dữ liệu cũ')
  }

  /* --- Bước 2: nạp từng bảng --- */
  let idDangCo: Set<string> | null = null

  for (const bang of canNap) {
    const ds = goi.du_lieu[bang] as Record<string, unknown>[]

    let canGui = ds

    /* Tài khoản nhân sự là trường hợp riêng.
       Mỗi dòng ở đây gắn với một tài khoản đăng nhập thật trong Supabase.
       Không thể tạo lại tài khoản đăng nhập từ file sao lưu, nên chỉ cập
       nhật được tên và vai trò của những người HIỆN CÒN đăng nhập được. */
    if (bang === 'nguoi_dung') {
      if (!idDangCo) {
        const { data } = await supabase.from('nguoi_dung').select('id')
        idDangCo = new Set((data ?? []).map((d) => String((d as { id: string }).id)))
      }
      const giu = ds.filter((d) => idDangCo!.has(String(d.id)))
      const bo = ds.length - giu.length
      if (bo > 0) {
        kq.boQua.push({
          nhan: `${NHAN_BANG[bang]} (${bo} người)`,
          soDong: bo,
          viSao:
            'email đăng nhập của những người này không còn trong Supabase. Họ phải tự tạo lại tài khoản ở trang đăng nhập, rồi bạn cấp lại quyền',
        })
      }
      canGui = giu
      if (canGui.length === 0) {
        nhich(`Bỏ qua ${NHAN_BANG[bang]}`)
        continue
      }
    }

    bao({
      buoc: `Đang nạp ${NHAN_BANG[bang]} (${canGui.length} dòng)…`,
      phanTram: Math.round((daLam / tongViec) * 100),
    })

    let daVao = 0
    let hong: string | null = null

    for (let i = 0; i < canGui.length; i += CO_MOT_LAN) {
      const mieng = canGui.slice(i, i + CO_MOT_LAN)
      const { error } = await supabase
        .from(bang)
        .upsert(mieng, { onConflict: KHOA_CHINH[bang], defaultToNull: false })
      if (error) {
        hong = dichLoi(error)
        break
      }
      daVao += mieng.length
    }

    if (hong) {
      if (BANG_CO_THE_THIEU.includes(bang)) {
        kq.boQua.push({
          nhan: NHAN_BANG[bang],
          soDong: canGui.length,
          viSao: 'Supabase chưa có bảng này — chạy file SQL 05 và 07 rồi khôi phục lại',
        })
      } else {
        kq.loi.push(`${NHAN_BANG[bang]}: ${hong}${daVao > 0 ? ` (đã vào được ${daVao} dòng)` : ''}`)
      }
    }

    if (daVao > 0) kq.daNap.push({ nhan: NHAN_BANG[bang], soDong: daVao })
    nhich(`Xong ${NHAN_BANG[bang]}`)
  }

  /* --- Bước 3: chỉnh lại số đếm mã khách, mã đơn, mã phiếu --- */
  bao({ buoc: 'Đang chỉnh lại số đếm mã khách và mã đơn…', phanTram: 96 })
  const { error: loiSoDem } = await supabase.rpc('dong_bo_so_dem')
  if (loiSoDem) {
    kq.canhBao.push(
      'Chưa chỉnh được số đếm mã khách và mã đơn. Hãy chạy file supabase/07_khoi_phuc_du_lieu.sql ' +
        'trong Supabase rồi khôi phục lại — nếu không, khách mới tạo sẽ báo lỗi trùng mã.',
    )
  } else {
    kq.soDemDaChinh = true
  }
  nhich('Xong')

  // Dọn bộ nhớ đệm để mọi màn hình đọc lại dữ liệu mới
  await queryClient.invalidateQueries()

  bao({ buoc: 'Hoàn tất', phanTram: 100 })
  return kq
}
