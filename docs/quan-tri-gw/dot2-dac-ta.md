# Shared Drive Board v2 · Đặc tả Đợt 2–3 (hợp đồng cho phiên phụ)

> Phương án tổng: `docs/quan-tri-gw/shareddrive-board.md`. Mã: `apps-script/shareddrive-board/apps-script/`.
> Đã có: `00_Menu.gs`, `10_Chung.gs` (TAB, COT, P, chayPhien_, docTab_, ghi_, bayGio_…), `15_DuLieu.gs` (taiDuLieu_ → C + hàm tra cứu: emailNhom_, hauToCua_, emailTong_, dsLevel_, levelDuocXem_, levelThayDuoc_, duocChiaSe_, khuonO_, khiNghi_, coOCaNhan_, apChoO_, dienMau_, dongCauTruc_, tenOCaNhan_), `20_ThanhVien.gs` (Đợt 1).
> Giả lập kiểm thử dùng chung: `kiem-thu/gia-lap.js` (taoBang, taoMoiTruong(bang, them), bangMau()). Giả lập Drive v3 mẫu có sẵn ở bản thử v1: `/tmp/claude-0/-home-user-EWIT/24130508-6cff-5f62-9829-ac3cc1ad61c3/scratchpad/Tool_Quan_Tri/shareddrive-kit/kiem-thu/kiem-thu.js` (hàm taoDrive) — chép và mở rộng.

## 0. Quy tắc chung (mọi phần)
- Apps Script V8, không dùng thư viện ngoài. Dịch vụ nâng cao: `Drive` (v3), `AdminDirectory`, `AdminGroupsSettings`. Gửi thư: `MailApp`.
- Mỗi lệnh menu chạy qua `chayPhien_(ten, function (cdTab) {...})` (khóa, chỉ admin, nhật ký). Bên trong gọi `taiDuLieu_()`.
- **Xem trước / Áp dụng**: biến `P.thu` (true = Xem trước) — Xem trước KHÔNG gọi lệnh ghi nào lên Drive/Groups/Mail, chỉ ghi "sẽ …" vào nhật ký và cột kết quả. Cột kết quả trên bảng được ghi ở cả hai chế độ.
- **Không xóa**: không xóa ổ, thư mục, tệp (ngoại lệ duy nhất: lệnh "Thu ổ người nghỉ" ở 50_Quet). Lối tắt do script tạo được chuyển vào thùng rác. Chỉ gỡ quyền/thành viên của: người có ở NGUOI, hoặc nhóm có tiền tố `CAI_DAT.Tiền tố nhóm`. Còn lại: báo "ngoài bảng", không gỡ.
- **Idempotent**: chạy lại nhiều lần không sinh thêm gì. Nhận diện đối tượng bằng `appProperties` (Drive) hoặc email (Groups), KHÔNG bằng tên.
- **Giới hạn 6 phút**: kiểm tra thời gian (dừng an toàn sau ~4,5 phút), ghi "chưa xong, sẽ chạy tiếp", tạo trình kích hoạt thời gian chạy tiếp sau 1 phút (`ScriptApp.newTrigger(tenHam).timeBased().after(60000).create()`), xóa trình kích hoạt đó khi xong. Nhờ idempotent nên chạy tiếp chỉ là chạy lại.
- Tên hàm nội bộ kết thúc bằng `_`. Tiếng Việt không dấu cho tên hàm/biến, có dấu cho chuỗi hiển thị. Không hard-code tên tổ chức/miền — lấy từ C.cd.
- Mỗi tệp có bộ kiểm thử riêng `kiem-thu/kiem-thu-<so>.js` dùng `gia-lap.js`, chạy `node kiem-thu/kiem-thu-<so>.js`, in "TẤT CẢ ĐẠT (n/n)". Không sửa tệp của phần khác; cần hàm chung thì báo lại cho phiên điều phối (không tự thêm vào 10/15).

## 1. Nhóm Google — `25_Nhom.gs` (phiên B)
Hàm chính: `dongBoNhom_(C)`. Lệnh menu tạm để thử: `sdNhomXemTruoc()` / `sdNhomApDung()` (sau này gộp vào Drive › Xem trước/Áp dụng, gọi trước 30_Drive).

Nhóm mong muốn (email → tập thành viên):
- Với mỗi nhóm g ở NHOM: thành viên THANH_VIEN Đang, chia theo `hauToCua_`: `emailNhom_(C,g.ma,'')` (Thành viên Xem), `…'sua'` (Thành viên Sửa), `…'pt'` (Phụ trách). Nếu g.tt ∈ {Đóng, Ngừng}: tập mong muốn rỗng (gỡ hết người có trên bảng).
- `emailTong_(C,'ef')`: NGUOI Đang có Vai trò ∈ {EF, GV, Tổ chức} **và** coOCaNhan_. `emailTong_(C,'hv')`: HV Đang và coOCaNhan_.
- Chỉ TẠO nhóm khi tập mong muốn ≠ rỗng. Nhóm đã có mà rỗng thì để nguyên (không xóa).
- Tạo: `AdminDirectory.Groups.insert({email, name, description})`. name = `<Tên nhóm> · <Xem|Sửa|Phụ trách>` hoặc "Tất cả EF/GV/Tổ chức", "Tất cả HV". Cài đặt (`AdminGroupsSettings.Groups.patch`): allowExternalMembers 'true', whoCanJoin 'INVITED_CAN_JOIN', whoCanPostMessage 'NONE_CAN_POST', whoCanViewMembership 'ALL_MANAGERS_CAN_VIEW', whoCanViewGroup 'ALL_MANAGERS_CAN_VIEW', whoCanDiscoverGroup 'ALL_MEMBERS_CAN_DISCOVER', whoCanContactOwner 'ALL_MANAGERS_CAN_CONTACT'. Nhóm mới tạo có thể chưa đặt được cài đặt ngay → bắt lỗi, ghi "đặt cài đặt sau" và lần sau thử lại (đánh dấu bằng PropertiesService `NHOM_CAIDAT_<email>`='ok').
- Đồng bộ thành viên: `AdminDirectory.Members.list` (phân trang) → thêm thiếu (`Members.insert({email, role:'MEMBER'}, nhom)`), gỡ thừa nếu email có ở NGUOI (`Members.remove`); thừa mà không có ở NGUOI → báo "ngoài bảng". Không gỡ OWNER.
- Ghi tab NHOM: cột "Email nhóm" = email nhóm Xem của g (khi đã tạo / sẽ tạo), cột "Kết quả" = tóm tắt (vd "sd-me02-08: +2 −1; -pt: +1"). Ghi kết quả cho từng người vào THANH_VIEN cột "Kết quả Drive" là KHÔNG cần (để 30_Drive).
- Trả về `{ nhomCo: {email:true} }` (nhóm đang tồn tại hoặc sẽ tạo) để 30_Drive chỉ cấp quyền cho nhóm có thật.

## 2. Drive — `30_Drive.gs` (phiên A)
Hàm chính: `apDungDrive_(C, nhomCo)`. Lệnh menu: `sdDriveXemTruoc()`, `sdDriveApDung()` (gọi `dongBoNhom_` rồi `apDungDrive_`), `sdDriveTiep()` (chạy tiếp).

### 2.1 Ổ gốc
- Dòng CAU_TRUC Loại "Ổ", trừ `CN_TEN`. Cột "Ổ" là tên ngắn (khóa nối với các dòng khác), cột "Đường dẫn" là tên ổ thật.
- Có ID ở cột "ID" → dùng (đổi tên nếu khác). Không có → tạo (`Drive.Drives.create`), ghi ID vào cột "ID" của dòng.
- Hạn chế ổ gốc: `driveMembersOnly:false, domainUsersOnly:false, sharingFoldersRequiresOrganizerPermission:true`.
- Ổ `O_DL` (Dữ liệu học viên): thành viên ổ = nhóm DULIEU: `emailNhom_(…,'DULIEU','')` reader, `'sua'` writer, `'pt'` fileOrganizer (chỉ nhóm có trong nhomCo). Các ổ gốc khác: không thêm thành viên (admin@ là organizer do tạo ổ).

### 2.2 Thư mục theo cấu hình (appProperties: `sdma` = Mã dòng; thêm `sdnhom` = Mã nhóm, `sdemail` = email người, `sdlop` = mã lớp khi cần)
| Loại dòng | Tạo ở đâu | Cấp quyền |
|---|---|---|
| Thư mục | ổ của cột "Ổ", theo "Đường dẫn" (có `/` = lồng; cha phải là dòng khác cùng ổ hoặc tạo trung gian không gắn mã) | `TTC_EF`: emailTong 'ef' reader · `TTC_HV`: emailTong 'hv' reader · còn lại: không |
| Thư mục theo nhóm | mỗi nhóm có Loại khớp "Nhóm loại: …" (vd `TV_CAP` Level; `DA_NHOM` Dự án, Ban; `LOP_NHOM` Lớp), tên = dienMau_(Đường dẫn, null, g); `{Nhánh}/` tạo thư mục nhánh trung gian (gắn `sdma`=`<mã dòng>_NHANH`, `sdnhanh`) | `TV_CAP` Level L: mọi `emailNhom_(Lx,'')` với Lx ∈ levelDuocXem_(L) → reader · `DA_NHOM` g: '' reader, 'sua' writer, 'pt' fileOrganizer · `LOP_NHOM` g: nếu g.tt ∈ {Đang, Kết thúc}: '' reader, 'pt' writer; Đóng/Ngừng: không quyền nào |
| Thư mục con của nhóm | `{nhóm}/X` trong thư mục nhóm tương ứng (DA_K*, LOP_VIDEO, LOP_TL) | thừa kế |
| Thư mục theo người | `RAW_NG`: thành viên Đang nhóm RAW · `WIKI_NG`: thành viên Đang nhóm WIKI · `HS_NG`: mọi HV có coOCaNhan_; tên = dienMau_(Đường dẫn, n) | RAW: người đó writer · WIKI: thư mục reader + **mỗi tệp bên trong** writer trực tiếp · HS: reader |
| Thư mục con theo lớp | `HS_NOP`: trong HS_NG của HV, mỗi lớp HV có dòng THANH_VIEN Loại Lớp (Đang) mà lớp tt ∈ {Đang, Kết thúc}; tên = mã lớp | lớp Đang: HV writer + với mỗi nhóm nhỏ g (thuoc = lớp) mà HV là Thành viên Đang: `emailNhom_(g,'pt')` commenter · lớp Kết thúc: không cấp thêm (gỡ writer & commenter cũ) |
| Tệp mẫu | `HS_NK`: trong HS_NG; chép tệp tên "Nhật ký trưởng thành" ở thư mục `QT_MAU` (nếu có) — chép một lần, không ghi đè; thiếu mẫu → ghi "chưa có mẫu", không lỗi | thừa kế (HV reader) + HV writer trên tệp |
| Ổ (CN_TEN) | ổ cá nhân — xem 2.3 | — |
| Lối tắt / Chỗ đặt lối tắt | trong ổ cá nhân — xem 2.3 | — |

- Thư mục có `sdma` mà mã không còn trong CAU_TRUC → chỉ báo "ngoài cấu hình" (nhật ký), không xóa.
- Đổi "Đường dẫn" của một mã → đổi tên / chuyển chỗ thư mục đã gắn mã đó (không tạo mới).
- Ghi ID thư mục nhóm vào NHOM cột "ID thư mục".
- Đối soát quyền trên mọi thư mục do script quản lý: quyền trực tiếp (bỏ qua thừa kế, xem `permissionDetails`) của người có ở NGUOI hoặc nhóm có tiền tố → thêm/đổi/gỡ theo mong muốn; khác → "ngoài bảng". Tham khảo cách làm ở bản thử v1 (`quyenTrucTiep_`, `goQuyen_`).

### 2.3 Ổ cá nhân
- Ai có: `coOCaNhan_`. Tên: `tenOCaNhan_`. ID lưu NGUOI "ID ổ". Tạo mới → nếu C.cd.guiThuChao: `MailApp.sendEmail(email, 'Ổ của bạn trên E-WIT đã sẵn sàng', thân thư có tên + link https://drive.google.com/drive/folders/<id> + 3 dòng hướng dẫn)`. Đổi tên người → đổi tên ổ.
- Thành viên ổ: chính người đó reader (admin@ organizer). Hạn chế: `driveMembersOnly = !duocChiaSe_`, `domainUsersOnly:false`, `sharingFoldersRequiresOrganizerPermission:true`. Đổi vai trò/Level → cập nhật hạn chế.
- Thư mục: dòng CAU_TRUC Loại "Thư mục" có apChoO_ đúng (gắn `sdma`). `CN_CA_NHAN` ("Quyền" = Tải lên): người đó writer.
- Lối tắt (gắn appProperties `sdlt`='1', `sdkhoa` = khóa duy nhất): đối soát tập mong muốn ↔ hiện có; thiếu → tạo; thừa → thùng rác; đổi tên → sửa tên.
  - Dòng "Lối tắt" với "Nguồn" `→ <MÃ>`: đích là thư mục của dòng MÃ (với `HS_NG/RAW_NG/WIKI_NG`: thư mục của chính người đó; không có → không tạo). Đặt ở gốc ổ, tên = Đường dẫn.
  - Dòng "Chỗ đặt lối tắt": tạo thư mục (gắn `sdma`), bên trong lối tắt theo "Nguồn":
    - `Nguồn: Level` → TV_CAP của mọi Level trong levelThayDuoc_(n); tên = Mã Level · Tên nhóm.
    - `Nguồn: Lớp đang học` → LOP_NHOM của lớp có dòng THANH_VIEN (Thành viên, Đang) và lớp tt = Đang.
    - `Nguồn: Lớp đã học` → như trên nhưng lớp tt = Kết thúc.
    - `Nguồn: Dự án tham gia` → DA_NHOM của mọi dự án/ban người đó có dòng Đang (mọi vai).
    - `Nguồn: Lớp phụ trách` → LOP_NHOM của lớp người đó là Phụ trách Đang, lớp tt ∈ {Đang, Kết thúc}.
    - `Nguồn: Học viên phụ trách` → với mỗi nhóm nhỏ g người đó Phụ trách Đang và lớp g.thuoc tt = Đang: thư mục con `<g.ma>` (gắn `sdma`=`CN_HV_PT_SUB`, `sdnhom`), bên trong lối tắt tới HS_NOP (lớp g.thuoc) của từng HV Thành viên Đang của g; tên = Mã người · Họ tên.
- Người Nghỉ (hoặc không còn nhóm): gỡ chính người đó khỏi thành viên ổ; nếu khiNghi_ = 'Giữ ổ' đổi tên ổ thành `ZZ · Nghỉ · <tên cũ>` (một lần). 'Thu ổ' để lệnh ở 50_Quet.
- NGUOI cột "Kết quả Drive": tóm tắt mỗi người (vd "ổ ✔ · +3 lối tắt −1").

## 3. Quét & dọn dẹp, Thu ổ — `50_Quet.gs` (phiên C)
Lệnh menu: `sdQuet()` (+ `sdQuetTiep()`), `sdMoBaoCao()`, `sdThuOXemTruoc()`, `sdThuOApDung()`.
- **Báo cáo**: một Google Sheet "SD · Báo cáo" trong thư mục dòng `QT_BC` (ổ Quản trị); tìm bằng appProperties `sdbaocao`='1'; không có thì tạo (`Drive.Files.create` mimeType spreadsheet, parents [QT_BC]) rồi mở bằng `SpreadsheetApp.openById`. Ghi đè các tab mỗi lần quét:
  - `TOM_TAT`: thời điểm quét; mỗi ổ dùng chung của tổ chức (`Drive.Drives.list({useDomainAdminAccess:true})`) + "Drive của admin": tên, loại (ổ gốc theo CAU_TRUC / ổ cá nhân theo NGUOI / ngoài hệ thống), số tệp, số thư mục, dung lượng (quotaBytesUsed), sửa gần nhất, link.
  - `CAY`: cây thư mục mỗi ổ tới độ sâu 3 (thụt lề bằng "  "), kèm số tệp & dung lượng mỗi thư mục.
  - `DON_DEP` (gợi ý, không tự làm): tệp > 100 MB; tệp không sửa > 365 ngày; thư mục rỗng; tệp trùng tên trong cùng thư mục; thư mục có `sdma` không còn trong CAU_TRUC; ổ cá nhân của người đã Nghỉ (với "Thu ổ").
  - `CAN_CHU_Y`: tệp chia sẻ "bất kỳ ai có link" (q `visibility='anyoneWithLink' or visibility='anyoneCanFind'`); audio/video trong ổ Tri thức – Raw; ổ ngoài hệ thống.
  - Quét nhiều lượt: lưu con trỏ (ổ đang quét, pageToken) ở PropertiesService; hết giờ → hẹn `sdQuetTiep` sau 1 phút; xong → xóa con trỏ & trình kích hoạt, ghi báo cáo.
- **Mở báo cáo**: hiện hộp thoại có link báo cáo (HtmlService nhỏ hoặc toast + ghi link vào CAI_DAT dòng "Link báo cáo").
- **Thu ổ người nghỉ** (Xem trước / Áp dụng có hộp thoại xác nhận ghi rõ số ổ): người NGUOI tt Nghỉ, khiNghi_ = 'Thu ổ', có "ID ổ":
  1. Tệp trong `90_CA-NHAN` (thư mục `sdma`=`CN_CA_NHAN`) → chuyển vào thư mục `90_CA-NHAN (lưu)` trong HS_NG của người đó (tìm bằng `sdma`=`HS_NG`,`sdemail`); không có HS_NG → `QT_SL`/`<tên ổ>`.
  2. Gỡ mọi thành viên trừ admin; xóa ổ: `Drive.Drives.remove(id, {useDomainAdminAccess:true, allowItemDeletion:true})`.
  3. NGUOI: xóa "ID ổ", "Kết quả Drive" = "đã thu ổ <ngày>". Nhật ký từng bước.
- Ổ cá nhân người Nghỉ 'Giữ ổ' chỉ liệt kê ở DON_DEP, không thu.

## 4. Thử thật (sau khi ghép)
3 Gmail thử (EF, GV, HV); kiểm: thấy đúng 1 ổ mang tên mình; lối tắt mở được; tải lên đúng chỗ; HV không chia sẻ được tệp trong 90_CA-NHAN; GV phụ trách chỉ thấy bài nhóm mình; Wiki sửa được tệp nhưng không tải lên; người có quyền Sửa ở ổ gốc có chia sẻ tiếp từng tệp được không (ghi nhận).
