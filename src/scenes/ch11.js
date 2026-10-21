// ch11.js：第 11 章 · Harness 工程（下）：像一个靠谱员工那样干活（正片 48.2 秒）。
// v002：沿用 v001（时间是 v001 时间），用 SEG 表挑段：横版过关去掉最后走出画面的尾巴，门升起来的段落剪短。
//   0–8      失败那次：路只有"读需求 → 交付"两站；要椅子，交出的设计图上是桌子；镜头摇头；设计图退回
//   8–12     俯视：光标把几枚新棋子插进两站之间，路被拉长
//   12–40.6  横版过关跟拍：读需求 → 调研（系统小楼的插口、口袋卡、远处大图书馆只取回一本书）
//            → 确认（全章最慢：Clawd 递上问题卡，光标接过、指一个，门打开）→ 记笔记 → 交付（这次对上了）→ 验证
//   40.6–48.2 俯视：在终点放下最后一枚棋子：一座门；切侧视，目标门从地里升起来
(() => {
  const G = VN.G, U = 26, LITE = .55;
  const P0 = { lite: LITE, sockets: 1, slot: 1, cassettes: 4 };
  const TR = [['#E4DDF0', 6], ['#DCEFD6', 3], ['result', 4]];
  // 第二次的站点位置
  const S = { read: 500, research: 1000, confirm: 1950, notes: 2350, deliver: 2750, verify: 3150 };
  const SYS = [{ x: 1150, w: 180, h: 250, col: '#9DB8E0', kind: 'plain', icons: ['doc'] }, { x: 1380, w: 180, h: 280, col: '#A6CF8E', kind: 'plain', icons: ['code'] }, { x: 1610, w: 180, h: 240, col: '#E0B47E', kind: 'plain', icons: ['folder'] }];
  SYS.forEach(B => B.sock = [B.x + 30, G - 70]);

  // ---------- 失败的那次 ----------
  function fail(t, lt) {
    const shake = t >= 429.8 && t < 430.8 ? 40 * Math.sin((t - 429.8) * TAU * 2) * (1 - seg(t, 429.8, 430.8)) : 0;
    const close = t >= 428.4 && t < 431.8;
    camBegin(close ? 700 + shake : kf(t, [[424, 600], [427.5, 800]]), close ? 560 : 640, close ? 2.0 : 1.35);
    venueBG(t, 700); venueGround(t, 700);
    station(500, 'doc'); station(900, 'check');
    const walk = stroll(t, 424.3, 425.6, 280, 500, U), walk2 = stroll(t, 426.2, 427.2, 500, 900, U);
    const x = t < 426.2 ? walk.x : walk2.x, mv = (t > 424.3 && t < 425.6) ? walk : (t > 426.2 && t < 427.2) ? walk2 : null;
    const mood = emotions(t, [[424, 'determined'], [425.6, 'neutral', { lookY: -.6 }], [426.0, 'excited'], [427.4, 'proud'], [430.9, 'shy']], { take: .7 });
    agent(x, G, U, { ...mood, view: mv ? 'side' : 'q', walk: mv ? mv.walk : null, boilKey: 'clawd' }, P0, { layers: TR, recipe: 2 }, t);
    // 需求卡（椅子）和一份厚厚的设计图（桌子）；左右并排放大
    if (!close && t >= 425.6) reqCard(470, G - 330, .6);
    if (!close && t >= 427.3) blueprint(980, G - 330, .6, 'table');
    if (close) {
      const back = ease(seg(t, 430.8, 431.7));
      reqCard(590, 560, 1.2);
      blueprint(lerp(830, 380, back), 560 + 40 * Math.sin(back * Math.PI) * -1, 1.2 * (1 - back * .5), 'table');
    }
    camEnd();
  }

  // ---------- 改路线（俯视） ----------
  function remap(t, lt) {
    const out = ease(seg(t, 435.2, 436));
    camBegin(lerp(1000, 760, out), 560, lerp(1.25, 5, out));
    const ins = [[1, 'station', 'search', 433.0], [2, 'station', 'question', 433.5], [3, 'station', 'doc', 434.0]];
    const ext = seg(t, 432.6, 434.6);
    const x = i => lerp(600 + i * 800 / 1, 600 + i * 160, ext);   // 站点之间被拉开
    const pawns = [{ x: 600, y: 560, kind: 'station', icon: 'doc' }, { x: lerp(1400, 1400, 0), y: 560, kind: 'station', icon: 'check' }];
    ins.forEach(([i, kind, ic, a]) => pawns.push({ x: 600 + i * 200, y: 560, kind, icon: ic, k: seg(t, a, a + .4) }));
    pawns[1].x = lerp(800, 1400, ext);
    boardMap(t, { pawns, roads: [[600, 560, lerp(800, 1400, ext), 560, 1]] });
    const a = ins.find(([i, , , a0]) => t >= a0 - .4 && t < a0 + .3);
    if (a) cursorHand(600 + a[0] * 200, 540, 3.2, { pose: 'grab', key: 'u' });
    camEnd();
  }

  // ---------- 第二次：横版过关跟拍 ----------
  // 每段：[开始, 结束, Clawd 的 x]
  const RUN = [[436, 438, S.read], [438, 446, S.research - 60], [446, 455, S.confirm], [455, 458, S.notes], [458, 462, S.deliver], [462, 466, S.verify]];
  function walkX(t) {
    const legs = [[436.0, 436.6, 300, S.read], [437.6, 438.4, S.read, S.research - 60], [445.4, 446.4, S.research - 60, S.confirm - 230], [453.0, 454.0, S.confirm - 230, S.confirm + 260],
      [454.6, 455.4, S.confirm + 260, S.notes - 120], [457.6, 458.4, S.notes - 120, S.deliver - 120], [461.4, 462.2, S.deliver - 120, S.verify - 120], [464.4, 466, S.verify - 120, S.verify + 600]];
    let x = 300, mv = null;
    for (const [a, b, x0, x1] of legs) { if (t >= b) x = x1; else if (t >= a) { const w = stroll(t, a, b, x0, x1, U); x = w.x; mv = w; } }
    return { x, mv };
  }
  function run(t, lt) {
    const { x, mv } = walkX(t);
    const confirmClose = t >= 446.4 && t < 453.0, pocket = t >= 441.0 && t < 442.4, far = t >= 443.4 && t < 445.4;
    const cam = confirmClose ? [S.confirm - 120, G - 250, 2.3] : pocket ? [x - 150, G - 290, 4.2] : far ? [x + 500, 520, .55] : [x + 200, 620, 1.3];
    camBegin(...cam);
    venueBG(t, cam[0]);
    // 远处的大图书馆（视差 0.5）：大到看不到顶
    boilSeed('library'); const lx = PX(2300, .5, cam[0]);
    paint(rectPts(lx, -1400, 700, G + 1400), { wash: '#C7B9A0', ink: PAL.ink, sw: 1.4 });
    for (let i = 0; i < 26; i++) for (let c = 0; c < 5; c++) paint(rectPts(lx + 40 + c * 130, -1360 + i * 86, 110, 60), { wash: ['#8C6E58', '#6F8FD0', '#B76E5A', '#7FA650'][(i + c) % 4], ink: null });
    venueGround(t, cam[0]);
    SYS.forEach(B => building(B, t, 1));
    station(S.read, 'doc'); station(S.research, 'search'); station(S.confirm, 'question', '#F6EBD2', { gate: snap(t, 452.0, .25) }); station(S.notes, 'doc'); station(S.deliver, 'check'); station(S.verify, 'eye');
    fileCabinet(S.notes + 110, G, .5, { ticks: t >= 457 ? 1 : 0 });

    const mood = emotions(t, [[436, 'neutral', { lookY: -.6 }], [438.4, 'thinking'], [442.4, 'happy'], [443.4, 'thinking', { lookX: .8 }], [445.4, 'happy'], [446.4, 'shy', { lookX: -.2 }],
      [451.8, 'happy'], [455.4, 'neutral', { lookX: .6, lookY: .4 }], [458.4, 'proud'], [462.3, 'excited']], { take: .7 });
    const cl = { ...mood, view: mv ? 'side' : 'q', walk: mv ? mv.walk : null, boilKey: 'clawd' };
    // 调研：线缆插进系统小楼的插口；远处的图书馆只取回一本书
    const P = { ...P0 };
    if (t >= 438.6 && t < 445.4) {
      const cab = (a, B, i) => { if (t >= a) { const pth = cable(clawdToWorld(x, G, U, cl, -6.2 * U, -(6.2 - i * 1.2) * U), B.sock, 40, easeOut(seg(t, a, a + .4))); if (pth && t > a + .5 && t < a + 1.6) { const p = along(pth, 1 - ease(seg(t, a + .5, a + 1.5))); slip('answer', p[0], p[1] - 22, .5, 0, ['doc']); } } };
      cab(438.8, SYS[0], 0); cab(439.8, SYS[1], 1);
      if (t >= 443.6) { const pth = cable(clawdToWorld(x, G, U, cl, -6.2 * U, -3.8 * U), [lx + 40, G - 60], 120, easeOut(seg(t, 443.6, 444.2))); if (pth && t > 444.3) { const p = along(pth, 1 - ease(seg(t, 444.3, 445.3))); icon('doc', p[0], p[1] - 20, 22, { col: '#8C6E58' }); } }
    }
    // 确认：第一人称，同一高度；Clawd 递上问题卡（椅子要不要扶手），光标接过、停一下、指其中一个
    if (confirmClose) {
      cl.view = 'q'; cl.aR = kf(t, [[446.4, .2], [447.6, .2], [448.2, .9], [451.8, .9], [452.2, .2]]);
    }
    agent(x, G, U, cl, P, { layers: TR.concat(t >= 446 ? [['result', 3], ['result', 3]] : []), recipe: 2 }, t);
    // 口袋卡：每张卡带上夹着一张小卡，写着这个工具在这个场景下必须知道的东西
    if (pocket) { const g = packGeom(U, LITE), [px, py] = clawdToWorld(x, G, U, cl, g.bx - 110 * g.s + .4 * U, g.by - 430 * g.s - 2.6 * U), k = backOut(seg(t, 441.1, 441.4)); push(); translate(px, py); scale(k); rotate(-.15); boilSeed('pocket'); paint(rectPts(-20, -14, 40, 28), { wash: PAL.cream, ink: PAL.ink, sw: .5 }); icon('doc', -8, 0, 7); codeLines(2, -6, 14, 2, 140, 1, 7); inkLine([[-6, 14], [-6, 26]], 1.2, MC.macDk, 'ink', 0); pop(); }
    if (confirmClose && t >= 448.0) {
      const [hx, hy] = clawdToWorld(x, G, U, cl, 7.5 * U, -6.4 * U), k = ease(seg(t, 448.0, 448.6)), taken = ease(seg(t, 449.4, 450.0));
      const qx = lerp(hx, S.confirm - 230 + 80, taken), qy = lerp(hy, G - 300, taken);
      boilSeed('qcard'); paint(rectPts(qx - 90 * k, qy - 60 * k, 180 * k, 120 * k), { wash: PAL.cream, ink: PAL.ink, sw: 1 });
      if (k > .9) { icon('question', qx - 55, qy - 10, 18); icon('chair', qx, qy, 20); paint(rectPts(qx + 26, qy - 26, 50, 52), { wash: t >= 451.4 ? '#FFE7A8' : PAL.cream, ink: PAL.ink, sw: .6 }); inkLine([[qx + 34, qy - 8], [qx + 62, qy - 8]], 2, PAL.ink, 'ink', 0); icon('chair', qx + 50, qy + 6, 14); }
      const cx2 = kf(t, [[448.0, qx + 200], [449.4, qx + 10], [450.0, qx + 10], [451.0, qx + 30], [451.4, qx + 52]]), cy2 = kf(t, [[448.0, G - 50], [449.4, qy + 20], [450.0, qy + 20], [451.4, qy - 4]]);
      cursorHand(cx2, cy2, 2.4, { pose: t >= 449.4 && t < 450.9 ? 'grab' : 'point', click: t - 451.45, key: 'u' });
    }
    // 记笔记：写好放进路边的文件柜
    if (t >= 455.4 && t < 457.4) { const k = ease(seg(t, 456.4, 457.3)), [hx, hy] = clawdToWorld(x, G, U, cl, 7 * U, -6 * U), p = arcPt([hx, hy], [S.notes + 165, G - 120], 80, k); slip('answer', p[0], p[1], .5, 0, ['doc']); }
    // 交付：需求卡和设计图并排（和失败那次同一个构图），这次对上了
    if (t >= 458.8 && t < 461.4) { reqCard(S.deliver - 130, G - 340, .9); blueprint(S.deliver + 110, G - 340, .9 * backOut(seg(t, 459.4, 459.8)), 'armchair'); if (t >= 460.2) icon('check', S.deliver + 230, G - 430, 28); }
    // 验证：一个绿勾
    if (t >= 462.6 && t < 464.4) icon('check', S.verify, G - 330, 40 * backOut(seg(t, 462.6, 462.9)));
    camEnd();
  }

  // ---------- 放下最后一枚棋子：一座门；目标门从地里升起来 ----------
  function gateMap(t, lt) {
    camBegin(1100, 560, 1.25);
    const pawns = [['doc', 500], ['search', 700], ['question', 900], ['doc', 1100], ['check', 1300], ['eye', 1500]].map(([ic, x]) => ({ x, y: 560, kind: 'station', icon: ic }));
    pawns.push({ x: 1700, y: 560, kind: 'gate', k: seg(t, 467.6, 468.1) });
    boardMap(t, { pawns, roads: [[500, 560, 1700, 560, 1]] });
    cursorHand(kf(t, [[466, 1900], [467.5, 1700], [469, 1800]]), kf(t, [[466, 900], [467.5, 540], [469, 700]]), 3.2, { pose: t < 468 ? 'grab' : 'point', key: 'u' });
    camEnd();
  }
  function gateRise(t, lt) {
    camBegin(1150, 620, 1.2);
    venueBG(t, 1150); venueGround(t, 1150);
    goalGate(1500, t, ease(seg(t, 470.6, 472.4)), []);
    agent(900, G, U, { ...emotions(t, [[470, 'neutral', { lookX: .8 }], [472.5, 'surprised', { lookX: .8 }], [473.5, 'determined', { lookX: .8 }]]), view: 'q', boilKey: 'clawd' }, P0, { layers: TR, recipe: 2 }, t);
    camEnd();
  }

  // 本章时间 → v001 时间：[本章起, 本章止, v001 起]；段与段之间是硬切
  const SEG = [[0, 40.6, 424.0], [40.6, 44.2, 466.0], [44.2, 48.2, 470.4]];
  const oldT = u => { const g = SEG.find(([a, b]) => u >= a && u < b) || SEG[SEG.length - 1]; return g[2] + (u - g[0]); };
  chapter(11, [[0, u => {
    const t = oldT(u);
    (t < 432 ? fail : t < 436 ? remap : t < 466 ? run : t < 470 ? gateMap : gateRise)(t);
    for (const c of [8, 12, 40.6, 44.2]) whipLines(seg(u, c - .12, c + .12), '#E8E1CF');
  }]]);
})();
