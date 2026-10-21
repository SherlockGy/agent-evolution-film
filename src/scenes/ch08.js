// ch08.js：第 8 章 · 压缩与子 Agent（正片 38.3 秒）。夜。
// v002：沿用 v001（时间是 v001 时间），用 SEG 表挑段；小 Clawd 在街上忙只留两个镜头；"子 Agent"印章改成背包上的清楚字；
// 结尾停在"压缩还会再来"，工位交给第 9 章。
//   0–13.8   纸摞太高、快撑不住；光标给背包装上压纸机；压纸机砸下，企业卡片那页飘进废纸篓；问公司在哪，摘要里找不到，又编一个地址
//   13.8–22.4 过渡（压缩会丢东西，另一招：少往纸摞里放）→ 新任务：写派工单，小 Clawd 们从烟囱里蹦出来，跑上街
//   22.4–27.4 小 Clawd 们在街上忙（两个镜头），各自的小桌板上灰黄脏纸越堆越高
//   27.4–38.3 排队回来，一个接一个把一页干净的纸扔进烟囱；主纸摞只多了几页干净的
(() => {
  const G = ST.G, U = 30, XS = 1130, LITE = .35, NIGHT = '#1B1F35';
  const SLAM = 294.0;
  const TALL = TRAY.c6.concat([['#F6E7A6', 5], ['#F6E7A6', 5], ['grey', 4], ['old', 4], ['#F6E7A6', 5], ['grey', 4], ['#F6E7A6', 5]]);
  const SUMMARY = [['#E4DDF0', 7], ['#E4DDF0', 6], ['#E4DDF0', 6]];
  const MINIS = [{ u: 13, out: 306.6, land: 1420, key: 'm1' }, { u: 11, out: 307.0, land: 1530, key: 'm2' }, { u: 14, out: 307.45, land: 1660, key: 'm3' }, { u: 12, out: 307.9, land: 1780, key: 'm4' }];
  const RETURN = [323.0, 324.0, 325.0, 326.0];      // 每个小 Clawd 扔纸进烟囱的拍点

  const stackGeom = cl => { const [bx, by] = clawdToWorld(XS, G, U, cl, 5.4 * U, -4.8 * U); return { bx, by, w: 3.4 * U, s: 1.5 * .7 * U / 24 }; };
  const packW = (cl, lx, ly) => clawdToWorld(XS, G, U, cl, lx, ly);
  function packPts(cl) {
    const g = packGeom(U, LITE);
    return { chimney: packW(cl, g.bx - 130 * g.s, g.by - 540 * g.s), bin: packW(cl, g.bx - 190 * g.s - .85 * U, g.by - 1.6 * U) };
  }

  // ---------- A：压缩、又编了一个、派出小 Clawd、它们回来 ----------
  function main(t, lt) {
    const back = t >= 322;    // 322 以后是"排队回来"的段落
    const mood = emotions(t, [[290, 'scared', { lookX: .8, lookY: -1 }], [SLAM + .05, 'surprised'], [295.0, 'confused', { lookX: -.8 }], [296.4, 'neutral', { lookX: .8, lookY: .3 }],
      [297.4, 'thinking', { lookX: .7, lookY: .5 }], [299.2, 'confused'], [300.4, 'neutral', { eyes: 'narrow', lookX: .7 }], [301.4, 'proud'], [304, 'determined'], [306.5, 'surprised', { lookX: -.6, lookY: -1 }],
      [307.6, 'happy'], [322, 'neutral', { lookX: .9 }], [323.1, 'happy'], [330, 'relieved']], { take: .7 });
    const cl = { ...mood, view: 'q', boilKey: 'clawd', dy: (mood.dy || 0) * .4 };
    const writing = [[300.6, 302.0], [304.8, 306.3]].find(([a, b]) => t >= a && t < b);
    if (writing) { cl.aR = .95 + .1 * Math.sin(t * 28); cl.armR = (u, sw) => slip(t < 304 ? 'answer' : 'exec', .8 * u, 0, .55, .2, t < 304 ? null : ['search']); }
    const sg = stackGeom(cl), pp = packPts(cl);
    // 纸摞：砸下之前是高高的一摞（还在晃），砸下以后只剩几页摘要；小 Clawd 们回来以后多几页干净的
    const L = t < SLAM ? TALL : SUMMARY.concat(RETURN.filter(r => t >= r + .35).map(() => ['result', 4]));
    const sumL = sumH(L), top = sg.by - sumL * sg.s * 1.25;
    const cam = kf(t, [[290, [sg.bx + 30, (sg.by + top) / 2 - 20, 2.2]], [293.6, [sg.bx + 30, top + 60, 2.3]], [294.6, [sg.bx - 60, sg.by - 120, 1.9]], [296.0, [sg.bx - 80, sg.by - 100, 1.9]],
      [296.4, [sg.bx - 60, sg.by - 120, 2.8]], [302.4, [sg.bx - 60, sg.by - 120, 2.8]], [304, [sg.bx - 200, sg.by - 160, 1.6]], [306.3, [sg.bx - 240, sg.by - 200, 1.4]], [309.5, [sg.bx + 80, sg.by - 160, 1.25]],
      [312, [sg.bx + 200, sg.by - 160, 1.2]], [322, [sg.bx + 160, sg.by - 160, 1.25]], [327, [sg.bx, sg.by - 180, 1.35]], [329.6, [sg.bx + 30, sg.by - 60, 2.6]], [333, [sg.bx + 30, sg.by - 60, 2.6]]]);
    const ss = t > SLAM ? shakeXY(t, 14 * Math.exp(-(t - SLAM) * 8)) : [0, 0];
    camBegin(cam[0] + ss[0], cam[1] + ss[1], cam[2]);
    nightStreet(t, cam[0]);
    if (t < 289.4) { boilSeed('fadein8'); paint(rectPts(-2000, -1000, 8000, 3000), { wash: NIGHT, washOp: 255 * (1 - ease(seg(t, 289.0, 289.4))), ink: null }); }   // 标题卡之后很快淡入
    glow(sg.bx + sg.w / 2, top - 10, 300, MC.lamp, .45);

    // 背包：压纸机和废纸篓（光标在 291 把它们装上）
    const P = { lite: LITE, sockets: 1, slot: 1, cassettes: 1, presser: t >= 292.4, bin: t >= 292.4 };
    // 派小 Clawd 时：机械臂托着
    agent(XS, G, U, cl, P, { layers: [], lamp: false, recipe: 1 }, t);
    const sway = t < SLAM ? .07 * Math.sin((t - 284.5) * 7) : 0;
    push(); translate(sg.bx + sg.w / 2, sg.by); rotate(sway); translate(-(sg.bx + sg.w / 2), -sg.by);
    const st = paperStack(sg.bx, sg.by, sg.w, sg.s, 'ch8stack', L, { dim: t < SLAM ? (i, n) => clamp(((n - 1 - i) / (n - 1) - .12) / .55) * .85 : null });
    pop();
    { const [lx, ly] = clawdToWorld(XS, G, U, cl, 9 * U - .37 * U, -4.8 * U), bulb = deskLamp(lx, ly, .55 * U / 24, 1); glow(...bulb, 25 * U / 24, MC.lamp, .9); }

    // 压纸机：从上面压下来（一块厚板 + 一根活塞），砸下后抬起
    if (t >= 292.4 && t < 296) {
      const drop = t < SLAM ? easeIn(seg(t, 293.5, SLAM)) : 1 - ease(seg(t, SLAM + .5, SLAM + 1.3));
      const py = lerp(top - 220, sg.by - sumH(SUMMARY) * sg.s * 1.25, drop), pw = sg.w + 40;
      boilSeed('presser');
      paint(rectPts(sg.bx + sg.w / 2 - 16, py - 900, 32, 900), { wash: MC.macDk, ink: PAL.ink, sw: 1 });
      paint(rrPts(sg.bx - 20, py - 46, pw, 46, 8), { wash: MC.mac, ink: PAL.ink, sw: 1.2 });
    }
    // 光标把压纸机装上去
    if (t >= 290.6 && t < 292.6) { const k = ease(seg(t, 290.6, 292.3)); cursorHand(lerp(sg.bx + 400, pp.chimney[0] + 20, k), lerp(sg.by - 500, pp.chimney[1] - 20, k), 2.4, { pose: 'grab', key: 'u', hold: (s, sw) => paint(rrPts(-10 * s, -2 * s, 20 * s, 7 * s, 2 * s), { wash: MC.mac, ink: PAL.ink, sw }) }); }
    // 压缩时飞出去的几页；企业卡片那页放慢，从右往左飘进废纸篓
    if (t >= SLAM && t < 297) {
      for (let i = 0; i < 4; i++) { const k = easeOut(seg(t, SLAM, SLAM + .9)), a = -.8 + i * .5; boilSeed('flyp' + i); const x = sg.bx + sg.w / 2 + Math.cos(a) * 260 * k, y = top - 40 - Math.sin(-a) * 200 * k + 300 * k * k * .4; if (k < 1) paint(rectPts(x - 26, y - 5, 52, 10), { wash: [LC.result, LC.dialog, LC.tools, '#F6E7A6'][i], ink: PAL.ink, sw: .5 }); }
      const kc = ease(seg(t, SLAM + .1, 296.4)), p = arcPt([sg.bx + sg.w / 2, sg.by - 80], pp.bin, -140, kc);
      if (kc < 1) { push(); translate(p[0], p[1]); rotate(Math.sin(t * 3) * .4); flyCard(0, 0, 70, 44, 71, false, 0); icon('building', -16, 0, 11, { col: BLD.archive.col }); icon('pin', 16, 0, 9); pop(); }
    }
    // 问题单落到纸摞上；翻摘要时一页页掀起
    if (t >= 296.4 && t < 297.2) { const k = easeIn(seg(t, 296.4, 297.1)); slip('question', sg.bx + sg.w / 2, lerp(top - 300, top - 30, k), .9, .2 * (1 - k), ['building', 'question']); }
    if (t >= 297.4 && t < 299.2) { const ph = frac((t - 297.4) / .45); boilSeed('flip'); push(); translate(sg.bx + 6, top); rotate(-Math.PI * ph); paint(rectPts(0, -4, sg.w - 10, 6), { wash: '#E4DDF0', ink: PAL.ink, sw: .5 }); pop(); }
    if (t >= 299.2 && t < 300.4) emote('?', sg.bx + sg.w + 20, top - 20, 12, seg(t, 299.2, 299.5), t - 299.2);
    // 又编了一个：一张写着地址的回答，"一本正经"
    if (t >= 302.0 && t < 302.6) { const k = easeIn(seg(t, 302.0, 302.6)), [ox, oy] = clawdToWorld(XS, G, U, cl, 10 * U, -5.6 * U); slip('answer', ox + 300 * k, oy - 200 * k, .9, .3 * k, ['pin']); }

    // 小 Clawd 们：从烟囱里沿弧线蹦出来，落在 Clawd 右边，然后跑出画面
    for (const [i, m] of MINIS.entries()) {
      if (t < m.out || t >= 312) continue;
      const k = seg(t, m.out, m.out + .55);
      const p = k < 1 ? arcPt(pp.chimney, [m.land, G], 220, easeOut(k)) : [m.land + 900 * easeIn(seg(t, 310 + i * .2, 312)), G];
      const run = t > 310 + i * .2;
      miniAgent(p[0], p[1], m.u, { ...feel(run ? 'excited' : 'happy', t, { seed: i }), view: run ? 'side' : 'q', walk: run ? t * 3 + i : null, sq: k < 1 ? -.2 * Math.sin(k * Math.PI) : 0 }, t, { key: m.key });
      if (i === 1 && t >= 309.5) { const g = packGeom(m.u, .8), [sx, sy] = [p[0] + g.bx + 0 * g.s, p[1] + g.by - 260 * g.s]; letter('子 Agent', sx, sy - 50, 18, PAL.cream, { ink: false, alpha: seg(t, 309.5, 309.8), font: CAP_FONT(18) }); }   // 背包上的字（不再用印章）
    }
    // 回来：排成一队从右边走回来，一个接一个把干净的那页扔进烟囱
    if (back) {
      RETURN.forEach((r, i) => {
        const m = MINIS[i], qx = 1400 + i * 120, arrive = 322 + i * .25, x = lerp(qx + 900, qx, ease(seg(t, arrive - .8, arrive + .3))) - (t > r + .3 ? 0 : 0);
        const walking = t < arrive + .3, jump = jump2(t, r - .25, r + .1);
        miniAgent(x, G, m.u, { ...feel(t > r ? 'proud' : 'happy', t, { seed: i }), view: walking ? 'side' : 'q', flip: walking, walk: walking ? t * 3 + i : null, dy: jump.dy, sq: jump.sq }, t, { key: m.key, tray: [['grey', 6], ['old', 5], ['grey', 6], ['old', 6], ['grey', 5]] });
        if (t >= r - .1 && t < r + .35) { const k = ease(seg(t, r - .1, r + .35)), pg = arcPt([x + 20, G - 9 * m.u], pp.chimney, 160, k); boilSeed('clean' + i); paint(rectPts(pg[0] - 22, pg[1] - 5, 44, 10), { wash: LC.result, ink: PAL.ink, sw: .6 }); }
      });
    }
    camEnd();
    boilSeed('transition');
  }
  const jump2 = (t, a, b) => jump(t, a, b, 2.4);

  // ---------- B：小 Clawd 们在街上忙（快切），各自的小桌板上脏纸越堆越高 ----------
  const BUSY = [[312, BLD.archive, 0], [314.5, BLD.map, 1], [317, BLD.browser, 2], [319.5, BLD.archive, 3]];
  function busy(t, lt) {
    const [t0, B, i] = BUSY.reduce((a, b) => t >= b[0] ? b : a, BUSY[0]);
    const m = MINIS[i], x = B.sock[0] - 140, a = t - t0, mu = m.u * 1.15;
    camBegin(x + 60, G - 150, 2.3);
    nightStreet(t, x);
    const n = Math.min(12, Math.floor(a * 5.5)), dirty = []; for (let k = 0; k < n; k++) dirty.push([k % 2 ? 'old' : 'grey', 5 + (k % 3)]);
    cable(clawdToWorld(x, G, mu, {}, -6 * mu, -6 * mu), B.sock, 30, 1);
    miniAgent(x, G, mu, { ...feel(a > 1.6 ? 'dizzy' : 'determined', t, { seed: i }), view: 'q' }, t, { key: m.key, tray: dirty.length ? dirty : [['grey', 2]], trayS: 2.2 });
    { const g = packGeom(mu, .8); letter('子 Agent', x + g.bx, G + g.by - 260 * g.s - 20, 13, PAL.cream, { ink: false, font: CAP_FONT(13) }); }
    // 一张张脏纸从楼里飞到它的小桌板上
    const ph = frac(a * 4.5); if (a < 2.2) { const p = arcPt(B.sock, clawdToWorld(x, G, mu, {}, 7 * mu, -9 * mu), 80, ph); boilSeed('dirty fly'); paint(rectPts(p[0] - 14, p[1] - 4, 28, 8), { wash: ph > .5 ? LC.old : LC.grey, ink: PAL.ink, sw: .5 }); }
    camEnd();
    for (const c of [314.5, 317, 319.5]) whipLines(seg(t, c - .12, c + .12), '#8E9AAF');
  }

  // ---------- C：笔刷擦到工位：Clawd 在一个工位前坐下，旁边空着一块 ----------
  function sitDown(t, lt) {
    workRoom(t, { cabinet: 0, dayK: 1 });
    const sit = ease(seg(t, 333.4, 334.4));
    agent(WR.CX, WR.G, 26, { ...feel('relieved', t), view: 'q', legK: 1 - sit, boilKey: 'clawd' }, { lite: .35, sockets: 1, slot: 1, cassettes: 1, presser: 1, bin: 1 }, { layers: [['#E4DDF0', 7], ['#E4DDF0', 6], ['result', 4], ['result', 4], ['result', 4], ['result', 4]], recipe: 1 }, t);
    boilSeed('transition'); if (lt < .3) brushWipe(.5 + lt / .6, ['#5F6A82', '#8E9AAF']);
  }

  // 本章时间 → v001 时间：[本章起, 本章止, v001 起]；段与段之间是硬切（v001 的工位 333–336 交给第 9 章）
  // v002 样片反馈：从 289 开始（先看一眼快撑不住的纸摞，再装压纸机）；第二段从 303 开始，留出"压缩会丢东西，另一招"的过渡
  const SEG = [[0, 13.8, 289.0], [13.8, 22.4, 303.0], [22.4, 24.9, 312.0], [24.9, 27.4, 317.0], [27.4, 38.3, 322.0]];
  const oldT = u => { const g = SEG.find(([a, b]) => u >= a && u < b) || SEG[SEG.length - 1]; return g[2] + (u - g[0]); };
  chapter(8, [[0, u => { const t = oldT(u); if (t >= 312 && t < 322) busy(t); else main(t); for (const [a] of SEG) if (a > 0) whipLines(seg(u, a - .12, a + .12), '#8E9AAF'); }]]);
})();
