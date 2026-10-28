const test = require('node:test');
const assert = require('node:assert');
const { napGs } = require('./nap-gs');

// Mảng tạo trong vm khác realm → chuyển qua JSON trước khi deepStrictEqual
const pl = (x) => JSON.parse(JSON.stringify(x));
const g = napGs('_chung/Chung.gs', 'b-nhap-lieu/DongBoLogic.gs');

const KHOA = ['buoi_so', 'ngay', 'thu', 'gio_bd', 'gio_kt', 'plan', 'actual', 'status',
  'role:TEACHER_IC', 'role:HOE', 'role:SMALL_ZOOM', 'role:GIAM_KHAO', 'ghi_chu'];

function tab(dongBuoi) {
  const v = [];
  for (let i = 0; i < 6; i++) v.push([]);
  v.push(KHOA);            // dòng 7
  v.push(KHOA.map(() => '')); // dòng 8 tiêu đề
  dongBuoi.forEach(b => v.push(KHOA.map(k => (b[k] === undefined ? '' : b[k]))));
  return v;
}
// [ngay, status, teacher, hoe, smallzoom, giamkhao]
const B = (ngay, o) => Object.assign({ ngay }, o || {});

const lop = { class_id: 'G1-K22', nhom_lop: 'Grade', ngay_bat_dau: new Date(2026, 8, 1), ngay_ket_thuc: new Date(2026, 11, 31),
  gio_bat_dau: '19:00', gio_ket_thuc: '21:00', thu_hoc: 357 };

const dm = g.taoDanhMuc(
  [{ ef_id: 'EF001', ten_hien_thi: 'Nery', dang_hoat_dong: 'Có' },
   { ef_id: 'EF002', ten_hien_thi: 'Lan Anh', dang_hoat_dong: 'Có' },
   { ef_id: 'EF003', ten_hien_thi: 'Bình', dang_hoat_dong: 'Không' }],
  [{ bi_danh: 'LanAnh', ef_id: 'EF002' }],
  [{ ef_id: 'EF001', level_id: 'L2', tu_ngay: new Date(2026, 0, 1), den_ngay: new Date(2026, 9, 31) },
   { ef_id: 'EF001', level_id: 'L1', tu_ngay: new Date(2026, 10, 1), den_ngay: '' },
   { ef_id: 'EF002', level_id: 'TEACHER', tu_ngay: '', den_ngay: '' }],
  [{ role_id: 'TEACHER_IC', nguon: 'NHAP_TAY' }, { role_id: 'HOE', nguon: 'NHAP_TAY' },
   { role_id: 'SMALL_ZOOM', nguon: 'ZOOM_REPORT' }, { role_id: 'GIAM_KHAO', nguon: 'NHAP_TAY' }],
  [{ status_id: 'BINH_THUONG', ten: '(Bình thường)', ghi_nhan_nguoi: 'Có' },
   { status_id: 'OFF', ten: 'OFF', ghi_nhan_nguoi: 'Không' },
   { status_id: 'MIDTERM', ten: 'MIDTERM TEST', ghi_nhan_nguoi: 'Có' }]);

function chay(buoi, lopObj, homNay) {
  const b = g.docTabLop(tab(buoi));
  return g.xayDungBanGhi(Object.assign({ tabDong: 'G1-K22' }, lopObj || lop), b, dm, homNay || '2026-09-01');
}
const loai = (r, l) => r.loi.filter(x => x.loai_loi === l);

test('docTabLop: bỏ dòng không có ngày, ghi số dòng, ngày dạng Date/chuỗi', () => {
  const b = g.docTabLop(tab([B(new Date(2026, 8, 2)), {}, B('04/09/2026', { 'role:HOE': ' Nery ' })]));
  assert.strictEqual(b.length, 2);
  assert.strictEqual(b[0].dong, 9);
  assert.strictEqual(b[1].dong, 11);
  assert.strictEqual(b[1].ngayKey, '2026-09-04');
  assert.strictEqual(b[1].vaiTro.HOE, 'Nery');
});

test('chuanHoaGio: Date, chuỗi, số, rỗng', () => {
  assert.strictEqual(g.chuanHoaGio(new Date(1899, 11, 30, 9, 5)), '09:05');
  assert.strictEqual(g.chuanHoaGio('7:30'), '07:30');
  assert.strictEqual(g.chuanHoaGio('19:00:00'), '19:00');
  assert.strictEqual(g.chuanHoaGio(0.5), '12:00');
  assert.strictEqual(g.chuanHoaGio(''), '');
});

test('session_id: buổi trùng ngày có hậu tố _2, _3; buoi_so tăng theo dòng', () => {
  const r = chay([B(new Date(2026, 8, 2)), B(new Date(2026, 8, 2)), B(new Date(2026, 8, 2))]);
  assert.deepStrictEqual(pl(r.buoiHoc.map(x => x.session_id)), ['G1-K22_20260902', 'G1-K22_20260902_2', 'G1-K22_20260902_3']);
  assert.deepStrictEqual(pl(r.buoiHoc.map(x => x.buoi_so)), [1, 2, 3]);
  assert.strictEqual(loai(r, 'TRUNG_NGAY').length, 2);
});

test('giờ trống lấy của lớp; giờ riêng được giữ; status trống = BINH_THUONG', () => {
  const r = chay([B(new Date(2026, 8, 2)), B(new Date(2026, 8, 4), { gio_bd: new Date(1899, 11, 30, 18, 30), gio_kt: '20:00' })]);
  assert.strictEqual(r.buoiHoc[0].gio_bat_dau, '19:00');
  assert.strictEqual(r.buoiHoc[0].gio_ket_thuc, '21:00');
  assert.strictEqual(r.buoiHoc[0].status_id, 'BINH_THUONG');
  assert.strictEqual(r.buoiHoc[1].gio_bat_dau, '18:30');
  assert.strictEqual(r.buoiHoc[1].gio_ket_thuc, '20:00');
});

test('tên → ef_id qua ten_hien_thi (không phân biệt hoa/thường, khoảng trắng) rồi bí danh', () => {
  const r = chay([B(new Date(2026, 8, 2), { 'role:TEACHER_IC': '  nery ', 'role:HOE': 'LANANH' }),
                  B(new Date(2026, 8, 4), { 'role:TEACHER_IC': 'lan   anh' })]);
  const a = r.phanCong.map(x => x.assignment_id);
  assert.deepStrictEqual(pl(a), ['G1-K22_20260902_EF001_TEACHER_IC', 'G1-K22_20260902_EF002_HOE', 'G1-K22_20260904_EF002_TEACHER_IC']);
  assert.strictEqual(r.phanCong[0].nguon, 'NHAP_TAY');
  assert.strictEqual(r.phanCong[0].nhom_lop, 'Grade');
  assert.strictEqual(r.loi.filter(x => x.muc_do === 'LOI').length, 0);
});

test('tên lạ → TEN_LA (LOI), không tạo phan_cong', () => {
  const r = chay([B(new Date(2026, 8, 2), { 'role:TEACHER_IC': 'Người Lạ' })]);
  assert.strictEqual(r.phanCong.length, 0);
  const l = loai(r, 'TEN_LA');
  assert.strictEqual(l.length, 1);
  assert.strictEqual(l[0].muc_do, 'LOI');
  assert.strictEqual(l[0].ngay, '2026-09-02');
  assert.strictEqual(l[0].tab_dong, 'G1-K22');
  assert.strictEqual(loai(r, 'THIEU_TEACHER').length, 0, 'có tên (dù lạ) thì không báo thiếu');
});

test('trạng thái ghi_nhan_nguoi = Không (OFF): có buoi_hoc, không có phan_cong', () => {
  const r = chay([B(new Date(2026, 8, 2), { status: 'OFF', 'role:TEACHER_IC': 'Nery' })], null, '2026-12-01');
  assert.strictEqual(r.buoiHoc.length, 1);
  assert.strictEqual(r.buoiHoc[0].status_id, 'OFF');
  assert.strictEqual(r.phanCong.length, 0);
  assert.strictEqual(loai(r, 'THIEU_TEACHER').length, 0);
});

test('trạng thái lạ → LOI TRANG_THAI_LA, rơi về BINH_THUONG', () => {
  const r = chay([B(new Date(2026, 8, 2), { status: 'XYZ' })]);
  assert.strictEqual(loai(r, 'TRANG_THAI_LA').length, 1);
  assert.strictEqual(r.buoiHoc[0].status_id, 'BINH_THUONG');
});

test('level theo ngày: trước/sau khi lên level; thiếu level → THIEU_LEVEL', () => {
  const r = chay([B(new Date(2026, 9, 30), { 'role:TEACHER_IC': 'Nery' }), B(new Date(2026, 10, 2), { 'role:TEACHER_IC': 'Nery' }),
                  B(new Date(2026, 8, 2), { 'role:HOE': 'Lan Anh' }), B(new Date(2025, 11, 31), { 'role:HOE': 'Nery' })]);
  const lv = Object.fromEntries(r.phanCong.map(x => [x.assignment_id, x.level_id]));
  assert.strictEqual(lv['G1-K22_20261030_EF001_TEACHER_IC'], 'L2');
  assert.strictEqual(lv['G1-K22_20261102_EF001_TEACHER_IC'], 'L1');
  assert.strictEqual(lv['G1-K22_20260902_EF002_HOE'], 'TEACHER', 'tu_ngay/den_ngay trống = mọi ngày');
  assert.strictEqual(lv['G1-K22_20251231_EF001_HOE'], '');
  assert.strictEqual(loai(r, 'THIEU_LEVEL').length, 1);
  assert.strictEqual(loai(r, 'THIEU_LEVEL')[0].muc_do, 'CANH_BAO');
});

test('nhiều người trong 1 ô "A, B" → nhiều phan_cong; trùng người chỉ tính 1', () => {
  const r = chay([B(new Date(2026, 8, 2), { 'role:HOE': 'Nery, Lan Anh; nery' })]);
  assert.deepStrictEqual(pl(r.phanCong.map(x => x.ef_id)), ['EF001', 'EF002']);
});

test('role ZOOM_REPORT bị bỏ qua khi đọc tab', () => {
  const r = chay([B(new Date(2026, 8, 2), { 'role:SMALL_ZOOM': 'Nery' })]);
  assert.strictEqual(r.phanCong.length, 0);
  assert.strictEqual(r.loi.filter(x => x.loai_loi === 'TEN_LA').length, 0);
});

test('ngoài khóa học → NGOAI_KHOA_HOC (LOI), vẫn tạo buổi', () => {
  const r = chay([B(new Date(2026, 7, 31)), B(new Date(2027, 0, 1)), B(new Date(2026, 8, 2))]);
  assert.strictEqual(loai(r, 'NGOAI_KHOA_HOC').length, 2);
  assert.ok(loai(r, 'NGOAI_KHOA_HOC').every(x => x.muc_do === 'LOI'));
  assert.strictEqual(r.buoiHoc.length, 3);
});

test('sai thứ → SAI_THU (CANH_BAO); đúng thứ (2/9/2026 = T4... lớp 357) thì không', () => {
  // 2026-09-02 là thứ Tư (4), lớp học 3-5-7 → sai; 2026-09-03 là thứ Năm (5) → đúng
  const r = chay([B(new Date(2026, 8, 2)), B(new Date(2026, 8, 3))]);
  const l = loai(r, 'SAI_THU');
  assert.strictEqual(l.length, 1);
  assert.strictEqual(l[0].ngay, '2026-09-02');
  assert.strictEqual(l[0].muc_do, 'CANH_BAO');
});

test('THIEU_TEACHER: chỉ buổi đã qua, ghi nhận người, lớp có cột Teacher', () => {
  const buoi = [B(new Date(2026, 8, 3)), B(new Date(2026, 8, 10)), B(new Date(2026, 8, 17), { status: 'OFF' })];
  const r = chay(buoi, null, '2026-09-10');
  const l = loai(r, 'THIEU_TEACHER');
  assert.deepStrictEqual(pl(l.map(x => x.ngay)), ['2026-09-03']); // 10/9 chưa "qua", 17/9 tương lai
  assert.strictEqual(l[0].muc_do, 'CANH_BAO');
  assert.strictEqual(loai(chay(buoi, null, ''), 'THIEU_TEACHER').length, 0, 'không truyền ngày hôm nay thì không kiểm tra');
});

test('EF_DA_NGHI: EF dang_hoat_dong = Không được xếp', () => {
  const r = chay([B(new Date(2026, 8, 3), { 'role:HOE': 'Bình' })]);
  assert.strictEqual(loai(r, 'EF_DA_NGHI').length, 1);
  assert.strictEqual(r.phanCong.length, 1, 'vẫn ghi nhận phân công');
});

test('THIEU_GIAM_KHAO: MIDTERM thiếu giám khảo; có giám khảo thì không', () => {
  const r = chay([B(new Date(2026, 8, 3), { status: 'MIDTERM TEST' }), B(new Date(2026, 8, 5), { status: 'MIDTERM TEST', 'role:GIAM_KHAO': 'Nery, Lan Anh' })]);
  assert.deepStrictEqual(pl(loai(r, 'THIEU_GIAM_KHAO').map(x => x.ngay)), ['2026-09-03']);
  assert.strictEqual(r.phanCong.filter(x => x.role_id === 'GIAM_KHAO').length, 2);
});

test('soSanhThayDoi: THEM / SUA / XOA, bỏ qua trường không so sánh', () => {
  const cu = [
    { session_id: 'S1', plan: 'A', actual: 'x', ngay: '2026-09-02', cap_nhat_luc: 't1' },
    { session_id: 'S2', plan: 'B', actual: '', ngay: '2026-09-03', cap_nhat_luc: 't1' },
    { session_id: 'S3', plan: 'C', actual: '', ngay: new Date(2026, 8, 4), cap_nhat_luc: 't1' }];
  const moi = [
    { session_id: 'S1', plan: 'A2', actual: 'x', ngay: new Date(2026, 8, 2), cap_nhat_luc: 't2' },
    { session_id: 'S3', plan: 'C', actual: '', ngay: '2026-09-04', cap_nhat_luc: 't2' },
    { session_id: 'S4', plan: 'D', actual: '', ngay: '2026-09-05', cap_nhat_luc: 't2' }];
  const d = g.soSanhThayDoi(cu, moi, 'session_id', ['ngay', 'plan', 'actual']);
  assert.deepStrictEqual(pl(d.map(x => x.loai + ':' + x.id)), ['SUA:S1', 'THEM:S4', 'XOA:S2']);
  assert.strictEqual(d[0].truong, 'plan');
  assert.strictEqual(d[0].cu, 'A');
  assert.strictEqual(d[0].moi, 'A2');
  assert.match(d[1].moi, /plan=D/);
  assert.match(d[2].cu, /plan=B/);
  assert.strictEqual(g.soSanhThayDoi(cu, cu, 'session_id', ['plan']).length, 0);
});
