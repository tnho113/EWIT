# MLWIT · Shared Drive Board — Phương án đã chốt (bộ nhớ cho Claude)

> Cập nhật 15/11/2026. Nery không đọc file .md: hướng dẫn cho Nery luôn đưa qua chat/Google Docs (WD-21).
> Dự án quản trị Google Workspace MLWIT (`mlwit.edu.vn`, 1 giấy phép admin@, Business Standard 2 TB pooled).
> Bối cảnh Toolkit cũ: Drive `Tool_Quan_Tri` (1lOGmN_VGUs0mf9J7G8DiwJ5G-CNpSY7_), file `HANDOFF-QUAN-TRI-GW.md` (1eGZA4V6ANtHbuik2T9D1zTIMZAoQbpfu).

## 1. Quyết định (WD-23)
- **Mô hình mới, độc lập hoàn toàn với Toolkit cũ**: mỗi người (EF, GV, HV) một ổ dùng chung mang tên mình; tài liệu gốc nằm ở các ổ gốc (chỉ admin@ là thành viên); quyền cấp ở thư mục gốc cho **Google Group do script tạo** (tiền tố `sd-`); người dùng thấy tài liệu qua **lối tắt** trong ổ của mình. Quyền còn thì lối tắt còn; quyền hết thì lối tắt bỏ (lớp Đóng / tắt chia sẻ → bỏ lối tắt).
- Nery sẽ tự xóa ổ + nhóm cũ để làm sạch. Trước đó phải **tắt trình kích hoạt của Toolkit cũ** (nếu không, Áp dụng hằng đêm tạo lại).
- **Ổ gốc**: MLWIT · Quản trị (admin, Board, báo cáo, MẪU) · MLWIT · Dữ liệu học viên (chỉ nhóm Dữ liệu) · MLWIT · Tri thức – Raw · MLWIT · Tri thức – Wiki · EWIT · Thông tin chung (EF/, HOC-VIEN/) · EWIT · Thư viện EF (Candidate→L3→L2→L1→TOR→Pioneer, cấp cao xem cấp thấp) · EWIT · Dự án & Ban (khung 10_KE-HOACH, 20_TAI-LIEU, 30_SAN-PHAM, 40_BIEN-BAN-HOP) · EWIT · Lớp học (nhánh → lớp → VIDEO, TAI-LIEU).
- **Ổ cá nhân**: EF/GV: lối tắt Thông tin chung, 10_CAP-BAC (GV không có), 20_DU-AN, 30_LOP-PHU-TRACH (tải video), 40_HOC-VIEN-PHU-TRACH/<nhóm nhỏ>, 90_CA-NHAN. HV: lối tắt Thông tin HV, 10_LOP-DANG-HOC, 11_LOP-DA-HOC, lối tắt `20 · Nộp bài` (thư mục của HV ở ổ Nộp bài, xem dòng dưới), 05/06 Tri thức (nếu tham gia), Nhật ký trưởng thành, 90_CA-NHAN. HV học nhiều lớp song song: mỗi lớp một lối tắt + một thư mục nộp.
- **Cấu trúc động**: tab `CAU_TRUC` (Mã cố định · Ổ · Đường dẫn · Loại: Thư mục / Lối tắt / Chỗ đặt lối tắt / Tệp mẫu · Nội dung/Nguồn · Chủ ổ được). Script nhận thư mục qua appProperties (mã), không qua tên → sửa đường dẫn = đổi tên/chuyển chỗ; xóa dòng = chỉ báo "ngoài cấu hình", không xóa. Luật "ai thấy gì" là danh sách nguồn cố định trong script (Cấp bậc, Dự án tham gia, Lớp đang học, Lớp đã học, Lớp phụ trách, Học viên phụ trách, Nộp bài theo lớp).
- **Thành viên**: tab `NHAP` (admin nhập trước; sau này tách thành file nhập riêng cho người phụ trách) → menu "Đưa vào danh sách tổng" → tab `THANH_VIEN` (gốc) → menu "Áp dụng lên Drive". Trùng hoàn toàn: bỏ qua; khác nhóm/dự án: thêm dòng; **cùng email + cùng nhóm, khác quyền: cập nhật dòng cũ, ghi lịch sử**. NHAP có cột Tình trạng (công thức tra THANH_VIEN). Tab `XEM_NHOM`: chọn nhóm → FILTER danh sách.
- **Nhật ký trưởng thành** (lộ trình học tập do người dùng tự ghi, KHÔNG phải dữ liệu cá nhân): tệp mẫu ở Quản trị/MAU, script chép vào mỗi ổ cá nhân nếu chưa có, không ghi đè. Mặc định: chủ ổ sửa, người phụ trách nhóm nhỏ xem + nhận xét. **Chờ Nery gửi mẫu.**
- **Dữ liệu cá nhân**: chỉ ở ổ Dữ liệu học viên, nhóm Dữ liệu (người phụ trách được cấp), như Toolkit. Trẻ em (EWIT KIDS): chưa thu cho đến khi có quy trình đồng ý của giám hộ.
- **Giới hạn dung lượng ổ cá nhân**: chỉ đặt được trong Admin console theo OU (Business Standard có), áp cho cả ổ. Phương án: OU "Ổ cá nhân" có hạn mức; đưa ổ vào OU (thử API, không được thì làm hàng loạt trong console); script báo ổ > 80%.
- **Tri thức Raw/Wiki (giai đoạn đầu chỉ người đồng ý tham gia)**: sự đồng ý đã có qua Form đăng ký lưu ở ổ Dữ liệu → bảng không cần cột đồng ý. Loại dòng CAU_TRUC mới **"Thư mục theo người"**: thành viên nhóm RAW → thư mục `{Mã} · {Họ tên}` trong ổ Raw, quyền Người đóng góp cả thư mục, lối tắt `05 · Tri thức Raw` trong ổ cá nhân; nhóm WIKI → thư mục tương tự trong ổ Wiki, thư mục chỉ Xem, script cấp **Sửa trên từng tệp** (không tải lên được), lối tắt `06 · Tri thức Wiki`. Nhận thư mục qua appProperties gắn email. Gỡ: gỡ quyền + bỏ lối tắt, giữ thư mục. Tệp vào thư mục Wiki do **admin và quy trình AI** đặt (cần quyền quản lý nội dung ở ổ Wiki). Khuyến khích tài liệu chữ; Drive không chặn loại tệp → script báo audio/video/tệp lớn trong ổ Raw. **Các ổ không cho chia sẻ ra ngoài**: đặt `sharingFoldersRequiresOrganizerPermission` + cấu hình Admin console chặn người có quyền sửa đổi quyền/chia sẻ (cần thử thật cho người không phải thành viên ổ được Sửa từng tệp).
- **Chia sẻ theo vai trò (15/11)**: hạn chế đặt theo từng ổ cá nhân. Tab `VAI_TRO` (Vai trò | Được chia sẻ). Mặc định **Có**: Pioneer, GV, vai trò tổ chức (BTC, IT…); **Không**: HV, Candidate, L3, L2, L1, TOR. Ổ "Không" → `driveMembersOnly=true` (không gian kín). Đổi vai trò/cấp → script mở/khóa lại.
- **Bài nộp chuyển sang ổ gốc `EWIT · Nộp bài`** (thư mục theo người `{Mã} · {Họ tên}/<mã lớp>/`); ổ HV có lối tắt `20 · Nộp bài`. Người phụ trách nhóm nhỏ (nhóm `sd-pt-<nhóm nhỏ>`) chỉ được cấp Nhận xét trên thư mục lớp của đúng HV trong nhóm mình; không là thành viên ổ Nộp bài nên không duyệt/thấy bài của nhóm khác.
- **Quét toàn Drive + đề xuất dọn dẹp**: menu riêng, chạy tay; phạm vi mọi ổ dùng chung của tổ chức + Drive admin@; kết quả ghi file riêng "SD · Báo cáo" trong ổ Quản trị (cây, thống kê, ngoài cấu hình, tệp lớn/cũ/trùng, thư mục rỗng, link công khai, audio/video trong Raw, ổ > 80%); dùng lại logic 60_BaoCao.gs; tự hẹn chạy tiếp khi hết giờ rồi tự xóa lịch.
- **Menu**: Thành viên › Đưa vào danh sách tổng · Drive › Xem trước / Áp dụng · Quét & dọn dẹp › Quét toàn Drive / Mở báo cáo / Xem trước thu ổ / Thu ổ người nghỉ.
- Hoàng Minh (offline): mặc định làm EWIT trước; thêm cột "Thương hiệu" sau, không làm lại.

## 1b. Hiệu chỉnh sau đánh giá chuyên gia (15/11, Nery chốt)
- Đánh giá đầy đủ: scratchpad `danh-gia-mo-hinh-moi.md` (phiên cloud 15/11; có thể mất khi container bị thu hồi).
- **Ổ `EWIT · Nộp bài` đổi thành `EWIT · Hồ sơ học tập`**: mỗi người một thư mục gồm bài nộp theo lớp + **Nhật ký trưởng thành** (chuyển khỏi ổ cá nhân vì ổ cá nhân khóa kín thì người phụ trách không vào được). Nhật ký xử lý như **dữ liệu cá nhân**; điều khoản đồng ý gắn vào Form đăng ký.
- **Mô hình nhóm thống nhất**: tab `NHOM` (mỗi dòng = cấp/lớp/nhóm nhỏ/dự án/ban/tri thức/dữ liệu… = 1 Google Group + 1 chỗ trên Drive; có cột Thương hiệu). Tab `NHAP` là sổ việc (Email · Họ tên · Mã nhóm · Vai: Thành viên/Phụ trách · Quyền · Thêm/Gỡ/Nghỉ). **Bỏ tab PHU_TRACH.** NGUOI, THANH_VIEN ẩn, script ghi. Email mới lần đầu ở NHAP → tự tạo người.
- **Menu giữ bước riêng** "Đưa vào danh sách tổng" (menu riêng), rồi Drive › Xem trước / Áp dụng (có bảng tóm tắt).
- **Bỏ hạn mức dung lượng trong bảng** (Nery chốt: script không đặt được hạn mức cứng → không thêm cột cho bớt nhập). Nếu cần thì đặt OU trong Admin console. Báo cáo quét vẫn liệt kê dung lượng từng ổ.
- **Người nghỉ**: HV nghỉ → **thu ổ cá nhân** (dữ liệu chính ở ổ gốc): gỡ thành viên, chuyển tệp `90_CA-NHAN` (nếu có) sang thư mục người đó ở Hồ sơ học tập, bỏ lối tắt, xóa ổ rỗng. Đây là ngoại lệ của quy tắc "không xóa", chạy bằng lệnh riêng **trong menu Quét & dọn dẹp** (Xem trước thu ổ · Thu ổ người nghỉ, hỏi xác nhận). Cột "Khi nghỉ" theo vai trò (mặc định HV: Thu ổ; EF/GV: Giữ ổ, khóa).
- **Ổ cá nhân chỉ tạo khi có thành viên mới**, không tạo sẵn.
- Nhóm `sd-…`: script đặt không ai gửi thư vào được, chỉ quản lý xem danh sách. Script gửi **thư chào** kèm link ổ khi tạo ổ. Chạy tiếp nhiều lượt (6 phút/lượt), chỉ xử lý dòng thay đổi.
- Khi HV tăng: đề nghị mua thêm giấy phép (mỗi giấy phép Business Standard cộng thêm dung lượng chung, có thêm tài khoản quản trị dự phòng).
- Thử đầu tiên khi chạy thật: người có quyền Sửa (không phải thành viên ổ gốc) có chia sẻ tiếp từng tệp được không.

## 1c. Điều chỉnh khi thử Đợt 1 (15/11)
- **"Cấp" của EF đổi thành "Level"** ở mọi nơi (NHOM.Loại = Level, NGUOI.Level, VAI_TRO, CAU_TRUC `10_LEVEL`, thông báo).
- **NHAP luôn trống**: sau khi chạy, dòng ✔ chuyển sang tab `LS_NHAP` (lịch sử nhập) và bị xóa khỏi NHAP; dòng lỗi ở lại (dồn lên đầu), cột **"Lỗi"** (thay "Kết quả") ghi lý do. Bỏ cơ chế dấu vân tay/cột "Mã xử lý".
- Cột **Tình trạng** (ARRAYFORMULA + LET ở NHAP!J1) kiểm tra trước: thiếu Mã nhóm, nhóm không có, nhóm Đóng/Ngừng, người mới thiếu Họ tên/Vai trò, Level chỉ cho EF, nhóm không có vai Phụ trách, khác quyền/vai, đã có/chưa đưa vào. Lưu ý: tên biến LET dùng dạng `vEmail`…; đếm ngoặc trước khi ghi công thức dài.

## 1d. Chế độ Giả lập / Chạy thật (Nery duyệt 16/11)
- CAI_DAT "Chế độ" = Giả lập | Chạy thật (`90_GiaLap.gs`, menu Giả lập). Giả lập: tạo thật, tên ổ có `[THỬ]`, thư chào `[THỬ]`, mọi ổ/nhóm script tạo ghi vào tab ẩn `_GIA_LAP`. "Dọn sạch giả lập" (gõ XOA HET): xóa mọi ổ (kể cả 9 ổ gốc — Nery chốt xóa hết) và nhóm trong sổ, làm trống NGUOI/THANH_VIEN/LS_NHAP/NHAP + cột ID, xóa dấu vết script; giữ NHOM/CAU_TRUC/VAI_TRO.
- Khóa: sang Chạy thật chỉ khi sổ trống; sang Giả lập chỉ khi bảng chưa có người/ID ổ; "Nhận hiện trạng vào giả lập" (gõ GIA LAP) chỉ khi chưa từng ghi "Chạy thật"; không xóa ổ chứa Board.
- Kế hoạch: nhận hiện trạng (3 Gmail thử + 9 ổ gốc hiện có) → thử 18 tình huống với 5 Gmail → buổi chạy thử với BTC bằng email thật của họ → Dọn sạch → Chuyển sang Chạy thật → nhập dữ liệu chính thức.
- Đã biết (thử thật 16/11): "Được chia sẻ với tôi" vẫn có thể hiện mục cấp qua nhóm → không bảo đảm trống; hướng dẫn người dùng làm việc trong ổ của mình, Remove from view nếu muốn. 90_CA-NHAN cũ script không xóa (admin xóa tay).

- 16/11: đã Nhận hiện trạng (23 mục trong sổ), đổi tên 12 ổ thêm [THỬ]. Tab `KIEM_THU` trên bảng: checklist 20 bước với 5 Gmail thử (E1 tnho113 EF, E2 neryewit GV, E3 ewitenglishai HV, E4 ewit.edu.vn@gmail.com HV mới, E5 ewitefc@gmail.com email mới của E4); NHOM thêm PA03, PA03-01 để thử.

## 2. Hiện trạng
- **Bảng chính thức từ 15/11/2026 (admin@ sở hữu)**: `19avp1IU1SKRW8yN6sXWZi93yOeqAd31RhwTgyNE8sm4` (thư mục Tool_Quan_Tri). Bảng cũ `15DvLmbVA9nqAe1TMggy4KYtdxNPXoadcVhZvYlGNXO8` (Gmail Nery sở hữu) chỉ còn để tham chiếu, không chạy menu. Claude chỉ có quyền XEM bảng mới → thay đổi cấu trúc bảng (cột/tab) phải do script tự làm (lệnh nâng cấp bảng) hoặc Nery mở quyền sửa tạm.
- **Mã hệ thống** (vd `U00001`, script tự sinh, không đổi) là khóa nội bộ (nhóm riêng `sd-u-<mã hệ thống>`); **Mã người** (mã EWIT) chỉ để hiển thị, không bắt buộc (Nery chốt 15/11).
- Bản thử v1 (1 ổ gốc, cấp quyền từng người, chưa có CAU_TRUC/nhóm): bảng `MLWIT-SharedDrive-Board` 15DvLmbVA9nqAe1TMggy4KYtdxNPXoadcVhZvYlGNXO8; script `Tool_Quan_Tri/shareddrive-kit/SharedDrive.gs` (1sQPzWs3YoSrY8TYC9dPfWeMJqmgjy7u_); kiểm thử giả lập `kiem-thu.js` 9/9 đạt. **Chưa chạy trên Google thật.** Bảng đang do Gmail cá nhân của Nery sở hữu → khi dùng thật, admin@ tạo bản sao để làm chủ.
- **Bản v2 · Đợt 1 (15/11) xong phía Claude**: cùng bảng `MLWIT-SharedDrive-Board` (đã bỏ tab v1), tab: HUONG_DAN, NHAP (cột Tình trạng = ARRAYFORMULA ở J1), NHOM, XEM_NHOM (QUERY theo nhóm/email), THANH_VIEN, NGUOI, VAI_TRO, CAU_TRUC (51 dòng mặc định, dùng từ Đợt 2), CAI_DAT, NHAT_KY. Script 3 tệp trên Drive `Tool_Quan_Tri/shareddrive-kit/v2 (Board mới)` (00_Menu 1cbD5OL8GtkxTohqDQI1cs84o_ig-jfKM, 10_Chung 1dazzYJDxHY31KBBFL8qRh3MXGoPqAZfV, 20_ThanhVien 1DtoK8W5SdGmfIFdaFv61KsOhMGiK-weH); bản sao trong repo `apps-script/shareddrive-board/`; kiểm thử 10/10. Dòng NHAP đã xử lý có dấu ✔ ở Kết quả, xóa ô để chạy lại. **Nery đã thử trên Google thật 15/11: bước 1–7 ĐẠT** (người mới, tự vào lớp, cập nhật quyền + lịch sử, đổi Level, chuyển nhóm nhỏ, dòng lỗi ở lại, XEM_NHOM).
- **Đợt 2 + 3 code xong (15/11)**, theo đặc tả `docs/quan-tri-gw/dot2-dac-ta.md`; 3 phiên phụ song song: `25_Nhom.gs` (Sonnet), `30_Drive.gs` (Opus), `50_Quet.gs` (Sonnet); điều phối viết `15_DuLieu.gs` + `kiem-thu/gia-lap.js`, ghép: menu đủ 3 nhóm lệnh, `chayPhien_(ten, viec, henLai)` tự hẹn lại khi bận, `P.goiTuDrive` để chỉ Drive hẹn chạy tiếp, tiêu đề thư chào lấy CAI_DAT "Tên hiển thị". Kiểm thử giả lập: 11 + 4 + 10 + 17 + 10 = 52 nhóm ĐẠT. **Chưa chạy trên Google thật.** Cần thử thật: fileOrganizer cấp thư mục, chuyển thư mục giữa 2 ổ khi thu ổ, Gmail ngoài vào ổ/nhóm qua API, sendNotificationEmail=false khi thêm thành viên ổ, người Sửa ở ổ gốc có chia sẻ tiếp được không.

## 2b. Kết quả thử thật Đợt 2 (15/11, 3 Gmail thử)
- Áp dụng tạo đúng 9 ổ gốc, 50 thư mục, 3 ổ cá nhân, 10 lối tắt, 3 thư chào. Nhóm: lỗi NONE_CAN_POST (Google đòi archiveOnly → đổi ALL_MANAGERS_CAN_POST) và "Resource Not Found: groupKey" ngay sau khi tạo nhóm (thêm chờ/thử lại 3 lần); lần 2 không lỗi; cài đặt nhóm đúng (Allow external = Yes).
- Cần cấp lại quyền script sau khi bật dịch vụ nâng cao (myaccount.google.com/permissions → Delete all → chạy hàm trong editor).
- **Quyền qua nhóm có hiệu lực chậm (vài chục phút)**; giao diện Drive giữ trạng thái cũ "You need permission" trên lối tắt; người dùng dễ bấm Request access (→ dặn đừng bấm, chờ 30 phút, tải lại).
- **"Được chia sẻ với tôi" chỉ hiện quyền cấp trực tiếp cho email** (90_CA-NHAN, thư mục RAW_NG); mục cấp qua nhóm không hiện kể cả sau khi mở.
- **Người có quyền Sửa (không là thành viên ổ gốc) chia sẻ tiếp được từng tệp** ra ngoài (chỉ cảnh báo).
- Đề xuất chờ Nery: (a) nhóm riêng `sd-u-<email>` cho quyền theo người; (b) chủ ổ cá nhân = Người đóng góp cả ổ; (c) chia sẻ lạ: A1 quét tự gỡ hằng đêm / A2 khi bấm / C chỉ báo cáo. Đã giao chuyên gia GW rà logic nhập liệu.

## 2c. Email tên miền (16/11)
- Thư chào gửi 15/11 23:03 bị **Bounced** sau 0,14 s (Email Log Search). Check MX: **mlwit.edu.vn chưa có MX**, chưa DKIM, chưa DMARC → Gmail người nhận từ chối. Thư nội bộ (tới admin@) vẫn tới.
- Cần thêm ở DNS (tên miền mua tại **Tenten**; kiểm tra nameserver đang ở Tenten hay nơi khác): MX `@` → `smtp.google.com` (ưu tiên 1); TXT `@` SPF `v=spf1 include:_spf.google.com ~all`; TXT `google._domainkey` (lấy ở Admin console → Gmail → Xác thực email, 2048 bit, rồi bấm Bắt đầu xác thực); TXT `_dmarc` `v=DMARC1; p=none; rua=mailto:admin@mlwit.edu.vn`. Kiểm lại bằng toolbox.googleapps.com/apps/checkmx.
- **18/11: email tên miền XONG.** NS ở Tenten (ns-b1/2/3.tenten.vn); MX, SPF, DMARC, DKIM (`google._domainkey`, 2048) đã công khai (Dig thấy); đã Start authentication. Thư thử admin@ → tnho113: SPF/DKIM/DMARC đều PASS; nhận chiều vào admin@ OK. CheckMX vẫn báo "không có mail server" dù Dig thấy MX `SMTP.GOOGLE.COM.` → coi là báo sai (giả thuyết: so khớp chữ hoa). Thư thử vẫn vào **Spam** do tên miền mới chưa có uy tín → nhắc người nhận kiểm Spam + Not spam; đổi tên người gửi admin@ thành tên rõ ràng.
- Đợt 2b: lệnh "Gửi lại thư chào" cho người chưa nhận; ghi lỗi gửi rõ ràng.

## 3. Cần thử thật (chưa kiểm chứng)
- Gỡ quyền trực tiếp ở thư mục khi người đó còn quyền thừa kế từ ổ (đã có phương án hạ về Xem).
- Tổ chức có cho Gmail ngoài làm thành viên ổ dùng chung qua API.
- Mục "Được chia sẻ với tôi" có hiện thư mục được cấp quyền không; hiển thị lối tắt trên app Drive điện thoại.
- Chuyển ổ dùng chung vào OU bằng API.
- Menu Apps Script không chạy trên app Sheets điện thoại (đồng thuận cộng đồng) → nhập được trên điện thoại, chạy trên máy tính hoặc lịch hằng đêm.
