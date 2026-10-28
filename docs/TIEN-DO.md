# Sổ tiến độ EWIT WORK

> Nguồn sự thật duy nhất về tiến độ, dùng chung cho máy cá nhân và cloud.
> Claude cập nhật file này mỗi khi Nery nói **"cần đổi thiết bị"** và khi kết thúc một việc lớn.
> Nhánh bàn giao: **`main`** (WD-09, Nery xác nhận 28/10/2026).

## Đang làm
- **Nấc 1 · Lịch & Công**: đưa mã vào repo.
  - ✅ 3 Apps Script hệ cũ → `apps-script/he-cu/` (28/10/2026).
  - ⏳ `ewit-nac1` (script gắn trong ①②③): không đọc được qua Drive connector, chờ Nery chọn cách đưa vào (clasp hoặc dán mã).
- ✅ Làm sạch Drive (GĐ1–5) · ✅ Nery đã kiểm tra web app + ①②③ và tạo lối tắt ChatGPT-Exam Room trong `40 · Thi`.

## Việc kế tiếp
1. Đưa `ewit-nac1` vào `apps-script/ewit-nac1/`.
2. Rà `ewit-nac1` đối chiếu kiến trúc ①→②←③ và tab hiện có (② có `raw_lop`, `raw_ef`, `raw_log`; ① có tab `PME-3A (bản gốc)`).
3. Lập kế hoạch chạy song song hệ cũ ↔ nấc 1 (2–4 tuần): tiêu chí so khớp, ai nhập, khi nào chốt.

## Câu hỏi chờ Nery
- Cách đưa `ewit-nac1` vào repo: clasp (cloud hoặc máy) hay dán mã?
- Tab `PME-3A (bản gốc)` trong ①: giữ hay bỏ, tab nào là bản chính?
- (Không gấp) Lý do gốc WD-01→05; tên miền chính; ba điểm website. GĐ6 xem lại `90 · Lưu trữ` sau 2–4 tuần.

## Ghi chú trạng thái ngoài repo
- Drive là dữ liệu sống, dùng chung mọi thiết bị: luôn liệt kê lại trước khi làm.
- Mã Astro, `ewit-nac1`, `ewit-chot-danh-sach.gs` **chưa có trong repo**. 3 script hệ cũ đã có trong `apps-script/he-cu/`.

## Nhật ký phiên (mới nhất ở trên)
| Ngày | Thiết bị | Nhánh | Tóm tắt |
|---|---|---|---|
| 2026-10-28 | Cloud | `claude/sleepy-shannon-xahr78` → `main` | Đưa 3 Apps Script hệ cũ vào `apps-script/he-cu/`; bắt đầu mảng nấc 1 |
| 2026-10-28 | Cloud | `claude/sleepy-shannon-xahr78` → `main` | Chạy GĐ2–5 làm sạch Drive (10 thư mục `00`–`90`, README trên Drive); ghi WD-10→12 |
| 2026-10-28 | Cloud | `claude/sleepy-shannon-xahr78` → `main` | Tạo nhánh bàn giao `main` (WD-09); tổng hợp lại các quyết định chờ Nery |
| 2026-10-27 | Cloud | `claude/sleepy-shannon-xahr78` | Khởi tạo repo (CLAUDE.md, DECISIONS WD-01→08), bản đồ Drive, kế hoạch làm sạch v2, GĐ1 rà script, dựng cơ chế đổi thiết bị |
