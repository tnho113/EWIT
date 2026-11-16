/**
 * MLWIT · SHARED DRIVE BOARD v2 · NÂNG CẤP BẢNG (Đợt 2b)
 * Tự thêm cột / dòng còn thiếu để không phải sửa bảng bằng tay. Chạy lại nhiều lần không đổi gì thêm (idempotent).
 * Chỉ dùng hàm (không khai báo biến toàn cục) vì tệp này nạp trước 10_Chung.
 *
 *  - Cột: NGUOI "Mã hệ thống" · NHAP "Email mới" · NHOM "Thứ tự" (điền 1..n cho Level chưa có số) · LS_NHAP "Email mới".
 *  - Mã hệ thống: cấp cho người ở NGUOI chưa có (U + 5 chữ số, tiếp sau số lớn nhất).
 *  - CAU_TRUC: thêm HS_TL (thư mục 00_TAI-LIEU-CUA-TOI trong Hồ sơ học tập); CN_CA_NHAN chuyển thành "BỎ".
 *  - Ô chọn (data validation) cho cột Việc của NHAP.
 * Không chạm Drive, không đụng ô công thức Tình trạng.
 */
function sdNangCapBang() { chayPhien_('Nâng cấp bảng', nangCapBang_); }

function nangCapBang_(cd) {
  var them = [];
  var ghiThem = function (c) { them.push(c); ghi_('Nâng cấp', c, ''); };

  [[TAB.NGUOI, 'Mã hệ thống', true], [TAB.NHAP, 'Email mới', true], [TAB.NHOM, 'Thứ tự', true], [TAB.LS_NHAP, 'Email mới', false]]
    .forEach(function (x) { if (themCotThieu_(x[0], x[1], x[2])) ghiThem('thêm cột "' + x[1] + '" ở ' + x[0]); });

  var nThuTu = dienThuTuLevel_();
  if (nThuTu) ghiThem('điền Thứ tự cho ' + nThuTu + ' Level');

  var nHs = themCauTruc_();
  nHs.forEach(ghiThem);

  var nMa = capMaChoNguoiCu_();
  if (nMa) ghiThem('cấp Mã hệ thống cho ' + nMa + ' người');

  if (gatOChonViec_()) ghiThem('gắn ô chọn cho cột Việc ở NHAP');

  P.tomTat = them.length ? 'Đã nâng cấp: ' + them.length + ' thay đổi.' : 'Bảng đã đủ, không đổi gì.';
}

/** Thêm cột tiêu đề cuối hàng 1 nếu chưa có. Trả về true nếu đã thêm. */
function themCotThieu_(tenTab, tenCot, batBuoc) {
  var tab = P.ss.getSheetByName(tenTab);
  if (!tab) { if (batBuoc) ghi_('LỖI', 'Thiếu tab ' + tenTab, ''); return false; }
  var td = tab.getRange(1, 1, 1, Math.max(tab.getLastColumn(), 1)).getValues()[0].map(chuan_);
  if (td.indexOf(tenCot) >= 0) return false;
  var cuoi = 0;
  td.forEach(function (t, i) { if (t) cuoi = i + 1; });
  tab.getRange(1, cuoi + 1).setValue(tenCot);
  return true;
}

/** Điền "Thứ tự" cho các dòng Loại = Level chưa có số. Trả về số dòng đã điền. */
function dienThuTuLevel_() {
  var b = docTab_(TAB.NHOM);
  if (b.tieuDe.indexOf('Thứ tự') < 0) return 0;
  var lv = b.dong.filter(function (d) { return chuan_(d['Loại']) === 'Level'; });
  var coSo = function (d) { var v = d['Thứ tự']; return !(v === '' || v == null || isNaN(Number(v))); };
  var max = 0, daCo = false;
  lv.forEach(function (d) { if (coSo(d)) { daCo = true; if (Number(d['Thứ tự']) > max) max = Number(d['Thứ tự']); } });
  var ghiVao = {}, n = 0;
  lv.forEach(function (d, i) {
    if (coSo(d)) return;
    ghiVao[d._dong] = daCo ? ++max : i + 1; n++;
  });
  if (n) ghiCot_(b, 'Thứ tự', ghiVao);
  return n;
}

/** CAU_TRUC: thêm HS_TL, đánh dấu bỏ CN_CA_NHAN. Trả về danh sách việc đã làm. */
function themCauTruc_() {
  var kq = [];
  var b = docTab_(TAB.CAU_TRUC);
  var coMa = function (ma) { return b.dong.filter(function (d) { return chuan_(d['Mã']) === ma; })[0]; };
  if (!coMa('HS_TL')) {
    var mau = { 'Mã': 'HS_TL', 'Ổ': 'Hồ sơ học tập', 'Đường dẫn': '{người}/00_TAI-LIEU-CUA-TOI', 'Loại': 'Thư mục con theo người',
      'Nguồn / Đích / Áp cho': 'Nhóm riêng của người', 'Quyền chủ ổ / người dùng': 'Tải lên', 'Ghi chú': 'HV tải lên tự do; giữ khi nghỉ' };
    b.tab.appendRow(b.tieuDe.map(function (t) { return t && mau[t] !== undefined ? mau[t] : ''; }));
    kq.push('thêm dòng CAU_TRUC HS_TL');
  }
  // CN_CA_NHAN: giữ dòng (an toàn, có thể xem lại), đổi Loại thành "BỎ" để 30_Drive bỏ qua, ghi chú rõ.
  var cn = coMa('CN_CA_NHAN');
  if (cn && (chuan_(cn['Loại']) !== 'BỎ' || chuan_(cn['Ghi chú']).indexOf('BỎ (Đợt 2b)') !== 0)) {
    var ghiChu = chuan_(cn['Ghi chú']);
    ghiCot_(b, 'Loại', (function (o) { o[cn._dong] = 'BỎ'; return o; })({}));
    ghiCot_(b, 'Ghi chú', (function (o) { o[cn._dong] = ghiChu.indexOf('BỎ (Đợt 2b)') === 0 ? ghiChu : 'BỎ (Đợt 2b)' + (ghiChu ? ' · ' + ghiChu : ''); return o; })({}));
    kq.push('đánh dấu BỎ dòng CAU_TRUC CN_CA_NHAN');
  }
  return kq;
}

/** Cấp Mã hệ thống cho người ở NGUOI chưa có. Trả về số người được cấp. */
function capMaChoNguoiCu_() {
  var b = docTab_(TAB.NGUOI);
  if (b.tieuDe.indexOf('Mã hệ thống') < 0) return 0;
  var ds = b.dong.filter(function (d) { return chuan_(d['Email']); });
  var nguoi = { ds: ds.map(function (d) { return { 'Mã hệ thống': d['Mã hệ thống'] }; }) };
  var ghiVao = {}, n = 0;
  ds.forEach(function (d) {
    if (chuan_(d['Mã hệ thống'])) return;
    var ma = capMaHeThong_(nguoi);
    nguoi.ds.push({ 'Mã hệ thống': ma });
    ghiVao[d._dong] = ma; n++;
  });
  if (n) ghiCot_(b, 'Mã hệ thống', ghiVao);
  return n;
}

/** Gắn ô chọn Việc ở NHAP (nếu môi trường cho phép). Trả về true nếu đã gắn. */
function gatOChonViec_() {
  try {
    var tab = P.ss.getSheetByName(TAB.NHAP);
    if (!tab || typeof SpreadsheetApp.newDataValidation !== 'function') return false;
    var td = tab.getRange(1, 1, 1, Math.max(tab.getLastColumn(), 1)).getValues()[0].map(chuan_);
    var c = td.indexOf('Việc');
    if (c < 0) return false;
    var soDong = typeof tab.getMaxRows === 'function' ? Math.max(tab.getMaxRows() - 1, 1) : 1000;
    var luat = SpreadsheetApp.newDataValidation().requireValueInList(DS.VIEC, true).setAllowInvalid(false)
      .setHelpText('Thêm, Gỡ, Nghỉ, Sửa thông tin hoặc Đổi email (để trống = Thêm)').build();
    tab.getRange(2, c + 1, soDong, 1).setDataValidation(luat);
    return true;
  } catch (e) { ghi_('Nâng cấp', 'Không gắn được ô chọn Việc: ' + e.message, ''); return false; }
}

/**
 * CÔNG THỨC TÌNH TRẠNG cho ô NHAP!J1 (locale vi_VN: dấu ';'). Cột NHAP: A Email · B Họ tên · C Mã người · D Vai trò ·
 * E Mã nhóm · F Vai trong nhóm · G Quyền · H Việc · I Ghi chú · J Tình trạng · K Lỗi · L Email mới.
 * NGUOI: A Email, B Họ tên, C Mã người, D Vai trò, E Level, F Trạng thái. NHOM: A Mã, C Loại, D Thuộc, G Trạng thái.
 * THANH_VIEN: A Email, C Mã nhóm, E Vai trong nhóm, F Quyền, G Trạng thái.
 * Lưu ý: trong ARRAYFORMULA không dùng AND/OR (chúng gộp cả mảng) — dùng nhân (*) và cộng (+).
 * Ký hiệu: ✘ lỗi (script sẽ từ chối) · ⚠ cảnh báo · → sẽ làm · ✔ đã có/không cần làm.
 */
function congThucTinhTrang_() {
  var EM = '"^[^@ ]+@[^@ ]+[.][^@ ]+$"';
  var KHONG = function (x) { return '(' + x + '=FALSE)'; };
  var L = [
    ['vEmail', 'LOWER(TRIM(A2:A))'],
    ['vTen', 'TRIM(B2:B)'],
    ['vMaNg', 'TRIM(C2:C)'],
    ['vVai', 'TRIM(D2:D)'],
    ['vMa', 'UPPER(TRIM(E2:E))'],
    ['vVaiNhom', 'IF(TRIM(F2:F)="";"Thành viên";TRIM(F2:F))'],
    ['vQuyen', 'IF(TRIM(G2:G)="";"Xem";TRIM(G2:G))'],
    ['vViec', 'IF(TRIM(H2:H)="";"Thêm";TRIM(H2:H))'],
    ['vMoi', 'LOWER(TRIM(L2:L))'],
    ['vTrung', 'COUNTIFS(A2:A;A2:A&"";E2:E;E2:E&"";H2:H;H2:H&"")>1'],
    ['vCoNg', 'COUNTIF(NGUOI!A2:A;vEmail)>0'],
    ['vNgTen', 'XLOOKUP(vEmail;NGUOI!A2:A;NGUOI!B2:B;"")'],
    ['vNgMa', 'XLOOKUP(vEmail;NGUOI!A2:A;NGUOI!C2:C;"")'],
    ['vNgVai', 'XLOOKUP(vEmail;NGUOI!A2:A;NGUOI!D2:D;"")'],
    ['vNgLevel', 'XLOOKUP(vEmail;NGUOI!A2:A;NGUOI!E2:E;"")'],
    ['vNgTT', 'XLOOKUP(vEmail;NGUOI!A2:A;NGUOI!F2:F;"")'],
    ['vCoNhom', 'COUNTIF(NHOM!A2:A;vMa)>0'],
    ['vLoai', 'XLOOKUP(vMa;NHOM!A2:A;NHOM!C2:C;"")'],
    ['vThuoc', 'XLOOKUP(vMa;NHOM!A2:A;NHOM!D2:D;"")'],
    ['vTTNhom', 'XLOOKUP(vMa;NHOM!A2:A;NHOM!G2:G;"")'],
    ['vDangTV', 'COUNTIFS(THANH_VIEN!A2:A;vEmail;THANH_VIEN!C2:C;vMa;THANH_VIEN!G2:G;"Đang")'],
    ['vDungTV', 'COUNTIFS(THANH_VIEN!A2:A;vEmail;THANH_VIEN!C2:C;vMa;THANH_VIEN!G2:G;"Đang";THANH_VIEN!E2:E;vVaiNhom;THANH_VIEN!F2:F;vQuyen)'],
    ['vTrongLop', 'COUNTIFS(THANH_VIEN!A2:A;vEmail;THANH_VIEN!C2:C;vThuoc;THANH_VIEN!G2:G;"Đang")'],
    ['vVaiHq', 'IF(vCoNg;vNgVai;vVai)'],
    ['vDoiTen', 'vCoNg*(vTen<>"")*(vTen<>vNgTen)'],
    ['vDoiMa', 'vCoNg*(vMaNg<>"")*(vMaNg<>vNgMa)'],
    ['vDoiVai', 'vCoNg*(vVai<>"")*(vVai<>vNgVai)'],
    ['vKhac', '(vDoiTen+vDoiMa+vDoiVai)>0'],
    ['vHqRaw', 'IF((vLoai="Level")*(vNgLevel<>"")*(vNgLevel<>vMa);"; sẽ rời Level "&vNgLevel;"")' +
      '&IF((vLoai="Nhóm nhỏ")*(vVaiNhom="Thành viên")*(vThuoc<>"")*(vTrongLop=0);"; sẽ tự vào lớp "&vThuoc;"")' +
      '&IF(vCoNg*(vNgTT="Nghỉ");"; người sẽ quay lại";"")'],
    ['vHq', 'IF(vHqRaw="";"";" ("&MID(vHqRaw;3;200)&")")'],
    ['vLoiThem',
      'IF(vMa="";"✘ thiếu Mã nhóm";' +
      'IF(' + KHONG('vCoNhom') + ';"✘ nhóm "&vMa&" chưa có ở NHOM";' +
      'IF(REGEXMATCH(vTTNhom;"^(Đóng|Ngừng)$");"✘ nhóm "&vMa&" đang "&vTTNhom;' +
      'IF(' + KHONG('REGEXMATCH(vVaiNhom;"^(Thành viên|Phụ trách)$")') + ';"✘ Vai trong nhóm phải là Thành viên hoặc Phụ trách";' +
      'IF(' + KHONG('REGEXMATCH(vQuyen;"^(Xem|Sửa)$")') + ';"✘ Quyền phải là Xem hoặc Sửa";' +
      'IF((vVaiNhom="Phụ trách")*' + KHONG('REGEXMATCH(vLoai;"^(Lớp|Nhóm nhỏ|Dự án|Ban|Tri thức|Dữ liệu)$")') + ';"✘ nhóm loại "&vLoai&" không có vai Phụ trách";' +
      'IF(' + KHONG('vCoNg') + '*(((vTen="")+(vVai=""))>0);"✘ người mới cần Họ tên và Vai trò";' +
      'IF(' + KHONG('vCoNg') + '*' + KHONG('REGEXMATCH(vVai;"^(HV|EF|GV|Tổ chức)$")') + ';"✘ Vai trò phải là HV, EF, GV hoặc Tổ chức";' +
      'IF((vLoai="Level")*(vVaiHq<>"EF");"✘ Level chỉ dành cho EF"&IF(vVaiHq<>"";" (người này là "&vVaiHq&")";"");' +
      '"")))))))))'],
    ['vThem',
      'IF(vLoiThem<>"";vLoiThem;' +
      'IF(vKhac;"⚠ khác thông tin đã có — dùng Việc \'Sửa thông tin\' (nhóm vẫn được thêm)";' +
      'IF(' + KHONG('vCoNg') + ';"→ người mới, sẽ thêm vào "&vMa;' +
      'IF(vDungTV>0;"✔ đã có trong "&vMa;' +
      'IF(vDangTV>0;"⚠ đã có trong "&vMa&", sẽ đổi vai/quyền";"→ chưa đưa vào "&vMa))))&vHq)'],
    ['vGo',
      'IF(vMa="";"✘ thiếu Mã nhóm";' +
      'IF(' + KHONG('vCoNhom') + ';"✘ nhóm "&vMa&" chưa có ở NHOM";' +
      'IF(vDangTV=0;"✔ không có trong "&vMa&", bỏ qua";' +
      '"→ sẽ gỡ khỏi "&vMa&IF(vLoai="Lớp";" và các nhóm nhỏ của lớp";""))))'],
    ['vNghi',
      'IF(' + KHONG('vCoNg') + ';"✘ chưa có người này ở danh sách tổng";' +
      'IF(vNgTT="Nghỉ";"✔ đã ghi nghỉ trước đó";"→ sẽ ghi nghỉ, gỡ mọi nhóm"))'],
    ['vCacDoi', 'MID(IF(vDoiTen;", Họ tên";"")&IF(vDoiMa;", Mã người";"")&IF(vDoiVai;", Vai trò";"");3;100)'],
    ['vSua',
      'IF(' + KHONG('vCoNg') + ';"✘ chưa có người này ở danh sách tổng";' +
      'IF((vTen&vMaNg&vVai)="";"✘ chưa ghi ô nào để đổi";' +
      'IF((vVai<>"")*' + KHONG('REGEXMATCH(vVai;"^(HV|EF|GV|Tổ chức)$")') + ';"✘ Vai trò phải là HV, EF, GV hoặc Tổ chức";' +
      'IF(vDoiVai*(vNgVai="EF")*(vNgLevel<>"");"✘ đang ở Level "&vNgLevel&": Gỡ khỏi Level trước khi đổi Vai trò";' +
      'IF(' + KHONG('vKhac') + ';"✔ không có gì khác để đổi";"→ sẽ đổi: "&vCacDoi)))))'],
    ['vDoi',
      'IF(' + KHONG('vCoNg') + ';"✘ email cũ chưa có ở danh sách tổng";' +
      'IF(vMoi="";"✘ thiếu Email mới";' +
      'IF(' + KHONG('REGEXMATCH(vMoi;' + EM + ')') + ';"✘ Email mới sai định dạng";' +
      'IF(vMoi=vEmail;"✘ Email mới trùng email cũ";' +
      'IF(COUNTIF(NGUOI!A2:A;vMoi)>0;"✘ Email mới đã có ở danh sách tổng";"→ sẽ đổi email, giữ nhóm và ổ")))))']
  ];
  var cuoi =
    'IF(vEmail="";"";' +
    'IF(' + KHONG('REGEXMATCH(vEmail;' + EM + ')') + ';"✘ email sai định dạng";' +
    'IF(' + KHONG('REGEXMATCH(vViec;"^(Thêm|Gỡ|Nghỉ|Sửa thông tin|Đổi email)$")') + ';"✘ Việc phải là Thêm, Gỡ, Nghỉ, Sửa thông tin hoặc Đổi email";' +
    'IF(vTrung;"⚠ dòng trùng trong NHAP (cùng Email, Mã nhóm, Việc)";' +
    'IF(vViec="Nghỉ";vNghi;IF(vViec="Gỡ";vGo;IF(vViec="Sửa thông tin";vSua;IF(vViec="Đổi email";vDoi;vThem))))))))';
  return '={"Tình trạng";ARRAYFORMULA(LET(\n' +
    L.map(function (x) { return '  ' + x[0] + ';' + x[1] + ';'; }).join('\n') + '\n  ' + cuoi + '))}';
}
