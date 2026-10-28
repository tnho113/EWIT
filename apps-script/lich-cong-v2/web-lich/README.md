# Web Lịch v2 (Apps Script standalone)

Trang web xem lịch lên lớp: lưới Lớp × Ngày, đọc ⓒ DỮ LIỆU (`buoi_hoc`, `phan_cong`) và ⓐ DANH MỤC (`lop`, `ef`, `vai_tro`, `trang_thai_buoi`). Chỉ đọc, không ghi gì.

## Vì sao "Execute as: User accessing"
Web app chạy bằng **quyền của người đang xem**, nên người xem phải đăng nhập Google và có quyền **XEM** ⓐ và ⓒ (do nút **E-WIT ▸ Áp dụng quyền** cấp từ bảng `quyen`). Chế độ "Execute as: Me" (USER_DEPLOYING) không dùng được: với tài khoản Gmail cá nhân, script không lấy được email người xem, nên không phân biệt được ai được xem. Người chưa có quyền sẽ thấy: "Bạn chưa được cấp quyền xem lịch. Liên hệ người quản lý."

Cache 5 phút theo từng người xem (không dùng cache chung, để người chưa có quyền không đọc được dữ liệu của người khác).

## Cài đặt (Nery làm bằng tay)
1. Vào https://script.google.com → **Dự án mới** (standalone, không gắn vào Sheet). Đặt tên `E-WIT · Web Lịch v2`.
2. Dán các file trong thư mục này (6 file):
   - `Chung.gs`, `Code.gs`, `WebLogic.gs`: **Thêm tệp ▸ Tập lệnh**, cùng tên.
   - `Brand.html`, `Index.html`: **Thêm tệp ▸ HTML**, tên `Brand` và `Index`.
   - `appsscript.json`: **Cài đặt dự án ▸ Hiển thị tệp kê khai "appsscript.json"**, rồi dán nội dung.
3. Kiểm tra hai hằng ở đầu `Code.gs` (`DU_LIEU_ID` = ⓒ, `DANH_MUC_ID` = ⓐ).
4. **Triển khai ▸ Triển khai mới ▸ Ứng dụng web**:
   - Thực thi dưới dạng: **Người dùng truy cập ứng dụng web**
   - Ai có quyền truy cập: **Bất kỳ ai có Tài khoản Google**
   - Cấp quyền khi được hỏi (chỉ đọc Sheets + email).
5. Sao chép URL `/exec`.

## Nhúng vào Google Site mới (không dùng Site cũ)
1. Tạo Google Site mới (sites.google.com). Trang: **Chèn ▸ Nhúng ▸ Theo URL**, dán URL `/exec`.
2. Kéo khung nhúng rộng hết trang, cao tối thiểu 700 px.
3. Người xem phải đăng nhập Google; lần đầu có thể phải bấm cấp quyền. Nếu khung nhúng trắng, mở URL `/exec` trực tiếp ở tab mới một lần để cấp quyền.

## Kiểm tra với 1 tài khoản XEM
1. Đảm bảo tài khoản thử có dòng `XEM` (`dang_hieu_luc = Có`) trong tab `quyen` của ⓐ và đã bấm **Áp dụng quyền**.
2. Mở URL `/exec` bằng tài khoản đó (cửa sổ ẩn danh): thấy lưới tuần này, KPI, lọc EF/lớp/trạng thái/vai trò.
3. Thử một tài khoản **chưa** được cấp quyền: phải thấy thông báo chưa được cấp quyền.
4. Sau khi sửa code: **Triển khai ▸ Quản lý triển khai ▸ Sửa ▸ Phiên bản mới** (giữ nguyên URL).

## Đổi thương hiệu
Màu, font, tiêu đề, slogan, tên người sáng lập (chip viền xanh) chỉ sửa trong `Brand.html`.
