# ⓐ DANH MỤC · Apps Script (Lịch & Công v2)

Gắn vào file **ⓐ DANH MỤC**. Việc làm: định dạng + danh sách chọn cho các tab; chia sẻ file ⓐⓑⓒ và khóa tab lớp trong ⓑ theo tab `quyen` và `lop.phu_trach_email`.

## Cách dán code (Nery làm một lần)

1. Mở file ⓐ DANH MỤC ▸ menu **Tiện ích** ▸ **Apps Script**.
2. Xóa nội dung `Code.gs` mặc định (hoặc đổi tên thành `Chung.gs`).
3. Tạo đúng 5 file (cộng appsscript.json) bằng dấu **+** ▸ **Tập lệnh**, đặt tên (không gõ đuôi `.gs`): `Chung`, `Menu`, `DinhDang`, `QuyenLogic`, `Quyen`. Dán nội dung file cùng tên trong thư mục này vào từng file.
4. Bật hiện file manifest: **Cài đặt dự án** (bánh răng) ▸ tick **Hiển thị tệp kê khai "appsscript.json"**. Mở `appsscript.json` ở Trình chỉnh sửa, dán nội dung file `appsscript.json` ở đây.
5. Bấm **Lưu** (Ctrl+S).
6. Chọn hàm **`caiDatDinhDang`** ở thanh trên ▸ **Chạy**. Lần đầu Google hỏi cấp quyền: **Xem lại quyền** ▸ chọn tài khoản ▸ **Nâng cao** ▸ **Đi tới ... (không an toàn)** ▸ **Cho phép**. (Thông báo "chưa xác minh" là bình thường với script tự viết.)
7. Quay lại file ⓐ, tải lại trang: có menu **E-WIT**.

## Kiểm tra sau khi cài

- Tab `lop`: ô `trang_thai` có mũi tên chọn; gõ chữ lạ bị từ chối. Tiêu đề nền tím, chữ trắng; cột chọn nền xanh, cột nhập tay nền kem, `tab_nhap` nền tím xám.
- Di chuột vào ô tiêu đề cột chọn: có ghi chú nguồn danh sách.
- Tab `HUONG_DAN`: cuối bảng có phần **CHÚ THÍCH MÀU**.
- Menu **E-WIT ▸ Xem trước thay đổi quyền**: tạo tab `_xem_truoc_quyen` liệt kê "SẼ THÊM / SẼ GỠ". Chưa đổi gì. Đọc kỹ trước khi bấm tiếp.
- Menu **E-WIT ▸ Áp dụng quyền**: áp dụng thật. Nếu có người sẽ bị gỡ, hộp thoại hỏi xác nhận YES/NO.
- Menu **E-WIT ▸ Cài đặt chạy tự động (mỗi giờ)**: mỗi giờ chỉ **thêm** quyền. Gỡ quyền luôn do bạn bấm tay.
- Kết quả lần áp dụng cuối ghi ở tab `cau_hinh`, khóa `AP_DUNG_QUYEN_LAN_CUOI` (chỉ số liệu, không có email).

## Quy tắc quyền (theo thiết kế dữ liệu §1)

| Vai trò | ⓐ | ⓑ | ⓒ |
|---|---|---|---|
| QUAN_TRI | Sửa | Sửa | Sửa |
| DANH_MUC | Sửa | Xem | Xem |
| NHAP_LIEU | Xem | Sửa (mọi tab lớp) | Xem |
| Phụ trách lớp | Xem | Chỉ sửa tab lớp mình | Không |
| XEM | Xem | Không | Xem |

Một email nhiều vai trò: lấy quyền cao nhất mỗi file. Chỉ xét dòng `quyen.dang_hieu_luc = Có`. Lớp `COMPLETED`: tab khóa, chỉ NHAP_LIEU + QUAN_TRI sửa. Tab tự động (dòng 1–8, cột `buoi_so`, `thu`, cột vai trò nguồn ZOOM_REPORT) chỉ QUAN_TRI sửa. Tab `_MAU`, `_dm_*`, `cau_hinh`, `HUONG_DAN` trong ⓑ chỉ QUAN_TRI sửa.

## Muốn thêm nhóm lớp mới (lop.nhom_lop)

Danh sách nằm ở tab ẩn `_dm_nhom_lop`: **Xem ▸ Các trang tính bị ẩn ▸ _dm_nhom_lop**, thêm một dòng ở cột A, rồi chạy lại **Cài đặt định dạng & danh sách chọn**. Giá trị đang dùng ở `lop` và giá trị thêm tay được giữ lại.

## Giới hạn đã biết

- Người có quyền **xem** file ⓑ xem được **mọi** tab. Khóa chỉ chặn *sửa*. Chủ file luôn sửa được mọi thứ và không bao giờ bị gỡ.
- Người chạy script phải là **chủ hoặc người sửa** của ⓐⓑⓒ. Nên chạy bằng tài khoản chủ file.
- Google **vẫn có thể gửi email thông báo chia sẻ** khi script thêm người (DriveApp không tắt được). Muốn tắt hẳn cần Drive API nâng cao (chưa dùng).
- Khóa tab chỉ gán được cho email có tài khoản Google; email ngoài Google hoặc chưa được chia sẻ file có thể bị từ chối.
- Chạy tự động chỉ thêm: người bị đổi/gỡ phụ trách vẫn giữ quyền cho đến khi bạn bấm tay **Áp dụng quyền**. Tab nào cần gỡ người sẽ được bỏ qua và đếm ở "tab cần chạy tay". Lần đầu tiên chưa có dữ liệu so sánh, tự động sẽ khóa tab như bình thường.
- Mỗi lần chạy tay áp lại khóa mọi tab lớp (xóa và tạo lại protection): với nhiều tab có thể mất 1–3 phút. Giới hạn thời gian của Apps Script là 6 phút/lần.
- Dữ liệu Data Validation áp cho 1000 dòng. Ngày đã nhập dạng chữ (không phải ngày thật) sẽ hiện cảnh báo đỏ ở ô đó, nhưng không bị xóa.
- Cột `bo_vai_tro` dùng trực tiếp cột A của tab `bo_vai_tro` (có thể lặp giá trị; Google tự lược trùng trong ô chọn).
- Script không kiểm tra `ef.team` (chưa có danh sách chốt).
