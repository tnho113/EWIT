# MLWIT · Shared Drive Board — Phương án đã chốt (bộ nhớ cho Claude)

> Cập nhật 15/11/2026. Nery không đọc file .md: hướng dẫn cho Nery luôn đưa qua chat/Google Docs (WD-21).
> Dự án quản trị Google Workspace MLWIT (`mlwit.edu.vn`, 1 giấy phép admin@, Business Standard 2 TB pooled).
> Bối cảnh Toolkit cũ: Drive `Tool_Quan_Tri` (1lOGmN_VGUs0mf9J7G8DiwJ5G-CNpSY7_), file `HANDOFF-QUAN-TRI-GW.md` (1eGZA4V6ANtHbuik2T9D1zTIMZAoQbpfu).

## 1. Quyết định (WD-23)
- **Mô hình mới, độc lập hoàn toàn với Toolkit cũ**: mỗi người (EF, GV, HV) một ổ dùng chung mang tên mình; tài liệu gốc nằm ở các ổ gốc (chỉ admin@ là thành viên); quyền cấp ở thư mục gốc cho **Google Group do script tạo** (tiền tố `sd-`); người dùng thấy tài liệu qua **lối tắt** trong ổ của mình. Quyền còn thì lối tắt còn; quyền hết thì lối tắt bỏ (lớp Đóng / tắt chia sẻ → bỏ lối tắt).
- Nery sẽ tự xóa ổ + nhóm cũ để làm sạch. Trước đó phải **tắt trình kích hoạt của Toolkit cũ** (nếu không, Áp dụng hằng đêm tạo lại).
- **Ổ gốc**: MLWIT · Quản trị (admin, Board, báo cáo, MẪU) · MLWIT · Dữ liệu học viên (chỉ nhóm Dữ liệu) · MLWIT · Tri thức – Raw · MLWIT · Tri thức – Wiki · EWIT · Thông tin chung (EF/, HOC-VIEN/) · EWIT · Thư viện EF (Candidate→L3→L2→L1→TOR→Pioneer, cấp cao xem cấp thấp) · EWIT · Dự án & Ban (khung 10_KE-HOACH, 20_TAI-LIEU, 30_SAN-PHAM, 40_BIEN-BAN-HOP) · EWIT · Lớp học (nhánh → lớp → VIDEO, TAI-LIEU).
- **Ổ cá nhân**: EF/GV: lối tắt Thông tin chung, 10_CAP-BAC (GV không có), 20_DU-AN, 30_LOP-PHU-TRACH (tải video), 40_HOC-VIEN-PHU-TRACH/<nhóm nhỏ>, 90_CA-NHAN. HV: lối tắt Thông tin HV, 10_LOP-DANG-HOC, 11_LOP-DA-HOC, 20_NOP-BAI/<lớp> (HV tải lên khi Đang học; người phụ trách nhóm nhỏ: nhận xét), 90_CA-NHAN. HV học nhiều lớp song song: mỗi lớp một lối tắt + một thư mục nộp.
- **Cấu trúc động**: tab `CAU_TRUC` (Mã cố định · Ổ · Đường dẫn · Loại: Thư mục / Lối tắt / Chỗ đặt lối tắt / Tệp mẫu · Nội dung/Nguồn · Chủ ổ được). Script nhận thư mục qua appProperties (mã), không qua tên → sửa đường dẫn = đổi tên/chuyển chỗ; xóa dòng = chỉ báo "ngoài cấu hình", không xóa. Luật "ai thấy gì" là danh sách nguồn cố định trong script (Cấp bậc, Dự án tham gia, Lớp đang học, Lớp đã học, Lớp phụ trách, Học viên phụ trách, Nộp bài theo lớp).
- **Thành viên**: tab `NHAP` (admin nhập trước; sau này tách thành file nhập riêng cho người phụ trách) → menu "Đưa vào danh sách tổng" → tab `THANH_VIEN` (gốc) → menu "Áp dụng lên Drive". Trùng hoàn toàn: bỏ qua; khác nhóm/dự án: thêm dòng; **cùng email + cùng nhóm, khác quyền: cập nhật dòng cũ, ghi lịch sử**. NHAP có cột Tình trạng (công thức tra THANH_VIEN). Tab `XEM_NHOM`: chọn nhóm → FILTER danh sách.
- **Nhật ký trưởng thành** (lộ trình học tập do người dùng tự ghi, KHÔNG phải dữ liệu cá nhân): tệp mẫu ở Quản trị/MAU, script chép vào mỗi ổ cá nhân nếu chưa có, không ghi đè. Mặc định: chủ ổ sửa, người phụ trách nhóm nhỏ xem + nhận xét. **Chờ Nery gửi mẫu.**
- **Dữ liệu cá nhân**: chỉ ở ổ Dữ liệu học viên, nhóm Dữ liệu (người phụ trách được cấp), như Toolkit. Trẻ em (EWIT KIDS): chưa thu cho đến khi có quy trình đồng ý của giám hộ.
- **Giới hạn dung lượng ổ cá nhân**: chỉ đặt được trong Admin console theo OU (Business Standard có), áp cho cả ổ. Phương án: OU "Ổ cá nhân" có hạn mức; đưa ổ vào OU (thử API, không được thì làm hàng loạt trong console); script báo ổ > 80%.
- **Tri thức Raw/Wiki (giai đoạn đầu chỉ người đồng ý tham gia)**: sự đồng ý đã có qua Form đăng ký lưu ở ổ Dữ liệu → bảng không cần cột đồng ý. Loại dòng CAU_TRUC mới **"Thư mục theo người"**: thành viên nhóm RAW → thư mục `{Mã} · {Họ tên}` trong ổ Raw, quyền Người đóng góp cả thư mục, lối tắt `05 · Tri thức Raw` trong ổ cá nhân; nhóm WIKI → thư mục tương tự trong ổ Wiki, thư mục chỉ Xem, script cấp **Sửa trên từng tệp** (không tải lên được), lối tắt `06 · Tri thức Wiki`. Nhận thư mục qua appProperties gắn email. Gỡ: gỡ quyền + bỏ lối tắt, giữ thư mục. Tệp vào thư mục Wiki do **admin và quy trình AI** đặt (cần quyền quản lý nội dung ở ổ Wiki). Khuyến khích tài liệu chữ; Drive không chặn loại tệp → script báo audio/video/tệp lớn trong ổ Raw. **Các ổ không cho chia sẻ ra ngoài**: đặt `sharingFoldersRequiresOrganizerPermission` + cấu hình Admin console chặn người có quyền sửa đổi quyền/chia sẻ (cần thử thật cho người không phải thành viên ổ được Sửa từng tệp).
- Hoàng Minh (offline): mặc định làm EWIT trước; thêm cột "Thương hiệu" sau, không làm lại.

## 2. Hiện trạng
- Bản thử v1 (1 ổ gốc, cấp quyền từng người, chưa có CAU_TRUC/nhóm): bảng `MLWIT-SharedDrive-Board` 15DvLmbVA9nqAe1TMggy4KYtdxNPXoadcVhZvYlGNXO8; script `Tool_Quan_Tri/shareddrive-kit/SharedDrive.gs` (1sQPzWs3YoSrY8TYC9dPfWeMJqmgjy7u_); kiểm thử giả lập `kiem-thu.js` 9/9 đạt. **Chưa chạy trên Google thật.** Bảng đang do Gmail cá nhân của Nery sở hữu → khi dùng thật, admin@ tạo bản sao để làm chủ.
- Bản v2 (theo mục 1): **chưa xây**, chờ Nery cho bắt đầu.

## 3. Cần thử thật (chưa kiểm chứng)
- Gỡ quyền trực tiếp ở thư mục khi người đó còn quyền thừa kế từ ổ (đã có phương án hạ về Xem).
- Tổ chức có cho Gmail ngoài làm thành viên ổ dùng chung qua API.
- Mục "Được chia sẻ với tôi" có hiện thư mục được cấp quyền không; hiển thị lối tắt trên app Drive điện thoại.
- Chuyển ổ dùng chung vào OU bằng API.
- Menu Apps Script không chạy trên app Sheets điện thoại (đồng thuận cộng đồng) → nhập được trên điện thoại, chạy trên máy tính hoặc lịch hằng đêm.
