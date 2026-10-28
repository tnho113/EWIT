# ⓓ THÙ LAO · Apps Script

Project gắn vào file **ⓓ THÙ LAO** (file bảo mật). Chỉ đọc ⓒ và ⓐ, không ghi vào hai file đó.

## 1. Dán code (làm một lần)
1. Mở ⓓ THÙ LAO → **Tiện ích mở rộng ▸ Apps Script**.
2. Tạo đủ 6 file `.gs` trùng tên và dán nội dung: `Chung.gs`, `Menu.gs`, `BaoCao.gs`, `BaoCaoLogic.gs`, `ChotKy.gs`, `Quyen.gs`.
3. **Cài đặt dự án** ▸ bật "Hiển thị tệp kê khai appsscript.json", dán nội dung `appsscript.json`.
4. Tải lại ⓓ, menu **E-WIT** xuất hiện. Lần đầu bấm một mục sẽ hiện hộp xin quyền: chọn tài khoản của bạn, **Nâng cao ▸ Cho phép**.
5. Tab `cau_hinh` của ⓓ phải có `DU_LIEU_ID` (ⓒ) và `DANH_MUC_ID` (ⓐ) (đã có sẵn).
6. Menu **E-WIT ▸ Cài đặt chạy tự động** để dữ liệu tự kéo mỗi giờ.

## 2. Dùng hằng tháng
1. **Kéo dữ liệu mới** (nếu cần số liệu mới nhất; bình thường đã tự kéo mỗi giờ).
2. Tab `bao_cao`: chọn **Từ ngày** (B2), **Đến ngày** (E2). Có thể lọc EF (B3), lớp (D3), vai trò (F3) bằng cách chọn trong danh sách.
3. **Lập báo cáo** → bảng EF × level × vai trò × lớp, số buổi, các ngày cụ thể, mức đề xuất (nếu có quy tắc ở tab `quy_tac_muc`).
4. Điền **Thù lao quyết định** và **Ghi chú** (ô màu vàng). Lập lại báo cáo sẽ **giữ nguyên** các ô này nếu dòng vẫn còn.
5. **Chốt kỳ…** khi xong: tạo tab `KY_<từ>_<đến>` (khóa, chỉ người quyền SUA sửa được) và ghi vào `ky_chot`. Còn dòng chưa có thù lao thì máy hỏi "vẫn chốt?".
6. Sau khi chốt, nếu lịch bị sửa, bấm **Kiểm tra điều chỉnh sau chốt**: buổi thêm/bớt hiện ở tab `dieu_chinh` để xử lý ở kỳ sau.

Ghi chú: "nhiều mức" nghĩa là các buổi trong dòng có mức đề xuất khác nhau (hoặc có buổi chưa có quy tắc); thành tiền đề xuất là tổng từng buổi có quy tắc.

## 3. Quyền
Điền tab `quyen` của ⓓ (email, quyen = SUA hoặc XEM, dang_hieu_luc = Có). Email QUAN_TRI trong ⓐ luôn được sửa.
1. **Xem trước quyền**: tab `_xem_truoc_quyen` liệt kê ai sẽ được thêm, hạ, hoặc gỡ.
2. **Áp dụng quyền** (chỉ bấm tay): hỏi xác nhận trước khi gỡ người; không đụng chủ file. Người mới được thêm có thể nhận thư mời từ Google.
Lưu ý: chỉ nhìn thấy người được chia sẻ trực tiếp; chia sẻ theo nhóm hoặc "ai có link" cần kiểm tra tay.

## 4. Bảo mật
Code không ghi số tiền, tên, email vào nhật ký (Logger). Tab `_ky_assignment`, `_xem_truoc_quyen` nằm trong ⓓ nên chỉ người có quyền ⓓ xem được.
