# Lịch & Công v2 · Đặc tả chung cho code (B4–B6)

> Đọc kèm: `docs/lich-cong-v2/thiet-ke-du-lieu.md` (bảng, cột, quy ước màu §7, Zoom report §8) và `docs/DECISIONS.md` (WD-13 → WD-20).
> Mọi project phải dùng **nguyên văn** `_chung/Chung.gs` (copy vào project, không sửa). Cần thêm hàm chung → ghi vào báo cáo, phiên điều phối quyết định.

## 1. Các project Apps Script

| Thư mục repo | Gắn vào | Người phụ trách code | Việc |
|---|---|---|---|
| `a-danh-muc/` | ⓐ DANH MỤC | Phiên phụ A | Menu, định dạng + Data Validation cho ⓐ, **Áp dụng quyền** (chia sẻ ⓐⓑⓒ + khóa tab ⓑ), trigger mỗi giờ |
| `b-nhap-lieu/` · nhóm file B1 | ⓑ NHẬP LIỆU | Phiên phụ B1 | Menu, `Cập nhật danh mục` (tab ẩn `_dm_*`), **Tạo tab lớp mới**, định dạng/DV/định dạng có điều kiện của tab lớp, `onEdit` (Buổi, Thứ, cờ "có thay đổi") |
| `b-nhap-lieu/` · nhóm file B2 | ⓑ NHẬP LIỆU | Phiên phụ B2 | **Đồng bộ ⓑ → ⓒ**, kiểm tra lỗi, lịch sử, trigger 5 phút |
| `d-thu-lao/` | ⓓ THÙ LAO | Phiên phụ D | Kéo dữ liệu từ ⓒ, **Lập báo cáo** theo khoảng ngày, chốt kỳ, điều chỉnh sau chốt, áp dụng quyền ⓓ |
| `web-lich/` | Standalone (web app) | Phiên phụ W | Web Lịch v2 đọc ⓒ + ⓐ |

Nery dán code bằng tay → mỗi project **≤ 6 file**, mỗi file **≤ 600 dòng**, tên file tiếng Việt không dấu (vd `DongBo.gs`). Mỗi project có `appsscript.json` (timeZone `Asia/Ho_Chi_Minh`, runtime V8, khai báo `oauthScopes` tối thiểu).

## 2. ID file (đọc từ tab `cau_hinh` của file chứa script, không hard-code trong logic)

| Khóa | ID |
|---|---|
| ⓐ `DANH_MUC_ID` | `1-w1bSyxdcEfZs4ZdJn6ra2ImQFaF3m9q9-J8DmFvm0Q` |
| ⓑ `NHAP_LIEU_ID` | `1nl0lXQjlhXoLWsQ17BVdXqGfDo7VaEe3KfFXEcrCOoY` |
| ⓒ `DU_LIEU_ID` | `1HWwRBmyYAxZjLjl-Uo1fwJbJ9aQQNmn45tMSl3OS4Rs` |
| ⓓ (chỉ ⓓ biết chính nó) | `1u0e4vxLRgEM4vplb6sj0UrGRI0GApC5C3E22vULUu5A` |

`cau_hinh` hiện có: ⓐ (`NHAP_LIEU_ID`, `DU_LIEU_ID`) · ⓒ (`DANH_MUC_ID`, `NHAP_LIEU_ID`) · ⓓ (`DU_LIEU_ID`, `DANH_MUC_ID`). ⓑ **chưa có tab `cau_hinh`**: B1 tạo tab ẩn `cau_hinh` trong ⓑ bằng hàm cài đặt lần đầu, chứa `DANH_MUC_ID`, `DU_LIEU_ID`. Web Lịch: hằng số `DU_LIEU_ID`, `DANH_MUC_ID` ở đầu `Code.gs` (ngoại lệ duy nhất).

**ⓒ và ⓐ không bao giờ đọc/ghi ⓓ.** ⓓ chỉ đọc ⓒ và ⓐ.

## 3. Bảng dữ liệu
- Dòng 1 = tên cột; đọc/ghi **theo tên cột** (`docBang`, `ghiBang` trong Chung.gs), không theo vị trí.
- Ngày trong Sheets là kiểu Date; so sánh theo chuỗi `yyyy-MM-dd` (`ngayKey`). Múi giờ `Asia/Ho_Chi_Minh`.
- Cột ⓐ `lop`: class_id, ten_lop, nhom_lop, ngay_bat_dau, ngay_ket_thuc, gio_bat_dau, gio_ket_thuc, thu_hoc (chuỗi, vd `357`: 2=T2 … 7=T7, 8=CN), zoom_acc, zoom_id, trang_thai (ACTIVE/PAUSED/COMPLETED), phu_trach_email (nhiều email, dấu phẩy), bo_vai_tro, tab_nhap, ghi_chu.
- ⓐ `ef`: ef_id, ten_hien_thi, ho_ten, email, zoom_email, team, dang_hoat_dong (Có/Không), mau_nen, mau_chu, ghi_chu.
- ⓐ `level`: level_id, ten_level, thu_tu, dang_dung · `ef_level`: ef_id, level_id, tu_ngay, den_ngay, ghi_chu.
- ⓐ `vai_tro`: role_id, ten_vai_tro, cho_phep_nhieu_nguoi, dang_dung, nguon (NHAP_TAY/ZOOM_REPORT), ghi_chu.
- ⓐ `bo_vai_tro`: bo_id, role_id, thu_tu_cot, ghi_chu · `trang_thai_buoi`: status_id, ten, ghi_nhan_nguoi, mau · `bi_danh`: bi_danh, ef_id, ghi_chu · `quyen`: email, vai_tro_he_thong (QUAN_TRI/DANH_MUC/NHAP_LIEU/XEM), dang_hieu_luc, ghi_chu · `cau_hinh`: khoa, gia_tri, ghi_chu.
- ⓒ `buoi_hoc`: session_id, class_id, ngay, gio_bat_dau, gio_ket_thuc, buoi_so, plan, actual, status_id, ghi_chu, tab_dong, cap_nhat_luc.
- ⓒ `phan_cong`: assignment_id, session_id, class_id, nhom_lop, ngay, ef_id, role_id, level_id, status_id, nguon, cap_nhat_luc.
- ⓒ `lich_su`: thoi_diem, nguoi_sua, loai, doi_tuong_id, truong, gia_tri_cu, gia_tri_moi, ghi_chu · `kiem_tra`: muc_do (LOI/CANH_BAO), loai_loi, class_id, tab_dong, ngay, chi_tiet, phat_hien_luc.
- ⓓ: `du_lieu` (assignment_id, session_id, ngay, class_id, ten_lop, nhom_lop, ef_id, ten_ef, role_id, ten_vai_tro, level_id, ten_level, status_id, keo_ve_luc) · `quy_tac_muc` (rule_id, nhom_lop, class_id, role_id, level_id, tu_ngay, den_ngay, muc_moi_buoi, ghi_chu) · `ky_chot` (ky_id, tu_ngay, den_ngay, nguoi_chot, chot_luc, so_dong, ghi_chu) · `dieu_chinh` (phat_hien_luc, ky_id, assignment_id, loai, chi_tiet, xu_ly_o_ky, da_xu_ly, ghi_chu) · `quyen` (email, quyen SUA/XEM, dang_hieu_luc, ghi_chu) · `bao_cao` (khung ô lọc, xem §6).

## 4. Hợp đồng bố cục TAB LỚP trong ⓑ (B1 tạo, B2 đọc — không được lệch)

Tên tab = `class_id` (vd `G1-K22`).

| Dòng | Nội dung |
|---|---|
| 1 | A1: `SYLLABUS · <ten_lop>` |
| 2 | A2 `Mã lớp` · **B2 = class_id (ô khóa để nhận diện)** · D2 `Nhóm lớp` · E2 nhom_lop |
| 3 | A3 `Ngày bắt đầu` · B3 · D3 `Ngày kết thúc` · E3 |
| 4 | A4 `Thứ học` · B4 · D4 `Giờ học` · E4 (`hh:mm - hh:mm`) |
| 5 | A5 `Người phụ trách` · B5 (email) |
| 6 | Chú thích màu + link `=HYPERLINK(...)` tới tab `ef` của ⓐ + email người quản lý danh mục |
| 7 | **Dòng khóa máy, ẩn**: mỗi ô là khóa cột (xem dưới) |
| 8 | Tiêu đề cột (nền `#3D0A6E`, chữ trắng) |
| 9+ | Mỗi dòng một buổi (chuẩn bị sẵn 200 dòng có DV) |

Khóa cột (dòng 7), theo thứ tự: `buoi_so` · `ngay` · `thu` · `gio_bd` · `gio_kt` · `plan` · `actual` · `status` · `role:<ROLE_ID>` (một cột mỗi vai trò, theo `bo_vai_tro.thu_tu_cot`) · `ghi_chu`.
- `buoi_so`, `thu`: tự động (tím xám, khóa). `buoi_so` = số thứ tự dòng có ngày, không tính dòng trạng thái `ghi_nhan_nguoi = Không`? → **Không**: đếm mọi dòng có ngày (đơn giản, dễ hiểu).
- `ngay`: kem, DV kiểu ngày hợp lệ. `gio_bd`, `gio_kt`: kem, để trống = lấy giờ của lớp.
- `plan`, `actual`, `ghi_chu`: kem, tự do.
- `status`: xanh, dropdown từ `_dm_trang_thai` (cột `ten`); trống = BINH_THUONG.
- `role:X` với `nguon = NHAP_TAY`: xanh, dropdown từ `_dm_ef` (ten_hien_thi EF đang hoạt động). `cho_phep_nhieu_nguoi = Có` → bật chọn nhiều (chip), giá trị dạng `Tên A, Tên B`.
- `role:X` với `nguon = ZOOM_REPORT`: tím xám, khóa, không DV (sau này module Zoom report ghi vào).
- Tab ẩn trong ⓑ do B1 làm mới: `_dm_ef` (A: ten_hien_thi, B: ef_id), `_dm_trang_thai` (A: ten, B: status_id), `cau_hinh`.

## 5. Quy tắc đồng bộ (B2)
- Duyệt mọi tab có B2 khớp một `class_id` trong ⓐ `lop`. Dòng ≥ 9 có `ngay` hợp lệ = 1 buổi.
- `session_id = <class_id>_<yyyymmdd>`; buổi thứ 2 cùng ngày cùng lớp → `_2`, `_3` theo thứ tự dòng.
- Tên trong ô vai trò → `ef_id` qua `ef.ten_hien_thi`, rồi `bi_danh`; không khớp → `kiem_tra` LOI `TEN_LA`.
- Trạng thái `ghi_nhan_nguoi = Không` → không tạo dòng `phan_cong` cho buổi đó (vẫn có `buoi_hoc`).
- `level_id` = level của EF tại ngày buổi học từ `ef_level` (tu_ngay ≤ ngày ≤ den_ngay hoặc den_ngay trống); không có → trống + `kiem_tra` CANH_BAO `THIEU_LEVEL`.
- `assignment_id = <session_id>_<ef_id>_<role_id>`; `nguon = NHAP_TAY`.
- Ghi ⓒ: thay toàn bộ dòng của các lớp được đồng bộ (xóa cũ, ghi mới), ghi khác biệt vào `lich_su` (thêm/sửa/xóa theo session_id, assignment_id). `kiem_tra`: xóa lỗi cũ của lớp đó rồi ghi lỗi mới.
- Kiểm tra: ngày trùng (khác buổi bù cùng ngày) → CANH_BAO; ngày ngoài [ngay_bat_dau, ngay_ket_thuc] → LOI; sai thứ học → CANH_BAO; thiếu Teacher in charge ở buổi `ghi_nhan_nguoi = Có` đã qua → CANH_BAO; EF `dang_hoat_dong = Không` được xếp → CANH_BAO; buổi MIDTERM/FINAL thiếu Giám khảo → CANH_BAO.
- `LockService` khi đồng bộ. Trigger 5 phút chỉ chạy khi cờ `CO_THAY_DOI` (Script Properties, do onEdit của B1 bật) = true, hoặc khi bấm tay.

## 6. ⓓ báo cáo (D)
- `bao_cao`: B2 = từ ngày, E2 = đến ngày, B3 = lọc EF (tùy chọn), D3 = lọc lớp, F3 = lọc vai trò. Kết quả từ dòng 6: `ten_ef · ten_level · ten_vai_tro · ten_lop · so_buoi · cac_ngay · muc_de_xuat · thanh_tien_de_xuat · thu_lao_quyet_dinh · ghi_chu`.
- Lập lại báo cáo **giữ nguyên** `thu_lao_quyet_dinh` và `ghi_chu` đã điền (khóa: ef_id + level_id + role_id + class_id).
- `muc_de_xuat` = quy tắc khớp cụ thể nhất (class_id > nhom_lop; ô trống = mọi giá trị) còn hiệu lực tại ngày buổi học.
- Không ghi số tiền vào Logger/console.

## 7. Kiểm thử ngoài Apps Script
- Logic thuần (không gọi SpreadsheetApp…) đặt trong file riêng `*Logic.gs` (vd `DongBoLogic.gs`), viết sao cho chạy được trong Node.
- Test: `apps-script/lich-cong-v2/test/<module>.test.js`, dùng `node:test` + `test/nap-gs.js` (nạp file .gs vào `vm`). Chạy: `node --test 'apps-script/lich-cong-v2/test/*.test.js'`.
- Mỗi phiên phụ phải chạy test của mình và báo kết quả.

## 8. Phong cách
- Comment tiếng Việt ngắn, chỉ ở chỗ cần. Tên hàm tiếng Việt không dấu dạng camelCase (vd `taoTabLop`).
- Menu tên `E-WIT`. Thông báo cho người dùng bằng tiếng Việt, ngắn.
- `SCRIPT_VERSION = 'v2.0.0-dev'` ghi vào `cau_hinh` khi chạy.
- Không `Logger.log` dữ liệu cá nhân hay tiền.
