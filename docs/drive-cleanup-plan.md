# Kế hoạch làm sạch thư mục EWIT-WORK · v2

- Trạng thái: **HOÀN TẤT GĐ1–5 (28/10/2026)**. Nhật ký thao tác + ID: `docs/drive-move-log.md`. Còn GĐ6 (xem lại `90 · Lưu trữ` sau 2–4 tuần).
- Điều chỉnh sau duyệt: `EF-CountingBoard-IT`, `EF-ReportBoard-Full`, `EstimateSalary` **còn dùng** → chuyển vào `30 · Lịch & Công/Hệ cũ (đang chạy)` thay vì `90 · Lưu trữ`. Thư mục nấc 1: move nhưng **chưa đổi tên** (chờ kiểm tra `ewit-nac1`). `BẢN THỬ web nhập liệu` đang được web Nhập lịch dùng.
- v2 (27/10/2026, tối): cập nhật theo trả lời của Nery (WD-07, WD-08) và 11 mục mới xuất hiện ở gốc.
- Dữ liệu nền: `docs/drive-map.md`.

## 1. Hiện trạng (sự thật từ khảo sát lại)

Gốc EWIT-WORK hiện có **7 thư mục/lối tắt cũ + 11 mục mới**, nằm ngang hàng:

| Nhóm | Mục ở gốc |
|---|---|
| Thư mục | EWIT · Hệ thống Lịch & Công (nấc 1) · Exam Room · Quản trị Zoom · iME01-Group 6 · Thay gân đổi cốt · **Xây Kênh EWIT** (mới) |
| Lối tắt | ChatGPT Connector · I-MENTOR E-WIT · E-WiT ENLISH IN MIND · Wisdom Three |
| Hệ Lịch & Công cũ (mới thấy) | `Syllabus_schedule` (sửa 25/10 → **đang dùng**) · Apps Script `EWIT - Nhập lịch EF đứng lớp` · `EWIT - Lich len lop` · `EWIT - Chấm công EF lên lớp` · Google Site `EWIT - Lịch lớp học` |
| Bản thử | `Syllabus_schedule – BẢN THỬ web nhập liệu` · `[BẢN THỬ] Đăng ký thi Grade 1 – lọc DSThi theo khóa` |
| Bảng EF / công (tháng 1–2/2026) | `EF-CountingBoard-IT` · `EF-ReportBoard-Full` · **`EstimateSalary`** (tiền công → bảo mật, chưa mở) |

Quyền truy cập: EWIT-WORK và các thư mục đã kiểm tra **chỉ Nery có quyền** → di chuyển trong cây không mở rộng quyền cho ai.

## 2. Nguyên tắc an toàn (giữ nguyên v1)

1. **Move, không copy** → giữ ID. Apps Script standalone, Google Site, Form, link `openById` không bị ảnh hưởng.
2. Chỉ move mục Nery sở hữu. Mục người khác sở hữu (ChatGPT-Exam Room, Zoom bản gốc…) giữ nguyên chỗ, chỉ trỏ tới bằng lối tắt.
3. **Không xóa.** Mục cũ → `90 · Lưu trữ`.
4. Rà script tìm file theo **tên / thư mục cha** trước khi move (3 Apps Script hệ cũ + script gắn ①②③).
5. Dữ liệu tiền công (③, `EstimateSalary`): không đọc giá trị, không đặt vào thư mục sẽ chia sẻ cho người ngoài BTC/kế toán.
6. Hệ cũ đang chạy song song: move chỉ đổi vị trí trong Drive, **không đổi tên file** của hệ cũ trong giai đoạn này (tránh gãy script tìm theo tên).

## 3. Cấu trúc đích v2

```
EWIT-WORK/
├── 00 · Điều hành IT              README / mục lục · Xây dựng Team IT
├── 10 · Thương hiệu               (mới, trống) Brand Guide, giọng văn, FAQ, hồ sơ đội ngũ
├── 20 · Website                   (mới, trống) đề xuất, nội dung, ảnh
├── 30 · Lịch & Công
│   ├── Nấc 1 (hệ mới)             ①②③  ← thư mục nấc 1 hiện có, đổi tên
│   ├── Hệ cũ (đang chạy)          Syllabus_schedule · 3 Apps Script · Site Lịch lớp học
│   └── Bản thử                    Syllabus_schedule – BẢN THỬ web nhập liệu
├── 40 · Thi
│   ├── (lối tắt) ChatGPT-Exam Room   ★ BẢN CHÍNH: K21, K22, K[xx]-Template, HD tạo phòng thi
│   ├── Hướng dẫn                  EXAM ROOM — PROJECT INSTRUCTIONS
│   └── Bản thử                    [BẢN THỬ] Đăng ký thi Grade 1
├── 50 · Zoom & Điểm danh
│   ├── (lối tắt) QUẢN TRỊ VÀ ĐIỀU PHỐI PHÒNG ZOOM — BẢN GỐC
│   └── Bản sao của Nery
├── 60 · Xây kênh                  ← Xây Kênh EWIT (Kho truyện nội tâm, PLAN 365, WiTDaily P1/P2)
├── 70 · Tri thức WIT (bộ não thứ 2)
│   ├── Thay gân đổi cốt
│   ├── iME01-Group 6
│   └── (lối tắt) Wisdom Three
├── 80 · Tham chiếu (lối tắt)      ChatGPT Connector · I-MENTOR E-WIT · E-WiT ENLISH IN MIND
└── 90 · Lưu trữ
    ├── Exam Room · K21 (bản cũ của Nery)
    ├── Điểm danh cũ · RollCall Form 2025–26
    ├── Bảng EF 2026-Q1            EF-CountingBoard-IT · EF-ReportBoard-Full
    └── Bảo mật                    EstimateSalary
```

## 4. Bảng ánh xạ v2

| # | Mục hiện tại | Hành động | Đích | Ghi chú |
|---|---|---|---|---|
| 1 | Thư mục `EWIT · Hệ thống Lịch & Công (nấc 1)` | Move + đổi tên | `30 · Lịch & Công/Nấc 1 (hệ mới)` | Tên file ①②③ giữ nguyên |
| 2 | `Syllabus_schedule`, 3 Apps Script, Site | Move | `30 · Lịch & Công/Hệ cũ (đang chạy)` | Không đổi tên; rà script trước |
| 3 | `Syllabus_schedule – BẢN THỬ web nhập liệu` | Move | `30 · Lịch & Công/Bản thử` | |
| 4 | `Exam Room/EXAM ROOM — PROJECT INSTRUCTIONS` | Move | `40 · Thi/Hướng dẫn` | |
| 5 | `[BẢN THỬ] Đăng ký thi Grade 1` | Move | `40 · Thi/Bản thử` | |
| 6 | Lối tắt mới → `ChatGPT-Exam Room` | Tạo lối tắt | `40 · Thi` | Theo WD-07. Nếu connector không tạo được lối tắt, Nery tạo tay (chuột phải → Sắp xếp → Thêm lối tắt) |
| 7 | `Exam Room/K21` | Move | `90 · Lưu trữ/Exam Room · K21 (bản cũ)` | Theo WD-07 |
| 8 | Lối tắt Zoom bản gốc + bản sao | Move | `50 · Zoom & Điểm danh` | |
| 9 | `Quản trị Zoom/RollCall Form` | Move + đổi tên thư mục | `90 · Lưu trữ/Điểm danh cũ · RollCall Form 2025–26` | |
| 10 | `Xây Kênh EWIT` | Move + đổi tên | `60 · Xây kênh` | Trừ mục 11 |
| 11 | `Xây Kênh EWIT/Xây dựng Team IT` | Move | `00 · Điều hành IT` | [SL] nội dung về đội IT, không phải kênh |
| 12 | `Thay gân đổi cốt`, `iME01-Group 6`, lối tắt `Wisdom Three` | Move | `70 · Tri thức WIT` | Theo WD-08 |
| 13 | Lối tắt ChatGPT Connector, I-MENTOR, E-WiT EIM | Move | `80 · Tham chiếu` | |
| 14 | `EF-CountingBoard-IT`, `EF-ReportBoard-Full` | Move | `90 · Lưu trữ/Bảng EF 2026-Q1` | Xem câu hỏi Q1 |
| 15 | `EstimateSalary` | Move | `90 · Lưu trữ/Bảo mật` | Dữ liệu tiền công; xem Q1 |
| 16 | Thư mục `Exam Room`, `Quản trị Zoom` (rỗng sau khi move) | Move | `90 · Lưu trữ` | Không xóa |
| 17 | Tab `PME-3A (bản gốc)` trong ① | Chưa động | — | Chờ Nery chỉ tab chính |

## 5. Các giai đoạn

| GĐ | Việc | Đảo ngược? | Ai |
|---|---|---|---|
| 0 | Nery duyệt cấu trúc v2 + trả lời Q1/Q2 | — | Nery |
| 1 | Rà 3 Apps Script hệ cũ + script gắn ①②③: tìm `getFoldersByName`, `getFilesByName`, `getParents`, ID cứng | Chỉ đọc | Claude |
| 2 | Tạo khung thư mục rỗng + README trong `00` | Có | Claude |
| 3 | Move theo bảng §4, từng nhóm (30 → 40 → 50 → 60/70/80 → 90) | Có (ID cha cũ đã ghi) | Claude |
| 4 | Kiểm tra: mở ①②③, web Lịch / Chấm công / Nhập lịch, Site, Form thi; liệt kê lại cây | Chỉ đọc | Claude + Nery |
| 5 | Cập nhật `drive-map.md`, cây trong `CLAUDE.md` | — | Claude |
| 6 | Sau 2–4 tuần chạy song song: xem lại `90 · Lưu trữ` | Xóa thì không đảo ngược | Nery quyết từng mục |

## 6. Phát hiện ngoài cây (chỉ báo, không xử lý)

| Mục | Chủ sở hữu | Ghi chú |
|---|---|---|
| `E-WIT account info` | neryewit@ | [SL] Có thể chứa thông tin tài khoản → nên chuyển vào trình quản lý mật khẩu |
| `HOẠCH ĐỊNH TÀI CHÍNH TRỌN ĐỜI 012022` | Nery, trong đích Wisdom Three | Tài chính cá nhân; Wisdom Three chỉ được trỏ bằng lối tắt nên không ảnh hưởng |
| `Syllabus For E-WIT Classes`, `Learners'list_E-WIT Classes.xlsx` | ewitenglish@ | [SL] Nguồn dữ liệu hệ cũ (DS_Lop?) |
