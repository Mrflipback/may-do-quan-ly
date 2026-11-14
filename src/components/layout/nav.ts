import {
  ChartColumn,
  LayoutDashboard,
  Package,
  Printer,
  Ruler,
  ScrollText,
  Palette,
  Settings,
  ShoppingBag,
  Users,
  Wallet,
} from 'lucide-react'
import type { ComponentType } from 'react'
import type { VaiTro } from '@/types'

export interface MucMenu {
  duongDan: string
  /** KHOÁ bản dịch, ví dụ "menu.donHang". Sidebar gọi dich() để ra chữ. */
  nhan: string
  icon: ComponentType<{ className?: string }>
  /** Vai trò được phép thấy mục này. Bỏ trống nghĩa là ai cũng thấy. */
  chiDanhCho?: VaiTro[]
}

export interface NhomMenu {
  /** KHOÁ bản dịch của tên nhóm. */
  tieuDe: string
  muc: MucMenu[]
}

export const MENU: NhomMenu[] = [
  {
    tieuDe: 'menu.nhomTongQuan',
    muc: [{ duongDan: '/', nhan: 'menu.bangDieuKhien', icon: LayoutDashboard }],
  },
  {
    tieuDe: 'menu.nhomKhachHang',
    muc: [
      { duongDan: '/khach-hang', nhan: 'menu.danhSachKhach', icon: Users },
      { duongDan: '/so-do', nhan: 'menu.hoSoSoDo', icon: Ruler },
    ],
  },
  {
    tieuDe: 'menu.nhomSanXuat',
    muc: [
      { duongDan: '/don-hang', nhan: 'menu.donHang', icon: ShoppingBag },
      { duongDan: '/kho', nhan: 'menu.kho', icon: Package },
    ],
  },
  {
    tieuDe: 'menu.nhomTaiChinh',
    muc: [
      { duongDan: '/thanh-toan', nhan: 'menu.thanhToan', icon: Wallet },
      {
        duongDan: '/bao-cao',
        nhan: 'menu.baoCao',
        icon: ChartColumn,
        chiDanhCho: ['quan_tri', 'quan_ly'],
      },
      {
        duongDan: '/nhat-ky',
        nhan: 'menu.nhatKy',
        icon: ScrollText,
        chiDanhCho: ['quan_tri', 'quan_ly'],
      },
    ],
  },
  {
    tieuDe: 'menu.nhomHeThong',
    muc: [
      { duongDan: '/in-phieu', nhan: 'menu.inPhieu', icon: Printer },
      { duongDan: '/giao-dien', nhan: 'menu.giaoDien', icon: Palette },
      { duongDan: '/cai-dat', nhan: 'menu.caiDat', icon: Settings, chiDanhCho: ['quan_tri'] },
    ],
  },
]

/** Lọc menu theo vai trò người đang đăng nhập. */
export function menuTheoVaiTro(vaiTro: VaiTro): NhomMenu[] {
  return MENU.map((nhom) => ({
    ...nhom,
    muc: nhom.muc.filter((m) => !m.chiDanhCho || m.chiDanhCho.includes(vaiTro)),
  })).filter((nhom) => nhom.muc.length > 0)
}
