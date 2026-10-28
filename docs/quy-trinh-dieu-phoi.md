# Quy trình điều phối: phiên chính + phiên phụ (WD-19)

## 1. Phân tích cách làm được chia sẻ

| Ý trong bài | Đánh giá | Loại |
|---|---|---|
| Một phiên dài giữ ngữ cảnh nhưng chậm, tốn token | Đúng: mỗi lượt mô hình xử lý lại toàn bộ hội thoại; bộ nhớ đệm (prompt cache) giảm chi phí nhưng hội thoại càng dài càng chậm và dễ bị nén mất chi tiết | Sự thật |
| Phiên điều phối tự mở phiên phụ cho từng việc | Làm được trong Claude Code: công cụ **Agent** (phiên phụ chạy trong cùng phiên, trả kết quả về) và có thể chọn model cho từng phiên phụ | Sự thật |
| Thông tin giữa các phiên vẫn đồng bộ | Chỉ đúng khi bối cảnh nằm trong **file dùng chung**. Phiên phụ bắt đầu "trắng", chỉ biết những gì được giao trong lời nhắn + đọc từ repo. Dự án đã có sẵn nền này (`CLAUDE.md`, `TIEN-DO.md`, `DECISIONS.md`, `docs/`) | Suy luận |
| Tiết kiệm token 2–3 lần | Có cơ sở (kết quả trung gian dài không đổ vào phiên chính; việc dễ dùng model rẻ) nhưng con số phụ thuộc loại việc | Chưa đủ dữ liệu để kết luận |

**Rủi ro cần chặn:** phiên phụ không hỏi được Nery; nhiều phiên cùng ghi một file dễ đè nhau; phiên phụ có thể làm sai nếu lời giao việc mơ hồ; dữ liệu nhạy cảm (ⓓ, ③) có thể lọt vào kết quả.

## 2. Vai trò

| Ai | Model | Làm gì |
|---|---|---|
| **Phiên điều phối** (phiên chính với Nery) | Opus | Trao đổi với Nery, chốt yêu cầu và quyết định (WD), chia việc, viết lời giao việc, **rà soát** kết quả, **mọi thao tác ghi lên Drive/Sheets thật**, commit/push |
| **Phiên phụ · nhẹ** | Haiku | Tra cứu, liệt kê Drive, đọc file dài rồi tóm tắt, chuyển đổi dữ liệu theo quy tắc rõ, định dạng tài liệu, kiểm tra chính tả |
| **Phiên phụ · vừa** | Sonnet | Viết code theo đặc tả đã chốt, viết test, viết hướng dẫn sử dụng, rà soát code |
| **Phiên phụ · nặng** | Opus | Chỉ khi cần: thiết kế phức tạp, gỡ lỗi khó, rà soát bảo mật |

## 3. Luật làm việc
1. **Phiên phụ chỉ đọc Drive** và ghi vào **scratchpad** hoặc **nhánh/thư mục được chỉ định** trong repo. Ghi lên Drive/Sheets thật: chỉ phiên điều phối, sau khi đã rà.
2. Mỗi lời giao việc có đủ: mục tiêu · nguồn (ID file, đường dẫn) · ràng buộc (không ghi gì, không dán dữ liệu cá nhân) · **đầu ra mong muốn** (định dạng, độ dài, nơi lưu).
3. Phiên phụ trả về **bản tóm tắt ngắn + đường dẫn file**, không dán dữ liệu thô.
4. Không giao cho 2 phiên phụ cùng sửa một file.
5. Không giao phiên phụ đọc giá trị trong ③ / ⓓ (tiền công).
6. Việc nhỏ (vài lệnh) thì phiên điều phối tự làm: mở phiên phụ cũng tốn chi phí khởi động.
7. Phiên điều phối dài quá (nhiều chủ đề đã xong) → Nery nói **"cần đổi thiết bị"** rồi mở phiên mới và gõ **"tiếp tục"** để bắt đầu lại gọn từ `TIEN-DO.md`. Đây là cách tiết kiệm lớn nhất cho phiên chính.

## 4. Áp dụng cho Lịch & Công v2

| Bước | Phiên phụ | Model | Phiên điều phối |
|---|---|---|---|
| B3 nạp danh mục | Đọc ② → dựng CSV `lop`, `ef` + danh sách bất thường (chỉ đọc) | Haiku | Rà, hỏi Nery điểm bất thường, ghi vào ⓐ |
| B4 code | Mỗi module 1 phiên: `CaiDat` (data validation, màu, khóa) · `Quyen` · `TaoTabLop` · `DongBo` + `KiemTra` · test | Sonnet | Viết đặc tả module, rà code, ghép, hướng dẫn Nery dán |
| B5 web Lịch v2 | Giao diện + hàm đọc ⓒ | Sonnet | Rà, đối chiếu thương hiệu |
| B6 thù lao | Báo cáo khoảng ngày, chốt kỳ | Sonnet | Rà kỹ phần bảo mật |
| Tài liệu hướng dẫn người dùng | Soạn HUONG_DAN từng file | Haiku | Duyệt |
| Rà soát trước khi giao Nery | Review độc lập toàn bộ code | Sonnet/Opus | Quyết định sửa |
