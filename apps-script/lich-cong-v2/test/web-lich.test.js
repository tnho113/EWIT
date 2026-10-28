const test = require('node:test');
const assert = require('node:assert');
const { napGs } = require('./nap-gs');

const g = napGs('_chung/Chung.gs', 'web-lich/WebLogic.gs');
// Object tạo trong vm khác realm → chuẩn hóa qua JSON trước khi so sánh sâu
const J = (x) => JSON.parse(JSON.stringify(x));

const TU = '2026-11-02', DEN = '2026-11-08'; // T2 → CN
const dl = () => ({
  lop: [
    { class_id: 'G1-K22', ten_lop: 'Grade 1 K22', gio_bat_dau: '19:30', gio_ket_thuc: '21:00', thu_hoc: '357', trang_thai: 'ACTIVE', ngay_bat_dau: '2026-09-01', ngay_ket_thuc: '2027-01-30' },
    { class_id: 'G2-K10', ten_lop: 'Grade 2 K10', gio_bat_dau: '18:00', gio_ket_thuc: '19:30', thu_hoc: '246', trang_thai: 'ACTIVE', ngay_bat_dau: '2026-09-01', ngay_ket_thuc: '' },
    { class_id: 'CU', ten_lop: 'Lớp cũ', gio_bat_dau: '17:00', gio_ket_thuc: '18:00', thu_hoc: '2', trang_thai: 'COMPLETED', ngay_bat_dau: '2025-01-01', ngay_ket_thuc: '2025-06-01' },
    { class_id: 'TUONG-LAI', ten_lop: 'Lớp sắp mở', gio_bat_dau: '20:00', gio_ket_thuc: '21:00', thu_hoc: '3', trang_thai: 'ACTIVE', ngay_bat_dau: '2027-03-01', ngay_ket_thuc: '' }
  ],
  ef: [
    { ef_id: 'P001', ten_hien_thi: 'Mr. Okie', mau_nen: '#3D0A6E', mau_chu: '#FFFFFF' },
    { ef_id: 'P002', ten_hien_thi: 'Anh Đào', mau_nen: '', mau_chu: '' },
    { ef_id: 'P003', ten_hien_thi: 'Auri', mau_nen: '#FFE08A', mau_chu: '#2B2238' }
  ],
  vaiTro: [
    { role_id: 'TEACHER_IC', ten_vai_tro: 'Teacher in charge' },
    { role_id: 'HOE', ten_vai_tro: 'H.O.E' },
    { role_id: 'IT', ten_vai_tro: 'IT' },
    { role_id: 'GIAM_KHAO', ten_vai_tro: 'Giám khảo' }
  ],
  trangThai: [
    { status_id: 'BINH_THUONG', ten: '(Bình thường)', mau: '' },
    { status_id: 'OFF', ten: 'OFF', mau: '#F6B3B3' },
    { status_id: 'FINAL', ten: 'FINAL TEST', mau: '#FFE08A' },
    { status_id: 'SELF_TEACHING', ten: 'SELF TEACHING', mau: '#1FAF6E' },
    { status_id: 'CLOSING', ten: 'CLOSING CEREMONY', mau: '#3D0A6E' }
  ],
  buoi: [
    { session_id: 'G1-K22_20261104', class_id: 'G1-K22', ngay: '2026-11-04', gio_bat_dau: '19:30', buoi_so: 5, status_id: '' },
    { session_id: 'G1-K22_20261106', class_id: 'G1-K22', ngay: '2026-11-06', gio_bat_dau: '19:30', buoi_so: 6, status_id: 'FINAL' },
    { session_id: 'G1-K22_20261108', class_id: 'G1-K22', ngay: '2026-11-08', gio_bat_dau: '19:30', buoi_so: 7, status_id: 'OFF' },
    { session_id: 'G2-K10_20261103', class_id: 'G2-K10', ngay: '2026-11-03', gio_bat_dau: '18:00', buoi_so: 3, status_id: 'SELF_TEACHING' },
    { session_id: 'G1-K22_20261001', class_id: 'G1-K22', ngay: '2026-10-01', gio_bat_dau: '19:30', buoi_so: 1, status_id: '' } // ngoài khoảng
  ],
  phanCong: [
    { session_id: 'G1-K22_20261104', ngay: '2026-11-04', ef_id: 'P002', role_id: 'IT' },
    { session_id: 'G1-K22_20261104', ngay: '2026-11-04', ef_id: 'P001', role_id: 'TEACHER_IC' },
    { session_id: 'G1-K22_20261104', ngay: '2026-11-04', ef_id: 'P003', role_id: 'HOE' },
    { session_id: 'G1-K22_20261106', ngay: '2026-11-06', ef_id: 'P001', role_id: 'TEACHER_IC' },
    { session_id: 'G1-K22_20261106', ngay: '2026-11-06', ef_id: 'P003', role_id: 'GIAM_KHAO' },
    { session_id: 'G1-K22_20261106', ngay: '2026-11-06', ef_id: 'P002', role_id: 'GIAM_KHAO' },
    { session_id: 'G1-K22_20261001', ngay: '2026-10-01', ef_id: 'P001', role_id: 'TEACHER_IC' }
  ]
});
const lopTheoId = (lu, id) => lu.lop.find(l => l.class_id === id);

test('dựng lưới: 7 ngày, nhãn thứ, ô đúng ngày, bỏ buổi ngoài khoảng', () => {
  const lu = g.dungLuoi(dl(), TU, DEN, {});
  assert.deepStrictEqual(J(lu.ngay.map(n => n.thu)), ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']);
  assert.strictEqual(lu.ngay[0].hien, '02/11');
  const g1 = lopTheoId(lu, 'G1-K22');
  assert.deepStrictEqual(J(Object.keys(g1.o).sort()), ['2026-11-04', '2026-11-06', '2026-11-08']);
  assert.strictEqual(g1.gio, '19:30 - 21:00');
  assert.strictEqual(g1.thuHoc, 'T3 · T5 · T7');
});

test('lớp ACTIVE chưa có buổi vẫn hiện dòng trống; COMPLETED và lớp chưa bắt đầu thì không', () => {
  const dl0 = dl(); dl0.buoi = []; dl0.phanCong = [];
  const lu = g.dungLuoi(dl0, TU, DEN, {});
  assert.deepStrictEqual(J(lu.lop.map(l => l.class_id)), ['G2-K10', 'G1-K22']); // sắp theo giờ
  assert.deepStrictEqual(J(lu.lop[0].o), {});
  assert.strictEqual(lu.kpi.soBuoi, 0);
});

test('nhiều người trong một ô: sắp theo thứ tự vai trò, có ký hiệu, tên vai trò, màu EF', () => {
  const lu = g.dungLuoi(dl(), TU, DEN, {});
  const o = lopTheoId(lu, 'G1-K22').o['2026-11-04'];
  assert.strictEqual(o.length, 1);
  assert.deepStrictEqual(J(o[0].nguoi.map(n => n.vaiTro)), ['TIC', 'HOE', 'IT']);
  assert.strictEqual(o[0].nguoi[0].ten, 'Mr. Okie');
  assert.strictEqual(o[0].nguoi[0].tenVaiTro, 'Teacher in charge');
  assert.strictEqual(o[0].nguoi[0].mauNen, '#3D0A6E');
  assert.strictEqual(o[0].nguoi[2].mauNen, '');
  assert.strictEqual(o[0].laThuong, true);
  assert.strictEqual(o[0].status, 'BINH_THUONG');
});

test('màu trạng thái và chữ trắng khi nền tối', () => {
  const lu = g.dungLuoi(dl(), TU, DEN, {});
  const off = lopTheoId(lu, 'G1-K22').o['2026-11-08'][0];
  assert.strictEqual(off.mau, '#F6B3B3'); assert.strictEqual(off.mauChu, '');
  assert.strictEqual(off.nguoi.length, 0);
  const st = lopTheoId(lu, 'G2-K10').o['2026-11-03'][0];
  assert.strictEqual(st.mau, '#1FAF6E'); assert.strictEqual(st.mauChu, '#FFFFFF');
  assert.strictEqual(g.mauChuTuNen('#FFE08A'), '');
  assert.strictEqual(g.mauChuTuNen('#3D0A6E'), '#FFFFFF');
  assert.strictEqual(g.mauChuTuNen(''), '');
});

test('KPI: số lớp, số buổi, số lượt EF', () => {
  const lu = g.dungLuoi(dl(), TU, DEN, {});
  assert.deepStrictEqual(JSON.parse(JSON.stringify(lu.kpi)), { soLop: 2, soBuoi: 4, soLuotEf: 6 });
});

test('lọc theo EF: chỉ buổi và người của EF đó, ẩn lớp trống', () => {
  const lu = g.dungLuoi(dl(), TU, DEN, { ef_id: 'P002' });
  const g1 = lopTheoId(lu, 'G1-K22');
  assert.deepStrictEqual(J(Object.keys(g1.o).sort()), ['2026-11-04', '2026-11-06']);
  assert.ok(Object.values(g1.o).every(ds => ds[0].nguoi.every(n => n.ef_id === 'P002')));
  assert.strictEqual(lu.lop.length, 1);
  assert.strictEqual(lu.kpi.soLuotEf, 2);
});

test('lọc theo lớp (kể cả lớp chưa có buổi), trạng thái, vai trò', () => {
  assert.strictEqual(g.dungLuoi(dl(), TU, DEN, { class_id: 'G2-K10' }).lop.length, 1);
  const trong = g.dungLuoi(dl(), '2026-12-01', '2026-12-07', { class_id: 'G2-K10' });
  assert.strictEqual(trong.lop.length, 1);
  assert.deepStrictEqual(J(trong.lop[0].o), {});
  const st = g.dungLuoi(dl(), TU, DEN, { status_id: 'FINAL' });
  assert.deepStrictEqual(J(st.lop.map(l => l.class_id)), ['G1-K22']);
  assert.deepStrictEqual(J(Object.keys(st.lop[0].o)), ['2026-11-06']);
  const vai = g.dungLuoi(dl(), TU, DEN, { role_id: 'GIAM_KHAO' });
  assert.strictEqual(vai.kpi.soBuoi, 1);
  assert.strictEqual(vai.kpi.soLuotEf, 2);
  const ket = g.dungLuoi(dl(), TU, DEN, { ef_id: 'P001', role_id: 'IT' });
  assert.strictEqual(ket.lop.length, 0);
});

test('tùy chọn lọc không đổi theo bộ lọc; EF theo tên', () => {
  const a = g.dungLuoi(dl(), TU, DEN, {}), b = g.dungLuoi(dl(), TU, DEN, { ef_id: 'P001' });
  assert.deepStrictEqual(JSON.parse(JSON.stringify(a.tuyChon)), JSON.parse(JSON.stringify(b.tuyChon)));
  assert.deepStrictEqual(J(a.tuyChon.ef.map(e => e.ten)), ['Anh Đào', 'Auri', 'Mr. Okie']);
  assert.deepStrictEqual(J(a.tuyChon.lop.map(l => l.id)), ['G1-K22', 'G2-K10']);
});

test('ngày dạng Date và giờ dạng Date/AM-PM đều được chuẩn hóa', () => {
  const d = dl(); d.buoi[0].ngay = new Date(2026, 10, 4);
  const lu = g.dungLuoi(d, TU, DEN, {});
  assert.ok(lopTheoId(lu, 'G1-K22').o['2026-11-04']);
  assert.strictEqual(g.chuanGio('7:30 PM'), '19:30');
  assert.strictEqual(g.chuanGio('06:05:00'), '06:05');
  assert.strictEqual(g.chuanGio('abc'), '');
});

test('kiemTraKhoang và ký hiệu vai trò', () => {
  assert.deepStrictEqual(JSON.parse(JSON.stringify(g.kiemTraKhoang('2026-11-02', '2026-11-08'))), { tu: '2026-11-02', den: '2026-11-08' });
  assert.throws(() => g.kiemTraKhoang('2026-11-08', '2026-11-02'));
  assert.throws(() => g.kiemTraKhoang('2026-01-01', '2026-12-31'), /62/);
  assert.doesNotThrow(() => g.kiemTraKhoang('2026-11-01', '2027-01-01')); // đúng 62 ngày
  assert.strictEqual(g.kyHieuVai('SMALL_ZOOM', ''), 'SZ');
  assert.strictEqual(g.kyHieuVai('X', 'Trợ giảng chính'), 'TGC');
});
