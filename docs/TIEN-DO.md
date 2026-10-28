# Sổ tiến độ EWIT WORK

> Nguồn sự thật duy nhất về tiến độ, dùng chung cho máy cá nhân và cloud.
> Claude cập nhật file này mỗi khi Nery nói **"cần đổi thiết bị"** và khi kết thúc một việc lớn.
> Nhánh bàn giao: **`main`** (WD-09, Nery xác nhận 28/10/2026).

## Đang làm
- **Lịch & Công v2**: B0 chốt yêu cầu ✅ (WD-13→15) · **B1 thiết kế dữ liệu** — bản thảo `docs/lich-cong-v2/thiet-ke-du-lieu.md`, chờ Nery duyệt.

## Việc kế tiếp
1. Nery duyệt B1 (trả lời 2 câu hỏi bên dưới + góp ý các mục [GĐ]).
2. B2: tạo thư mục `30 · Lịch & Công/Hệ mới v2 (thử nghiệm)` và 4 file ⓐⓑⓒⓓ trống (tab, cột, danh sách chọn).
3. B3: nạp danh mục lớp + EF từ ② sang ⓐ để Nery rà.

## Câu hỏi chờ Nery
- Bộ phận nhập liệu có được sửa mọi tab lớp (hỗ trợ khi người phụ trách vắng) không?
- Quyền file ⓓ Thù lao: quản lý riêng trong ⓓ (đề xuất) hay chung bảng quyền ở ⓐ?
- (Không gấp) Lý do gốc WD-01→05; tên miền chính; ba điểm website. GĐ6 xem lại `90 · Lưu trữ`.

## Ghi chú trạng thái ngoài repo
- Drive là dữ liệu sống, dùng chung mọi thiết bị: luôn liệt kê lại trước khi làm.
- Mã Astro, `ewit-nac1`, `ewit-chot-danh-sach.gs` **chưa có trong repo**. 3 script hệ cũ đã có trong `apps-script/he-cu/`.

## Nhật ký phiên (mới nhất ở trên)
| Ngày | Thiết bị | Nhánh | Tóm tắt |
|---|---|---|---|
| 2026-10-28 | Cloud | `claude/sleepy-shannon-xahr78` → `main` | WD-14/15 (nhập bằng Sheets mỗi lớp 1 tab + bảng quyền; thù lao do người phụ trách quyết định); soạn thiết kế dữ liệu B1 |
| 2026-10-28 | Cloud | `claude/sleepy-shannon-xahr78` → `main` | WD-13: làm lại Lịch & Công v2; soạn đề xuất kiến trúc 4 khối + lộ trình B0–B8 |
| 2026-10-28 | Cloud | `claude/sleepy-shannon-xahr78` → `main` | Đánh giá nấc 1 (①②③): thiết kế tốt nhưng chưa từng đồng bộ trên file thật; chưa có tab lớp đang chạy |
| 2026-10-28 | Cloud | `claude/sleepy-shannon-xahr78` → `main` | Đưa 3 Apps Script hệ cũ vào `apps-script/he-cu/`; bắt đầu mảng nấc 1 |
| 2026-10-28 | Cloud | `claude/sleepy-shannon-xahr78` → `main` | Chạy GĐ2–5 làm sạch Drive (10 thư mục `00`–`90`, README trên Drive); ghi WD-10→12 |
| 2026-10-28 | Cloud | `claude/sleepy-shannon-xahr78` → `main` | Tạo nhánh bàn giao `main` (WD-09); tổng hợp lại các quyết định chờ Nery |
| 2026-10-27 | Cloud | `claude/sleepy-shannon-xahr78` | Khởi tạo repo (CLAUDE.md, DECISIONS WD-01→08), bản đồ Drive, kế hoạch làm sạch v2, GĐ1 rà script, dựng cơ chế đổi thiết bị |
