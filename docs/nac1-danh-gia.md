# Đánh giá hệ Lịch & Công nấc 1 (①②③) · 28/10/2026

Nguồn đọc (chỉ đọc): ① `HUONG_DAN`, `PME-3A`, `PME-3A (bản gốc)` · ② `README`, `lop`, `cau_hinh`, `kiem_tra`, `buoi_hoc` (2 dòng đầu) · ③ `HUONG_DAN`, `cau_hinh`. **Không đọc** `don_gia`, `du_lieu_cong`, `bang_cong`, `chot_cong` của ③.
Chưa có mã `ewit-nac1` → các nhận định về script là **suy luận** từ hướng dẫn.

## 1. Thiết kế (theo hướng dẫn) — đánh giá: tốt, đúng kiến trúc
- ① mỗi lớp 1 tab, khóa theo email người phụ trách; tên/trạng thái chọn từ danh mục; tô màu cảnh báo (trùng ngày, sai thứ, thiếu người).
- ② schema v1 chuẩn hóa: `lop`, `nhan_su`, `vai_tro`, `trang_thai_buoi`, `team`, `bi_danh` (nhập tay) · `buoi_hoc`, `phan_cong`, `lich_su`, `kiem_tra` (script ghi). Khóa ổn định (`class_id`, `person_id`, `session_id = class_id_yyyymmdd`) → lên nấc 2 (PostgreSQL) gần như 1-1.
- ③ kéo từ ② mỗi giờ; `don_gia` có ngày hiệu lực; chốt tháng + điều chỉnh sau chốt. ② không đọc ③. Đúng nguyên tắc bảo mật.

## 2. Hiện trạng thật (sự thật)
| # | Quan sát | Hệ quả |
|---|---|---|
| 1 | ② `lop` có ~60 lớp, chuyển từ hệ cũ ngày 10/10/2026; **18 lớp ACTIVE** | Dữ liệu nền đã có |
| 2 | Chỉ **PME-3A** có `nguon = Syllabus`, và lớp này đã **COMPLETED** (kết thúc 16/10) | ① chưa có tab nào cho lớp đang chạy → chưa thể chạy song song |
| 3 | `phu_trach_email` trống ở mọi lớp; `NHAP_LIEU_EMAILS` trống | Chức năng khóa tab theo người phụ trách chưa hoạt động |
| 4 | ② `DONG_BO_LAN_CUOI` trống, `kiem_tra` trống; ③ `CAP_NHAT_LAN_CUOI` trống | Đồng bộ ①→② và ③←② **chưa từng chạy trên file thật**; trigger tự động có lẽ chưa cài |
| 5 | Tab `PME-3A (bản gốc)` = syllabus gốc của lớp, có **họ tên ban cán sự học viên**, cột Email/SĐT | ① sẽ chia sẻ cho nhiều người phụ trách → lộ dữ liệu cá nhân học viên |
| 6 | Hướng dẫn nói "web Lịch đọc từ ②", nhưng web Lịch đang chạy (hệ cũ) đọc `Syllabus_schedule` | Web Lịch mới có thể nằm trong `ewit-nac1` (chưa thấy) |

## 3. Đề xuất bước tiếp (theo thứ tự)
1. **Lấy mã `ewit-nac1`** (cách C — dán mã) để kiểm chứng menu, trigger, logic đồng bộ.
2. **Thử trên bản sao** ①②③ (quy tắc Phần C): chạy Đồng bộ & kiểm tra, Tạo tab lớp mới, Khóa quyền, Cập nhật dữ liệu công, Chốt tháng giả. Ghi kết quả.
3. **Chuẩn bị chạy thật, phạm vi nhỏ**: điền `NHAP_LIEU_EMAILS`, `phu_trach_email`; tạo tab cho 1–2 lớp ACTIVE (đề xuất `G1-K22`); đặt `dong_bo_tu_ngay` = ngày bắt đầu song song; cài trigger.
4. **Chạy song song 2–4 tuần** với tiêu chí: `kiem_tra` không còn lỗi đỏ; số buổi và người đảm nhận khớp hệ cũ theo tuần; cuối tháng bảng công ③ khớp `EF-CountingBoard`.
5. **Nhập `don_gia` vào ③** (Nery/kế toán) trước lần chốt đầu tiên.

## 4. Cải tiến đề xuất
- Chuyển `PME-3A (bản gốc)` ra khỏi ① (thành file riêng trong `90 · Lưu trữ`) vì chứa dữ liệu cá nhân học viên.
- Tách rõ phạm vi lớp đi qua ①: lớp chính thức trước; Training / Đối tác Hoàng Minh sau (hoặc giữ nhập tay ở ②).
- Thêm ô ghi chú phiên bản mã (`SCRIPT_VERSION`) vào `cau_hinh` để biết mã nào đang chạy khớp repo.
