# Bản đồ Drive · EWIT-WORK

- Khảo sát: 27/10/2026, chỉ đọc, qua Google Drive connector (MCP) của tài khoản Nery.
- Phạm vi: chỉ truy vấn `parentId = …` trong cây, đã lật hết `nextPageToken`. Không tìm kiếm toàn Drive.
- Chủ sở hữu mọi mục liệt kê dưới đây: **Nery** (tài khoản Gmail cá nhân). Thời gian theo UTC, định dạng YYYY-MM-DD.
- Cột "Vai trò": **[S]** = sự thật (từ tên/tab/ghi chú của Nery) · **[SL]** = suy luận từ tên file, chưa đọc nội dung.
- ⚠️ **Chưa duyệt được đích của 5 lối tắt**: connector không trả về `shortcutDetails.targetId`, và tải nội dung lối tắt bị từ chối. Theo Quy tắc Drive số 3, không tìm theo tên trên toàn Drive để đoán đích. Xem mục "Giới hạn" cuối file.

## Cây thư mục

```
EWIT-WORK/                                              folder   tạo 2026-10-27
├── EWIT · Hệ thống Lịch & Công (nấc 1)/                folder
│   ├── ① EWIT · SYLLABUS (nhập liệu các lớp)           sheet
│   ├── ② EWIT · HỆ THỐNG (dữ liệu chuẩn)               sheet
│   └── ③ EWIT · CHẤM CÔNG (bảo mật)                    sheet
├── Exam Room/                                          folder
│   ├── EXAM ROOM — PROJECT INSTRUCTIONS                doc
│   └── K21/                                            folder
│       ├── 01 Learner-Board-Grade 1                    sheet
│       ├── 02 Judge-Board-Grade 1                      sheet
│       ├── 03 Exam Board-Grade 1                       sheet
│       ├── 04 IPA-examROOM-Grade 1                     sheet
│       └── 09 IT-Board-Grade 1                         sheet
├── Quản trị Zoom/                                      folder
│   ├── QUẢN TRỊ VÀ ĐIỀU PHỐI PHÒNG ZOOM                shortcut (BẢN GỐC) → đích chưa xác định
│   ├── QUẢN TRỊ VÀ ĐIỀU PHỐI PHÒNG ZOOM                doc (BẢN SAO)
│   └── RollCall Form/                                  folder (22 sheet, xem bảng)
├── iME01-Group 6/                                      folder (9 doc/docx)
├── Thay gân đổi cốt/                                   folder (9 doc + 1 thư mục rỗng)
├── ChatGPT Connector                                   shortcut → đích chưa xác định
├── I-MENTOR E-WIT                                      shortcut → đích chưa xác định
├── E-WiT ENLISH IN MIND                                shortcut → đích chưa xác định
└── Wisdom Three                                        shortcut → đích chưa xác định
```

## 1. EWIT · Hệ thống Lịch & Công (nấc 1) — `1TqS_2akpq9AkgW8ASSbIw2QXjXV52wWW`

| File | ID | Sửa gần nhất | Tab (sự thật) | Vai trò |
|---|---|---|---|---|
| ① SYLLABUS | `1AHHWOhe5TWCqE3J4WYOxGZrqOUtRI6i4rcvARE1Pfxs` | 2026-10-11 | HUONG_DAN, PME-3A, _MAU, **PME-3A (bản gốc)**, _dm_nguoi, _dm_trangthai, _dm_lop, _dm_lop_chon | [S] Nhập liệu theo lớp. Hiện chỉ có 1 lớp mẫu PME-3A |
| ② HỆ THỐNG | `1lUlOsdtKL6QbbCqJzrQ4WC_3oPQJBl0nkuTRCN1NmjE` | 2026-10-26 | README, lop, nhan_su, vai_tro, trang_thai_buoi, team, bi_danh, buoi_hoc, phan_cong, lich_su, kiem_tra, cau_hinh, raw_lop, raw_ef, raw_log | [S] Dữ liệu chuẩn. [SL] `raw_*` là dữ liệu nhập từ hệ cũ (DS_Lop/DS_EF) |
| ③ CHẤM CÔNG | `1I_n3q-fkynzeeO0WJVk5ZeetaFjejbvvjUfwZZoX09k` | 2026-10-26 | HUONG_DAN, don_gia, du_lieu_cong, bang_cong, chot_cong, dieu_chinh_sau_chot, cau_hinh | [S] Bảo mật. Chỉ đọc tên tab, **không đọc giá trị** |

## 2. Exam Room — `1mmoSMK4jq0dtGCfD1BUgvBUJ8bUncnYy`

| Mục | ID | Loại | Sửa gần nhất | Vai trò |
|---|---|---|---|---|
| EXAM ROOM — PROJECT INSTRUCTIONS | `1GO_JowNd4_kfZEiySsuBiyt_gBOotbkC2FtXw3icg-4` | doc | 2026-08-01 | [SL] Hướng dẫn dự án phòng thi (có thể là project instructions cho AI) |
| K21/ | `1vRE8Y6Wqrx06z0QFevFkFmCWiU2Gkf5k` | folder | 2026-08-01 | [SL] Bộ file thi Grade 1 khóa K21 |
| └ 01 Learner-Board-Grade 1 | `1fp7h0meAjeXBn0IMkTB3swSE17VBQZGmWxPL0xx1P6U` | sheet | 2026-08-06 | [SL] Danh sách / bảng thí sinh |
| └ 02 Judge-Board-Grade 1 | `1xxWpeHNIChCecfsX2i_zO0S6TYYnPqk3cdPCf4A2ZKw` | sheet | 2026-08-01 | [SL] Bảng giám khảo chấm |
| └ 03 Exam Board-Grade 1 | `16Amfo2cd-z9rDyoQVSi_oitcwla2uhWSAb_GbEta8-4` | sheet | 2026-08-01 | [SL] Bảng điều phối ca thi |
| └ 04 IPA-examROOM-Grade 1 | `1lUVwyJWW1mYwUhSaW8PNdSN-Dt3P7tIw-GfKrI02VDw` | sheet | 2026-08-01 | [SL] Đề / phòng thi phần IPA (file lớn ~514 KB) |
| └ 09 IT-Board-Grade 1 | `14xrAVL6ONJPOkxiUAWIxgAi4UV5VAtJxi3D3ydlddg8` | sheet | 2026-08-01 | [SL] Bảng kỹ thuật (IT) cho ca thi |

Ghi chú [SL]: đánh số 01–04, 09 → có thể thiếu 05–08 hoặc nằm ở nơi khác (ví dụ trong ChatGPT Connector).

## 3. Quản trị Zoom — `1LR4nMXhvGdpzHD2f3z3E6ZdIgiSR4Lg1`

| Mục | ID | Loại | Sửa gần nhất | Vai trò |
|---|---|---|---|---|
| QUẢN TRỊ VÀ ĐIỀU PHỐI PHÒNG ZOOM | `1YDbY4NW8Uky6YS4bDOLJ-j9XjN37vXZj` | shortcut | tạo 2026-10-27 | [S] Lối tắt tới **bản gốc** (người khác sở hữu). Đích chưa đọc được |
| QUẢN TRỊ VÀ ĐIỀU PHỐI PHÒNG ZOOM | `1WXZ2icb66e4tNEp6GX5TwX_m4RZGARj_ji8XHnfPS00` | doc | 2026-10-27 | [S] Bản sao của Nery, không dùng làm nguồn chính |
| RollCall Form/ | `1NcZqDl1QycXphv-GJQQj9fpnH-6cGVsx` | folder | 2026-08-01 | [SL] Hệ điểm danh / đếm buổi cũ theo lớp |

**RollCall Form/** (22 sheet, tất cả sửa trong 09–14/08/2026):

| Tên | ID | Sửa gần nhất | Vai trò [SL] |
|---|---|---|---|
| 0.0 CountingBoard-Class60 | `1un1Ts5XQNmw4dkDhFXnHgDH61CNBq69f3DqO4N2xN-0` | 2026-08-10 | Mẫu bảng đếm 60 buổi |
| 0.0 CountingBoard-Class120 | `1GRwYTgidsQMcVyeYH27qZo0a6TabKg7SFJq9vuYIQac` | 2026-08-09 | Mẫu bảng đếm 120 buổi |
| 1.0 CountingBoard-K19 (Jan.26-Mar.26) | `1HxAfth8VP8VzjyLoWqnbTMUyiQTtgSpCi6KsDzc2Hkk` | 2026-08-11 | Đếm buổi lớp K19 |
| 2.0 CountingBoard-LPA-13h30 | `1ob29J0m7T85yeoZBfucPzy_bokBfp6cb9jAStnchIcs` | 2026-08-11 | Đếm buổi lớp LPA ca 13h30 |
| 3.0 CountingBoard-LPA-21h30 | `1LVXNONEGvz9mL0vQZGY3L7NAqw_BaTreK4iH1_78vNU` | 2026-08-11 | Đếm buổi lớp LPA ca 21h30 |
| 4.0 CountingBoard-EP2 (Oct.25-Mar.26) | `1-iSuatzqro2q0G-tiDVBdZxuJIXOitoC14P_W-tNEVs` | 2026-08-11 | Đếm buổi EP2 giai đoạn 1 |
| 4.1 CountingBoard-EP2 (Mar.26-Aug.26) | `1JlNOx0ZEuuH73iZ68g52nFtbAVdrV4W5oIFfgeZxkOk` | 2026-08-11 | Đếm buổi EP2 giai đoạn 2 |
| 5.0 CountingBoard-EG2 (Oct.25-Mar.26) | `121T0a1mnRSKfaR8JH5EV3dE0zkxYrE3YcQhJRoqzCLg` | 2026-08-11 | Đếm buổi EG2 giai đoạn 1 |
| 5.1 CountingBoard-EG2 (Mar.26-Aug.26) | `1kXaIhegfQdD-IY4AzcbFgsXLCupIIPBQrp8UKdtFgCw` | 2026-08-11 | Đếm buổi EG2 giai đoạn 2 |
| 6.0 CountingBoard-EP3 (Oct.25-Mar.26) | `1Or_o4Fv9RVAj2pnjKFGfPxtrqj8eUzRDpoc7d0v4V2Q` | 2026-08-11 | Đếm buổi EP3 giai đoạn 1 |
| 6.1 CountingBoard-EP3 (Mar.26-Aug.26) | `1hOYQ5xzvdKYTbrhgX1xpG11820_AIHM4Qiw1f9EMoR0` | 2026-08-13 | Đếm buổi EP3 giai đoạn 2 |
| 7.0 CountingBoard-M7Pro (Oct.25-May.26) | `11DXSzBst7AaGgq2C2p5nVQuAm6t-LpgC7qkG5FaxGnY` | 2026-08-11 | Đếm buổi M7Pro (file lớn ~1,4 MB) |
| 8.0 CountingBoard-KiW01 (Sep.25-Apr.26) | `19ksWrXG-7ONVG8pNUuGAMekKttrfuJwavPz4gp-nMtc` | 2026-08-11 | Đếm buổi KiW01 (EWIT KIDS?) |
| 9.0 CountingBoard-iME01 | `1BO6J1AXi-EgiHAYHvoFlIPvrKB_BKX7AUBJjZI9X2Bg` | 2026-08-11 | Đếm buổi iME01 (IELTS Mentor) |
| 10.0 CountingBoard-PM2 | `10vPOt8MVdmsGdgw8QOcGGfnqYcgW3pHANnBsgMZNnVI` | 2026-08-11 | Đếm buổi PM2 |
| 11.0 CountingBoard-K20 (Mar.26-May.26) | `1X1OggPER-vOLs17qeW5NUDegAGSWL9O_b5we36vMA_A` | 2026-08-11 | Đếm buổi K20 |
| 12.0 CountingBoard-K21 | `1vexwnzg0vYHLOyWOAyEeJa_BDzCUr1mOTEG5uAwqz6U` | 2026-08-11 | Đếm buổi K21 |
| EF-CountingBoard-IT-Classes | `1Vs40gqw8jVS7Q4dkyFrKpMchTPvsBK_rV6EanolOghw` | 2026-08-12 | Đếm công EF lớp IT |
| EF-PreMentor | `1m7bMu7Kv3VI2B6_xUPBNuyfLxJWAPzf4OlOyEez3xDE` | 2026-08-09 | Danh sách EF lớp Pre-Mentor |
| Report-Counting-Classes | `1pTqqE4cHNRcjowXo6YRCXazPmCfxnzSjxasew7R17-s` | 2026-08-13 | Báo cáo tổng hợp số buổi |
| Report-Counting-EG2-EP3 | `1ar2Nijnp4GIBYmLbY2UHThNBq9VdykvRogLCl3gmO_0` | 2026-08-14 | Báo cáo riêng EG2 + EP3 |
| Update EF | `1DEvVS4QNjBkXyCMy82urJT6rQiNhqyjpHgcM8ZkWbj8` | 2026-08-13 | Cập nhật danh sách EF |

## 4. iME01-Group 6 — `17S5Du6l7549EV5fkRzU5DpuDc2_NdIi6`

[SL] Tài liệu học tập nhóm 6 lớp iME01 (kịch bản luyện nói, bài đọc song ngữ). Không phải dữ liệu hệ thống.

| Tên | ID | Loại | Sửa gần nhất |
|---|---|---|---|
| The Pen Story Editor | `1ALGp2vaXuJlxRs_Fb-ndsDxu_2SL7aCbh5W5yvPmeNo` | doc | 2026-08-18 |
| GROUP 6 - Script (V1).docx | `1ItQNxautYs4B-GtRBRBsvROYUyRCp3nv` | docx | 2026-08-25 |
| GROUP 6 - Script (V2 - Tự nhiên hoá) - Ngắt nhịp | `1GZVkRN0tc_ZYM-CVjJvwhvq8MKWyLKKrjygADlO4IaU` | doc | 2026-08-26 |
| Richness in Virtues | `1dV70BmdNbnMxbPfnLZSvPxgd-0pjAgNRZs5EF3l4W6Q` | doc | 2026-08-28 |
| Person Rich in Virtues - 15min B1 - Hieu chinh theo toc do N | `1UgmORXbBJXYU_Pcno37v-GtnBEwOCla-aRUeGDNxcRw` | doc | 2026-08-28 |
| Person Rich in Virtues - 20min - Rut gon theo toc do N | `10soT8Kl8Zq9kMvq2MRrhwX2EnDzhCQwyqLKLrC1BhH4` | doc | 2026-08-29 |
| GROUP 6 - Script (V1) - Ngắt nhịp luyện nói | `1HWuEfq0T7KEa-ON5spgj1JXhI9GGovzOUjy8iAUWCaA` | doc | 2026-09-07 |
| Richness in Virtues - Bang song ngu EN-VI (ngat nhip) | `1qYqv-S_pku-KoWGtOPjptB0o67hEv9ts6lgStvYfW-g` | doc | 2026-09-10 |
| Topic 12: 9 Types od human beings in one | `1N0-7o2A65O2Uwaf9huwESyy9VnHOszNtoH8qlCMZy10` | doc | 2026-09-22 |

## 5. Thay gân đổi cốt — `16fvJYKnKEBl-6TtsufVygqxGB4xqMb3D`

[SL] Tài liệu nội dung về chương trình rèn luyện sức khỏe "Thay gân đổi cốt" (có thể là chất liệu cho định hướng Human Development Media). Không phải dữ liệu hệ thống.

| Tên | ID | Loại | Sửa gần nhất |
|---|---|---|---|
| 21D-Thay Gân Đổi Cốt/ | `1r8HxGoZWLulBqJHyST4OF6Y4E6JQEc8x` | folder (rỗng) | 2023-12-11 |
| Hành Trình Thay Gân Đổi Cốt - Tập Tài Liệu Hoàn Chỉnh | `1DvKymopd0eWGOr3KWSyxN4MGg7Yf-uPKe-fyCWXAIM8` | doc | 2026-10-21 |
| Hướng dẫn chi tiết 12 động tác Thay Gân Đổi Cốt | `107cSp6TVffBmnRFUA96CxqhQ8604ZgsTFBp2b6wnHmg` | doc | 2026-10-21 |
| Lối Sống Sức Khỏe | `1pCy7IdivLJjiuXMjfxXbcxgdifJRUsomlSCQBe2swdk` | doc | 2026-10-21 |
| Kỳ Tích Chuyển Hóa | `1dOp0o8LAm_Jmqqp1UxU9lqzhnqjhw8DPHL7z_9pAVDs` | doc | 2026-10-21 |
| Thay Gân Đổi Cốt | `1bNBj6z1pY7JkXvIv6IzjMpCibcfjq7ECyb1HbZJ66Os` | doc | 2026-10-21 |
| Cội Nguồn Sức Mạnh | `1pOwa5PURwqufGtppfLP9oR7AdR_TOey0o7_zwWbeTMM` | doc | 2026-10-21 |
| Cẩm Nang Thay Gân | `1UhMUn74OiM95lSOZuJj2p9h4ZYxzmoRYRUosFO3kSe8` | doc | 2026-10-21 |
| Hành Trình Thay Gân Đổi Cốt - Đại Thư Cẩm Nang 5 Phần Completing Draft | `1LTzapT9wvEm7Tofh1R4qPX1GRst6V4TTjc95TG-IFPI` | doc | 2026-10-21 |

## 6. Lối tắt ở gốc EWIT-WORK

| Lối tắt | ID lối tắt | Tạo | Đích | Vai trò |
|---|---|---|---|---|
| ChatGPT Connector | `1licwpibrb3Qpp9U593msFzXySCGqyVio` | 2026-08-18 | chưa xác định | [S] Hệ điểm danh & phòng thi cũ (chỉ đọc) |
| I-MENTOR E-WIT | `19NgT-Z9bEa4XPZ6zRQE2bzQLG2C4nAk` | 2026-03-11 | chưa xác định | [SL] Thư mục chung nhánh IELTS Mentor |
| E-WiT ENLISH IN MIND | `1Efg2Pn4ueYGa1MALYFgwcobzpEfdQQb5` | 2026-03-11 | chưa xác định | [SL] Thư mục chung của trung tâm / lõi English In Mind |
| Wisdom Three | `1JRaGSUj8BefuvPq0dW-mLuAb07km00o` | 2026-03-11 | chưa xác định | Chưa đủ dữ liệu để kết luận |

## Giới hạn & việc cần Nery hỗ trợ

1. **Đích lối tắt**: connector hiện tại không lộ `shortcutDetails.targetId`. Hai cách giải quyết (cần Nery chọn):
   - Nery gửi ID/link thư mục đích của 5 lối tắt → ghi vào `CLAUDE.md`, duyệt tiếp bằng `parentId`.
   - Hoặc thiết lập Drive API riêng (service account / `rclone`) đọc được `shortcutDetails` — xem báo cáo phiên khởi tạo.
2. Chưa đọc nội dung file nào (trừ tên tab của 3 file nấc 1). Mô tả [SL] cần xác nhận khi đọc nội dung.
