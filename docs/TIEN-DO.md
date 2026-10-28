# Sổ tiến độ EWIT WORK

> Nguồn sự thật duy nhất về tiến độ, dùng chung cho máy cá nhân và cloud.
> Claude cập nhật file này mỗi khi Nery nói **"cần đổi thiết bị"** và khi kết thúc một việc lớn.
> Nhánh bàn giao: **`main`** (WD-09, Nery xác nhận 28/10/2026).

## Đang làm
- **Lịch & Công v2**: B0–B2 ✅ · **B3 ✅** (ⓐ có 60 lớp, 60 EF, 25 bí danh; WD-20) · **B4–B6 đang làm song song** bằng 5 phiên phụ Sonnet theo `apps-script/lich-cong-v2/DAC-TA-CHUNG.md`:
  - A `a-danh-muc/` · B1 `b-nhap-lieu/` (tạo tab lớp) · B2 `b-nhap-lieu/` (đồng bộ) · D `d-thu-lao/` · W `web-lich/`.
  - Dùng chung `_chung/Chung.gs` (đã có test, 4/4 qua).

## Việc kế tiếp
1. Rà code 5 phiên phụ, chạy toàn bộ test, ghép, commit.
2. Viết hướng dẫn Nery dán code từng project (thứ tự: ⓐ → ⓑ → ⓒ không cần code → ⓓ → web).
3. Nery/người quản lý danh mục điền email EF (`email`, `zoom_email`), `phu_trach_email` cho lớp thử (đề xuất G1-K22), level EF.

## Câu hỏi chờ Nery
- (Không gấp) Lý do gốc WD-01→05; tên miền chính; ba điểm website. GĐ6 xem lại `90 · Lưu trữ`.

## Ghi chú trạng thái ngoài repo
- Drive là dữ liệu sống, dùng chung mọi thiết bị: luôn liệt kê lại trước khi làm.
- Mã Astro, `ewit-nac1`, `ewit-chot-danh-sach.gs` **chưa có trong repo**. 3 script hệ cũ đã có trong `apps-script/he-cu/`.

## Nhật ký phiên (mới nhất ở trên)
| Ngày | Thiết bị | Nhánh | Tóm tắt |
|---|---|---|---|
| 2026-10-28 | Cloud | `claude/sleepy-shannon-xahr78` → `main` | WD-20; B3 ghi ⓐ; viết đặc tả chung + Chung.gs; giao 5 phiên phụ Sonnet viết code song song |
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
