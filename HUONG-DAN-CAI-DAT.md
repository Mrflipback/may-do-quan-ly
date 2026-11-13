# HƯỚNG DẪN CÀI ĐẶT — MAY ĐO QUẢN LÝ PRO

Tài liệu này viết cho người **chưa biết lập trình**. Làm đúng từng bước là chạy được.

Tổng thời gian: khoảng **30 phút**.

---

## MỤC LỤC

- [Phần A — Tạo cơ sở dữ liệu Supabase](#phần-a--tạo-cơ-sở-dữ-liệu-supabase) (15 phút)
- [Phần B — Nối phần mềm với Supabase](#phần-b--nối-phần-mềm-với-supabase) (5 phút)
- [Phần C — Kiểm thử lưu dữ liệu](#phần-c--kiểm-thử-lưu-dữ-liệu) (5 phút)
- [Phần D — Đưa lên mạng bằng Vercel](#phần-d--đưa-lên-mạng-bằng-vercel) (10 phút)
- [Phần E — Gặp lỗi thì xử lý sao](#phần-e--gặp-lỗi-thì-xử-lý-sao)

---

## PHẦN A — TẠO CƠ SỞ DỮ LIỆU SUPABASE

Supabase là nơi lưu dữ liệu của tiệm. Gói miễn phí đủ dùng cho một tiệm may.

### A1. Đăng ký

1. Mở <https://supabase.com>
2. Bấm **Start your project** → đăng nhập bằng Google hoặc GitHub
3. Bấm **New project**

Điền:

| Ô | Điền gì |
| --- | --- |
| Name | `may-do-quan-ly` |
| Database Password | Bấm **Generate a password**, rồi **CHÉP RA GIẤY HOẶC FILE** |
| Region | **Southeast Asia (Singapore)** — gần Việt Nam nhất, chạy nhanh |

> ⚠️ **Mật khẩu Database phải cất kỹ.** Mất là không lấy lại được, phải tạo dự án mới.

4. Bấm **Create new project**, đợi khoảng 2 phút cho Supabase dựng xong.

### A2. Tạo các bảng dữ liệu

1. Ở menu bên trái, bấm biểu tượng **SQL Editor**
2. Bấm **New query**
3. Mở file `supabase/01_schema.sql` trong thư mục phần mềm bằng Notepad
4. Bấm `Ctrl + A` rồi `Ctrl + C` để chép toàn bộ
5. Dán vào ô SQL trên Supabase, bấm nút **Run** (hoặc `Ctrl + Enter`)
6. Đợi vài giây, thấy chữ **Success. No rows returned** màu xanh là xong

Làm **y hệt** với những file sau, theo đúng thứ tự:

| File | Làm gì | Bắt buộc? |
|---|---|---|
| `01_schema.sql` | Tạo toàn bộ bảng dữ liệu | Có |
| `02_storage.sql` | Tạo kho ảnh | Có |
| `03_du_lieu_mau.sql` | Thêm khách hàng, đơn hàng mẫu để thử | Không |
| `04_xoa_du_lieu_mau.sql` | Xóa dữ liệu mẫu đi | Không |
| `05_dat_may_online.sql` | Bật trang khách đặt may online | Có, nếu muốn nhận đơn online |
| `06_phan_quyen_quan_ly.sql` | Vai trò **Quản lý**, xoá tài khoản Quản trị viên, chặn ký tự lạ trong tên | Có |
| `07_khoi_phuc_du_lieu.sql` | Khôi phục dữ liệu từ file sao lưu | Có |
| `08_nhat_ky.sql` | Nhật ký hoạt động — ai làm gì, lúc nào, bao nhiêu tiền | Có |

> ⚠️ **File 06 là bắt buộc nếu bạn muốn:**
> · cấp vai trò **Quản lý** cho ai đó,
> · xoá được tài khoản **Quản trị viên**, hoặc xoá tài khoản của chính mình.
> Chưa chạy file này thì phần mềm vẫn chạy bình thường, nhưng chọn “Quản lý” sẽ
> báo lỗi và nút xoá tài khoản Quản trị viên sẽ không ăn.

### Ba vai trò trong phần mềm

| Vai trò | Xem & nhập liệu | Xoá dữ liệu | Báo cáo doanh thu | Tài khoản & cài đặt |
|---|---|---|---|---|
| Quản trị viên | Có | Có | Có | Có |
| Quản lý | Có | Có | Có | Không |
| Nhân viên | Có | Không | Không | Không |

Người đăng ký đầu tiên tự động là Quản trị viên. Phần mềm **luôn giữ lại ít nhất
một Quản trị viên** — không xoá và không hạ quyền người cuối cùng được, để tiệm
không bao giờ bị khoá ngoài cửa.

### Mật khẩu xoá tài khoản

Vào **Cài đặt › Mật khẩu xoá tài khoản** để tự đặt một mật khẩu riêng (khác mật
khẩu đăng nhập). Từ đó muốn xoá tài khoản nào cũng phải gõ mật khẩu này.
Phần mềm không lưu mật khẩu nguyên văn, chỉ lưu dấu vân tay của nó — nên quên là
không ai lấy lại hộ được. Lúc đó vào Supabase, bảng `cai_dat`, xoá hai dòng
`xoa_tk_muoi` và `xoa_tk_bam` để đặt lại từ đầu.

### Giao diện riêng cho từng người

Mục **Giao diện** trên thanh menu cho phép mỗi người tự chọn nền sáng/tối, màu chủ
đạo (6 màu), cỡ chữ, bo góc, kiểu hiệu ứng chuyển động và tốc độ — hoặc **tắt hẳn
hiệu ứng** cho máy yếu. Lựa chọn lưu trên từng máy, không ảnh hưởng người khác.
Không cần chạy SQL gì cho phần này.

### A3. Lấy 2 khóa kết nối

1. Bấm **Project Settings** (bánh răng ở góc dưới bên trái)
2. Vào mục **Data API** → chép dòng **Project URL**
   (dạng `https://abcdefgh.supabase.co`)
3. Vào mục **API Keys** → chép khóa **anon** / **publishable**
   (chuỗi rất dài bắt đầu bằng `eyJ...`)

> 🚨 **CẢNH BÁO AN TOÀN**
> Trong trang đó còn có khóa tên **`service_role`** hoặc **`secret`**.
> **TUYỆT ĐỐI KHÔNG** dùng khóa đó. Khóa đó bỏ qua mọi lớp bảo vệ, ai có được
> nó là đọc và xóa sạch dữ liệu tiệm bạn. Phần mềm đã cài sẵn chốt chặn, nếu
> bạn dán nhầm nó sẽ báo lỗi và không chạy.

---

## PHẦN B — NỐI PHẦN MỀM VỚI SUPABASE

### B1. Tạo file `.env`

1. Mở thư mục `MayDoQuanLyPro`
2. Tìm file **`.env.example`**, bấm chuột phải → **Copy**, rồi **Paste** ngay trong thư mục đó
3. Đổi tên bản vừa dán thành đúng **`.env`** (chấm env, không có đuôi gì khác)
4. Mở `.env` bằng Notepad và điền 2 giá trị vừa chép ở bước A3:

```
VITE_SUPABASE_URL=https://abcdefgh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Lưu ý: **không có dấu cách**, **không có dấu nháy** quanh giá trị.

> 💡 Nếu Windows không cho đặt tên bắt đầu bằng dấu chấm: mở Notepad, dán nội
> dung, bấm **File → Save As**, chọn **Save as type: All Files**, gõ tên file là
> `.env` rồi lưu vào thư mục `MayDoQuanLyPro`.

### B2. Chạy phần mềm

**Cách nhanh (khuyên dùng):** bấm đúp biểu tượng **`May Do Quan Ly Pro`**
ngoài màn hình Desktop. Phần mềm mở ra trong cửa sổ riêng sau khoảng 0,2 giây.

Chưa có biểu tượng thì bấm đúp **`3. TAO BIEU TUONG NGOAI MAN HINH.bat`**
trong thư mục `May May 206` một lần để tạo. Hoặc bấm đúp thẳng
**`1. MO PHAN MEM.bat`** cũng được.

Lần đầu tiên trên một máy mới, phần mềm tự tải thư viện và tự đóng gói một
lần — đợi 1–3 phút, có cửa sổ báo tiến độ. Những lần sau ra ngay lập tức.

> 💡 Một cửa sổ nền đen **thu nhỏ** dưới thanh tác vụ chính là máy chủ.
> Để yên nó. Đóng cửa sổ phần mềm thì máy chủ vẫn chạy ngầm nên lần sau mở
> lại ra tức khắc; đóng cửa sổ nền đen mới là tắt hẳn phần mềm.

**Cách cho thợ lập trình — gõ lệnh:** mở PowerShell và gõ:

```powershell
cd "$env:USERPROFILE\Desktop\May May 206\MayDoQuanLyPro"
npm run dev
```

Trình duyệt tự mở <http://localhost:5173> (cách bấm đúp dùng cổng 5178).

- Thấy **màn hình đăng nhập** → đã nối thành công ✅
- Thấy **màn hình "Chưa kết nối cơ sở dữ liệu"** → file `.env` chưa đúng, xem lại B1

> ⚠️ Mỗi lần sửa file `.env` đều **phải tắt rồi bật lại** phần mềm: đóng cửa
> sổ nền đen, rồi bấm đúp biểu tượng lần nữa. Phần mềm chỉ đọc file `.env`
> lúc khởi động.

### B3. Tạo tài khoản chủ tiệm

1. Ở trang đăng nhập, bấm **Tạo tài khoản mới**
2. Điền họ tên, email, mật khẩu (ít nhất 6 ký tự)
3. Bấm **Tạo tài khoản**

> 🔑 **Người đăng ký ĐẦU TIÊN tự động là Quản trị viên.** Hãy tự tay làm bước
> này trước khi đưa phần mềm cho nhân viên dùng.

Nếu Supabase báo phải xác nhận email: mở hộp thư, bấm vào liên kết trong email,
rồi quay lại đăng nhập.

<details>
<summary>Muốn bỏ bước xác nhận email cho nhanh (bấm để xem)</summary>

Trên Supabase: **Authentication → Sign In / Providers → Email** → tắt
**Confirm email** → **Save**. Chỉ nên tắt khi dùng nội bộ trong tiệm.
</details>

---

## PHẦN C — KIỂM THỬ LƯU DỮ LIỆU

Làm đủ 8 bước này để chắc chắn dữ liệu lưu **thật** chứ không chỉ hiện trên màn hình.

| # | Việc làm | Kết quả đúng |
| --- | --- | --- |
| 1 | Vào **Khách hàng** → **Thêm khách hàng** → điền tên và số điện thoại → **Lưu** | Hiện thông báo xanh "Đã thêm khách hàng … (mã KH00001)" |
| 2 | Bấm **F5** để tải lại trang | Khách vẫn còn → **dữ liệu đã lưu thật** |
| 3 | Vào **Hồ sơ số đo** → chọn khách đó → nhập vài chỉ số → **Lưu số đo** | Lần đo hiện ở cột trái |
| 4 | Vào **Đơn hàng** → **Tạo đơn hàng** → chọn khách, thêm 1 sản phẩm có giá → **Tạo đơn hàng** | Đơn hiện trong danh sách, cột "Còn phải thu" bằng đúng thành tiền |
| 5 | Bấm **Thu tiền** trên đơn đó → nhập một nửa số tiền → **Ghi nhận** | "Còn phải thu" tự giảm đúng một nửa |
| 6 | Vào **Kho** → **Thêm vật tư** → rồi bấm nút **Nhập** (mũi tên lên) nhập 10 mét | Tồn kho hiện 10 |
| 7 | Thử bấm nút **Xuất** và nhập 999 mét | Hiện lỗi đỏ "Kho chỉ còn 10 mét…" → **chốt chặn hoạt động** |
| 8 | Vào **Cài đặt** → **Tải bản sao lưu** | Máy tải về file `sao-luu-may-do-….json` |

**Kiểm tra lần cuối — dữ liệu có thật trong Supabase không:**

Vào Supabase → **Table Editor** → chọn bảng `khach_hang`.
Thấy đúng khách bạn vừa thêm → **xong, dữ liệu nằm trên máy chủ thật**.

### Thử phân quyền

1. Đăng xuất, tạo thêm một tài khoản thứ hai (đây sẽ là **Nhân viên**)
2. Đăng nhập bằng tài khoản đó
3. Kiểm tra: menu **không có** "Báo cáo doanh thu" và "Cài đặt"; các nút **Xóa** biến mất
4. Thử gõ thẳng đường dẫn `/bao-cao` vào thanh địa chỉ (bấm đúp: `localhost:5178/bao-cao`, `npm run dev`: `localhost:5173/bao-cao`) → hiện trang "Chỉ dành cho Quản trị viên"

> Đây không phải chỉ ẩn nút cho đẹp. Chặn nằm ngay trong cơ sở dữ liệu: dù có
> dùng công cụ khác gọi thẳng vào Supabase, tài khoản Nhân viên vẫn bị từ chối.

---

## PHẦN D — ĐƯA LÊN MẠNG BẰNG VERCEL

Sau bước này, bạn mở phần mềm được từ **bất kỳ máy tính hay điện thoại nào** có mạng.

### D0. Cách nhanh — bấm đúp một file là xong ⭐

Ra thư mục `May May 206`, bấm đúp vào **`2. DANG WEB LEN MANG.bat`** rồi làm
theo chữ hiện trên màn hình. Mất khoảng 3 phút.

File này tự làm thay bạn toàn bộ D1 và D2:

- **Không cần GitHub**, không cần `git init`, `git add`, `git commit`, `git push`
- **Không phải tự khai báo** `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`
  trên trang Vercel — hai khóa trong file `.env` được nhúng sẵn vào bản đóng gói
- Chỉ cần **một tài khoản Vercel miễn phí** (đăng ký bằng email cũng được, tại
  <https://vercel.com/signup>)

Chạy xong, màn hình hiện địa chỉ web của tiệm, dạng
`https://maydoquanlypro.vercel.app`.

> ⚠️ Vẫn phải làm **D3** bên dưới một lần duy nhất, nếu không thì chức năng
> "quên mật khẩu" và "xác nhận email" sẽ không dùng được.

**Những lần sửa phần mềm về sau:** bấm đúp lại đúng file đó, web tự cập nhật
vào đúng địa chỉ cũ. Không phải làm gì thêm.

---

<details>
<summary><b>Cách cũ qua GitHub (bấm để xem — chỉ dùng nếu bạn muốn lưu mã nguồn trên GitHub)</b></summary>

### D1. Đưa mã nguồn lên GitHub

1. Tạo tài khoản tại <https://github.com> (miễn phí)
2. Bấm dấu **+** góc trên bên phải → **New repository**
   - Repository name: `may-do-quan-ly-pro`
   - Chọn **Private** (riêng tư — nên chọn cái này)
   - **Không** tích thêm README hay .gitignore
   - Bấm **Create repository**
3. Về PowerShell, chạy lần lượt:

```powershell
cd "$env:USERPROFILE\Desktop\May May 206\MayDoQuanLyPro"
git init
git add .
git commit -m "May Do Quan Ly Pro - ban dau"
git branch -M main
git remote add origin https://github.com/TEN-CUA-BAN/may-do-quan-ly-pro.git
git push -u origin main
```

Thay `TEN-CUA-BAN` bằng tên tài khoản GitHub của bạn.

Lần đầu `git push` sẽ hiện cửa sổ đăng nhập GitHub — đăng nhập là xong.

> ✅ File `.env` **không** bị đưa lên GitHub. File `.gitignore` đã chặn sẵn.
> Khóa của bạn vẫn an toàn.

### D2. Triển khai trên Vercel

1. Mở <https://vercel.com> → **Sign Up** → chọn **Continue with GitHub**
2. Bấm **Add New…** → **Project**
3. Tìm kho `may-do-quan-ly-pro` → bấm **Import**
4. Vercel tự nhận ra đây là dự án Vite, **không cần đổi** Build Command hay Output Directory
5. Mở mục **Environment Variables**, thêm đúng 2 biến:

| Name | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | dán Project URL (giống file `.env`) |
| `VITE_SUPABASE_ANON_KEY` | dán anon key (giống file `.env`) |

6. Bấm **Deploy**, đợi khoảng 1 phút

Xong! Bạn nhận được địa chỉ dạng `https://may-do-quan-ly-pro.vercel.app`.

</details>

---

### D3. Cho Supabase biết địa chỉ mới  ← **bắt buộc làm, cả 2 cách đều cần**

Nếu không làm bước này, chức năng **đặt lại mật khẩu** và **xác nhận email** sẽ
trỏ về `localhost` và không dùng được.

Trên Supabase: **Authentication → URL Configuration**

- **Site URL**: `https://may-do-quan-ly-pro.vercel.app`
- **Redirect URLs**: thêm `https://may-do-quan-ly-pro.vercel.app/**`

Bấm **Save**.

### D4. Dùng trên điện thoại

Mở địa chỉ Vercel bằng Chrome hoặc Safari trên điện thoại.
Bấm menu trình duyệt → **Thêm vào màn hình chính** để có biểu tượng như một ứng dụng.

### Mỗi lần sửa phần mềm về sau

Dùng cách D0: bấm đúp lại `2. DANG WEB LEN MANG.bat`.

Nếu bạn đã đi theo cách GitHub thì gõ:

```powershell
git add .
git commit -m "mo ta thay doi"
git push
```

Vercel tự động cập nhật trang web sau khoảng 1 phút. Không phải làm gì thêm.

---

## PHẦN E — GẶP LỖI THÌ XỬ LÝ SAO

| Hiện tượng | Nguyên nhân & cách sửa |
| --- | --- |
| Bấm đúp biểu tượng mà không thấy gì | Lần đầu phải đóng gói một lần, đợi 1–3 phút (có cửa sổ báo tiến độ) |
| Bảng báo "May tinh chua cai Node.js" | Trang tải tự mở, tải bản **LTS**, cài xong bấm đúp lại |
| `npm không được nhận dạng` | Đóng hẳn PowerShell, mở cửa sổ mới |
| Màn hình "Chưa kết nối cơ sở dữ liệu" | File `.env` sai tên hoặc sai nội dung. Sửa xong phải **đóng cửa sổ nền đen rồi bấm đúp biểu tượng lại** |
| "Chưa tạo bảng trong Supabase" | Chưa chạy file `01_schema.sql`, quay lại bước A2 |
| "Chưa tạo kho ảnh" | Chưa chạy file `02_storage.sql` |
| "Sai email hoặc mật khẩu" | Gõ lại, hoặc bấm **Quên mật khẩu** |
| "Email chưa được xác nhận" | Mở hộp thư bấm liên kết, hoặc tắt Confirm email (xem B3) |
| "Tài khoản của bạn không có quyền…" | Đang dùng tài khoản Nhân viên. Đăng nhập bằng tài khoản Quản trị viên, vào **Cài đặt** nâng quyền |
| "Không kết nối được tới máy chủ" | Mất mạng, hoặc `VITE_SUPABASE_URL` sai |
| Trang trắng sau khi đưa lên Vercel | Nếu đi theo cách D1–D2 (GitHub): quên điền Environment Variables, thêm vào rồi vào tab **Deployments** bấm **Redeploy**. Cách D0 không gặp lỗi này |
| Sửa code xong mở ra vẫn thấy bản cũ | Không cần làm gì — lần mở kế tiếp phần mềm tự đóng gói lại, đợi 1–3 phút |
| Ảnh không hiện | Chưa chạy `02_storage.sql`, hoặc chưa đăng nhập |

### Khi cần xem lỗi chi tiết

Bấm `F12` trên trình duyệt → chọn thẻ **Console**. Lỗi gốc hiện ở đó, có thể
chụp màn hình gửi cho người hỗ trợ.

---

## GHI NHỚ VỀ AN TOÀN

1. **Không bao giờ** đưa file `.env` cho ai, không đăng lên mạng.
2. **Không bao giờ** dùng khóa `service_role` trong phần mềm này.
3. Mỗi nhân viên dùng **một tài khoản riêng**, không dùng chung.
4. **Sao lưu mỗi tháng**: vào **Cài đặt → Tải bản sao lưu**, cất file vào USB hoặc Google Drive.
5. Mật khẩu Database của Supabase cất riêng, không lưu chung máy.


### Sao lưu và khôi phục dữ liệu

**Cài đặt › Sao lưu dữ liệu** tải toàn bộ khách hàng, số đo, đơn hàng, kho, thanh
toán và đơn đặt online về máy thành một file `.json`.

**Cài đặt › Khôi phục dữ liệu** nạp ngược file đó lên. Hai cách nạp:

| Cách | Làm gì | Cần gì |
|---|---|---|
| **Nạp thêm** | Giữ nguyên dữ liệu đang có, dòng nào trùng mã thì lấy theo file | Chỉ bấm xác nhận |
| **Xoá sạch rồi nạp** | Xoá hết rồi nạp lại đúng như ngày sao lưu | Phải gõ mật khẩu xoá |

Ba điều cần biết:

1. **File sao lưu không chứa ảnh.** Ảnh nằm trong mục Storage của Supabase. Khôi
   phục xong, dữ liệu về đủ nhưng ảnh nào đã mất khỏi kho thì ô ảnh sẽ trống.
2. **Tài khoản nhân sự không khôi phục được hoàn toàn.** Mỗi tài khoản gắn với
   một email đăng nhập thật trong Supabase, không tạo lại từ file được. Phần mềm
   chỉ cập nhật tên và vai trò của những người **hiện còn đăng nhập được**, và báo
   rõ ai bị bỏ qua.
3. **Phải chạy file 07.** Trong đó có hàm chỉnh lại số đếm mã khách và mã đơn.
   Không chạy thì sau khi khôi phục, khách mới sẽ được cấp mã KH00001 trùng với
   khách cũ và phần mềm báo lỗi trùng mã.
