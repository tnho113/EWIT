# Sổ tiến độ EWIT WORK

> Nguồn sự thật duy nhất về tiến độ, dùng chung cho máy cá nhân và cloud.
> Claude cập nhật file này mỗi khi Nery nói **"cần đổi thiết bị"** và khi kết thúc một việc lớn.
> Nhánh bàn giao: **`main`** (WD-09, Nery xác nhận 28/10/2026).

## Đang làm
- **Lịch & Công v2**: B0 ✅ · B1 ✅ (WD-13→16) · **B2 ✅ dựng khung 4 file** trong `30 · Lịch & Công/Hệ mới v2 (thử nghiệm)` (ID: `docs/drive-move-log.md`).
  - ⓐ có sẵn danh mục nền: 8 level, 5 vai trò, 2 bộ vai trò (CHINH_THUC, TRAINING — WD-18), 9 trạng thái buổi (thêm SELF_TEACHING), quyền QUAN_TRI = Nery. Quyền ⓓ ở tab `quyen` trong ⓓ (WD-17).
  - Chưa có: data validation, khóa tab, menu — sẽ do code (B4) tạo.

## Việc kế tiếp
0. (Đang chạy) Phiên phụ Haiku chuẩn bị CSV cho B3 (chỉ đọc ②) → scratchpad, phiên điều phối rà rồi báo Nery.
1. B3: nạp `lop` + `nhan_su` từ ② (nấc 1) sang ⓐ `lop` / `ef`; Nery rà, điền `phu_trach_email`, level EF.
2. B4: viết code ⓐ (Áp dụng quyền, Tạo tab lớp) + ⓑ→ⓒ (đồng bộ, kiểm tra) trong `apps-script/lich-cong-v2/`; hướng dẫn Nery dán.
3. B5: web Lịch v2.

## Câu hỏi chờ Nery
- Duyệt chạy B3 (nạp danh mục cũ sang ⓐ)?
- `IT` có phải là `Zoom admin` cũ không (gộp)? Lớp chính thức có cần cột `Giám khảo` cho buổi thi không?
- (Không gấp) Lý do gốc WD-01→05; tên miền chính; ba điểm website. GĐ6 xem lại `90 · Lưu trữ`.

## Ghi chú trạng thái ngoài repo
- Drive là dữ liệu sống, dùng chung mọi thiết bị: luôn liệt kê lại trước khi làm.
- Mã Astro, `ewit-nac1`, `ewit-chot-danh-sach.gs` **chưa có trong repo**. 3 script hệ cũ đã có trong `apps-script/he-cu/`.

## Nhật ký phiên (mới nhất ở trên)
| Ngày | Thiết bị | Nhánh | Tóm tắt |
|---|---|---|---|
| 2026-10-28 | Cloud | `claude/sleepy-shannon-xahr78` → `main` | WD-19: mô hình phiên điều phối + phiên phụ; giao phiên phụ Haiku chuẩn bị dữ liệu B3 |
| 2026-10-28 | Cloud | `claude/sleepy-shannon-xahr78` → `main` | WD-18: bộ vai trò CHINH_THUC/TRAINING, thêm IT, Small Zoom từ Zoom report, quy ước màu + Data Validation |
| 2026-10-28 | Cloud | `claude/sleepy-shannon-xahr78` → `main` | WD-17: chuyển quyền ⓓ vào chính ⓓ; thêm màu SELF_TEACHING |
| 2026-10-28 | Cloud | `claude/sleepy-shannon-xahr78` → `main` | WD-16; B2: tạo thư mục + 4 file v2 (ⓐⓑⓒⓓ) với tab, cột, danh mục nền |
| 2026-10-28 | Cloud | `claude/sleepy-shannon-xahr78` → `main` | WD-14/15 (nhập bằng Sheets mỗi lớp 1 tab + bảng quyền; thù lao do người phụ trách quyết định); soạn thiết kế dữ liệu B1 |
| 2026-10-28 | Cloud | `claude/sleepy-shannon-xahr78` → `main` | WD-13: làm lại Lịch & Công v2; soạn đề xuất kiến trúc 4 khối + lộ trình B0–B8 |
| 2026-10-28 | Cloud | `claude/sleepy-shannon-xahr78` → `main` | Đánh giá nấc 1 (①②③): thiết kế tốt nhưng chưa từng đồng bộ trên file thật; chưa có tab lớp đang chạy |
| 2026-10-28 | Cloud | `claude/sleepy-shannon-xahr78` → `main` | Đưa 3 Apps Script hệ cũ vào `apps-script/he-cu/`; bắt đầu mảng nấc 1 |
| 2026-10-28 | Cloud | `claude/sleepy-shannon-xahr78` → `main` | Chạy GĐ2–5 làm sạch Drive (10 thư mục `00`–`90`, README trên Drive); ghi WD-10→12 |
| 2026-10-28 | Cloud | `claude/sleepy-shannon-xahr78` → `main` | Tạo nhánh bàn giao `main` (WD-09); tổng hợp lại các quyết định chờ Nery |
| 2026-10-27 | Cloud | `claude/sleepy-shannon-xahr78` | Khởi tạo repo (CLAUDE.md, DECISIONS WD-01→08), bản đồ Drive, kế hoạch làm sạch v2, GĐ1 rà script, dựng cơ chế đổi thiết bị |
