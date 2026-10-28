# ⓑ NHẬP LIỆU · Apps Script (nhóm file B1 + B2)

## Dán code vào ⓑ (làm một lần)
1. Mở file ⓑ NHẬP LIỆU → **Tiện ích mở rộng ▸ Apps Script**.
2. Bật **Cài đặt dự án ▸ Hiện tệp kê khai appsscript.json**, rồi dán nội dung `appsscript.json` vào.
3. Tạo từng file `.gs` trùng tên rồi dán nguyên văn nội dung (không đổi tên file, không sửa `Chung.gs`).

| File | Của | Việc |
|---|---|---|
| `Chung.gs` | chung | Hàm dùng chung (copy nguyên văn từ `_chung/`) |
| `Menu.gs` | B1 | Menu E-WIT, cài đặt lần đầu, cập nhật danh mục, `onEdit` |
| `TaoTab.gs` | B1 | Tạo tab lớp, làm mới định dạng |
| `TaoTabLogic.gs` | B1 | Logic thuần (có test) |
| `DongBo.gs` | B2 | Đồng bộ ⓑ → ⓒ, kiểm tra lỗi, trigger |
| `DongBoLogic.gs` | B2 | Logic thuần của đồng bộ |

Tổng 6 file `.gs` + `appsscript.json`.

## Chạy lần đầu
1. Tải lại file ⓑ → xuất hiện menu **E-WIT**.
2. **E-WIT ▸ Cài đặt lần đầu** → Google hỏi quyền, bấm cho phép. Hệ thống tạo tab ẩn `cau_hinh`, `_dm_ef`, `_dm_trang_thai`.
3. **E-WIT ▸ Tạo tab lớp mới…** → gõ mã lớp (chỉ lớp ACTIVE, chưa có tab).
4. Mở file ⓐ → chạy **Áp dụng quyền** để khóa tab mới theo người phụ trách.

## Dùng hằng ngày
- Thêm/đổi EF hoặc trạng thái ở ⓐ → ở ⓑ bấm **Cập nhật danh mục** (dropdown mới có tên).
- Đổi bộ vai trò của lớp ở ⓐ → mở tab lớp, bấm **Làm mới định dạng tab đang mở** (thêm cột mới, không xóa cột cũ).
- Cột **Buổi** và **Thứ** tự điền khi nhập ngày.
- Cột có nhiều người (ví dụ Giám khảo): gõ các tên cách nhau dấu phẩy, ví dụ `Tên A, Tên B`. Google Sheets chưa cho script bật chọn nhiều dạng chip, nên ô này cho phép gõ ghép.

## Lưu ý
- Script không xử lý quyền tab; việc đó do script ở ⓐ.
- Ô Buổi/Thứ có thể bị khóa riêng cho quản trị; khi đó `onEdit` của người khác không ghi được. Chỉnh quyền hoặc chuyển sang công thức nếu gặp.
