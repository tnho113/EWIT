/**
 * E-WIT · Lịch & Công v2 · DongBo.gs
 * Đồng bộ ⓑ NHẬP LIỆU → ⓒ DỮ LIỆU (dịch vụ Google). Logic thuần: DongBoLogic.gs.
 * Gắn vào ⓑ. Cần Chung.gs + DongBoLogic.gs trong cùng project.
 */

var COT_SS_BUOI = ['ngay', 'gio_bat_dau', 'gio_ket_thuc', 'buoi_so', 'plan', 'actual', 'status_id', 'ghi_chu', 'tab_dong'];
var COT_SS_PC = ['nhom_lop', 'ngay', 'level_id', 'status_id', 'nguon'];
var TAB_BO_QUA = { 'cau_hinh': 1, 'HUONG_DAN': 1 };

/* ============== Điểm vào ============== */

/** Chạy tay từ menu: đồng bộ ngay, thông báo kết quả. */
function dongBoNgay() {
  var ui = SpreadsheetApp.getUi();
  try {
    var kq = chayDongBo_({ tuDong: false });
    ui.alert('Đồng bộ xong',
      kq.soLop + ' lớp · ' + kq.soBuoi + ' buổi · ' + kq.soPhanCong + ' phân công\n' +
      'Thay đổi ghi vào lịch sử: ' + kq.soThayDoi + '\n' +
      'Lỗi: ' + kq.soLoi + ' · Cảnh báo: ' + kq.soCanhBao + '\n' +
      (kq.tabBoQua.length ? 'Bỏ qua tab: ' + kq.tabBoQua.join(', ') + '\n' : '') +
      'Thời gian: ' + kq.giay + ' giây' + (kq.soLoi ? '\n\nMở E-WIT ▸ Xem lỗi để xem chi tiết.' : ''),
      ui.ButtonSet.OK);
  } catch (e) {
    ui.alert('Đồng bộ không thành công', String(e.message || e), ui.ButtonSet.OK);
  }
}

/** Trigger 5 phút: chỉ chạy khi onEdit đã bật CO_THAY_DOI. */
function dongBoTuDong() {
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty('CO_THAY_DOI') !== 'true') return;
  props.setProperty('CO_THAY_DOI', 'false'); // đặt trước: sửa trong lúc chạy sẽ bật lại cờ
  try {
    chayDongBo_({ tuDong: true });
  } catch (e) {
    props.setProperty('CO_THAY_DOI', 'true'); // lỗi → thử lại lần sau
    Logger.log('dongBoTuDong lỗi: ' + (e && e.message));
  }
}

/** Cài trigger 5 phút gọi dongBoTuDong (xóa trigger cũ cùng handler). */
function caiDatTriggerDongBo() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'dongBoTuDong') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('dongBoTuDong').timeBased().everyMinutes(5).create();
  try { SpreadsheetApp.getActive().toast('Đã cài đồng bộ tự động mỗi 5 phút.', 'E-WIT', 5); } catch (e) {}
}

/** Hiện link mở tab kiem_tra của ⓒ. */
function moKiemTra() {
  var cfg = docCauHinh(SpreadsheetApp.getActiveSpreadsheet());
  var ssC = SpreadsheetApp.openById(String(cfg.DU_LIEU_ID).trim());
  var url = ssC.getUrl() + '#gid=' + ssC.getSheetByName('kiem_tra').getSheetId();
  var html = HtmlService.createHtmlOutput(
    '<p style="font-family:sans-serif">Mở bảng kiểm tra lỗi:</p><p><a href="' + url + '" target="_blank">kiem_tra (file DỮ LIỆU)</a></p>')
    .setWidth(360).setHeight(120);
  SpreadsheetApp.getUi().showModalDialog(html, 'Kiểm tra lỗi');
}

/* ============== Lõi đồng bộ ============== */

function chayDongBo_(opts) {
  var t0 = Date.now();
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error('Đang có lượt đồng bộ khác, thử lại sau ít phút.');
  try {
    var ssB = SpreadsheetApp.getActiveSpreadsheet();
    var cfg = docCauHinh(ssB);
    if (!cfg.DANH_MUC_ID || !cfg.DU_LIEU_ID) throw new Error('Thiếu DANH_MUC_ID hoặc DU_LIEU_ID trong tab cau_hinh của file NHẬP LIỆU.');
    var ssA = SpreadsheetApp.openById(String(cfg.DANH_MUC_ID).trim());
    var ssC = SpreadsheetApp.openById(String(cfg.DU_LIEU_ID).trim());

    // 1. Danh mục từ ⓐ
    var lopRows = docBang(ssA, 'lop');
    var dm = taoDanhMuc(docBang(ssA, 'ef'), docBang(ssA, 'bi_danh'), docBang(ssA, 'ef_level'),
                        docBang(ssA, 'vai_tro'), docBang(ssA, 'trang_thai_buoi'));
    var lopTheoId = {};
    lopRows.forEach(function (l) { if (l.class_id) lopTheoId[String(l.class_id).trim()] = l; });

    // 2. Đọc các tab lớp của ⓑ
    var homNay = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
    var moi = { buoiHoc: [], phanCong: [], loi: [] };
    var lopDongBo = {}, tabBoQua = [], daCoTab = {};
    ssB.getSheets().forEach(function (sh) {
      var ten = sh.getName();
      if (ten.charAt(0) === '_' || TAB_BO_QUA[ten] || sh.getLastRow() < TAB_LOP.DONG_DAU) return;
      var cid = String(sh.getRange(TAB_LOP.O_CLASS_ID).getValue()).trim();
      var lop = lopTheoId[cid];
      if (!lop) return;
      var vals = sh.getRange(1, 1, sh.getLastRow(), sh.getLastColumn()).getValues();
      var khoa = docKhoaCot(vals);
      if (!laTabLop(khoa)) return;
      if (daCoTab[cid]) {
        tabBoQua.push(ten);
        moi.loi.push({ muc_do: 'LOI', loai_loi: 'TAB_TRUNG', class_id: cid, tab_dong: ten, ngay: '',
          chi_tiet: 'Hai tab cùng mã lớp ' + cid + ' (' + daCoTab[cid] + ', ' + ten + '); tab "' + ten + '" bị bỏ qua' });
        return;
      }
      daCoTab[cid] = ten;
      try {
        vaGioHienThi_(sh, vals, khoa);
        var buoi = docTabLop(vals, khoa);
        var lopObj = {}; Object.keys(lop).forEach(function (k) { lopObj[k] = lop[k]; });
        lopObj.tabDong = ten;
        var kq = xayDungBanGhi(lopObj, buoi, dm, homNay);
        moi.buoiHoc = moi.buoiHoc.concat(kq.buoiHoc);
        moi.phanCong = moi.phanCong.concat(kq.phanCong);
        moi.loi = moi.loi.concat(kq.loi);
        lopDongBo[cid] = true;
      } catch (e) {
        tabBoQua.push(ten);
        moi.loi.push({ muc_do: 'LOI', loai_loi: 'DONG_BO_LOI', class_id: cid, tab_dong: ten, ngay: '', chi_tiet: 'Không đọc được tab: ' + (e && e.message) });
      }
    });

    // 3. Đọc ⓒ hiện có (chuỗi hiển thị, chuẩn hóa ngày/giờ)
    var buoiCu = docBangChuoi_(ssC, 'buoi_hoc');
    var pcCu = docBangChuoi_(ssC, 'phan_cong');
    var kiemCu = docBangChuoi_(ssC, 'kiem_tra');
    var buoiCuLop = buoiCu.filter(function (r) { return lopDongBo[r.class_id]; });
    var pcCuLop = pcCu.filter(function (r) { return lopDongBo[r.class_id]; });

    // 4. Khác biệt → lich_su
    var nguoi = opts.tuDong ? 'tự động' : (Session.getActiveUser().getEmail() || 'tự động');
    var luc = bayGio();
    var tdBuoi = soSanhThayDoi(buoiCuLop, moi.buoiHoc, 'session_id', COT_SS_BUOI);
    var tdPc = soSanhThayDoi(pcCuLop, moi.phanCong, 'assignment_id', COT_SS_PC);
    var lichSu = tdBuoi.map(function (d) { return dongLichSu_(luc, nguoi, 'buoi_hoc', d); })
      .concat(tdPc.map(function (d) { return dongLichSu_(luc, nguoi, 'phan_cong', d); }));

    // 5. cap_nhat_luc: giữ giờ cũ nếu dòng không đổi
    giuCapNhat_(moi.buoiHoc, buoiCu, 'session_id', COT_SS_BUOI, luc);
    giuCapNhat_(moi.phanCong, pcCu, 'assignment_id', COT_SS_PC, luc);

    // 6. Ghi ⓒ (theo lô)
    var buoiGiu = buoiCu.filter(function (r) { return !lopDongBo[r.class_id]; });
    var pcGiu = pcCu.filter(function (r) { return !lopDongBo[r.class_id]; });
    ghiBang(ssC, 'buoi_hoc', buoiGiu.concat(moi.buoiHoc));
    ghiBang(ssC, 'phan_cong', pcGiu.concat(moi.phanCong));
    if (lichSu.length) themDong_(ssC, 'lich_su', lichSu);

    var kiemGiu = kiemCu.filter(function (r) { return !lopDongBo[r.class_id]; });
    var khoaLoi = function (r) { return [r.loai_loi, r.class_id, r.tab_dong, r.ngay, r.chi_tiet].join('|'); };
    var cuMap = {};
    kiemCu.forEach(function (r) { cuMap[khoaLoi(r)] = r.phat_hien_luc; });
    moi.loi.forEach(function (r) { r.phat_hien_luc = cuMap[khoaLoi(r)] || luc; });
    ghiBang(ssC, 'kiem_tra', kiemGiu.concat(moi.loi));

    var giay = Math.round((Date.now() - t0) / 100) / 10;
    ghiCauHinh(ssC, 'DONG_BO_LAN_CUOI', luc);
    ghiCauHinh(ssC, 'SCRIPT_VERSION', SCRIPT_VERSION);
    ghiCauHinh(ssC, 'DONG_BO_THOI_GIAN_GIAY', giay);

    var soLoi = moi.loi.filter(function (r) { return r.muc_do === 'LOI'; }).length;
    var ketQua = { soLop: Object.keys(lopDongBo).length, soBuoi: moi.buoiHoc.length, soPhanCong: moi.phanCong.length,
      soThayDoi: lichSu.length, soLoi: soLoi, soCanhBao: moi.loi.length - soLoi, tabBoQua: tabBoQua, giay: giay };
    Logger.log('Đồng bộ: ' + ketQua.soLop + ' lớp, ' + ketQua.soBuoi + ' buổi, ' + ketQua.soPhanCong + ' phân công, ' + giay + 's');
    return ketQua;
  } finally {
    lock.releaseLock();
  }
}

/* ============== Hàm phụ ============== */

/** Thay giá trị cột giờ bằng chuỗi hiển thị (tránh lệch phút của Date 1899 trong Apps Script). */
function vaGioHienThi_(sh, vals, khoa) {
  var n = vals.length - (TAB_LOP.DONG_DAU - 1);
  if (n < 1) return;
  ['gio_bd', 'gio_kt'].forEach(function (k) {
    var c = khoa.indexOf(k);
    if (c < 0) return;
    var hien = sh.getRange(TAB_LOP.DONG_DAU, c + 1, n, 1).getDisplayValues();
    for (var i = 0; i < n; i++) vals[TAB_LOP.DONG_DAU - 1 + i][c] = hien[i][0];
  });
}

/** Đọc bảng bằng chuỗi hiển thị; chuẩn hóa cột ngày → yyyy-MM-dd, cột giờ → HH:mm. */
function docBangChuoi_(ss, tenTab) {
  var sh = ss.getSheetByName(tenTab);
  if (!sh) throw new Error('Không thấy tab "' + tenTab + '" trong file DỮ LIỆU');
  var rows = bangThanhObject(sh.getDataRange().getDisplayValues());
  rows.forEach(function (r) {
    if (r.ngay !== undefined) r.ngay = ngayKey(r.ngay) || r.ngay;
    if (r.gio_bat_dau !== undefined) r.gio_bat_dau = chuanHoaGio(r.gio_bat_dau);
    if (r.gio_ket_thuc !== undefined) r.gio_ket_thuc = chuanHoaGio(r.gio_ket_thuc);
  });
  return rows;
}

function dongLichSu_(luc, nguoi, bang, d) {
  return { thoi_diem: luc, nguoi_sua: nguoi, loai: d.loai, doi_tuong_id: d.id, truong: d.truong,
    gia_tri_cu: d.cu, gia_tri_moi: d.moi, ghi_chu: bang };
}

/** Gán cap_nhat_luc: giữ giá trị cũ nếu dòng không đổi, ngược lại = luc. */
function giuCapNhat_(moiRows, cuRows, khoa, cacTruong, luc) {
  var cuMap = {};
  cuRows.forEach(function (r) { cuMap[r[khoa]] = r; });
  moiRows.forEach(function (r) {
    var c = cuMap[r[khoa]];
    var khac = !c || cacTruong.some(function (t) { return chuanGiaTri(c[t]) !== chuanGiaTri(r[t]); });
    r.cap_nhat_luc = khac ? luc : (c.cap_nhat_luc || luc);
  });
}

/** Thêm dòng vào cuối tab theo tên cột (một lần setValues). */
function themDong_(ss, tenTab, rows) {
  var sh = ss.getSheetByName(tenTab);
  var cols = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
  var batDau = Math.max(sh.getLastRow(), 1) + 1;
  sh.getRange(batDau, 1, rows.length, cols.length).setValues(objectThanhBang(rows, cols));
}
