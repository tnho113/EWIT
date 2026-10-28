# Sổ tiến độ EWIT WORK

> Nguồn sự thật duy nhất về tiến độ, dùng chung cho máy cá nhân và cloud.
> Claude cập nhật file này mỗi khi Nery nói **"cần đổi thiết bị"** và khi kết thúc một việc lớn.
> Nhánh bàn giao: **`main`** (WD-09, Nery xác nhận 28/10/2026).

## Đang làm
- **Làm sạch Drive EWIT-WORK** theo `docs/drive-cleanup-plan.md` (v2, đã duyệt).
  - GĐ0 duyệt ✅ · GĐ1 rà script ✅ (`docs/gd1-ra-soat-script.md`) · GĐ2–5 ⏳ chờ Nery cho chạy.
- Dựng cơ chế làm việc nhiều thiết bị: sổ tiến độ + skill `doi-thiet-bi` ✅; hook mở phiên chờ Nery tự bật (xem `docs/huong-dan-doi-thiet-bi.md`).

## Việc kế tiếp
1. GĐ2: tạo khung thư mục `00`–`90` trong EWIT-WORK + README trong `00 · Điều hành IT`.
2. GĐ3–4: di chuyển theo bảng §4 của kế hoạch (thư mục nấc 1: move, **chưa đổi tên**).
3. GĐ5: kiểm tra web Lịch / Chấm công / Nhập lịch, ①②③; cập nhật `drive-map.md` và cây trong `CLAUDE.md`.

## Câu hỏi chờ Nery
- Chạy GĐ2 → GĐ5 một lượt hay duyệt từng giai đoạn?
- `EstimateSalary` (tiền công ngoài ③): (a) ngoại lệ có thời hạn hay (b) gộp vào ③?
- `ewit-nac1`: script gắn ①②③ có dùng `getFoldersByName` / `getFilesByName` / `getParents` không?
- Web Lịch lên lớp đang mở `ANYONE_ANONYMOUS`: có muốn siết quyền không?

## Ghi chú trạng thái ngoài repo
- Drive là dữ liệu sống, dùng chung mọi thiết bị: luôn liệt kê lại trước khi làm.
- Mã Astro, `ewit-nac1`, `ewit-chot-danh-sach.gs` **chưa có trong repo**.

## Nhật ký phiên (mới nhất ở trên)
| Ngày | Thiết bị | Nhánh | Tóm tắt |
|---|---|---|---|
| 2026-10-28 | Cloud | `claude/sleepy-shannon-xahr78` → `main` | Tạo nhánh bàn giao `main` (WD-09); tổng hợp lại các quyết định chờ Nery |
| 2026-10-27 | Cloud | `claude/sleepy-shannon-xahr78` | Khởi tạo repo (CLAUDE.md, DECISIONS WD-01→08), bản đồ Drive, kế hoạch làm sạch v2, GĐ1 rà script, dựng cơ chế đổi thiết bị |
