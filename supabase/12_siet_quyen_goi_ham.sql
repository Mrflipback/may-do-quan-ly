-- =====================================================================
--  MAY ĐO QUẢN LÝ PRO — FILE 12
--  SIẾT QUYỀN GỌI HÀM CHO NGƯỜI CHƯA ĐĂNG NHẬP
-- ---------------------------------------------------------------------
--  CÁCH DÙNG:
--    1. Vào https://supabase.com, mở dự án của bạn
--    2. Bấm "SQL Editor"  ->  "New query"
--    3. Dán TOÀN BỘ file này vào, bấm "Run"
--
--  Chạy sau file 11. Chạy lại nhiều lần cũng không hỏng gì.
--  File này KHÔNG đụng vào dữ liệu, chỉ đổi quyền.
-- ---------------------------------------------------------------------
--  VẤN ĐỀ ĐANG SỬA
--
--  Trong PostgreSQL, hàm mới tạo thì MẶC ĐỊNH AI CŨNG GỌI ĐƯỢC. Viết
--  "grant execute ... to authenticated" KHÔNG hề đóng cửa với người
--  khác — nó chỉ mở thêm một cửa nữa. Muốn đóng thì phải "revoke".
--
--  Mấy file trước có chỗ nhớ revoke, có chỗ quên. Hậu quả: người lạ
--  chưa đăng nhập vẫn GỌI được vài hàm.
--
--  MỨC ĐỘ: không ai khai thác được gì. Mọi hàm nguy hiểm đều có dòng
--  kiểm la_quan_tri() chặn ngay câu lệnh đầu tiên, nên người lạ gọi
--  vào chỉ nhận được câu từ chối. Thứ duy nhất hở ra là hàm
--  co_mat_khau_xoa() — người lạ hỏi được "tiệm này đã đặt mật khẩu
--  xoá chưa" và nhận được câu trả lời. Vô hại, nhưng không có lý do
--  gì để hở.
--
--  File này đóng nốt mấy cửa đó.
-- =====================================================================


-- =====================================================================
--  PHẦN 1. SÁU HÀM CẦN ĐÓNG
-- ---------------------------------------------------------------------
--  Cách viết: revoke trước cho sạch, rồi grant lại đúng một vai trò.
--  Làm theo thứ tự này thì chạy bao nhiêu lần cũng ra cùng kết quả.
-- =====================================================================

-- --- Hỏi xem tiệm đã đặt mật khẩu xoá chưa ---------------------------
revoke all on function public.co_mat_khau_xoa() from public, anon;
grant execute on function public.co_mat_khau_xoa() to authenticated;

-- --- Đặt / đổi mật khẩu xoá ------------------------------------------
revoke all on function public.dat_mat_khau_xoa(text, text) from public, anon;
grant execute on function public.dat_mat_khau_xoa(text, text) to authenticated;

-- --- Gỡ mật khẩu xoá --------------------------------------------------
revoke all on function public.go_mat_khau_xoa(text) from public, anon;
grant execute on function public.go_mat_khau_xoa(text) to authenticated;

-- --- Chỉ kiểm mật khẩu, chưa xoá gì ----------------------------------
revoke all on function public.kiem_mat_khau_xoa(text) from public, anon;
grant execute on function public.kiem_mat_khau_xoa(text) to authenticated;

-- --- Xoá một tài khoản nhân sự ---------------------------------------
revoke all on function public.xoa_tai_khoan(uuid, text) from public, anon;
grant execute on function public.xoa_tai_khoan(uuid, text) to authenticated;

-- --- Xoá sạch dữ liệu nghiệp vụ --------------------------------------
revoke all on function public.xoa_sach_du_lieu(text) from public, anon;
grant execute on function public.xoa_sach_du_lieu(text) to authenticated;


-- =====================================================================
--  PHẦN 2. BA HÀM CỐ Ý ĐỂ NGUYÊN
-- ---------------------------------------------------------------------
--  la_quan_tri(), la_quan_ly(), da_dang_nhap()
--
--  Ba hàm này người lạ vẫn gọi được, và TÔI CỐ Ý KHÔNG ĐÓNG. Hai lý do:
--
--  1. CHÚNG KHÔNG HỞ GÌ CẢ. Người lạ gọi vào chỉ nhận được đúng một
--     chữ: false. Không tên, không dữ liệu, không manh mối. Đóng lại
--     cũng chẳng giấu thêm được gì.
--
--  2. ĐÓNG LẠI CÓ THỂ LÀM HỎNG THỨ KHÁC. Ba hàm này được gọi BÊN TRONG
--     các quy tắc Row Level Security và các quy tắc kho ảnh ở file 01
--     và 02. Quy tắc RLS chạy dưới vai trò của người đang truy vấn.
--     Chặn quyền gọi hàm có thể làm quy tắc báo lỗi thay vì trả về
--     false — tức là đang chặn cho an toàn hơn lại thành chặn nhầm cả
--     người dùng thật.
--
--  Đổi một rủi ro có thật lấy một lợi ích bằng không thì không đáng.
--  Nên để nguyên, và ghi lại đây để sau này ai đọc cũng biết là CÓ
--  CÂN NHẮC, không phải quên.
-- =====================================================================


-- =====================================================================
--  XONG. Đoạn dưới liệt kê MỌI hàm mà người lạ chưa đăng nhập còn gọi
--  được. Nó không gọi hàm nào cả, chỉ đọc danh sách quyền.
--
--  KẾT QUẢ ĐÚNG là ra ĐÚNG BA DÒNG:
--      da_dang_nhap
--      la_quan_ly
--      la_quan_tri
--
--  Ra thêm tên nào khác thì đó là hàm bị hở, báo lại cho người làm
--  phần mềm.
-- =====================================================================
select
  p.proname                                   as ten_ham,
  pg_get_function_identity_arguments(p.oid)   as tham_so
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prorettype <> 'trigger'::regtype
  and has_function_privilege('anon', p.oid, 'EXECUTE')
order by 1;
