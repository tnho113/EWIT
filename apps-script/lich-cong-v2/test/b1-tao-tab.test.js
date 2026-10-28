const test = require('node:test');
const assert = require('node:assert');
const { napGs } = require('./nap-gs');

const g = napGs('_chung/Chung.gs', 'b-nhap-lieu/TaoTabLogic.gs');

const vaiTro = [
  { role_id: 'TEACHER_IC', ten_vai_tro: 'Teacher in charge', cho_phep_nhieu_nguoi: 'Không', dang_dung: 'Có', nguon: 'NHAP_TAY' },
  { role_id: 'HOE', ten_vai_tro: 'H.O.E', cho_phep_nhieu_nguoi: 'Không', dang_dung: 'Có', nguon: 'NHAP_TAY' },
  { role_id: 'SMALL_ZOOM', ten_vai_tro: 'Small Zoom', cho_phep_nhieu_nguoi: 'Có', dang_dung: 'Có', nguon: 'ZOOM_REPORT' },
  { role_id: 'GIAM_KHAO', ten_vai_tro: 'Giám khảo', cho_phep_nhieu_nguoi: 'Có', dang_dung: 'Có', nguon: 'NHAP_TAY' },
  { role_id: 'CU', ten_vai_tro: 'Cũ', cho_phep_nhieu_nguoi: 'Không', dang_dung: 'Không', nguon: 'NHAP_TAY' }
];
const bo = [
  { bo_id: 'CHINH_THUC', role_id: 'SMALL_ZOOM', thu_tu_cot: '5' },
  { bo_id: 'CHINH_THUC', role_id: 'TEACHER_IC', thu_tu_cot: '1' },
  { bo_id: 'CHINH_THUC', role_id: 'GIAM_KHAO', thu_tu_cot: '4' },
  { bo_id: 'CHINH_THUC', role_id: 'HOE', thu_tu_cot: '2' },
  { bo_id: 'CHINH_THUC', role_id: 'CU', thu_tu_cot: '6' },
  { bo_id: 'TRAINING', role_id: 'TEACHER_IC', thu_tu_cot: '1' }
];

test('tinhCotTabLop: thứ tự khóa đúng hợp đồng §4', () => {
  const khoa = Array.from(g.tinhCotTabLop(bo, vaiTro, 'CHINH_THUC').map(c => c.khoa));
  assert.deepStrictEqual(khoa, ['buoi_so', 'ngay', 'thu', 'gio_bd', 'gio_kt', 'plan', 'actual', 'status',
    'role:TEACHER_IC', 'role:HOE', 'role:GIAM_KHAO', 'role:SMALL_ZOOM', 'ghi_chu']);
});

test('tinhCotTabLop: loại cột, nhiều người, tiêu đề', () => {
  const cot = g.tinhCotTabLop(bo, vaiTro, 'CHINH_THUC');
  const theo = k => cot.find(c => c.khoa === k);
  assert.strictEqual(theo('buoi_so').loai, 'tu_dong');
  assert.strictEqual(theo('thu').loai, 'tu_dong');
  assert.strictEqual(theo('ngay').loai, 'nhap_tay');
  assert.strictEqual(theo('status').loai, 'chon');
  assert.strictEqual(theo('role:HOE').loai, 'chon');
  assert.strictEqual(theo('role:HOE').nhieuNguoi, false);
  assert.strictEqual(theo('role:GIAM_KHAO').nhieuNguoi, true);
  assert.strictEqual(theo('role:SMALL_ZOOM').loai, 'zoom');
  assert.strictEqual(theo('role:TEACHER_IC').tieuDe, 'Teacher in charge');
  assert.strictEqual(theo('role:TEACHER_IC').roleId, 'TEACHER_IC');
});

test('tinhCotTabLop: bộ khác, bộ không tồn tại', () => {
  assert.strictEqual(g.tinhCotTabLop(bo, vaiTro, 'TRAINING').length, 10);
  assert.strictEqual(g.tinhCotTabLop(bo, vaiTro, 'KHONG_CO').length, 9);
});

test('danhSoBuoi đánh số các dòng có ngày', () => {
  const r = g.danhSoBuoi([new Date(2026, 9, 26), '', new Date(2026, 9, 28), 'abc', '30/10/2026']);
  assert.deepStrictEqual(Array.from(r), [1, '', 2, '', 3]);
});

test('chuoiGioHoc nhiều kiểu đầu vào', () => {
  assert.strictEqual(g.chuoiGioHoc('19:30', '21:00'), '19:30 - 21:00');
  assert.strictEqual(g.chuoiGioHoc('5:00', '06:30'), '05:00 - 06:30');
  assert.strictEqual(g.chuoiGioHoc(19.5 / 24, 21 / 24), '19:30 - 21:00');
  assert.strictEqual(g.chuoiGioHoc('19:30', ''), '19:30');
  assert.strictEqual(g.chuoiGioHoc('', ''), '');
});

test('lopChuaCoTab: ACTIVE, tab_nhap trống, chưa có tab', () => {
  const lop = [
    { class_id: 'A', trang_thai: 'ACTIVE', tab_nhap: '' },
    { class_id: 'B', trang_thai: 'ACTIVE', tab_nhap: 'B' },
    { class_id: 'C', trang_thai: 'COMPLETED', tab_nhap: '' },
    { class_id: 'D', trang_thai: 'ACTIVE', tab_nhap: '' },
    { class_id: 'E', trang_thai: 'PAUSED', tab_nhap: '' }
  ];
  const r = g.lopChuaCoTab(lop, ['D', 'HUONG_DAN']);
  assert.deepStrictEqual(Array.from(r.map(l => l.class_id)), ['A']);
});

test('chuCot, cotThieu, mauChuTheoNen', () => {
  assert.strictEqual(g.chuCot(1), 'A');
  assert.strictEqual(g.chuCot(26), 'Z');
  assert.strictEqual(g.chuCot(27), 'AA');
  const cot = g.tinhCotTabLop(bo, vaiTro, 'CHINH_THUC');
  const t = g.cotThieu(cot, ['ngay', 'role:HOE', 'role:TEACHER_IC']);
  assert.deepStrictEqual(Array.from(t.map(c => c.khoa)), ['role:GIAM_KHAO', 'role:SMALL_ZOOM']);
  assert.strictEqual(g.mauChuTheoNen('#3D0A6E'), '#FFFFFF');
  assert.strictEqual(g.mauChuTheoNen('#1FAF6E'), '#FFFFFF');
  assert.strictEqual(g.mauChuTheoNen('#FFE08A'), '#000000');
});
