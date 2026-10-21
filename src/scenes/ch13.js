// ch13.js：第 13 章 · 不是开关（正片 37.1 秒）。全片的认知转折点。
// v002：沿用 v001（时间是 v001 时间），用 SEG 表挑段：开关按三次（v001 五次）；取消"智识"印章（交给气泡）。
//   0–4.5    白场正中：左开关、右灯泡；光标按三次，三次画面完全一样（连墨线的抖动都逐帧相同）
//   4.5–14.5 同一构图换成 Clawd：请求图标（猫）；三次画猫：圆滚滚、细长、在睡觉，表情也不一样
//   14.5–24.2 三只猫排成一排；拉开：白场是办公桌上的一张大白纸；背包机械臂伸长，从桌上拿开关、地图、表格拉到背包左边，拨亮开关，检查灯亮绿灯
//   24.2–37.1 光标递来工牌、拉开椅子；Clawd 坐下，侧过脸朝镜头点头；镜头转向窗户：窗外起了雾
(() => {
  const PAPER = '#FBF8F0', U = 34, CY = 600;
  const SW = [640, 600], BULB = [1280, 520];
  const PRESS = [511.0, 512.5, 514.0, 515.5, 517.0];      // 五次按开关，每次 1.5 秒，画面逐帧相同
  const CATS = [520.0, 523.0, 526.0];

  function whiteField() { boilSeed('white'); paint(rectPts(-3000, -2000, 8000, 6000), { wash: PAPER, ink: null }); }
  function lightSwitch(x, y, on) {
    boilSeed('switch plate'); paint(rrPts(x - 60, y - 90, 120, 180, 14), { wash: '#EEE8DC', ink: PAL.ink, sw: 1.4 });
    push(); translate(x, y); rotate(on ? -.35 : .35); paint(rrPts(-18, -50, 36, 100, 10), { wash: '#D8D0C0', ink: PAL.ink, sw: 1.2 }); pop();
  }
  function bulb(x, y, on) {
    boilSeed('bulb');
    if (on) glow(x, y, 260, '#FFE6A0', .9);
    paint(ellPts(x, y, 70, 80, 24), { wash: on ? '#FFE9A8' : '#EDEAE2', ink: PAL.ink, sw: 1.4 });
    paint(rectPts(x - 34, y + 70, 68, 50), { wash: MC.macLt, ink: PAL.ink, sw: 1.2 });
    for (let i = 0; i < 3; i++) inkLine([[x - 34, y + 82 + i * 12], [x + 34, y + 86 + i * 12]], .8, PAL.ink, 'inkfine', 0);
    inkLine([[x - 16, y + 60], [x - 10, y - 10], [x, y + 10], [x + 10, y - 10], [x + 16, y + 60]], 1, on ? '#E8A33A' : '#9A9488', 'inkfine', .3);
  }
  // 三只猫：Clawd 用笔在纸上画的简笔猫，几笔墨线
  function catDrawing(x, y, s, kind, k = 1) {
    boilSeed('cat' + kind);
    push(); translate(x, y); scale(s);
    paint(rectPts(-110, -90, 220, 180), { wash: '#FFFDF7', ink: PAL.ink, sw: 1 });
    const L = (pts, w = 2.2) => { const n = Math.max(2, Math.round(pts.length * clamp(k))); inkLine(pts.slice(0, n), w, PAL.ink, 'ink', .5); };
    if (kind === 0) { L(ellPts(0, 10, 62, 56, 22).concat([[62, 10]])); L([[-40, -32], [-46, -70], [-18, -48]]); L([[40, -32], [46, -70], [18, -48]]); L([[56, 40], [86, 20], [92, -10]]); if (k > .9) { paint(ellPts(-20, 0, 5, 7, 8), { wash: PAL.ink, ink: null }); paint(ellPts(20, 0, 5, 7, 8), { wash: PAL.ink, ink: null }); } }
    else if (kind === 1) { L([[-90, 30], [-80, 0], [60, -4], [80, 20], [60, 40], [-80, 40], [-90, 30]]); L([[60, -4], [62, -36], [74, -16], [86, -36], [84, -2]]); L([[-90, 30], [-104, -20], [-96, -50]]); if (k > .9) paint(ellPts(74, 10, 3, 6, 8), { wash: PAL.ink, ink: null }); }
    else { L(ellPts(0, 24, 74, 38, 22).concat([[74, 24]])); L([[-54, 4], [-62, -20], [-40, -6]]); L([[-30, -2], [-32, -24], [-14, -10]]); L([[60, 30], [40, 52], [-20, 56]]); if (k > .9) { inkLine([[-50, 12], [-38, 14]], 1.6, PAL.ink, 'inkfine', 0); emote('zzz', 60, -40, 12, 1, T); } }
    pop();
  }

  // 桌上的三样工具（世界坐标）：home 放在大白纸左边的桌面上，dest 是拉到背包左边的位置；carry 被机械臂拉过去的时间
  const TOOLS = {
    // dest 互不重叠：上排左地图、右开关，下排表格；都在背包左边（背包左缘约 x 320）
    switch: { home: [-360, 560], dest: [60, 690], carry: [535.1, 535.6] },
    map: { home: [-360, 1040], dest: [-150, 700], carry: [535.3, 535.8] },
    table: { home: [-380, 800], dest: [-45, 905], carry: [536.0, 536.5] },
  };
  function deskTable(x, y) {   // 一张小表格：200×150，四行三列
    boilSeed('sheet tbl'); paint(rectPts(x - 100, y - 75, 200, 150), { wash: '#FFFDF7', ink: PAL.ink, sw: 2 });
    for (let r = 1; r < 4; r++) inkLine([[x - 100, y - 75 + r * 37.5], [x + 100, y - 75 + r * 37.5]], 1.2, PAL.ink, 'inkfine', 0);
    for (let c = 1; c < 3; c++) inkLine([[x - 100 + c * 66.7, y - 75], [x - 100 + c * 66.7, y + 75]], 1.2, PAL.ink, 'inkfine', 0);
  }
  // 两节机械臂的逆运动学：末端够到 target（世界坐标）；够不到就按比例伸长两节（伸缩臂），肘部朝上
  function reachIK(base, lens0, target) {
    const dx = target[0] - base[0], dy = target[1] - base[1], d = Math.max(1, Math.hypot(dx, dy));
    const sc = Math.max(1, d / ((lens0[0] + lens0[1]) * .92)), l0 = lens0[0] * sc, l1 = lens0[1] * sc;
    const c = clamp((d * d - l0 * l0 - l1 * l1) / (2 * l0 * l1), -1, 1), q1 = -Math.acos(c);
    const q0 = Math.atan2(dy, dx) - Math.atan2(l1 * Math.sin(q1), l0 + l1 * Math.cos(q1));
    return { angles: [q0, q1], lens: [l0, l1] };
  }

  function shot(t, lt, dur) {
    // 510–518：开关和灯泡，五次完全一样
    if (t < 518) {
      const i = PRESS.reduce((a, p, j) => t >= p ? j : a, -1), a = i >= 0 ? t - PRESS[i] : t - 509.5;
      // 墨线的沸腾按每次按下的局部时间来算：五次画面逐帧相同
      BOILN = Math.floor(Math.max(0, a) * BOIL) + 1000;
      camBegin(960, CY, 1.5);
      whiteField();
      // 拨动开关：第 1、3 次按下去亮，第 2 次按下去灭（按完松手，状态保持）
      const on = i < 0 ? false : (i % 2 === 0 ? a >= .08 : a < .08);
      lightSwitch(...SW, on); bulb(...BULB, on);
      const press = i >= 0 && a < .3 ? 1 - Math.abs(a - .08) / .22 : 0;
      cursorHand(SW[0] + 6, SW[1] - 30 - 120 * (1 - ease(clamp(Math.min(a + .4, 1.2 - a) / .4))), 3.4, { pose: 'point', press, click: i >= 0 ? a - .06 : -1, key: 'u' });
      camEnd();
      flash(1 - seg(t, 510, 510.5), '#FBF8F0');
      return;
    }
    // 518–532：同一构图换成 Clawd；三次画猫
    const pull = ease(seg(t, 532.2, 534.6)), near = ease(seg(t, 534.4, 535.4));   // 拉开以后再往左推近一点，看清机械臂拿工具
    camBegin(lerp(960, 520, near), lerp(lerp(CY, 600, pull), 790, near), lerp(lerp(1.5, .42, pull), .62, near));
    // 拉开以后：白场是办公桌上的一张大白纸
    if (pull > 0) { boilSeed('office desk'); paint(rectPts(-2400, -1600, 6800, 4400), { wash: '#B98D62', ink: null }); for (let i = 0; i < 12; i++) inkLine([[-2400, -1400 + i * 340], [4400, -1380 + i * 340]], 2, '#A47A52', 'inkfine', .4); }
    boilSeed('big sheet'); paint(rectPts(-200, -120, 2320, 1360), { wash: PAPER, ink: pull > 0 ? PAL.ink : null, sw: 3 });
    // 桌上的其他工具：开关、地图、表格（拉开以后才看到）
    //（开关、地图、表格画在 Clawd 后面，见下面"三样工具"）
    const ci = CATS.reduce((a, c, j) => t >= c - .3 ? j : a, -1);
    const faces = ['happy', 'cool', 'sleepy'];
    const mood = ci < 0 ? feel('neutral', t, { lookX: .6 }) : emotions(t, CATS.map((c, j) => [c - .2, faces[j]]).concat([[534.4, 'determined', { lookX: -.8 }], [536.9, 'happy']]), { take: .8 });
    const cl = { ...mood, view: 'q', boilKey: 'clawd' };
    if (ci >= 0 && t < CATS[ci] + 1.0) { cl.aR = .9 + .12 * Math.sin(t * 26); cl.armR = (u, sw) => { boilSeed('pen'); inkLine([[0, 0], [u * .9, -u * .3]], sw * 2, PAL.ink, 'ink', 0); }; }
    // 背包机械臂自己挑工具：伸长去够桌上的开关、地图、表格，拉到背包左边，拨一下开关，检查灯亮绿灯
    //（v004 反馈：原来机械臂只在原地抬一下，工具一直没人碰，和"它会自己挑工具、组合着用"对不上）
    const P = { lite: .7, sockets: 1, slot: 1, cassettes: 3 };
    const A = packArmSpec(U, P), rest = { near: armTip(A.near, A.lens), far: armTip(A.far, A.lens) };
    const base = { near: [600 + A.nearBase[0], 900 + A.nearBase[1]], far: [600 + A.farBase[0], 900 + A.farBase[1]] };
    const R = arm => [base[arm][0] + rest[arm][0], base[arm][1] + rest[arm][1]];
    const sw = TOOLS.switch, mp = TOOLS.map, tb = TOOLS.table;
    const ARMKEY = {
      near: [[534.6, R('near')], [535.1, sw.home], [535.6, sw.dest], [536.0, tb.home], [536.5, tb.dest], [536.85, R('near')]],
      far: [[534.8, R('far')], [535.3, mp.home], [535.8, mp.dest], [536.25, [sw.dest[0] + 10, sw.dest[1] - 70]], [536.55, [sw.dest[0] + 10, sw.dest[1] - 20]], [536.9, R('far')]],
    };
    for (const arm of ['near', 'far']) {
      const K = ARMKEY[arm];
      if (t <= K[0][0] || t >= K[K.length - 1][0]) continue;
      const ik = reachIK(base[arm], A.lens, kf(t, K));
      P[arm] = ik.angles; P[arm + 'Lens'] = ik.lens;
    }
    agent(600, 900, U, cl, P, { layers: [['#E4DDF0', 5], ['#DCEFD6', 3]], recipe: 2 }, t);
    // 三样工具：在桌上（拉开以后才看到）→ 被机械臂拉到背包左边；开关被拨亮
    if (pull > .3) {
      const at = o => kf(t, [[o.carry[0], o.home], [o.carry[1], o.dest]]);
      deskTable(...at(tb)); icon('map', ...at(mp), 110); lightSwitch(...at(sw), t >= 536.5);
    }
    // 检查灯：在三样工具上方，亮绿灯（比原来大，远景里也看得见）
    if (t >= 536.9 && t < 538.2) { const [lx, ly] = [-45, 520], k = backOut(seg(t, 536.9, 537.1)); paint(ellPts(lx, ly, 44 * k, 44 * k, 18), { wash: '#5BD27A', ink: PAL.ink, sw: 1.4 }); glow(lx, ly, 170, '#8FF0A6', .8); }
    // 请求：一个画着猫轮廓的小图标
    if (t >= 518.5 && t < 520) { const k = backOut(seg(t, 518.5, 518.8)); boilSeed('req'); paint(rrPts(1180 - 70 * k, 400 - 50 * k, 140 * k, 100 * k, 14), { wash: LC.dialog, ink: PAL.ink, sw: 1.2 }); if (k > .9) icon('cat', 1180, 400, 34); }
    // 三只猫：画在开关和灯泡原来的位置（灯泡那边），画好以后排成一排
    CATS.forEach((c, j) => {
      if (t < c) return;
      const drawK = seg(t, c, c + .9), slide = ease(seg(t, c + 1.6, c + 2.4)) * (j < 2 ? 1 : 0) + (j === 2 ? 0 : 0);
      const done = j < 2 && t >= c + 1.6, rowX = 760 + j * 290, rowY = 350;
      const x = done ? lerp(1300, rowX, slide) : (t >= 527.2 ? lerp(1300, rowX, ease(seg(t, 527.2, 528))) : 1300), y = done ? lerp(560, rowY, slide) : (t >= 527.2 ? lerp(560, rowY, ease(seg(t, 527.2, 528))) : 560);
      catDrawing(x, y, done || t >= 527.2 ? .95 : 1.3, j, drawK);
    });
    camEnd();
    boilSeed('transition'); if (t > 537.7) brushWipe((t - 537.7) / .6, ['#C9B497', '#EDE3D2']);
  }

  // ---------- 538–552：相邻的两个工位，第一人称；最后转向窗户 ----------
  function office(t, lt) {
    const toWin = ease(seg(t, 546.4, 549)), push2 = ease(seg(t, 549, 552));
    camBegin(lerp(1080, 1500, toWin), lerp(620, 330, toWin), lerp(1.3, 1.6, toWin) * lerp(1, 2.2, push2));
    boilSeed('office wall'); paint(rectPts(-400, -400, W + 1200, H + 800), { wash: '#EDE3D2', ink: null });
    paint(ellPts(900, 300, 900, 380, 30, 0), { fill: '#F6EEDF', fillOp: 90, bleed: .3, tex: .5, ink: null });
    // 窗：窗外起雾（淡紫灰）
    boilSeed('office window'); paint(rectPts(1290, 120, 420, 420), { wash: '#8A6F55', ink: PAL.ink, sw: 1.4 });
    paint(rectPts(1310, 140, 380, 380), { wash: mixCol('#BFE0F2', '#C9C1D6', seg(t, 545, 550)), ink: null });
    if (t > 545) paint(ellPts(1500, 420, 260, 120, 24, 0), { fill: '#E2DCEA', fillOp: 200 * seg(t, 545, 550), bleed: .4, tex: .5, ink: null });
    inkLine([[1500, 140], [1500, 520]], 2, '#8A6F55', 'ink', 0); inkLine([[1310, 330], [1690, 330]], 2, '#8A6F55', 'ink', 0);
    boilSeed('office floor'); paint(rectPts(-400, 880, W + 1200, 600), { wash: '#C9B497', ink: null });
    // Clawd 的工位：一张桌子、一把椅子（光标拉开它）
    const chairX = lerp(1300, 1100, ease(seg(t, 541.0, 541.8)));
    boilSeed('cl desk'); paint(rectPts(1240, 700, 360, 24), { wash: '#C98F5E', ink: PAL.ink, sw: 1.1 }); for (const x of [1260, 1570]) paint(rectPts(x, 724, 16, 156), { wash: '#A87850', ink: PAL.ink, sw: .8 });
    boilSeed('cl chair'); paint(rrPts(chairX - 90, 560, 180, 210, 30), { wash: '#4E546E', ink: PAL.ink, sw: 1.1 }); paint(rectPts(chairX - 80, 740, 160, 30), { wash: '#3E4358', ink: PAL.ink, sw: 1 }); inkLine([[chairX, 770], [chairX, 860]], 4, '#2E3244', 'ink', 0); paint(ellPts(chairX, 870, 70, 10, 14), { wash: '#2E3244', ink: null });
    // Clawd：接过工牌、坐下、侧过脸朝镜头点头
    const sit = ease(seg(t, 542.4, 543.4)), x = lerp(820, chairX, ease(seg(t, 541.8, 542.6)));
    const mood = emotions(t, [[538, 'neutral', { lookX: -.6 }], [539.8, 'surprised'], [540.4, 'happy'], [543.6, 'happy', { lookX: -.8 }]], { take: .7 });
    const nod = t >= 544.2 && t < 545.2 ? .5 * Math.sin(seg(t, 544.2, 545.2) * Math.PI * 2) : 0;
    const badge = t >= 540.2;
    const cl = { ...mood, view: t >= 543.6 ? 'front' : 'q', legK: 1 - sit, dy: (mood.dy || 0) * .5 + nod, boilKey: 'clawd',
      draw: badge ? (u, sw) => { boilSeed('badge'); inkLine([[-1.4 * u, -7.8 * u], [0, -4.6 * u], [1.4 * u, -7.8 * u]], sw * .8, '#3A9C98', 'inkfine', .3); paint(rectPts(-.9 * u, -4.8 * u, 1.8 * u, 1.3 * u), { wash: PAL.cream, ink: PAL.ink, sw: sw * .6 }); paint(rectPts(-.6 * u, -4.5 * u, .6 * u, .7 * u), { wash: PAL.clay, ink: null }); } : null };
    agent(x, 880, 26, cl, { lite: .7, sockets: 1, slot: 1, cassettes: 3 }, t >= 543.6 ? null : { layers: [['#E4DDF0', 5], ['#DCEFD6', 3]], recipe: 2 }, t);
    // 我们自己的桌子（前景左下）：桌面和一角显示器
    boilSeed('our desk'); paint(rectPts(-200, 760, 900, 400), { wash: '#B98D62', ink: PAL.ink, sw: 1.4 }); paint(rrPts(60, 330, 520, 360, 16), { wash: FD.bezel, ink: PAL.ink, sw: 1.4 }); paint(rectPts(80, 350, 480, 320), { wash: FD.chat, ink: null });
    // 光标：递工牌、拉椅子
    if (t < 541.9) {
      const holding = t < 540.2;
      const cx2 = kf(t, [[538, 600], [539.6, 860], [540.2, 870], [540.8, chairX + 60], [541.8, chairX + 60]]), cy2 = kf(t, [[538, 900], [539.6, 720], [540.2, 720], [540.8, 640], [541.8, 640]]);
      if (holding) { boilSeed('badge2'); paint(rectPts(cx2 - 30, cy2 - 30, 60, 44), { wash: PAL.cream, ink: PAL.ink, sw: .8 }); paint(rectPts(cx2 - 22, cy2 - 22, 18, 22), { wash: PAL.clay, ink: null }); }
      cursorHand(cx2, cy2, 2.6, { pose: holding || t > 540.8 ? 'grab' : 'point', key: 'u' });
    }
    camEnd();
  }

  // 本章时间 → v001 时间：[本章起, 本章止, v001 起]；段与段之间是硬切
  const SEG = [[0, 4.5, 510.5], [4.5, 37.1, 518.0]];
  const oldT = u => { const g = SEG.find(([a, b]) => u >= a && u < b) || SEG[SEG.length - 1]; return g[2] + (u - g[0]); };
  chapter(13, [[0, u => {
    const t = oldT(u);
    if (t < 538) shot(t);
    else { office(t, t - 538); boilSeed('transition'); if (t - 538 < .3) brushWipe(.5 + (t - 538) / .6, ['#C9B497', '#EDE3D2']); }
  }]]);
})();
