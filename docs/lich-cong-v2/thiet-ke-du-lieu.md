# Lịch & Công v2 · Thiết kế dữ liệu (B1, bản thảo)

- Ngày: 28/10/2026 · Trạng thái: **ĐỀ XUẤT — chờ Nery duyệt**.
- Căn cứ: WD-13, WD-14, WD-15. Ký hiệu **[GĐ]** = giả định cần Nery xác nhận.
- Quy ước chung: dòng 1 mỗi bảng là tên cột (không đổi tên; thêm cột mới ở cuối). Khóa (`..._id`) không bao giờ đổi hay xóa → lên nấc 2 (PostgreSQL) chuyển thẳng.

## 0. Tổng quan

```
ⓐ DANH MỤC ──(danh sách chọn, quyền)──► ⓑ NHẬP LIỆU (1 tab / lớp, khóa theo người phụ trách)
     │                                        │ đồng bộ (script, mỗi 5 phút + nút bấm)
     └──────────(level, nhóm lớp)────────────►▼
                                         ⓒ DỮ LIỆU CHUẨN ──► 🌐 WEB LỊCH v2
                                              │ ⓓ tự kéo (mỗi giờ + nút bấm)
                                              ▼
                                         ⓓ THÙ LAO (bảo mật)
```

## 1. ⓐ DANH MỤC — 1 người quản lý danh mục

| Tab | Mỗi dòng | Cột chính |
|---|---|---|
| `lop` | 1 lớp | `class_id` · `ten_lop` · `nhom_lop` (Grade, Kids, Mentor, Phát âm, Tiếng Nhật, Training, Đối tác…) · `ngay_bat_dau` · `ngay_ket_thuc` · `gio_bat_dau` · `gio_ket_thuc` · `thu_hoc` (vd `246`) · `zoom_acc` · `zoom_id` · `trang_thai` (ACTIVE / PAUSED / COMPLETED) · **`phu_trach_email`** (nhiều email cách bằng dấu phẩy) · `bo_vai_tro` (mã bộ vai trò, xem `bo_vai_tro`) · `tab_nhap` (script ghi) · `ghi_chu` |
| `ef` | 1 người | `ef_id` (EF###) · `ten_hien_thi` · `ho_ten` · `email` · `team` · `dang_hoat_dong` (Có/Không) · `mau_nen` · `mau_chu` · `ghi_chu` |
| `level` | 1 level | `level_id` · `ten_level` (Teacher, Pioneer, TORs, L1, L2, L3, Thỉnh giảng, Khách mời…) · `thu_tu` · `dang_dung` — **danh sách mở, thêm dòng là có level mới** |
| `ef_level` | 1 giai đoạn level của 1 EF | `ef_id` · `level_id` · `tu_ngay` · `den_ngay` (trống = đến nay). Lên level: điền `den_ngay` dòng cũ, thêm dòng mới → **buổi cũ vẫn giữ đúng level lúc dạy** |
| `vai_tro` | 1 vai trò | `role_id` · `ten_vai_tro` (Teacher in charge, H.O.E, Small Zoom, Zoom admin, Giám khảo…) · `cho_phep_nhieu_nguoi` (Có/Không) · `dang_dung` |
| `bo_vai_tro` | 1 vai trò thuộc 1 bộ | `bo_id` · `role_id` · `thu_tu_cot`. Mỗi lớp chọn 1 bộ → tab nhập liệu có đúng các cột vai trò đó (**vai trò tùy theo lớp**) |
| `trang_thai_buoi` | 1 trạng thái | `status_id` · `ten` (Bình thường, OFF, REVISION, MIDTERM TEST, FINAL TEST, OFFLINE, NGOẠI KHÓA, CLOSING…) · `ghi_nhan_nguoi` (Có/Không: OFF thì không ghi nhận ai) · `mau` |
| `bi_danh` | 1 cách viết khác | `bi_danh` → `ef_id` (dùng khi nạp dữ liệu cũ) |
| `quyen` | 1 email × 1 quyền | `email` · `vai_tro_he_thong` (QUAN_TRI · DANH_MUC · NHAP_LIEU · XEM) · `dang_hieu_luc` · `ghi_chu` |
| `cau_hinh` | 1 thiết lập | `khoa` → `gia_tri` (ID các file ⓑⓒ, múi giờ, phiên bản code) |

### Quyền (WD-14) — cấu hình bằng bảng, script áp dụng
| Vai trò hệ thống | ⓐ Danh mục | ⓑ Nhập liệu | ⓒ Dữ liệu | Web Lịch |
|---|---|---|---|---|
| QUAN_TRI (Nery) | Sửa | Sửa mọi tab | Sửa | Xem |
| DANH_MUC (người quản lý danh sách lớp / EF) | Sửa | Xem | Xem | Xem |
| NHAP_LIEU (bộ phận nhập liệu) | Xem | Sửa mọi tab lớp **[GĐ]** | Xem | Xem |
| Người phụ trách lớp (từ `lop.phu_trach_email`) | Xem | **Chỉ sửa tab lớp mình** | — | Xem |
| XEM | — | — | — | Xem |

- Menu **E-WIT ▸ Áp dụng quyền**: đọc `quyen` + `lop.phu_trach_email` → cập nhật chia sẻ file và khóa từng tab. Đổi người phụ trách = sửa email trong `lop` rồi bấm nút (hoặc tự chạy mỗi giờ).
- Giới hạn của Google Sheets (sự thật): người có quyền xem file ⓑ **xem được mọi tab**; khóa chỉ chặn *sửa*. Chủ file luôn sửa được mọi thứ.
- **ⓓ THÙ LAO không nằm trong bảng quyền này** (xem §4).

## 2. ⓑ NHẬP LIỆU — mỗi lớp 1 tab, tạo bằng menu (không nhân bản tay)

```
Dòng 1–6 : thông tin lớp (tự lấy từ ⓐ, khóa)
Dòng 8   : tiêu đề cột
Dòng 9+  : mỗi dòng 1 buổi
  Buổi (tự) | Ngày | Thứ (tự) | Giờ (mặc định từ lớp, sửa được) | PLAN | ACTUAL | Trạng thái | <cột vai trò theo bo_vai_tro…> | Ghi chú
```
- Cột vai trò: danh sách chọn từ `ef` đang hoạt động; vai trò `cho_phep_nhieu_nguoi = Có` dùng chọn nhiều (chip).
- Tô màu: trùng ngày / ngoài khóa học (đỏ) · sai thứ học (cam) · thiếu người ở vai trò bắt buộc (vàng) · OFF (hồng) · hôm nay (kem).
- Tab `HUONG_DAN` ở đầu file.

## 3. ⓒ DỮ LIỆU CHUẨN — script ghi, không ai sửa tay

| Tab | Mỗi dòng | Cột chính |
|---|---|---|
| `buoi_hoc` | 1 buổi | `session_id` = `class_id_yyyymmdd[_n]` · `class_id` · `ngay` · `gio_bat_dau` · `gio_ket_thuc` · `buoi_so` · `plan` · `actual` · `status_id` · `ghi_chu` · `cap_nhat_luc` |
| `phan_cong` | 1 người × 1 vai trò × 1 buổi | `assignment_id` · `session_id` · `class_id` · `nhom_lop` · `ngay` · `ef_id` · `role_id` · **`level_id` (level của EF tại ngày buổi học)** · `status_id` · `cap_nhat_luc` |
| `lich_su` | 1 thay đổi | ai sửa, lúc nào, giá trị cũ → mới (chỉ ghi thêm) |
| `kiem_tra` | 1 lỗi / lưu ý | mức độ · loại · lớp · ngày · chi tiết |
| `cau_hinh` | — | lần đồng bộ cuối, phiên bản code |

Web Lịch v2 đọc `buoi_hoc` + `phan_cong` + `ef` (màu) + `lop`.

## 4. ⓓ THÙ LAO (bảo mật) — người phụ trách quyết định (WD-15)

| Tab | Dùng để |
|---|---|
| `du_lieu` | Bản kéo về từ `ⓒ.phan_cong` (+ tên lớp, tên EF, tên level, tên vai trò). Không sửa tay |
| **`bao_cao`** | Người phụ trách **chọn từ ngày – đến ngày** (và lọc tùy chọn: EF, lớp, nhóm lớp, vai trò, level) → bấm **Lập báo cáo** → bảng: **EF × vai trò × lớp × level → số buổi**, kèm danh sách ngày cụ thể; cột **Mức đề xuất** (nếu có quy tắc) và cột **Thù lao quyết định** (người phụ trách tự điền) |
| `quy_tac_muc` | (Tùy chọn) mức gợi ý theo `nhom_lop` hoặc `class_id` × `role_id` × `level_id` × ngày hiệu lực; ô trống = áp dụng mọi giá trị. Quy tắc cụ thể hơn được ưu tiên. Không bắt buộc dùng |
| `ky_chot` | Mỗi lần chốt: khoảng ngày, người chốt, thời điểm; chụp lại bảng báo cáo + thù lao đã quyết định. Không sửa tay |
| `dieu_chinh` | Buổi sửa sau khi đã chốt → hiện ở đây để xử lý ở kỳ sau |
| `quyen` | Email được xem/sửa ⓓ — **chỉ quản lý trong chính ⓓ** **[GĐ]** |
| `cau_hinh` | ID file ⓒ, lần kéo cuối |

Trả lời câu hỏi "ai đã làm vai trò gì ở lớp nào trong khoảng thời gian X": tab `bao_cao`.

## 5. Luồng tự động
| Việc | Khi nào | Ghi chú |
|---|---|---|
| ⓑ → ⓒ đồng bộ + kiểm tra | Mỗi 5 phút **[GĐ]** + nút bấm | Chỉ xử lý tab đã thay đổi |
| Áp dụng quyền | Mỗi giờ + nút bấm | Đọc ⓐ |
| ⓓ kéo từ ⓒ | Mỗi giờ + nút bấm | ⓒ không biết ⓓ tồn tại |
| Web Lịch | Đọc trực tiếp ⓒ khi mở trang | Có cache ngắn |

## 6. Khác biệt chính so với bộ ①②③
- Danh mục tách file riêng (ⓐ); thêm `level` + `ef_level` (level theo thời gian); `bo_vai_tro` (vai trò theo lớp); bảng `quyen`.
- `phan_cong` lưu sẵn level tại thời điểm dạy.
- ⓓ chuyển từ "bảng công tự tính" sang **báo cáo theo khoảng ngày tự chọn + người phụ trách quyết định thù lao**; quy tắc mức chỉ là gợi ý.
