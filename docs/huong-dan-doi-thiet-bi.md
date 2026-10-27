# Hướng dẫn làm việc song song: máy cá nhân ↔ cloud

## Nguyên lý
- **Repo git `tnho113/EWIT` là bộ nhớ chung.** Lịch sử chat không đi theo thiết bị; bối cảnh nằm trong `CLAUDE.md`, `docs/TIEN-DO.md`, `docs/DECISIONS.md`.
- **Drive là dữ liệu sống**, hai bên cùng thấy, không cần đồng bộ.
- Bàn giao bằng một câu: **"cần đổi thiết bị"** (bên đi) → **"tiếp tục"** (bên đến).

## Cài một lần trên máy cá nhân

1. Cài Claude Code: https://code.claude.com/docs (macOS/Windows/Linux), đăng nhập **cùng tài khoản claude.ai** đang dùng trên cloud.
2. Cài git, rồi clone repo:
   ```bash
   git clone https://github.com/tnho113/EWIT.git
   cd EWIT
   git checkout main        # nhánh bàn giao (sau khi Nery xác nhận)
   ```
3. Mở Claude Code trong thư mục `EWIT` (`claude`). Gõ `/mcp` để kiểm tra Google Drive / Sheets / Docs connector đã có chưa. Nếu chưa có, bật lại connector trong claude.ai → Settings → Connectors.
4. (Tùy chọn, khuyên dùng) Bật hook tự hiện tiến độ khi mở phiên: tạo file `.claude/settings.json` với nội dung dưới, rồi commit để cloud cũng dùng được.
   ```json
   {
     "hooks": {
       "SessionStart": [
         { "hooks": [ { "type": "command",
           "command": "cd \"$CLAUDE_PROJECT_DIR\" && git fetch --quiet origin 2>/dev/null; echo '=== EWIT · Sổ tiến độ ==='; sed -n '1,40p' docs/TIEN-DO.md 2>/dev/null; echo \"Nhánh: $(git branch --show-current) · chưa commit: $(git status --porcelain | wc -l)\""
         } ] }
       ]
     }
   }
   ```
   Hook này chỉ **đọc** (fetch + in sổ tiến độ), không tự pull hay ghi đè.

## Mỗi lần đổi thiết bị

| Bước | Ở thiết bị đang dùng | Ở thiết bị chuyển sang |
|---|---|---|
| 1 | Gõ **"cần đổi thiết bị"** | — |
| 2 | Claude cập nhật `TIEN-DO.md`, commit, push lên `main`, trả về mẫu "✅ Đã bàn giao…" | — |
| 3 | — | Mở Claude Code trong repo EWIT (máy) hoặc tạo phiên cloud mới với repo `tnho113/EWIT` |
| 4 | — | Gõ **"tiếp tục"** → Claude pull `main`, đọc sổ tiến độ, liệt kê lại Drive, tóm tắt và hỏi bước tiếp |

## Lưu ý
- Không làm cùng lúc trên hai thiết bị trong cùng một việc; luôn bàn giao trước.
- Nếu máy cá nhân có thay đổi chưa commit, Claude sẽ dừng và hỏi, không ghi đè.
- Secret (Zoom key, service account) chỉ để trong `.env` ở từng máy, không qua git.
