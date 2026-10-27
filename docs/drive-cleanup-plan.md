# Kế hoạch làm sạch thư mục EWIT-WORK

- Trạng thái: **ĐỀ XUẤT — chờ Nery duyệt**. Chưa di chuyển, đổi tên hay xóa gì.
- Ngày: 27/10/2026 · Dữ liệu nền: `docs/drive-map.md`.

## 1. Hiện trạng (sự thật từ khảo sát)

| Vấn đề | Chi tiết |
|---|---|
| Gốc lẫn lộn | 5 thư mục + 4 lối tắt nằm ngang hàng, không thứ tự, không phân biệt việc đang chạy / lưu trữ / cá nhân |
| Lẫn nội dung ngoài công việc IT | `Thay gân đổi cốt` (sức khỏe), `Wisdom Three` (đích chứa cả file tài chính cá nhân), `iME01-Group 6` (bài tập học viên) |
| Hệ cũ và hệ mới nằm rải rác | Điểm danh cũ ở `Quản trị Zoom/RollCall Form` (22 sheet); nấc 1 ở thư mục riêng; phòng thi ở 3 nơi: `Exam Room/K21`, `ChatGPT Connector/ChatGPT-Exam Room/K21`, `I-MENTOR E-WIT` (bộ 01–10 IMEW01) |
| Trùng tên chưa rõ bản chính | `K21` (Exam Room của Nery) và `K21` (ChatGPT-Exam Room); tab `PME-3A` và `PME-3A (bản gốc)` ở ①; hai file `QUẢN TRỊ VÀ ĐIỀU PHỐI PHÒNG ZOOM` |
| Thiếu chỉ dẫn | Không có README / mục lục; tên file trộn Anh–Việt, có/không dấu, đánh số không đồng nhất |
| Quyền truy cập | EWIT-WORK, thư mục nấc 1, ③ và RollCall Form **đều chỉ Nery có quyền** → di chuyển trong cây hiện **không mở rộng quyền** cho ai |

## 2. Nguyên tắc an toàn

1. **Move, không copy.** Di chuyển giữ nguyên ID file → link, `openById`, Form liên kết, script gắn sheet không bị ảnh hưởng.
2. **Chỉ di chuyển mục Nery sở hữu** và nằm trong EWIT-WORK. Mục người khác sở hữu (đích lối tắt) giữ nguyên chỗ; chỉ sắp xếp lối tắt.
3. **Không xóa.** Mục không dùng → `90 · Lưu trữ`. Xóa (nếu có) là bước riêng, Nery xác nhận từng mục.
4. **Không ghi vào đích lối tắt** (ChatGPT Connector, Zoom bản gốc…), kể cả khi có quyền sửa.
5. **Kiểm tra trước khi move:** script tìm file theo *tên* hoặc *thư mục cha* (`getFoldersByName`, `getParents`) có thể gãy. Rà các script liên quan trước giai đoạn 2.
6. **Giữ ③ bảo mật:** thư mục chứa ③ không bao giờ được chia sẻ rộng hơn BTC + kế toán. Nếu sau này chia sẻ thư mục cha, phải tắt thừa kế quyền (`inheritedPermissionsDisabled`) cho thư mục ③ trước.
7. Mỗi giai đoạn xong → cập nhật `drive-map.md`, commit, báo Nery rồi mới sang giai đoạn sau.

## 3. Cấu trúc đích đề xuất

Quy ước tên thư mục: `NN · Tên tiếng Việt có dấu`. Số hàng chục chừa chỗ chèn sau.

```
EWIT-WORK/
├── 00 · Đọc trước                  README (mục lục, quy ước, liên hệ), bản xuất drive-map
├── 10 · Thương hiệu                Brand Guide, giọng văn, FAQ, hồ sơ đội ngũ          (mới, đang trống)
├── 20 · Website                    Đề xuất website, nội dung, ảnh                        (mới, đang trống)
├── 30 · Lịch & Công (nấc 1)        ① ② ③ — giữ nguyên thư mục hiện có, chỉ đổi tên
├── 40 · Thi                        
│   ├── Grade 1 · K21                ← Exam Room/K21 (5 sheet)
│   ├── Hướng dẫn                    ← EXAM ROOM — PROJECT INSTRUCTIONS
│   └── (lối tắt) ChatGPT-Exam Room  tham chiếu K22, K[xx]-Template
├── 50 · Zoom & Điểm danh
│   ├── (lối tắt) QUẢN TRỊ VÀ ĐIỀU PHỐI PHÒNG ZOOM — BẢN GỐC
│   └── Bản sao Nery (không dùng làm nguồn)
├── 80 · Tham chiếu (lối tắt)        ChatGPT Connector · I-MENTOR E-WIT · E-WiT ENLISH IN MIND
├── 90 · Lưu trữ
│   └── Điểm danh cũ · RollCall Form 2025–26   ← RollCall Form (22 sheet)
└── 95 · Ngoài phạm vi IT  (tạm, chờ Nery chọn chuyển ra ngoài)
    ├── Thay gân đổi cốt
    ├── iME01-Group 6
    └── (lối tắt) Wisdom Three
```

## 4. Bảng ánh xạ (hiện tại → đích)

| # | Mục hiện tại | Chủ sở hữu | Hành động | Đích | Cần Nery quyết |
|---|---|---|---|---|---|
| 1 | `EWIT · Hệ thống Lịch & Công (nấc 1)` | Nery | Đổi tên | `30 · Lịch & Công (nấc 1)` | — |
| 2 | `Exam Room/K21` | Nery | Move | `40 · Thi/Grade 1 · K21` | Bản chính so với K21 ở ChatGPT-Exam Room? |
| 3 | `Exam Room/EXAM ROOM — PROJECT INSTRUCTIONS` | Nery | Move | `40 · Thi/Hướng dẫn` | — |
| 4 | `Exam Room` (rỗng sau bước 2–3) | Nery | Move | `90 · Lưu trữ` | — |
| 5 | Lối tắt Zoom bản gốc + bản sao | Nery (lối tắt) | Move | `50 · Zoom & Điểm danh` | — |
| 6 | `Quản trị Zoom/RollCall Form` | Nery | Move + đổi tên | `90 · Lưu trữ/Điểm danh cũ · RollCall Form 2025–26` | Còn ai cập nhật không? |
| 7 | `Quản trị Zoom` (rỗng sau bước 5–6) | Nery | Move | `90 · Lưu trữ` | — |
| 8 | Lối tắt ChatGPT Connector, I-MENTOR, E-WiT ENLISH IN MIND | Nery (lối tắt) | Move | `80 · Tham chiếu` | — |
| 9 | `Thay gân đổi cốt`, `iME01-Group 6` | Nery | Move | `95 · Ngoài phạm vi IT` | Giữ trong EWIT-WORK hay chuyển ra ngoài? |
| 10 | Lối tắt `Wisdom Three` | Nery (lối tắt) | Move | `95 · Ngoài phạm vi IT` | Như trên |
| 11 | Tab `PME-3A (bản gốc)` trong ① | Nery | Chưa động | — | Tab nào là bản chính? |

Ghi chú: thư mục rỗng ở bước 4 và 7 đưa vào Lưu trữ thay vì xóa, cho đến khi Nery xác nhận.

## 5. Các giai đoạn thực hiện

| GĐ | Việc | Đảo ngược được? | Ai làm |
|---|---|---|---|
| 0 | Chốt cấu trúc và tên, trả lời các cột "Cần Nery quyết" | — | Nery |
| 1 | Rà script: tìm `getFoldersByName`, `getFilesByName`, `getParents` trong script gắn ①②③, các sheet RollCall và K21 | Chỉ đọc | Claude |
| 2 | Tạo khung thư mục mới (rỗng) + `00 · Đọc trước/README` | Có (xóa thư mục rỗng) | Claude |
| 3 | Move các mục Nery sở hữu theo bảng §4, mỗi lần một nhóm | Có (move lại về ID cha cũ, đã ghi trong drive-map) | Claude |
| 4 | Move lối tắt vào `50` / `80` / `95` | Có | Claude |
| 5 | Kiểm tra: mở thử ①②③, web Lịch, Form thi K21; liệt kê lại cây, so với drive-map | Chỉ đọc | Claude + Nery |
| 6 | Cập nhật `drive-map.md` và cây thư mục trong `CLAUDE.md` | — | Claude |
| 7 | (Tùy chọn, sau 2–4 tuần) Xem lại `90 · Lưu trữ` và `95`: chuyển ra ngoài hoặc xóa | Xóa thì không đảo ngược được | Nery quyết từng mục |

## 6. Phát hiện ngoài cây (chỉ báo, không xử lý)

| Mục | Chủ sở hữu | Ghi chú |
|---|---|---|
| `E-WIT account info` (sheet) | neryewit@ | [SL] Có thể chứa thông tin tài khoản. Không đưa vào EWIT-WORK hay repo; nên chuyển vào trình quản lý mật khẩu |
| `HOẠCH ĐỊNH TÀI CHÍNH TRỌN ĐỜI 012022` | Nery, nằm trong đích Wisdom Three | Dữ liệu tài chính cá nhân. Lý do thêm để tách Wisdom Three khỏi EWIT-WORK |
| `Syllabus For E-WIT Classes`, `Learners'list_E-WIT Classes.xlsx` | ewitenglish@ | [SL] Nguồn dữ liệu của hệ cũ (DS_Lop?), liên quan việc chạy song song nấc 1 |
| Nhiều tài khoản: tnho113, neryewit, ewitenglishai, ewitenglish, ewitvoa, nhoguentner, minhngoc55vn | — | [Giả định] neryewit / ewitenglishai là tài khoản E-WIT do Nery quản lý → liên quan việc "chuyển sang tài khoản tổ chức" |
