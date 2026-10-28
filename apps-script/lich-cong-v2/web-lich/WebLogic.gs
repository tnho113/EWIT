/**
 * E-WIT · Lịch & Công v2 · Web Lịch · WebLogic.gs
 * Logic thuần (không gọi dịch vụ Google) → chạy được trong Node để test.
 * Cần Chung.gs (ngayKey, laCo).
 */

var MAX_NGAY_XEM = 62;
var TRANG_THAI_THUONG = 'BINH_THUONG';
// Ký hiệu vai trò ngắn hiển thị cạnh tên EF
var KY_HIEU_VAI = { TEACHER_IC: 'TIC', HOE: 'HOE', IT: 'IT', GIAM_KHAO: 'GK', SMALL_ZOOM: 'SZ' };

/** Ký hiệu vai trò: theo bảng cố định; vai trò mới → chữ cái đầu mỗi từ (tối đa 3). */
function kyHieuVai(roleId, ten) {
  if (KY_HIEU_VAI[roleId]) return KY_HIEU_VAI[roleId];
  var t = String(ten || roleId || '').split(/[\s._-]+/).filter(function (x) { return x; });
  return t.map(function (x) { return x.charAt(0).toUpperCase(); }).join('').substring(0, 3);
}

/** Giờ bất kỳ (chuỗi '6:30', '18:30:00', '6:30 PM', Date) → 'HH:mm'; không hiểu → ''. */
function chuanGio(v) {
  if (v === '' || v === null || v === undefined) return '';
  if (Object.prototype.toString.call(v) === '[object Date]') {
    return isNaN(v.getTime()) ? '' : pad2(v.getHours()) + ':' + pad2(v.getMinutes());
  }
  var m = String(v).trim().match(/^(\d{1,2})[:h](\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (!m) return '';
  var h = +m[1];
  if (m[3]) { var pm = m[3].toUpperCase() === 'PM'; if (pm && h < 12) h += 12; if (!pm && h === 12) h = 0; }
  return pad2(h) + ':' + pad2(+m[2]);
}

/** '357' → 'T3 · T5 · T7' */
function nhanThuHoc(s) {
  return String(s === null || s === undefined ? '' : s).replace(/[^2-8]/g, '').split('').map(function (c) { return nhanThu(+c); }).join(' · ');
}

/** Chữ trắng khi nền tối; nền sáng/không có nền → '' (dùng màu mặc định). */
function mauChuTuNen(hex) {
  var m = String(hex || '').trim().match(/^#([0-9a-f]{6})$/i);
  if (!m) return '';
  var n = parseInt(m[1], 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.55 ? '#FFFFFF' : '';
}

/** Mọi ngày 'yyyy-MM-dd' từ tu đến den (gồm cả hai đầu). */
function cacNgayTrong(tu, den) {
  var a = tu.split('-'), b = den.split('-');
  var t = Date.UTC(+a[0], +a[1] - 1, +a[2]), e = Date.UTC(+b[0], +b[1] - 1, +b[2]);
  var out = [];
  for (; t <= e && out.length <= 400; t += 864e5) {
    var d = new Date(t);
    out.push(d.getUTCFullYear() + '-' + pad2(d.getUTCMonth() + 1) + '-' + pad2(d.getUTCDate()));
  }
  return out;
}

/** Kiểm tra khoảng ngày; trả {tu, den} đã chuẩn hóa hoặc ném lỗi tiếng Việt. */
function kiemTraKhoang(tu, den) {
  var a = ngayKey(tu), b = ngayKey(den);
  if (!a || !b) throw new Error('Ngày không hợp lệ.');
  if (b < a) throw new Error('"Đến ngày" đang trước "Từ ngày".');
  if (cacNgayTrong(a, b).length > MAX_NGAY_XEM) throw new Error('Chỉ xem tối đa ' + MAX_NGAY_XEM + ' ngày một lần.');
  return { tu: a, den: b };
}

function soSanhVi(a, b) { return String(a).localeCompare(String(b), 'vi'); }

/**
 * Dựng lưới Lớp × Ngày.
 * duLieu: {buoi, phanCong, lop, ef, vaiTro, trangThai} (mảng object theo tên cột ⓒ/ⓐ).
 * boLoc: {ef_id, class_id, status_id, role_id} (rỗng = không lọc).
 */
function dungLuoi(duLieu, tu, den, boLoc) {
  boLoc = boLoc || {};
  var fEf = boLoc.ef_id || '', fLop = boLoc.class_id || '', fSt = boLoc.status_id || '', fVai = boLoc.role_id || '';
  var coLocNguoi = !!(fEf || fVai), coLocPhu = !!(fEf || fVai || fSt);
  var ngayList = cacNgayTrong(tu, den);

  var efMap = {}, vaiMap = {}, vaiThuTu = {}, ttMap = {}, lopMap = {};
  (duLieu.ef || []).forEach(function (e) { efMap[e.ef_id] = e; });
  (duLieu.vaiTro || []).forEach(function (v, i) { vaiMap[v.role_id] = v; vaiThuTu[v.role_id] = i; });
  (duLieu.trangThai || []).forEach(function (t) { ttMap[t.status_id] = t; });
  (duLieu.lop || []).forEach(function (l) { lopMap[l.class_id] = l; });

  // Phân công trong khoảng, gom theo session
  var pcTheoBuoi = {}, efTrongKhoang = {};
  (duLieu.phanCong || []).forEach(function (p) {
    var n = ngayKey(p.ngay);
    if (!n || n < tu || n > den) return;
    (pcTheoBuoi[p.session_id] = pcTheoBuoi[p.session_id] || []).push(p);
    efTrongKhoang[p.ef_id] = true;
  });

  function chipNguoi(p) {
    var e = efMap[p.ef_id] || {}, v = vaiMap[p.role_id] || {};
    return {
      ef_id: p.ef_id, ten: e.ten_hien_thi || p.ef_id, role_id: p.role_id,
      vaiTro: kyHieuVai(p.role_id, v.ten_vai_tro), tenVaiTro: v.ten_vai_tro || p.role_id,
      mauNen: e.mau_nen || '', mauChu: e.mau_chu || ''
    };
  }

  var hang = {}, soBuoi = 0, soLuot = 0;
  function layHang(classId) {
    if (!hang[classId]) {
      var l = lopMap[classId] || {};
      var bd = chuanGio(l.gio_bat_dau), kt = chuanGio(l.gio_ket_thuc);
      hang[classId] = { class_id: classId, ten: l.ten_lop || classId, gioBd: bd,
        gio: bd ? (bd + (kt ? ' - ' + kt : '')) : '', thuHoc: nhanThuHoc(l.thu_hoc), o: {} };
    }
    return hang[classId];
  }

  (duLieu.buoi || []).forEach(function (b) {
    var n = ngayKey(b.ngay);
    if (!n || n < tu || n > den) return;
    if (fLop && b.class_id !== fLop) return;
    var stId = b.status_id || TRANG_THAI_THUONG;
    if (fSt && stId !== fSt) return;
    var nguoi = (pcTheoBuoi[b.session_id] || []).filter(function (p) {
      return (!fEf || p.ef_id === fEf) && (!fVai || p.role_id === fVai);
    }).map(chipNguoi);
    if (coLocNguoi && !nguoi.length) return;
    nguoi.sort(function (x, y) {
      return ((vaiThuTu[x.role_id] === undefined ? 99 : vaiThuTu[x.role_id]) - (vaiThuTu[y.role_id] === undefined ? 99 : vaiThuTu[y.role_id])) || soSanhVi(x.ten, y.ten);
    });
    var tt = ttMap[stId] || {};
    var mau = tt.mau || '';
    var h = layHang(b.class_id);
    (h.o[n] = h.o[n] || []).push({
      session_id: b.session_id, buoiSo: b.buoi_so === undefined ? '' : b.buoi_so,
      gio: chuanGio(b.gio_bat_dau), status: stId, tenTrangThai: tt.ten || stId,
      laThuong: stId === TRANG_THAI_THUONG, mau: mau, mauChu: mauChuTuNen(mau), nguoi: nguoi
    });
    soBuoi++; soLuot += nguoi.length;
  });
  Object.keys(hang).forEach(function (k) {
    Object.keys(hang[k].o).forEach(function (n) { hang[k].o[n].sort(function (a, b) { return soSanhVi(a.gio, b.gio); }); });
  });

  // Lớp ACTIVE trong khoảng nhưng chưa có buổi vẫn hiện dòng trống (khi không lọc EF/vai trò/trạng thái)
  function hoatDongTrongKhoang(l) {
    var bd = ngayKey(l.ngay_bat_dau), kt = ngayKey(l.ngay_ket_thuc);
    return String(l.trang_thai).trim().toUpperCase() === 'ACTIVE' && (!bd || bd <= den) && (!kt || kt >= tu);
  }
  if (!coLocPhu) {
    (duLieu.lop || []).forEach(function (l) {
      if (fLop ? l.class_id === fLop : hoatDongTrongKhoang(l)) layHang(l.class_id);
    });
  }

  var dsHang = Object.keys(hang).map(function (k) { return hang[k]; });
  dsHang.sort(function (a, b) { return soSanhVi(a.gioBd || '99', b.gioBd || '99') || soSanhVi(a.ten, b.ten); });

  // Tùy chọn cho các ô lọc (không phụ thuộc bộ lọc hiện tại)
  var lopCoBuoi = {};
  (duLieu.buoi || []).forEach(function (b) { var n = ngayKey(b.ngay); if (n && n >= tu && n <= den) lopCoBuoi[b.class_id] = true; });
  var tuyLop = [];
  (duLieu.lop || []).forEach(function (l) {
    if (lopCoBuoi[l.class_id] || hoatDongTrongKhoang(l)) tuyLop.push({ id: l.class_id, ten: l.ten_lop || l.class_id });
  });
  Object.keys(lopCoBuoi).forEach(function (id) { if (!lopMap[id]) tuyLop.push({ id: id, ten: id }); });
  tuyLop.sort(function (a, b) { return soSanhVi(a.ten, b.ten); });

  var tuyEf = Object.keys(efTrongKhoang).map(function (id) {
    var e = efMap[id] || {};
    return { id: id, ten: e.ten_hien_thi || id, mauNen: e.mau_nen || '', mauChu: e.mau_chu || '' };
  }).sort(function (a, b) { return soSanhVi(a.ten, b.ten); });

  return {
    ngay: ngayList.map(function (k) {
      var p = k.split('-');
      return { key: k, thu: nhanThu(thuCuaNgay(k)), hien: p[2] + '/' + p[1] };
    }),
    lop: dsHang,
    kpi: { soLop: dsHang.length, soBuoi: soBuoi, soLuotEf: soLuot },
    tuyChon: {
      lop: tuyLop, ef: tuyEf,
      trangThai: (duLieu.trangThai || []).map(function (t) { return { id: t.status_id, ten: t.ten, mau: t.mau || '', mauChu: mauChuTuNen(t.mau) }; }),
      vaiTro: (duLieu.vaiTro || []).map(function (v) { return { id: v.role_id, ten: v.ten_vai_tro, kyHieu: kyHieuVai(v.role_id, v.ten_vai_tro) }; })
    }
  };
}
