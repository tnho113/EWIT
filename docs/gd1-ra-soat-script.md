# GĐ1 · Rà soát script trước khi di chuyển (chỉ đọc)

Ngày: 27/10/2026 · Cách đọc: xuất mã qua Drive (`application/vnd.google-apps.script+json`). Không sửa, không chạy.

## 1. Ba Apps Script hệ cũ (standalone, ở gốc EWIT-WORK)

| Script | Mở sheet bằng | Sheet đích | Quyền OAuth | Web app | Rủi ro khi move |
|---|---|---|---|---|---|
| EWIT - Lich len lop | `openById` | `Syllabus_schedule` (bản chính) | chỉ `spreadsheets` | `USER_DEPLOYING` · **`ANYONE_ANONYMOUS`** | Không |
| EWIT - Chấm công EF lên lớp | `openById` | `Syllabus_schedule` (bản chính) | chỉ `spreadsheets` | `USER_ACCESSING` · `ANYONE` | Không |
| EWIT - Nhập lịch EF đứng lớp | `openById` | **`Syllabus_schedule – BẢN THỬ web nhập liệu`** | `spreadsheets`, `script.scriptapp`, `userinfo.email` | `USER_ACCESSING` · `ANYONE` | Không |

Sự thật:
- Cả 3 script **không có quyền Drive** (không có scope `drive`), nên không thể tìm file theo tên hay thư mục. Chúng chỉ dùng `openById` và `getSheetByName` (tên **tab**, không phải tên file).
- → Di chuyển hoặc đổi tên **file/thư mục** không làm gãy 3 script này.
- `Lich len lop` và `Chấm công` dùng chung một `Code.gs` (ghi chú trong mã).
- `Nhập lịch` có trigger theo thời gian: `taoTabNamSau`, chạy ngày 1 hằng tháng lúc 6h. Trigger gắn với script ID nên không bị ảnh hưởng.

## 2. Phát hiện cần Nery biết

| # | Phát hiện | Loại | Đề xuất |
|---|---|---|---|
| 1 | Web Nhập lịch **đang trỏ vào BẢN THỬ** (mã có ghi chú "⚠ ĐANG TRỎ VÀO BẢN THỬ…"). Vì vậy file "BẢN THỬ web nhập liệu" đang được dùng thật cho thử nghiệm, chưa phải rác | Sự thật | Giữ trong `30/Bản thử`; không lưu trữ |
| 2 | Web **Lịch lên lớp** mở cho `ANYONE_ANONYMOUS` và chạy bằng quyền Nery → ai có link đều xem được lịch và **tên EF** mà không cần đăng nhập | Sự thật | Chưa đổi gì. Cân nhắc chuyển sang `ANYONE` (cần đăng nhập Google) hoặc giới hạn tên miền tổ chức khi có Workspace |
| 3 | Script gắn trong ①②③ (gói `ewit-nac1`) **không đọc được** qua connector: script gắn file không phải là file Drive | Giới hạn | Nery kiểm tra giúp trong `ewit-nac1`: có dùng `getFoldersByName` / `getFilesByName` / `getParents` không? Trong lúc chờ: **move thư mục nấc 1 nhưng chưa đổi tên** |
| 4 | `EstimateSalary` (còn dùng, theo Nery) chứa dữ liệu tiền công nằm **ngoài ③**, trái với quyết định "Dữ liệu tiền công chỉ nằm ở file ③" | Mâu thuẫn quy tắc | Nery chọn: (a) giữ tạm, ghi ngoại lệ; (b) gộp vào ③ sau |
| 5 | Mã hệ cũ hard-code màu, font, `Mr. Okie` trong HTML | Sự thật | Chấp nhận với hệ cũ; hệ mới đi qua `brand.yaml` |

## 3. Kết luận GĐ1

An toàn để di chuyển theo kế hoạch v2, với một điều chỉnh: **chưa đổi tên thư mục nấc 1** cho đến khi Nery xác nhận mục 3.
