/**
 * E-WIT · Lịch & Công v2 · DongBoLogic.gs
 * Logic THUẦN của đồng bộ ⓑ → ⓒ (không gọi dịch vụ Google, chạy được trong Node).
 * Phụ thuộc Chung.gs: ngayKey, ngayGon, thuCuaNgay, tachDanhSach, laCo.
 */

var VT_TEACHER = 'TEACHER_IC';
var VT_GIAM_KHAO = 'GIAM_KHAO';
var TT_BINH_THUONG = 'BINH_THUONG';

/** Chuẩn hóa tên để so khớp: bỏ khoảng trắng thừa, không phân biệt hoa/thường. */
function chuanTen(s) {
  if (s === null || s === undefined) return '';
  var t = String(s).replace(/\s+/g, ' ').trim();
  if (t.normalize) t = t.normalize('NFC');
  return t.toLowerCase();
}

/** Date | 'h:mm' | 'hh:mm:ss' | số (phần ngày) → 'HH:mm'; không đọc được → ''. */
function chuanHoaGio(v) {
  if (v === '' || v === null || v === undefined) return '';
  if (Object.prototype.toString.call(v) === '[object Date]') {
    if (isNaN(v.getTime())) return '';
    return pad2(v.getHours()) + ':' + pad2(v.getMinutes());
  }
  if (typeof v === 'number') {
    var ph = Math.round((v - Math.floor(v)) * 1440);
    return pad2(Math.floor(ph / 60) % 24) + ':' + pad2(ph % 60);
  }
  var m = String(v).trim().match(/^(\d{1,2})[:h](\d{2})(?::\d{2})?/i);
  if (!m) return '';
  return pad2(+m[1]) + ':' + m[2];
}

/** Dòng 7 của tab (values2D[6]) → mảng khóa cột đã trim. */
function docKhoaCot(values2D) {
  var r = (values2D && values2D[TAB_LOP.DONG_KHOA - 1]) || [];
  return r.map(function (x) { return String(x === null || x === undefined ? '' : x).trim(); });
}

/** Tab nhập liệu có phải tab lớp hợp lệ không (dòng 7 có khóa ngay + status). */
function laTabLop(khoaCot) {
  return khoaCot.indexOf('ngay') >= 0 && khoaCot.indexOf('status') >= 0;
}

/**
 * Đọc các buổi của một tab lớp (từ dòng 9). Dòng có ngày hợp lệ = 1 buổi.
 * @param values2D toàn bộ getValues() của tab
 * @param khoaCot  mảng khóa cột (dòng 7); bỏ trống thì tự đọc từ values2D
 * @return mảng buổi (kèm thuộc tính .cotVaiTro)
 */
function docTabLop(values2D, khoaCot) {
  khoaCot = khoaCot || docKhoaCot(values2D);
  var idx = {}, cotVaiTro = [];
  khoaCot.forEach(function (k, i) {
    if (!k) return;
    if (k.indexOf('role:') === 0) { var rid = k.slice(5).trim(); idx['role:' + rid] = i; cotVaiTro.push(rid); }
    else if (idx[k] === undefined) idx[k] = i;
  });
  function lay(r, k) { var i = idx[k]; return i === undefined || r[i] === undefined || r[i] === null ? '' : r[i]; }
  var buoi = [];
  for (var i = TAB_LOP.DONG_DAU - 1; i < values2D.length; i++) {
    var r = values2D[i];
    var key = ngayKey(lay(r, 'ngay'));
    if (!key) continue;
    var vt = {};
    cotVaiTro.forEach(function (rid) { vt[rid] = String(lay(r, 'role:' + rid)).trim(); });
    buoi.push({
      dong: i + 1, ngayKey: key,
      gioBd: lay(r, 'gio_bd'), gioKt: lay(r, 'gio_kt'),
      plan: lay(r, 'plan'), actual: lay(r, 'actual'),
      statusTen: String(lay(r, 'status')).trim(),
      vaiTro: vt, ghiChu: lay(r, 'ghi_chu')
    });
  }
  buoi.cotVaiTro = cotVaiTro; // thuộc tính phụ: các vai trò có cột trong tab
  return buoi;
}

/**
 * Dựng danh mục tra cứu từ các bảng ⓐ (mảng object từ docBang).
 * @return {{efTheoTen, efTheoId, biDanh, efLevel, vaiTro, trangThai, trangThaiTheoTen}}
 */
function taoDanhMuc(efRows, biDanhRows, efLevelRows, vaiTroRows, trangThaiRows) {
  var dm = { efTheoTen: {}, efTheoId: {}, biDanh: {}, efLevel: efLevelRows || [], vaiTro: {}, trangThai: {}, trangThaiTheoTen: {} };
  (efRows || []).forEach(function (e) {
    var id = String(e.ef_id || '').trim();
    if (!id) return;
    dm.efTheoId[id] = e;
    var k = chuanTen(e.ten_hien_thi);
    if (k && !dm.efTheoTen[k]) dm.efTheoTen[k] = e;
  });
  (biDanhRows || []).forEach(function (b) {
    var k = chuanTen(b.bi_danh), id = String(b.ef_id || '').trim();
    if (k && id && !dm.biDanh[k]) dm.biDanh[k] = id;
  });
  (vaiTroRows || []).forEach(function (v) { if (v.role_id) dm.vaiTro[String(v.role_id).trim()] = v; });
  (trangThaiRows || []).forEach(function (t) {
    var id = String(t.status_id || '').trim();
    if (!id) return;
    dm.trangThai[id] = t;
    dm.trangThaiTheoTen[chuanTen(t.ten)] = id;
    dm.trangThaiTheoTen[chuanTen(id)] = id;
  });
  return dm;
}

/** Tên → ef_id (ten_hien_thi trước, bí danh sau); không thấy → ''. */
function timEfId(ten, dm) {
  var k = chuanTen(ten);
  if (dm.efTheoTen[k]) return String(dm.efTheoTen[k].ef_id).trim();
  return dm.biDanh[k] || '';
}

/** Level của EF tại ngày (yyyy-MM-dd): giai đoạn có tu_ngay ≤ ngày ≤ den_ngay (trống = đến nay); nhiều → tu_ngay muộn nhất. */
function levelTaiNgay(efId, ngay, efLevel) {
  var tot = null, totTu = '';
  (efLevel || []).forEach(function (r) {
    if (String(r.ef_id).trim() !== efId) return;
    var tu = ngayKey(r.tu_ngay), den = ngayKey(r.den_ngay);
    if (tu && ngay < tu) return;
    if (den && ngay > den) return;
    if (!tot || tu >= totTu) { tot = String(r.level_id).trim(); totTu = tu; }
  });
  return tot || '';
}

/**
 * Dựng bản ghi ⓒ cho MỘT lớp.
 * @param classObj  dòng lớp ở ⓐ (+ tuỳ chọn tabDong, cotVaiTro)
 * @param cacBuoi   kết quả docTabLop(...)
 * @param danhMuc   kết quả taoDanhMuc(...)
 * @param ngayHomNay 'yyyy-MM-dd' (bỏ trống → không kiểm tra THIEU_TEACHER)
 * @return {{buoiHoc:Object[], phanCong:Object[], loi:Object[]}}
 */
function xayDungBanGhi(classObj, cacBuoi, danhMuc, ngayHomNay) {
  var cid = String(classObj.class_id).trim();
  var tab = classObj.tabDong || classObj.tab_nhap || cid;
  var nhom = classObj.nhom_lop || '';
  var homNay = ngayHomNay || danhMuc.ngayHomNay || '';
  var bd = ngayKey(classObj.ngay_bat_dau), kt = ngayKey(classObj.ngay_ket_thuc);
  var gioLopBd = chuanHoaGio(classObj.gio_bat_dau), gioLopKt = chuanHoaGio(classObj.gio_ket_thuc);
  var thuHoc = String(classObj.thu_hoc === undefined || classObj.thu_hoc === null ? '' : classObj.thu_hoc).replace(/\D/g, '');
  var cotVaiTro = classObj.cotVaiTro || cacBuoi.cotVaiTro || [];
  if (!cotVaiTro.length) {
    cacBuoi.forEach(function (b) { Object.keys(b.vaiTro).forEach(function (r) { if (cotVaiTro.indexOf(r) < 0) cotVaiTro.push(r); }); });
  }
  var out = { buoiHoc: [], phanCong: [], loi: [] };
  function loi(muc, loai, ngay, chiTiet) {
    out.loi.push({ muc_do: muc, loai_loi: loai, class_id: cid, tab_dong: tab, ngay: ngay || '', chi_tiet: chiTiet });
  }
  var demNgay = {}, soBuoi = 0, daThay = {};

  cacBuoi.forEach(function (b) {
    var ngay = b.ngayKey;
    soBuoi++;
    demNgay[ngay] = (demNgay[ngay] || 0) + 1;
    var n = demNgay[ngay];
    var sid = cid + '_' + ngayGon(ngay) + (n > 1 ? '_' + n : '');
    if (n > 1) loi('CANH_BAO', 'TRUNG_NGAY', ngay, 'Dòng ' + b.dong + ': ngày trùng với buổi trước (' + sid + '). Nếu là buổi bù thì bỏ qua.');

    // Trạng thái buổi
    var stId = TT_BINH_THUONG;
    if (b.statusTen) {
      stId = danhMuc.trangThaiTheoTen[chuanTen(b.statusTen)];
      if (!stId) { loi('LOI', 'TRANG_THAI_LA', ngay, 'Dòng ' + b.dong + ': trạng thái "' + b.statusTen + '" không có trong danh mục'); stId = TT_BINH_THUONG; }
    }
    var tt = danhMuc.trangThai[stId];
    var ghiNhan = tt ? laCo(tt.ghi_nhan_nguoi) : true;

    out.buoiHoc.push({
      session_id: sid, class_id: cid, ngay: ngay,
      gio_bat_dau: chuanHoaGio(b.gioBd) || gioLopBd, gio_ket_thuc: chuanHoaGio(b.gioKt) || gioLopKt,
      buoi_so: soBuoi, plan: b.plan, actual: b.actual, status_id: stId, ghi_chu: b.ghiChu,
      tab_dong: tab, cap_nhat_luc: ''
    });

    // Kiểm tra theo ngày
    if ((bd && ngay < bd) || (kt && ngay > kt)) {
      loi('LOI', 'NGOAI_KHOA_HOC', ngay, 'Dòng ' + b.dong + ': ngày ngoài khóa học ' + (bd || '?') + ' → ' + (kt || '?'));
    }
    if (thuHoc && thuHoc.indexOf(String(thuCuaNgay(ngay))) < 0) {
      loi('CANH_BAO', 'SAI_THU', ngay, 'Dòng ' + b.dong + ': ngày rơi vào ' + nhanThu(thuCuaNgay(ngay)) + ', lớp học thứ ' + thuHoc);
    }

    // Phân công
    var coTeacher = false;
    cotVaiTro.forEach(function (rid) {
      var vt = danhMuc.vaiTro[rid];
      if (vt && String(vt.nguon).trim() === 'ZOOM_REPORT') return; // module Zoom report ghi
      var o = b.vaiTro[rid];
      if (!o) return;
      var cacTen = tachDanhSach(o, false);
      if (cacTen.length && rid === VT_TEACHER) coTeacher = true;
      if (!ghiNhan) return; // OFF…: không tạo phan_cong
      cacTen.forEach(function (ten) {
        var efId = timEfId(ten, danhMuc);
        if (!efId) { loi('LOI', 'TEN_LA', ngay, 'Dòng ' + b.dong + ', vai trò ' + rid + ': không nhận ra tên "' + ten + '" (thêm vào ef hoặc bi_danh)'); return; }
        var aid = sid + '_' + efId + '_' + rid;
        if (daThay[aid]) return;
        daThay[aid] = true;
        var ef = danhMuc.efTheoId[efId];
        if (ef && String(ef.dang_hoat_dong).trim().toLowerCase() === 'không') {
          loi('CANH_BAO', 'EF_DA_NGHI', ngay, 'Dòng ' + b.dong + ': ' + efId + ' đang ở trạng thái không hoạt động nhưng được xếp ' + rid);
        }
        var lv = levelTaiNgay(efId, ngay, danhMuc.efLevel);
        if (!lv) loi('CANH_BAO', 'THIEU_LEVEL', ngay, 'Dòng ' + b.dong + ': ' + efId + ' chưa có level tại ngày này');
        out.phanCong.push({
          assignment_id: aid, session_id: sid, class_id: cid, nhom_lop: nhom, ngay: ngay,
          ef_id: efId, role_id: rid, level_id: lv, status_id: stId, nguon: 'NHAP_TAY', cap_nhat_luc: ''
        });
      });
    });

    if (ghiNhan && homNay && ngay < homNay && cotVaiTro.indexOf(VT_TEACHER) >= 0 && !coTeacher) {
      loi('CANH_BAO', 'THIEU_TEACHER', ngay, 'Dòng ' + b.dong + ': buổi đã qua nhưng chưa có Teacher in charge');
    }
    if ((stId === 'MIDTERM' || stId === 'FINAL') && cotVaiTro.indexOf(VT_GIAM_KHAO) >= 0 && !(b.vaiTro[VT_GIAM_KHAO])) {
      loi('CANH_BAO', 'THIEU_GIAM_KHAO', ngay, 'Dòng ' + b.dong + ': buổi ' + stId + ' chưa có Giám khảo');
    }
  });
  return out;
}

function chuanGiaTri(v) {
  if (v === null || v === undefined) return '';
  if (Object.prototype.toString.call(v) === '[object Date]') return ngayKey(v);
  return String(v).trim();
}

function tomTatDong(o, cacTruong) {
  return cacTruong.map(function (t) { return t + '=' + chuanGiaTri(o[t]); }).join('; ');
}

/**
 * So sánh hai tập dòng theo khóa → danh sách thay đổi để ghi lich_su.
 * @param cu,moi   mảng object
 * @param khoa     tên cột khóa (session_id | assignment_id)
 * @param cacTruong các cột đem so sánh
 * @return {{loai:'THEM'|'SUA'|'XOA', id, truong, cu, moi}[]}
 */
function soSanhThayDoi(cu, moi, khoa, cacTruong) {
  var mCu = {}, mMoi = {}, out = [];
  cu.forEach(function (o) { mCu[chuanGiaTri(o[khoa])] = o; });
  moi.forEach(function (o) { mMoi[chuanGiaTri(o[khoa])] = o; });
  moi.forEach(function (o) {
    var id = chuanGiaTri(o[khoa]), c = mCu[id];
    if (!c) { out.push({ loai: 'THEM', id: id, truong: '', cu: '', moi: tomTatDong(o, cacTruong) }); return; }
    cacTruong.forEach(function (t) {
      var a = chuanGiaTri(c[t]), b = chuanGiaTri(o[t]);
      if (a !== b) out.push({ loai: 'SUA', id: id, truong: t, cu: a, moi: b });
    });
  });
  cu.forEach(function (o) {
    var id = chuanGiaTri(o[khoa]);
    if (!mMoi[id]) out.push({ loai: 'XOA', id: id, truong: '', cu: tomTatDong(o, cacTruong), moi: '' });
  });
  return out;
}

/* Cho Node test */
if (typeof module !== 'undefined') {
  module.exports = { chuanTen: chuanTen, chuanHoaGio: chuanHoaGio, docKhoaCot: docKhoaCot, laTabLop: laTabLop,
    docTabLop: docTabLop, taoDanhMuc: taoDanhMuc, xayDungBanGhi: xayDungBanGhi, soSanhThayDoi: soSanhThayDoi,
    levelTaiNgay: levelTaiNgay };
}
