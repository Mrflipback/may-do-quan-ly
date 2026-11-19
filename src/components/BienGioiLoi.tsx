import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { ghiLoi } from '@/lib/loi'

/*
 * BIÊN GIỚI LỖI — tấm lưới hứng khi một phần giao diện vỡ.
 *
 * Vì sao cần: React gỡ TOÀN BỘ cây giao diện khi một component ném lỗi.
 * Không có tấm lưới này thì một lỗi nhỏ ở một thẻ trong trang Cài đặt
 * cũng làm trắng cả phần mềm — mất luôn thanh bên, mất việc đang làm dở,
 * và người dùng chỉ biết nhấn F5.
 *
 * Phần mềm dùng hai tầng lưới:
 *   - Tầng ngoài, bọc quanh <App/> trong main.tsx: hứng mọi thứ còn lại.
 *   - Tầng trong, bọc quanh <Outlet/> trong AppLayout: lỗi của MỘT trang
 *     chỉ làm hỏng khung nội dung, thanh bên và menu vẫn còn để người
 *     dùng bấm sang trang khác mà không mất việc.
 *
 * Phải viết bằng class. React chưa có cách bắt lỗi render bằng hook.
 */

type Props = {
  children: ReactNode
  /** Hiện trong thông báo để biết chỗ nào vỡ. */
  boiCanh?: string
  /** Đổi giá trị này thì lưới tự gỡ bỏ lỗi cũ (ví dụ khi chuyển trang). */
  khoaReset?: string
}

type State = {
  loi: Error | null
}

export class BienGioiLoi extends Component<Props, State> {
  state: State = { loi: null }

  static getDerivedStateFromError(loi: Error): State {
    return { loi }
  }

  componentDidCatch(loi: Error, thongTin: ErrorInfo): void {
    ghiLoi(this.props.boiCanh ?? 'Lỗi giao diện', { loi, thongTin })
  }

  componentDidUpdate(propsCu: Props): void {
    // Chuyển sang trang khác thì thử vẽ lại từ đầu.
    if (this.state.loi && propsCu.khoaReset !== this.props.khoaReset) {
      this.setState({ loi: null })
    }
  }

  private thuLai = (): void => {
    this.setState({ loi: null })
  }

  private taiLaiTrang = (): void => {
    window.location.reload()
  }

  render(): ReactNode {
    const { loi } = this.state
    if (!loi) return this.props.children

    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-xl border border-rose-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-rose-700">
            Phần này gặp trục trặc
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            Dữ liệu của bạn vẫn an toàn — lỗi này chỉ nằm ở phần hiển thị.
            Bấm “Thử lại” để vẽ lại màn hình. Nếu vẫn hỏng thì bấm “Tải lại
            phần mềm”.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={this.thuLai}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Thử lại
            </button>
            <button
              type="button"
              onClick={this.taiLaiTrang}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Tải lại phần mềm
            </button>
          </div>

          <details className="mt-4">
            <summary className="cursor-pointer text-xs text-slate-500">
              Chi tiết kỹ thuật (gửi cho người làm phần mềm)
            </summary>
            <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
              {this.props.boiCanh ? `[${this.props.boiCanh}] ` : ''}
              {loi.message || String(loi)}
            </pre>
          </details>
        </div>
      </div>
    )
  }
}
