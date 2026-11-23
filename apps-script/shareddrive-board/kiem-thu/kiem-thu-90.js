/** Kiểm thử 90_GiaLap.gs: công tắc Giả lập / Chạy thật, sổ, dọn sạch. Chỉ email @example.com. */
const assert = require('assert');
const { taoMoiTruong, bangMau } = require('./gia-lap');
let dat = 0, truot = 0;
const thu = (ten, fn) => { try { fn(); console.log('✔ ' + ten + ' ĐẠT'); dat++; } catch (e) { console.log('✘ ' + ten + ' TRƯỢT: ' + e.message); truot++; } };

function canh(cheDo) {
  const bang = bangMau(), T = bang.tabs;
  if (cheDo) T.CAI_DAT.v.push(['Chế độ', cheDo]);
  T.CAU_TRUC.v.push(['O_TTC', 'Thông tin chung', 'EWIT · Thông tin chung', 'Ổ', '', '', '', 'o1'], ['CN_TEN', 'Ổ cá nhân', 'MLWIT · {Mã người} · {Họ tên}', 'Ổ'],
    ['TTC_EF', 'Thông tin chung', 'EF', 'Thư mục', '', '', '', 'tm1']);
  T.NHOM.v.push(['KIND', 'Kind', 'Dự án', '', '', 'EWIT', 'Đang', 'sd-kind@example.com', 'tmK', 'x']);
  T.NGUOI.v.push(['a@example.com', 'A', '', 'EF', '', 'Đang', '', '', 'o2', 'kq', 'U00001']);
  T.THANH_VIEN.v.push(['a@example.com', 'A', 'KIND', 'Dự án', 'Thành viên', 'Sửa', 'Đang']);
  T.NHAP.v.push(['b@example.com', 'B', '', 'HV', 'KIND', '', '', '', '', 'TT', '', '']);
  const g = { o: { o1: 1, o2: 1, oThat: 1 }, nhom: { 'sd-kind@example.com': 1, 'sd-u-u00001@example.com': 1, 'khac@example.com': 1 }, tep: [], tra: 'GIA LAP', oBang: '', noiDung: {} };
  const them = {
    Drive: { Drives: { remove: id => { if (!g.o[id]) throw new Error('Not Found'); delete g.o[id]; } },
      Files: { get: () => ({ driveId: g.oBang }), create: r => { g.tep.push(r); return { id: 'f' + g.tep.length }; },
        list: o => ({ files: (g.noiDung[o.driveId] || []).map(u => ({ id: 'x', lastModifyingUser: u })) }) } },
    AdminDirectory: { Groups: { list: () => ({ groups: Object.keys(g.nhom).map(e => ({ email: e, name: e })) }), remove: e => { if (!g.nhom[e]) throw new Error('notFound'); delete g.nhom[e]; } } }
  };
  const chay = ham => { const ctx = taoMoiTruong(bang, them);
    const ui = ctx.SpreadsheetApp.getUi(); ctx.SpreadsheetApp.getUi = () => Object.assign(ui, { ButtonSet: Object.assign(ui.ButtonSet, { OK_CANCEL: 2 }), Button: Object.assign(ui.Button, { OK: 'OK' }),
      prompt: () => ({ getSelectedButton: () => 'OK', getResponseText: () => g.tra }) });
    ctx[ham](); return ctx; };
  const cd = k => (T.CAI_DAT.v.find(r => r[0] === k) || [])[1];
  const loi = () => T.NHAT_KY.v.filter(r => r[2] === 'LỖI').map(r => r[4]).join(' | ');
  return { bang, T, g, chay, cd, loi };
}

thu('1. Nhận hiện trạng: ghi ổ trên bảng + nhóm tiền tố vào sổ, đặt Chế độ = Giả lập; nhóm khác không ghi', () => {
  const c = canh(); c.chay('sdGiaLapNhanHienTrang');
  const so = c.T._GIA_LAP.v.slice(1).map(r => r[0] + ':' + r[1]).sort();
  assert.deepStrictEqual(so, ['Nhóm:sd-kind@example.com', 'Nhóm:sd-u-u00001@example.com', 'Ổ:o1', 'Ổ:o2']);
  assert.strictEqual(c.cd('Chế độ'), 'Giả lập');
  c.chay('sdGiaLapNhanHienTrang');
  assert.strictEqual(c.T._GIA_LAP.v.length, 5, 'chạy lại không ghi trùng');
});
thu('2. Đang Chạy thật: không nhận hiện trạng, không dọn sạch', () => {
  const c = canh('Chạy thật'); c.chay('sdGiaLapNhanHienTrang');
  assert(/Chạy thật/.test(c.loi())); assert(!c.T._GIA_LAP);
  c.chay('sdGiaLapDonSach');
  assert.strictEqual(Object.keys(c.g.o).length, 3, 'không xóa ổ nào');
});
thu('3. Gõ sai chữ xác nhận: hủy, không đổi gì', () => {
  const c = canh(); c.g.tra = 'ok'; c.chay('sdGiaLapNhanHienTrang');
  assert(!c.T._GIA_LAP); assert.strictEqual(c.cd('Chế độ'), undefined);
});
thu('4. Xem trước dọn sạch không xóa gì; Dọn sạch xóa đúng sổ, làm trống bảng, giữ cấu hình', () => {
  const c = canh(); c.chay('sdGiaLapNhanHienTrang');
  c.chay('sdGiaLapXemTruocDon');
  assert.strictEqual(Object.keys(c.g.o).length, 3);
  c.g.tra = 'XOA HET'; c.chay('sdGiaLapDonSach');
  assert.deepStrictEqual(Object.keys(c.g.o), ['oThat'], 'ổ ngoài sổ còn nguyên');
  assert.deepStrictEqual(Object.keys(c.g.nhom), ['khac@example.com']);
  assert.strictEqual(c.T._GIA_LAP.v.length, 1, 'sổ trống');
  const trong = t => c.T[t].v.slice(1).every(r => r.join('') === '');
  assert(trong('NGUOI') && trong('THANH_VIEN'), 'NGUOI/THANH_VIEN trống');
  assert.strictEqual(c.T.NHAP.v[1][0], ''); assert.strictEqual(c.T.NHAP.v[1][9], 'TT', 'cột Tình trạng không bị đụng');
  assert.strictEqual(c.T.NHOM.v[1][0], 'KIND'); assert.strictEqual(c.T.NHOM.v[1][7], ''); assert.strictEqual(c.T.NHOM.v[1][8], '');
  assert.strictEqual(c.T.CAU_TRUC.v[1][7], ''); assert.strictEqual(c.T.CAU_TRUC.v[1][2], 'EWIT · Thông tin chung');
  assert.strictEqual(c.loi(), '');
});
thu('5. Khóa công tắc: còn sổ thì không sang Chạy thật; dọn xong thì sang được; có dữ liệu thì không về Giả lập', () => {
  const c = canh(); c.chay('sdGiaLapNhanHienTrang');
  c.chay('sdChuyenChayThat'); assert.strictEqual(c.cd('Chế độ'), 'Giả lập'); assert(/Sổ giả lập còn/.test(c.loi()));
  c.g.tra = 'XOA HET'; c.chay('sdGiaLapDonSach'); c.chay('sdChuyenChayThat');
  assert.strictEqual(c.cd('Chế độ'), 'Chạy thật');
  c.chay('sdChuyenGiaLap'); assert.strictEqual(c.cd('Chế độ'), 'Giả lập', 'bảng trống → về Giả lập được');
  c.chay('sdChuyenChayThat');
  c.T.NGUOI.v[1] = ['that@example.com', 'Thật', '', 'HV', '', 'Đang'];
  c.chay('sdChuyenGiaLap'); assert.strictEqual(c.cd('Chế độ'), 'Chạy thật', 'có người thật → bị chặn');
});
thu('6. Bảng điều khiển nằm trong ổ thuộc sổ: từ chối dọn', () => {
  const c = canh(); c.chay('sdGiaLapNhanHienTrang'); c.g.oBang = 'o1'; c.g.tra = 'XOA HET'; c.chay('sdGiaLapDonSach');
  assert.strictEqual(Object.keys(c.g.o).length, 3); assert(/Bảng điều khiển đang nằm/.test(c.loi()));
});
thu('7. Lỗi xóa một ổ: giữ mục đó trong sổ, không làm trống bảng; chạy lại thì xong', () => {
  const c = canh(); c.chay('sdGiaLapNhanHienTrang'); c.g.tra = 'XOA HET';
  const goc = c.g; let hong = true;
  const ctxRemove = id => { if (id === 'o2' && hong) throw new Error('Quota'); if (!goc.o[id]) throw new Error('Not Found'); delete goc.o[id]; };
  // thay hàm remove qua lần chạy
  const c2 = c; const cu = c2.chay;
  c2.chay = ham => { const ctx = require('./gia-lap').taoMoiTruong(c.bang, {
      Drive: { Drives: { remove: ctxRemove }, Files: { get: () => ({ driveId: '' }), list: () => ({ files: [] }) } },
      AdminDirectory: { Groups: { list: () => ({ groups: [] }), remove: e => { delete goc.nhom[e]; } } } });
    const ui = ctx.SpreadsheetApp.getUi(); ctx.SpreadsheetApp.getUi = () => Object.assign(ui, { ButtonSet: { OK_CANCEL: 2 }, Button: { OK: 'OK' }, prompt: () => ({ getSelectedButton: () => 'OK', getResponseText: () => 'XOA HET' }) });
    ctx[ham](); };
  c2.chay('sdGiaLapDonSach');
  assert.deepStrictEqual(c.T._GIA_LAP.v.slice(1).map(r => r[1]), ['o2']);
  assert.strictEqual(c.T.NGUOI.v[1][0], 'a@example.com', 'chưa làm trống bảng');
  hong = false; c2.chay('sdGiaLapDonSach');
  assert.strictEqual(c.T._GIA_LAP.v.length, 1); assert.strictEqual(c.T.NGUOI.v[1][0], '');
});
thu('8. Giả lập: tên ổ có [THỬ]; glGhiSo_ chỉ ghi khi Giả lập; tạo nội dung thử gắn sdthu', () => {
  const c = canh('Giả lập'); const ctx = c.chay('sdGiaLapTaoNoiDung');
  assert(c.g.tep.length >= 3 && c.g.tep.every(f => f.properties.sdthu === '1'));
  ctx.P = { ss: c.bang, nk: [], loi: 0 };
  const C = ctx.taiDuLieu_();
  assert.strictEqual(ctx.dongCauTruc_(C, 'O_TTC').duong, '[THỬ] EWIT · Thông tin chung');
  assert.strictEqual(ctx.tenOCaNhan_(C, C.nguoi['a@example.com']), '[THỬ] MLWIT · A');
  ctx.glGhiSo_(C, 'Ổ', 'oMoi', 'x'); assert(c.T._GIA_LAP.v.some(r => r[1] === 'oMoi'));
  const d = canh('Chạy thật'); const ctx2 = d.chay('sdChuyenChayThat'); ctx2.P = { ss: d.bang, nk: [], loi: 0 };
  const C2 = ctx2.taiDuLieu_(); ctx2.glGhiSo_(C2, 'Ổ', 'oX', 'x'); assert(!d.T._GIA_LAP || !d.T._GIA_LAP.v.some(r => r[1] === 'oX'));
  assert.strictEqual(ctx2.dongCauTruc_(C2, 'O_TTC').duong, 'EWIT · Thông tin chung');
});
thu('9. A4 · Xem trước dọn sạch đếm tệp từng ổ; ổ có tệp người khác sửa cần gõ XOA CA TAI LIEU, gõ khác thì bỏ qua ổ đó', () => {
  const c = canh(); c.chay('sdGiaLapNhanHienTrang');
  c.g.noiDung = { o1: [{ emailAddress: 'admin@example.com', me: true }, { me: true }], o2: [{ me: true }, { emailAddress: 'video@example.com' }, {}] };
  c.chay('sdGiaLapXemTruocDon');
  const nk = c.T.NHAT_KY.v.map(r => r[3]).join(' | ');
  assert(/2 tệp\/thư mục, 0 do người khác/.test(nk) && /3 tệp\/thư mục, 2 do người khác/.test(nk), nk);
  assert(c.T.NHAT_KY.v.some(r => /XOA CA TAI LIEU/.test(r[4])), 'tóm tắt Xem trước nhắc xác nhận thứ hai');
  assert.strictEqual(Object.keys(c.g.o).length, 3);
  // Dọn sạch: lần 1 đúng XOA HET, lần 2 gõ sai → bỏ qua o2, vẫn xóa o1 + nhóm; bảng chưa làm trống
  const goi = [];
  const chay2 = (tl2) => { const ctx = require('./gia-lap').taoMoiTruong(c.bang, {
      Drive: { Drives: { remove: id => { if (!c.g.o[id]) throw new Error('Not Found'); delete c.g.o[id]; } },
        Files: { get: () => ({ driveId: '' }), list: o => ({ files: (c.g.noiDung[o.driveId] || []).map(u => ({ lastModifyingUser: u })) }) } },
      AdminDirectory: { Groups: { list: () => ({ groups: [] }), remove: e => { delete c.g.nhom[e]; } } } });
    const ui = ctx.SpreadsheetApp.getUi(); let lan = 0;
    ctx.SpreadsheetApp.getUi = () => Object.assign(ui, { ButtonSet: { OK_CANCEL: 2 }, Button: { OK: 'OK' },
      prompt: (td, nd) => { goi.push(nd); lan++; return { getSelectedButton: () => 'OK', getResponseText: () => lan === 1 ? 'XOA HET' : tl2 }; } });
    ctx.sdGiaLapDonSach(); };
  chay2('xoa');
  assert.strictEqual(goi.length, 2, 'hỏi xác nhận thứ hai'); assert(/XOA CA TAI LIEU/.test(goi[1]) && /Ổ cá nhân · A/.test(goi[1]), goi[1]);
  assert.deepStrictEqual(Object.keys(c.g.o).sort(), ['o2', 'oThat'], 'o1 xóa, o2 (có tài liệu người khác) giữ');
  assert.deepStrictEqual(c.T._GIA_LAP.v.slice(1).map(r => r[1]), ['o2'], 'o2 còn trong sổ');
  assert.strictEqual(c.T.NGUOI.v[1][0], 'a@example.com', 'chưa làm trống bảng');
  assert(c.T.NHAT_KY.v.some(r => /Bỏ qua 1 ổ có tài liệu của người khác/.test(r[3])));
  // gõ đúng → xóa nốt, làm trống bảng
  goi.length = 0; chay2('XOA CA TAI LIEU');
  assert.deepStrictEqual(Object.keys(c.g.o), ['oThat']); assert.strictEqual(c.T.NGUOI.v[1][0], '');
});
thu('10. A4 · Không đọc được nội dung ổ → coi như có tài liệu người khác (an toàn)', () => {
  const c = canh(); c.chay('sdGiaLapNhanHienTrang');
  const ctx = require('./gia-lap').taoMoiTruong(c.bang, { Drive: { Files: { get: () => ({ driveId: '' }), list: () => { throw new Error('Rate limit'); } }, Drives: { remove: () => {} } } });
  ctx.sdGiaLapXemTruocDon();
  assert(c.T.NHAT_KY.v.some(r => /không đọc được nội dung \(Rate limit\)/.test(r[3])));
  assert(c.T.NHAT_KY.v.some(r => /⚠ 2 ổ có tệp do người khác/.test(r[4])));
});
console.log(truot ? `\n${truot} TRƯỢT / ${dat + truot}` : `\nTẤT CẢ ĐẠT (${dat}/${dat})`);
process.exit(truot ? 1 : 0);
