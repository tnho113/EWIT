# Apps Script · E-WIT

| Thư mục | Nội dung | Trạng thái |
|---|---|---|
| `he-cu/` | 3 web app hệ Lịch & Công **cũ** (standalone), bản xuất ngày 28/10/2026 | Chỉ lưu vết, **không push ngược** lên Drive |
| `ewit-nac1/` | Script gắn trong ①②③ hệ mới (nấc 1) | ⏳ Chưa có — chờ Nery đưa vào |
| `exam-grade1/` | `ewit-chot-danh-sach.gs` (chốt danh sách thi Grade 1) | ⏳ Chưa có |

## he-cu/ — nguồn trên Drive (`30 · Lịch & Công/Hệ cũ (đang chạy)`)

| Thư mục | Script trên Drive | Script ID | Sheet đọc (openById) | Web app |
|---|---|---|---|---|
| `lich-len-lop/` | EWIT - Lich len lop | `12u7Ch8h-MzAYwIAcbmKV5raUYMDxf1GRkrcxSM-877Wif9BkT5VjscKd` | Syllabus_schedule | USER_DEPLOYING · ANYONE_ANONYMOUS (WD-12) |
| `cham-cong-ef/` | EWIT - Chấm công EF lên lớp | `1V3mDtVKfWifMsFD8ALE8kiseGpMe-Raw8XPGaqxLKD6x5caKzOQTSJgH` | Syllabus_schedule | USER_ACCESSING · ANYONE |
| `nhap-lich-ef/` | EWIT - Nhập lịch EF đứng lớp | `11LAUCR1wOuMdm9EGjhKPmCIubdLuERt9F7Zzhhe6QhhctciBy6wgRwNF` | **BẢN THỬ** web nhập liệu | USER_ACCESSING · ANYONE |

- `lich-len-lop/Code.gs` và `cham-cong-ef/Code.gs` giống nhau, chỉ khác `PAGE_TITLE`.
- Bản trong repo là **ảnh chụp**. Nếu sửa trên Drive, xuất lại rồi commit để giữ đồng bộ.
- Hệ cũ hard-code màu, font, `Mr. Okie` trong HTML: chấp nhận cho hệ cũ; hệ mới đi qua `brand.yaml`.
