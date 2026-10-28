# Lịch & Công v2 · Hướng dẫn triển khai (dán code)

> Code nằm trong repo: `apps-script/lich-cong-v2/`. Mỗi thư mục con có `README.md` chi tiết.
> Làm **đúng thứ tự** dưới đây. Mỗi bước xong thì chụp màn hình lỗi (nếu có) gửi Claude.

## 0. Chuẩn bị trong ⓐ DANH MỤC (không cần code)
- Tab `quyen`: thêm email các người dùng thử (vai trò `NHAP_LIEU`, `DANH_MUC`, `XEM`).
- Tab `lop`: điền `phu_trach_email` cho lớp thử **G1-K22**.
- Tab `ef`: điền `email`, `zoom_email` cho EF của lớp thử. Tab `ef_level`: gán level.
- Ai cần **xem web Lịch** (kể cả EF) phải có dòng `XEM` (hoặc vai trò khác có quyền xem ⓒ) trong `quyen`.

## 1. ⓐ DANH MỤC — thư mục `a-danh-muc/`
1. Mở ⓐ → **Tiện ích → Apps Script**.
2. Tạo đủ các file theo `a-danh-muc/README.md` (tên file đúng y hệt, dán nội dung, Lưu).
3. Chạy `caiDatDinhDang` → cấp quyền khi Google hỏi.
4. Tải lại ⓐ → menu **E-WIT** xuất hiện.

## 2. ⓑ NHẬP LIỆU — thư mục `b-nhap-lieu/`
1. Mở ⓑ → Tiện ích → Apps Script → tạo file theo `b-nhap-lieu/README.md` (gồm cả `DongBo.gs`, `DongBoLogic.gs`).
2. Chạy `caiDatLanDau` (tạo tab ẩn `cau_hinh`, danh mục ẩn, trigger đồng bộ 5 phút).
3. Tải lại ⓑ → **E-WIT ▸ Tạo tab lớp mới…** → chọn `G1-K22`.
4. Quay lại ⓐ → **E-WIT ▸ Xem trước thay đổi quyền** → đọc tab `_xem_truoc_quyen` → nếu đúng: **Áp dụng quyền** → **Cài đặt chạy tự động**.
5. Nhập thử vài buổi trong tab `G1-K22` → **E-WIT ▸ Đồng bộ ngay** → mở ⓒ xem `buoi_hoc`, `phan_cong`, `kiem_tra`.

## 3. ⓒ DỮ LIỆU CHUẨN
Không cần code. Không ai sửa tay.

## 4. ⓓ THÙ LAO — thư mục `d-thu-lao/`
1. Mở ⓓ → Tiện ích → Apps Script → tạo file theo `d-thu-lao/README.md`.
2. Chạy **E-WIT ▸ Kéo dữ liệu mới** → tab `bao_cao`: điền từ ngày / đến ngày → **Lập báo cáo**.
3. Tab `quyen` của ⓓ: thêm người phụ trách thù lao → **Xem trước quyền** → **Áp dụng quyền** → **Cài đặt chạy tự động**.

## 5. Web Lịch v2 — thư mục `web-lich/`
1. Vào script.google.com → **Dự án mới** (standalone) → tạo file theo `web-lich/README.md`.
2. **Triển khai → Tùy chọn triển khai mới → Ứng dụng web**: Thực thi với tư cách *Người dùng truy cập*; Ai có quyền: *Bất kỳ ai có tài khoản Google*.
3. Mở link bằng tài khoản có quyền XEM để thử. Nhúng vào **Google Site mới** (không dùng Site cũ).

## Đã biết / lưu ý
- Code mới chỉ test phần logic bằng máy (66/66 test đạt), **chưa chạy trên Google thật** → lần dán đầu tiên có thể có lỗi nhỏ; gửi ảnh lỗi để sửa.
- Google có thể **gửi email mời** khi hệ thống chia sẻ file cho người mới (không tắt được nếu không bật Drive API nâng cao).
- Cột "nhiều người" (Giám khảo): Apps Script chưa hỗ trợ chọn nhiều bằng chip → chọn 1 tên từ danh sách hoặc gõ nhiều tên cách dấu phẩy (hệ thống kiểm tra tên lạ khi đồng bộ).
- Buổi và Thứ tự tính bằng công thức, không cần nhập.
