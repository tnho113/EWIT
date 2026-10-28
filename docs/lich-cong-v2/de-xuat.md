# Lịch & Công v2 · Đề xuất thiết kế (bản thảo để thảo luận)

- Ngày: 28/10/2026 · Trạng thái: **ĐỀ XUẤT — chờ Nery góp ý**. Chưa viết code, chưa tạo file.
- Bối cảnh: WD-13 (làm lại gần như từ đầu; chạy độc lập với hệ cũ). Bộ ①②③ hiện có chỉ dùng làm tham khảo.

## 1. Mục tiêu (lời Nery, 28/10/2026)
1. **Một nơi** để người phụ trách lớp nhập thông tin buổi học.
2. Dữ liệu **tự động** lên **web Lịch** và về **hệ thống tính công**.
3. **Danh sách lớp + danh sách EF** ở **một file riêng**; một người phụ trách thêm mới / đổi trạng thái.
4. Hệ mới chạy trên **trang web và file nhập liệu hoàn toàn riêng**. Ổn mới chuyển cả đội sang; không dùng chung với hệ cũ.

## 2. Kiến trúc đề xuất: 4 khối, dữ liệu đi một chiều

```
 ⓐ DANH MỤC ──────────────┐  (1 người quản lý: lớp, EF, vai trò, trạng thái)
        │ cấp danh sách chọn │
        ▼                    │
 ⓑ NHẬP LIỆU (người phụ trách lớp nhập buổi học)
        │ script đồng bộ     │
        ▼                    ▼
 ⓒ DỮ LIỆU CHUẨN (buổi học, phân công, lịch sử, lỗi) ──► 🌐 WEB LỊCH v2 (chỉ đọc)
        │ ③ tự kéo về
        ▼
 ⓓ CHẤM CÔNG (bảo mật: đơn giá, bảng công, chốt tháng) — chỉ BTC + kế toán
```

| Khối | Là gì | Ai sửa | Khác bộ ①②③ hiện có |
|---|---|---|---|
| ⓐ DANH MỤC | Google Sheet: `lop`, `ef` (nhân sự), `vai_tro`, `trang_thai_buoi`, `bi_danh` | 1 người phụ trách danh mục | **Mới**: tách khỏi ② theo yêu cầu số 3 |
| ⓑ NHẬP LIỆU | Nơi người phụ trách lớp nhập buổi (xem Q1) | Người phụ trách lớp (khóa theo email) | Tương đương ① |
| ⓒ DỮ LIỆU CHUẨN | Google Sheet do script ghi; không ai sửa tay | Script | Tương đương ② nhưng không còn danh mục |
| 🌐 WEB LỊCH v2 | Apps Script web app, URL mới, đọc ⓒ + ⓐ | — | Mới, không đụng web cũ |
| ⓓ CHẤM CÔNG | Google Sheet bảo mật, kéo từ ⓒ | BTC, kế toán | Tương đương ③ |

Nguyên tắc giữ nguyên: mỗi lớp một nguồn; chọn tên từ danh sách; tiền công chỉ ở ⓓ; khóa ổn định (`class_id`, `ef_id`, `session_id`) để lên nấc 2 (PostgreSQL) không phải làm lại.

## 3. Yêu cầu chi tiết — giả định ban đầu (Nery gạch / sửa)
Lấy từ thiết kế ①②③ và hệ cũ; đánh dấu **[GĐ]** = giả định, cần Nery xác nhận.

| # | Yêu cầu | Giả định |
|---|---|---|
| R1 | Thông tin 1 buổi | Ngày, giờ, nội dung PLAN / ACTUAL, trạng thái (bình thường, OFF, REVISION, MIDTERM, FINAL, OFFLINE, NGOẠI KHÓA, CLOSING), ghi chú **[GĐ]** |
| R2 | Vai trò mỗi buổi | Teacher in charge, H.O.E, Small Zoom, Zoom admin, Giám khảo (nhiều người) **[GĐ]** |
| R3 | Vai trò tính công | Teacher in charge, Giám khảo; còn lại không tính **[GĐ]** |
| R4 | Phạm vi lớp | Mọi lớp trong danh mục; lớp Training / Đối tác chỉ cần nếu có người được tính công **[GĐ]** |
| R5 | Web Lịch xem theo | Tuần / tháng; lọc theo EF, lớp, trạng thái (như web cũ) **[GĐ]** |
| R6 | Ai xem web Lịch | Nội bộ, phải đăng nhập Google (khác web cũ đang công khai) **[GĐ]** |
| R7 | Tần suất cập nhật | Web Lịch thấy dữ liệu mới trong ≤ 5 phút; chấm công kéo mỗi giờ **[GĐ]** |
| R8 | Chốt công | Theo tháng; thiếu đơn giá thì không cho chốt; sửa sau chốt ghi vào kỳ sau **[GĐ]** |
| R9 | Cảnh báo | Trùng ngày, sai thứ học, thiếu người, tên lạ, EF đã nghỉ vẫn được xếp **[GĐ]** |

## 4. Lộ trình (mỗi bước Nery duyệt rồi mới làm bước sau)

| Bước | Việc | Claude làm | Nery làm |
|---|---|---|---|
| B0 | Chốt yêu cầu (tài liệu này) | Soạn, sửa theo góp ý | Trả lời Q, gạch/sửa bảng §3 |
| B1 | Thiết kế dữ liệu (cột từng bảng) + luồng | Viết `thiet-ke-du-lieu.md` | Duyệt |
| B2 | Dựng file trống trên Drive | Tạo thư mục `30 · Lịch & Công/Hệ mới v2 (thử nghiệm)`, tạo ⓐⓑⓒⓓ, tab, cột, danh sách chọn qua Sheets API | Kiểm tra quyền chia sẻ |
| B3 | Nạp danh mục ban đầu | Chép `lop` + `nhan_su` từ ② (đã có, chuyển từ hệ cũ) sang ⓐ | Rà, sửa trạng thái |
| B4 | Code đồng bộ ⓑ→ⓒ + kiểm tra lỗi | Viết code trong `apps-script/lich-cong-v2/`, có test chạy ngoài Apps Script | **Dán code** vào Apps Script (hướng dẫn từng bước), chạy thử |
| B5 | Web Lịch v2 | Viết code giao diện (theo `brand`: tím `#3D0A6E`, xanh `#1FAF6E`, Exo 2 / Be Vietnam Pro) | Deploy web app, gửi link thử |
| B6 | Chấm công ⓓ | Code kéo dữ liệu, bảng công, chốt tháng | Nhập đơn giá |
| B7 | Thử nội bộ 1–2 lớp, 2–4 tuần | Theo dõi lỗi, sửa | Mời 1–2 người phụ trách dùng thử |
| B8 | Chuyển đội ngũ | Hướng dẫn sử dụng | Thông báo chuyển |

Cách phối hợp code (đã chọn C — dán mã): Claude viết và commit code vào repo → Nery mở Apps Script, dán theo hướng dẫn kèm từng file → báo kết quả / ảnh chụp lỗi → Claude sửa. Có thể chuyển sang `clasp` sau nếu dán tay nhiều.

## 5. Bộ ①②③ hiện có
Giữ nguyên trong `30 · Lịch & Công/Nấc 1 (hệ mới)` để tham khảo đến khi v2 chạy ổn, sau đó chuyển vào `90 · Lưu trữ`. Không cần dán mã `ewit-nac1` nữa (trừ khi Nery muốn tôi tham khảo logic cũ).
