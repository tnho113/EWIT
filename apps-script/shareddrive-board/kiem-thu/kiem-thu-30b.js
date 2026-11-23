/**
 * Kiểm thử Đợt 2b cho 30_Drive.gs: nhãn properties + nhận lại, con trỏ theo lượt, chế độ thay đổi, hằng đêm,
 * nhóm riêng, ổ cá nhân writer + 90_CA-NHAN cũ, HS_TL, người đi học, đổi email, thư chào.
 * Chạy: node kiem-thu/kiem-thu-30b.js (đứng ở apps-script/shareddrive-board). Dùng giả lập của kiem-thu-30.js.
 */
const assert = require('assert');
const { ng, tv, dungBang, dungMoiTruong, MIME_TM, MIME_LT } = require('./kiem-thu-30');

function canh() {
  const bang = dungBang(), T = bang.tabs, E = dungMoiTruong(bang);
  const { D, ctx } = E;
  let nk0 = 0;
  const H = {
    bang, T, D, ctx, E,
    apDung: () => { nk0 = T.NHAT_KY.v.length; ctx.sdDriveApDung(); },
    xemTruoc: () => { nk0 = T.NHAT_KY.v.length; ctx.sdDriveXemTruoc(); },
    tiep: () => { nk0 = T.NHAT_KY.v.length; ctx.sdDriveTiep(); },
    dem: () => { nk0 = T.NHAT_KY.v.length; ctx.sdDriveHangDem(); },
    nk: () => T.NHAT_KY.v.slice(nk0),
    khongLoi: () => { const l = H.nk().filter(r => r[2] === 'LỖI'); assert.strictEqual(l.length, 0, 'có LỖI: ' + JSON.stringify(l)); },
    soTep: () => Object.values(D.S.tep).filter(t => !t.trashed).length,
    soO: () => Object.keys(D.S.o).length,
    tao: () => H.nk().filter(r => (r[2] === 'Thư mục' || r[2] === 'Lối tắt') && /^(Sẽ )?tạo /.test(r[3])),
    dongNguoi: e => T.NGUOI.v.findIndex(r => r[0] === e),
    oCN: e => D.S.o[T.NGUOI.v[H.dongNguoi(e)][8]],
    tep: (ap, oId) => Object.values(D.S.tep).find(t => !t.trashed && (!oId || t.driveId === oId) && Object.entries(ap).every(([k, v]) => (t.properties || {})[k] === v)),
    q: f => { const x = D.S.o[f] ? D.S.o[f].tv : D.S.tep[f].q; const m = {}; Object.entries(x).forEach(([e, v]) => { m[e] = v.role; }); return m; },
    lt: oId => Object.values(D.S.tep).filter(t => t.driveId === oId && t.mimeType === MIME_LT && !t.trashed),
    kq: e => { const v = T.NGUOI.v, c = v[0].indexOf('Kết quả Drive'); return v[H.dongNguoi(e)][c]; },
    props: () => E.ctx.PropertiesService.getScriptProperties()
  };
  return H;
}
/** Đếm Drives.get theo ổ (để biết người nào được xử lý). */
function demGet(H) {
  const goc = H.D.Drive.Drives.get, dem = {};
  H.D.Drive.Drives.get = (id, o) => { dem[id] = (dem[id] || 0) + 1; return goc(id, o); };
  return { dem, tra: () => { H.D.Drive.Drives.get = goc; } };
}

let dat = 0, truot = 0;
function nhom(ten, fn) { try { fn(); console.log('✔ ' + ten + ' ĐẠT'); dat++; } catch (e) { console.log('✘ ' + ten + ' TRƯỢT: ' + e.message); truot++; } }

/* ================= 0. NHÃN properties + NHẬN LẠI ================= */

nhom('0a. Nhãn ghi bằng properties (công khai), không ghi appProperties', () => {
  const H = canh();
  H.apDung(); H.khongLoi();
  const ds = Object.values(H.D.S.tep);
  assert(ds.length > 50);
  assert(ds.every(t => Object.keys(t.appP).length === 0), 'không còn appProperties');
  assert(ds.filter(t => t.mimeType === MIME_TM).every(t => t.properties && (t.properties.sdma || t.properties.sdtg)), 'mọi thư mục có nhãn properties');
  assert(H.lt(H.oCN('hv1@example.com').id).every(t => t.properties.sdlt === '1' && t.properties.sdkhoa), 'lối tắt sdlt=1');
  const hs = H.tep({ sdma: 'HS_NG', sdma_u: 'U00004' });
  assert.deepStrictEqual(hs.properties, { sdma: 'HS_NG', sdma_u: 'U00004', sdemail: 'hv1@example.com' });
  assert.deepStrictEqual(H.tep({ sdma: 'HS_TL', sdma_u: 'U00004' }).properties, { sdma: 'HS_TL', sdma_u: 'U00004', sdemail: 'hv1@example.com' });
});

nhom('0b. Dự án A áp dụng → dự án B (không thấy appProperties của A, thấy properties): 0 thư mục mới, 0 lối tắt mới', () => {
  const H = canh();
  H.apDung(); H.khongLoi();
  const so = H.soTep(), o = H.soO();
  H.D.S.duAn = 'B';
  const g = H.D.S.ghi;
  H.xemTruoc(); H.khongLoi();
  assert.strictEqual(H.D.S.ghi, g, 'Xem trước không ghi');
  assert.deepStrictEqual(H.tao(), [], 'Xem trước báo 0 tạo');
  assert(!H.nk().some(r => /Sẽ tạo ổ/.test(r[3])));
  H.apDung(); H.khongLoi();
  assert.deepStrictEqual(H.tao(), []);
  assert.strictEqual(H.soTep(), so); assert.strictEqual(H.soO(), o);
});

nhom('0c. Drive chỉ có nhãn appProperties cũ (như bản thật) → dự án mới nhận lại theo tên, 0 tạo; 90_CA-NHAN cũ giữ, gỡ quyền trực tiếp', () => {
  const H = canh(), D = H.D;
  H.apDung(); H.khongLoi();
  // Dựng trạng thái cũ: 90_CA-NHAN có quyền Sửa trực tiếp của chủ ổ; chủ ổ là thành viên Xem; quyền cấp thẳng email
  const h = 'hv1@example.com', oh = H.oCN(h).id;
  const ca = D.taoTep({ name: '90_CA-NHAN', mimeType: MIME_TM, properties: { sdma: 'CN_CA_NHAN' } }, oh);
  D.S.tep[ca].q[h] = { role: 'writer', type: 'user' };
  D.S.o[oh].tv[h].role = 'reader';
  const hs = H.tep({ sdma: 'HS_NG', sdma_u: 'U00004' }).id;
  D.S.tep[hs].q = { [h]: { role: 'reader', type: 'user' } };
  // Chuyển mọi nhãn sang appProperties của dự án "CU", xóa properties
  Object.values(D.S.tep).forEach(t => { if (t.properties) { t.appP.CU = t.properties; delete t.properties; } });
  D.S.duAn = 'MOI';
  const so = H.soTep(), o = H.soO(), g = D.S.ghi;
  H.xemTruoc(); H.khongLoi();
  assert.strictEqual(D.S.ghi, g, 'Xem trước không ghi');
  assert.deepStrictEqual(H.tao(), [], 'Xem trước: 0 thư mục mới, 0 lối tắt mới');
  assert(H.nk().filter(r => /nhận lại/.test(r[3])).length > 50, 'báo nhận lại');
  H.apDung(); H.khongLoi();
  assert.deepStrictEqual(H.tao(), []);
  assert.strictEqual(H.soTep(), so, 'không tạo tệp nào'); assert.strictEqual(H.soO(), o);
  assert(Object.values(D.S.tep).filter(t => t.mimeType === MIME_TM).every(t => t.properties), 'mọi thư mục đã gắn lại nhãn');
  assert(H.lt(oh).every(t => t.properties && t.properties.sdlt === '1'), 'lối tắt gắn lại nhãn');
  assert.strictEqual(D.S.tep[ca].trashed, false, '90_CA-NHAN giữ nguyên');
  assert(!D.S.tep[ca].q[h], 'gỡ quyền Sửa trực tiếp cũ ở 90_CA-NHAN');
  assert.strictEqual(D.S.o[oh].tv[h].role, 'writer', 'chủ ổ → Người đóng góp');
  assert.deepStrictEqual(H.q(hs), { 'sd-u-u00004@example.com': 'reader' }, 'quyền email cũ → nhóm riêng');
  const g2 = D.S.ghi;
  H.apDung(); H.khongLoi();
  assert.strictEqual(D.S.ghi, g2, 'chạy lại: không đổi gì');
});

nhom('0d. Hai thư mục cùng tên chưa nhãn → LỖI, không nhận, không tạo', () => {
  const H = canh(), D = H.D;
  H.apDung();
  const qt = H.tep({ sdma: 'QT_BC' });
  D.taoTep({ name: '10_BAO-CAO', mimeType: MIME_TM }, qt.parents[0]);
  delete D.S.tep[qt.id].properties;
  const so = H.soTep();
  H.apDung();
  assert(H.nk().some(r => r[2] === 'LỖI' && /Nhiều thư mục cùng tên "10_BAO-CAO"/.test(r[3])));
  assert.strictEqual(H.soTep(), so);
});

/* ================= 1. CON TRỎ + THAY ĐỔI + HẰNG ĐÊM ================= */

nhom('1a. Con trỏ: hết giờ giữa giai đoạn ổ cá nhân → chạy tiếp không làm lại người đã xong', () => {
  const H = canh(), ctx = H.ctx;
  H.apDung(); H.khongLoi();
  const g = demGet(H);
  ctx.drHetGio_ = S => S.ct.giai === 'oCaNhan' && Object.keys(S.ct.da).length >= 3;
  H.apDung(); H.khongLoi();
  assert(H.nk().some(r => r[3] === 'Chưa xong, sẽ chạy tiếp' && /oCaNhan/.test(r[4])));
  assert(H.E.hen.some(t => t.fn === 'sdDriveTiep'));
  assert(H.props().getProperty('SD_CON_TRO_n'), 'lưu con trỏ');
  const lan1 = Object.assign({}, g.dem);
  ctx.drHetGio_ = H.E.goc_drHetGio_;
  H.tiep(); H.khongLoi();
  assert(!H.E.hen.some(t => t.fn === 'sdDriveTiep'), 'xong thì xóa hẹn');
  assert.strictEqual(H.props().getProperty('SD_CON_TRO_n'), null, 'xong thì xóa con trỏ');
  ['ef1@example.com', 'ef2@example.com', 'gv1@example.com', 'hv1@example.com', 'hv2@example.com', 'dl1@example.com'].forEach(e => {
    assert.strictEqual(g.dem[H.oCN(e).id], 1, 'ổ của ' + e + ' xử lý đúng một lần qua 2 lượt');
  });
  assert(Object.keys(lan1).filter(id => H.D.S.o[id] && !/MLWIT · (Quản|Dữ|Tri)|EWIT/.test(H.D.S.o[id].name)).length === 3, 'lượt 1 làm 3 người');
  g.tra();
});

nhom('1b. Con trỏ ở giai đoạn goc: lượt sau không đối soát lại thư mục đã xong', () => {
  const H = canh(), ctx = H.ctx;
  H.apDung();
  let dem = 0; const gl = H.D.Drive.Permissions.list; const daDoc = {};
  H.D.Drive.Permissions.list = (f, o) => { daDoc[f] = (daDoc[f] || 0) + 1; return gl(f, o); };
  ctx.drHetGio_ = S => S.ct.giai === 'goc' && S.ct.i >= 10;
  H.apDung();
  ctx.drHetGio_ = H.E.goc_drHetGio_;
  H.tiep(); H.khongLoi();
  const tm = H.tep({ sdma: 'QT_BANG' }).id;
  assert.strictEqual(daDoc[tm], 1, 'thư mục đầu chỉ đối soát một lần');
  H.D.Drive.Permissions.list = gl;
});

nhom('1c. Hằng đêm chế độ thay đổi: người không đổi bỏ qua; người đổi được xử lý', () => {
  const H = canh(), T = H.T;
  T.CAI_DAT.v.push(['Chạy đầy đủ vào', 'Không']);
  H.apDung(); H.khongLoi();
  const g = demGet(H);
  H.dem(); H.khongLoi();
  const caNhan = id => H.D.S.o[id] && /^MLWIT · (EF|GV|K22|Dữ Liệu)/.test(H.D.S.o[id].name);
  assert.deepStrictEqual(Object.keys(g.dem).filter(caNhan), [], 'không ai đổi: không mở ổ cá nhân nào');
  assert(H.nk().some(r => r[2] === 'Kết thúc' && /chỉ thay đổi, bỏ qua 6 người/.test(r[4])), JSON.stringify(H.nk().slice(-1)));
  // hv2 vào RAW
  T.THANH_VIEN.v.push(tv('hv2@example.com', 'RAW', 'Tri thức'));
  Object.keys(g.dem).forEach(k => delete g.dem[k]);
  H.dem(); H.khongLoi();
  assert.deepStrictEqual(Object.keys(g.dem).filter(caNhan), [H.oCN('hv2@example.com').id], 'chỉ xử lý hv2');
  const raw = H.tep({ sdma: 'RAW_NG', sdma_u: 'U00005' });
  assert(raw, 'tạo thư mục Raw của hv2');
  assert(H.lt(H.oCN('hv2@example.com').id).some(t => t.name === '05 · Tri thức Raw' && t.shortcutDetails.targetId === raw.id));
  assert(/\+1 lối tắt/.test(H.kq('hv2@example.com')));
  g.tra();
});

nhom('1d. Hằng đêm: ngày chạy đầy đủ thì xử lý mọi người; lượt trước chưa xong thì chạy tiếp', () => {
  const H = canh(), T = H.T, ctx = H.ctx;
  H.apDung();
  T.CAI_DAT.v.push(['Chạy đầy đủ vào', 'CN,T2,T3,T4,T5,T6,T7']);
  H.xemTruoc();                                          // A3: đổi CAI_DAT → admin Xem trước để hằng đêm được chạy
  const g = demGet(H);
  H.dem(); H.khongLoi();
  assert.strictEqual(g.dem[H.oCN('hv1@example.com').id], 1, 'đầy đủ: có xử lý hv1');
  ctx.drHetGio_ = S => S.ct.giai === 'nguoiGoc';
  H.apDung();
  ctx.drHetGio_ = H.E.goc_drHetGio_;
  T.CAI_DAT.v[T.CAI_DAT.v.length - 1][1] = 'Không';
  ctx.drLuuDauCauHinh_(ctx.taiDuLieu_());                 // A3: như admin đã Xem trước (không chạy để giữ con trỏ dở)
  H.dem(); H.khongLoi();
  assert(H.nk().some(r => r[1] === 'Drive · Hằng đêm'));
  assert.strictEqual(H.props().getProperty('SD_CON_TRO_n'), null, 'chạy tiếp lượt dở rồi xong');
  g.tra();
});

nhom('1e. sdBatHangDem / sdTatHangDem tạo / xóa trình kích hoạt hằng ngày', () => {
  const H = canh();
  H.ctx.sdBatHangDem(); H.ctx.sdBatHangDem();
  assert.deepStrictEqual(H.E.hen.filter(t => t.fn === 'sdDriveHangDem').length, 1, 'bật 2 lần vẫn 1 trình');
  H.ctx.sdTatHangDem();
  assert(!H.E.hen.some(t => t.fn === 'sdDriveHangDem'));
});

/* ================= 2–3. NHÓM RIÊNG, NGƯỜI HỌC, ĐỔI EMAIL ================= */

nhom('2a. Người chưa có Mã hệ thống: cấp tạm trực tiếp cho email, ghi chú; có mã sau → chuyển sang nhóm riêng, gỡ email', () => {
  const H = canh(), T = H.T;
  const r = T.NGUOI.v[H.dongNguoi('hv2@example.com')]; r[10] = '';
  H.apDung(); H.khongLoi();
  const hs = H.tep({ sdma: 'HS_NG', sdemail: 'hv2@example.com' });
  assert.deepStrictEqual(H.q(hs.id), { 'hv2@example.com': 'reader' });
  assert(!hs.properties.sdma_u);
  assert(/chưa có Mã hệ thống/.test(H.kq('hv2@example.com')));
  r[10] = 'U00005';
  const so = H.soTep();
  H.apDung(); H.khongLoi();
  assert.strictEqual(H.soTep(), so, 'không tạo thư mục mới');
  assert.strictEqual(H.tep({ sdma: 'HS_NG', sdemail: 'hv2@example.com' }).properties.sdma_u, 'U00005', 'bổ sung nhãn sdma_u');
  assert.deepStrictEqual(H.q(hs.id), { 'sd-u-u00005@example.com': 'reader' });
});

nhom('2b. Đổi email: thư mục theo người giữ nguyên (nhận theo sdma_u), sdemail cập nhật', () => {
  const H = canh(), T = H.T;
  H.apDung();
  const truoc = H.tep({ sdma: 'HS_NG', sdma_u: 'U00004' }).id, so = H.soTep();
  T.NGUOI.v[H.dongNguoi('hv1@example.com')][0] = 'hv1moi@example.com';
  T.THANH_VIEN.v.forEach(x => { if (x[0] === 'hv1@example.com') x[0] = 'hv1moi@example.com'; });
  H.apDung(); H.khongLoi();
  assert.strictEqual(H.soTep(), so, 'không tạo mới');
  const sau = H.tep({ sdma: 'HS_NG', sdma_u: 'U00004' });
  assert.strictEqual(sau.id, truoc);
  assert.strictEqual(sau.properties.sdemail, 'hv1moi@example.com');
  assert.strictEqual(H.tep({ sdma: 'HS_NOP', sdma_u: 'U00004', sdlop: 'ME02' }).properties.sdemail, 'hv1moi@example.com');
  assert.strictEqual(H.D.S.o[T.NGUOI.v[H.dongNguoi('hv1moi@example.com')][8]].tv['hv1moi@example.com'].role, 'writer');
});

nhom('3a. EF đi học (Thành viên lớp ME02): có HS_NG + HS_TL + HS_NOP, lối tắt lớp + Hồ sơ học tập', () => {
  const H = canh(), T = H.T;
  T.THANH_VIEN.v.push(tv('ef2@example.com', 'ME02', 'Lớp'));
  H.apDung(); H.khongLoi();
  const e = 'ef2@example.com', o = H.oCN(e).id;
  const hs = H.tep({ sdma: 'HS_NG', sdma_u: 'U00002' });
  assert(hs, 'EF đi học có HS_NG');
  assert(H.tep({ sdma: 'HS_TL', sdma_u: 'U00002' }));
  assert(H.tep({ sdma: 'HS_NOP', sdma_u: 'U00002', sdlop: 'ME02' }));
  const ten = H.lt(o).map(t => t.name);
  assert(ten.includes('20 · Hồ sơ học tập') && ten.includes('ME02 · IELTS Mentor 02'), ten.join(', '));
  assert(H.tep({ sdma: 'CN_CAP' }, o), 'vẫn giữ khuôn ổ EF');
  assert(!H.tep({ sdma: 'HS_NOP', sdma_u: 'U00001', sdlop: 'ME02' }), 'EF phụ trách lớp không có thư mục nộp bài');
  assert(!H.tep({ sdma: 'HS_NG', sdma_u: 'U00001' }), 'EF chỉ phụ trách: không có HS_NG');
});

/* ================= 5. THƯ CHÀO ================= */

nhom('5a. sdGuiLaiThuChao: gửi cho người có ổ chưa có dấu; lỗi gửi ghi rõ ràng', () => {
  const H = canh(), E = H.E;
  H.apDung();
  E.quaGio();
  assert.strictEqual(E.thu.length, 6);
  const idO = H.oCN('hv1@example.com').id;
  assert(H.props().getProperty('SD_THU_' + idO), 'có dấu SD_THU_<ID ổ>');
  H.props().deleteProperty('SD_THU_' + idO);
  H.ctx.sdGuiLaiThuChao();
  assert.deepStrictEqual(E.thu.slice(6).map(x => x.to), ['hv1@example.com'], 'chỉ gửi lại người chưa có dấu');
  H.props().deleteProperty('SD_THU_' + idO);
  H.ctx.GmailApp.sendEmail = () => { throw new Error('Bounced'); };
  const nk0 = H.T.NHAT_KY.v.length;
  H.ctx.sdGuiLaiThuChao();
  assert(H.T.NHAT_KY.v.slice(nk0).some(r => r[2] === 'LỖI' && /Gửi thư chào/.test(r[3]) && /Bounced/.test(r[3])));
  assert(/thư chào LỖI: Bounced/.test(H.kq('hv1@example.com')));
  assert(!H.props().getProperty('SD_THU_' + idO), 'lỗi: không đánh dấu');
});

nhom('5b. Xem trước không xếp hàng thư; Gửi thư chào = Không thì không xếp hàng', () => {
  const H = canh();
  H.xemTruoc();
  assert.strictEqual(H.props().getProperty('SD_HANG_THU_n'), null);
  H.T.CAI_DAT.v.find(r => r[0] === 'Gửi thư chào')[1] = 'Không';
  H.apDung();
  assert.strictEqual(H.props().getProperty('SD_HANG_THU_n'), null);
  H.E.quaGio();
  assert.strictEqual(H.E.thu.length, 0);
});

console.log(truot ? `\n${truot} TRƯỢT / ${dat + truot}` : `\nTẤT CẢ ĐẠT (${dat}/${dat})`);
process.exit(truot ? 1 : 0);
