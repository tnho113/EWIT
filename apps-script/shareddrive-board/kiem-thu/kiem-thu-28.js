/**
 * Kiểm thử Đợt sửa A + WD-28 (23/11/2026): lớp chỉ xem / lớp đầy đủ, phụ trách lớp chỉ Sửa TAI-LIEU, đổi Mã nhóm nhận lại
 * thư mục theo ID, Sửa ở Lớp/Level/Nhóm nhỏ = Xem, chốt hằng đêm, nhóm "không chắc", con trỏ trước khi ghi bảng,
 * nhóm ngoài bảng, cảnh báo THANH_VIEN mồ côi, NHOM trùng mã, công thức Tình trạng.
 * Chạy: node kiem-thu/kiem-thu-28.js (đứng ở apps-script/shareddrive-board). Dùng giả lập của kiem-thu-30.js. Chỉ @example.com.
 */
const assert = require('assert');
const { ng, tv, dungBang, dungMoiTruong, MIME_TM, MIME_LT, ADMIN } = require('./kiem-thu-30');
const { taoMoiTruong, bangMau } = require('./gia-lap');

const sd = (ma, hau) => 'sd-' + ma.toLowerCase() + (hau ? '-' + hau : '') + '@example.com';

/** Bảng của kiem-thu-30 + lớp chỉ xem KES-02 (không có nhóm nhỏ). */
function canh(chinh) {
  const bang = dungBang(), T = bang.tabs;
  T.NHOM.v.push(['KES-02', 'Kids ES 02', 'Lớp', '', '20_KIDS', 'EWIT', 'Đang']);
  if (chinh) chinh(T);
  const E = dungMoiTruong(bang), { D, ctx } = E;
  let nk0 = 0;
  const H = {
    bang, T, D, ctx, E,
    apDung: () => { nk0 = T.NHAT_KY.v.length; ctx.sdDriveApDung(); },
    xemTruoc: () => { nk0 = T.NHAT_KY.v.length; ctx.sdDriveXemTruoc(); },
    dem: () => { nk0 = T.NHAT_KY.v.length; ctx.sdDriveHangDem(); },
    nk: () => T.NHAT_KY.v.slice(nk0),
    loi: () => H.nk().filter(r => r[2] === 'LỖI'),
    khongLoi: () => assert.strictEqual(H.loi().length, 0, 'có LỖI: ' + JSON.stringify(H.loi())),
    dongNguoi: e => T.NGUOI.v.findIndex(r => r[0] === e),
    idO: e => T.NGUOI.v[H.dongNguoi(e)][8],
    oCN: e => D.S.o[H.idO(e)],
    tep: (ap, oId) => Object.values(D.S.tep).find(t => !t.trashed && (!oId || t.driveId === oId) && Object.entries(ap).every(([k, v]) => (t.properties || {})[k] === v)),
    q: f => { const x = D.S.o[f] ? D.S.o[f].tv : D.S.tep[f].q; const m = {}; Object.entries(x).forEach(([e, v]) => { m[e] = v.role; }); return m; },
    lt: oId => Object.values(D.S.tep).filter(t => t.driveId === oId && t.mimeType === MIME_LT && !t.trashed),
    kqTv: (e, ma) => { const v = T.THANH_VIEN.v, c = v[0].indexOf('Kết quả Drive'); return (v.find(r => r[0] === e && r[2] === ma) || [])[c]; },
    kqNg: e => { const v = T.NGUOI.v, c = v[0].indexOf('Kết quả Drive'); return v[H.dongNguoi(e)][c]; },
    props: () => ctx.PropertiesService.getScriptProperties(),
    thuToi: e => E.thu.filter(x => x.to === e)
  };
  return H;
}
const TV_KES = T => {
  T.NGUOI.v.push(ng('hv5@example.com', 'HV Năm', 'K22-905', 'HV', '', 'Đang', 'U00007'));
  T.THANH_VIEN.v.push(tv('hv5@example.com', 'KES-02', 'Lớp'), tv('ef1@example.com', 'KES-02', 'Lớp'), tv('gv1@example.com', 'KES-02', 'Lớp', 'Phụ trách'));
};

let dat = 0, truot = 0;
function nhom(ten, fn) { try { fn(); console.log('✔ ' + ten + ' ĐẠT'); dat++; } catch (e) { console.log('✘ ' + ten + ' TRƯỢT: ' + (e && e.stack || e)); truot++; } }

/* ================= B1. LỚP CHỈ XEM / ĐẦY ĐỦ ================= */

nhom('B1a. lopDayDu_ / coOCaNhan_ / laNguoiHoc_: lớp có nhóm nhỏ (mọi trạng thái) = đầy đủ; chỉ lớp chỉ xem → không ổ', () => {
  const H = canh(T => { TV_KES(T); T.NHOM.v.find(r => r[0] === 'PA03-01')[6] = 'Đóng'; });
  H.ctx.P = { ss: H.bang, nk: [], loi: 0 };
  const C = H.ctx.taiDuLieu_();
  assert.strictEqual(H.ctx.lopDayDu_(C, 'ME02'), true);
  assert.strictEqual(H.ctx.lopDayDu_(C, 'PA03'), true, 'nhóm nhỏ Đóng vẫn tính');
  assert.strictEqual(H.ctx.lopDayDu_(C, 'KES-02'), false);
  assert.strictEqual(H.ctx.lopChiXem_(C, 'KES-02'), true);
  assert.strictEqual(H.ctx.lopChiXem_(C, 'KIND'), false, 'Dự án không phải lớp');
  assert.strictEqual(H.ctx.coOCaNhan_(C, C.nguoi['hv5@example.com']), false, 'chỉ lớp chỉ xem: không ổ');
  assert.strictEqual(H.ctx.coOCaNhan_(C, C.nguoi['ef1@example.com']), true);
  assert.strictEqual(H.ctx.laNguoiHoc_(C, C.nguoi['ef1@example.com']), false, 'EF học lớp chỉ xem: không phải người học');
  assert.strictEqual(H.ctx.hocLopNao_(C, C.nguoi['ef1@example.com']), true);
});

nhom('V7. Lớp đầy đủ Đóng: học viên vẫn có ổ (giữ Hồ sơ); lớp chỉ xem Đóng: không', () => {
  const H = canh(T => {
    TV_KES(T);
    T.NHOM.v.find(r => r[0] === 'ME02')[6] = 'Đóng';
    T.NHOM.v.find(r => r[0] === 'KES-02')[6] = 'Đóng';
  });
  H.ctx.P = { ss: H.bang, nk: [], loi: 0 };
  const C = H.ctx.taiDuLieu_();
  const hv = Object.values(C.nguoi).filter(n => n.vaiTro === 'HV' && H.ctx.nhomCuaNguoi_(C, n.email).some(t => t.ma === 'ME02' || C.nhom[t.ma] && C.nhom[t.ma].thuoc === 'ME02'));
  assert(hv.length > 0, 'có HV lớp ME02 trong dữ liệu mẫu');
  hv.forEach(n => assert.strictEqual(H.ctx.coOCaNhan_(C, n), true, n.email + ' giữ ổ khi lớp đầy đủ Đóng'));
  assert.strictEqual(H.ctx.coOCaNhan_(C, C.nguoi['hv5@example.com']), false, 'lớp chỉ xem Đóng: không ổ');
});

nhom('B1a2. Phụ trách lớp chỉ xem (không nhóm nào khác) vẫn có ổ cá nhân', () => {
  const H = canh(T => {
    TV_KES(T);
    T.NGUOI.v.push(ng('gv9@example.com', 'GV Chín', 'K22-909', 'GV', '', 'Đang', 'U00009'));
    T.THANH_VIEN.v.push(tv('gv9@example.com', 'KES-02', 'Lớp', 'Phụ trách'));
  });
  H.ctx.P = { ss: H.bang, nk: [], loi: 0 };
  const C = H.ctx.taiDuLieu_();
  assert.strictEqual(H.ctx.coOCaNhan_(C, C.nguoi['gv9@example.com']), true, 'phụ trách lớp chỉ xem cần ổ');
  assert.strictEqual(H.ctx.coOCaNhan_(C, C.nguoi['hv5@example.com']), false, 'thành viên lớp chỉ xem vẫn không ổ');
});

nhom('B1b. Áp dụng: HV lớp chỉ xem không ổ / Hồ sơ / nộp bài / nhóm riêng; thư mục lớp sd-kes-02@ Xem; EF có ổ thấy lối tắt lớp', () => {
  const H = canh(TV_KES);
  H.apDung(); H.khongLoi();
  assert.strictEqual(H.idO('hv5@example.com'), '', 'không tạo ổ');
  assert(!H.tep({ sdma: 'HS_NG', sdemail: 'hv5@example.com' }), 'không HS_NG');
  assert(!H.tep({ sdma: 'HS_TL', sdemail: 'hv5@example.com' }) && !H.tep({ sdma: 'HS_NK', sdemail: 'hv5@example.com' }));
  assert(!H.tep({ sdma: 'HS_NOP', sdlop: 'KES-02' }), 'không thư mục nộp bài cho lớp chỉ xem');
  assert(/lớp chỉ xem: không tạo ổ/.test(H.kqNg('hv5@example.com')), H.kqNg('hv5@example.com'));
  const kes = H.tep({ sdma: 'LOP_NHOM', sdnhom: 'KES-02' });
  assert.strictEqual(kes.name, 'KES-02 · Kids ES 02');
  assert.deepStrictEqual(H.q(kes.id), { [sd('KES-02')]: 'reader', [sd('KES-02', 'pt')]: 'reader' });
  assert.deepStrictEqual(H.q(H.tep({ sdma: 'LOP_TL', sdnhom: 'KES-02' }).id), { [sd('KES-02', 'pt')]: 'writer' });
  assert.deepStrictEqual(H.q(H.tep({ sdma: 'LOP_VIDEO', sdnhom: 'KES-02' }).id), {});
  // ef1 (có ổ vì Level/Dự án) học KES-02: có 10_LOP-DANG-HOC + lối tắt KES-02, KHÔNG có Hồ sơ học tập
  const o1 = H.oCN('ef1@example.com').id, dang = H.tep({ sdma: 'CN_LOP_DANG' }, o1);
  assert(dang, 'tạo 10_LOP-DANG-HOC trong ổ EF');
  assert.deepStrictEqual(H.lt(o1).filter(t => t.parents[0] === dang.id).map(t => t.shortcutDetails.targetId), [kes.id]);
  assert(!H.lt(o1).some(t => t.name === '20 · Hồ sơ học tập'), 'EF học lớp chỉ xem: không lối tắt Hồ sơ');
  assert(!H.tep({ sdma: 'HS_NG', sdemail: 'ef1@example.com' }));
  // hv1 (lớp đầy đủ) vẫn như cũ
  assert(H.tep({ sdma: 'HS_NOP', sdemail: 'hv1@example.com', sdlop: 'ME02' }));
});

nhom('B1c. Thư lớp chỉ xem: xếp hàng 60 phút, gửi một lần, đánh dấu THANH_VIEN; Gửi lại thư chào gửi người chưa nhận', () => {
  const H = canh(TV_KES);
  H.apDung(); H.khongLoi();
  assert.strictEqual(H.thuToi('hv5@example.com').length, 0, 'chưa gửi ngay');
  assert(H.nk().some(r => r[2] === 'Thư lớp' && /Xếp hàng/.test(r[3]) && r[4] === 'hv5@example.com'));
  H.E.quaGio();
  const t = H.thuToi('hv5@example.com');
  assert.strictEqual(t.length, 1);
  assert.strictEqual(t[0].tieuDe, 'Lớp Kids ES 02 trên EWIT đã sẵn sàng');
  const kes = H.tep({ sdma: 'LOP_NHOM', sdnhom: 'KES-02' });
  assert(t[0].than.includes('https://drive.google.com/drive/folders/' + kes.id), 'có link thư mục lớp');
  assert(/sao/.test(t[0].than) && /30 phút/.test(t[0].than) && /Request access/.test(t[0].than) && /trả lời thư/.test(t[0].than));
  assert.strictEqual(H.thuToi('ef1@example.com').filter(x => /Lớp Kids/.test(x.tieuDe)).length, 1, 'người có ổ học lớp chỉ xem cũng nhận link');
  assert.strictEqual(H.thuToi('gv1@example.com').filter(x => /Lớp Kids/.test(x.tieuDe)).length, 0, 'Phụ trách không nhận thư lớp');
  assert(/thư lớp ✔/.test(H.kqTv('hv5@example.com', 'KES-02')), H.kqTv('hv5@example.com', 'KES-02'));
  // chạy lại: không gửi lại
  H.apDung(); H.E.quaGio(); H.E.quaGio();
  assert.strictEqual(H.thuToi('hv5@example.com').length, 1, 'không gửi lại');
  // Gửi lại thư chào: chỉ người chưa có dấu
  H.props().deleteProperty('SD_THU_LOP_U00007_KES-02');
  H.ctx.sdGuiLaiThuChao();
  assert.strictEqual(H.thuToi('hv5@example.com').length, 2, 'gửi lại cho người mất dấu');
  assert.strictEqual(H.thuToi('ef1@example.com').filter(x => /Lớp Kids/.test(x.tieuDe)).length, 1, 'người đã nhận: không gửi lại');
});

nhom('B1d. Thư lớp: "Gửi thư chào" = Không thì không gửi; Giả lập thêm [THỬ]; Xem trước chỉ báo', () => {
  const H = canh(T => { TV_KES(T); T.CAI_DAT.v.push(['Gửi thư chào', 'Không']); });
  H.apDung(); H.E.quaGio();
  assert.strictEqual(H.thuToi('hv5@example.com').length, 0);
  const G = canh(T => { TV_KES(T); T.CAI_DAT.v.push(['Chế độ', 'Giả lập']); });
  G.xemTruoc();
  assert(G.nk().some(r => r[2] === 'Thư lớp' && /Sẽ xếp hàng/.test(r[3])));
  assert.strictEqual(G.D.S.ghi, 0);
  G.apDung(); G.E.quaGio();
  assert.strictEqual(G.thuToi('hv5@example.com')[0].tieuDe, '[THỬ] Lớp Kids ES 02 trên EWIT đã sẵn sàng');
});

nhom('B1e. Người đã có ổ, nay chỉ còn lớp chỉ xem: gỡ khỏi ổ, không đổi tên, không xóa; HS_NOP lớp cũ còn nguyên', () => {
  const H = canh();
  H.apDung(); H.khongLoi();
  const e = 'hv2@example.com', o = H.oCN(e), ten = o.name;
  H.T.THANH_VIEN.v.forEach(r => { if (r[0] === e) r[6] = 'Gỡ'; });
  H.T.THANH_VIEN.v.push(tv(e, 'KES-02', 'Lớp'));
  H.apDung(); H.khongLoi();
  assert(H.D.S.o[o.id], 'ổ còn');
  assert.strictEqual(H.D.S.o[o.id].name, ten, 'không đổi tên');
  assert(!H.q(o.id)[e], 'gỡ khỏi thành viên ổ');
  assert(H.tep({ sdma: 'HS_NG', sdemail: e }), 'Hồ sơ còn (không xóa)');
});

nhom('B1f. Thêm nhóm nhỏ cho lớp chỉ xem → thành lớp đầy đủ: lượt hằng đêm (chế độ thay đổi) tạo ổ', () => {
  const H = canh(T => { TV_KES(T); T.CAI_DAT.v.push(['Chạy đầy đủ vào', 'Không']); });
  H.apDung(); H.khongLoi();
  assert.strictEqual(H.idO('hv5@example.com'), '');
  H.T.NHOM.v.push(['KES-02-01', 'Nhóm 01', 'Nhóm nhỏ', 'KES-02', '', 'EWIT', 'Đang']);
  H.xemTruoc();                                         // A3: đổi NHOM → admin Xem trước
  H.dem(); H.khongLoi();
  assert(H.idO('hv5@example.com'), 'tạo ổ khi lớp thành đầy đủ');
  assert(H.tep({ sdma: 'HS_NOP', sdemail: 'hv5@example.com', sdlop: 'KES-02' }), 'có nộp bài');
});

/* ================= B2. PHỤ TRÁCH LỚP ================= */

nhom('B2. Bảng cũ (pt = writer ở thư mục lớp) → hạ về Xem ở lớp, Sửa ở TAI-LIEU; VIDEO không cấp', () => {
  const H = canh();
  H.apDung();
  const lop = H.tep({ sdma: 'LOP_NHOM', sdnhom: 'ME02' }), tl = H.tep({ sdma: 'LOP_TL', sdnhom: 'ME02' });
  H.D.S.tep[lop.id].q[sd('ME02', 'pt')].role = 'writer';                  // như mã cũ đã cấp
  delete H.D.S.tep[tl.id].q[sd('ME02', 'pt')];
  H.apDung(); H.khongLoi();
  assert.deepStrictEqual(H.q(lop.id), { [sd('ME02')]: 'reader', [sd('ME02', 'pt')]: 'reader' });
  assert.deepStrictEqual(H.q(tl.id), { [sd('ME02', 'pt')]: 'writer' });
  assert.deepStrictEqual(H.q(H.tep({ sdma: 'LOP_VIDEO', sdnhom: 'ME02' }).id), {});
  assert(!H.D.coQuyen(sd('ME02', 'pt'), H.tep({ sdma: 'LOP_VIDEO', sdnhom: 'ME02' }).id) ||
    H.D.S.tep[H.tep({ sdma: 'LOP_VIDEO', sdnhom: 'ME02' }).id].q[sd('ME02', 'pt')] === undefined);
});

/* ================= A1. ĐỔI MÃ NHÓM ================= */

const doiMaME02 = T => {
  const r = T.NHOM.v.find(x => x[0] === 'ME02'); r[0] = 'IME-02'; r[4] = '30_MENTOR';
  T.NHOM.v.forEach(x => { if (x[3] === 'ME02') x[3] = 'IME-02'; });
  T.THANH_VIEN.v.forEach(x => { if (x[2] === 'ME02') x[2] = 'IME-02'; });
};

nhom('A1a. Đổi Mã nhóm: Xem trước báo "Sẽ nhận lại", không tạo thư mục lớp mới; Áp dụng nhận lại cùng ID (kể cả VIDEO/TAI-LIEU)', () => {
  const H = canh();
  H.apDung();
  const lop = H.tep({ sdma: 'LOP_NHOM', sdnhom: 'ME02' }), video = H.tep({ sdma: 'LOP_VIDEO', sdnhom: 'ME02' });
  H.D.Drive.Files.create({ name: 'B01.mp4', mimeType: 'video/mp4', parents: [video.id] });
  doiMaME02(H.T);
  const g = H.D.S.ghi;
  H.xemTruoc(); H.khongLoi();
  assert.strictEqual(H.D.S.ghi, g, 'Xem trước không ghi');
  assert(H.nk().some(r => r[2] === 'Thư mục' && /^Sẽ nhận lại thư mục cũ theo ID/.test(r[3])), JSON.stringify(H.nk().filter(r => r[2] === 'Thư mục')));
  assert(!H.nk().some(r => r[2] === 'Thư mục' && /Sẽ tạo "IME-02 · /.test(r[3])), 'không báo tạo thư mục lớp mới');
  H.apDung(); H.khongLoi();
  assert(H.nk().some(r => r[2] === 'Thư mục' && /^Nhận lại thư mục cũ theo ID/.test(r[3])));
  const moi = H.tep({ sdma: 'LOP_NHOM', sdnhom: 'IME-02' });
  assert.strictEqual(moi.id, lop.id, 'cùng thư mục');
  assert.strictEqual(moi.name, 'IME-02 · IELTS Mentor 02');
  assert.strictEqual(H.D.S.tep[moi.parents[0]].name, '30_MENTOR', 'chuyển sang nhánh mới');
  assert.strictEqual(H.tep({ sdma: 'LOP_VIDEO', sdnhom: 'IME-02' }).id, video.id, 'VIDEO giữ nguyên (đổi nhãn)');
  assert(!H.tep({ sdma: 'LOP_NHOM', sdnhom: 'ME02' }), 'không còn thư mục mang mã cũ');
  assert.deepStrictEqual(H.q(moi.id), { [sd('IME-02')]: 'reader', [sd('IME-02', 'pt')]: 'reader' });
  assert.strictEqual(Object.values(H.D.S.tep).filter(t => !t.trashed && (t.properties || {}).sdma === 'LOP_NHOM').length, 3, 'không thêm thư mục lớp');
});

nhom('A1b. ID thư mục trỏ tới thư mục của nhóm khác đang có ở NHOM → LỖI, không nhận, không tạo', () => {
  const H = canh();
  H.apDung();
  const pa = H.tep({ sdma: 'LOP_NHOM', sdnhom: 'PA03' });
  H.T.NHOM.v.push(['NEW1', 'Lớp mới', 'Lớp', '', 'ME', 'EWIT', 'Đang', '', pa.id]);
  H.T.NHOM.v.push(['NEW1-01', 'Nhóm 01', 'Nhóm nhỏ', 'NEW1', '', 'EWIT', 'Đang']);
  H.apDung();
  assert(H.loi().some(r => /trỏ tới thư mục của nhóm PA03/.test(r[3])), JSON.stringify(H.loi()));
  assert.strictEqual(H.tep({ sdma: 'LOP_NHOM', sdnhom: 'PA03' }).id, pa.id, 'PA03 giữ nguyên');
  assert(!H.tep({ sdma: 'LOP_NHOM', sdnhom: 'NEW1' }), 'không tạo cho NEW1');
});

/* ================= A2. SỬA Ở LỚP / LEVEL / NHÓM NHỎ ================= */

nhom('A2. hauToCua_: Thành viên Sửa ở Lớp/Level/Nhóm nhỏ = Xem; ở Dự án vẫn -sua; Phụ trách = pt', () => {
  const H = canh();
  H.ctx.P = { ss: H.bang, nk: [], loi: 0 };
  const C = H.ctx.taiDuLieu_(), h = (ma, vai, quyen) => H.ctx.hauToCua_({ ma, vai, quyen, loai: '' }, C);
  assert.strictEqual(h('ME02', 'Thành viên', 'Sửa'), '');
  assert.strictEqual(h('L3', 'Thành viên', 'Sửa'), '');
  assert.strictEqual(h('ME02-07', 'Thành viên', 'Sửa'), '');
  assert.strictEqual(h('KIND', 'Thành viên', 'Sửa'), 'sua');
  assert.strictEqual(h('ME02', 'Phụ trách', 'Sửa'), 'pt');
  assert.strictEqual(H.ctx.hauToCua_({ ma: 'X', vai: 'Thành viên', quyen: 'Sửa', loai: 'Level' }), '', 'không có C: dùng Loại nhóm của dòng');
});

/* ================= A3. CHỐT HẰNG ĐÊM ================= */

nhom('A3. Hằng đêm: cấu hình đổi chưa Xem trước → dừng, LỖI, thư admin; THANH_VIEN đổi thì vẫn chạy; Xem trước xong thì chạy', () => {
  const H = canh(T => T.CAI_DAT.v.push(['Chạy đầy đủ vào', 'Không']));
  H.dem();
  assert(H.loi().some(r => /Có thay đổi cấu hình chưa Xem trước/.test(r[3]) && /chưa có dấu/.test(r[4])), 'chưa từng Xem trước → dừng');
  assert.strictEqual(H.D.S.ghi, 0, 'không làm gì');
  H.apDung(); H.khongLoi();
  H.dem(); H.khongLoi();
  // chỉ THANH_VIEN đổi → vẫn chạy
  H.T.THANH_VIEN.v.push(tv('hv2@example.com', 'RAW', 'Tri thức'));
  H.dem(); H.khongLoi();
  assert(H.tep({ sdma: 'RAW_NG', sdma_u: 'U00005' }), 'hằng đêm đã áp dụng thay đổi THANH_VIEN');
  // đổi NHOM → dừng
  H.T.NHOM.v.find(r => r[0] === 'KIND')[1] = 'Kind English 2';
  const g = H.D.S.ghi, soThu = H.E.thu.length;
  H.dem();
  assert(H.loi().some(r => /Có thay đổi cấu hình chưa Xem trước — lượt hằng đêm đã dừng/.test(r[3]) && /NHOM/.test(r[4])), JSON.stringify(H.loi()));
  assert.strictEqual(H.D.S.ghi, g, 'không ghi Drive');
  const thu = H.E.thu.slice(soThu);
  assert.strictEqual(thu.length, 1); assert.strictEqual(thu[0].to, ADMIN);
  assert.strictEqual(thu[0].tieuDe, 'Có thay đổi cấu hình chưa Xem trước — lượt hằng đêm đã dừng');
  // đổi CAU_TRUC / VAI_TRO cũng dừng; cột script tự ghi (ID, Kết quả) thì không
  H.xemTruoc();
  H.T.NHOM.v.find(r => r[0] === 'KIND')[9] = 'ghi tay vào Kết quả';
  H.dem(); H.khongLoi();
  assert.strictEqual(H.tep({ sdma: 'DA_NHOM', sdnhom: 'KIND' }).name, 'KIND · Kind English 2', 'sau Xem trước: hằng đêm chạy');
  H.T.VAI_TRO.v.find(r => r[0] === 'GV')[2] = 'Không';
  H.dem();
  assert(H.loi().some(r => /VAI_TRO/.test(r[4])));
});

/* ================= A5. NHÓM KHÔNG CHẮC ================= */

nhom('A5a. Drive: nhóm "không chắc" (lỗi đọc) → không gỡ quyền của nhóm đó, ghi cảnh báo; lượt sau bình thường', () => {
  const H = canh();
  H.apDung();
  const lop = H.tep({ sdma: 'LOP_NHOM', sdnhom: 'ME02' }), goc = H.ctx.dongBoNhom_;
  H.ctx.dongBoNhom_ = (C, o) => { const r = goc(C, o); delete r.nhomCo[sd('ME02')]; r.khongChac = { [sd('ME02')]: true }; return r; };
  H.apDung(); H.khongLoi();
  assert.strictEqual(H.q(lop.id)[sd('ME02')], 'reader', 'giữ quyền');
  assert(H.nk().some(r => r[2] === 'Cảnh báo' && /không chắc/.test(r[3]) && r[4] === sd('ME02')));
  assert(H.nk().some(r => r[2] === 'Quyền' && /^Giữ \(nhóm không chắc/.test(r[3])));
  // nhóm thật sự không còn (không lỗi) → vẫn gỡ như cũ
  H.ctx.dongBoNhom_ = (C, o) => { const r = goc(C, o); delete r.nhomCo[sd('ME02')]; return r; };
  H.apDung();
  assert(!H.q(lop.id)[sd('ME02')], 'nhóm chắc chắn không có → gỡ');
  H.ctx.dongBoNhom_ = goc;
});

nhom('A5b. 25_Nhom: Groups.get lỗi tạm (không phải "không tồn tại") → khongChac, không vào nhomCo; lỗi "not found" thì không', () => {
  const H = canh();
  const nhomG = {}, loiTam = sd('L3');
  const AdminDirectory = {
    Groups: { get: e => { if (e === loiTam) throw new Error('Backend Error'); if (!nhomG[e]) throw new Error('Resource Not Found: groupKey'); return { email: e }; },
      insert: r => { nhomG[r.email] = {}; return r; } },
    Members: { list: e => ({ members: Object.keys(nhomG[e] || {}).map(x => ({ email: x, role: 'MEMBER' })) }), insert: (r, e) => { nhomG[e][r.email] = 1; }, remove: () => {} }
  };
  const ctx = taoMoiTruong(H.bang, { AdminDirectory, AdminGroupsSettings: { Groups: { patch: () => {} } } });
  let kq; ctx.chayPhien_('t', () => { ctx.P.thu = false; kq = ctx.dongBoNhom_(ctx.taiDuLieu_()); });
  assert.deepStrictEqual(Object.keys(kq.khongChac), [loiTam]);
  assert(!kq.nhomCo[loiTam]);
  assert.strictEqual(kq.da[loiTam], 2);
  assert(kq.nhomCo[sd('ME02')] && !kq.khongChac[sd('ME02')]);
});

/* ================= A6. CON TRỎ TRƯỚC KHI GHI BẢNG ================= */

nhom('A6. Hết giờ rồi bị cắt lúc ghi bảng: con trỏ + hẹn chạy tiếp đã lưu; chạy tiếp hoàn tất', () => {
  const H = canh(TV_KES), ctx = H.ctx;
  H.T.NGUOI.v.push(ng('hv3@example.com', 'HV Ba', 'K22-903', 'HV', '', 'Đang', 'U00008'));
  H.T.THANH_VIEN.v.push(tv('hv3@example.com', 'ME02', 'Lớp'), tv('hv3@example.com', 'ME02-08', 'Nhóm nhỏ'));
  let dem = 0;
  ctx.drHetGio_ = S => S.ct.giai === 'oCaNhan' && ++dem > 5;
  const ghiBang = ctx.drGhiBang_;
  ctx.drGhiBang_ = () => { throw new Error('Exceeded maximum execution time'); };       // giới hạn cứng 6 phút
  H.apDung();
  assert(H.props().getProperty('SD_CON_TRO_n'), 'con trỏ đã lưu trước khi ghi bảng');
  assert(H.E.hen.some(t => t.fn === 'sdDriveTiep'), 'đã hẹn chạy tiếp');
  ctx.drHetGio_ = H.E.goc_drHetGio_; ctx.drGhiBang_ = ghiBang;
  ctx.sdDriveTiep();
  assert.strictEqual(H.props().getProperty('SD_CON_TRO_n'), null, 'xong thì xóa con trỏ');
  assert(!H.E.hen.some(t => t.fn === 'sdDriveTiep'));
  assert(H.idO('hv3@example.com'), 'hv3 có ổ sau khi chạy tiếp');
});

nhom('A6b. ghiCot_ gom khối: ghi "Kết quả Drive" không dùng setValue từng ô; dòng không liền nhau tách khối', () => {
  const H = canh();
  const tab = H.T.NGUOI, gr = tab.getRange; let tungO = 0, khoi = 0;
  tab.getRange = (...a) => { const r = gr(...a); return Object.assign({}, r, { setValue: v => { tungO++; r.setValue(v); }, setValues: v => { khoi++; r.setValues(v); } }); };
  H.apDung(); H.khongLoi();
  assert.strictEqual(tungO, 0, 'không ghi từng ô');
  tab.getRange = gr;
  H.ctx.P = { ss: H.bang, nk: [], loi: 0 };
  const C = H.ctx.taiDuLieu_();
  H.ctx.ghiCot_(C.bang.NGUOI, 'Kết quả Drive', { 2: 'a', 3: 'b', 5: 'c' });
  assert.deepStrictEqual([2, 3, 4, 5].map(d => H.T.NGUOI.v[d - 1][9]), ['a', 'b', H.T.NGUOI.v[3][9], 'c']);
});

/* ================= A7. NHÓM NGOÀI BẢNG ================= */

nhom('A7. CAI_DAT "Nhóm ngoài bảng": không gỡ, không báo Ngoài bảng; Quét không coi là chia sẻ lạ; Nâng cấp bảng thêm dòng', () => {
  const H = canh(T => T.CAI_DAT.v.push(['Nhóm ngoài bảng', 'ung-vien@example.com, Video@example.com']));
  H.apDung();
  const l3 = H.tep({ sdma: 'TV_CAP', sdnhom: 'L3' }), kind = H.tep({ sdma: 'DA_NHOM', sdnhom: 'KIND' });
  H.D.S.tep[l3.id].q['ung-vien@example.com'] = { role: 'reader', type: 'group' };
  H.D.S.tep[kind.id].q['video@example.com'] = { role: 'fileOrganizer', type: 'group' };
  H.D.S.tep[kind.id].q['khach@example.com'] = { role: 'reader', type: 'user' };
  H.apDung(); H.khongLoi();
  assert.strictEqual(H.q(l3.id)['ung-vien@example.com'], 'reader');
  assert.strictEqual(H.q(kind.id)['video@example.com'], 'fileOrganizer');
  const ngoai = H.nk().filter(r => r[2] === 'Ngoài bảng').map(r => r[4]).join(' | ');
  assert(!/ung-vien|video@/.test(ngoai), ngoai);
  assert(/khach@example.com/.test(ngoai), 'người lạ khác vẫn báo');
  H.ctx.P = { ss: H.bang, nk: [], loi: 0 };
  const C = H.ctx.taiDuLieu_(), p = (e, type) => ({ type, emailAddress: e, role: 'reader', permissionDetails: [{ inherited: false }] });
  assert.strictEqual(H.ctx.qtQuyenLa_(C, p('ung-vien@example.com', 'group')), false);
  assert.strictEqual(H.ctx.qtQuyenLa_(C, p('video@example.com', 'group')), false);
  assert.strictEqual(H.ctx.qtQuyenLa_(C, p('khach@example.com', 'user')), true);
  // Nâng cấp bảng: thêm dòng mặc định trống, một lần
  const b = bangMau();
  taoMoiTruong(b).sdNangCapBang();
  const dong = b.tabs.CAI_DAT.v.filter(r => r[0] === 'Nhóm ngoài bảng');
  assert.strictEqual(dong.length, 1); assert.strictEqual(dong[0][1], ''); assert(/ung-vien@example\.com, video@example\.com/.test(dong[0][2]));
  taoMoiTruong(b).sdNangCapBang();
  assert.strictEqual(b.tabs.CAI_DAT.v.filter(r => r[0] === 'Nhóm ngoài bảng').length, 1, 'idempotent');
});

/* ================= A8. KIỂM TRA THÊM ================= */

nhom('A8c. THANH_VIEN mang Mã nhóm không còn ở NHOM → cảnh báo ở Áp dụng và Đưa vào', () => {
  const H = canh(T => T.THANH_VIEN.v.push(tv('hv1@example.com', 'ME99', 'Lớp')));
  H.apDung(); H.khongLoi();
  assert(H.nk().some(r => r[2] === 'Cảnh báo' && /"ME99" không còn ở NHOM/.test(r[3]) && /hv1@example.com/.test(r[4])));
  const nk0 = H.T.NHAT_KY.v.length;
  taoMoiTruong(H.bang).sdDuaVaoTong();
  assert(H.T.NHAT_KY.v.slice(nk0).some(r => r[2] === 'Cảnh báo' && /ME99/.test(r[3])));
});

nhom('A8d. NHOM có Mã nhóm trùng → mọi lượt dừng với LỖI nêu mã, không ghi Drive', () => {
  const H = canh(T => T.NHOM.v.push(['kind', 'Trùng', 'Dự án', '', '', 'EWIT', 'Đang']));
  H.apDung();
  assert(H.loi().some(r => /Mã nhóm trùng: KIND/.test(r[4])), JSON.stringify(H.loi()));
  assert.strictEqual(H.D.S.ghi, 0);
  const nk0 = H.T.NHAT_KY.v.length;
  taoMoiTruong(H.bang).sdDuaVaoTong();
  assert(H.T.NHAT_KY.v.slice(nk0).some(r => r[2] === 'LỖI' && /Mã nhóm trùng: KIND/.test(r[4])));
});

nhom('A8a/b + A2 + B1. Công thức Tình trạng có các cảnh báo mới, vẫn cân ngoặc và dùng ";"', () => {
  const f = taoMoiTruong(bangMau()).congThucTinhTrang_();
  ['⚠ Lớp/Level/Nhóm nhỏ chỉ có Xem — Sửa sẽ được coi là Xem; muốn tải tài liệu chọn Vai Phụ trách', '⚠ nhóm đã Kết thúc',
    'ℹ phụ trách nhóm nhỏ chưa ở lớp "&vThuoc&" (không bắt buộc)', 'ℹ lớp chỉ xem: không tạo ổ, gửi link lớp',
    'COUNTIFS(NHOM!C2:C;"Nhóm nhỏ";NHOM!D2:D;vMa)'].forEach(x => assert(f.includes(x), 'thiếu: ' + x));
  let d = 0, q = 0;
  for (const ch of f) { if (ch === '"') q ^= 1; if (q) continue; if (ch === '(') d++; if (ch === ')') d--; assert(d >= 0); }
  assert.strictEqual(d, 0); assert.strictEqual(q, 0);
  assert(!/,/.test(f.replace(/"[^"]*"/g, '""')));
  assert(/&vHq&vCB\)/.test(f), 'cảnh báo nối sau kết quả Thêm');
});

console.log(truot ? `\n${truot} TRƯỢT / ${dat + truot}` : `\nTẤT CẢ ĐẠT (${dat}/${dat})`);
process.exit(truot ? 1 : 0);
