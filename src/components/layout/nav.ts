import {
  ChartColumn,
  Globe,
  Images,
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
  nhan: string
  icon: ComponentType<{ className?: string }>
  /** Vai trò được phép thấy mục này. Bỏ trống nghĩa là ai cũng thấy. */
  chiDanhCho?: VaiTro[]
}

export interface NhomMenu {
  tieuDe: string
  muc: MucMenu[]
}

export const MENU: NhomMenu[] = [
  {
    tieuDe: 'Tổng quan',
    muc: [{ duongDan: '/', nhan: 'Bảng điều khiển', icon: LayoutDashboard }],
  },
  {
    tieuDe: 'Khách hàng',
    muc: [
      { duongDan: '/khach-hang', nhan: 'Danh sách khách', icon: Users },
      { duongDan: '/so-do', nhan: 'Hồ sơ số đo', icon: Ruler },
      { duongDan: '/don-online', nhan: 'Đơn đặt online', icon: Globe },
    ],
  },
  {
    tieuDe: 'Sản xuất',
    muc: [
      { duongDan: '/don-hang', nhan: 'Đơn hàng', icon: ShoppingBag },
      { duongDan: '/thu-vien-mau', nhan: 'Thư viện mẫu', icon: Images },
      { duongDan: '/kho', nhan: 'Kho vải & phụ liệu', icon: Package },
    ],
  },
  {
    tieuDe: 'Tài chính',
    muc: [
      { duongDan: '/thanh-toan', nhan: 'Thanh toán & công nợ', icon: Wallet },
      {
        duongDan: '/bao-cao',
        nhan: 'Báo cáo doanh thu',
        icon: ChartColumn,
        chiDanhCho: ['quan_tri', 'quan_ly'],
      },
      {
        duongDan: '/nhat-ky',
        nhan: 'Nhật ký hoạt động',
        icon: ScrollText,
        chiDanhCho: ['quan_tri', 'quan_ly'],
      },
    ],
  },
  {
    tieuDe: 'Hệ thống',
    muc: [
      { duongDan: '/in-phieu', nhan: 'In phiếu', icon: Printer },
      { duongDan: '/giao-dien', nhan: 'Giao diện', icon: Palette },
      { duongDan: '/cai-dat', nhan: 'Cài đặt', icon: Settings, chiDanhCho: ['quan_tri'] },
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
