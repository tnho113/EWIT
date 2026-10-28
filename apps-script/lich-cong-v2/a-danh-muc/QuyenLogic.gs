/**
 * E-WIT · ⓐ DANH MỤC · QuyenLogic.gs
 * Logic THUẦN tính kế hoạch quyền (không gọi dịch vụ Google, chạy được trong Node).
 * Cần Chung.gs (laCo, laEmailHopLe, tachDanhSach, duyNhat).
 * Bảng quyền: docs/lich-cong-v2/thiet-ke-du-lieu.md §1.
 */

var VAI_TRO_HE_THONG = ['QUAN_TRI', 'DANH_MUC', 'NHAP_LIEU', 'XEM'];

// Mức quyền trên từng file: 2 = sửa, 1 = xem
var BANG_QUYEN = {
  QUAN_TRI:  { A: 2, B: 2, C: 2 },
  DANH_MUC:  { A: 2, B: 1, C: 1 },
  NHAP_LIEU: { A: 1, B: 2, C: 1 },
  XEM:       { A: 1, B: 0, C: 1 }
};
var QUYEN_PHU_TRACH = { A: 1, B: 2, C: 0 };

/**
 * Tính kế hoạch quyền từ các dòng tab lop và tab quyen.
 * Trả về {fileA, fileB, fileC: {editors, viewers}, tabLop: [{class_id, editors}], quanTri: [], loi: []}
 * - Một email nhiều vai trò: lấy quyền cao nhất trên mỗi file.
 * - viewers không chứa email đã là editors.
 * - Lớp COMPLETED: tab khóa, người phụ trách không còn quyền sửa.
 */
function tinhKeHoachQuyen(lopRows, quyenRows) {
  var loi = [];
  var cap = { A: {}, B: {}, C: {} };
  var theoVaiTro = { QUAN_TRI: [], DANH_MUC: [], NHAP_LIEU: [], XEM: [] };

  function dat(file, email, muc) {
    if (!muc) return;
    if ((cap[file][email] || 0) < muc) cap[file][email] = muc;
  }
  function datTheoBang(email, bang) {
    ['A', 'B', 'C'].forEach(function (f) { dat(f, email, bang[f]); });
  }

  (quyenRows || []).forEach(function (q) {
    if (!laCo(q.dang_hieu_luc)) return;
    var email = String(q.email === undefined || q.email === null ? '' : q.email).trim().toLowerCase();
    var vt = String(q.vai_tro_he_thong || '').trim().toUpperCase();
    if (!email && !vt) return;
    if (!laEmailHopLe(email)) {
      loi.push('quyen dòng ' + (q._dong || '?') + ': email sai định dạng "' + email + '"');
      return;
    }
    if (VAI_TRO_HE_THONG.indexOf(vt) < 0) {
      loi.push('quyen dòng ' + (q._dong || '?') + ': vai trò hệ thống không hợp lệ "' + vt + '"');
      return;
    }
    theoVaiTro[vt].push(email);
    datTheoBang(email, BANG_QUYEN[vt]);
  });

  var quanTri = duyNhat(theoVaiTro.QUAN_TRI);
  var nhapLieuVaQuanTri = duyNhat(theoVaiTro.NHAP_LIEU.concat(theoVaiTro.QUAN_TRI));
  if (!quanTri.length) loi.push('Chưa có email QUAN_TRI hiệu lực trong tab quyen.');

  var tabLop = [];
  var daThayClass = {};
  (lopRows || []).forEach(function (l) {
    var classId = String(l.class_id === undefined || l.class_id === null ? '' : l.class_id).trim();
    if (!classId) return;
    if (daThayClass[classId]) {
      loi.push('lop dòng ' + (l._dong || '?') + ': class_id "' + classId + '" bị trùng');
      return;
    }
    daThayClass[classId] = true;
    var hoanThanh = String(l.trang_thai || '').trim().toUpperCase() === 'COMPLETED';
    var phuTrach = [];
    tachDanhSach(l.phu_trach_email, true).forEach(function (e) {
      if (!laEmailHopLe(e)) {
        loi.push('lop ' + classId + ': email phụ trách sai định dạng "' + e + '"');
        return;
      }
      phuTrach.push(e);
      dat('A', e, QUYEN_PHU_TRACH.A);
      if (!hoanThanh) dat('B', e, QUYEN_PHU_TRACH.B); // lớp đã kết thúc: không cần quyền sửa ⓑ từ lớp này
    });
    var editors = duyNhat((hoanThanh ? [] : phuTrach).concat(nhapLieuVaQuanTri)).sort();
    tabLop.push({ class_id: classId, editors: editors });
  });

  function ketQua(file) {
    var ed = [], vi = [];
    Object.keys(cap[file]).sort().forEach(function (e) {
      if (cap[file][e] >= 2) ed.push(e); else vi.push(e);
    });
    return { editors: ed, viewers: vi };
  }
  return { fileA: ketQua('A'), fileB: ketQua('B'), fileC: ketQua('C'), tabLop: tabLop, quanTri: quanTri, loi: loi };
}

/**
 * So kế hoạch với chia sẻ hiện tại của một file.
 * hienTai: {editors, viewers, chu}. Chủ file không bao giờ bị đưa vào danh sách gỡ.
 * Trả về {themEditors, themViewers, haCap (editor → viewer), go (gỡ hẳn)}.
 */
function soSanhChiaSe(mucTieu, hienTai) {
  var chu = String(hienTai.chu || '').toLowerCase();
  var lo = function (a) { return (a || []).map(function (x) { return String(x).trim().toLowerCase(); }).filter(function (x) { return x && x !== chu; }); };
  var curEd = lo(hienTai.editors), curVi = lo(hienTai.viewers);
  var tgEd = lo(mucTieu.editors), tgVi = lo(mucTieu.viewers);
  var inArr = function (a, x) { return a.indexOf(x) >= 0; };
  return {
    themEditors: tgEd.filter(function (e) { return !inArr(curEd, e); }),
    themViewers: tgVi.filter(function (e) { return !inArr(curEd, e) && !inArr(curVi, e); }),
    haCap: tgVi.filter(function (e) { return inArr(curEd, e); }),
    go: duyNhat(curEd.concat(curVi)).filter(function (e) { return !inArr(tgEd, e) && !inArr(tgVi, e); })
  };
}

/**
 * Quyết định có cần áp lại khóa cho một tab lớp không.
 * truoc: {e: [email], v: 'chuỗi vùng'} đã lưu lần trước (hoặc null); moi: cùng dạng.
 * Trả về 'AP_DUNG' | 'KHONG_DOI' | 'CAN_TAY' (CAN_TAY: có người bị gỡ khỏi tab nhưng đang ở chế độ chỉ thêm).
 */
function tabCanCapNhat(truoc, moi, chiThem) {
  if (!truoc) return 'AP_DUNG';
  var a = (truoc.e || []).slice().sort().join(','), b = (moi.e || []).slice().sort().join(',');
  if (a === b && truoc.v === moi.v) return 'KHONG_DOI';
  var biGo = (truoc.e || []).filter(function (x) { return (moi.e || []).indexOf(x) < 0; });
  if (biGo.length && chiThem) return 'CAN_TAY';
  return 'AP_DUNG';
}

/** Số cột (1 = A) → chữ cột A1 (1→A, 27→AA). */
function chiSoCotThanhChu(n) {
  var s = '';
  while (n > 0) { var d = (n - 1) % 26; s = String.fromCharCode(65 + d) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

/* Cho Node test */
if (typeof module !== 'undefined') {
  module.exports = { tinhKeHoachQuyen: tinhKeHoachQuyen, soSanhChiaSe: soSanhChiaSe,
    tabCanCapNhat: tabCanCapNhat, chiSoCotThanhChu: chiSoCotThanhChu };
}
