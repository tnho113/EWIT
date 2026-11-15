/**
 * MLWIT · SHARED DRIVE BOARD v2 · PHẦN CHUNG
 * Tên tab, tên cột, phiên chạy, nhật ký, kiểm tra admin.
 * Script đọc cột theo TÊN TIÊU ĐỀ, nên có thể đổi thứ tự cột trên bảng.
 */
var TAB = {
  CAI_DAT: 'CAI_DAT', NHOM: 'NHOM', NHAP: 'NHAP', NGUOI: 'NGUOI', THANH_VIEN: 'THANH_VIEN',
  VAI_TRO: 'VAI_TRO', CAU_TRUC: 'CAU_TRUC', XEM_NHOM: 'XEM_NHOM', NHAT_KY: 'NHAT_KY', LS_NHAP: 'LS_NHAP'
};
var COT = {
  NGUOI: ['Email', 'Họ tên', 'Mã người', 'Vai trò', 'Cấp', 'Trạng thái', 'Ngày vào', 'Cập nhật', 'ID ổ', 'Kết quả Drive'],
  THANH_VIEN: ['Email', 'Họ tên', 'Mã nhóm', 'Loại nhóm', 'Vai trong nhóm', 'Quyền', 'Trạng thái', 'Ngày thêm', 'Cập nhật', 'Nguồn', 'Lịch sử', 'Kết quả Drive']
};
COT.LS_NHAP = ['Thời gian xử lý', 'Email', 'Họ tên', 'Mã người', 'Vai trò', 'Mã nhóm', 'Vai trong nhóm', 'Quyền', 'Việc', 'Ghi chú', 'Kết quả'];
var DS = {
  LOAI_NHOM: ['Cấp', 'Lớp', 'Nhóm nhỏ', 'Dự án', 'Ban', 'Tri thức', 'Dữ liệu', 'Tổ chức'],
  TT_NHOM: ['Đang', 'Kết thúc', 'Đóng', 'Ngừng'],
  VAI_TRO: ['HV', 'EF', 'GV', 'Tổ chức'],
  VAI_NHOM: ['Thành viên', 'Phụ trách'],
  QUYEN: ['Xem', 'Sửa'],
  VIEC: ['Thêm', 'Gỡ', 'Nghỉ'],
  CO_PHU_TRACH: ['Lớp', 'Nhóm nhỏ', 'Dự án', 'Ban', 'Tri thức', 'Dữ liệu']
};

var P = null; // phiên chạy hiện tại

function chuan_(s) { return String(s == null ? '' : s).trim(); }
function email_(s) { return chuan_(s).toLowerCase(); }
function maNhom_(s) { return chuan_(s).toUpperCase(); }
function emailHopLe_(e) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e); }
function bayGio_() { return Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy HH:mm'); }
function homNay_() { return Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'dd/MM/yyyy'); }

/** Chạy một việc trong phiên có khóa, kiểm tra admin, ghi nhật ký. */
function chayPhien_(ten, viec) {
  var khoa = LockService.getScriptLock();
  if (!khoa.tryLock(5000)) { thongBao_('Đang có một lượt chạy khác. Đợi 1 phút rồi thử lại.'); return; }
  P = { ten: ten, ss: SpreadsheetApp.getActiveSpreadsheet(), nk: [], loi: 0, tomTat: '' };
  try {
    var cd = docCaiDat_();
    kiemAdmin_(cd);
    viec(cd);
  } catch (e) {
    P.loi++;
    ghi_('LỖI', 'Dừng giữa chừng', e.message);
  } finally {
    ghiNhatKy_();
    thongBao_(ten + ': ' + (P.loi ? P.loi + ' LỖI, xem cột Kết quả và NHAT_KY.' : 'xong, không lỗi.') + (P.tomTat ? ' ' + P.tomTat : ''));
    khoa.releaseLock();
  }
}

function docCaiDat_() {
  var tab = P.ss.getSheetByName(TAB.CAI_DAT);
  if (!tab) throw new Error('Thiếu tab CAI_DAT');
  var v = tab.getDataRange().getValues(), cd = {};
  v.forEach(function (r) { cd[chuan_(r[0])] = chuan_(r[1]); });
  return cd;
}

function kiemAdmin_(cd) {
  var admin = email_(cd['Email admin']);
  var toi = email_(Session.getEffectiveUser().getEmail());
  if (!admin) throw new Error('CAI_DAT chưa có "Email admin".');
  if (toi !== admin) throw new Error('Chỉ ' + admin + ' được chạy. Tài khoản đang chạy: ' + (toi || 'không rõ'));
}

/** Đọc tab thành danh sách đối tượng theo tên cột. */
function docTab_(ten) {
  var tab = P.ss.getSheetByName(ten);
  if (!tab) throw new Error('Thiếu tab ' + ten);
  var v = tab.getDataRange().getValues();
  var tieuDe = (v[0] || []).map(chuan_), dong = [];
  for (var i = 1; i < v.length; i++) {
    if (v[i].join('').trim() === '') continue;
    var o = { _dong: i + 1 };
    tieuDe.forEach(function (td, j) { if (td) o[td] = v[i][j]; });
    dong.push(o);
  }
  return { tab: tab, tieuDe: tieuDe, dong: dong };
}

/** Ghi đè toàn bộ phần dữ liệu (từ dòng 2) của tab do script quản lý. */
function ghiDeTab_(ten, cot, dsDong) {
  var tab = P.ss.getSheetByName(ten);
  if (!tab) throw new Error('Thiếu tab ' + ten);
  var tieuDe = tab.getRange(1, 1, 1, Math.max(tab.getLastColumn(), cot.length)).getValues()[0].map(chuan_);
  cot.forEach(function (c) { if (tieuDe.indexOf(c) < 0) throw new Error('Tab ' + ten + ' thiếu cột "' + c + '"'); });
  if (!dsDong.length) return;
  var v = dsDong.map(function (o) { return tieuDe.map(function (td) { return td && o[td] !== undefined ? o[td] : ''; }); });
  tab.getRange(2, 1, v.length, tieuDe.length).setValues(v);
}

/** Ghi một cột (theo tên) cho các dòng cụ thể. */
function ghiCot_(bang, tenCot, theoDong) {
  var c = bang.tieuDe.indexOf(tenCot);
  if (c < 0) throw new Error('Tab thiếu cột "' + tenCot + '"');
  Object.keys(theoDong).forEach(function (d) { bang.tab.getRange(Number(d), c + 1).setValue(theoDong[d]); });
}

function ghi_(phan, viec, doiTuong) {
  if (phan === 'LỖI') P.loi++;
  P.nk.push([bayGio_(), P.ten, phan, viec, doiTuong || '']);
}

function ghiNhatKy_() {
  var nk = P.ss.getSheetByName(TAB.NHAT_KY);
  if (!nk) nk = P.ss.insertSheet(TAB.NHAT_KY);
  if (nk.getLastRow() === 0) nk.appendRow(['Thời gian', 'Lệnh', 'Phần', 'Việc', 'Đối tượng']);
  P.nk.push([bayGio_(), P.ten, 'Kết thúc', P.loi ? P.loi + ' lỗi' : 'Không lỗi', P.tomTat || '']);
  nk.getRange(nk.getLastRow() + 1, 1, P.nk.length, 5).setValues(P.nk);
}

function thongBao_(chu) {
  try { SpreadsheetApp.getActiveSpreadsheet().toast(chu, 'Shared Drive', 10); } catch (e) { /* chạy ngoài bảng */ }
}
