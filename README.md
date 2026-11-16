# MAY ĐO QUẢN LÝ PRO

Phần mềm quản lý tiệm may đo, chạy trên trình duyệt, dùng được trên máy tính,
máy tính bảng và điện thoại. Dữ liệu lưu thật trên **Supabase**.

> 📖 **Người mới bắt đầu, hãy đọc [`HUONG-DAN-CAI-DAT.md`](./HUONG-DAN-CAI-DAT.md)**
> — hướng dẫn từng bước từ tạo cơ sở dữ liệu đến đưa lên mạng.

---

## Mở phần mềm — bấm đúp biểu tượng ngoài Desktop

Biểu tượng **`May Do Quan Ly Pro`** ngoài màn hình Desktop. Bấm đúp là xong.

Phần mềm hiện ra trong **cửa sổ riêng** (chế độ `--app` của Chrome/Edge):
không thanh địa chỉ, không tab, trông như phần mềm cài sẵn trên máy.
Mất khoảng **0,2 giây** — vì nó phục vụ bản đã đóng gói sẵn qua
`may-chu.cjs` (máy chủ tĩnh ~100 dòng, không thư viện ngoài), chứ không
khởi động máy chủ phát triển của Vite.

Một cửa sổ nền đen **thu nhỏ** dưới thanh tác vụ chính là máy chủ đó —
để yên, đóng nó là tắt phần mềm.

Trong thư mục cha `May May 206` còn có:

| File | Tác dụng |
| --- | --- |
| **`1. MO PHAN MEM.bat`** | Đích của biểu tượng Desktop. Tự kiểm Node.js, tự kiểm `.env`, tự đóng gói lại khi mã nguồn đổi, rồi mở cửa sổ phần mềm |
| **`2. DANG WEB LEN MANG.bat`** | Đưa lên Internet qua Vercel. Không cần GitHub, không cần gõ lệnh git |
| **`3. TAO BIEU TUONG NGOAI MAN HINH.bat`** | Tạo lại biểu tượng Desktop nếu lỡ xóa |

Đọc `May May 206\DOC CAI NAY TRUOC.txt` để biết chi tiết.

Lần đầu cần tạo file `.env` trước — xem Phần B của hướng dẫn cài đặt.
File `1. MO PHAN MEM.bat` sẽ tự mở Notepad nhắc bạn điền nếu còn thiếu.

### Hoặc gõ lệnh như cũ

```powershell
cd "$env:USERPROFILE\Desktop\May May 206\MayDoQuanLyPro"
npm run dev
```

| Lệnh | Tác dụng |
| --- | --- |
| `npm start` | Chạy bản đã đóng gói rồi tự mở cửa sổ phần mềm (giống bấm đúp biểu tượng) |
| `npm run dev` | Chạy thử trên máy, sửa code là trang tự cập nhật |
| `npm run build` | Đóng gói bản chạy thật vào thư mục `dist` |
| `npm run preview` | Xem thử bản đã đóng gói |
| `npm run typecheck` | Kiểm tra lỗi mã nguồn |

---

## Chức năng

| Màn hình | Làm được gì |
| --- | --- |
| **Bảng điều khiển** | Doanh thu tháng, đơn đang may, đơn trễ hẹn, công nợ, vật tư sắp hết |
| **Khách hàng** | Thêm / sửa / xóa, tìm kiếm không dấu, theo dõi chi tiêu và công nợ |
| **Hồ sơ số đo** | 20 chỉ số, lưu **nhiều lần đo** cho mỗi khách, xem lại lịch sử |
| **Đơn hàng** | Nhiều sản phẩm trong một đơn, đổi trạng thái, cảnh báo trễ hẹn |
| **Kho** | Vải và phụ liệu, phiếu nhập / xuất, tồn kho tự tính, cảnh báo hết hàng |
| **Thanh toán** | Tiền cọc, thu nhiều lần, theo dõi công nợ từng đơn |
| **Báo cáo** | Doanh thu theo ngày / tháng / năm, xuất Excel, in báo cáo |
| **In phiếu** | Phiếu số đo, phiếu đơn hàng, phiếu thanh toán — khổ A4 |
| **Nhật ký** | Ai sửa gì, lúc nào, tiền trước và sau. Thêm thẻ **Đăng nhập**: ai vào, lúc nào, từ IP nào (chỉ Quản trị viên). Cả hai đều **tự đánh dấu truy cập lạ** |
| **Giao diện** | Màu chủ đạo, cỡ chữ, bộ góc, hiệu ứng — mỗi người một kiểu riêng |
| **Cài đặt** | Thông tin tiệm, phân quyền nhân sự, sao lưu và khôi phục dữ liệu, mật khẩu xoá (máy chủ kiểm), khoá màn hình, bản lưu tự chụp, khôi phục cài đặt (cần cả tiệm đồng ý) |
| **Trang giới thiệu** | Trang công khai `/tiệm` cho khách xem: mặt hàng, bảng giá, địa chỉ — 7 thứ tiếng |

---

## Nguyên tắc tính toán

Tiền và tồn kho **không lưu sẵn** mà được tính lại từ chứng từ gốc:

- `Còn phải thu = Tổng tiền hàng − Giảm giá − Tổng đã thanh toán`
- `Tồn kho = Tổng nhập − Tổng xuất`

Nhờ vậy số liệu không bao giờ lệch, kể cả khi sửa hoặc xóa chứng từ.

---

## Phân quyền

| | Quản trị viên | Nhân viên |
| --- | :---: | :---: |
| Xem khách, số đo, đơn hàng, kho | ✅ | ✅ |
| Thêm, sửa dữ liệu | ✅ | ✅ |
| **Xóa** dữ liệu | ✅ | ❌ |
| **Báo cáo doanh thu** | ✅ | ❌ |
| **Cài đặt & phân quyền** | ✅ | ❌ |

Chặn ngay trong cơ sở dữ liệu bằng **Row Level Security**, không phải chỉ ẩn nút.

> Người đăng ký tài khoản **đầu tiên** tự động là Quản trị viên.

---

## Cấu trúc thư mục

```
MayDoQuanLyPro/
├── supabase/
│   ├── 01_schema.sql          Bảng, view, hàm, Row Level Security
│   ├── 02_storage.sql         Hai kho ảnh riêng tư
│   ├── 03_du_lieu_mau.sql     Dữ liệu mẫu để thử (không bắt buộc)
│   └── 04_xoa_du_lieu_mau.sql Xóa sạch để bắt đầu dùng thật
├── src/
│   ├── auth/                  Đăng nhập, phiên làm việc
│   ├── components/
│   │   ├── layout/            Thanh bên, thanh trên, bố cục chung
│   │   └── ui/                Nút, thẻ, ô nhập, hộp thoại, thông báo
│   ├── data/                  Lớp đọc ghi Supabase (React Query)
│   ├── lib/                   Kết nối Supabase, dịch lỗi, tiện ích
│   ├── pages/                 Mỗi file là một màn hình
│   └── types/                 Cấu trúc dữ liệu, khớp tên cột Supabase
├── may-chu.cjs                Máy chủ tĩnh để mở phần mềm trên máy tiệm
├── .env                       Khóa Supabase — KHÔNG đưa lên GitHub
├── .env.example               File mẫu để chép thành .env
└── vercel.json                Cấu hình triển khai
```

---

## Công nghệ

React 19 · TypeScript 7 · Tailwind CSS 4 · Vite 8 · React Router 7 ·
TanStack Query 5 · Supabase · Vercel

---

## An toàn

- Phần mềm chỉ dùng **anon key** (khóa công khai). Dữ liệu được bảo vệ bằng
  Row Level Security, không phải bằng việc giấu khóa.
- Nếu lỡ dán `service_role key` vào `.env`, phần mềm **chặn khởi động** và báo lỗi.
- File `.env` đã được `.gitignore` chặn, không lên GitHub.
- Hai kho ảnh để **riêng tư**: phải đăng nhập mới xem được ảnh, mỗi tấm dùng
  đường dẫn có hạn 1 tiếng.
- Sao lưu dữ liệu ra file JSON trong mục **Cài đặt**.
