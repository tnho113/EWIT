/**
 * MLWIT · SHARED DRIVE BOARD v2 · DRIVE (Đợt 2 + 2b)
 * Dựng ổ gốc, thư mục theo CAU_TRUC, ổ cá nhân, lối tắt; cấp quyền thư mục cho nhóm Google sd-…
 * Dịch vụ nâng cao cần bật: Drive (v3). Gửi thư: GmailApp (nếu có, để có bản trong "Đã gửi") hoặc MailApp.
 *
 * Hàm công khai:
 *   sdDriveXemTruoc()   Xem trước (đầy đủ, một lượt): không gọi lệnh ghi nào lên Drive/Groups/Mail, chỉ ghi "sẽ …"
 *   sdDriveApDung()     Áp dụng tay: chạy ĐẦY ĐỦ từ đầu (bỏ con trỏ cũ), nhiều lượt nếu cần
 *   sdDriveTiep()       chạy tiếp từ con trỏ (trình kích hoạt hẹn giờ gọi khi lượt trước hết giờ)
 *   sdDriveHangDem()    Áp dụng hằng đêm: chế độ THAY ĐỔI (bỏ qua người không đổi); ngày "Chạy đầy đủ vào" thì đầy đủ
 *   sdBatHangDem() / sdTatHangDem()   tạo / xóa trình kích hoạt hằng ngày (khoảng 1–2 giờ sáng) gọi sdDriveHangDem
 *   sdThuChaoDenHan()   gửi thư chào đã đủ 60 phút trong hàng đợi (trình kích hoạt hẹn giờ gọi)
 *   sdGuiLaiThuChao()   gửi lại thư chào cho mọi người có ổ mà chưa có dấu "đã gửi" (xem DẤU THƯ CHÀO)
 *   apDungDrive_(C, nhomCo, batDau, ct)
 *
 * NHÃN (Đợt 2b): dùng `properties` CÔNG KHAI (mọi dự án Apps Script đọc được), KHÔNG dùng appProperties
 * (appProperties chỉ dự án đã gắn đọc được → bản sao bảng không thấy nhãn cũ). Truy vấn `properties has {…}`.
 *   thư mục: sdma (Mã dòng CAU_TRUC) + sdnhom | sdlop | sdnhanh khi cần
 *   thư mục/tệp theo người: sdma_u = Mã hệ thống (nhận diện chính, không đổi) + sdemail = email hiện tại (tương thích,
 *     cập nhật khi đổi email). Người chưa có Mã hệ thống: chỉ sdemail.
 *   thư mục nhánh trung gian của LOP_NHOM: sdma = <mã dòng>_NHANH, sdnhanh
 *   thư mục nhóm nhỏ trong 40_HOC-VIEN-PHU-TRACH: sdma = CN_HV_PT_SUB, sdnhom
 *   thư mục trung gian không gắn mã: sdtg = '1' (tìm theo cha + tên)
 *   lối tắt: sdlt = '1', sdkhoa = khóa duy nhất trong ổ cá nhân
 *   tệp mẫu đã chép: sdma = HS_NK + nhãn người
 * NHẬN LẠI: thư mục chưa có nhãn (vd chỉ có appProperties của dự án cũ) nhưng đúng tên + đúng thư mục cha đã biết → gắn
 * properties rồi dùng, không tạo mới (nhiều thư mục cùng tên chưa nhãn → LỖI, không nhận, không tạo). Lối tắt chưa nhãn
 * đúng cha + đúng đích → gắn nhãn. Tệp mẫu chưa nhãn đúng tên trong thư mục người → gắn nhãn.
 *
 * CHẠY THEO LƯỢT (con trỏ ScriptProperties SD_CON_TRO_*): giai đoạn nhom → goc (ổ gốc, thư mục, đối soát quyền thư mục
 * không theo người) → nguoiGoc (thư mục theo người ở ổ gốc, từng người) → oCaNhan (ổ cá nhân, từng người) → xong.
 * Mỗi lượt dựng lại phần ổ gốc/thư mục (chỉ đọc khi đã có), rồi tiếp từ con trỏ. Chạy tiếp không làm lại người đã xong.
 * DẤU THAY ĐỔI: ScriptProperties SDH_P_<Mã hệ thống|email> = băm dữ liệu liên quan người đó (NGUOI, THANH_VIEN của họ,
 * NHOM liên quan, thành viên nhóm nhỏ họ phụ trách, CAU_TRUC, VAI_TRO, Level). Chế độ thay đổi bỏ qua người có dấu không đổi.
 *
 * DẤU THƯ CHÀO: ScriptProperties SD_THU_<ID ổ> = "<thời điểm> · <email>" khi gửi thành công (bền qua mọi lần chạy);
 * cột NGUOI "Kết quả Drive" được nối thêm "thư chào ✔ <ngày>" lúc gửi (cột này bị ghi đè ở lần chạy sau, chỉ để xem).
 * Hàng đợi SD_HANG_THU_* : [{ idO, email, luc }]; gửi khi đã qua ≥ 60 phút.
 *
 * Giả định (hợp đồng chưa nói rõ / chọn cách hợp lý nhất):
 *  1. Thành viên ổ gốc: chỉ đối soát ổ O_DL (nhóm DULIEU). Ổ gốc khác không thêm, không gỡ thành viên.
 *  2. Thư mục theo nhóm của nhóm Đóng/Ngừng: không tạo mới; đã có thì giữ, gỡ hết quyền của nhóm sd-/người trên bảng.
 *  3. Quyền cho nhóm Google chỉ cấp khi email nhóm có trong nhomCo. Nhóm chưa đồng bộ xong thì chưa chạy phần Drive.
 *  4. Đồng hồ 4,5 phút tính từ đầu lượt. Xem trước hết giờ: chỉ báo, không hẹn, không lưu con trỏ.
 *  5. Quyền trực tiếp ≤ quyền thừa kế được coi như không có; ngoại lệ: thư mục 90_CA-NHAN cũ (gỡ hẳn quyền trực tiếp).
 *  6. Quyền "theo người" (RAW_NG writer, WIKI_NG reader + writer từng tệp, HS_NG reader, HS_NOP writer, HS_NK writer,
 *     HS_TL writer) cấp cho NHÓM RIÊNG emailNhomRieng_; nhóm riêng chưa có (chưa có Mã hệ thống / chưa có trong nhomCo)
 *     → cấp tạm trực tiếp cho email và ghi "chưa có nhóm riêng". Quyền trực tiếp cũ cho email ở các chỗ đó tự bị gỡ.
 *  7. Ổ cá nhân: chủ ổ là thành viên writer (Người đóng góp). CN_CA_NHAN không tạo nữa; thư mục 90_CA-NHAN cũ (nhận theo
 *     nhãn hoặc theo tên ở gốc ổ) giữ nguyên, gỡ quyền trực tiếp của người trên bảng, ghi chú.
 *  8. HS_TL (00_TAI-LIEU-CUA-TOI): dòng CAU_TRUC Loại "Thư mục con theo người", Đường dẫn "{người}/00_TAI-LIEU-CUA-TOI",
 *     cùng Ổ với dòng "Thư mục theo người" (HS_NG). Quyền: cột "Quyền" (trống = writer) cho nhóm riêng. Không cấp cho nhóm
 *     phụ trách. Chỉ tạo khi người đủ điều kiện HS_NG; không xóa khi nghỉ.
 *  9. HS_NG ("Vai trò: HV") áp cho mọi người laNguoiHoc_ có coOCaNhan_. HS_NOP chỉ cho lớp người đó là Thành viên.
 *     Dòng ổ cá nhân "Ổ HV" kiểu học (Chỗ đặt lối tắt Lớp đang học/đã học, Lối tắt → HS_NG) cũng áp cho EF/GV đang học.
 * 10. Người Đang nhưng không còn nhóm: gỡ khỏi thành viên ổ, KHÔNG đổi tên. Chỉ người Nghỉ + "Giữ ổ" mới đổi tên ZZ · Nghỉ.
 * 11. Ghi ID: CAU_TRUC "ID" (dòng Ổ, Thư mục ở ổ gốc), NGUOI "ID ổ", NHOM "ID thư mục": chỉ ở Áp dụng.
 *     NGUOI "Kết quả Drive": chỉ ghi cho người được xử lý ở lượt này (người bỏ qua giữ nguyên ô).
 * 12. Tên lối tắt tới thư mục nhóm = "<Mã nhóm> · <Tên nhóm>". Tệp mẫu: tên = đoạn cuối Đường dẫn, tìm trong QT_MAU.
 * 13. CAI_DAT tùy chọn "Chạy đầy đủ vào": CN | T2..T7 | Không (mặc định CN) — ngày lượt hằng đêm chạy đầy đủ.
 *
 * ĐỢT SỬA A + WD-28 (23/11/2026):
 * 14. Lớp chỉ xem (lopChiXem_): không ổ/Hồ sơ/nộp bài; thành viên nhận THƯ LỚP (hàng đợi 60 phút như thư chào) có link
 *     thư mục lớp. Dấu đã gửi: ScriptProperties SD_THU_LOP_<Mã hệ thống|email>_<Mã lớp>; cột THANH_VIEN "Kết quả Drive"
 *     được nối "thư lớp ✔ <ngày>" (chỉ để xem). Người có ổ vì lý do khác vẫn có lối tắt lớp đó ở 10_/11_LOP-….
 * 15. Phụ trách lớp (mọi lớp): nhóm -pt = Xem thư mục lớp + Sửa CHỈ ở thư mục con mã LOP_TL (DR.MA_LOP_TL); VIDEO thừa kế Xem.
 * 16. Đổi Mã nhóm (A1): không thấy thư mục theo nhãn sdnhom mới → nếu NHOM "ID thư mục" trỏ tới thư mục cùng ổ, chưa xóa,
 *     sdma đúng dòng CAU_TRUC, sdnhom KHÔNG thuộc nhóm khác đang có ở NHOM → nhận lại (đổi sdnhom cả thư mục con), rồi đổi
 *     tên/chuyển chỗ như thường. sdnhom thuộc nhóm khác đang có → LỖI, không nhận. HS_NOP (sdlop) chưa đổi theo (ngoài phạm vi).
 * 17. Chốt hằng đêm (A3): Xem trước / Áp dụng TAY lưu dấu cấu hình (NHOM, CAU_TRUC, VAI_TRO, CAI_DAT; bỏ các cột script tự
 *     ghi) vào SD_DAU_CAU_HINH. Lượt hằng đêm (kể cả chạy tiếp) so dấu: khác hoặc chưa có → dừng, ghi LỖI, thư cho admin.
 * 18. Nhóm "không chắc" (A5): dongBoNhom_ lỗi đọc nhóm → ct.nhomDa[email] = 2; drDoiSoat_ không gỡ quyền của email đó.
 * 19. Nhóm ngoài bảng (A7): CAI_DAT "Nhóm ngoài bảng" → drDoiSoat_ bỏ qua hoàn toàn (không gỡ, không báo Ngoài bảng).
 * 20. Con trỏ (A6): lưu con trỏ + hẹn chạy tiếp TRƯỚC khi ghi bảng (ghi bảng có thể bị cắt ở giới hạn 6 phút).
 */
var DR = {
  MIME_TM: 'application/vnd.google-apps.folder',
  MIME_LT: 'application/vnd.google-apps.shortcut',
  CHUA_TAO: 'CHUA-TAO:',
  HANG: { reader: 1, commenter: 2, writer: 3, fileOrganizer: 4, organizer: 5 },
  TEN_QUYEN: { reader: 'xem', commenter: 'nhận xét', writer: 'sửa/tải lên', fileOrganizer: 'quản lý nội dung', organizer: 'quản lý' },
  GIOI_HAN_MS: 270000,
  HAM_TIEP: 'sdDriveTiep',
  HAM_DEM: 'sdDriveHangDem',
  HAM_THU: 'sdThuChaoDenHan',
  CHO_THU_MS: 3600000,           // 60 phút
  GIO_DEM: 1,                    // khoảng 1–2 giờ sáng (giờ Việt Nam)
  TIEN_TO_NGHI: 'ZZ · Nghỉ · ',
  MA_HV_PT_SUB: 'CN_HV_PT_SUB',
  MA_CA_NHAN: 'CN_CA_NHAN',
  MA_LOP_TL: 'LOP_TL',           // thư mục con của lớp mà Phụ trách lớp được Sửa (WD-28)
  KHOA_DAU_CH: 'SD_DAU_CAU_HINH',
  TIEN_TO_THU_LOP: 'SD_THU_LOP_',
  TEN_CA_NHAN: '90_CA-NHAN',
  KHOA_CT: 'SD_CON_TRO',
  KHOA_HANG: 'SD_HANG_THU',
  HAN_CHE_GOC: { driveMembersOnly: false, domainUsersOnly: false, sharingFoldersRequiresOrganizerPermission: true }
};

/* ===================== MENU ===================== */

function sdDriveXemTruoc() { chayPhien_('Drive · Xem trước', function () { P.thu = true; drChay_({ cheDo: 'day-du', tay: true }); }); }

function sdDriveApDung() {
  try {
    var ui = SpreadsheetApp.getUi();
    var tl = ui.alert('Áp dụng lên Drive', 'Script sẽ tạo ổ, thư mục, lối tắt và cấp/gỡ quyền theo bảng. Đã chạy Xem trước và đọc NHAT_KY chưa?', ui.ButtonSet.YES_NO);
    if (tl !== ui.Button.YES) return;
  } catch (e) { /* không có giao diện: chạy luôn */ }
  chayPhien_('Drive · Áp dụng', function () { P.thu = false; drChay_({ cheDo: 'day-du', tay: true }); });
}

function sdDriveTiep() { chayPhien_('Drive · Chạy tiếp', function () { P.thu = false; drXoaHen_(); drChay_({ tiep: true }); }, DR.HAM_TIEP); }

function sdDriveHangDem() {
  chayPhien_('Drive · Hằng đêm', function (cd) {
    P.thu = false;
    var C = taiDuLieu_();
    if (!drChotHangDem_(C)) return;                                        // A3: cấu hình đổi mà chưa Xem trước → dừng
    var ct = sdDocJson_(DR.KHOA_CT);
    if (ct && ct.giai !== 'xong') { drChay_({ tiep: true, C: C }); return; }  // lượt trước chưa xong: chạy tiếp
    drChay_({ cheDo: drDayDuHomNay_(cd) ? 'day-du' : 'thay-doi', C: C });
  }, DR.HAM_DEM);
}

/* ===================== CHỐT AN TOÀN HẰNG ĐÊM (A3) ===================== */

/** Dấu cấu hình theo từng tab (bỏ các cột script tự ghi: Email nhóm, ID thư mục, Kết quả, ID, Link báo cáo). */
function drDauCauHinh_(C) {
  var cd = C.cdTho || {};
  return {
    NHOM: sdBam_(JSON.stringify(C.dsNhom.map(function (g) { return [g.ma, g.ten, g.loai, g.thuoc, g.nhanh, g.thuongHieu, g.tt, g.thuTu]; }))),
    CAU_TRUC: sdBam_(JSON.stringify(C.cauTruc.map(function (d) { return [d.ma, d.o, d.duong, d.loai, d.nguon, d.quyen]; }))),
    VAI_TRO: sdBam_(JSON.stringify(Object.keys(C.vaiTro).sort().map(function (v) { var x = C.vaiTro[v]; return [v, x.ten, x.loai, x.chiaSe, x.khiNghi, x.khuon]; }))),
    CAI_DAT: sdBam_(JSON.stringify(Object.keys(cd).sort().filter(function (k) { return k && k !== 'Link báo cáo'; }).map(function (k) { return [k, cd[k]]; })))
  };
}

function drLuuDauCauHinh_(C) {
  PropertiesService.getScriptProperties().setProperty(DR.KHOA_DAU_CH, JSON.stringify(drDauCauHinh_(C)));
}

/** true = được chạy. Khác dấu đã lưu (hoặc chưa từng Xem trước/Áp dụng tay) → ghi LỖI, thư cho admin, trả false. */
function drChotHangDem_(C) {
  var luu = null;
  try { luu = JSON.parse(PropertiesService.getScriptProperties().getProperty(DR.KHOA_DAU_CH) || 'null'); } catch (e) { luu = null; }
  var nay = drDauCauHinh_(C), khac = Object.keys(nay).filter(function (k) { return !luu || luu[k] !== nay[k]; });
  if (!khac.length) return true;
  var tieuDe = 'Có thay đổi cấu hình chưa Xem trước — lượt hằng đêm đã dừng';
  var chiTiet = luu ? 'tab đổi: ' + khac.join(', ') : 'chưa có dấu (chưa từng chạy Xem trước / Áp dụng bằng tay)';
  ghi_('LỖI', tieuDe, chiTiet);
  P.tomTat = 'Hằng đêm đã dừng: ' + chiTiet + '. Chạy Drive › Xem trước, đọc NHAT_KY, rồi Áp dụng.';
  var than = 'Lượt Áp dụng hằng đêm trên ' + C.cd.tenHienThi + ' KHÔNG chạy vì cấu hình đã đổi sau lần Xem trước / Áp dụng bằng tay gần nhất (' +
    chiTiet + ').\n\nCách xử lý: mở Bảng điều khiển → Shared Drive › Drive › Xem trước, đọc NHAT_KY; nếu đúng ý thì Áp dụng. ' +
    'Lượt hằng đêm sau sẽ chạy bình thường khi cấu hình không đổi nữa.';
  try {
    if (typeof GmailApp !== 'undefined' && GmailApp && GmailApp.sendEmail) GmailApp.sendEmail(C.cd.admin, tieuDe, than, { name: C.cd.tenHienThi });
    else MailApp.sendEmail(C.cd.admin, tieuDe, than);
  } catch (e) { ghi_('LỖI', 'Gửi thư báo hằng đêm dừng: ' + e.message, C.cd.admin); }
  return false;
}

function sdBatHangDem() {
  chayPhien_('Bật Áp dụng hằng đêm', function () {
    drXoaTrinh_(DR.HAM_DEM);
    ScriptApp.newTrigger(DR.HAM_DEM).timeBased().everyDays(1).atHour(DR.GIO_DEM).nearMinute(30).inTimezone('Asia/Ho_Chi_Minh').create();
    ghi_('Lịch', 'Đã bật Áp dụng hằng đêm', 'khoảng ' + DR.GIO_DEM + '–' + (DR.GIO_DEM + 1) + ' giờ sáng');
    P.tomTat = 'Đã bật Áp dụng hằng đêm (khoảng ' + DR.GIO_DEM + '–' + (DR.GIO_DEM + 1) + ' giờ sáng).';
  });
}

function sdTatHangDem() {
  chayPhien_('Tắt Áp dụng hằng đêm', function () {
    var n = drXoaTrinh_(DR.HAM_DEM);
    ghi_('Lịch', 'Đã tắt Áp dụng hằng đêm', n + ' trình kích hoạt');
    P.tomTat = 'Đã tắt Áp dụng hằng đêm.';
  });
}

function sdThuChaoDenHan() {
  chayPhien_('Thư chào · Đến hạn', function () { P.thu = false; drXoaTrinh_(DR.HAM_THU); drGuiThuDenHan_(taiDuLieu_(), false); }, DR.HAM_THU);
}

function sdGuiLaiThuChao() {
  chayPhien_('Gửi lại thư chào', function () { P.thu = false; drGuiThuDenHan_(taiDuLieu_(), true); });
}

/** Ngày hôm nay (giờ VN) có phải ngày chạy đầy đủ không. */
function drDayDuHomNay_(cd) {
  var v = chuan_((cd || {})['Chạy đầy đủ vào']) || 'CN';
  if (v === 'Không') return false;
  var thu = new Date(Date.now() + 7 * 3600000).getUTCDay();           // 0 = CN
  var ten = thu === 0 ? 'CN' : 'T' + (thu + 1);
  return v.split(',').map(chuan_).indexOf(ten) >= 0;
}

/* ===================== LUỒNG CHÍNH ===================== */

function drConTroMoi_(cheDo) { return { cheDo: cheDo || 'day-du', giai: 'nhom', nhomDa: {}, i: 0, da: {}, kqGoc: {}, loiNg: {} }; }

function drChay_(opt) {
  var batDau = Date.now();
  var C = opt.C || taiDuLieu_();
  if (opt.tay) drLuuDauCauHinh_(C);                                 // A3: admin đã Xem trước / Áp dụng tay cấu hình này
  canhBaoTvMoCoi_(C);                                              // A8(c)
  var ct;
  if (P.thu) ct = drConTroMoi_('day-du');
  else if (opt.tiep) ct = sdDocJson_(DR.KHOA_CT) || drConTroMoi_('day-du');
  else ct = drConTroMoi_(opt.cheDo);
  if (ct.giai === 'xong') ct = drConTroMoi_(ct.cheDo);
  P.cheDo = ct.cheDo;

  drGuiThuDenHan_(C, false);                                       // thư chào đã đủ 60 phút (Xem trước: chỉ báo)

  if (ct.giai === 'nhom') {
    if (typeof dongBoNhom_ === 'function') {
      P.goiTuDrive = true;
      var r = dongBoNhom_(C, { da: ct.nhomDa, cheDo: ct.cheDo, batDau: batDau }) || {};
      if (r.da) ct.nhomDa = r.da;
      else { ct.nhomDa = {}; Object.keys(r.nhomCo || {}).forEach(function (e) { ct.nhomDa[e] = 1; }); }
      Object.keys(r.khongChac || {}).forEach(function (e) { ct.nhomDa[e] = 2; });
      if (r.chuaXong) {
        ghi_('Drive', 'Nhóm Google chưa đồng bộ xong: chưa chạy phần Drive lượt này', P.thu ? 'Xem trước' : 'hẹn chạy tiếp');
        P.tomTat = 'Nhóm chưa xong, Drive sẽ chạy ở lượt sau.';
        if (!P.thu) { sdLuuJson_(DR.KHOA_CT, ct); drHenChayTiep_(); }
        return;
      }
    } else {
      ghi_('Drive', 'Chưa có dongBoNhom_ (25_Nhom.gs): không cấp quyền cho nhóm nào', '');
    }
    ct.giai = 'goc'; ct.i = 0;
  }
  var nhomCo = {}, khongChac = [];
  Object.keys(ct.nhomDa || {}).forEach(function (e) { if (ct.nhomDa[e] === 1) nhomCo[e] = true; else if (ct.nhomDa[e] === 2) khongChac.push(e); });
  if (khongChac.length) ghi_('Cảnh báo', 'Nhóm Google đọc lỗi ở lượt này (không chắc): KHÔNG gỡ quyền của các nhóm này, chỉ thêm', khongChac.join(', '));
  apDungDrive_(C, nhomCo, batDau, ct);
}

function apDungDrive_(C, nhomCo, batDau, ct) {
  ct = ct || drConTroMoi_('day-du');
  if (ct.giai === 'nhom') ct.giai = 'goc';
  var S = {
    C: C, nhomCo: nhomCo || {}, khongChac: {}, thu: !!P.thu, batDau: batDau || Date.now(), ct: ct, thayDoi: ct.cheDo === 'thay-doi' && !P.thu,
    tenGoc: {}, oGoc: {}, idx: {}, maCT: {}, tmGoc: {}, tmTheoNhom: {}, tepMau: {}, mau: {}, dau: {},
    M: { quyen: {}, quanLy: {} }, kqNguoi: {}, ghiNhom: {}, ghiCt: {}, baoMau: {}, baoNguon: {},
    dem: { o: 0, tm: 0, nhanLai: 0, qThem: 0, qDoi: 0, qGo: 0, ltThem: 0, ltBo: 0, thu: 0, boQua: 0 }
  };
  Object.keys(ct.nhomDa || {}).forEach(function (e) { if (ct.nhomDa[e] === 2) S.khongChac[e] = true; });
  C.cauTruc.forEach(function (d) { S.maCT[d.ma] = true; if (d.loai === 'Ổ' && d.ma !== 'CN_TEN') S.tenGoc[d.o] = true; });
  var xong = false, hetGio = false;
  try {
    drOGoc_(S);
    drThuMucGoc_(S);
    drThuMucNhom_(S);
    if (ct.giai === 'goc') {
      drQuanLyGoc_(S);
      var ds = Object.keys(S.M.quanLy);
      for (var i = ct.i || 0; i < ds.length; i++) { drKiemGio_(S); drDoiSoat_(S, ds[i], S.M.quyen[ds[i]] || {}, S.M.quanLy[ds[i]]); ct.i = i + 1; }
      ct.giai = 'nguoiGoc'; ct.da = {};
    }
    if (ct.giai === 'nguoiGoc') {
      C.dsNguoi.forEach(function (n) {
        var k = drKhoaNg_(n);
        if (ct.da[k]) return;
        drKiemGio_(S);
        if (drCanXuLy_(S, n)) {
          var loi = P.loi;
          var kq = drNguoiGoc_(S, n);
          if (kq) ct.kqGoc[k] = kq;
          if (P.loi > loi) ct.loiNg[k] = 1;
        }
        ct.da[k] = 1;
      });
      ct.giai = 'oCaNhan'; ct.da = {};
    }
    if (ct.giai === 'oCaNhan') {
      C.dsNguoi.forEach(function (n) {
        var k = drKhoaNg_(n);
        if (ct.da[k]) return;
        drKiemGio_(S);
        drXepThuLop_(S, n);                                          // thư lớp chỉ xem: không phụ thuộc dấu thay đổi
        if (drCanXuLy_(S, n)) {
          var loi = P.loi;
          drOCaNhan_(S, n);
          var kqN = S.kqNguoi[n.email];
          if (ct.kqGoc[k]) kqN.push(ct.kqGoc[k]);
          if (!kqN.length) kqN.push('ổ ✔');
          delete S.dau[k];
          if (!S.thu && P.loi === loi && !ct.loiNg[k]) PropertiesService.getScriptProperties().setProperty('SDH_P_' + k, drDau_(S, n));
        } else S.dem.boQua++;
        ct.da[k] = 1;
      });
      ct.giai = 'xong';
    }
    xong = true;
  } catch (e) {
    if (!e || !e.drHetGio) throw e;
    hetGio = true;
  } finally {
    // A6: lưu con trỏ (và hẹn chạy tiếp khi hết giờ) TRƯỚC khi ghi bảng — ghi bảng có thể bị cắt ở giới hạn cứng 6 phút
    if (!S.thu) {
      if (xong) sdXoaJson_(DR.KHOA_CT);
      else { sdLuuJson_(DR.KHOA_CT, ct); if (hetGio) drHenChayTiep_(); }
    }
    drGhiBang_(S, xong);
  }
  var d = S.dem, se = S.thu ? 'sẽ ' : '';
  P.tomTat = (S.thu ? 'Xem trước: ' : '') + (S.thayDoi ? '[chỉ thay đổi, bỏ qua ' + d.boQua + ' người] ' : '') + se + 'tạo ' + d.o + ' ổ, ' + d.tm + ' thư mục' +
    (d.nhanLai ? ', nhận lại ' + d.nhanLai : '') + '; quyền +' + d.qThem + ' ~' + d.qDoi + ' −' + d.qGo +
    '; lối tắt +' + d.ltThem + ' −' + d.ltBo + '; thư chào xếp hàng ' + d.thu + '.';
  if (xong) {
    if (!S.thu) drXoaHen_();
  } else {
    P.tomTat += ' Chưa xong, ' + (S.thu ? 'Xem trước dừng do hết giờ.' : 'sẽ chạy tiếp sau 1 phút (tiếp từ chỗ dừng).');
    ghi_('Drive', 'Chưa xong, sẽ chạy tiếp', S.thu ? 'hết giờ (Xem trước, không hẹn)' : 'hẹn chạy lại sau 1 phút · giai đoạn ' + ct.giai);
  }
}

/* ===================== DẤU THAY ĐỔI ===================== */

function drKhoaNg_(n) { return n.maHT || n.email; }

/** Chế độ đầy đủ: luôn xử lý. Chế độ thay đổi: chỉ khi dấu khác lần trước. */
function drCanXuLy_(S, n) {
  if (!S.thayDoi) return true;
  return PropertiesService.getScriptProperties().getProperty('SDH_P_' + drKhoaNg_(n)) !== drDau_(S, n);
}

function drDau_(S, n) {
  var k = drKhoaNg_(n);
  if (S.dau[k]) return S.dau[k];
  var C = S.C;
  var dongNhom = function (g) { return g ? [g.ma, g.ten, g.loai, g.thuoc, g.nhanh, g.tt].join('~') : '-'; };
  var dongNg = function (x) { return x ? [x.email, x.ten, x.ma, x.vaiTro, x.level, x.tt, x.idO, x.maHT].join('~') : '-'; };
  if (!S.dauChung) {
    S.dauChung = sdBam_(JSON.stringify([C.cd,
      C.cauTruc.map(function (d) { return [d.ma, d.o, d.duong, d.loai, d.nguon, d.quyen]; }),
      Object.keys(C.vaiTro).sort().map(function (v) { var x = C.vaiTro[v]; return [v, x.chiaSe, x.khiNghi, x.khuon]; }),
      dsLevel_(C).map(function (ma) { return dongNhom(C.nhom[ma]); })]));
  }
  var phan = [S.dauChung, dongNg(n)];
  var eR = emailNhomRieng_(C, n);
  phan.push(eR && S.nhomCo[eR] ? 'r1' : 'r0');
  nhomCuaNguoi_(C, n.email).forEach(function (t) {
    var g = C.nhom[t.ma];
    phan.push([t.ma, t.loai, t.vai, t.quyen].join('~'), dongNhom(g));
    if (g && g.loai === 'Lớp') phan.push(lopDayDu_(C, g.ma) ? 'dd1' : 'dd0');   // WD-28: thêm/bớt nhóm nhỏ đổi kiểu lớp
    if (g && g.thuoc) phan.push(dongNhom(C.nhom[g.thuoc]));
    if (g && g.loai === 'Nhóm nhỏ') {
      phan.push(S.nhomCo[emailNhom_(C, g.ma, 'pt')] ? 'pt1' : 'pt0');
      if (t.vai === 'Phụ trách') thanhVienNhom_(C, g.ma).forEach(function (x) {
        var hv = C.nguoi[x.email];                                   // không lấy ID ổ của HV (đổi trong cùng lượt)
        phan.push([x.email, x.vai].join('~'), hv ? [hv.ten, hv.ma, hv.vaiTro, hv.tt, hv.maHT].join('~') : '-');
      });
    }
  });
  return (S.dau[k] = sdBam_(phan.join('|')));
}

/* ===================== THỜI GIAN & HẸN GIỜ ===================== */

function drHetGio_(S) { return Date.now() - S.batDau > DR.GIOI_HAN_MS; }
function drKiemGio_(S) { if (drHetGio_(S)) throw { drHetGio: true }; }
function drBayGioMs_() { return Date.now(); }                      // kiểm thử thay hàm này để giả thời gian

function drCoTrinh_(ham) { return ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction && t.getHandlerFunction() === ham; }); }

function drXoaTrinh_(ham) {
  var n = 0;
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction && t.getHandlerFunction() === ham) { ScriptApp.deleteTrigger(t); n++; }
  });
  return n;
}

function drHenChayTiep_() { if (!drCoTrinh_(DR.HAM_TIEP)) ScriptApp.newTrigger(DR.HAM_TIEP).timeBased().after(60000).create(); }
function drXoaHen_() { drXoaTrinh_(DR.HAM_TIEP); }

/* ===================== THƯ CHÀO (HÀNG ĐỢI 60 PHÚT) ===================== */

function drXepHangThu_(S, n, idO) {
  S.dem.thu++;
  ghi_('Thư chào', (S.thu ? 'Sẽ xếp hàng' : 'Xếp hàng') + ' (gửi sau 60 phút)', n.email);
  if (S.thu) return;
  var hang = sdDocJson_(DR.KHOA_HANG) || [];
  if (!hang.some(function (x) { return x.idO === idO; })) hang.push({ idO: idO, email: n.email, luc: drBayGioMs_() });
  sdLuuJson_(DR.KHOA_HANG, hang);
  if (!drCoTrinh_(DR.HAM_THU)) ScriptApp.newTrigger(DR.HAM_THU).timeBased().after(DR.CHO_THU_MS + 60000).create();
}

/**
 * Thư lớp chỉ xem (WD-28): xếp hàng cho người Đang là Thành viên Đang của Lớp chỉ xem Đang, khi đã có thư mục lớp và nhóm
 * sd-<lớp>@ (để quyền đã cấp), chưa có dấu SD_THU_LOP_… và chưa trong hàng đợi. Tôn trọng CAI_DAT "Gửi thư chào".
 */
function drXepThuLop_(S, n) {
  var C = S.C;
  if (!C.cd.guiThuChao || n.tt !== 'Đang') return;
  var pr = PropertiesService.getScriptProperties();
  nhomCuaNguoi_(C, n.email).forEach(function (t) {
    var g = C.nhom[t.ma];
    if (!g || t.vai !== 'Thành viên' || g.tt !== 'Đang' || !lopChiXem_(C, g.ma)) return;
    var idTm = S.tmTheoNhom[g.ma];
    if (!idTm || !S.nhomCo[emailNhom_(C, g.ma, '')]) return;              // chưa có thư mục / nhóm: lượt sau
    var khoa = drKhoaThuLop_(n, g.ma);
    if (pr.getProperty(khoa)) return;
    if (!S.hangThu) S.hangThu = sdDocJson_(DR.KHOA_HANG) || [];
    if (S.hangThu.some(function (x) { return x.khoa === khoa; })) return;
    S.dem.thu++;
    ghi_('Thư lớp', (S.thu ? 'Sẽ xếp hàng' : 'Xếp hàng') + ' (gửi sau 60 phút) · lớp chỉ xem ' + g.ma, n.email);
    if (S.thu) return;
    S.hangThu.push({ lop: g.ma, idTm: idTm, email: n.email, khoa: khoa, khoaNg: drKhoaNg_(n), luc: drBayGioMs_() });
    sdLuuJson_(DR.KHOA_HANG, S.hangThu);
    if (!drCoTrinh_(DR.HAM_THU)) ScriptApp.newTrigger(DR.HAM_THU).timeBased().after(DR.CHO_THU_MS + 60000).create();
  });
}

function drKhoaThuLop_(n, ma) { return DR.TIEN_TO_THU_LOP + drKhoaNg_(n) + '_' + ma; }

/** Người còn là Thành viên Đang của lớp chỉ xem Đang `ma` không: trả dòng THANH_VIEN hoặc null. */
function drTvLopChiXem_(C, n, ma) {
  var g = C.nhom[ma];
  if (!n || n.tt !== 'Đang' || !g || g.tt !== 'Đang' || !lopChiXem_(C, ma)) return null;
  return nhomCuaNguoi_(C, n.email).filter(function (t) { return t.ma === ma && t.vai === 'Thành viên'; })[0] || null;
}

/**
 * Gửi thư chào + thư lớp. guiLai=false: chỉ mục trong hàng đợi đã ≥ 60 phút. guiLai=true (sdGuiLaiThuChao): thêm mọi người
 * có ổ mà chưa có dấu SD_THU_<ID ổ>, và mọi thành viên lớp chỉ xem (lớp đã có ID thư mục) chưa có dấu SD_THU_LOP_…
 * (trừ mục còn trong hàng đợi chưa đủ 60 phút). Xem trước: chỉ báo số thư.
 */
function drGuiThuDenHan_(C, guiLai) {
  var pr = PropertiesService.getScriptProperties();
  var hang = sdDocJson_(DR.KHOA_HANG) || [], bay = drBayGioMs_(), con = [], gui = [], daCo = {};
  hang.forEach(function (x) { daCo[x.lop ? x.khoa : x.idO] = true; if (bay - x.luc >= DR.CHO_THU_MS) gui.push(x); else con.push(x); });
  if (guiLai) {
    C.dsNguoi.forEach(function (n) {
      if (n.idO && !daCo[n.idO] && coOCaNhan_(C, n) && !pr.getProperty('SD_THU_' + n.idO)) gui.push({ idO: n.idO, email: n.email, luc: 0 });
      nhomCuaNguoi_(C, n.email).forEach(function (t) {
        var g = C.nhom[t.ma], k = drKhoaThuLop_(n, t.ma);
        if (!g || !g.idThuMuc || daCo[k] || !drTvLopChiXem_(C, n, t.ma) || pr.getProperty(k)) return;
        gui.push({ lop: g.ma, idTm: g.idThuMuc, email: n.email, khoa: k, khoaNg: drKhoaNg_(n), luc: 0 });
      });
    });
  }
  if (!gui.length) { if (guiLai) P.tomTat = 'Không có ai cần gửi thư chào.'; return; }
  if (P.thu) { ghi_('Thư chào', 'Sẽ gửi ' + gui.length + ' thư chào/thư lớp đã đến hạn', ''); return; }
  var theoO = {}, theoKhoa = {};
  C.dsNguoi.forEach(function (n) { if (n.idO) theoO[n.idO] = n; theoKhoa[drKhoaNg_(n)] = n; });
  var dong = {}, dongTv = {}, daGui = 0, loi = 0;
  gui.forEach(function (x) {
    if (x.lop) {
      var nl = theoKhoa[x.khoaNg] || C.nguoi[x.email], tvL = drTvLopChiXem_(C, nl, x.lop);
      if (!tvL) { ghi_('Thư lớp', 'Bỏ (không còn là thành viên lớp chỉ xem đang học)', x.email + ' · ' + x.lop); return; }
      var rl = drGuiThuLop_(C, nl, C.nhom[x.lop], C.nhom[x.lop].idThuMuc || x.idTm);
      if (rl === true) {
        daGui++;
        pr.setProperty(x.khoa, bayGio_() + ' · ' + nl.email);
        dongTv[tvL.dong] = 'thư lớp ✔ ' + homNay_();
      } else {
        loi++;
        dongTv[tvL.dong] = 'thư lớp LỖI: ' + rl;
        if (!guiLai) con.push(x);
      }
      return;
    }
    var n = theoO[x.idO];
    if (!n || !coOCaNhan_(C, n)) { ghi_('Thư chào', 'Bỏ (không còn ổ đang dùng)', x.email); return; }
    var r = drGuiThu_(C, n, x.idO);
    if (r === true) {
      daGui++;
      pr.setProperty('SD_THU_' + x.idO, bayGio_() + ' · ' + n.email);
      dong[n.dong] = 'thư chào ✔ ' + homNay_();
    } else {
      loi++;
      dong[n.dong] = 'thư chào LỖI: ' + r;
      if (!guiLai) con.push(x);                                    // giữ lại để lần sau thử tiếp
    }
  });
  if (con.length) sdLuuJson_(DR.KHOA_HANG, con); else sdXoaJson_(DR.KHOA_HANG);
  if (con.length && !drCoTrinh_(DR.HAM_THU)) ScriptApp.newTrigger(DR.HAM_THU).timeBased().after(DR.CHO_THU_MS + 60000).create();
  if (!con.length) drXoaTrinh_(DR.HAM_THU);
  [['NGUOI', dong], ['THANH_VIEN', dongTv]].forEach(function (x) {
    try {
      var b = C.bang[x[0]], c = b.tieuDe.indexOf('Kết quả Drive');
      if (c < 0 || !Object.keys(x[1]).length) return;
      var m = {};
      Object.keys(x[1]).forEach(function (d) {
        var cu = chuan_(b.tab.getRange(Number(d), c + 1).getValues()[0][0]);
        m[d] = (cu ? cu + ' · ' : '') + x[1][d];
      });
      ghiCot_(b, 'Kết quả Drive', m);
    } catch (e) { ghi_('LỖI', 'Ghi ' + x[0] + ' · Kết quả Drive (thư): ' + e.message, ''); }
  });
  var tt = 'Thư chào/thư lớp: đã gửi ' + daGui + (loi ? ', LỖI ' + loi : '') + '.';
  P.tomTat = P.tomTat ? P.tomTat + ' ' + tt : tt;
}

/** Gửi thư báo lớp chỉ xem (WD-28). Trả true hoặc chuỗi lỗi. */
function drGuiThuLop_(C, n, g, idTm) {
  var ten = C.cd.tenHienThi, link = 'https://drive.google.com/drive/folders/' + idTm;
  var tieuDe = (C.cd.giaLap ? '[THỬ] ' : '') + 'Lớp ' + g.ten + ' trên ' + ten + ' đã sẵn sàng';
  var than = 'Chào ' + n.ten + ',\n\n' +
    'Thư mục lớp "' + g.ten + '" trên ' + ten + ' đã sẵn sàng. Bạn xem được video và tài liệu của lớp tại:\n' + link + '\n\n' +
    'Cách dùng:\n' +
    '1. Đánh dấu sao (Star) thư mục, hoặc lưu đường link này, để lần sau mở lại nhanh.\n' +
    '2. Nếu mở link mà Drive báo cần quyền truy cập: ĐỪNG bấm "Request access" (Yêu cầu quyền truy cập). ' +
    'Quyền đang được cấp tự động và có thể mất tối đa 30 phút; hãy đợi rồi tải lại trang.\n' +
    '\nCần hỗ trợ, bạn chỉ cần trả lời thư này.';
  try {
    if (typeof GmailApp !== 'undefined' && GmailApp && GmailApp.sendEmail) GmailApp.sendEmail(n.email, tieuDe, than, { name: ten });
    else MailApp.sendEmail(n.email, tieuDe, than);
    ghi_('Thư lớp', 'Đã gửi · ' + g.ma, n.email);
    return true;
  } catch (e) {
    ghi_('LỖI', 'Gửi thư lớp (kiểm tra MX/SPF/DKIM của tên miền, hạn mức gửi): ' + e.message, n.email + ' · ' + g.ma);
    return e.message;
  }
}

/** Gửi một thư chào. Trả true hoặc chuỗi lỗi. */
function drGuiThu_(C, n, id) {
  var ten = C.cd.tenHienThi, link = 'https://drive.google.com/drive/folders/' + id;
  var tenO = tenOCaNhan_(C, n), hoc = laNguoiHoc_(C, n);
  var dHs = dongCauTruc_(C, 'CN_HS'), dTl = dongCauTruc_(C, 'HS_TL');
  var tenTl = dTl ? drDoan_(dTl.duong).slice(-1)[0] : '00_TAI-LIEU-CUA-TOI';
  var tieuDe = (C.cd.giaLap ? '[THỬ] ' : '') + 'Ổ làm việc của bạn trên ' + ten + ' đã sẵn sàng';
  var than = 'Chào ' + n.ten + ',\n\n' +
    'Ổ làm việc mang tên bạn trên ' + ten + ' đã sẵn sàng: "' + tenO + '"\n' + link + '\n\n' +
    'Cách dùng:\n' +
    '1. Mở Google Drive (drive.google.com), vào mục "Bộ nhớ dùng chung" (Shared drives) để thấy ổ mang tên bạn.\n' +
    '2. Các lối tắt trong ổ dẫn tới mọi tài liệu bạn được dùng; bạn không cần tìm ở nơi khác.\n' +
    '3. Nếu bấm vào lối tắt mà Drive báo cần quyền truy cập: ĐỪNG bấm "Request access" (Yêu cầu quyền truy cập). ' +
    'Quyền đang được cấp tự động và có thể mất tối đa 30 phút; hãy đợi rồi tải lại trang.\n' +
    (hoc ? '4. Bài nộp và tài liệu học tập của bạn đặt trong lối tắt "' + (dHs ? dHs.duong : 'Hồ sơ học tập') + '" (Hồ sơ học tập); ' +
      'tài liệu riêng để trong thư mục ' + tenTl + '.\n'
      : '4. Bạn có thể tải tài liệu của mình lên ngay trong ổ này.\n') +
    '\nCần hỗ trợ, bạn chỉ cần trả lời thư này.';
  try {
    if (typeof GmailApp !== 'undefined' && GmailApp && GmailApp.sendEmail) GmailApp.sendEmail(n.email, tieuDe, than, { name: ten });
    else MailApp.sendEmail(n.email, tieuDe, than);
    ghi_('Thư chào', 'Đã gửi', n.email);
    return true;
  } catch (e) {
    ghi_('LỖI', 'Gửi thư chào (kiểm tra MX/SPF/DKIM của tên miền, hạn mức gửi): ' + e.message, n.email);
    return e.message;
  }
}

/* ===================== Ổ GỐC ===================== */

function drOGoc_(S) {
  var C = S.C;
  C.cauTruc.forEach(function (d) {
    if (d.loai !== 'Ổ' || d.ma === 'CN_TEN') return;
    drKiemGio_(S);
    var id = d.id;
    if (id) {
      var o = drLayO_(id);
      if (!o) { ghi_('LỖI', 'Không mở được ổ gốc theo ID ở CAU_TRUC', d.ma + ' · ' + id); return; }
      if (o.name !== d.duong) {
        ghi_('Ổ gốc', (S.thu ? 'Sẽ đổi tên ' : 'Đổi tên ') + '"' + o.name + '" → "' + d.duong + '"', d.ma);
        if (!S.thu) Drive.Drives.update({ name: d.duong }, id);
      }
      drHanChe_(S, id, o.restrictions, DR.HAN_CHE_GOC, d.duong);
    } else if (S.thu) {
      id = DR.CHUA_TAO + d.ma; S.dem.o++;
      ghi_('Ổ gốc', 'Sẽ tạo ổ', d.duong);
    } else {
      id = drTaoO_(S, d.duong, DR.HAN_CHE_GOC);
      d.id = id;
      var m = {}; m[d.dong] = id;
      ghiCot_(C.bang.CAU_TRUC, 'ID', m);
      ghi_('Ổ gốc', 'Đã tạo ổ', d.duong);
    }
    S.oGoc[d.o] = id;
    if (d.ma === 'O_DL' && S.ct.giai === 'goc') {
      var muon = {};
      [['', 'reader'], ['sua', 'writer'], ['pt', 'fileOrganizer']].forEach(function (x) {
        var e = emailNhom_(C, 'DULIEU', x[0]);
        if (S.nhomCo[e]) muon[e] = { role: x[1], type: 'group' };
      });
      drDoiSoat_(S, id, muon, 'thành viên ổ ' + d.duong);
    }
  });
}

function drLayO_(id) {
  try { return Drive.Drives.get(id, { fields: 'id,name,restrictions' }); } catch (e) { return null; }
}

function drTaoO_(S, ten, hanChe) {
  var d = Drive.Drives.create({ name: ten }, Utilities.getUuid());
  drThuLai_(function () { Drive.Drives.update({ restrictions: hanChe }, d.id); });
  S.dem.o++;
  if (typeof glGhiSo_ === 'function') glGhiSo_(S.C, 'Ổ', d.id, ten);
  return d.id;
}

function drHanChe_(S, id, hienTai, muon, nhan) {
  hienTai = hienTai || {};
  var khac = Object.keys(muon).filter(function (k) { return !!hienTai[k] !== muon[k]; });
  if (!khac.length) return false;
  ghi_('Hạn chế ổ', (S.thu ? 'Sẽ đặt ' : 'Đặt ') + khac.map(function (k) { return k + '=' + muon[k]; }).join(', '), nhan);
  if (!S.thu && !drChua_(id)) drThuLai_(function () { Drive.Drives.update({ restrictions: muon }, id); });
  return true;
}

/* ===================== THƯ MỤC Ở Ổ GỐC ===================== */

function drTimDongGoc_(S, o, duong) {
  for (var i = 0; i < S.C.cauTruc.length; i++) {
    var d = S.C.cauTruc[i];
    if (d.loai === 'Thư mục' && d.o === o && d.duong === duong) return d;
  }
  return null;
}

function drThuMucGoc_(S) {
  S.C.cauTruc.forEach(function (d) { if (d.loai === 'Thư mục' && S.oGoc[d.o]) { drKiemGio_(S); drThuMucDong_(S, d); } });
}

/** Thư mục của một dòng "Thư mục" ở ổ gốc (nhớ theo mã). */
function drThuMucDong_(S, d) {
  if (S.tmGoc.hasOwnProperty(d.ma)) return S.tmGoc[d.ma];
  S.tmGoc[d.ma] = null;                                   // chống vòng lặp
  var oId = S.oGoc[d.o];
  if (!oId) return null;
  var segs = drDoan_(d.duong);
  var cha = drChaTheoDuong_(S, oId, segs.slice(0, -1), { timDong: drTimGoc_(S, d.o) });
  var id = drDamBao_(S, oId, cha, segs[segs.length - 1], { sdma: d.ma });
  S.tmGoc[d.ma] = id;
  if (!id) return null;
  drQuanLy_(S.M, id, d.duong);
  if (d.ma === 'TTC_EF') drCapNhom_(S, S.M, id, emailTong_(S.C, 'ef'), 'reader');
  if (d.ma === 'TTC_HV') drCapNhom_(S, S.M, id, emailTong_(S.C, 'hv'), 'reader');
  if (!drChua_(id) && id !== d.id) S.ghiCt[d.dong] = id;
  return id;
}

function drTimGoc_(S, o) {
  return function (tienTo) { var r = drTimDongGoc_(S, o, tienTo); return r ? drThuMucDong_(S, r) : undefined; };
}

/* ===================== THƯ MỤC THEO NHÓM ===================== */

function drNhomDong_(g) { return g.tt === 'Đóng' || g.tt === 'Ngừng'; }

function drThuMucNhom_(S) {
  var C = S.C;
  C.cauTruc.forEach(function (d) {
    if (d.loai !== 'Thư mục theo nhóm') return;
    var oId = S.oGoc[d.o];
    if (!oId) return;
    var loai = drDsSauHaiCham_(d.nguon);
    var con = C.cauTruc.filter(function (x) { return x.loai === 'Thư mục con của nhóm' && x.o === d.o; });
    var segs = drDoan_(d.duong);
    C.dsNhom.forEach(function (g) {
      if (loai.indexOf(g.loai) < 0) return;
      drKiemGio_(S);
      var dong = drNhomDong_(g);
      if (!drTimTheoNhan_(S, oId, { sdma: d.ma, sdnhom: g.ma }) && !drNhanLaiTheoId_(S, oId, d, g)) return;   // A1: đổi Mã nhóm
      var cha = drChaTheoDuong_(S, oId, segs.slice(0, -1), { g: g, maDong: d.ma, khongTao: dong, timDong: drTimGoc_(S, d.o) });
      var id = drDamBao_(S, oId, cha, dienMau_(segs[segs.length - 1], null, g), { sdma: d.ma, sdnhom: g.ma }, dong);
      if (!id) return;
      if (!S.tmTheoNhom[g.ma]) {
        S.tmTheoNhom[g.ma] = id;
        if (!drChua_(id) && id !== g.idThuMuc) S.ghiNhom[g.dong] = id;
      }
      drQuanLy_(S.M, id, g.ma);
      if (!dong) drQuyenNhom_(S, id, g);
      con.forEach(function (x) {
        var s2 = drDoan_(x.duong);
        if (/^\{.*\}$/.test(s2[0])) s2.shift();
        if (!s2.length) return;
        var c2 = drChaTheoDuong_(S, oId, s2.slice(0, -1), { goc: id, khongTao: dong });
        var id2 = drDamBao_(S, oId, c2, s2[s2.length - 1], { sdma: x.ma, sdnhom: g.ma }, dong);
        if (id2) drQuanLy_(S.M, id2, g.ma + '/' + s2.join('/'));
        // WD-28: Phụ trách lớp được Sửa CHỈ ở thư mục con LOP_TL (tài liệu); VIDEO thừa kế Xem
        if (id2 && !dong && g.loai === 'Lớp' && x.ma === DR.MA_LOP_TL && (g.tt === 'Đang' || g.tt === 'Kết thúc')) {
          drCapNhom_(S, S.M, id2, emailNhom_(C, g.ma, 'pt'), 'writer');
        }
      });
    });
  });
}

/**
 * A1 (N1): không thấy thư mục theo nhãn sdnhom = mã mới. Nếu NHOM "ID thư mục" trỏ tới thư mục cùng ổ, chưa xóa, sdma = mã dòng
 * CAU_TRUC này → nhận lại: đổi sdnhom (cả thư mục con mang sdnhom cũ) sang mã mới; drDamBao_ sau đó đổi tên/chuyển chỗ.
 * sdnhom cũ thuộc một nhóm khác đang có ở NHOM → LỖI, không nhận (trả false: bỏ qua nhóm này, không tạo thư mục mới).
 * Trả true khi đi tiếp được (đã nhận lại, hoặc không có gì để nhận → tạo mới như thường).
 */
function drNhanLaiTheoId_(S, oId, d, g) {
  if (!g.idThuMuc || drChua_(oId)) return true;
  var ix = drChiMuc_(S, oId), f = ix.ds.filter(function (x) { return x.id === g.idThuMuc; })[0];
  if (!f) return true;                                             // không còn / khác ổ / đã vào thùng rác
  var p = f.properties || {}, cu = p.sdnhom || '';
  if (p.sdma !== d.ma || cu === g.ma) return true;
  if (cu && S.C.nhom[cu]) {
    ghi_('LỖI', 'NHOM "ID thư mục" của ' + g.ma + ' trỏ tới thư mục của nhóm ' + cu + ' (đang có ở NHOM): không nhận lại, không tạo mới. Sửa cột ID thư mục.', f.name + ' · ' + f.id);
    return false;
  }
  var con = drConChau_(ix, f.id).filter(function (x) { return (x.properties || {}).sdnhom === cu && cu; });
  S.dem.nhanLai++;
  ghi_('Thư mục', (S.thu ? 'Sẽ nhận lại' : 'Nhận lại') + ' thư mục cũ theo ID (đổi Mã nhóm ' + (cu || '—') + ' → ' + g.ma + (con.length ? ', kèm ' + con.length + ' thư mục con' : '') + ')', f.name + ' · ' + f.id);
  [f].concat(con).forEach(function (x) {
    var k = drKhoa_(x.properties || {});
    if (ix.khoa[k] === x) delete ix.khoa[k];
    if (!S.thu && !drChua_(x.id)) Drive.Files.update({ properties: { sdnhom: g.ma } }, x.id, null, { supportsAllDrives: true });
    x.properties = Object.assign({}, x.properties || {}, { sdnhom: g.ma });
    drThemChiMuc_(ix, x);
  });
  return true;
}

/** Mọi thư mục con cháu (trong chỉ mục) của thư mục `id`. */
function drConChau_(ix, id) {
  var kq = [], hang = [id];
  while (hang.length) {
    var cha = hang.shift();
    ix.ds.forEach(function (x) { if (x.parents[0] === cha) { kq.push(x); hang.push(x.id); } });
  }
  return kq;
}

/** Quyền thư mục nhóm theo bảng 2.2. */
function drQuyenNhom_(S, id, g) {
  var C = S.C;
  if (g.loai === 'Level') {
    levelDuocXem_(C, g.ma).forEach(function (lx) { drCapNhom_(S, S.M, id, emailNhom_(C, lx, ''), 'reader'); });
  } else if (g.loai === 'Lớp') {
    if (g.tt === 'Đang' || g.tt === 'Kết thúc') {
      drCapNhom_(S, S.M, id, emailNhom_(C, g.ma, ''), 'reader');
      drCapNhom_(S, S.M, id, emailNhom_(C, g.ma, 'pt'), 'reader');     // WD-28: Sửa chỉ ở LOP_TL (drThuMucNhom_)
    }
  } else {
    drCapNhom_(S, S.M, id, emailNhom_(C, g.ma, ''), 'reader');
    drCapNhom_(S, S.M, id, emailNhom_(C, g.ma, 'sua'), 'writer');
    drCapNhom_(S, S.M, id, emailNhom_(C, g.ma, 'pt'), 'fileOrganizer');
  }
}

/** Thư mục có mã ở ổ gốc KHÔNG thuộc người đang ở NGUOI: đối soát ở giai đoạn goc; mã lạ → "ngoài cấu hình". */
function drQuanLyGoc_(S) {
  var C = S.C, coU = {};
  C.dsNguoi.forEach(function (n) { if (n.maHT) coU[n.maHT] = true; });
  Object.keys(S.oGoc).forEach(function (o) {
    var oId = S.oGoc[o];
    if (!oId) return;
    var bao = {};
    drChiMuc_(S, oId).ds.forEach(function (f) {
      var p = f.properties || {}, ma = p.sdma;
      if (!ma) return;
      if (!drMaHopLe_(S, ma)) {
        if (!bao[ma]) { bao[ma] = true; ghi_('Ngoài cấu hình', 'Thư mục mang mã "' + ma + '" không còn trong CAU_TRUC (không xóa)', o + ' · ' + f.name); }
        return;
      }
      var cuaNguoi = p.sdma_u ? coU[p.sdma_u] : (p.sdemail ? !!C.nguoi[p.sdemail] : false);
      if (!cuaNguoi) drQuanLy_(S.M, f.id, f.name);                // người đang có: xử lý ở giai đoạn nguoiGoc
    });
  });
}

function drMaHopLe_(S, ma) {
  if (S.maCT[ma] || ma === DR.MA_HV_PT_SUB || ma === DR.MA_CA_NHAN) return true;
  return /_NHANH$/.test(ma) && !!S.maCT[ma.replace(/_NHANH$/, '')];
}

/* ===================== THƯ MỤC THEO NGƯỜI (Ổ GỐC) ===================== */

/** Nhãn properties theo người. */
function drApNg_(ma, n, them) {
  var ap = { sdma: ma };
  if (n.maHT) ap.sdma_u = n.maHT;
  ap.sdemail = n.email;
  if (them) Object.keys(them).forEach(function (k) { ap[k] = them[k]; });
  return ap;
}

function drCuaNguoi_(p, n) {
  p = p || {};
  if (p.sdma_u) return !!n.maHT && p.sdma_u === n.maHT;
  return !!p.sdemail && p.sdemail === n.email;
}

/** Ai nhận quyền "theo người": nhóm riêng (nếu đã có), không thì tạm email. */
function drChuThe_(S, n) {
  var eR = emailNhomRieng_(S.C, n);
  if (eR && S.nhomCo[eR]) return { email: eR, type: 'group' };
  return { email: n.email, type: 'user', tam: true };
}

/** Người có đủ điều kiện cho dòng "Thư mục theo người" không. Nguồn: "Nhóm: RAW" | "Vai trò: HV, …". */
function drNguoiHopLe_(S, d, n) {
  var C = S.C, m = /^\s*(Nhóm|Vai trò)\s*:\s*(.+)$/.exec(d.nguon || '');
  if (!m) {
    if (!S.baoNguon[d.ma]) { S.baoNguon[d.ma] = true; ghi_('LỖI', 'Dòng ' + d.ma + ': cột Nguồn phải là "Nhóm: <mã>" hoặc "Vai trò: <vai>"', d.nguon); }
    return false;
  }
  var gt = m[2].split(',').map(chuan_);
  if (m[1] === 'Nhóm') {
    if (n.tt !== 'Đang') return false;
    return gt.some(function (ma) {
      ma = maNhom_(ma);
      return nhomConHieuLuc_(C, ma) && thanhVienNhom_(C, ma).some(function (t) { return t.email === n.email; });
    });
  }
  if (!coOCaNhan_(C, n)) return false;
  return gt.indexOf(n.vaiTro) >= 0 || (gt.indexOf('HV') >= 0 && laNguoiHoc_(C, n));
}

function drDongTheoNguoi_(S, ma) {
  var d = dongCauTruc_(S.C, ma);
  return d && d.loai === 'Thư mục theo người' ? d : null;
}

/** Tìm thư mục theo người đã có (theo nhãn; Mã hệ thống trước, email sau) trong chỉ mục. */
function drTimTheoNhan_(S, oId, ap) {
  var ix = drChiMuc_(S, oId), f = ix.khoa[drKhoa_(ap)];
  if (!f && ap.sdma_u && ap.sdemail) {
    var ap2 = {}; Object.keys(ap).forEach(function (k) { if (k !== 'sdma_u') ap2[k] = ap[k]; });
    f = ix.khoa[drKhoa_(ap2)];
  }
  return f || null;
}

/** ID thư mục theo người của dòng `ma` (chỉ khi người còn đủ điều kiện), dùng làm đích lối tắt. */
function drTmNguoi_(S, ma, n, lop) {
  var d = drDongTheoNguoi_(S, ma), oId = d && S.oGoc[d.o];
  if (!oId || !drNguoiHopLe_(S, d, n)) return null;
  if (!lop) { var f = drTimTheoNhan_(S, oId, drApNg_(ma, n)); return f ? f.id : null; }
  var x = S.C.cauTruc.filter(function (r) { return r.loai === 'Thư mục con theo lớp' && r.o === d.o; })[0];
  if (!x) return null;
  var f2 = drTimTheoNhan_(S, oId, drApNg_(x.ma, n, { sdlop: lop }));
  return f2 ? f2.id : null;
}

/** Giai đoạn nguoiGoc cho một người: tạo/nhận lại thư mục theo người, đối soát quyền mọi thư mục/tệp mang nhãn người đó. */
function drNguoiGoc_(S, n) {
  var C = S.C, M = { quyen: {}, quanLy: {} }, chu = drChuThe_(S, n), co = false;
  C.cauTruc.forEach(function (d) {
    if (d.loai !== 'Thư mục theo người') return;
    var oId = S.oGoc[d.o];
    if (!oId) return;
    var hop = drNguoiHopLe_(S, d, n), segs = drDoan_(d.duong);
    var cha = drChaTheoDuong_(S, oId, segs.slice(0, -1), { timDong: drTimGoc_(S, d.o), khongTao: !hop });
    var id = drDamBao_(S, oId, cha, dienMau_(segs[segs.length - 1], n, null), drApNg_(d.ma, n), !hop);
    if (!id) return;
    co = co || hop;
    drQuanLy_(M, id, d.ma + ' · ' + n.email);
    var vai = d.ma === 'RAW_NG' ? 'writer' : (d.ma === 'WIKI_NG' || d.ma === 'HS_NG') ? 'reader' : (drVaiTuQuyen_(d.quyen) || 'reader');
    if (hop) drCap_(M, id, chu.email, vai, chu.type);
    C.cauTruc.forEach(function (x) {
      if (x.o !== d.o) return;
      if (x.loai === 'Thư mục con theo lớp') drNopBai_(S, M, oId, id, x, n, hop, chu);
      else if (x.loai === 'Thư mục con theo người') drConNguoi_(S, M, oId, id, x, n, hop, chu);
      else if (x.loai === 'Tệp mẫu') drTepMau_(S, M, oId, id, x, n, hop, chu);
    });
    if (d.ma === 'WIKI_NG') drTepWiki_(S, M, id, hop, chu);
  });
  // Mọi thư mục khác mang nhãn người này (vd nộp bài lớp cũ, thư mục khi đã hết điều kiện)
  Object.keys(S.oGoc).forEach(function (o) {
    var oId = S.oGoc[o];
    if (!oId) return;
    drChiMuc_(S, oId).ds.forEach(function (f) {
      var p = f.properties || {};
      if (p.sdma && drMaHopLe_(S, p.sdma) && drCuaNguoi_(p, n)) drQuanLy_(M, f.id, f.name + ' · ' + n.email);
    });
    var tm = C.cauTruc.filter(function (x) { return x.loai === 'Tệp mẫu' && x.o === o; });
    tm.forEach(function (x) { var f = drTepMauCua_(S, oId, x.ma, n); if (f) drQuanLy_(M, f.id, x.ma + ' · ' + n.email); });
  });
  var r = drDoiSoatTatCa_(S, M);
  var kq = [], se = S.thu ? 'sẽ ' : '';
  if (co && chu.tam) kq.push(emailNhomRieng_(C, n) ? 'nhóm riêng chưa có: cấp tạm trực tiếp' : 'chưa có Mã hệ thống: cấp tạm trực tiếp');
  if (r.them + r.doi + r.go) kq.push(se + 'quyền thư mục người +' + r.them + (r.doi ? ' ~' + r.doi : '') + (r.go ? ' −' + r.go : ''));
  return kq.join(' · ');
}

/** Thư mục nộp bài theo lớp (HS_NOP) trong thư mục của người học: chỉ lớp người đó là Thành viên. */
function drNopBai_(S, M, oId, chaNguoi, x, n, hop, chu) {
  if (!hop) return;                                                // hết điều kiện: thư mục cũ được quét theo nhãn
  var C = S.C, segs = drDoan_(x.duong), mauTen = segs[segs.length - 1];
  var dsTv = nhomCuaNguoi_(C, n.email);
  dsTv.forEach(function (t) {
    var lop = C.nhom[t.ma];
    if (!lop || lop.loai !== 'Lớp' || t.vai !== 'Thành viên' || (lop.tt !== 'Đang' && lop.tt !== 'Kết thúc')) return;
    if (!lopDayDu_(C, lop.ma)) return;                             // WD-28: lớp chỉ xem không có nộp bài
    var id = drDamBao_(S, oId, chaNguoi, mauTen.replace(/\{Mã lớp\}/g, lop.ma), drApNg_(x.ma, n, { sdlop: lop.ma }));
    if (!id) return;
    drQuanLy_(M, id, 'nộp bài ' + lop.ma + ' · ' + n.email);
    if (lop.tt !== 'Đang') return;                    // Kết thúc: chỉ còn quyền xem thừa kế
    drCap_(M, id, chu.email, 'writer', chu.type);
    dsTv.forEach(function (t2) {
      var g = C.nhom[t2.ma];
      if (g && g.loai === 'Nhóm nhỏ' && g.thuoc === lop.ma && t2.vai === 'Thành viên' && !drNhomDong_(g)) {
        drCapNhom_(S, M, id, emailNhom_(C, g.ma, 'pt'), 'commenter');
      }
    });
  });
}

/** Thư mục con theo người (HS_TL 00_TAI-LIEU-CUA-TOI): nhóm riêng writer; không cấp cho người phụ trách. */
function drConNguoi_(S, M, oId, chaNguoi, x, n, hop, chu) {
  var s2 = drDoan_(x.duong);
  if (/^\{.*\}$/.test(s2[0])) s2.shift();
  if (!s2.length) return;
  var c2 = drChaTheoDuong_(S, oId, s2.slice(0, -1), { goc: chaNguoi, khongTao: !hop });
  var id = drDamBao_(S, oId, c2, s2[s2.length - 1], drApNg_(x.ma, n), !hop);
  if (!id) return;
  drQuanLy_(M, id, x.ma + ' · ' + n.email);
  if (hop) drCap_(M, id, chu.email, drVaiTuQuyen_(x.quyen) || 'writer', chu.type);
}

/** Tệp mẫu đã chép trong một ổ: { 'u:<mã>'|'e:<email>': tệp }. */
function drTepMauCo_(S, oId, ma) {
  var k = oId + '|' + ma;
  if (S.tepMau[k]) return S.tepMau[k];
  var m = S.tepMau[k] = {};
  if (drChua_(oId)) return m;
  drLietKe_({ corpora: 'drive', driveId: oId, q: "properties has { key='sdma' and value='" + drNhay_(ma) + "' } and trashed=false" })
    .forEach(function (f) { var kn = drKhoaNguoiNhan_(f.properties); if (kn && !m[kn]) m[kn] = f; });
  return m;
}

function drKhoaNguoiNhan_(p) { p = p || {}; return p.sdma_u ? 'u:' + p.sdma_u : (p.sdemail ? 'e:' + p.sdemail : ''); }

function drTepMauCua_(S, oId, ma, n) {
  var co = drTepMauCo_(S, oId, ma);
  return (n.maHT && co['u:' + n.maHT]) || co['e:' + n.email] || null;
}

function drTimMau_(S, ten) {
  if (S.mau.hasOwnProperty(ten)) return S.mau[ten];
  S.mau[ten] = null;
  var tm = S.tmGoc.QT_MAU;
  if (!tm || drChua_(tm)) return null;
  var ds = drLietKe_({ q: "'" + tm + "' in parents and trashed=false and name='" + drNhay_(ten) + "' and mimeType!='" + DR.MIME_TM + "'" });
  S.mau[ten] = ds.length ? ds[0].id : null;
  return S.mau[ten];
}

function drTepMau_(S, M, oId, chaNguoi, x, n, hop, chu) {
  if (!hop) return;
  var segs = drDoan_(x.duong), ten = segs[segs.length - 1], ap = drApNg_(x.ma, n);
  var co = drTepMauCo_(S, oId, x.ma), f = drTepMauCua_(S, oId, x.ma, n);
  if (f) { drNhanDung_(S, f, ap, 'Tệp mẫu'); drQuanLy_(M, f.id, ten + ' · ' + n.email); drCap_(M, f.id, chu.email, 'writer', chu.type); return; }
  // Nhận lại: tệp chưa nhãn đúng tên trong thư mục người
  if (!drChua_(chaNguoi)) {
    var cu = drLietKe_({ q: "'" + chaNguoi + "' in parents and trashed=false and name='" + drNhay_(ten) + "' and mimeType!='" + DR.MIME_TM + "'" })
      .filter(function (t) { return !(t.properties || {}).sdma; });
    if (cu.length === 1) {
      S.dem.nhanLai++;
      ghi_('Tệp mẫu', (S.thu ? 'Sẽ nhận lại (gắn nhãn) ' : 'Nhận lại (gắn nhãn) ') + '"' + ten + '"', n.email);
      if (!S.thu) Drive.Files.update({ properties: ap }, cu[0].id, null, { supportsAllDrives: true });
      cu[0].properties = ap; co[drKhoaNguoiNhan_(ap)] = cu[0];
      drQuanLy_(M, cu[0].id, ten + ' · ' + n.email); drCap_(M, cu[0].id, chu.email, 'writer', chu.type);
      return;
    }
  }
  var mau = drTimMau_(S, ten);
  if (!mau) {
    if (!S.baoMau[ten]) { S.baoMau[ten] = true; ghi_('Tệp mẫu', 'Chưa có mẫu "' + ten + '" trong thư mục QT_MAU: bỏ qua, không lỗi', x.ma); }
    return;
  }
  ghi_('Tệp mẫu', (S.thu ? 'Sẽ chép ' : 'Chép ') + '"' + ten + '"', n.email);
  if (S.thu || drChua_(chaNguoi)) return;
  try {
    var r = Drive.Files.copy({ name: ten, parents: [chaNguoi], properties: ap }, mau, { supportsAllDrives: true });
    co[drKhoaNguoiNhan_(ap)] = { id: r.id, name: ten, properties: ap };
    drQuanLy_(M, r.id, ten + ' · ' + n.email);
    drCap_(M, r.id, chu.email, 'writer', chu.type);
  } catch (e) { ghi_('LỖI', 'Chép tệp mẫu "' + ten + '": ' + e.message, n.email); }
}

/** WIKI: mỗi tệp trong thư mục người (kể cả thư mục con) → nhóm riêng writer (hết điều kiện: gỡ). */
function drTepWiki_(S, M, id, hop, chu) {
  if (drChua_(id)) return;
  drTepTrong_(id).forEach(function (t) {
    drQuanLy_(M, t.id, t.name);
    if (hop) drCap_(M, t.id, chu.email, 'writer', chu.type);
  });
}

function drTepTrong_(id) {
  var kq = [];
  drLietKe_({ q: "'" + id + "' in parents and trashed=false" }).forEach(function (f) {
    if (f.mimeType === DR.MIME_TM) kq = kq.concat(drTepTrong_(f.id));
    else if (f.mimeType !== DR.MIME_LT) kq.push(f);
  });
  return kq;
}

/* ===================== Ổ CÁ NHÂN ===================== */

/** Dòng ổ cá nhân áp cho người này: apChoO_, hoặc dòng "kiểu học" của Ổ HV khi người đó đang học (EF/GV đi học). */
function drApCho_(S, d, n) {
  var C = S.C;
  if (apChoO_(C, d, n)) return true;
  if (d.o.split(',').map(chuan_).indexOf('Ổ HV') < 0) return false;
  // Lớp đang/đã học: cả lớp chỉ xem (WD-28); Hồ sơ học tập: chỉ người học lớp đầy đủ / nhóm nhỏ
  if (d.loai === 'Chỗ đặt lối tắt') { var ng = drSauHaiCham_(d.nguon); return (ng === 'Lớp đang học' || ng === 'Lớp đã học') && hocLopNao_(C, n); }
  if (d.loai === 'Lối tắt') { var m = /→\s*([A-Z0-9_]+)/.exec(d.nguon || ''); return laNguoiHoc_(C, n) && !!m && !!drDongTheoNguoi_(S, m[1]) && /^HS_/.test(m[1]); }
  return false;
}

function drOCaNhan_(S, n) {
  var C = S.C, kq = S.kqNguoi[n.email] = [], se = S.thu ? 'sẽ ' : '';
  if (!coOCaNhan_(C, n)) {
    if (!n.idO) { if (n.tt === 'Đang' && hocLopNao_(C, n)) kq.push('lớp chỉ xem: không tạo ổ (gửi link lớp)'); return; }
    var oCu = drLayO_(n.idO);
    if (!oCu) { kq.push('LỖI: không mở được ổ ' + n.idO); ghi_('LỖI', 'Không mở được ổ cá nhân', n.email); return; }
    var r = drDoiSoat_(S, n.idO, {}, 'ổ ' + oCu.name);
    if (r.go) kq.push(se + 'gỡ khỏi thành viên ổ');
    if (n.tt === 'Nghỉ' && khiNghi_(C, n) === 'Giữ ổ' && oCu.name.indexOf(DR.TIEN_TO_NGHI) !== 0) {
      var tenNghi = DR.TIEN_TO_NGHI + oCu.name;
      ghi_('Ổ cá nhân', (S.thu ? 'Sẽ đổi tên ' : 'Đổi tên ') + '"' + oCu.name + '" → "' + tenNghi + '"', n.email);
      if (!S.thu) Drive.Drives.update({ name: tenNghi }, n.idO);
      kq.push(se + 'đổi tên ổ "' + tenNghi + '"');
    }
    if (!kq.length) kq.push(n.tt === 'Nghỉ' ? 'đã nghỉ, ổ giữ nguyên' : 'không còn nhóm, ổ giữ nguyên');
    return;
  }

  var ten = tenOCaNhan_(C, n), id = n.idO;
  var hanChe = { driveMembersOnly: !duocChiaSe_(C, n), domainUsersOnly: false, sharingFoldersRequiresOrganizerPermission: true };
  if (id) {
    var o = drLayO_(id);
    if (!o) { kq.push('LỖI: không mở được ổ ' + id); ghi_('LỖI', 'Không mở được ổ cá nhân (ID ở NGUOI)', n.email); return; }
    if (o.name !== ten) {
      ghi_('Ổ cá nhân', (S.thu ? 'Sẽ đổi tên ' : 'Đổi tên ') + '"' + o.name + '" → "' + ten + '"', n.email);
      if (!S.thu) Drive.Drives.update({ name: ten }, id);
      kq.push(se + 'đổi tên ổ');
    }
    if (drHanChe_(S, id, o.restrictions, hanChe, ten)) kq.push(se + (hanChe.driveMembersOnly ? 'khóa' : 'mở') + ' chia sẻ');
  } else if (S.thu) {
    id = DR.CHUA_TAO + 'O:' + n.email; S.dem.o++;
    ghi_('Ổ cá nhân', 'Sẽ tạo ổ', ten);
    kq.push('sẽ tạo ổ "' + ten + '"');
    if (C.cd.guiThuChao) drXepHangThu_(S, n, id);
  } else {
    id = drTaoO_(S, ten, hanChe);
    n.idO = id;
    var m = {}; m[n.dong] = id;
    ghiCot_(C.bang.NGUOI, 'ID ổ', m);
    ghi_('Ổ cá nhân', 'Đã tạo ổ', ten);
    kq.push('đã tạo ổ');
    if (C.cd.guiThuChao) { drXepHangThu_(S, n, id); kq.push('thư chào chờ gửi (sau 60 phút)'); }
  }

  // Thành viên ổ: chính người đó, Người đóng góp (writer); admin là organizer do tạo ổ
  var tv = {}; tv[n.email] = { role: 'writer', type: 'user' };
  var rTv = drDoiSoat_(S, id, tv, 'thành viên ổ ' + ten, true);
  if (rTv.them && !drChua_(id)) kq.push(se + 'thêm vào ổ');
  if (rTv.doi) kq.push(se + 'chủ ổ → Người đóng góp');

  var M = { quyen: {}, quanLy: {} };
  var dongO = C.cauTruc.filter(function (d) {
    return !S.tenGoc[d.o] && d.ma !== DR.MA_CA_NHAN && (d.loai === 'Thư mục' || d.loai === 'Chỗ đặt lối tắt') && drApCho_(S, d, n);
  });
  var tm = {};
  var giai = function (d) {
    if (tm.hasOwnProperty(d.ma)) return tm[d.ma];
    tm[d.ma] = null;
    var segs = drDoan_(d.duong);
    var cha = drChaTheoDuong_(S, id, segs.slice(0, -1), {
      timDong: function (t) { var r = dongO.filter(function (x) { return x.duong === t; })[0]; return r ? giai(r) : undefined; }
    });
    var fid = drDamBao_(S, id, cha, segs[segs.length - 1], { sdma: d.ma });
    tm[d.ma] = fid;
    if (fid) {
      drQuanLy_(M, fid, d.duong + ' · ' + n.email);
      var vt = d.loai === 'Thư mục' ? drVaiTuQuyen_(d.quyen) : null;
      if (vt) drCap_(M, fid, n.email, vt, 'user');
    }
    return fid;
  };
  dongO.forEach(giai);

  var L = drLoiTatMongMuon_(S, n, id, tm, M);
  var rLt = drDoiSoatLoiTat_(S, id, L, n.email);
  var caNhan = drCaNhanCu_(S, n, id);
  if (!drChua_(id)) {
    drChiMuc_(S, id).ds.forEach(function (f) {
      var ma = (f.properties || {}).sdma;
      if (ma && ma !== DR.MA_CA_NHAN && drMaHopLe_(S, ma)) drQuanLy_(M, f.id, f.name + ' · ' + n.email);
    });
  }
  var rQ = drDoiSoatTatCa_(S, M);
  if (rLt.them || rLt.bo) kq.push(se + (rLt.them ? '+' + rLt.them : '') + (rLt.them && rLt.bo ? ' ' : '') + (rLt.bo ? '−' + rLt.bo : '') + ' lối tắt');
  if (rQ.them + rQ.doi + rQ.go) kq.push(se + 'quyền +' + rQ.them + (rQ.doi ? ' ~' + rQ.doi : '') + (rQ.go ? ' −' + rQ.go : ''));
  if (caNhan) kq.push(caNhan);
}

/**
 * Thư mục 90_CA-NHAN cũ (Đợt 2b bỏ CN_CA_NHAN): tìm theo nhãn sdma=CN_CA_NHAN, hoặc theo tên ở gốc ổ (gắn nhãn).
 * Giữ nguyên thư mục; gỡ mọi quyền TRỰC TIẾP của người trên bảng / nhóm sd- (kể cả khi ≤ quyền thừa kế).
 */
function drCaNhanCu_(S, n, idO) {
  if (drChua_(idO)) return '';
  var d = dongCauTruc_(S.C, DR.MA_CA_NHAN), tenCu = d ? drDoan_(d.duong).slice(-1)[0] : DR.TEN_CA_NHAN;
  var f = drDamBao_(S, idO, idO, tenCu, { sdma: DR.MA_CA_NHAN }, true);
  if (!f || drChua_(f)) return '';
  var se = S.thu ? 'Sẽ ' : '', go = 0;
  var r;
  try { r = Drive.Permissions.list(f, { supportsAllDrives: true, fields: 'permissions(id,type,role,emailAddress,permissionDetails)' }); }
  catch (e) { ghi_('LỖI', 'Đọc quyền ' + tenCu + ': ' + e.message, n.email); return ''; }
  (r.permissions || []).forEach(function (p) {
    if ((p.type !== 'user' && p.type !== 'group') || !p.emailAddress) return;
    var e = email_(p.emailAddress);
    var tt = (p.permissionDetails || []).filter(function (x) { return x.inherited === false; });
    if (p.permissionDetails && !tt.length) return;
    if (!drQuanLyEmail_(S, e)) return;
    go++; S.dem.qGo++;
    ghi_('Quyền', se + 'gỡ quyền trực tiếp cũ ở ' + tenCu + ' (thư mục giữ nguyên)', e);
    if (!S.thu) {
      try { Drive.Permissions.remove(f, p.id, { supportsAllDrives: true }); }
      catch (err) { ghi_('LỖI', 'Gỡ quyền ở ' + tenCu + ': ' + err.message, e); }
    }
  });
  return go ? (S.thu ? 'sẽ ' : '') + tenCu + ' cũ giữ nguyên, gỡ quyền trực tiếp' : '';
}

/** Danh sách lối tắt mong muốn trong ổ cá nhân: [{khoa, cha, dich, ten}]. */
function drLoiTatMongMuon_(S, n, idO, tm, M) {
  var C = S.C, L = [];
  var them = function (khoa, cha, dich, ten) { if (cha && dich) L.push({ khoa: khoa, cha: cha, dich: dich, ten: ten }); };
  var tenNhom = function (g) { return g.ma + ' · ' + g.ten; };
  var dsTv = nhomCuaNguoi_(C, n.email);
  var daCt = dongCauTruc_(C, 'DA_NHOM');
  var loaiDa = daCt ? drDsSauHaiCham_(daCt.nguon) : ['Dự án', 'Ban'];

  C.cauTruc.forEach(function (d) {
    if (S.tenGoc[d.o] || !drApCho_(S, d, n)) return;
    if (d.loai === 'Lối tắt') {
      var m = /→\s*([A-Z0-9_]+)/.exec(d.nguon || '');
      if (!m) { ghi_('LỖI', 'Dòng ' + d.ma + ': cột Nguồn phải có "→ <MÃ>"', d.nguon); return; }
      var dich = drDongTheoNguoi_(S, m[1]) ? drTmNguoi_(S, m[1], n) : S.tmGoc[m[1]];
      them(d.ma, idO, dich, d.duong);
      return;
    }
    if (d.loai !== 'Chỗ đặt lối tắt') return;
    var cho = tm[d.ma], nguon = drSauHaiCham_(d.nguon);
    if (!cho) return;
    var theoNhom = function (loc) {
      var da = {};
      dsTv.forEach(function (t) {
        var g = C.nhom[t.ma];
        if (!g || da[g.ma] || !loc(t, g)) return;
        da[g.ma] = true;
        them(d.ma + ':' + g.ma, cho, S.tmTheoNhom[g.ma], tenNhom(g));
      });
    };
    if (nguon === 'Level') {
      levelThayDuoc_(C, n).forEach(function (lv) {
        var g = C.nhom[lv];
        if (g && !drNhomDong_(g)) them(d.ma + ':' + g.ma, cho, S.tmTheoNhom[g.ma], tenNhom(g));
      });
    } else if (nguon === 'Lớp đang học') {
      theoNhom(function (t, g) { return t.vai === 'Thành viên' && g.loai === 'Lớp' && g.tt === 'Đang'; });
    } else if (nguon === 'Lớp đã học') {
      theoNhom(function (t, g) { return t.vai === 'Thành viên' && g.loai === 'Lớp' && g.tt === 'Kết thúc'; });
    } else if (nguon === 'Dự án tham gia') {
      theoNhom(function (t, g) { return loaiDa.indexOf(g.loai) >= 0 && !drNhomDong_(g); });
    } else if (nguon === 'Lớp phụ trách') {
      theoNhom(function (t, g) { return t.vai === 'Phụ trách' && g.loai === 'Lớp' && (g.tt === 'Đang' || g.tt === 'Kết thúc'); });
    } else if (nguon === 'Học viên phụ trách') {
      var dNop = C.cauTruc.filter(function (x) { return x.loai === 'Thư mục con theo lớp'; })[0];
      var dNg = dNop ? C.cauTruc.filter(function (x) { return x.loai === 'Thư mục theo người' && x.o === dNop.o; })[0] : null;
      dsTv.forEach(function (t) {
        var g = C.nhom[t.ma];
        if (!g || t.vai !== 'Phụ trách' || g.loai !== 'Nhóm nhỏ' || drNhomDong_(g)) return;
        var lop = C.nhom[g.thuoc];
        if (!lop || lop.tt !== 'Đang') return;
        var sub = drDamBao_(S, idO, cho, g.ma, { sdma: DR.MA_HV_PT_SUB, sdnhom: g.ma });
        if (!sub) return;
        drQuanLy_(M, sub, g.ma + ' · ' + n.email);
        thanhVienNhom_(C, g.ma, 'Thành viên').forEach(function (x) {
          var hv = C.nguoi[x.email];
          if (!hv || hv.tt !== 'Đang' || !dNg) return;
          var nop = drTmNguoi_(S, dNg.ma, hv, lop.ma);
          them('CN_HV_PT:' + g.ma + ':' + x.email, sub, nop, dienMau_('{Mã người} · {Họ tên}', hv, null));
        });
      });
    } else {
      ghi_('LỖI', 'Dòng ' + d.ma + ': Nguồn "' + nguon + '" chưa được hỗ trợ', n.email);
    }
  });
  return L;
}

function drDoiSoatLoiTat_(S, idO, L, ai) {
  var kq = { them: 0, bo: 0 }, se = S.thu ? 'Sẽ ' : '';
  var muon = {};
  L.forEach(function (l) { if (!muon[l.khoa]) muon[l.khoa] = l; });
  var co = {}, thua = [], chuaNhan = [];
  if (!drChua_(idO)) {
    drLietKe_({ corpora: 'drive', driveId: idO, q: "mimeType='" + DR.MIME_LT + "' and trashed=false" })
      .forEach(function (f) {
        var p = f.properties || {};
        if (p.sdlt !== '1') { chuaNhan.push(f); return; }
        var k = p.sdkhoa; if (k && !co[k]) co[k] = f; else thua.push(f);
      });
  }
  var boVao = function (f, lyDo) {
    kq.bo++; S.dem.ltBo++;
    ghi_('Lối tắt', se + 'bỏ (thùng rác) "' + f.name + '"' + (lyDo ? ' · ' + lyDo : ''), ai);
    if (!S.thu) Drive.Files.update({ trashed: true }, f.id, null, { supportsAllDrives: true });
  };
  Object.keys(muon).forEach(function (k) {
    var l = muon[k], f = co[k];
    if (f && (f.shortcutDetails || {}).targetId !== l.dich && !drChua_(l.dich)) { boVao(f, 'đổi đích'); f = null; }
    delete co[k];
    if (!f) {
      // Nhận lại: lối tắt chưa có nhãn (vd nhãn appProperties của dự án cũ) đúng cha + đúng đích
      for (var i = 0; i < chuaNhan.length; i++) {
        var c = chuaNhan[i];
        if ((c.parents || [])[0] === l.cha && (c.shortcutDetails || {}).targetId === l.dich) {
          chuaNhan.splice(i, 1); f = c; S.dem.nhanLai++;
          ghi_('Lối tắt', se + 'nhận lại (gắn nhãn) "' + c.name + '"', ai);
          if (!S.thu) Drive.Files.update({ properties: { sdlt: '1', sdkhoa: k } }, c.id, null, { supportsAllDrives: true });
          break;
        }
      }
    }
    if (f) {
      if (f.name !== l.ten) {
        ghi_('Lối tắt', se + 'đổi tên "' + f.name + '" → "' + l.ten + '"', ai);
        if (!S.thu) Drive.Files.update({ name: l.ten }, f.id, null, { supportsAllDrives: true });
      }
      var chaCu = (f.parents || [])[0];
      if (chaCu !== l.cha && !drChua_(l.cha)) {
        ghi_('Lối tắt', se + 'chuyển chỗ "' + l.ten + '"', ai);
        if (!S.thu) Drive.Files.update({}, f.id, null, { addParents: l.cha, removeParents: (f.parents || []).join(','), supportsAllDrives: true });
      }
      return;
    }
    kq.them++; S.dem.ltThem++;
    ghi_('Lối tắt', se + 'tạo "' + l.ten + '"', ai);
    if (S.thu || drChua_(l.cha) || drChua_(l.dich)) return;
    try {
      drThuLai_(function () {
        Drive.Files.create({ name: l.ten, mimeType: DR.MIME_LT, parents: [l.cha], shortcutDetails: { targetId: l.dich },
          properties: { sdlt: '1', sdkhoa: k } }, null, { supportsAllDrives: true });
      });
    } catch (e) { ghi_('LỖI', 'Tạo lối tắt "' + l.ten + '": ' + e.message, ai); }
  });
  Object.keys(co).forEach(function (k) { boVao(co[k], ''); });
  thua.forEach(function (f) { boVao(f, 'trùng khóa'); });
  return kq;
}

/* ===================== ĐỐI SOÁT QUYỀN ===================== */

function drQuanLy_(M, fid, nhan) { if (fid && !M.quanLy[fid]) M.quanLy[fid] = nhan || fid; }

function drCap_(M, fid, email, role, type) {
  if (!fid || !email) return;
  var m = M.quyen[fid] = M.quyen[fid] || {};
  if (!m[email] || DR.HANG[role] > DR.HANG[m[email].role]) m[email] = { role: role, type: type };
}

function drCapNhom_(S, M, fid, email, role) { if (S.nhomCo[email]) drCap_(M, fid, email, role, 'group'); }

/** Người/nhóm script được phép gỡ: có ở NGUOI, hoặc nhóm có tiền tố trên miền. Không bao giờ là admin. */
function drQuanLyEmail_(S, e) {
  var cd = S.C.cd;
  if (e === cd.admin || (cd.ngoaiBang || {})[e]) return false;
  if (S.C.nguoi[e]) return true;
  return e.indexOf(cd.tienTo) === 0 && e.slice(-(cd.mien.length + 1)) === '@' + cd.mien;
}

function drDoiSoatTatCa_(S, M) {
  var tong = { them: 0, doi: 0, go: 0 };
  Object.keys(M.quanLy).forEach(function (fid) {
    drKiemGio_(S);
    var r = drDoiSoat_(S, fid, M.quyen[fid] || {}, M.quanLy[fid]);
    tong.them += r.them; tong.doi += r.doi; tong.go += r.go;
  });
  return tong;
}

/** Đối soát quyền trực tiếp của một tệp/thư mục/ổ với tập mong muốn {email: {role, type}}. */
/** goNgoai: true ở ổ cá nhân → gỡ cả người dùng không có trên bảng (vd email cũ sau Đổi email), trừ admin. */
function drDoiSoat_(S, fid, muon, nhan, goNgoai) {
  var kq = { them: 0, doi: 0, go: 0 }, se = S.thu ? 'Sẽ ' : '';
  if (drChua_(fid)) {
    Object.keys(muon).forEach(function (e) {
      kq.them++; S.dem.qThem++;
      ghi_('Quyền', 'Sẽ cấp ' + DR.TEN_QUYEN[muon[e].role] + ' · ' + nhan, e);
    });
    return kq;
  }
  var h;
  try { h = drQuyen_(fid); } catch (err) { ghi_('LỖI', 'Đọc quyền ' + nhan + ': ' + err.message, fid); return kq; }
  Object.keys(muon).forEach(function (e) {
    var m = muon[e], t = h.truc[e];
    if (t && t.role === m.role) return;
    if (!t && h.thuaKe[e] && DR.HANG[h.thuaKe[e]] >= DR.HANG[m.role]) return;
    var viec = (t ? 'đổi quyền → ' : 'cấp ') + DR.TEN_QUYEN[m.role] + ' · ' + nhan;
    if (t) { kq.doi++; S.dem.qDoi++; } else { kq.them++; S.dem.qThem++; }
    ghi_('Quyền', se + viec, e);
    if (S.thu) return;
    try {
      if (t) Drive.Permissions.update({ role: m.role }, fid, t.id, { supportsAllDrives: true });
      else drThuLai_(function () {
        Drive.Permissions.create({ type: m.type, role: m.role, emailAddress: e }, fid, { supportsAllDrives: true, sendNotificationEmail: false });
      });
    } catch (err) { ghi_('LỖI', viec + ': ' + err.message, e); }
  });
  var ngoai = [];
  Object.keys(h.truc).forEach(function (e) {
    if (muon[e]) return;
    if (e === S.C.cd.admin || (S.C.cd.ngoaiBang || {})[e]) return;    // A7: nhóm ngoài bảng được phép: bỏ qua hoàn toàn
    if (S.khongChac && S.khongChac[e]) {                               // A5: nhóm đọc lỗi lượt này: không gỡ
      ghi_('Quyền', 'Giữ (nhóm không chắc, lỗi đọc nhóm Google lượt này) ' + DR.TEN_QUYEN[h.truc[e].role] + ' · ' + nhan, e);
      return;
    }
    if (!drQuanLyEmail_(S, e) && !goNgoai) { ngoai.push(e); return; }
    kq.go++; S.dem.qGo++;
    ghi_('Quyền', se + 'gỡ ' + DR.TEN_QUYEN[h.truc[e].role] + ' · ' + nhan, e);
    if (!S.thu) drGoQuyen_(fid, h.truc[e], h.thuaKe[e], e);
  });
  if (ngoai.length) ghi_('Ngoài bảng', 'Có quyền ở ' + nhan + ' nhưng không có trên bảng (không gỡ)', ngoai.join(', '));
  return kq;
}

/** Quyền TRỰC TIẾP (bỏ phần thừa kế) và quyền thừa kế cao nhất, theo email. */
function drQuyen_(fid) {
  var truc = {}, thuaKe = {}, trang = null;
  var caoNhat = function (ds) { return ds.reduce(function (a, d) { return DR.HANG[d.role] > DR.HANG[a] ? d.role : a; }, ds[0].role); };
  do {
    var tham = { supportsAllDrives: true, fields: 'nextPageToken,permissions(id,type,role,emailAddress,permissionDetails)' };
    if (trang) tham.pageToken = trang;
    var r = Drive.Permissions.list(fid, tham);
    (r.permissions || []).forEach(function (p) {
      if ((p.type !== 'user' && p.type !== 'group') || !p.emailAddress) return;
      var e = email_(p.emailAddress), vt = p.role;
      if (p.permissionDetails && p.permissionDetails.length) {
        var tt = p.permissionDetails.filter(function (d) { return d.inherited === false; });
        var tk = p.permissionDetails.filter(function (d) { return d.inherited !== false; });
        var ke = tk.length ? caoNhat(tk) : null;
        if (ke) thuaKe[e] = ke;
        if (!tt.length) return;
        vt = caoNhat(tt);
        if (ke && DR.HANG[vt] <= DR.HANG[ke]) return;     // trực tiếp không hơn thừa kế: coi như không có
      }
      truc[e] = { id: p.id, role: vt, type: p.type };
    });
    trang = r.nextPageToken;
  } while (trang);
  return { truc: truc, thuaKe: thuaKe };
}

/** Gỡ quyền trực tiếp; Google không cho gỡ (còn phần thừa kế) thì hạ về mức thừa kế. */
function drGoQuyen_(fid, t, ke, e) {
  try { Drive.Permissions.remove(fid, t.id, { supportsAllDrives: true }); }
  catch (err) {
    if (!ke) { ghi_('LỖI', 'Gỡ quyền ở ' + fid + ': ' + err.message, e); return; }
    try { Drive.Permissions.update({ role: ke }, fid, t.id, { supportsAllDrives: true }); ghi_('Quyền', 'Không gỡ được, đã hạ về ' + DR.TEN_QUYEN[ke], e); }
    catch (err2) { ghi_('LỖI', 'Gỡ quyền ở ' + fid + ': ' + err.message, e); }
  }
}

/* ===================== DRIVE: TIỆN ÍCH ===================== */

function drChua_(id) { return typeof id === 'string' && id.indexOf(DR.CHUA_TAO) === 0; }
function drNhay_(s) { return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }
function drDoan_(duong) { return String(duong).split('/').map(chuan_).filter(function (x) { return x !== ''; }); }
function drSauHaiCham_(s) { s = chuan_(s); var i = s.indexOf(':'); return i >= 0 ? chuan_(s.slice(i + 1)) : s; }
function drDsSauHaiCham_(s) { return drSauHaiCham_(s).split(',').map(chuan_).filter(function (x) { return x; }); }

function drVaiTuQuyen_(q) {
  q = chuan_(q).toLowerCase();
  if (/tải lên|sửa/.test(q)) return 'writer';
  if (/nhận xét/.test(q)) return 'commenter';
  return null;
}

/** Khóa nhận diện theo nhãn: người theo Mã hệ thống (sdma_u) nếu có, không thì email. */
function drKhoa_(ap) {
  var ng = ap.sdma_u ? 'u:' + ap.sdma_u : (ap.sdemail ? 'e:' + ap.sdemail : '');
  return [ap.sdma, ap.sdnhom || '', ng, ap.sdlop || '', ap.sdnhanh || ''].join('|');
}

function drLietKe_(o) {
  var kq = [], trang = null;
  do {
    var tham = { corpora: o.corpora || 'allDrives', includeItemsFromAllDrives: true, supportsAllDrives: true, q: o.q, pageSize: 1000,
      fields: 'nextPageToken,files(id,name,mimeType,parents,properties,shortcutDetails)' };
    if (o.driveId) tham.driveId = o.driveId;
    if (trang) tham.pageToken = trang;
    var r = Drive.Files.list(tham);
    kq = kq.concat(r.files || []);
    trang = r.nextPageToken;
  } while (trang);
  return kq;
}

/** Chỉ mục thư mục (chưa vào thùng rác) của một ổ, đọc một lần mỗi lượt. */
function drChiMuc_(S, oId) {
  if (S.idx[oId]) return S.idx[oId];
  var ix = S.idx[oId] = { ds: [], khoa: {} };
  if (drChua_(oId)) return ix;
  drLietKe_({ corpora: 'drive', driveId: oId, q: "mimeType='" + DR.MIME_TM + "' and trashed=false" })
    .forEach(function (f) { drThemChiMuc_(ix, f); });
  return ix;
}

function drThemChiMuc_(ix, f) {
  f.parents = f.parents || [];
  if (ix.ds.indexOf(f) < 0) ix.ds.push(f);
  var ap = f.properties || {};
  if (!ap.sdma) return;
  var k = drKhoa_(ap);
  if (!ix.khoa[k]) ix.khoa[k] = f;
  else if (ix.khoa[k] !== f) ghi_('Drive', 'Có hai thư mục cùng mã (dùng cái đầu, cái sau để nguyên)', k + ' · ' + f.name);
}

/** Bổ sung/sửa nhãn còn thiếu hoặc khác (vd thêm sdma_u, đổi sdemail khi đổi email). */
function drNhanDung_(S, f, ap, nhan) {
  var p = f.properties || {}, khac = {}, co = false;
  Object.keys(ap).forEach(function (k) { if (p[k] !== ap[k]) { khac[k] = ap[k]; co = true; } });
  if (!co) return;
  ghi_('Nhãn', (S.thu ? 'Sẽ cập nhật nhãn ' : 'Cập nhật nhãn ') + Object.keys(khac).join(', '), nhan + ' · ' + f.name);
  if (!S.thu && !drChua_(f.id)) Drive.Files.update({ properties: khac }, f.id, null, { supportsAllDrives: true });
  f.properties = Object.assign({}, p, khac);
}

/**
 * Bảo đảm có thư mục: tìm theo nhãn properties (ap) hoặc, với thư mục trung gian (ap = null), theo cha + tên.
 * Không thấy nhãn → NHẬN LẠI thư mục chưa nhãn đúng tên + đúng cha (gắn nhãn). Có rồi: sửa nhãn, đổi tên / chuyển chỗ
 * nếu khác. Chưa có: tạo (Xem trước: trả mã tạm CHUA-TAO:…). khongTao: chỉ tìm / nhận lại.
 */
function drDamBao_(S, oId, chaId, ten, ap, khongTao) {
  if (!oId) return null;
  var ix = drChiMuc_(S, oId), f = null, se = S.thu ? 'Sẽ ' : '';
  if (ap) f = drTimTheoNhan_(S, oId, ap);
  else if (chaId) f = ix.ds.filter(function (x) { return x.parents[0] === chaId && x.name === ten && !(x.properties || {}).sdma; })[0];
  if (!f && ap && chaId && !drChua_(chaId)) {
    var ung = ix.ds.filter(function (x) { var p = x.properties || {}; return x.parents[0] === chaId && x.name === ten && !p.sdma && !p.sdtg; });
    if (ung.length > 1) {
      ghi_('LỖI', 'Nhiều thư mục cùng tên "' + ten + '" chưa có nhãn: không nhận lại, không tạo (xóa/đổi tên bớt rồi chạy lại)', drKhoa_(ap));
      return null;
    }
    if (ung.length === 1) {
      f = ung[0]; S.dem.nhanLai++;
      ghi_('Thư mục', se + 'nhận lại (gắn nhãn) "' + ten + '"', drKhoa_(ap));
      if (!S.thu && !drChua_(f.id)) Drive.Files.update({ properties: ap }, f.id, null, { supportsAllDrives: true });
      f.properties = Object.assign({}, f.properties || {}, ap);
      drThemChiMuc_(ix, f);
    }
  }
  if (f) {
    if (ap) { drNhanDung_(S, f, ap, ap.sdma); drThemChiMuc_(ix, f); }
    if (f.name !== ten) {
      ghi_('Thư mục', se + 'đổi tên "' + f.name + '" → "' + ten + '"', ap ? ap.sdma : '');
      if (!S.thu && !drChua_(f.id)) Drive.Files.update({ name: ten }, f.id, null, { supportsAllDrives: true });
      f.name = ten;
    }
    if (chaId && !drChua_(chaId) && f.parents[0] !== chaId) {
      ghi_('Thư mục', se + 'chuyển chỗ "' + ten + '"', ap ? ap.sdma : '');
      if (!S.thu && !drChua_(f.id)) Drive.Files.update({}, f.id, null, { addParents: chaId, removeParents: f.parents.join(','), supportsAllDrives: true });
      f.parents = [chaId];
    }
    return f.id;
  }
  if (khongTao || !chaId) return null;
  var apMoi = ap || { sdtg: '1' };
  S.dem.tm++;
  ghi_('Thư mục', se + 'tạo "' + ten + '"', ap ? drKhoa_(ap) : '(trung gian)');
  if (S.thu || drChua_(chaId)) {
    var gia = DR.CHUA_TAO + oId + '/' + (ap ? drKhoa_(ap) : chaId + '/' + ten);
    drThemChiMuc_(ix, { id: gia, name: ten, parents: [chaId], properties: apMoi });
    return gia;
  }
  var r = drThuLai_(function () {
    return Drive.Files.create({ name: ten, mimeType: DR.MIME_TM, parents: [chaId], properties: apMoi }, null, { supportsAllDrives: true });
  });
  drThemChiMuc_(ix, { id: r.id, name: ten, parents: [chaId], properties: apMoi });
  return r.id;
}

/**
 * Đi theo các đoạn đường dẫn cha: {Nhánh} → thư mục nhánh gắn mã; tiền tố trùng Đường dẫn của dòng khác → thư mục dòng đó;
 * còn lại → thư mục trung gian không gắn mã. opt: { goc, g, maDong, khongTao, timDong(tienTo) }.
 */
function drChaTheoDuong_(S, oId, segs, opt) {
  var cur = opt.goc || oId;
  for (var k = 0; k < segs.length && cur; k++) {
    var seg = segs[k];
    if (/\{Nhánh\}/.test(seg)) {
      var nhanh = (opt.g && opt.g.nhanh) || 'KHAC';
      cur = drDamBao_(S, oId, cur, dienMau_(seg, null, opt.g), { sdma: opt.maDong + '_NHANH', sdnhanh: nhanh }, opt.khongTao);
      continue;
    }
    var tim = !opt.goc && opt.timDong ? opt.timDong(segs.slice(0, k + 1).join('/')) : undefined;
    cur = tim !== undefined ? tim : drDamBao_(S, oId, cur, seg, null, opt.khongTao);
  }
  return cur;
}

function drThuLai_(fn) {
  for (var i = 0; i < 3; i++) {
    try { return fn(); }
    catch (e) { if (i === 2) throw e; Utilities.sleep(2000 * (i + 1)); }
  }
}

/* ===================== GHI BẢNG ===================== */

function drGhiBang_(S, xong) {
  var C = S.C, ct = S.ct;
  var thu = function (fn, ten) { try { fn(); } catch (e) { ghi_('LỖI', 'Ghi ' + ten + ': ' + e.message, ''); } };
  thu(function () {
    var m = {};
    C.dsNguoi.forEach(function (n) {
      var kq = S.kqNguoi[n.email];
      if (kq && kq.length) { m[n.dong] = kq.join(' · '); return; }
      if (xong) return;
      var k = drKhoaNg_(n), daXong = ct.giai === 'oCaNhan' && ct.da[k];
      if (!daXong && drCanXuLy_(S, n)) m[n.dong] = 'chưa xử lý, sẽ chạy tiếp';
    });
    if (Object.keys(m).length) ghiCot_(C.bang.NGUOI, 'Kết quả Drive', m);
  }, 'NGUOI · Kết quả Drive');
  if (S.thu) return;
  if (Object.keys(S.ghiNhom).length) thu(function () { ghiCot_(C.bang.NHOM, 'ID thư mục', S.ghiNhom); }, 'NHOM · ID thư mục');
  if (Object.keys(S.ghiCt).length) thu(function () { ghiCot_(C.bang.CAU_TRUC, 'ID', S.ghiCt); }, 'CAU_TRUC · ID');
}
