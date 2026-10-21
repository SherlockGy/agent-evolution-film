// sets.js：全片共用的布景。每个布景是一个函数，画在当前镜头里（世界坐标），状态从参数传入，不在帧之间保留东西。

// ======================================================================
// 前台：人的工位（第 1、2、4、16 章）。第一人称：左屏聊天框，右屏编辑器，下面一块键盘。
// ======================================================================
const FD = {
  L: [200, 170, 680, 420], R: [1040, 170, 680, 420],          // 两块屏幕 [x, y, w, h]
  kb: [600, 780, 720, 190],                                   // 键盘
  wall: '#283049', wallLt: '#38436A', desk: '#3C4360', bezel: '#1C2033', chat: '#F2ECDD', editor: '#2A2E45',
};
// 键盘上一个键的位置：row 0..4（从上往下），col 0..14
const keyAt = (row, col) => [FD.kb[0] + 14 + col * 47, FD.kb[1] + 14 + row * 34];
const KEY = { ctrl: [4, 0, 1.5], c: [3, 4, 1], v: [3, 5, 1], enter: [2, 13, 1.6] };   // [行, 列, 宽度倍数]

// 一个键帽：press 0..1 按下去；label 键上的字；gone = 键帽被抠走，只剩一个坑；lit 0..1 高亮（键面变暖黄，标出正在按的组合键）
function keycap(x, y, w, h, label, press = 0, gone = false, key = '', lit = 0) {
  boilSeed('key' + key);
  if (gone) { paint(rrPts(x + 3, y + 3, w - 6, h - 6, 5), { wash: '#15182A', ink: PAL.ink, sw: .6 }); return; }
  const d = press * 6;
  paint(rrPts(x, y + 4, w, h - 4, 6), { wash: '#1E2236', ink: null });
  paint(rrPts(x + 1, y + d, w - 2, h - 5, 6), { wash: mixCol(mixCol(label ? '#E9E3D6' : '#C9C4BA', '#8E8778', press * .6), '#F2C14E', clamp(lit) * .85), ink: PAL.ink, sw: .7 });
  if (label) letter(label, x + w / 2, y + d + (h - 5) / 2, label.length > 1 ? h * .36 : h * .5, PAL.ink, { ink: false, font: `bold ${label.length > 1 ? h * .36 : h * .5}px "Segoe UI", Arial, sans-serif` });
}

// 一段代码：彩色短横线代替真字。seed 相同，形状就完全一样（第 1 章的笑点靠这个）
function codeLines(x, y, w, n, seed, k = 1, lh = 13, dark = false) {
  const cols = dark ? ['#7FC8C2', '#C9A6E8', '#F2C14E', '#9FB7E8'] : ['#3A9C98', '#7B5CA8', '#C98A2B', '#4E6FB8'];
  const shown = Math.floor(n * clamp(k) + 1e-6);
  for (let i = 0; i < shown; i++) {
    const ind = Math.floor(hash(seed * 7 + i) * 3) * 14, len = (.3 + .6 * hash(seed * 13 + i * 3)) * (w - ind);
    paint(rectPts(x + ind, y + i * lh, len * .35, lh * .45), { wash: cols[(seed + i) % 4], ink: null });
    paint(rectPts(x + ind + len * .38, y + i * lh, len * .62, lh * .45), { wash: dark ? '#C8CBD8' : '#8C8A9A', ink: null });
  }
}

// 聊天框里的一条消息。m = { who: 'user'|'ai', kind: 'text'|'code'|'paste'|'dots'|'done', seed, k, y, sel, n 行数, tint 气泡颜色 }
function chatMsg(m, x0, w, t) {
  boilSeed('msg' + m.seed + m.y);
  const user = m.who === 'user', bw = m.kind === 'code' || m.kind === 'blank' ? w * .74 : m.kind === 'paste' ? w * .7 : m.kind === 'dots' ? 90 : w * .5;
  const lines = m.n ?? (m.kind === 'code' ? 7 : m.kind === 'paste' ? 4 : 2);
  const bh = m.kind === 'dots' ? 40 : 26 + lines * 13;
  const bx = user ? x0 + w - bw - 18 : x0 + 18, by = m.y;
  const k = clamp(m.k ?? 1);
  if (k <= 0) return { x: bx, y: by, w: bw, h: bh };
  paint(rrPts(bx, by, bw, bh, 12), { wash: m.tint || (user ? LC.dialog : '#FFFDF7'), ink: PAL.ink, sw: .7 });
  if (m.sel) paint(rectPts(bx + 10, by + 9, (bw - 20) * clamp(m.sel), bh - 18), { wash: '#BFD9F5', ink: null });
  if (m.kind === 'dots') { for (let i = 0; i < 3; i++) { const b = Math.max(0, Math.sin((t * 2.4 - i * .25) * TAU)); paint(ellPts(bx + 25 + i * 20, by + 20 - 5 * b, 5, 5, 10), { wash: '#8C8A9A', ink: null }); } }
  else if (m.kind === 'code') codeLines(bx + 16, by + 14, bw - 32, lines, m.seed, k);
  else if (m.kind === 'blank') { }   // 空气泡：内容由场景自己画（第 7 章的餐厅评分表）
  else if (m.kind === 'done') { icon('check', bx + 26, by + bh / 2, 10); codeLines(bx + 44, by + 13, bw - 60, 1, m.seed, k); }
  else if (m.kind === 'paste') codeLines(bx + 14, by + 13, bw - 28, lines, m.seed, k, 13);
  else codeLines(bx + 14, by + 13, bw - 28, lines, m.seed, k);
  return { x: bx, y: by, w: bw, h: bh };
}

// 前台布景。st：
//   msgs 聊天框里的消息（见 chatMsg）；ed { n 行数, k 打出进度, run 0..1 运行按钮按下, err 0..1 报错, sel 选中报错 }
//   keys { c, v, ctrl, enter: 按下程度 }；lit { 同上的键名: 高亮程度 }；gone 键帽被抠走（第 4 章起；true = C、V 都没了，'c' = 只有 C 没了）；night 0..1（1 = 深夜，0 = 清晨）
function frontDesk(t, st = {}) {
  const night = st.night ?? 1;
  boilSeed('fd wall');
  paint(rectPts(-500, -400, W + 1000, H + 800), { wash: mixCol('#F1E3C8', FD.wall, night), ink: null });
  paint(ellPts(960, 300, 900, 380, 30, 0), { fill: mixCol('#FFE9C2', FD.wallLt, night), fillOp: 80, bleed: .3, tex: .5, ink: null });
  // 日光灯管
  boilSeed('fd tube');
  paint(rrPts(560, 26, 800, 26, 12), { wash: '#F6F1E4', ink: PAL.ink, sw: .8 });
  for (let i = 0; i < 5; i++) glow(620 + i * 170, 40, 150, '#DDE6FF', .35 * night);
  // 显示器的光照在墙上
  glow(540, 380, 560, '#E9E6FF', .3 * night); glow(1380, 380, 560, '#C9D3FF', .25 * night);
  // 桌面
  boilSeed('fd desk');
  paint(rectPts(-500, 690, W + 1000, 900), { wash: mixCol('#B98D62', FD.desk, night), ink: null });
  inkLine([[-200, 692], [W / 2, 690], [W + 200, 693]], 1, PAL.ink, 'ink', .5);
  // 两块屏幕
  for (const side of ['L', 'R']) {
    const [x, y, w, h] = FD[side], cx = x + w / 2;
    boilSeed('fd mon' + side);
    paint(rectPts(cx - 16, y + h + 14, 32, 90), { wash: FD.bezel, ink: PAL.ink, sw: .8 });
    paint(ellPts(cx, y + h + 106, 110, 14, 18), { wash: FD.bezel, ink: PAL.ink, sw: .8 });
    paint(rrPts(x - 18, y - 18, w + 36, h + 36, 14), { wash: FD.bezel, ink: PAL.ink, sw: 1 });
    paint(rectPts(x, y, w, h), { wash: side === 'L' ? FD.chat : FD.editor, ink: null });
  }
  // 左屏：聊天框
  const [lx, ly, lw, lh] = FD.L;
  boilSeed('fd chatbar');
  paint(rectPts(lx, ly, lw, 30), { wash: '#E2DACB', ink: null });
  paint(rrPts(lx + 20, ly + lh - 46, lw - 40, 32, 14), { wash: '#FFFDF7', ink: PAL.ink, sw: .6 });   // 输入框
  if (st.typing) codeLines(lx + 36, ly + lh - 36, (lw - 120) * clamp(st.typing), 1, 99, 1);
  paint(ellPts(lx + lw - 40, ly + lh - 30, 13, 13, 12), { wash: '#4E6FB8', ink: PAL.ink, sw: .6 });  // 发送按钮
  const boxes = (st.msgs || []).map(m => chatMsg(m, lx, lw, t));
  // 右屏：编辑器
  const [rx, ry, rw, rh] = FD.R, ed = st.ed || {};
  boilSeed('fd editor');
  paint(rectPts(rx, ry, rw, 30), { wash: '#1F2236', ink: null });
  paint([[rx + rw - 46, ry + 7], [rx + rw - 46, ry + 23], [rx + rw - 30, ry + 15]], { wash: mixCol(OK_GREEN, '#E8F5E0', .3 * (ed.run || 0)), ink: PAL.ink, sw: .6 });   // 运行按钮
  for (let i = 0; i < 14; i++) paint(rectPts(rx + 12, ry + 46 + i * 15, 16, 6), { wash: '#4A4E68', ink: null });   // 行号
  codeLines(rx + 44, ry + 44, rw - 90, ed.n ?? 9, ed.seed ?? 3, ed.k ?? 1, 15, true);
  paint(rectPts(rx, ry + rh - 96, rw, 96), { wash: '#1F2236', ink: null });          // 输出面板
  if ((ed.err || 0) > 0) {
    const e = ed.err;
    if (ed.sel) paint(rectPts(rx + 20, ry + rh - 80, (rw - 40) * clamp(ed.sel), 50), { wash: '#4B5E8A', ink: null });
    icon('cross', rx + 50, ry + rh - 54, 18 * backOut(clamp(e * 3)));
    for (let i = 0; i < 2; i++) paint(rectPts(rx + 84, ry + rh - 70 + i * 22, (rw - 160) * (.8 - i * .3) * clamp(e * 2), 9), { wash: '#E07A72', ink: null });
  }
  if ((ed.ok || 0) > 0) icon('check', rx + 50, ry + rh - 54, 18 * backOut(clamp(ed.ok * 3)));
  // 屏幕发光（盖在屏幕上很淡的一层，让屏幕"亮"）
  glow(lx + lw / 2, ly + lh / 2, 420, '#FFF6E0', .12 * night);
  // 键盘
  const [kx, ky, kw, kh] = FD.kb, keys = st.keys || {}, lit = st.lit || {};
  boilSeed('fd kb');
  paint(rrPts(kx, ky, kw, kh, 16), { wash: '#2E3348', ink: PAL.ink, sw: 1 });
  for (let r = 0; r < 5; r++) for (let c = 0; c < 15; c++) {
    let name = null;
    for (const [nm, [kr, kc, kwm]] of Object.entries(KEY)) if (kr === r && kc === c) name = nm;
    const inside = Object.entries(KEY).some(([nm, [kr, kc, kwm]]) => kr === r && c > kc && c < kc + kwm);
    if (inside) continue;
    const [x, y] = keyAt(r, c), wm = name ? KEY[name][2] : 1, label = { ctrl: 'Ctrl', c: 'C', v: 'V', enter: '⏎' }[name] || '';
    // gone：true = C、V 都被抠走；字符串（如 'c'、'cv'）= 只抠走写到的那几个
    const gone = (name === 'c' || name === 'v') && (st.gone === true || (typeof st.gone === 'string' && st.gone.includes(name)));
    keycap(x, y, 44 * wm + 3 * (wm - 1), 31, label, keys[name] || 0, gone, `${r}-${c}`, lit[name] || 0);
  }
  return { boxes };
}
// 屏幕坐标里一条消息的中心（给光标、飞出去的卡片对位置用）
const boxC = b => [b.x + b.w / 2, b.y + b.h / 2];

// 复制粘贴时冒出来的小键帽提示：label 'C' 或 'V'，age 秒
function keyPop(x, y, label, age, s = 1) {
  if (age < 0 || age > .55) return;
  const k = backOut(clamp(age / .12)), a = 1 - seg(age, .35, .55);
  push(); translate(x, y - 24 * easeOut(clamp(age / .55))); scale(s * k);
  keycap(-46, -16, 50, 34, 'Ctrl', 1, false, 'popctrl' + label);
  keycap(8, -16, 34, 34, label, 1, false, 'pop' + label);
  pop();
}

// 从一块屏幕飞到另一块屏幕的"复制的内容"：一张卡片，上面是代码线。dark = 报错（深底红线）
function flyCard(x, y, w, h, seed, dark, rot = 0) {
  boilSeed('fly' + seed);
  push(); translate(x, y); rotate(rot);
  paint(rrPts(-w / 2, -h / 2, w, h, 8), { wash: dark ? '#2A2E45' : '#FFFDF7', ink: PAL.ink, sw: .9 });
  if (dark) { icon('cross', -w / 2 + 22, 0, 10); paint(rectPts(-w / 2 + 40, -6, w - 60, 8), { wash: '#E07A72', ink: null }); }
  else codeLines(-w / 2 + 12, -h / 2 + 10, w - 24, Math.max(1, Math.floor((h - 16) / 13)), seed, 1);
  pop();
}

// ======================================================================
// 后台（第 2–4 章）：深蓝。左边收发室，中间 Clawd（3/4 朝右、坐在地上），右边矮书桌，右侧远处一扇门。
// 地上一条气动管道（单张单子走这里），头顶一条架空滑轨（吊钩整摞运纸摞）。
// ======================================================================
const BS = { G: 880, U: 24, CX0: 1150, MX: 600, DX: 1285, wall: '#363E66', wallLt: '#4D5A92', floor: '#252943' };
BS.ROOF = [BS.MX + 120, BS.G - 446];        // 收发室屋顶上放纸摞的位置（底边中点）
BS.DESKTOP = [BS.DX + 140, 806];            // 书桌上放纸摞的位置（底边中点）
BS.RAILY = 300;

function backstageBG(t) {
  boilSeed('bs wall');
  paint(rectPts(-400, -300, W + 1400, H + 600), { wash: BS.wall, ink: null });
  paint(ellPts(500, 380, 700, 420, 30, 0), { fill: BS.wallLt, fillOp: 90, bleed: .3, tex: .6, ink: null });
  paint(ellPts(1600, 300, 800, 380, 30, 0), { fill: PAL.violet, fillOp: 40, bleed: .3, tex: .6, ink: null });
  boilSeed('bs pipes');
  for (const [y, th] of [[150, 18], [196, 12]]) for (let x0 = -300; x0 < 2400; x0 += 900) {
    paint(rectPts(x0, y - th / 2, 900, th), { wash: mixCol(BS.wall, MC.mac, .28), ink: null });
    inkLine([[x0, y - th / 2], [x0 + 900, y - th / 2]], .5, mixCol(BS.wall, PAL.ink, .5), 'inkfine', 0);
  }
  for (let i = 0; i < 6; i++) paint(rectPts(-100 + i * 460, 132, 16, 76), { wash: mixCol(BS.wall, MC.mac, .2), ink: mixCol(BS.wall, PAL.ink, .5), sw: .5 });
  boilSeed('bs floor');
  paint(rectPts(-400, BS.G, W + 1400, 700), { wash: BS.floor, fill: mixCol(BS.floor, BS.wallLt, .5), fillOp: 60, bleed: .05, tex: .5, ink: null });
  for (let x0 = -400; x0 < 2600; x0 += 1000) inkLine([[x0, BS.G], [x0 + 1000, BS.G + 1]], .8, PAL.ink, 'ink', .5);
}
// 门：门缝透光；open 0..1 门板收窄露出外面的光
BS.DOOR = [1720, BS.G - 330, 180, 330];
function backDoor(t, open) {
  const [x, y, w, h] = BS.DOOR;
  boilSeed('bs door');
  paint(rectPts(x - 16, y - 16, w + 32, h + 16), { wash: MC.macDk, ink: PAL.ink, sw: 1 });
  if (open > 0) { paint(rectPts(x, y, w, h), { wash: mixCol('#FFE2A6', PAL.cream, open), ink: null }); glow(x + w / 2, y + h * .55, 200 + 500 * open, '#FFD994', .6 + .4 * open); }
  else glow(x + w / 2, BS.G - 4, 110, MC.lamp, .45);
  const pw = w * (1 - .86 * ease(open));
  paint(rectPts(x + w - pw, y, pw, h), { wash: mixCol('#2E3454', '#1E2238', open), ink: PAL.ink, sw: 1 });
  if (open < .6) paint(ellPts(x + w - pw + 24 * (1 - open), y + h * .55, 9, 9, 10), { wash: MC.amber, ink: PAL.ink, sw: .7 });
}
function pendantLamp(x, t, on = 1) {
  boilSeed('bs pendant');
  inkLine([[x, 0], [x, 300]], .8, mixCol(BS.wall, PAL.ink, .4), 'inkfine', 0);
  paint([[x - 18, 300], [x + 18, 300], [x + 58, 348], [x - 58, 348]], { wash: MC.macDk, ink: PAL.ink, sw: .9 });
  if (on > 0) glow(x, 354, 60, MC.lamp, .9 * on);
}
// 地上的气动管道：k = 1 完整，缩回时从书桌那头往回收
const BS_TUBE = through([[BS.MX + 195, BS.G - 44], [900, BS.G - 40], [1000, BS.G - 40], [1240, BS.G - 40], [1300, BS.G - 44], [1310, BS.G - 70], [1310, 812]], 8);
function floorTube(k) {
  if (k <= .01) return;
  const n = Math.max(2, Math.round(BS_TUBE.length * k));
  boilSeed('bs tube');
  paint(ribbon(BS_TUBE.slice(0, n), 28, 28), { wash: MC.tube, ink: PAL.ink, sw: .9 });
  inkLine(BS_TUBE.slice(0, n).map(([x, y]) => [x, y - 6]), .5, mixCol(MC.tube, PAL.cream, .45), 'inkfine', .5);
}
const tubeAt = k => { const f = clamp(k) * (BS_TUBE.length - 1), i = Math.min(BS_TUBE.length - 2, Math.floor(f)), a = BS_TUBE[i], b = BS_TUBE[i + 1], r = f - i; return [lerp(a[0], b[0], r), lerp(a[1], b[1], r)]; };
// 书桌：fold 0..1 折成小桌板（第 4 章）；返回台灯灯泡位置
function backDesk(t, fold = 0, lampOn = 1) {
  const f = ease(fold), U = BS.U, x0 = lerp(BS.DX, BS.CX0 + 5.2 * U, f), w = lerp(260, 3.8 * U, f), top = lerp(806, BS.G + 2 * U - 4.8 * U, f), s = lerp(1, .55, f);
  boilSeed('bs desk');
  const legH = (BS.G - top - 14) * (1 - f);
  if (legH > 2) for (const lx of [x0 + 40 * s, x0 + w - 30 * s]) paint(rectPts(lx, top + 12, 12 * s, legH), { wash: MC.macDk, ink: PAL.ink, sw: .8 });
  paint(rectPts(x0, top, w, 14 * s), { wash: MC.macLt, ink: PAL.ink, sw: .9 });
  if (f < .5) { boilSeed('bs chute'); paint([[1292, 800], [1330, 800], [1324, 812], [1298, 812]], { wash: MC.slot, ink: PAL.ink, sw: .8 }); }
  const bulb = deskLamp(x0 + w - 16 * s, top, s, .9);
  if (lampOn > 0) glow(...bulb, 46 * s, MC.lamp, .9 * lampOn);
  return { x0, w, top, s, bulb };
}
// 架空滑轨和吊钩：tx 小车位置，hy 吊钩底部（挂着的托板）的 y；retract 0..1 滑轨缩回收发室（第 4 章）
function railHook(t, tx, hy, retract = 0) {
  const x0 = BS.MX + 60, x1 = lerp(1520, x0, ease(retract)), y = BS.RAILY;
  if (x1 - x0 < 6) return;
  boilSeed('bs rail');
  paint(rectPts(x0, y - 9, x1 - x0, 18), { wash: MC.macDk, ink: PAL.ink, sw: .9 });
  for (let x = x0 + 60; x < x1 - 20; x += 260) inkLine([[x, 0], [x, y - 9]], 1.2, mixCol(BS.wall, MC.macDk, .6), 'ink', 0);
  if (retract > .02) return;
  boilSeed('bs trolley');
  paint(rrPts(tx - 30, y - 22, 60, 30, 6), { wash: MC.mac, ink: PAL.ink, sw: .9 });
  for (const d of [-16, 16]) paint(ellPts(tx + d, y - 22, 8, 8, 10), { wash: MC.macDk, ink: PAL.ink, sw: .7 });
  inkLine([[tx, y + 8], [tx, hy - 14]], 1.1, PAL.ink, 'inkfine', 0);
  inkLine([[tx - 8, hy - 18], [tx, hy - 10], [tx + 8, hy - 18]], 1.4, MC.macDk, 'ink', .3);
}
// 吊运用的托板（纸摞放在上面）
// 吊运用的提篮：底板 + 两根立杆 + 顶上一根横杆（吊钩挂在横杆中间）。top = 横杆的 y；纸摞先画，再画立杆和横杆
function stackCradle(cx, by, w, top) {
  boilSeed('bs plate');
  paint(rectPts(cx - w / 2 - 10, by, w + 20, 9), { wash: MC.macDk, ink: PAL.ink, sw: .7 });
  for (const s of [-1, 1]) paint(rectPts(cx + s * (w / 2 + 6) - 3, top, 6, by - top), { wash: MC.macDk, ink: PAL.ink, sw: .5 });
  paint(rectPts(cx - w / 2 - 10, top - 6, w + 20, 8), { wash: MC.macDk, ink: PAL.ink, sw: .7 });
}

// 前后台之间的快切：竖向速度线（屏幕空间），k 0..1
function whipLines(k, col = '#C9CEE6') {
  if (k <= 0 || k >= 1) return;
  boilSeed('whipv');
  for (let i = 0; i < 9; i++) { const x = 100 + i * 210 + 40 * hash(i); inkLine([[x, -50], [x + 8, H + 50]], 1.6, col, 'dry', .2); }
}

// ======================================================================
// 街（第 5、6、8 章）：白天，明亮。外部产品是一栋栋别人家的楼，每栋一个颜色，门口一个标准插口。
// 视差：远景按 f < 1 的比例跟镜头走（PX 计算偏移），近景 f > 1
// ======================================================================
const ST = { G: 880, sky: '#BFE0F2', skyLo: '#F3EEDF', walk: '#D8CDBB', road: '#A9A9B6' };
const PX = (x, f, cx) => x + (cx - 960) * (1 - f);       // 视差：f = 1 跟着世界走，f < 1 更远
// 楼：B = { x, w, h, col, kind: 'archive'|'map'|'browser'|'plain', lit 0..1 灯亮程度 }
const BLD = {
  archive: { x: 1320, w: 380, h: 420, col: '#A28BD0', kind: 'archive' },
  map: { x: 2000, w: 360, h: 360, col: '#86BC6B', kind: 'map' },
  browser: { x: 2640, w: 470, h: 440, col: '#6FA3D8', kind: 'browser' },
};
BLD.archive.sock = [BLD.archive.x + 300, ST.G - 70]; BLD.map.sock = [BLD.map.x + 70, ST.G - 70]; BLD.browser.sock = [BLD.browser.x + 60, ST.G - 70];
function streetSky() {
  boilSeed('st sky');
  paint(rectPts(-60, -60, W + 120, H + 120), { wash: ST.sky, ink: null });
  paint(ellPts(W / 2, H * .95, W * .9, H * .55, 30, 0), { fill: ST.skyLo, fillOp: 150, bleed: .3, tex: .5, ink: null });
  paint(ellPts(W * .25, H * .18, W * .22, H * .1, 24, 0), { fill: '#FFFFFF', fillOp: 90, bleed: .3, tex: .4, ink: null });
  paint(ellPts(W * .72, H * .12, W * .18, H * .08, 24, 0), { fill: '#FFFFFF', fillOp: 80, bleed: .3, tex: .4, ink: null });
}
function streetBG(t, cx) {
  // 远处的楼群（很淡，视差 0.35）
  boilSeed('st far');
  for (let i = 0; i < 14; i++) {
    const x = PX(-200 + i * 300, .35, cx), h = 200 + 160 * hash(i + 3), w = 180 + 80 * hash(i + 9);
    paint(rectPts(x, ST.G - 60 - h, w, h + 60), { wash: mixCol('#C9D7E6', '#AFC2D8', hash(i)), ink: null });
  }
  // 地面：人行道 + 马路
  boilSeed('st ground');
  paint(rectPts(-2000, ST.G, 8000, 90), { wash: ST.walk, ink: null });
  paint(rectPts(-2000, ST.G + 90, 8000, 600), { wash: ST.road, fill: '#9696A4', fillOp: 50, bleed: .05, tex: .4, ink: null });
  for (let x0 = -2000; x0 < 6000; x0 += 1000) { inkLine([[x0, ST.G], [x0 + 1000, ST.G + 1]], .9, PAL.ink, 'ink', .5); inkLine([[x0, ST.G + 90], [x0 + 1000, ST.G + 91]], .7, PAL.ink, 'inkfine', .5); }
  for (let i = 0; i < 40; i++) paint(rectPts(-2000 + i * 200, ST.G + 150, 90, 10), { wash: '#E6E1D3', ink: null });
}
// 后台那栋楼的外墙和门（第 5 章 Clawd 从这里走出来）
function backstageExit(x, open = 1) {
  boilSeed('st exit');
  paint(rectPts(x - 260, ST.G - 520, 420, 520), { wash: '#4A5378', ink: PAL.ink, sw: 1 });
  paint(rectPts(x - 90, ST.G - 330, 180, 330), { wash: '#FFE6B0', ink: PAL.ink, sw: 1 });
  glow(x, ST.G - 160, 220, '#FFE6B0', .5);
  paint(rectPts(x + 90 - 26, ST.G - 330, 26, 330), { wash: '#2E3454', ink: PAL.ink, sw: .8 });
}
// 一栋外部产品楼。lit 0..1：插头插进去后灯"啪"地全亮；page 0..1 浏览器楼里网页翻动 / 填表的进度
function building(B, t, lit = 0, page = 0) {
  const { x, w, h, col, kind } = B, y = ST.G - h;
  boilSeed('bld ' + kind);
  paint(rectPts(x, y, w, h), { wash: col, ink: PAL.ink, sw: 1.1 });
  const dk = mixCol(col, PAL.ink, .3);
  if (kind === 'browser') {
    // 整栋楼是一个浏览器窗口：标题栏、三个圆点、地址栏、网页
    paint(rectPts(x, y, w, 46), { wash: dk, ink: PAL.ink, sw: 1 });
    for (let i = 0; i < 3; i++) paint(ellPts(x + 24 + i * 22, y + 23, 7, 7, 10), { wash: ['#F08A7A', '#F2C14E', '#8DBF6A'][i], ink: PAL.ink, sw: .5 });
    paint(rrPts(x + 100, y + 12, w - 130, 22, 10), { wash: PAL.cream, ink: PAL.ink, sw: .6 });
    const px = x + 30, pw = w - 60, py = y + 66, ph2 = h - 150;
    paint(rectPts(px, py, pw, ph2), { wash: '#FBF7EE', ink: PAL.ink, sw: .8 });
    const scroll = page * 120;
    push();
    for (let i = 0; i < 8; i++) { const yy = py + 18 + i * 34 - scroll % 34 - Math.floor(scroll / 34) * 0; if (yy > py + 6 && yy < py + ph2 - 20) codeLines(px + 20, yy, pw - 40, 1, 7 + i + Math.floor(scroll / 34), 1, 13); }
    pop();
    // 一张表单：三个格子依次填上
    const fy = py + ph2 - 80;
    for (let i = 0; i < 3; i++) { paint(rectPts(px + 30 + i * (pw - 60) / 3, fy, (pw - 60) / 3 - 14, 34), { wash: PAL.cream, ink: PAL.ink, sw: .6 }); if (page > .55 + i * .12) paint(rectPts(px + 40 + i * (pw - 60) / 3, fy + 12, ((pw - 60) / 3 - 40), 9), { wash: '#4E6FB8', ink: null }); }
  } else {
    // 普通楼：屋檐、门、窗、招牌图标；窗里一个齿轮在转（各自的机器）
    paint(rectPts(x - 14, y - 22, w + 28, 26), { wash: dk, ink: PAL.ink, sw: 1 });
    paint(rectPts(x + w / 2 - 50, ST.G - 150, 100, 150), { wash: dk, ink: PAL.ink, sw: .9 });
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
      const wx = x + 34 + c * (w - 68) / 3, wy = y + 50 + r * 100;
      paint(rectPts(wx, wy, (w - 68) / 3 - 22, 66), { wash: mixCol('#5A5E78', MC.win, lit), ink: PAL.ink, sw: .7 });
      if (lit > .5) glow(wx + 40, wy + 33, 50, MC.lamp, .3 * lit);
    }
    gear(x + 34 + (w - 68) / 6 - 11, y + 83, 22, 8, (Math.floor(bpOf(t)) + easeOut(clamp(frac(bpOf(t)) * 5))) * TAU / 16, mixCol(col, PAL.cream, .5), .8);
    // 招牌
    paint(rrPts(x + w / 2 - 70, y - 80, 140, 60, 10), { wash: PAL.cream, ink: PAL.ink, sw: .9 });
    if (kind === 'archive') { icon('folder', x + w / 2 - 28, y - 50, 20); icon('building', x + w / 2 + 28, y - 50, 20, { col: col }); }
    else if (kind === 'map') { icon('map', x + w / 2 - 22, y - 50, 22); icon('pin', x + w / 2 + 30, y - 52, 18); }
    if (B.icons) B.icons.forEach((ic, i) => icon(ic, x + w / 2 + (i - (B.icons.length - 1) / 2) * 46, y - 50, 18));
  }
  // 门口的标准插口（和背包上的插座同一个样子）
  if (B.sock) { boilSeed('sock ' + kind); const [sx, sy] = B.sock; paint(rrPts(sx - 20, sy - 24, 40, 48, 8), { wash: MC.macLt, ink: PAL.ink, sw: .8 }); for (const d of [-7, 7]) paint(rectPts(sx + d - 3, sy - 6, 6, 14), { wash: PAL.ink, ink: null }); if (lit > 0) glow(sx, sy, 40, MC.lamp, .6 * lit); }
}
// 一根线缆：从 a 垂到 b（下垂量 sag），k 0..1 伸出去的进度；末端一个插头
function cable(a, b, sag, k, col = '#4A4F66') {
  if (k <= 0) return null;
  const P = []; for (let i = 0; i <= 16; i++) { const q = i / 16 * k; P.push([lerp(a[0], b[0], q), lerp(a[1], b[1], q) + sag * 4 * q * (1 - q) * (k < 1 ? k : 1)]); }
  boilSeed('cable' + a[0] + b[0]);
  inkLine(P, 2.6, col, 'ink', .5);
  const [ex, ey] = P[P.length - 1];
  paint(rrPts(ex - 12, ey - 14, 24, 28, 5), { wash: MC.macDk, ink: PAL.ink, sw: .7 });
  return P;
}
const along = (P, k) => { const f = clamp(k) * (P.length - 1), i = Math.min(P.length - 2, Math.floor(f)), r = f - i; return [lerp(P[i][0], P[i + 1][0], r), lerp(P[i][1], P[i + 1][1], r)]; };

// ======================================================================
// 人的书桌（俯视，第 5–6、14 章）：暖木色桌面，一本写满做事步骤的笔记本、几张模板、一个卡带壳。人 = 光标。
// st：shell 卡带壳在不在；open 0..1 卡带壳的盖子（0 = 扣上）；note 笔记本：{ x, y, s, rot }（null 不画）；checker 校验小机器：{ x, y, s }；
//     inside 0..1 卡带里装了多少（笔记本、小机器塞进去以后）；label 卡带标签；cur [x, y]、pose、click 光标
// ======================================================================
const HD = { cas: [1150, 620], wood: '#C79F76', woodDk: '#A8805A' };
function cassette(x, y, s, o = {}) {
  // 一张游戏卡带：外壳、标签区、底部接口；open 盖子掀开时露出空的内腔
  boilSeed('cassette' + (o.key || ''));
  push(); translate(x, y); rotate(o.rot || 0); scale(s);
  paint(rrPts(-130, -90, 260, 180, 16), { wash: o.col || '#7E6BB0', ink: PAL.ink, sw: 1.2 / Math.sqrt(s) });
  for (let i = 0; i < 7; i++) paint(rectPts(-100 + i * 30, 72, 14, 18), { wash: '#E8C46A', ink: PAL.ink, sw: .5 });      // 金手指
  if ((o.open ?? 0) > .02) {
    paint(rrPts(-112, -74, 224, 132, 10), { wash: '#3F3466', ink: PAL.ink, sw: .8 });   // 空的内腔
    if (o.fill) o.fill();
    // 盖子：往上翻开（画成一块变窄的板）
    const k = o.open;
    paint(rrPts(-130, -90 - 150 * k, 260, 150 * k + 4, 14), { wash: mixCol(o.col || '#7E6BB0', PAL.cream, .2), ink: PAL.ink, sw: .9 });
  } else {
    paint(rrPts(-96, -66, 192, 96, 8), { wash: PAL.cream, ink: PAL.ink, sw: .8 });       // 标签
    if (o.label) o.label();
  }
  pop();
}
function notebook(x, y, s, rot = 0, fold = 0) {
  boilSeed('notebook');
  push(); translate(x, y); rotate(rot); scale(s * lerp(1, .4, fold), s * lerp(1, .5, fold));
  paint(rectPts(-150, -190, 300, 380), { wash: PAL.cream, ink: PAL.ink, sw: 1 });
  paint(rectPts(-150, -190, 22, 380), { wash: '#C9663F', ink: PAL.ink, sw: .8 });
  for (let i = 0; i < 7; i++) { for (let d = 0; d <= i % 3; d++) paint(ellPts(-100 + d * 9, -150 + i * 48, 3.5, 3.5, 8), { wash: PAL.ink, ink: null }); codeLines(-70, -156 + i * 48, 190, 1, 80 + i, 1, 14); }
  pop();
}
function checkerBox(x, y, s, light = 'ok') {
  boilSeed('checker box');
  push(); translate(x, y); scale(s);
  paint(rrPts(-60, -44, 120, 88, 12), { wash: MC.macLt, ink: PAL.ink, sw: 1 });
  paint(rrPts(-44, -30, 60, 44, 6), { wash: '#232638', ink: PAL.ink, sw: .7 });
  paint(ellPts(36, -10, 12, 12, 10), { wash: light === 'ng' ? NG_RED : OK_GREEN, ink: PAL.ink, sw: .6 });
  paint(ellPts(36, 22, 9, 9, 10), { wash: MC.macDk, ink: PAL.ink, sw: .6 });
  pop();
}
function humanDesk(t, st = {}, wipeIn = 0) {
  boilSeed('hd wood');
  paint(rectPts(-60, -60, W + 120, H + 120), { wash: HD.wood, ink: null });
  paint(ellPts(W / 2, H / 2, W * .7, H * .6, 30, 0), { fill: '#D9B48A', fillOp: 70, bleed: .3, tex: .6, ink: null });
  for (let i = 0; i < 9; i++) { const y = 60 + i * 120 + 20 * hash(i); inkLine([[-40, y], [W * .4, y + 10 * hash(i + 1)], [W + 40, y - 6]], .6, HD.woodDk, 'inkfine', .5); }
  // 一杯咖啡、几张模板（交代这是人的桌子）
  boilSeed('hd mug'); paint(ellPts(260, 220, 70, 70, 22), { wash: PAL.cream, ink: PAL.ink, sw: 1 }); paint(ellPts(260, 220, 52, 52, 20), { wash: '#6B4A35', ink: null });
  boilSeed('hd tpl'); for (let i = 0; i < 2; i++) { paint(rectPts(1460 + i * 40, 160 + i * 30, 240, 170), { wash: '#FFFBF0', ink: PAL.ink, sw: .8 }); codeLines(1490 + i * 40, 200 + i * 30, 180, 4, 90 + i, 1, 22); }
  if (st.note) notebook(st.note.x, st.note.y, st.note.s, st.note.rot || 0, st.note.fold || 0);
  if (st.shell) { const cp = st.casPos || HD.cas; cassette(cp[0], cp[1], st.casS || 1.2, { open: st.open ?? 1, rot: st.casRot ?? -.04, fill: st.fill, label: st.label, key: 'hd' }); }
  if (st.checker) checkerBox(st.checker.x, st.checker.y, st.checker.s);
  if (st.cur) cursorHand(st.cur[0], st.cur[1], 3, { pose: st.pose || 'point', click: st.click ?? -1, press: st.press || 0, key: 'u' });
}

// 夜里的街（第 8 章）：白天的街压暗，再把窗户和路灯的光加回来
function nightStreet(t, cx) {
  streetBG(t, cx);
  building(BLD.archive, t, 1); building(BLD.map, t, 1); building(BLD.browser, t, 1);
  boilSeed('night veil'); paint(rectPts(-2000, -1000, 8000, 3000), { wash: '#1B1F35', washOp: 190, ink: null });
  for (const B of [BLD.archive, BLD.map]) for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) glow(B.x + 34 + c * (B.w - 68) / 3 + 40, ST.G - B.h + 83 + r * 100, 46, MC.lamp, .55);
  glow(BLD.browser.x + BLD.browser.w / 2, ST.G - BLD.browser.h / 2, 260, '#CFE3FF', .35);
  // 路灯
  for (const x of [900, 1880, 2560, 3300]) { boilSeed('lamppost' + x); inkLine([[x, ST.G], [x, ST.G - 380], [x + 50, ST.G - 400]], 2.4, '#3A3F5C', 'ink', .3); paint(ellPts(x + 56, ST.G - 396, 18, 10, 12), { wash: '#FFE6A0', ink: PAL.ink, sw: .7 }); glow(x + 56, ST.G - 390, 160, MC.lamp, .55); }
}

// ======================================================================
// 工位（第 8 章结尾、第 9 章）：固定机位。中间 Clawd，左边（背包那一侧）文件柜（被推进来），右边一扇窗。
// st：dayK 0..1（0 = 夜，1 = 白天，窗外和室内的明暗跟着变）；cabinet 0..1 文件柜推进来的进度（0 = 不在）；
//     ticks 进度清单上打了几个勾（文件柜里的进度文件夹，画在柜门上）；star 0..1 方案文件夹上的星星闪一下
// ======================================================================
const WR = { G: 880, CX: 820, CAB: [300, 880], WIN: [1150, 210, 420, 320] };   // 文件柜在 Clawd 身后左边（背包那一侧），窗在右边
function workRoom(t, st = {}) {
  const day = st.dayK ?? 1;
  boilSeed('wr wall');
  paint(rectPts(-200, -200, W + 400, H + 400), { wash: mixCol('#2E3350', '#E6D9C1', day), ink: null });
  paint(ellPts(900, 380, 900, 420, 30, 0), { fill: mixCol('#3B4166', '#F2E7D2', day), fillOp: 90, bleed: .3, tex: .5, ink: null });
  // 窗：白天浅蓝、夜里深蓝带月亮
  const [wx, wy, ww, wh] = WR.WIN;
  boilSeed('wr window');
  paint(rectPts(wx - 14, wy - 14, ww + 28, wh + 28), { wash: '#8A6F55', ink: PAL.ink, sw: 1 });
  paint(rectPts(wx, wy, ww, wh), { wash: mixCol('#1E2440', '#BFE0F2', day), ink: null });
  if (day < .5) { paint(ellPts(wx + ww * .7, wy + wh * .3, 26, 26, 18), { wash: '#F6EBC8', ink: PAL.ink, sw: .6 }); glow(wx + ww * .7, wy + wh * .3, 90, '#FFF2C8', (1 - day * 2) * .7); }
  else { paint(ellPts(wx + ww * .3, wy + wh * .35, 34, 34, 18), { wash: '#FFE58A', ink: PAL.ink, sw: .6 }); }
  inkLine([[wx + ww / 2, wy], [wx + ww / 2, wy + wh]], 1.4, '#8A6F55', 'ink', 0); inkLine([[wx, wy + wh / 2], [wx + ww, wy + wh / 2]], 1.4, '#8A6F55', 'ink', 0);
  // 地面
  boilSeed('wr floor');
  paint(rectPts(-200, WR.G, W + 400, 400), { wash: mixCol('#23263D', '#C9B497', day), ink: null });
  inkLine([[-100, WR.G], [W / 2, WR.G - 1], [W + 100, WR.G + 1]], 1, PAL.ink, 'ink', .5);
  // 文件柜：从右边推进来
  if ((st.cabinet ?? 0) > 0) fileCabinet(lerp(-500, WR.CAB[0], ease(st.cabinet)), WR.CAB[1], 1, st);
}
// 文件柜：(x, y) 底边左端；两个抽屉，上面的抽屉是"方案"（星星），下面是"进度"（一列格子，打勾）
function fileCabinet(x, y, s, st = {}) {
  boilSeed('filecab');
  const w = 220 * s, h = 300 * s;
  paint(rectPts(x, y - h, w, h), { wash: '#8C97AE', ink: PAL.ink, sw: 1.2 });
  for (let i = 0; i < 2; i++) { const dy = y - h + 16 * s + i * 142 * s; paint(rectPts(x + 14 * s, dy, w - 28 * s, 128 * s), { wash: '#A6B0C4', ink: PAL.ink, sw: .9 }); paint(rrPts(x + w / 2 - 26 * s, dy + 14 * s, 52 * s, 14 * s, 5 * s), { wash: MC.macDk, ink: PAL.ink, sw: .6 }); }
  // 抽屉面上的标识：方案（星星）、进度（勾的清单）
  const sy = y - h + 16 * s + 80 * s, py = y - h + 158 * s + 80 * s;
  icon('star', x + w / 2, sy, 22 * s * (1 + .4 * (st.star || 0)), { col: '#F5C542' });
  if (st.star) glow(x + w / 2, sy, 80 * s, '#FFE58A', .6 * st.star);
  for (let i = 0; i < 6; i++) { const bx = x + 40 * s + i * 24 * s; paint(rectPts(bx, py - 10 * s, 18 * s, 18 * s), { wash: PAL.cream, ink: PAL.ink, sw: .6 }); if (i < (st.ticks || 0)) icon('check', bx + 9 * s, py - 1 * s, 9 * s); }
}

// ======================================================================
// 桌游地图（第 9 章结尾、第 10–11 章）：俯视，人的视角。米黄的纸，格子，路，棋子；右下角一个标题栏。
// st：pawns [{ x, y, kind: 'desk'|'front'|'station'|'gate', icon, k 0..1 放下的进度 }]；roads [[x0,y0,x1,y1,k]]；title 标题栏里的字（印章）
// ======================================================================
const MP = { paper: '#EFE2C4', grid: '#D9C9A6' };
function boardMap(t, st = {}) {
  boilSeed('map paper');
  paint(rectPts(-400, -300, W + 800, H + 600), { wash: '#B08A63', ink: null });     // 地图外面是人的桌面
  paint(rectPts(160, 90, W - 320, H - 180), { wash: MP.paper, fill: '#E6D3AE', fillOp: 70, bleed: .2, tex: .6, ink: PAL.ink, sw: 1.4 });
  for (let x = 220; x < W - 180; x += 80) inkLine([[x, 100], [x, H - 100]], .4, MP.grid, 'inkfine', 0);
  for (let y = 150; y < H - 100; y += 80) inkLine([[170, y], [W - 170, y]], .4, MP.grid, 'inkfine', 0);
  // 标题栏
  boilSeed('map title'); paint(rectPts(W - 620, H - 250, 440, 140), { wash: '#F6EBD2', ink: PAL.ink, sw: 1 }); inkLine([[W - 620, H - 205], [W - 180, H - 205]], .8, PAL.ink, 'inkfine', 0);
  // 路
  // 路：地图上的虚线路线（v002 样片反馈：原来的粗笔刷加黑线太丑）
  for (const [x0, y0, x1, y1, k = 1] of st.roads || []) if (k > 0) {
    boilSeed('road' + x0 + y0 + x1);
    const len = Math.hypot(x1 - x0, y1 - y0) * k, ux = (x1 - x0) / Math.hypot(x1 - x0, y1 - y0), uy = (y1 - y0) / Math.hypot(x1 - x0, y1 - y0);
    for (let d = 0; d < len; d += 26) { const e = Math.min(len, d + 14); inkLine([[x0 + ux * d, y0 + uy * d], [x0 + ux * e, y0 + uy * e]], 3.2, '#8A6F55', 'inkfine', 0); }
  }
  for (const p of st.pawns || []) pawn(p.x, p.y, p.kind, p.k ?? 1, p.icon);
}
// 棋子：底座圆盘 + 一个代表站点的形状（形状和侧视场地里的那一站一样，匹配剪辑靠这个）
function pawn(x, y, kind, k = 1, ic = null) {
  if (k <= 0) return;
  const s = backOut(k), dy = -60 * (1 - easeOut(k));
  boilSeed('pawn' + x + y);
  push(); translate(x, y + dy); scale(s);
  paint(ellPts(0, 0, 40, 40, 20), { wash: '#8C97AE', ink: PAL.ink, sw: 1 });
  if (kind === 'desk') { paint(rectPts(-24, -16, 48, 26), { wash: '#C98F5E', ink: PAL.ink, sw: .8 }); paint(rectPts(-14, -30, 18, 16), { wash: PAL.clay, ink: PAL.ink, sw: .6 }); }
  else if (kind === 'front') { paint(rectPts(-28, -20, 56, 30), { wash: MC.macLt, ink: PAL.ink, sw: .8 }); paint(rectPts(-6, -40, 12, 22), { wash: MC.macDk, ink: PAL.ink, sw: .6 }); }
  else if (kind === 'gate') { paint(rectPts(-26, -34, 10, 44), { wash: MC.macDk, ink: PAL.ink, sw: .7 }); paint(rectPts(16, -34, 10, 44), { wash: MC.macDk, ink: PAL.ink, sw: .7 }); paint(rectPts(-30, -42, 60, 12), { wash: MC.mac, ink: PAL.ink, sw: .7 }); }
  else { paint(rrPts(-24, -24, 48, 34, 8), { wash: '#F6EBD2', ink: PAL.ink, sw: .8 }); }
  if (ic) icon(ic, 0, -8, 13);
  pop();
}

// ======================================================================
// 场地（第 10–12 章，侧视，Agent 的视角）：明亮的横版过关风格。天空、远山、草地地面。
// ======================================================================
const VN = { G: 880, sky: '#CFE8F5', grass: '#9CCB7A', grassDk: '#7FB060', soil: '#D9C09A' };
function venueBG(t, cx, o = {}) {
  const dusk = o.dusk || 0;
  boilSeed('vn sky');
  paint(rectPts(-60, -60, W + 120, H + 120), { wash: mixCol(VN.sky, '#F2B48A', dusk), ink: null });
  paint(ellPts(W * .5, H * .9, W * .9, H * .5, 30, 0), { fill: mixCol('#F7F1DE', '#F6C79A', dusk), fillOp: 150, bleed: .3, tex: .5, ink: null });
  paint(ellPts(W * .2, H * .2, W * .2, H * .09, 24, 0), { fill: '#FFFFFF', fillOp: 90, bleed: .3, tex: .4, ink: null });
}
function venueGround(t, cx) {
  boilSeed('vn hills');
  for (let i = 0; i < 6; i++) { const x = PX(-400 + i * 700, .4, cx); paint(ellPts(x, VN.G + 40, 520, 260, 30, 0), { wash: mixCol('#B8D9A0', '#A7C7DA', .4), ink: null }); }
  boilSeed('vn ground');
  paint(rectPts(-3000, VN.G, 9000, 600), { wash: VN.grass, ink: null });
  paint(rectPts(-3000, VN.G + 26, 9000, 600), { wash: VN.soil, fill: '#CDB28A', fillOp: 60, bleed: .05, tex: .5, ink: null });
  for (let x0 = -3000; x0 < 6000; x0 += 1000) inkLine([[x0, VN.G], [x0 + 1000, VN.G + 1]], .9, PAL.ink, 'ink', .5);
}
// 前台（统一入口）：一个机器色的柜台，上面立一块路线牌；身后一面卡带墙；前面一个道岔分成两条路
const FDX = { desk: [700, VN.G], wall: [300, VN.G - 520, 560, 400], sign: [880, VN.G - 330] };
const CAS_COLS = ['#7E6BB0', '#5FA8A3', '#D98C5F', '#7FA650', '#C9A64B', '#6F8FD0', '#C7739A', '#8C97AE'];
function cassetteWall(t, taken = []) {
  const [x, y, w, h] = FDX.wall;
  boilSeed('caswall');
  paint(rectPts(x, y, w, h), { wash: '#B9A487', ink: PAL.ink, sw: 1 });
  for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) {
    const i = r * 6 + c; if (taken.includes(i)) { paint(rectPts(x + 20 + c * 90, y + 20 + r * 95, 70, 70), { wash: '#9C8A70', ink: null }); continue; }
    paint(rrPts(x + 20 + c * 90, y + 20 + r * 95, 70, 70, 6), { wash: CAS_COLS[i % 8], ink: PAL.ink, sw: .7 });
    paint(rectPts(x + 30 + c * 90, y + 30 + r * 95, 50, 26), { wash: PAL.cream, ink: null });
  }
}
const wallSlot = i => [FDX.wall[0] + 55 + (i % 6) * 90, FDX.wall[1] + 55 + Math.floor(i / 6) * 95];
// 入口 Skill 的说明牌：每种活一行——活的图标 → 按 1、2、3… 的顺序用哪几张卡带（卡带上写着序号）。
// sel 0 = 开发那行亮，1 = 测试那行亮
function routeSign(t, sel = -1) {
  const [x, y] = FDX.sign;
  boilSeed('routesign');
  inkLine([[x, VN.G - 120], [x, y + 110]], 3, MC.macDk, 'ink', 0);
  paint(rectPts(x - 140, y - 130, 280, 240), { wash: '#F6EBD2', ink: PAL.ink, sw: 1 });
  paint(rectPts(x - 140, y - 130, 280, 44), { wash: LC.skill, ink: PAL.ink, sw: 1 });
  letter('入口 Skill', x, y - 107, 22, PAL.ink, { ink: false, font: CAP_FONT(22) });
  [['code', [0, 1, 2, 3]], ['shield', [4, 5, 2]]].forEach(([ic, cs], r) => {
    const yy = y - 40 + r * 90;
    if (sel === r) paint(rectPts(x - 132, yy - 34, 264, 68), { wash: '#FFE7A8', ink: null });
    icon(ic, x - 108, yy, 16); inkLine([[x - 86, yy], [x - 66, yy]], 1.2, PAL.ink, 'inkfine', 0);
    cs.forEach((c, j) => { paint(rrPts(x - 58 + j * 46, yy - 18, 38, 36, 4), { wash: CAS_COLS[c], ink: PAL.ink, sw: .6 }); letter(String(j + 1), x - 39 + j * 46, yy + 1, 20, PAL.cream, { ink: false, font: CAP_FONT(20) }); });
  });
}
function frontCounter(t) {
  const [x, y] = FDX.desk;
  boilSeed('counter');
  paint(rectPts(x - 160, y - 150, 320, 150), { wash: MC.mac, ink: PAL.ink, sw: 1.1 });
  paint(rectPts(x - 175, y - 166, 350, 22), { wash: MC.macDk, ink: PAL.ink, sw: 1 });
  gear(x - 90, y - 70, 32, 9, Math.floor(bpOf(t)) * .4, MC.macLt, .9);
  paint(rrPts(x + 10, y - 120, 110, 70, 8), { wash: '#232638', ink: PAL.ink, sw: .8 });
}
// 道岔：从前台往右分成上下两条路；dir 0 = 上（开发），1 = 下（测试），k 扳动进度
// 等粗虚线：沿折线一段段画短线（等压细笔 mark、无弧度），用于路线、边界这类"标记线"
//（v004 反馈：粗笔刷画的线一头粗一头细，不好看）
function dashPath(pts, sw, col, dash = 14, gap = 12) {
  let carry = 0;   // 上一段折线剩下的空白，接着排，拐角处不断档
  for (let i = 0; i + 1 < pts.length; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], len = Math.hypot(x1 - x0, y1 - y0);
    if (len < 1e-6) continue;
    const ux = (x1 - x0) / len, uy = (y1 - y0) / len;
    let d = carry;
    for (; d < len; d += dash + gap) { const e = Math.min(len, d + dash); inkLine([[x0 + ux * d, y0 + uy * d], [x0 + ux * e, y0 + uy * e]], sw, col, 'mark', 0); }
    carry = d - len;
  }
}
// 前台脚下的分岔路：两条等粗虚线，选中的那条亮、未选中的淡
function railSwitch(t, dir, k = 1) {
  const x0 = 900, y0 = VN.G + 12;
  boilSeed('switch');
  for (const [dy, on] of [[-1, dir === 0], [1, dir === 1]]) dashPath([[x0, y0], [x0 + 300, y0 + dy * 70], [x0 + 900, y0 + dy * 70]], on ? 3.4 : 2.4, on ? '#A8753F' : '#B9AC93', 22, 16);
  const a = lerp(dir === 0 ? .25 : -.25, dir === 0 ? -.25 : .25, k);
  push(); translate(x0 + 40, y0); rotate(a); paint(rectPts(0, -6, 120, 12), { wash: MC.macDk, ink: PAL.ink, sw: .8 }); pop();
  paint(ellPts(x0 + 40, y0, 12, 12, 10), { wash: MC.amber, ink: PAL.ink, sw: .7 });
}

// 场地里的一站（侧视）：一个小亭子，屋顶下挂一个图标牌；形状和地图上的棋子对应。gate 0..1 站门打开的程度（确认站）
function station(x, ic, col = '#F6EBD2', o = {}) {
  const G = VN.G, w = 170, h = 210;
  boilSeed('station' + x);
  paint(rectPts(x - w / 2, G - h, w, h), { wash: col, ink: PAL.ink, sw: 1 });
  paint([[x - w / 2 - 16, G - h], [x, G - h - 60], [x + w / 2 + 16, G - h]], { wash: mixCol(col, PAL.ink, .25), ink: PAL.ink, sw: 1 });
  paint(ellPts(x, G - h + 6, 30, 30, 18), { wash: PAL.cream, ink: PAL.ink, sw: .8 });
  icon(ic, x, G - h + 6, 18);
  if (o.gate != null) {   // 站门：两扇往两边滑开
    const k = ease(o.gate), pw = (w - 30) / 2 * (1 - k);
    paint(rectPts(x - w / 2 + 15, G - h + 60, w - 30, h - 60), { wash: '#FFE9B8', ink: PAL.ink, sw: .7 });
    if (pw > 2) { paint(rectPts(x - w / 2 + 15, G - h + 60, pw, h - 60), { wash: MC.mac, ink: PAL.ink, sw: .8 }); paint(rectPts(x + w / 2 - 15 - pw, G - h + 60, pw, h - 60), { wash: MC.mac, ink: PAL.ink, sw: .8 }); }
  } else paint(rectPts(x - 40, G - 120, 80, 120), { wash: mixCol(col, PAL.ink, .15), ink: PAL.ink, sw: .8 });
}
// 需求卡和设计图：需求卡上一把椅子；设计图（蓝图纸）上画桌子 / 椅子 / 带扶手的椅子
function reqCard(x, y, s) { boilSeed('req' + x); push(); translate(x, y); scale(s); paint(rectPts(-60, -80, 120, 160), { wash: PAL.cream, ink: PAL.ink, sw: 1.2 }); icon('chair', 0, 10, 40); paint(rectPts(-40, -64, 80, 10), { wash: '#C9C1B0', ink: null }); pop(); }
function blueprint(x, y, s, what) {
  boilSeed('bp' + what + x); push(); translate(x, y); scale(s);
  paint(rectPts(-90, -80, 180, 160), { wash: '#3E6FB0', ink: PAL.ink, sw: 1.2 });
  for (let i = 1; i < 6; i++) inkLine([[-90 + i * 30, -80], [-90 + i * 30, 80]], .4, '#6A93CC', 'inkfine', 0);
  const L = (pts) => inkLine(pts, 2.4, PAL.cream, 'ink', 0);
  if (what === 'table') { L([[-60, -10], [60, -10]]); L([[-48, -10], [-48, 50]]); L([[48, -10], [48, 50]]); }
  else { L([[-24, -50], [-24, 50]]); L([[-24, 6], [30, 6], [30, 50]]); if (what === 'armchair') { L([[-36, -14], [10, -14], [10, 6]]); L([[-36, -14], [-36, 6]]); } }
  pop();
}

// 目标门（第 11 章结尾、第 12、16 章）：两根门柱 + 门楣，门楣上一排检查灯。rise 0..1 从地里升起来；lights：每盏灯 'off' | 'g' | 'r'；bright 0..1 全亮到最亮
function goalGate(x, t, rise = 1, lights = [], bright = 0, n = 5) {
  const G = VN.G, h = 420, w = 360, y = G + (1 - ease(rise)) * (h + 40);
  boilSeed('goalgate');
  // 升起时只画地面以上的部分（v005 反馈：原来地下那截穿过泥土露出来，地上还摆一圈椭圆当土块，看着像石头）
  const clipRect = (x0, y0, ww, hh, o) => { const y1 = Math.min(y0 + hh, G); if (y1 - y0 > 2) paint(rectPts(x0, y0, ww, y1 - y0), o); };
  if (rise < 1) { boilSeed('gate slot'); paint(rectPts(x - w / 2 - 20, G - 4, w + 40, 8), { wash: mixCol(VN.soil, PAL.ink, .55), ink: null }); }   // 地上一道细缝，门从这里出来
  for (const dx of [-w / 2, w / 2 - 50]) clipRect(x + dx, y - h, 50, h, { wash: MC.mac, ink: PAL.ink, sw: 1.2 });
  clipRect(x - w / 2 - 30, y - h - 70, w + 60, 80, { wash: MC.macDk, ink: PAL.ink, sw: 1.2 });
  for (let i = 0; i < n; i++) {
    const lx = x - w / 2 + 20 + i * (w + 20) / n + (w + 20) / n / 2 - 20, ly = y - h - 30, st = lights[i] || 'off';
    if (ly + 12 > G) continue;   // 灯还在地下
    const col = st === 'g' ? '#5BD27A' : st === 'r' ? '#F05A4A' : '#5A5E78';
    paint(ellPts(lx, ly, 20, 20, 16), { wash: col, ink: PAL.ink, sw: .8 });
    if (st !== 'off') glow(lx, ly, 50 + 400 * bright, st === 'g' ? '#8FF0A6' : '#FF8A7A', .7 + .3 * bright);
  }
  return { lintel: [x, y - h - 30] };
}
