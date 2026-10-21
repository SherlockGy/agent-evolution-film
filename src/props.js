// props.js：全片共用的道具和机器（从第 4 章样片整理而来）。坐标是世界像素，u 是 Clawd 的尺寸单位。
// 用法约定：
//   - 机器的动作用 snap()：在拍点上干脆完成，一拍两帧
//   - 单子：slip('answer' | 'exec' | 'question', ...)，回答米白带左下气泡角，执行单暖黄带齿轮角，问题浅蓝带右下气泡角
//   - 纸摞：paperStack(...)，每层一种颜色（LC），可以按离顶部的远近压暗（台灯照不到的地方）
//   - Agent：agent(x, y, u, clawd 选项, 背包状态, 小桌板状态)，背包画在身后，小桌板在右前方

// ---------- 颜色 ----------
const MC = { mac: '#A0ABBF', macDk: '#66718B', macLt: '#C3CBD8', win: '#FFD98A', amber: '#F2B44C', lamp: '#FFC766', tube: '#414A6C', slot: '#2A2F48' };   // 机器
// 纸摞的层：对话记录、提示词、工具说明、Skill 说明、执行结果；两种脏纸：不相干的搜索结果（灰）、过期的旧结果（发黄）
const LC = { dialog: '#B7D3EC', prompt: '#EDB6CC', tools: '#B5DCAB', skill: '#CDB8E8', result: '#F1D788', grey: '#9A978F', old: '#C29E62' };
const OK_GREEN = '#3DAA5C', NG_RED = '#D9453B';   // 全片唯一的高饱和红绿，只给"对"和"错"
const SLIPC = { answer: PAL.cream, exec: '#F2C14E', question: '#B7D3EC' };

const snap = (t, t0, d = .12) => easeOut(seg(onTwos(t), t0, t0 + d));

// ---------- 小图标（单子、纸摞、路线牌上用，不写字） ----------
// icon(name, x, y, r, o)：在 (x, y) 画一个半径约 r 的图标。o.col 主色，o.sw 线宽
function icon(name, x, y, r, o = {}) {
  const sw = o.sw ?? clamp(r / 14, .35, 1.2), ink = o.ink || PAL.ink, col = o.col;
  const L = (pts, w = 1, c = .3) => inkLine(pts.map(([a, b]) => [x + a * r, y + b * r]), sw * w, ink, 'inkfine', c);
  const F = (pts, wash, c = 0) => paint(pts.map(([a, b]) => [x + a * r, y + b * r]), { wash, ink, sw: sw * .9, curv: c });
  const E = (cx, cy, rx, ry, wash) => paint(ellPts(x + cx * r, y + cy * r, rx * r, ry * r, 16), { wash, ink, sw: sw * .9 });
  switch (name) {
    case 'search': E(-.15, -.15, .55, .55, col || '#DDEAF3'); L([[.25, .25], [.85, .85]], 2.2, 0); break;
    case 'folder': F([[-.9, -.5], [-.3, -.5], [-.15, -.7], [.9, -.7], [.9, .7], [-.9, .7]], col || '#E8C46A'); break;
    case 'terminal': F([[-.9, -.7], [.9, -.7], [.9, .7], [-.9, .7]], col || '#3A3F5C'); inkLine([[x - .55 * r, y - .2 * r], [x - .25 * r, y], [x - .55 * r, y + .2 * r]], sw, PAL.cream, 'inkfine', 0); inkLine([[x, y + .25 * r], [x + .45 * r, y + .25 * r]], sw, PAL.cream, 'inkfine', 0); break;
    case 'gear': gear(x, y, r * .9, 8, 0, col || MC.macLt, sw); break;
    case 'check': L([[-.6, 0], [-.15, .5], [.7, -.55]], 2.6, 0); if (col !== null) inkLine([[x - .6 * r, y], [x - .15 * r, y + .5 * r], [x + .7 * r, y - .55 * r]], sw * 1.8, col || OK_GREEN, 'ink', 0); break;
    case 'cross': for (const s of [1, -1]) { L([[-.55, -.55 * s], [.55, .55 * s]], 2.6, 0); inkLine([[x - .55 * r, y - .55 * s * r], [x + .55 * r, y + .55 * s * r]], sw * 1.8, col || NG_RED, 'ink', 0); } break;
    case 'bubble': F([[-.9, -.6], [.9, -.6], [.9, .4], [-.2, .4], [-.6, .85], [-.5, .4], [-.9, .4]], col || PAL.cream); break;
    case 'hat': F([[-.55, .2], [.55, .2], [.55, .7], [-.55, .7]], PAL.cream); E(0, -.15, .75, .5, PAL.cream); break;
    case 'cassette': F([[-.9, -.6], [.9, -.6], [.9, .6], [-.9, .6]], col || '#7E6BB0'); E(-.4, 0, .18, .18, PAL.cream); E(.4, 0, .18, .18, PAL.cream); break;
    case 'wrench': L([[-.6, .6], [.3, -.3]], 2.6, 0); E(.45, -.45, .32, .32, col || MC.macLt); break;
    case 'pin': F([[0, .9], [-.55, -.1], [-.5, -.55], [0, -.85], [.5, -.55], [.55, -.1]], col || NG_RED, .3); E(0, -.35, .2, .2, PAL.cream); break;
    case 'car': F([[-.9, .3], [-.9, -.05], [-.5, -.1], [-.3, -.5], [.4, -.5], [.6, -.1], [.9, -.05], [.9, .3]], col || '#6FA3D8'); E(-.5, .35, .2, .2, PAL.ink); E(.5, .35, .2, .2, PAL.ink); break;
    case 'building': F([[-.6, .9], [-.6, -.8], [.6, -.8], [.6, .9]], col || '#C7A6D8'); for (const [a, b] of [[-.25, -.45], [.25, -.45], [-.25, 0], [.25, 0]]) paint(rectPts(x + (a - .1) * r, y + (b - .12) * r, .2 * r, .24 * r), { wash: MC.win, ink: null }); break;
    case 'calendar': F([[-.8, -.6], [.8, -.6], [.8, .8], [-.8, .8]], PAL.cream); F([[-.8, -.6], [.8, -.6], [.8, -.25], [-.8, -.25]], col || NG_RED); break;
    case 'star': paint(starPts(x, y, r, .45, 5), { wash: col || '#F5C542', ink, sw }); break;
    case 'cat': { const P = [[-.6, .7], [-.65, -.2], [-.75, -.75], [-.3, -.45], [.3, -.45], [.75, -.75], [.65, -.2], [.6, .7]]; F(P, col || PAL.cream, .3); E(-.25, .05, .07, .1, PAL.ink); E(.25, .05, .07, .1, PAL.ink); break; }
    case 'code': L([[-.3, -.6], [-.75, 0], [-.3, .6]], 2, 0); L([[.3, -.6], [.75, 0], [.3, .6]], 2, 0); break;
    case 'shield': F([[-.7, -.7], [.7, -.7], [.65, .1], [0, .85], [-.65, .1]], col || '#8FC3A0', .3); L([[-.3, 0], [-.05, .3], [.35, -.3]], 1.8, 0); break;
    case 'chair': L([[-.4, -.8], [-.4, .8]], 2, 0); L([[-.4, .1], [.5, .1], [.5, .8]], 2, 0); L([[-.4, .8], [-.4, .1]], 2, 0); break;
    case 'table': L([[-.8, -.1], [.8, -.1]], 2.4, 0); L([[-.6, -.1], [-.6, .8]], 2, 0); L([[.6, -.1], [.6, .8]], 2, 0); break;
    case 'spoon': E(-.35, -.35, .35, .28, col || MC.macLt); L([[-.1, -.1], [.75, .75]], 2.2, 0); break;
    case 'timer': E(0, .1, .7, .7, PAL.cream); L([[0, .1], [0, -.35]], 1.6, 0); L([[0, .1], [.3, .25]], 1.6, 0); L([[-.2, -.75], [.2, -.75]], 2, 0); break;
    case 'flame': F([[0, -.9], [.5, -.1], [.45, .5], [0, .8], [-.45, .5], [-.5, -.1], [-.15, -.4]], col || '#F09A3E', .5); break;
    case 'eye': F([[-.9, 0], [-.4, -.45], [.4, -.45], [.9, 0], [.4, .45], [-.4, .45]], PAL.cream, .5); E(0, 0, .25, .25, PAL.ink); break;
    case 'think': E(0, -.15, .8, .55, PAL.cream); E(-.55, .65, .14, .14, PAL.cream); break;
    case 'mail': F([[-.9, -.6], [.9, -.6], [.9, .6], [-.9, .6]], col || PAL.cream); L([[-.9, -.6], [0, .1], [.9, -.6]], 1, 0); break;
    case 'doc': F([[-.6, -.8], [.35, -.8], [.6, -.55], [.6, .8], [-.6, .8]], col || PAL.cream); for (const b of [-.35, 0, .35]) L([[-.35, b], [.35, b]], .8, 0); break;
    case 'map': F([[-.9, -.6], [-.3, -.75], [.3, -.6], [.9, -.75], [.9, .6], [.3, .75], [-.3, .6], [-.9, .75]], col || '#CFE3B0'); L([[-.3, -.75], [-.3, .6]], .7, 0); L([[.3, -.6], [.3, .75]], .7, 0); break;
    case 'crash': F([[-.8, .2], [-.6, -.3], [-.1, -.5], [.4, -.4], [.8, 0], [.6, .45], [-.5, .5]], col || '#8D8A9C', .4); L([[-.1, .5], [.15, .1], [-.05, .05], [.2, -.3]], 1.6, 0); break;
    case 'dish': {
      E(0, .35, .95, .28, PAL.cream);
      const blobs = [[-.4, .12, '#E58F5B'], [.05, .05, '#8DBF6A'], [.42, .14, '#F2C14E'], [-.15, -.15, '#D96B5B'], [.22, -.18, '#8DBF6A']];
      for (const [bx, by, bc] of blobs) E(bx, by, .26, .2, bc);
      for (const sx of [-.3, 0, .3]) L([[sx, -.4], [sx + .08, -.6], [sx - .04, -.8]], .8, .6);   // 热气
      break;
    }
    case 'question': inkLine([[x - .35 * r, y - .35 * r], [x - .1 * r, y - .7 * r], [x + .35 * r, y - .55 * r], [x + .3 * r, y - .15 * r], [x, y + .1 * r], [x, y + .3 * r]], sw * 2.2, ink, 'ink', .5); E(0, .65, .12, .12, ink); break;
    case 'dots': for (const a of [-.5, 0, .5]) E(a, 0, .14, .14, ink); break;
    case 'lock': F([[-.6, -.1], [.6, -.1], [.6, .8], [-.6, .8]], col || MC.amber); L([[-.35, -.1], [-.35, -.5], [0, -.75], [.35, -.5], [.35, -.1]], 1.8, .5); break;
    default: E(0, 0, .6, .6, col || PAL.cream);
  }
}

// ---------- 机器零件 ----------
function mechArm(angles, lens, th, col, sw, hold) {
  push();
  for (let i = 0; i < angles.length; i++) {
    rotate(angles[i]);
    paint(rrPts(-th * .3, -th / 2, lens[i] + th * .6, th, th * .45), { wash: col, ink: PAL.ink, sw });
    paint(ellPts(0, 0, th * .42, th * .42, 12), { wash: mixCol(col, PAL.ink, .35), ink: PAL.ink, sw: sw * .7 });   // 关节螺栓
    translate(lens[i], 0);
  }
  if (hold) { push(); translate(th * .9, 0); hold(); pop(); }
  for (const s of [-1, 1]) inkLine([[0, s * th * .3], [th * .7, s * th * .55], [th * 1.1, s * th * .25]], sw * 1.4, PAL.ink, 'ink', .3);
  pop();
}
// 正向运动学：机械臂末端相对底座的位置
function armTip(angles, lens) { let a = 0, x = 0, y = 0; angles.forEach((q, i) => { a += q; x += Math.cos(a) * lens[i]; y += Math.sin(a) * lens[i]; }); return [x, y, a]; }
function gear(x, y, r, n, rot, col, sw) {
  const P = [];
  for (let i = 0; i < n; i++) {
    const a = rot + i / n * TAU, d = TAU / n;
    P.push([x + Math.cos(a - d * .32) * r * .8, y + Math.sin(a - d * .32) * r * .8], [x + Math.cos(a - d * .18) * r, y + Math.sin(a - d * .18) * r],
           [x + Math.cos(a + d * .18) * r, y + Math.sin(a + d * .18) * r], [x + Math.cos(a + d * .32) * r * .8, y + Math.sin(a + d * .32) * r * .8]);
  }
  paint(P, { wash: col, ink: PAL.ink, sw });
  paint(ellPts(x, y, r * .3, r * .3, 14), { wash: mixCol(col, PAL.ink, .4), ink: PAL.ink, sw: sw * .8 });
}

// ---------- 单子 ----------
// slip(kind, x, y, s, rot, icons)：s = 1 时 64×44 像素。icons：画在单子上的图标名数组（执行单写的是"去做什么"），不给就画两道线
function slip(kind, x, y, s = 1, rot = 0, icons = null) {
  const sw = .9 / Math.sqrt(s);
  push(); translate(x, y); rotate(rot); scale(s);
  if (kind === 'answer') paint([[-32, -22], [32, -22], [32, 22], [-12, 22], [-26, 34], [-22, 22], [-32, 22]], { wash: SLIPC.answer, ink: PAL.ink, sw });
  else if (kind === 'question') paint([[-32, -22], [32, -22], [32, 22], [22, 22], [26, 34], [12, 22], [-32, 22]], { wash: SLIPC.question, ink: PAL.ink, sw });
  else {
    paint([[-32, -22], [20, -22], [32, -10], [32, 22], [-32, 22]], { wash: SLIPC.exec, ink: PAL.ink, sw });
    gear(26, -16, 10, 7, 0, MC.macLt, sw * .8);
  }
  if (icons && icons.length) icons.forEach((n, i) => icon(n, (i - (icons.length - 1) / 2) * 26 - (kind === 'exec' ? 3 : 0), 1, 11, { sw: .8 }));
  else for (const [y0, w] of [[-8, 38], [6, 28]]) inkLine([[-20, y0], [-20 + w, y0]], .7, mixCol(PAL.ink, PAL.cream, .3), 'inkfine', 0);
  pop();
}

// ---------- 纸摞 ----------
// paperStack(x, by, w, s, key, layers, o)：从 by 往上摞，layers = [[颜色名, 厚度], ...]（从下往上）。返回 { top, ys }，ys[i] 是第 i 层的中线 y。
//   o.dim(i, n) → 0..1：第 i 层压暗多少（台灯照不到的地方），o.icons：{ 层号: 图标名 } 在层的侧面画小图标，o.wave：脏纸的边是皱的
function paperStack(x, by, w, s, key, layers, o = {}) {
  let y = by; const ys = [], n = layers.length;
  layers.forEach(([c, h], i) => {
    boilSeed(key + i);
    const hh = h * s * 1.25, off = (hash(i * 3.1 + key.length) - .5) * 6 * s, dark = o.dim ? clamp(o.dim(i, n)) : 0;
    const col = mixCol(LC[c] || c, '#262338', dark * .78);
    const dirty = c === 'grey' || c === 'old';
    const pts = dirty ? [[x + off, y], [x + off + w * .3, y - hh * .2 + hash(i) * 3 * s], [x + off + w * .7, y + hash(i + 5) * 3 * s], [x + off + w, y], [x + off + w, y - hh], [x + off + w * .6, y - hh - 2 * s * hash(i + 2)], [x + off + w * .25, y - hh + 2 * s], [x + off, y - hh]] : rectPts(x + off, y - hh, w, hh);
    paint(pts, { wash: col, ink: PAL.ink, sw: .45 * Math.sqrt(s) });
    if (c === 'old' && hh > 5) for (let k = 0; k < 3; k++) paint(ellPts(x + off + w * (.2 + .3 * k), y - hh / 2, 2 * s, 1.4 * s, 6), { wash: mixCol('#8A6A3A', '#262338', dark * .7), ink: null });   // 发黄旧纸上的斑点
    if (o.icons && o.icons[i] && hh > 6) icon(o.icons[i], x + off + w + 10 * s, y - hh / 2, 6 * s, { sw: .5 });
    ys.push(y - hh / 2); y -= hh;
  });
  return { top: y, ys };
}

// 台灯：底座在 (x, y)，灯头朝左下；返回灯泡位置
function deskLamp(x, y, s, sw) {
  const P = (a, b) => [x + a * s, y + b * s];
  paint(ellPts(...P(0, -4), 22 * s, 7 * s, 14), { wash: MC.mac, ink: PAL.ink, sw });
  inkLine([P(0, -6), P(6, -70), P(-4, -112)], sw * 2.6, MC.macLt, 'ink', .4);
  paint([P(-4, -126), P(-56, -108), P(-50, -88), P(4, -104)], { wash: MC.macLt, ink: PAL.ink, sw });
  return P(-46, -92);
}

// ---------- 收发室（也是背包本体） ----------
// house(cx, by, s, st, t)：局部原点在底边中点，s = 1 时宽 380、高 430。
//   st.armL / armR 0..1 机械臂收起程度；st.cab 0..1 文件柜收进去；st.win 0..1 窗口闪一下；st.jolt 左右抖动；st.arms 画收发室自己的两只臂；
//   st.dials 0..1 正面的步骤拨盘和导轨（"扶着它走"的机关，背包越轻越少）；st.armHold(which) 机械臂末端拿着的东西；st.armPose(which, 默认姿势) 自定义姿势；
//   st.extra(sw) 在正面板上加画东西
function house(cx, by, s, st, t) {
  const sw = 1.1 / Math.sqrt(s);
  push(); translate(cx + (st.jolt || 0), by); scale(s);
  if ((st.cab ?? 0) < 1) {
    boilSeed('cab');
    const k = st.cab || 0, x0 = -292 + 100 * k;
    paint(rectPts(x0, -205, 104, 205), { wash: MC.macDk, ink: PAL.ink, sw });
    for (const yy of [-190, -95]) { paint(rectPts(x0 + 10, yy, 84, 80), { wash: MC.mac, ink: PAL.ink, sw: sw * .7 }); paint(rectPts(x0 + 38, yy + 34, 28, 10), { wash: PAL.ink, ink: null }); }
  }
  boilSeed('house');
  paint(rectPts(-150, -515, 40, 90), { wash: MC.macDk, ink: PAL.ink, sw });
  paint(rectPts(-158, -528, 56, 16), { wash: MC.macDk, ink: PAL.ink, sw });
  paint(rrPts(-190, -430, 380, 430, 16), { wash: MC.mac, ink: PAL.ink, sw });
  paint(rectPts(-206, -446, 412, 32), { wash: MC.macDk, ink: PAL.ink, sw });
  for (let i = 0; i < 6; i++) paint(ellPts(-170 + (i % 3) * 170, -400 + Math.floor(i / 3) * 380, 5, 5, 8), { wash: MC.macDk, ink: null });
  boilSeed('win');
  paint(rrPts(-70, -380, 140, 92, 14), { wash: MC.win, ink: PAL.ink, sw });
  glow(0, -334, 120 + 90 * (st.win || 0), MC.lamp, .45 + .5 * (st.win || 0));
  inkLine([[0, -380], [0, -288]], sw * .8, PAL.ink, 'ink', 0);
  inkLine([[-70, -334], [70, -334]], sw * .8, PAL.ink, 'ink', 0);
  boilSeed('gear');
  const gb = bpOf(t), ga = (Math.floor(gb) + easeOut(clamp(frac(gb) * 5))) * TAU / 20;
  gear(-78, -160, 56, 10, ga, MC.macLt, sw);
  gear(-8, -98, 30, 7, -ga * 1.8, MC.macLt, sw * .9);
  // 步骤拨盘和导轨：一件事拆成好多死板小步的机关
  if ((st.dials ?? 0) > .02) {
    boilSeed('dials');
    for (let i = 0; i < 3; i++) {
      const dx = 70 + i * 0, dy = -250 + i * 62;
      paint(ellPts(dx + 40, dy, 22, 22, 14), { wash: MC.macLt, ink: PAL.ink, sw: sw * .8 });
      inkLine([[dx + 40, dy], [dx + 40 + Math.cos(i * 2 + Math.floor(gb) * 1.57) * 16, dy + Math.sin(i * 2 + Math.floor(gb) * 1.57) * 16]], sw * 1.2, PAL.ink, 'ink', 0);
    }
    inkLine([[-170, -60], [160, -60]], sw * 1.4, MC.macDk, 'ink', 0);
    inkLine([[-170, -40], [160, -40]], sw * 1.4, MC.macDk, 'ink', 0);
    for (let i = 0; i < 8; i++) inkLine([[-160 + i * 44, -64], [-160 + i * 44, -36]], sw * .8, MC.macDk, 'inkfine', 0);
  }
  boilSeed('slot');
  paint(rrPts(118, -78, 64, 34, 8), { wash: MC.slot, ink: PAL.ink, sw });
  const blink = pulse(t, 4);
  paint(ellPts(140, -396, 13, 13, 12), { wash: mixCol(MC.amber, PAL.cream, .3 * blink), ink: PAL.ink, sw: sw * .8 });
  glow(140, -396, 30 + 20 * blink, MC.amber, .4 + .4 * blink);
  if (st.extra) { boilSeed('house extra'); st.extra(sw); }   // 面板上额外的东西（键帽、小终端、计数器），收发室局部坐标
  if (st.arms) {
    const lens = [92, 78, 56], th = 22;
    const pose = (k, idle) => [lerp(-.55 + idle, 1.5, k), lerp(1.05 - idle * .6, -2.92, k), lerp(.85, 2.85, k)];
    boilSeed('armR');
    push(); translate(190, -300); mechArm(st.armPose ? st.armPose('R', pose(st.armR || 0, 0)) : pose(st.armR || 0, .12 * Math.sin(Math.floor(bpOf(t)) * 1.3)), lens, th, MC.macDk, sw, st.armHold && (() => st.armHold('R'))); pop();
    boilSeed('armL');
    push(); translate(-190, -330); scale(-1, 1); mechArm(st.armPose ? st.armPose('L', pose(st.armL || 0, 0)) : pose(st.armL || 0, .1 * Math.cos(Math.floor(bpOf(t)) * 1.7)), lens, th, MC.macDk, sw, st.armHold && (() => st.armHold('L'))); pop();
  }
  pop();
}

// ---------- Agent：Clawd + 背包 + 小桌板 ----------
// 背包状态 P：
//   lite 0..1（0 = 第 4 章又大又沉，1 = 第 14 章以后的新背包；大小、机械臂粗细和关节数、拨盘都跟着变）
//   ext 0..1 两只机械臂伸开；near / far 自定义两只臂的角度（覆盖 ext）；nearHold / farHold 臂末端拿着的东西（局部坐标）
//   nearLens / farLens 自定义各节臂长（伸缩臂：够远处的东西时临时伸长；不给就用默认长度）
//   sockets 插座排、slot 卡带槽、cassettes 已插卡带数、checker 校验小机器、presser 压纸机、bin 废纸篓（外接装备，越往后越多）
// 小桌板状态 T（不给就不画小桌板）：layers 纸摞层、s 纸摞缩放、dim 压暗函数、recipe 0..3（厚菜谱 → 薄册 → 卡片 → 点菜单，-1 不画）、lamp 是否画台灯、buckle 0..1 扣带子进度（默认 1）
function packGeom(u, lite) {
  const sz = lerp(1, .66, lite), s = .0166 * u * sz;
  return { s, bx: -2.9 * u - 3.17 * u * sz, by: -2.4 * u, sz };
}
function packArmSpec(u, P) {
  const lite = P.lite || 0, g = packGeom(u, lite), k = P.ext || 0;
  const n3 = lite < .5, f = lerp(1, .8, lite);
  const lens = n3 ? [2.6 * u * f, 2.2 * u * f, 1.5 * u * f] : [3.2 * u * f, 2.8 * u * f];
  const th = lerp(.7, .42, lite) * u;
  const near = P.near || (n3 ? [lerp(1.62, -.75, k), lerp(-2.95, .45, k), lerp(2.9, .55, k)] : [lerp(1.62, -.7, k), lerp(-3.0, .7, k)]);
  const far = P.far || (n3 ? [lerp(1.62, -2.3, k), lerp(-2.95, -.55, k), lerp(2.9, -.5, k)] : [lerp(1.62, -2.3, k), lerp(-3.0, -.6, k)]);
  return { lens, th, near, far, nearBase: [g.bx - 170 * g.s, g.by - 380 * g.s], farBase: [g.bx - 60 * g.s, g.by - 440 * g.s] };
}
function backpack(u, sw, P, t) {
  const g = packGeom(u, P.lite || 0), A = packArmSpec(u, P);
  push(); translate(...A.farBase); mechArm(A.far, P.farLens || A.lens, A.th, mixCol(MC.macDk, PAL.ink, .3), sw * .8, P.farHold && (() => P.farHold(u, sw))); pop();
  push(); translate(g.bx, g.by); house(0, 0, g.s, { cab: 1, arms: false, dials: 1 - (P.lite || 0) * 1.6 }, t); pop();
  // 外接装备挂在背包朝外的左侧
  const lx = g.bx - 190 * g.s, top = g.by - 430 * g.s;
  if (P.sockets) { boilSeed('sockets'); for (let i = 0; i < 3; i++) { const yy = g.by - (330 - i * 90) * g.s; paint(rrPts(lx - 1.1 * u, yy, 1.1 * u, 1.3 * u, .2 * u), { wash: MC.macLt, ink: PAL.ink, sw: sw * .7 }); for (const d of [-.25, .25]) paint(rectPts(lx - .62 * u + d * u, yy + .45 * u, .14 * u, .4 * u), { wash: PAL.ink, ink: null }); glow(lx - .55 * u, yy + .2 * u, .5 * u, MC.lamp, .4 * P.sockets); } }
  if (P.slot) { boilSeed('cslot'); paint(rrPts(g.bx - 120 * g.s, top - 1.0 * u, 2.6 * u, 1.1 * u, .2 * u), { wash: MC.macDk, ink: PAL.ink, sw: sw * .7 }); for (let i = 0; i < (P.cassettes || 0); i++) paint(rectPts(g.bx - 110 * g.s + i * .8 * u, top - 1.6 * u, .7 * u, .9 * u), { wash: ['#7E6BB0', '#5FA8A3', '#D98C5F', '#7FA650'][i % 4], ink: PAL.ink, sw: sw * .6 }); }
  if (P.checker) { boilSeed('checker'); paint(rrPts(g.bx + 40 * g.s, g.by - .2 * u, 1.6 * u, 1.3 * u, .25 * u), { wash: MC.macLt, ink: PAL.ink, sw: sw * .7 }); paint(ellPts(g.bx + 40 * g.s + .8 * u, g.by + .45 * u, .3 * u, .3 * u, 10), { wash: OK_GREEN, ink: PAL.ink, sw: sw * .5 }); }
  if (P.bin) { boilSeed('bin'); paint([[lx - 1.6 * u, g.by - 2.2 * u], [lx - .1 * u, g.by - 2.2 * u], [lx - .3 * u, g.by - .3 * u], [lx - 1.4 * u, g.by - .3 * u]], { wash: MC.macDk, ink: PAL.ink, sw: sw * .7 }); }
  if (P.presser) { boilSeed('presser'); paint(rrPts(g.bx - 60 * g.s, top - .9 * u, 2.2 * u, .9 * u, .2 * u), { wash: MC.macDk, ink: PAL.ink, sw: sw * .7 }); }
  push(); translate(...A.nearBase); mechArm(A.near, P.nearLens || A.lens, A.th, MC.macDk, sw * .8, P.nearHold && (() => P.nearHold(u, sw))); pop();
}
// 小桌板、纸摞、菜谱、台灯和腰带（Clawd 的局部坐标，朝右的 3/4 视角）
function trayGear(u, sw, T, t) {
  boilSeed('tray');
  paint(rectPts(5.2 * u, -4.8 * u, 3.8 * u, .32 * u), { wash: MC.macLt, ink: PAL.ink, sw: sw * .8 });
  inkLine([[5.1 * u, -3.3 * u], [5.9 * u, -4.5 * u]], sw * 1.6, MC.macDk, 'ink', 0);
  const ss = T.s ?? .7 * u / 24;
  const st = paperStack(5.5 * u, -4.8 * u, 2.9 * u, ss, 'traystack', T.layers || [['dialog', 9], ['prompt', 6], ['tools', 8], ['result', 6]], { dim: T.dim });
  if ((T.recipe ?? -1) >= 0) recipeBook(8.3 * u, -4.8 * u, u * .42, T.recipe);
  if (T.lamp !== false) { const bulb = deskLamp(9 * u - .37 * u, -4.8 * u, .55 * u / 24, sw * .8); glow(...bulb, 25 * u / 24, MC.lamp, .9); }
  // 校验小机器：装在小桌板最前端，单子从这里出去（第 6 章起）。T.checker：{ light: 'ok'|'ng'|null }
  if (T.checker) {
    boilSeed('tray checker');
    inkLine([[9 * u, -4.7 * u], [9.5 * u, -5.0 * u]], sw * 1.4, MC.macDk, 'ink', 0);
    paint(rrPts(9.4 * u, -6.0 * u, 2.0 * u, 1.6 * u, .3 * u), { wash: MC.macLt, ink: PAL.ink, sw: sw * .8 });
    paint(rrPts(9.6 * u, -5.8 * u, 1.1 * u, .9 * u, .15 * u), { wash: '#232638', ink: PAL.ink, sw: sw * .6 });
    const lt = T.checker.light;
    paint(ellPts(11.0 * u, -5.5 * u, .25 * u, .25 * u, 10), { wash: lt === 'ng' ? NG_RED : lt === 'ok' ? OK_GREEN : MC.macDk, ink: PAL.ink, sw: sw * .5 });
    if (lt) { glow(11.0 * u, -5.5 * u, .9 * u, lt === 'ng' ? '#FF6A5A' : '#7DE08F', .5); icon(lt === 'ng' ? 'cross' : 'check', 10.15 * u, -5.35 * u, .35 * u); }
  }
  const buckle = T.buckle ?? 1;
  if (buckle > 0) {
    boilSeed('belt');
    const bx = lerp(-5, 5.1, clamp(buckle * 1.6)) * u;
    paint(rectPts(-5.05 * u, -3.5 * u, bx + 5.05 * u, .75 * u), { wash: MC.macDk, ink: PAL.ink, sw: sw * .7 });
    const kb = backOut(seg(buckle, .6, 1));
    if (kb > .02) { push(); translate(1.6 * u, -3.12 * u); scale(kb); paint(rrPts(-.55 * u, -.6 * u, 1.1 * u, 1.2 * u, .2 * u), { wash: MC.amber, ink: PAL.ink, sw: sw * .8 }); pop(); }
  }
  return st;
}
// 菜谱的四个阶段：0 厚菜谱、1 薄册子、2 一张卡片、3 点菜单（只画一道菜）。(x, by) 是底边中点
function recipeBook(x, by, s, stage) {
  boilSeed('recipe' + stage);
  const th = [1.6, .7, .18, .12][stage] * s, w = [2.6, 2.4, 2.0, 1.6][stage] * s, h = [3.2, 3.0, 2.6, 2.2][stage] * s;
  if (stage <= 1) {
    paint(rectPts(x - w / 2, by - th, w, th), { wash: PAL.cream, ink: PAL.ink, sw: .5 });
    for (let i = 1; i < 4 && stage === 0; i++) inkLine([[x - w / 2, by - th * i / 4], [x + w / 2, by - th * i / 4]], .3, mixCol(PAL.ink, PAL.cream, .4), 'inkfine', 0);
    paint(rectPts(x - w / 2, by - th - .25 * s, w, .3 * s), { wash: '#C9663F', ink: PAL.ink, sw: .5 });   // 封面
  } else {
    paint(rectPts(x - w / 2, by - th, w, th + .05 * s), { wash: stage === 3 ? '#FFF1CF' : PAL.cream, ink: PAL.ink, sw: .45 });
  }
}
// agent(x, y, u, cl, P, T, t)：画一个背着背包的 Clawd。cl 是 clawd() 的选项（情绪、姿势），P 背包状态，T 小桌板状态（可省略）
function agent(x, y, u, cl, P, T, t = T_NOW()) {
  const c = { ...cl };
  if (P) c.behind = (uu, sw) => { backpack(uu, sw, P, t); if (cl.behind) cl.behind(uu, sw); };
  if (T) c.draw = (uu, sw) => { trayGear(uu, sw, T, t); if (cl.draw) cl.draw(uu, sw); };
  clawd(x, y, u, c);
}
const T_NOW = () => T;
// Clawd 局部坐标 → 世界坐标（近似：考虑挤压和朝向，不考虑旋转），用来把世界里的东西对到臂端、小桌板上
function clawdToWorld(x, y, u, cl, lx, ly) {
  const sq = cl.sq || 0, lk = clamp(cl.legK ?? 1), dy = ((cl.dy || 0) + (1 - lk) * 2) * u, fl = cl.flip ? -1 : 1;
  return [x + (cl.dx || 0) * u + fl * lx * (1 + sq * .6), y + dy + ly * (1 - sq)];
}

// 小 Clawd（子 Agent）：Clawd 缩小，背一个小背包，背包上可以印字
function miniAgent(x, y, u, cl, t, o = {}) {
  agent(x, y, u, { boilKey: o.key, ...cl }, { lite: .8, ext: o.ext || 0, near: o.near, nearHold: o.nearHold }, o.tray ? { layers: o.tray, lamp: false, s: (o.trayS || .7) * u / 24 } : null, t);
}

// ---------- 每章小桌板上的纸摞（高度按指南的尺子：第 4 章到胸口，第 6 章齐眉，第 7 章高过头顶，第 9 章以后胸口以下） ----------
const sumH = L => L.reduce((a, [, h]) => a + h, 0);
const TRAY = {};
TRAY.c4 = [['dialog', 6], ['prompt', 4], ['tools', 5], ['dialog', 4], ['result', 4], ['result', 4], ['result', 4]];
TRAY.c5 = TRAY.c4.concat([['dialog', 3], ['tools', 3], ['tools', 3], ['tools', 3]]);
TRAY.c6 = TRAY.c5.concat([['skill', 6], ['result', 4], ['result', 4], ['result', 3], ['dialog', 3], ['result', 3]]);
