---
name: doi-thiet-bi
description: Bàn giao bối cảnh EWIT WORK giữa máy cá nhân và cloud. Dùng khi Nery nói "cần đổi thiết bị", "đổi máy", "chuyển sang cloud/máy", hoặc khi mở phiên mới và Nery nói "tiếp tục", "đã đổi thiết bị", "nhận bàn giao".
---

# Đổi thiết bị · EWIT WORK

Nguồn bối cảnh duy nhất là **repo git**: `CLAUDE.md`, `docs/TIEN-DO.md`, `docs/DECISIONS.md` và các file trong `docs/`.
Lịch sử chat **không** đi theo thiết bị, nên mọi điều cần nhớ phải nằm trong các file này.

Nhánh bàn giao: `main`. Chỉ dùng sau khi Nery đã xác nhận (xem `docs/TIEN-DO.md`). Nếu chưa xác nhận, dùng nhánh hiện tại và ghi rõ tên nhánh trong lời nhắn bàn giao.

## A. Bên ĐI — Nery nói "cần đổi thiết bị"

1. Dừng việc đang làm ở điểm an toàn. Không để thao tác Drive dở dang: nếu đang di chuyển một nhóm, làm xong nhóm đó hoặc ghi rõ đã di chuyển tới mục nào.
2. Cập nhật `docs/TIEN-DO.md`:
   - **Đang làm**: trạng thái thật, kể cả bước dở.
   - **Việc kế tiếp**: 1–3 bước, đủ cụ thể để làm ngay.
   - **Câu hỏi chờ Nery**: còn mở.
   - **Nhật ký phiên**: thêm một dòng ở trên cùng (ngày, thiết bị: Cloud/Máy, nhánh, tóm tắt 1–2 câu).
   - Quyết định mới → ghi vào `docs/DECISIONS.md` (WD-xx).
3. Kiểm tra không có secret: `git diff --cached` không chứa key/token; `.env` không được add.
4. Commit: `Bàn giao: <tóm tắt>`. Push lên nhánh làm việc hiện tại, rồi đưa vào nhánh bàn giao:
   - `git push -u origin <nhánh hiện tại>`
   - Nếu nhánh bàn giao đã được xác nhận: `git fetch origin main` → merge fast-forward nhánh hiện tại vào `main` → `git push origin main`. Nếu không fast-forward được: **dừng và hỏi Nery**, không force-push.
5. Trả lời Nery đúng mẫu:
   ```
   ✅ Đã bàn giao · <nhánh> · commit <hash ngắn>
   Đang dở: <1 dòng>
   Bước tiếp: <1 dòng>
   Ở thiết bị kia, mở Claude Code trong repo EWIT và gõ: tiếp tục
   ```

## B. Bên ĐẾN — Nery nói "tiếp tục" / "đã đổi thiết bị"

1. Đồng bộ: `git fetch origin`, rồi lấy nhánh bàn giao (`main`, hoặc nhánh ghi trong nhật ký mới nhất). Nếu cây làm việc có thay đổi chưa commit: **dừng, báo Nery**, không ghi đè.
   - Trên cloud, harness có thể giao một nhánh làm việc mới: tạo nhánh đó từ nhánh bàn giao (`git checkout -B <nhánh được giao> origin/main`).
2. Đọc theo thứ tự: `CLAUDE.md` → `docs/TIEN-DO.md` → `docs/DECISIONS.md` → file được nhắc trong "Đang làm".
3. Với Drive: **liệt kê lại** các thư mục liên quan việc đang làm (Drive có thể đã đổi trong lúc chuyển máy). Báo nếu lệch với `docs/drive-map.md`.
4. Trả lời Nery ngắn:
   ```
   📍 Đã nhận bàn giao · <nhánh> · <ngày của nhật ký mới nhất>
   Đang dở: …
   Bước tiếp đề xuất: …
   Câu hỏi còn chờ: … (tối đa 2, dạng Q1/Q2)
   ```
5. Chờ Nery xác nhận rồi mới làm tiếp.

## Không làm
- Không force-push, không rebase nhánh bàn giao.
- Không ghi bối cảnh quan trọng chỉ trong chat.
- Không trích số liệu tiền công vào `TIEN-DO.md`.
