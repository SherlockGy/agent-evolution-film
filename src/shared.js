// shared.js：全片共用的角色和道具画法。章节文件只调用，不改这里；要改先找主 Agent。
// 坐标都是世界像素；s 是尺寸单位，和 Clawd 的 u 同一量级（中景 20–28）。

const PALX = {
  cursor: '#FBF8F0',                                         // 人 = 浏览器里那只白色小手光标（不用纯白）
  stampInk: '#4B3F92',                                       // 印章墨色：深靛紫（高饱和红绿只留给对错）
  stampLight: '#F6E4B4',                                     // 暗背景上的印章墨色：米黄
};

// ---------- 人：光标小手 ----------
// cursorHand(x, y, s, o)：浏览器鼠标那种白色小手，代表"用户在操作"。不画人，人的表情用镜头动作代替。
//   (x, y) = 热点（指的手是食指尖，抓的手和张开的手是手掌中心）；s = 网格单位（默认 2.4，手约 38×48 像素，不要太大）
//   o.pose：'point' 指（点击）、'grab' 握拳（拖东西）、'open' 张开（松手、推）
//   o.press 0..1：按下的程度（手缩一点）；o.click：点击后的秒数，>= 0 时画一圈往外扩的波纹
//   o.hold(s, sw)：抓着的东西画在手下面，局部坐标原点在手掌中心
//   o.rot：整体旋转（默认 0，食指朝上）
function cursorHand(x, y, s = 2.4, o = {}) {
  const pose = o.pose || 'point', sw = clamp(s / 4.5, .4, 1), k = 1 - .12 * (o.press || 0);
  boilSeed('cursor' + (o.key ?? ''));
  if (o.click != null && o.click >= 0 && o.click < .45) {   // 点击波纹
    const q = easeOut(o.click / .45);
    inkLine(ellPts(x, y, (3 + 9 * q) * s, (3 + 9 * q) * s, 20).concat([[x + (3 + 9 * q) * s, y]]), sw * 1.2 * (1 - q), PAL.cream, 'inkfine', .5);
  }
  push(); translate(x, y); rotate(o.rot || 0); scale(k);
  // 网格坐标 → 像素；指的手以食指尖为原点，另外两种以手掌中心为原点
  const P = (pts, ox, oy) => pts.map(([a, b]) => [(a - ox) * s, (b - oy) * s]);
  if (o.hold) { const [hx, hy] = pose === 'point' ? [0, 13 * s] : [0, 0]; push(); translate(hx, hy); o.hold(s, sw); pop(); }
  if (pose === 'point') {
    const hand = P([[5, 1.2], [5.3, .3], [6.5, 0], [7.7, .3], [8, 1.2], [8, 7.8], [8.6, 7.2], [10, 7.1], [10.6, 7.8], [11.2, 7.5], [12.6, 7.6], [13.2, 8.3],
      [13.8, 8.2], [15, 8.5], [15.5, 9.6], [15.6, 15], [14.6, 18.6], [13.6, 20], [6.2, 20], [5, 17.6], [2.2, 14.6], [.6, 12.6], [.9, 11.2], [2.2, 10.9], [5, 12.8]], 6.5, 0);
    paint(hand, { wash: PALX.cursor, ink: PAL.ink, sw, curv: .25 });
    for (const [lx, y0] of [[10.6, 8], [13.2, 8.5]]) inkLine(P([[lx, y0], [lx, 11.2]], 6.5, 0), sw * .8, PAL.ink, 'inkfine', 0);
  } else if (pose === 'grab') {
    const fist = P([[2.6, 3.2], [3.4, 1.6], [5, 1.4], [5.8, 2.2], [6.4, 1.2], [8, 1.1], [8.6, 2], [9.2, 1.3], [10.8, 1.3], [11.4, 2.2], [12, 1.8], [13.4, 2],
      [14, 3.4], [14.2, 8], [13.2, 11.6], [11.8, 13], [5, 13], [3.6, 11], [1.4, 9], [.8, 7], [1.6, 6], [2.8, 6.6]], 7.5, 7);
    paint(fist, { wash: PALX.cursor, ink: PAL.ink, sw, curv: .25 });
    for (const lx of [5.8, 8.6, 11.4]) inkLine(P([[lx, 2.2], [lx, 4.6]], 7.5, 7), sw * .8, PAL.ink, 'inkfine', 0);
  } else {
    const palm = P([[3.4, 7], [3.2, 2.2], [3.8, 1.4], [4.8, 1.6], [5.2, 6.2], [5.4, .8], [6.2, 0], [7.2, .3], [7.5, 5.8], [7.8, .6], [8.7, .1], [9.6, .6],
      [9.8, 6], [10.2, 1.8], [11, 1.2], [11.9, 1.8], [12, 9], [13.6, 7.2], [14.8, 7.4], [15, 8.4], [12.6, 13], [11, 15.6], [5.6, 15.6], [3.8, 12.6]], 8.4, 8.6);
    paint(palm, { wash: PALX.cursor, ink: PAL.ink, sw, curv: .25 });
  }
  pop();
}

// ---------- 印章机 ----------
// stamp(txt, x, y, size, t, t0, o)：一台灰蓝小印章机在 t0 时刻"咚"地盖下，词留在 (x, y) 处的物件上。
//   t0 前 0.35 秒印章从画面上方落下；t0 盖下（挤压一下）；之后印章抬走，字留下。o.rot 字的倾斜，o.font 字体，o.out 印章抬走后
//   多久字淡出（默认不淡出，跟着物件一起离场）；o.weight 1..2 盖得多重（第 16 章三次一次比一次重：印章更大、震得更狠）
const STAMP_FONT = '"华文行楷", "STXingkai", "KaiTi", serif';
function stamp(txt, x, y, size, t, t0, o = {}) {
  const a = t - t0, wgt = o.weight || 1, rot = o.rot ?? -.06, font = o.font || STAMP_FONT, ink = o.ink || PALX.stampInk;   // o.ink：暗背景上用浅色墨
  if (a < -.35) return;
  // 字和边框：盖下那一刻出现，之后不动
  if (a >= .1) {
    const fade = o.out != null ? 1 - seg(a, o.out, o.out + .3) : 1;
    if (fade > 0) {
      const pk = 1 + .12 * Math.exp(-a * 14) * wgt, w = (o.w || txt.length * .95 + .9) * size, h = size * 1.45;
      boilSeed('stampframe' + txt);
      push(); translate(x, y); rotate(rot); scale(pk);
      inkLine([[-w / 2, -h / 2], [w / 2, -h / 2 + 2], [w / 2 - 2, h / 2], [-w / 2 + 2, h / 2 - 2], [-w / 2, -h / 2]], 1.6 * size / 60, ink, 'dry', 0);
      pop();
      letter(txt, x, y + size * .04, size * pk, ink, { rot, ink: false, alpha: .92 * fade, font: `${size * pk}px ${font}` });
    }
  }
  // 印章机：一个灰蓝的印章头加一根从画面上方伸下来的杆
  if (a < .45) {
    const drop = a < 0 ? easeIn(seg(a, -.35, 0)) : 1 - easeOut(seg(a, .04, .3));
    const sq = a >= 0 && a < .08 ? .25 * wgt : 0, hw = ((o.w || txt.length * .95 + .9) + .5) * size * .5, hy = lerp(y - 900, y + size * .8, drop);
    boilSeed('stamper' + txt);
    paint(rectPts(x - 18, hy - 900, 36, 900), { wash: '#66718B', ink: PAL.ink, sw: 1 });
    paint(rrPts(x - hw, hy - size * 1.7 * (1 - sq), hw * 2, size * 1.7 * (1 - sq), 10), { wash: '#A0ABBF', ink: PAL.ink, sw: 1.2 });
    paint(rectPts(x - hw - 6, hy - 14, hw * 2 + 12, 16), { wash: ink, ink: PAL.ink, sw: .9 });
  }
}
// 盖章那一下的镜头震动量（加到 camBegin 上）
const stampShake = (t, t0, wgt = 1) => t > t0 ? shakeXY(t, 6 * wgt * Math.exp(-(t - t0) * 12)) : [0, 0];

// ---------- 样张：手套手和印章 ----------
LOOPS.shared = t => {
  boilSeed('bg');
  paint(rectPts(-60, -60, W + 120, H + 120), { wash: '#363E66', ink: null });
  paint(rectPts(-60, 560, W + 120, 600), { wash: '#F0E6D2', ink: null });
  // 上半：深蓝后台上的手和 Clawd，看颜色分不分得开
  clawd(260, 470, 22, { ...feel('happy', t), view: 'q' });
  cursorHand(560, 380, 2.4, { pose: 'point', key: 1 });
  cursorHand(700, 380, 2.4, { pose: 'point', key: 2, press: 1, click: frac(t / 1.2) });
  cursorHand(860, 400, 2.4, { pose: 'grab', key: 3, hold: (s, sw) => paint(rrPts(-9 * s, -2 * s, 18 * s, 12 * s, 1.2 * s), { wash: '#F2C14E', ink: PAL.ink, sw }) });
  cursorHand(1040, 400, 2.4, { pose: 'open', key: 4 });
  cursorHand(1250, 420, 4, { pose: 'point', key: 5 });   // 特写时的大小
  // 下半：米白纸面上的三种字体候选
  const fonts = [['"华文行楷", "STXingkai"', 300], ['"方正舒体", "FZShuTi"', 900], ['"华文楷体", "STKaiti"', 1500]];
  fonts.forEach(([f, x], i) => stamp(['上下文', '提示词工程', '智识'][i], x, 820, 72, t, .6 + i * .5, { font: f }));
  stamp('Agent = 模型 + Harness', 960, 980, 54, t, 2.2, { font: fonts[0][0], w: 11.5 });
};
LOOPS.shared.len = 4;
