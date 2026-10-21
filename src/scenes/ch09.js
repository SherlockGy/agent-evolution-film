// ch09.js：第 9 章 · 上下文工程：管好纸摞里放什么（正片 27.5 秒）。固定机位的延时。
// v002：沿用 v001（时间是 v001 时间），用 SEG 表挑段：打勾、清纸、压缩后读进度、目标钉回各演一次，第二次压缩剪掉，
// 直接跳到"第三次压缩已经不慌了"；取消"上下文工程"印章（交给气泡）；结尾穿过天花板，桌游地图交给第 10 章。
//   0–9.8    光标拖着文件柜入画，放进两个文件夹（方案、进度），拍拍柜子；Clawd 写执行单，机械臂把方案放进柜子
//   9.8–18.6 延时：打勾、清纸、压缩 → 茫然 → 读回进度文件、目标钉回最上面
//   18.6–27.5 又一次压缩：戴着墨镜已经不慌了；纸摞一直很矮；最后一个勾，镜头拉高穿过天花板
(() => {
  const G = WR.G, U = 26, XS = WR.CX, LITE = .35;
  // 事件表（不重叠）：tick 打勾、clean 清纸、star 目标钉回、comp 压缩（read 读进度文件的时刻）
  const EV = [
    [346.0, 'tick'], [347.5, 'clean'], [348.6, 'comp', 350.8], [352.8, 'star'], [354.0, 'tick'], [355.2, 'clean'], [356.4, 'comp', 357.3],
    [359.2, 'tick'], [360.4, 'star'], [361.6, 'tick'], [362.8, 'clean'], [364.0, 'comp', 364.15], [365.8, 'tick'], [367.2, 'star'], [369.3, 'tick'],
  ];
  const ticksAt = t => EV.filter(([a, k]) => k === 'tick' && t >= a + .5).length;
  // 纸摞：一直不高；压缩时变成几页摘要；清纸后长结果换成一行小便签
  function layersAt(t) {
    const comp = EV.filter(([a, k]) => k === 'comp' && t >= a).length;
    const L = [['#E4DDF0', 6], ['#E4DDF0', 5]];
    const since = EV.filter(([a, k]) => k === 'comp' && t >= a).map(e => e[0]).pop() ?? 341;
    // 压缩以后读回来的进度清单
    const reads = EV.filter(([a, k, r]) => k === 'comp' && t >= r + .9).length;
    for (let i = 0; i < reads; i++) L.push(['#DCEFD6', 3]);
    // 自上次压缩以来新加的结果
    const n = Math.min(5, Math.floor((t - since) / 1.3));
    for (let i = 0; i < n; i++) L.push(i % 3 === 2 ? ['grey', 3] : ['result', i % 2 ? 4 : 2]);
    if (EV.some(([a, k]) => k === 'star' && t >= a + .5 && t - a < 6)) L.push(['#FFF1C9', 4]);
    return L;
  }

  // 机械臂去文件柜：fetch(a, b) 在 [a, b] 期间伸过去再回来；hold 拿着的东西
  function armTo(t, a, b) { const k = Math.sin(clamp((t - a) / (b - a)) * Math.PI); return [lerp(1.62, 2.5, k), lerp(-2.95, -.3, k), lerp(2.9, .35, k)]; }

  function shot(t, lt, dur) {
    const day = kf(t, [[345, 1], [350, .25], [353, 0], [360, 0], [364, .8], [368, 1]]);
    // 镜头：先拍文件柜单独一个镜头，再固定全身；最后拉远拉高
    const out = ease(seg(t, 370.2, 372.2));
    const cam = t < 341 ? [430, 640, 1.7] : t < 345 ? kf(t, [[341, [700, 640, 1.4]], [345, [880, 640, 1.22]]]) : [880, 640, 1.22];
    camBegin(cam[0], lerp(cam[1], 200, out), lerp(cam[2], .55, out));
    workRoom(t, { dayK: t < 345 ? 1 : day, cabinet: seg(t, 336.3, 338.0), ticks: ticksAt(t), star: EV.filter(([a, k]) => k === 'star').map(([a]) => Math.exp(-Math.max(0, t - a) * 3) * (t >= a ? 1 : 0)).reduce((m, v) => Math.max(m, v), t >= 343 && t < 344 ? 1 : 0) });
    // 进度文件夹、方案文件夹由光标放进去（338.5、339.2），之后拍拍柜子
    if (t >= 337.9 && t < 340.6) {
      const [cx0, cy0] = [WR.CAB[0] + 110, G - 230];
      const drop = (a, ic, dy) => { if (t >= a && t < a + .6) { const k = easeIn(seg(t, a, a + .5)); icon('folder', cx0, lerp(cy0 - 220, cy0 + dy, k), 26); icon(ic, cx0, lerp(cy0 - 220, cy0 + dy, k) + 2, 10); } };
      drop(338.4, 'star', -20); drop(339.1, 'check', 120);
      const x = kf(t, [[337.9, cx0 + 20], [338.4, cx0], [339.0, cx0 + 10], [339.6, cx0 + 40], [340.6, cx0 + 400]]), y = kf(t, [[337.9, cy0 - 230], [338.4, cy0 - 220], [339.6, cy0 - 120], [340.6, cy0 - 300]]);
      cursorHand(x, y, 2.6, { pose: t < 339.6 ? 'grab' : 'point', click: t - 339.75, key: 'u' });
    }
    if (t >= 336.0 && t < 338.0) { const k = ease(seg(t, 336.3, 338.0)); cursorHand(lerp(-500, WR.CAB[0], k) + 60, G - 300, 2.6, { pose: 'grab', key: 'u' }); }

    // Clawd：坐着干活；压缩后的反应一次比一次快
    const mood = emotions(t, [[336, 'relieved'], [341, 'neutral', { lookX: .6, lookY: .4 }], [348.7, 'confused'], [350.6, 'idea'], [352.0, 'happy'], [352.85, 'neutral', { lookY: -1 }],
      [353.6, 'neutral', { lookX: .6, lookY: .4 }], [356.5, 'confused'], [357.2, 'determined'], [359, 'neutral', { lookX: .6, lookY: .4 }], [360.45, 'neutral', { lookY: -1 }],
      [361.2, 'neutral', { lookX: .6, lookY: .4 }], [363.6, 'cool'], [369.6, 'proud']], { take: .6 });
    const cl = { ...mood, view: 'q', legK: 0, boilKey: 'clawd' };
    // 写执行单："写进文件"、每次打勾前"更新进度"、压缩后"读进度文件"
    const writes = [[341.4, 342.2]].concat(EV.filter(([a, k]) => k === 'tick').map(([a]) => [a - .7, a - .1])).concat(EV.filter(([a, k]) => k === 'comp').map(([a, k, r]) => [r - .6, r]));
    const w = writes.find(([a, b]) => t >= a && t < b);
    if (w) { cl.aR = .95 + .08 * Math.sin(t * 30); cl.armR = (u, sw) => slip('exec', .8 * u, 0, .55, .2, ['folder']); }
    // 背包机械臂：去柜子存方案、打勾、取进度清单、取星星页
    const P = { lite: LITE, sockets: 1, slot: 1, cassettes: 1, presser: 1, bin: 1 };
    const trips = [[342.2, 343.5, 'star']].concat(EV.filter(([a, k]) => k === 'tick').map(([a]) => [a - .1, a + .6, 'check']))
      .concat(EV.filter(([a, k]) => k === 'comp').map(([a, k, r]) => [r, r + .9, 'doc'])).concat(EV.filter(([a, k]) => k === 'star').map(([a]) => [a - .9, a, 'star']));
    const trip = trips.find(([a, b]) => t >= a && t < b);
    if (trip) { P.near = armTo(t, trip[0], trip[1]); P.nearHold = (u, sw) => icon(trip[2], 0, 0, .7 * u); }
    // 清纸：长结果抽走，灰纸扔进废纸篓
    const cleanEv = EV.find(([a, k]) => k === 'clean' && t >= a && t < a + 1);
    if (cleanEv) { const k = Math.sin(seg(t, cleanEv[0], cleanEv[0] + 1) * Math.PI); P.far = [lerp(1.62, -1.0, k), lerp(-2.95, -.4, k), lerp(2.9, .2, k)]; P.farHold = (u, sw) => paint(rectPts(-.4 * u, -.15 * u, 1.2 * u, .3 * u), { wash: LC.grey, ink: PAL.ink, sw: sw * .4 }); }
    const L = layersAt(t);
    agent(XS, G, U, cl, P, { layers: L, recipe: 1 }, t);
    // 压纸机：从上面砸下（三次，同一个机位）
    for (const [a, k] of EV) if (k === 'comp' && t >= a - .35 && t < a + .7) {
      const [bx, by] = clawdToWorld(XS, G, U, cl, 5.5 * U, -4.8 * U), drop = t < a ? easeIn(seg(t, a - .35, a)) : 1 - ease(seg(t, a + .2, a + .7));
      const py = lerp(by - 300, by - 30, drop);
      boilSeed('presser9'); paint(rectPts(bx + 1.45 * U - 12, py - 900, 24, 900), { wash: MC.macDk, ink: PAL.ink, sw: 1 }); paint(rrPts(bx - 14, py - 34, 2.9 * U + 28, 34, 6), { wash: MC.mac, ink: PAL.ink, sw: 1.1 });
      if (t >= a && t < a + .9) for (let i = 0; i < 3; i++) { const q = easeOut(seg(t, a, a + .9)); boilSeed('fly9' + i); paint(rectPts(bx + 40 + Math.cos(-1 + i) * 160 * q, by - 60 - Math.sin(.6 + i * .5) * 140 * q + 120 * q * q, 40, 8), { wash: LC.result, ink: PAL.ink, sw: .4 }); }
    }
    camEnd();
    // 穿过天花板：一块深色的天花板从上往下盖住画面，再切到俯视的地图
    if (t >= 371.4 && t < 372.4) { boilSeed('ceiling'); const k = easeIn(seg(t, 371.4, 372.2)); paint(rectPts(-60, -H + H * 2 * k - 60, W + 120, H + 60), { wash: '#4A3F37', ink: null }); }
  }
  // 372.4：俯视的桌游地图，工位成了一枚棋子，镜头从棋子拉开
  function map(t, lt) {
    const k = ease(seg(t, 372.4, 374));
    camBegin(lerp(760, 900, k), lerp(560, 560, k), lerp(4.5, 1.35, k));
    boardMap(t, { pawns: [{ x: 760, y: 560, kind: 'desk' }] });
    camEnd();
  }

  // 本章时间 → v001 时间：[本章起, 本章止, v001 起]；段与段之间是硬切（延时的跳剪）
  const SEG = [[0, 18.6, 336.0], [18.6, 27.5, 363.4]];
  const oldT = u => { const g = SEG.find(([a, b]) => u >= a && u < b) || SEG[SEG.length - 1]; return g[2] + (u - g[0]); };
  chapter(9, [[0, u => shot(oldT(u))]]);
})();
