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
| `05_dat_may_online.sql` | ~~Trang khách đặt may online~~ — chức năng này đã bỏ | **Không cần chạy nữa** |
| `06_phan_quyen_quan_ly.sql` | Vai trò **Quản lý**, xoá tài khoản Quản trị viên, chặn ký tự lạ trong tên | Có |
| `07_khoi_phuc_du_lieu.sql` | Khôi phục dữ liệu từ file sao lưu | Có |
| `08_nhat_ky.sql` | Nhật ký hoạt động — ai làm gì, lúc nào, bao nhiêu tiền | Có |
| `09_don_dep_sau_khi_bo.sql` | Dọn bảng cũ của đặt may online và ảnh mẫu | Không — **xoá thật, đọc kỹ đầu file** |
| `10_nhat_ky_dang_nhap.sql` | Nhật ký đăng nhập — ai vào, lúc nào, từ IP nào | Có, nếu muốn xem sổ đăng nhập |
| `11_khoa_xoa_tren_may_chu.sql` | Mật khẩu xoá — chuyển việc kiểm xuống máy chủ | **Có** — chưa chạy thì mật khẩu xoá không hoạt động |
| `12_siet_quyen_goi_ham.sql` | Đóng mấy cửa hàm còn hở với người chưa đăng nhập | Nên chạy — chỉ đổi quyền, không đụng dữ liệu |

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

### Mật khẩu xoá

Phải chạy `11_khoa_xoa_tren_may_chu.sql` thì phần này mới hoạt động.

Vào **Cài đặt › Mật khẩu xoá tài khoản** để tự đặt một mật khẩu riêng (khác mật
khẩu đăng nhập). Hai việc sau bắt buộc phải gõ nó:

- Xoá một tài khoản nhân sự
- Khôi phục dữ liệu kiểu **xoá sạch rồi nạp lại**

**MÁY CHỦ KIỂM MẬT KHẨU NÀY, KHÔNG PHẢI TRÌNH DUYỆT.** Đó là khác biệt quan
trọng: trình duyệt không giữ dấu vân tay, không tự phán đúng sai, nên mở công
cụ lập trình của trình duyệt (F12) cũng không lách được.

Gõ sai **năm lần liền** là bị khoá tạm mười lăm phút. Cái đếm dùng chung cho
mọi đường, gõ ở đâu cũng tính.

Phần mềm không lưu mật khẩu nguyên văn, chỉ lưu dấu vân tay băm bằng bcrypt,
và dấu vân tay đó nằm trong bảng `khoa_xoa` mà **không ai đọc được**, kể cả Quản
trị viên. Quên là không ai lấy lại hộ được — lúc đó vào Supabase SQL Editor chạy:

```sql
delete from public.khoa_xoa;
```

rồi vào Cài đặt đặt lại từ đầu.

> **Chạy file 11 xong là mật khẩu cũ hết giá trị.** Cách băm đã đổi, mà băm là
> đường một chiều nên không chuyển được. Vào Cài đặt đặt lại một lần.

### Khoá màn hình khi để không

**Cài đặt › Khoá máy khi để không.** Không đụng chuột gõ phím quá số phút
bạn chọn thì phần mềm che màn hình lại, phải gõ **mật khẩu đăng nhập** mới
làm tiếp. Việc đang làm dở vẫn còn nguyên — khác với đăng xuất hẳn.

Bấm F5 lúc đang khoá cũng không thoát ra được. Quên mật khẩu thì bấm
**"Không phải tôi — đăng xuất"**.

Cài đặt này áp dụng cho **mọi máy trong tiệm**, không riêng máy của chủ.
Không cần chạy SQL gì cho phần này.

### Nuốt phím tắt mở công cụ lập trình

Cùng chỗ ở trên có một ô tích: bật lên thì F12, Ctrl+Shift+I và Ctrl+U
không ăn gì nữa.

> **Nói thẳng:** ô này chặn người tiện tay, không chặn người cố tình. Ai biết
> việc vẫn mở công cụ qua menu của trình duyệt trong ba giây, hoặc bỏ qua
> trình duyệt luôn mà gọi thẳng máy chủ. Mã nguồn phần mềm cũng đang công khai
> trên GitHub. **Thứ thật sự giữ dữ liệu là phân quyền ở máy chủ và mật khẩu
> xoá**, không phải ô này. Bật cho đỡ ngứa mắt thì được, đừng vì có nó mà yên
> tâm hơn.

### Header bảo mật

Phần mềm có sẵn một lớp **Content-Security-Policy** — bản nói cho trình
duyệt biết trang này được phép tải gì và gọi đi đâu. Có nó thì một đoạn mã
lạ chèn được vào trang cũng không chạy được, và không gửi dữ liệu đi đâu
khác được.

Không phải làm gì cả: nó tự sinh ra mỗi lần đóng gói.

**Cho phép dùng những gì:**

| Loại | Được phép |
|---|---|
| Mã lệnh (script) | Chỉ file của chính trang, cộng hai đoạn viết thẳng trong `index.html` |
| Kiểu dáng | Của trang, cộng Google Fonts |
| Gọi đi | Chỉ Supabase của tiệm và `api.country.is` (dò ngôn ngữ) |
| Khung iframe | Cấm hết |

Đặc biệt: `script-src` **không có `unsafe-inline`**. Đây là điểm mấu chốt —
có nó thì CSP gần như vô nghĩa.

#### Chỗ này từng làm trang chết câm, nhớ kỹ

Hai đoạn script viết thẳng trong `index.html` (chống nháy nền, và khôi phục
đường dẫn sau khi `404.html` đẩy về) phải được khai bằng **mã băm**. Mã băm
được tính tự động lúc đóng gói, nên sửa script bao nhiêu lần cũng không lệch.

Nhưng có hai cái bẫy tôi đã dính phải cả hai:

1. **Băm bản nháp giữa chừng thay vì file đã ghi ra.** Đã chuyển sang băm
   đúng file trong `dist/`.
2. **Xuống dòng kiểu Windows.** File trên đĩa dùng CRLF, nhưng trình duyệt
   đổi hết sang LF rồi mới băm. Băm bản CRLF là ra mã băm khác hẳn.

Triệu chứng của cả hai giống hệt nhau và rất khó đoán: **trang ra trắng trơn,
không báo lỗi gì trên màn hình**. Muốn biết có phải lỗi này không thì bấm
`F12` rồi xem thẻ **Console** — sẽ thấy dòng chữ
`Refused to execute inline script`.

Build có sẵn một chốt chặn: nếu không tìm thấy đoạn script nào để băm thì
**hỏng hẳn việc đóng gói** kèm câu giải thích, chứ không lặng lẽ cho ra một
trang chết.

#### Ba thứ GitHub Pages không làm được

GitHub Pages không cho đặt header HTTP thật. Thẻ `<meta>` trong trang làm
được gần hết, trừ ba thứ:

| Thiếu | Để làm gì |
|---|---|
| `frame-ancestors` / `X-Frame-Options` | Cấm web khác nhét trang mình vào khung iframe |
| `Strict-Transport-Security` | Ép dùng https |
| `X-Content-Type-Options` | Cấm trình duyệt tự đoán kiểu file |

Ba thứ này **đã viết sẵn** trong `vercel.json`. Chúng tự động có hiệu lực
nếu sau này bạn:

- Đưa trang lên **Vercel**, hoặc
- Đặt **Cloudflare** đứng trước GitHub Pages (mục “Muốn chặn bot thật sự thì
  cần gì” ở dưới có nói cách làm)

### Bot cào trang web

Trang `/tiệm` ai cũng mở được, nên bot cũng ghé. Phần mềm có sẵn mấy lớp:

**1. Bot thường không lấy được gì.** Toàn bộ trang được vẽ bằng JavaScript
sau khi tải về. Bot kiểu `curl` chỉ nhận được một cái hộp rỗng, không có
một chữ nào, không có số điện thoại. Chỉ bot chạy hẳn một trình duyệt ẩn
mới thấy — loại đó tốn kém hơn nhiều.

**2. File `public/robots.txt`** nói cho bot biết chỗ nào được vào:
- **Mở** cho Google, Bing, Cốc Cốc — để khách tìm ra tiệm
- **Chặn** bot cào nội dung cho AI (GPTBot, ClaudeBot, CCBot…) và bot cào
  hàng loạt (AhrefsBot, SemrushBot…)
- **Chặn** mọi đường dẫn của phần quản lý khỏi kết quả tìm kiếm

> Đây là **tấm biển, không phải cái khoá**. Bot tử tế tự giác làm theo, bot
> xấu bỏ qua. Muốn thêm hoặc bớt bot thì sửa thẳng file đó, có chú thích
> tiếng Việt đầy đủ bên trong.

**3. Nhớ lại thông tin tiệm 6 tiếng.** Khách xem đi xem lại, hay bot quay
lại nhiều lần, đều không gọi Supabase nữa — để không ai đốt hết gói miễn
phí của bạn.

> **Hệ quả cần biết:** sửa thông tin tiệm xong, khách đã ghé trang từ trước
> có thể còn thấy bản cũ tới nửa ngày. Máy của chính bạn thì cập nhật ngay
> sau khi bấm Lưu.

### Cái mồi `robots1.txt`

Trong `robots.txt` có một dòng `Disallow: /robots1.txt`. Dòng đó **cố ý**.

- Bot tử tế đọc thấy "đừng vào" thì tránh ra
- Bot cào và công cụ dò quét thì làm ngược: chúng moi `robots.txt` để xem
  chủ trang đang giấu gì, rồi lao thẳng vào chỗ bị cấm
- Người tò mò mở `robots.txt` cũng thấy và gõ thử

Tức là chỉ đúng ba loại đó mở file `robots1.txt`. Trong đó **không có dữ
liệu gì cả** — chỉ có mấy câu nghịch lý, một lời nhắn gửi bot AI, một
tuyên bố không cho phép thu thập tự động (tiếng Việt và tiếng Anh), và một
lời mời ghé tiệm may đồ.

> **Nói cho rõ: cái này không chặn được ai.** GitHub Pages không có máy chủ
> nên bạn không biết ai đã mở, cũng không làm gì được họ. Nó là một mẩu
> giấy nhét đúng chỗ người tò mò sẽ mò tới, không hơn. Đổi lại nó cũng
> không hại gì: file riêng, không phải chữ ẩn nhét vào trang, nên Google
> không coi là gian lận và không phạt thứ hạng.

**Nếu bạn sửa `robots.txt`:** dòng `Disallow: /robots1.txt` phải nằm **chung
khối `User-agent: *`** với mấy dòng chặn phần quản lý. Tách ra thành hai
khối `User-agent: *` là hỏng — nhiều bộ đọc robots chỉ lấy khối đầu tiên
rồi bỏ qua phần sau, lúc đó mất sạch phần chặn thật.

### Thứ thật sự đưa khách tới tiệm

Nói thật: trang web vẽ bằng JavaScript thì Google lập chỉ mục kém. Với một
tiệm may, thứ đưa khách tới **không phải trang web** mà là **Google Business
Profile** (Hồ sơ Doanh nghiệp trên Google) — miễn phí, tự khai được, hiện lên
Google Maps khi khách gõ "may đo gần đây". Để địa chỉ trang web này vào đó
làm mục giới thiệu.

### Muốn chặn bot thật sự thì cần gì

GitHub Pages **không có máy chủ** — nó chỉ là cái kệ để file. Không chặn được
IP, không giới hạn được số lần gọi, không bắt giải CAPTCHA được.

Muốn chặn thật thì phải có một lớp đứng trước. Cách phổ biến:

1. Mua một tên miền (khoảng 200–300 nghìn một năm)
2. Đưa tên miền đó qua **Cloudflare** (gói miễn phí cũng được)
3. Bật **Bot Fight Mode** trong Cloudflare

Lúc đó Cloudflare đứng chắn ở giữa, chặn được bot thật sự. Không cần sửa
một dòng mã nào cả. Khi nào bạn mua tên miền thì bảo tôi hướng dẫn.

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
| Thẻ **Đăng nhập** báo *không tìm thấy hàm* | Chưa chạy `10_nhat_ky_dang_nhap.sql` |
| Xoá tài khoản báo *không tìm thấy hàm* | Chưa chạy `11_khoa_xoa_tren_may_chu.sql` |
| Cài đặt báo "Chưa đặt" dù đã từng đặt mật khẩu xoá | Đúng như vậy sau khi chạy file 11. Đặt lại một lần |
| "Đã gõ sai quá nhiều lần" | Đợi 15 phút. Muốn mở sớm thì chạy `update public.khoa_xoa set lan_sai = 0, khoa_den = null;` |
| Màn hình cứ bị khoá liên tục | Vào **Cài đặt › Khoá máy khi để không**, chọn mốc lâu hơn hoặc "Không khoá" |
| Khoá màn hình mà quên mật khẩu đăng nhập | Bấm "Không phải tôi — đăng xuất", rồi dùng **Quên mật khẩu** ở màn hình đăng nhập |
| Bật nuốt phím rồi giờ tôi cần xem lỗi | Vào Cài đặt tắt ô đó đi, hoặc mở công cụ qua menu ⋮ của Chrome |
| Không thấy thẻ **Đăng nhập** trong trang Nhật ký | Đang dùng tài khoản Quản lý hoặc Nhân viên. Thẻ này chỉ Quản trị viên thấy |
| Sổ đăng nhập trống trơn | Xem mục *Nhật ký đăng nhập trống* ở cuối tệp này |

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
toán về máy thành một file `.json`.

**Cài đặt › Khôi phục dữ liệu** nạp ngược file đó lên. Hai cách nạp:

| Cách | Làm gì | Cần gì |
|---|---|---|
| **Nạp thêm** | Giữ nguyên dữ liệu đang có, dòng nào trùng mã thì lấy theo file | Chỉ bấm xác nhận |
| **Xoá sạch rồi nạp** | Xoá hết rồi nạp lại đúng như ngày sao lưu | Phải gõ mật khẩu xoá |

Ba điều cần biết:

1. **File sao lưu chỉ chứa dữ liệu trong các bảng**, không chứa file nào nằm
   trong mục Storage của Supabase.
2. **Tài khoản nhân sự không khôi phục được hoàn toàn.** Mỗi tài khoản gắn với
   một email đăng nhập thật trong Supabase, không tạo lại từ file được. Phần mềm
   chỉ cập nhật tên và vai trò của những người **hiện còn đăng nhập được**, và báo
   rõ ai bị bỏ qua.
3. **Phải chạy file 07.** Trong đó có hàm chỉnh lại số đếm mã khách và mã đơn.
   Không chạy thì sau khi khôi phục, khách mới sẽ được cấp mã KH00001 trùng với
   khách cũ và phần mềm báo lỗi trùng mã.


---

## NHẬT KÝ ĐĂNG NHẬP

**Nhật ký › thẻ Đăng nhập** cho biết ai đã vào phần mềm, lúc nào, từ địa chỉ
IP nào, và ai vừa xin đặt lại mật khẩu. **Chỉ Quản trị viên thấy thẻ này.**

Muốn dùng thì chạy `10_nhat_ky_dang_nhap.sql` trên Supabase, giống cách chạy
các file khác ở bước A2.

### Dữ liệu này ở đâu ra

Không phải phần mềm ghi. Trình duyệt **không thể biết địa chỉ IP của chính
máy đang chạy nó** — đó là quy định của trình duyệt, không lách được.

Supabase vốn đã tự ghi sẵn một cuốn sổ đăng nhập ở tầng máy chủ. File 10 mở
đúng một cánh cửa hẹp để phần mềm đọc cuốn sổ đó — chỉ đọc, chỉ Quản trị viên.

Nghĩa là bạn thấy được cả những lần đăng nhập **từ trước tới giờ**, chứ không
phải bắt đầu đếm từ hôm chạy file.

### Ba điều nên biết

1. **Địa chỉ IP cho biết cái mạng, không cho biết con người.** Cả tiệm dùng chung
   một wifi thì mọi người hiện cùng một IP. Dùng 4G thì IP đổi luôn. IP lạ là thứ
   đáng để ý, không phải bằng chứng.
2. **Nhãn "có vẻ vào bằng liên kết quên mật khẩu" là suy đoán.** Phần mềm thấy
   ngay trước lần vào đó có một lần xin đặt lại mật khẩu của cùng người, trong vòng
   một tiếng. Dòng xin đặt lại vẫn hiện riêng để bạn tự đối chiếu.
3. **Sổ này không ghi lần gõ sai mật khẩu.** Máy chủ chỉ ghi những lần vào được.

### Nhật ký đăng nhập trống

Chạy file 10 xong mà sổ vẫn trống trơn, lần lượt thử:

1. **Nới rộng khoảng ngày** ở hai ô *Từ ngày* / *Đến ngày*. Mặc định chỉ lấy 30
   ngày gần nhất.
2. **Đăng xuất rồi đăng nhập lại một lần.** Nếu bạn đã đăng nhập từ lâu và trình
   duyệt vẫn giữ phiên cũ thì không có dòng nào mới.
3. **Chạy lại đoạn cuối file 10** trên SQL Editor của Supabase:

   ```sql
   select
     (select count(*)
        from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public'
         and p.proname in ('nhat_ky_dang_nhap', 'tong_ket_dang_nhap')
     ) as so_ham_da_tao,
     (select count(*) from auth.audit_log_entries)        as so_dong_trong_so,
     (select max(created_at) from auth.audit_log_entries) as lan_gan_nhat;
   ```

   - `so_ham_da_tao` **bằng 0** → file 10 chưa chạy xong. Chạy lại cả file.
   - `so_dong_trong_so` **bằng 0** → cuốn sổ của Supabase chưa có gì.
     Đăng xuất rồi đăng nhập lại một lần, sẽ có dòng đầu tiên.
   - Báo *KHONG THAY bang auth.audit_log_entries* → dự án Supabase này không
     có sổ đăng nhập. Báo lại cho người làm phần mềm.
   - Cả hai số đều đẹp mà màn hình vẫn trống → lỗi nằm ở bộ lọc, xem lại
     bước 1.

### Đừng thử gọi hàm thẳng trong SQL Editor

Nếu bạn chạy:

```sql
select * from public.nhat_ky_dang_nhap();
```

nó sẽ báo **`Chi Quan tri vien moi xem duoc nhat ky dang nhap`**. Đây không
phải lỗi — đó là chốt chặn quyền đang làm đúng việc của nó.

Trong SQL Editor, bạn là **chủ cơ sở dữ liệu**, không phải một tài khoản
đang đăng nhập trong phần mềm. Hàm hỏi "ai đang đăng nhập đây?" thì không
có ai cả, nên nó từ chối. Chính cơ chế này giữ cho Nhân viên và Quản lý
không xem được IP và giờ giấc của người khác.

> ⚠️ **SQL Editor chạy cả file trong MỘT giao dịch.** Một câu lệnh hỏng là
> cuộn ngược toàn bộ file, kể cả những câu đã chạy xong trước đó. Nên
> hễ thấy báo đỏ là coi như **file đó chưa chạy gì cả** — sửa xong phải
> chạy lại từ đầu.

Để xem sổ thật: mở phần mềm, đăng nhập bằng tài khoản Quản trị viên,
vào **Nhật ký › thẻ Đăng nhập**.
