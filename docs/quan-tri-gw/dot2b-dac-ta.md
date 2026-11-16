# Shared Drive Board v2 · Đợt 2b — đặc tả đã chốt (16/11/2026)

> Đọc trước: `shareddrive-board.md` (phương án), `dot2-dac-ta.md` (hợp đồng Đợt 2–3). Mã: `apps-script/shareddrive-board/`.
> **Bảng chính thức**: `19avp1IU1SKRW8yN6sXWZi93yOeqAd31RhwTgyNE8sm4` (admin@ sở hữu; tnho113 tạm có quyền sửa để Claude ghi trực tiếp, xong việc admin hạ về Xem).
> **CẤM bấm Áp dụng trên bảng mới trước khi xong mục 0** (Xem trước đang báo sẽ tạo trùng 50 thư mục).

## 0. GẤP — nhãn thư mục không đọc được sau khi chép bảng
- [ST] `appProperties` chỉ ứng dụng đã gắn đọc được; bản sao bảng = dự án Apps Script mới → không thấy nhãn cũ → Xem trước báo tạo lại 50 thư mục, +10 lối tắt.
- Sửa: dùng `properties` (công khai) thay `appProperties` ở 30_Drive, 50_Quet (và mọi truy vấn `appProperties has` → `properties has`). Thêm **nhận lại theo tên**: thư mục chưa có nhãn nhưng đúng tên + đúng thư mục cha (ổ gốc/ổ cá nhân đã biết ID) → gắn `properties` rồi dùng; lối tắt chưa có nhãn trong ổ cá nhân mà đúng cha + đúng đích → gắn nhãn. Kiểm thử: dự án mới (không đọc được appProperties cũ) chạy lại không tạo trùng.

## 1. Chạy theo lượt có con trỏ (lỗi D1 của chuyên gia)
- Hiện "chạy tiếp" = chạy lại từ đầu cả Nhóm lẫn Drive (`30_Drive.gs` ~67,99-108; `25_Nhom.gs` ~62-70) → 200–300 người có thể không bao giờ xong.
- Sửa: lưu con trỏ (PropertiesService) theo giai đoạn: nhóm → ổ gốc/thư mục → từng người (ổ cá nhân) → đối soát quyền; lượt sau tiếp từ con trỏ. Thêm "dấu thay đổi": băm trạng thái THANH_VIEN/NGUOI/NHOM/CAU_TRUC liên quan mỗi người; người không đổi thì bỏ qua (trừ lần chạy đầy đủ hằng đêm, có thể chọn).
- Thêm lịch **Áp dụng hằng đêm** (menu bật/tắt), Áp dụng tay vẫn có.

## 2. Mã hệ thống + nhóm riêng theo người
- Cột **"Mã hệ thống"** ở NGUOI (và THANH_VIEN, LS_NHAP nếu cần): script tự sinh `U00001`… khi tạo người, không bao giờ đổi. **Mã người** (mã EWIT) chỉ để hiển thị, không bắt buộc.
- Nhóm riêng `sd-u-<mã hệ thống thường>@miền` (vd `sd-u-u00001@`), thành viên = email hiện tại của người đó. Mọi quyền "theo người" cấp qua nhóm này (RAW_NG, WIKI_NG + Sửa từng tệp Wiki, HS_NG, HS_NOP, tệp nhật ký, thư mục 00_TAI-LIEU-CUA-TOI) → "Được chia sẻ với tôi" trống ([ST] đã thử: quyền qua nhóm không hiện ở đó; quyền trực tiếp thì hiện).
- Thư mục theo người nhận diện bằng Mã hệ thống (`properties.sdma`, `sdma_u`), không bằng email.

## 3. Ổ cá nhân
- Chủ ổ = **Người đóng góp (writer) cả ổ**. **Bỏ `90_CA-NHAN`** (CN_CA_NHAN) và gỡ quyền Sửa trực tiếp cũ ở thư mục đó.
- HV: trong Hồ sơ học tập (HS_NG) thêm thư mục **`00_TAI-LIEU-CUA-TOI`** (dòng CAU_TRUC mới, ví dụ `HS_TL`, `{người}/00_TAI-LIEU-CUA-TOI`): HV writer qua nhóm riêng; người phụ trách nhóm nhỏ KHÔNG có quyền ở đây; được giữ khi HV nghỉ. HS_NG gốc vẫn chỉ Xem (để còn khóa thư mục nộp bài khi lớp Kết thúc).
- EF/GV: tải lên ngay trong ổ của mình (Giữ ổ khi nghỉ).
- **Thu ổ** (50_Quet ~397-425): cứu MỌI tệp/thư mục trong ổ (trừ lối tắt có nhãn) trước khi xóa: HV → `HS_NG/00_TAI-LIEU-CUA-TOI/Từ ổ cá nhân <ngày>`; không có HS_NG → `QT_SL/<tên ổ>`. Lỗi chuyển bất kỳ → giữ ổ.

## 4. Nhập liệu (20_ThanhVien + công thức Tình trạng)
- Cột **Việc** thêm: **"Sửa thông tin"** (ô nào ghi thì đổi: Họ tên, Mã người, Vai trò; trống = giữ) và **"Đổi email"** (cột mới **"Email mới"** ở cuối NHAP; đổi email ở NGUOI/THANH_VIEN, nhóm riêng đổi thành viên, mọi nhóm sd- đổi thành viên; ổ/hồ sơ giữ nguyên). Cùng menu "Đưa vào danh sách tổng".
- Dòng **Thêm** KHÔNG được đổi Họ tên/Vai trò/Mã người của người cũ: nếu ghi khác → Tình trạng "⚠ khác thông tin đã có — dùng Việc 'Sửa thông tin'"; script bỏ qua phần khác (vẫn thêm nhóm) và ghi chú.
- Tình trạng báo thêm: email sai định dạng; dòng trùng trong NHAP; hệ quả tự động (vd "sẽ rời Level L3", "sẽ tự vào lớp ME02").
- NHOM thêm cột **"Thứ tự"** cho Level (bậc không phụ thuộc thứ tự dòng). 15_DuLieu.dsLevel_ sắp theo cột này.
- Lệnh **"Nâng cấp bảng"** (menu Quét & dọn dẹp hoặc Cài đặt): tự thêm cột/tab còn thiếu (Mã hệ thống, Email mới, Thứ tự, dòng CAU_TRUC HS_TL, bỏ CN_CA_NHAN) để không cần sửa bảng tay.
- Sửa HUONG_DAN theo Đợt 2b (nhập, Áp dụng, chờ 30 phút, không bấm Request access).

## 5. Lỗi nhỏ
- Người vừa EF vừa HV: vai trò chính quyết định khuôn ổ, nhưng mọi nguồn lối tắt theo nhóm thực tế (EF đi học có lối tắt lớp + Hồ sơ học tập). Có thể cho Vai trò nhiều giá trị hoặc suy từ THANH_VIEN.
- Lớp **Đóng** không tính là "còn nhóm" trong coOCaNhan_.
- Kiểm tra trùng email nhóm (vd mã `ME02-PT` đụng `sd-me02-pt`) → báo LỖI ở NHOM.
- **Thư chào gửi sau ~60 phút** (hàng đợi trong PropertiesService + lượt hẹn giờ), nội dung chốt:
  Tiêu đề: "Ổ làm việc của bạn trên {Tên hiển thị} đã sẵn sàng". Thân: chào {Họ tên}; tên ổ + link; mở Drive → Bộ nhớ dùng chung; lối tắt dẫn tới mọi tài liệu; nếu lối tắt báo cần quyền thì ĐỪNG bấm Request access, đợi tối đa 30 phút rồi tải lại; HV: bài nộp và tài liệu đặt trong Hồ sơ học tập; cần hỗ trợ thì trả lời thư.
- Thư chào lần thử trước ghi "Đã gửi" nhưng Nery chưa thấy → nhờ Nery kiểm Thư rác/Quảng cáo; cân nhắc GmailApp để có bản trong Hộp thư đã gửi của admin.

## 6. Báo cáo chia sẻ lạ (C + A2; A1 để sau)
- "Chia sẻ lạ" = quyền trên tệp/thư mục ở ổ gốc KHÔNG do script cấp (vd tnho113 có quyền Sửa ở KIND tự chia sẻ PDF cho neryewit — [ST] Drive cho phép, chỉ cảnh báo).
- Quét thêm tab **CHIA_SE_LA** trong "SD · Báo cáo" (hoặc tab trên Board): Ổ | Đường dẫn | Tệp | Link | Người/nhóm được chia sẻ | Quyền | **Gỡ** (ô tích). Lệnh **"Gỡ chia sẻ đã đánh dấu"**. Không tự gỡ.
- A1 (tự gỡ hằng đêm, miễn trừ theo VAI_TRO) chỉ làm khi thử được Drive Activity API/Reports API để biết ai đã chia sẻ.

## Thứ tự làm đề xuất
0 → 2 → 3 → 1 → 4 → 5 → 6. Có thể song song: (0+2+3 trong 30_Drive/50_Quet) · (4 trong 20_ThanhVien + công thức) · (6 trong 50_Quet sau khi 0 xong). Mỗi phần có kiểm thử giả lập; giả lập Drive phải mô phỏng appProperties riêng theo dự án và properties công khai.
