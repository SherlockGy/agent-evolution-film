// ch10.js：第 10 章 · Harness 工程（上）：一个入口，只拿这次要用的工具（正片 44.1 秒）。
// v002：沿用 v001（时间是 v001 时间），用 SEG 表挑段；SEG 第 4 项是播放速度（术语表那几个 1 秒的快切放慢到 0.75 倍，字来得及读）；
// 取消"Harness 工程"印章（交给气泡）。
//   0–3.3    俯视桌游地图：光标伸到棋子旁
//   3.3–7.8  背包盖：光标拿螺丝刀掀开，里面齿轮管道密密麻麻；放下螺丝刀，合上，拍拍
//   7.8–16.9 卡带海：推来一车卡带倒下，纸摞往上蹿，只露出两只转圈的眼睛；光标挠一挠，拿起场地图纸
//   16.9–21.7 俯视：放下前台棋子，画出两条分岔的路；推近，前台立起来
//   21.7–36.8 两个包裹：测试 → 下面那条路、三张卡带；开发 → 上面那条路、四张卡带
//   36.8–44.1 术语表：内部缩写 → 问号 → 术语卡 → 叹号；Clawd 带着卡带和包裹往右走出画面
(() => {
  const G = VN.G, U = 26, LITE = .55, XS = 1180;
  const P0 = { lite: LITE, sockets: 1, slot: 1, cassettes: 1 };
  const TR = [['#E4DDF0', 6], ['#DCEFD6', 3], ['result', 4], ['result', 3]];

  // ---------- 俯视地图 ----------
  function mapA(t, lt) {
    camBegin(900, 560, 1.35);
    boardMap(t, { pawns: [{ x: 760, y: 560, kind: 'desk' }] });
    cursorHand(kf(t, [[374, 900], [376, 820]]), kf(t, [[374, 1200], [376, 640]]), 3.2, { key: 'u' });
    camEnd();
  }
  function mapE(t, lt) {
    const k = ease(seg(t, 398.6, 400));
    camBegin(lerp(1000, 900, k), lerp(600, 560, k), lerp(1.2, 6, k));
    const r = seg(t, 396.2, 397.4);
    boardMap(t, {
      pawns: [{ x: 760, y: 560, kind: 'desk' }, { x: 900, y: 560, kind: 'front', k: seg(t, 395.4, 395.9) }],
      roads: [[930, 560, 1300, 430, r], [1300, 430, 1700, 430, seg(t, 397.0, 397.6)], [930, 560, 1300, 690, r], [1300, 690, 1700, 690, seg(t, 397.0, 397.6)]],
    });
    // 两条路的终点：开发活（代码括号）走上面，测试活（打勾小盾牌）走下面，和后面柜台上的路线牌一致
    { const k = backOut(seg(t, 397.6, 397.9)); if (k > 0) { boilSeed('road ends'); for (const [ic, y] of [['code', 430], ['shield', 690]]) { paint(ellPts(1740, y, 30 * k, 30 * k, 16), { wash: '#F6EBD2', ink: PAL.ink, sw: 1 }); icon(ic, 1740, y, 20 * k); } } }
    const x = kf(t, [[395, 1000], [395.4, 900], [396.2, 930], [397.4, 1300], [397.6, 1700], [398.4, 1500]]), y = kf(t, [[395, 900], [395.4, 520], [396.2, 560], [397.4, 690], [397.6, 690], [398.4, 900]]);
    cursorHand(x, y, 3.2, { pose: t < 395.9 ? 'grab' : 'point', key: 'u' });
    camEnd();
  }

  // ---------- 背包盖 ----------
  function lid(t, lt) {
    const g = packGeom(U, LITE), [hx, hy] = [XS + g.bx, G + g.by];
    const freeze = t >= 380.2 && t < 381 ? .06 * seg(t, 380.2, 380.6) : 0;
    camBegin(hx + 10, hy - 75, 3.6 + freeze);
    venueBG(t, hx); venueGround(t, hx);
    agent(XS, G, U, { ...feel('neutral', t), view: 'q', boilKey: 'clawd' }, P0, { layers: TR, recipe: 2 }, t);
    // 掀开的背包盖：里面密密麻麻的齿轮和管道
    const open = ease(seg(t, 379.0, 379.4)) * (1 - ease(seg(t, 381.5, 381.9)));
    if (open > .01) {
      const s = g.s;
      push(); translate(hx, hy); scale(s);
      boilSeed('guts');
      // 里面：三个大功能块（想、读写文件、跑命令），细线连着，一盏小灯（v002 反馈：密集的齿轮、粗管子看着不舒服）
      paint(rrPts(-175, -415, 350, 400, 12), { wash: '#3A3F58', ink: PAL.ink, sw: 2 });
      inkLine([[-90, -300], [90, -300], [0, -130], [-90, -300]], 2, mixCol(MC.tube, PAL.cream, .3), 'inkfine', 0);
      for (const [bx, by, ic] of [[-90, -300, 'think'], [90, -300, 'folder'], [0, -130, 'terminal']]) {
        paint(rrPts(bx - 55, by - 45, 110, 90, 12), { wash: MC.macLt, ink: PAL.ink, sw: 1.4 });
        icon(ic, bx, by, 30);
      }
      paint(ellPts(130, -60, 9, 9, 10), { wash: Math.floor(t * 2) % 2 ? '#7FC8C2' : '#5BD27A', ink: PAL.ink, sw: .6 });
      // 盖子往左翻开
      push(); translate(-190, -430); rotate(-1.6 * open); paint(rrPts(0, 0, 380, 30, 8), { wash: MC.mac, ink: PAL.ink, sw: 2 }); pop();
      pop();
    }
    // 光标拿着螺丝刀
    const sd = (s, sw) => { push(); rotate(.5); paint(rrPts(-4 * s, -2 * s, 8 * s, 10 * s, 2 * s), { wash: '#D9453B', ink: PAL.ink, sw }); paint(rectPts(-1 * s, -12 * s, 2 * s, 10 * s), { wash: MC.macLt, ink: PAL.ink, sw }); pop(); };
    const holding = t < 381.0;
    const cx2 = kf(t, [[378, hx + 140], [378.8, hx + 40], [381.0, hx + 60], [381.6, hx], [382.2, hx + 20], [383, hx + 140]]), cy2 = kf(t, [[378, hy - 20], [378.8, hy - 140], [381.0, hy - 140], [381.6, hy - 150], [382.2, hy - 100], [383, hy - 40]]);
    if (!holding && t < 381.6) { const k = easeIn(seg(t, 381.0, 381.5)); push(); translate(hx + 60, lerp(hy - 140, hy + 60, k)); sd(2, .7); pop(); }
    cursorHand(cx2, cy2, 2, { pose: holding ? 'grab' : 'point', hold: holding ? sd : null, click: t < 380 ? t - 378.95 : t - 382.2, key: 'u' });
    camEnd();
  }

  // ---------- 卡带海 ----------
  const FALL = []; for (let i = 0; i < 70; i++) FALL.push({ t0: 384.8 + i * .06 + .05 * hash(i), x: XS - 260 + 520 * hash(i + 11), r: (hash(i + 5) - .5) * 1.6, c: CAS_COLS[i % 8] });
  function sea(t, lt) {
    camBegin(1120, 640, 1.45);
    venueBG(t, 1120); venueGround(t, 1120);
    const pile = t < 393 ? clamp((t - 385.3) / 3.6) : 1 - ease(seg(t, 393.0, 394.0));
    const mood = emotions(t, [[383, 'happy'], [384.9, 'surprised', { lookY: -1 }], [386.4, 'scared'], [388.0, 'dizzy']], { take: .7 });
    // 纸摞往上蹿：每张卡带的说明页都夹进来
    const tall = TR.concat(Array.from({ length: Math.floor(24 * clamp((t - 385.5) / 2.5)) * (pile > .02 ? 1 : 0) }, (_, i) => ['tools', 3 + (i % 2)]));
    agent(XS, G, U, { ...mood, view: 'q', boilKey: 'clawd' }, { ...P0, cassettes: 3 }, { layers: tall, recipe: 2, s: .7 * U / 24 }, t);
    // 卡带堆：越堆越高，最后只露出两只转圈的眼睛
    const top = G - 300 * pile;
    if (pile > .01) {
      boilSeed('pile');
      const pts = [[XS - 420, G], [XS - 300, top + 60], [XS - 120, top + 10], [XS + 60, top], [XS + 240, top + 30], [XS + 420, G]];
      paint(pts, { wash: '#8C7AB8', ink: PAL.ink, sw: 1, curv: .4 });
      for (let i = 0; i < 40; i++) { const x = XS - 330 + 660 * hash(i + 40), y = lerp(G - 20, top + 40, hash(i + 70)); if (y > top + 20) { push(); translate(x, y); rotate((hash(i) - .5) * 1.4); paint(rrPts(-22, -15, 44, 30, 4), { wash: CAS_COLS[i % 8], ink: PAL.ink, sw: .6 }); pop(); } }
      if (pile > .85) { for (const s of [-1, 1]) { push(); translate(XS + 20 + s * 52, top - 8); const sp = []; for (let k = 0; k < 14; k++) { const a = k * .8 + t * 6 * s, r = k * 1.8; sp.push([Math.cos(a) * r, Math.sin(a) * r]); } paint(ellPts(0, 0, 26, 30, 16), { wash: PAL.clay, ink: PAL.ink, sw: .8 }); inkLine(sp, 1.2, PAL.ink, 'inkfine', .6); pop(); } emote('stars', XS + 20, top - 60, 18, 1, t); }
    }
    // 正在往下掉的卡带
    if (t < 393) for (const f of FALL) { const a = t - f.t0; if (a < 0 || a > .7) continue; const y = lerp(-80, Math.max(top, G - 300 * clamp((f.t0 - 385.3 + .7) / 3.6)), easeIn(a / .7)); push(); translate(f.x, y); rotate(f.r + a * 4); boilSeed('fall' + f.t0); paint(rrPts(-22, -15, 44, 30, 4), { wash: f.c, ink: PAL.ink, sw: .6 }); pop(); }
    // 光标推一车卡带进来
    if (t < 385.2) {
      const k = ease(seg(t, 383.2, 384.5)), cx = lerp(200, XS - 380, k), tip = seg(t, 384.6, 385.1);
      boilSeed('cart'); push(); translate(cx, G - 40); rotate(-.6 * tip);
      paint(rectPts(-120, -90, 240, 90), { wash: MC.macLt, ink: PAL.ink, sw: 1 });
      for (let i = 0; i < 14; i++) paint(rrPts(-110 + (i % 5) * 44, -150 - Math.floor(i / 5) * 30, 40, 28, 4), { wash: CAS_COLS[i % 8], ink: PAL.ink, sw: .5 });
      pop();
      for (const d of [-80, 80]) paint(ellPts(cx + d, G - 10, 14, 14, 10), { wash: MC.macDk, ink: PAL.ink, sw: .7 });
      cursorHand(cx - 140, G - 100, 2.6, { pose: 'open', key: 'u' });
    }
    // 光标挠一挠，然后拿起场地图纸
    if (t >= 392) {
      const scratch = t < 393 ? 14 * Math.sin(t * 30) : 0;
      cursorHand(kf(t, [[392, 600], [393, 600], [394.2, 900]]) + scratch, kf(t, [[392, 300], [393, 300], [394.2, 420]]), 2.6, { pose: t > 394.2 ? 'grab' : 'point', key: 'u', hold: t > 394.2 ? (s, sw) => { paint(rectPts(-14 * s, -10 * s, 28 * s, 20 * s), { wash: '#EFE2C4', ink: PAL.ink, sw }); } : null });
    }
    camEnd();
  }

  // ---------- 两个包裹（同一机位） ----------
  // 包裹 A：测试（打勾小盾牌），下面那条路，三张卡带；包裹 B：开发（代码括号），上面那条路，四张卡带，贴着内部缩写
  const PK = [{ arrive: 400.3, look1: 401.0, look2: 402.0, write: [402.8, 403.6], sw: 404.4, take: [404.9, 405.4, 405.9], ic: 'shield', dir: 1, cas: [4, 5, 2], back: 408.4 },
    { arrive: 409.3, look1: 410.0, look2: 411.0, write: [411.8, 412.6], sw: 413.4, take: [413.9, 414.4, 414.9, 415.4], ic: 'code', dir: 0, cas: [0, 1, 2, 3], back: 999 }];
  function desk(t, lt) {
    const cam = t < 418 ? [860, 630, 1.38] : t < 419 ? [700, 700, 4.2] : t < 420 ? [XS + 40, G - 150, 3.6] : t < 421 ? [700, 700, 4.2] : t < 422 ? [XS + 40, G - 150, 3.6] : [1250, 630, 1.2];
    const rise = ease(seg(t, 400.0, 400.5));
    camBegin(...cam);
    venueBG(t, cam[0]); venueGround(t, cam[0]);
    const pk = t < PK[1].arrive - .1 ? PK[0] : PK[1];
    const taken = t >= pk.take[0] && t < pk.back ? pk.cas.filter((c, j) => t >= pk.take[j] + .4) : [];
    push(); translate(0, (1 - rise) * 300);
    cassetteWall(t, taken); frontCounter(t);
    routeSign(t, t >= pk.look2 && t < pk.look2 + 1.6 ? (pk.ic === 'code' ? 0 : 1) : -1);
    railSwitch(t, pk.dir, snap(t, pk.sw, .15));
    pop();
    // 包裹：落到柜台上；B 上贴着内部缩写
    const [dx, dy] = FDX.desk;
    if (t >= pk.arrive) {
      const k = easeIn(seg(t, pk.arrive, pk.arrive + .35)), walkK = pk === PK[1] ? ease(seg(t, 422.2, 424)) : 0;
      const px = lerp(dx + 40, XS + 520, walkK), py = lerp(-60, dy - 196, k) - (walkK > 0 ? 0 : 0);
      boilSeed('pkg'); paint(rectPts(px - 46, py - 30, 92, 60), { wash: '#C9A06A', ink: PAL.ink, sw: .9 }); inkLine([[px - 46, py - 6], [px + 46, py - 6]], .8, PAL.ink, 'inkfine', 0); icon(pk.ic, px - 14, py + 12, 14);
      if (pk === PK[1]) { paint(rectPts(px + 6, py + 2, 34, 20), { wash: PAL.cream, ink: PAL.ink, sw: .5 }); letter('QBX', px + 23, py + 12, 11, PAL.ink, { ink: false, font: 'bold 11px "Segoe UI", Arial' }); }
    }
    // Clawd：站在柜台右边、面朝左看包裹和路线牌；最后转身沿上面那条路往右走
    const walk = stroll(t, 422.2, 424, XS, XS + 520, U);
    const mood = emotions(t, [[400, 'neutral'], [PK[0].look1, 'thinking', { lookX: .8, lookY: .3 }], [PK[0].look2, 'thinking', { lookX: .2, lookY: -.9 }], [PK[0].write[0], 'neutral', { lookX: .3, lookY: .4 }], [404.6, 'happy'],
      [PK[1].look1, 'thinking', { lookX: .8, lookY: .3 }], [PK[1].look2, 'thinking', { lookX: .2, lookY: -.9 }], [PK[1].write[0], 'neutral', { lookX: .3, lookY: .4 }], [413.6, 'happy'],
      [419.05, 'confused', { emote: '?' }], [421.05, 'surprised', { emote: '!' }], [421.7, 'happy']], { take: .7 });
    const cl = { ...mood, view: t > 422.2 ? 'side' : 'q', flip: t <= 422.2, boilKey: 'clawd' };
    if (t > 422.2) cl.walk = walk.walk;
    const w = PK.find(p => t >= p.write[0] && t < p.write[1]);
    if (w) { cl.aR = .95 + .08 * Math.sin(t * 30); cl.armR = (u, sw) => slip('exec', .8 * u, 0, .55, .2, [w.ic]); }
    // 背包里的卡带数：取一张多一张；包裹 A 做完以后还回去
    const nCas = t < pk.take[0] ? 0 : pk.take.filter(a => t >= a + .4).length;
    agent(t > 422.2 ? walk.x : XS, G, U, cl, { ...P0, cassettes: Math.max(0, nCas) }, { layers: TR, recipe: 2 }, t);
    // 前台的机器从墙上取下卡带，沿弧线送进 Clawd 背包的卡槽
    pk.take.forEach((a, j) => {
      if (t < a || t >= a + .4) return;
      const k = ease(seg(t, a, a + .4)), from = wallSlot(pk.cas[j]), to = [XS + 150, G - 300], p = arcPt(from, to, 120, k);
      boilSeed('castake' + j); paint(rrPts(p[0] - 22, p[1] - 16, 44, 32, 4), { wash: CAS_COLS[pk.cas[j]], ink: PAL.ink, sw: .6 });
      letter(String(j + 1), p[0], p[1] + 1, 20, PAL.cream, { ink: false, font: CAP_FONT(20) });   // 按入口 Skill 写的顺序取
    });
    // 术语卡：缩写旁边一个图
    if (t >= 420 && t < 421) { boilSeed('gloss'); paint(rectPts(560, 640, 280, 120), { wash: '#FFFBF0', ink: PAL.ink, sw: 1 }); letter('QBX', 640, 700, 34, PAL.ink, { ink: false, font: 'bold 34px "Segoe UI", Arial' }); inkLine([[700, 700], [740, 700]], 1.2, PAL.ink, 'inkfine', 0); icon('building', 785, 700, 34, { col: BLD.archive.col }); }
    camEnd();
    for (const c of [419, 420, 421, 422, 424]) whipLines(seg(t, c - .1, c + .1), '#E8E1CF');
  }

  // 本章时间 → v001 时间：[本章起, 本章止, v001 起, 播放速度（默认 1）]；段与段之间是硬切
  const SEG = [[0, 3.3, 374.3], [3.3, 7.8, 378.3], [7.8, 14.2, 383.0], [14.2, 16.9, 391.9], [16.9, 21.7, 395.0],
    [21.7, 30.1, 400.0], [30.1, 36.8, 409.3], [36.8, 42.13, 418.0, .75], [42.13, 44.13, 422.0]];
  const oldT = u => { const g = SEG.find(([a, b]) => u >= a && u < b) || SEG[SEG.length - 1]; return g[2] + (u - g[0]) * (g[3] || 1); };
  chapter(10, [[0, u => {
    const t = oldT(u);
    (t < 378 ? mapA : t < 383 ? lid : t < 395 ? sea : t < 400 ? mapE : desk)(t);
    for (const [a] of SEG) if (a > 0) whipLines(seg(u, a - .12, a + .12), '#E8E1CF');
  }]]);
})();
