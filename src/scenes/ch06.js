// ch06.js：第 6 章 · Skill：插上技能卡带（正片 31.6 秒）。
// v002：沿用 v001 的书桌和街景（时间是 v001 时间），用 SEG 表挑段；开头接上原来第 5 章结尾的书桌（空卡带壳），
// 取消"Skill"印章，改成卡带标签上的字；邮件流水线剪短；结尾停在"纸摞越来越厚"，天黑交给第 7 章。
//   0–10.5   俯视人的书桌：光标把笔记本（我们写下的步骤、之前和 Agent 一起摸索出来沉淀下的方法）折小塞进卡带壳 → 把校验小机器塞进去 → 扣上，标签"Skill" → 往上一抛
//   10.5–15.8 街上：卡带砸在 Clawd 头上弹起，机械臂接住，插进背包的卡槽（"咔"）；眼睛特写
//   15.8–20.15 小桌板：说明书页夹进纸摞；校验小机器装到小桌板前端
//   20.15–25.2 校验流水线：绿、绿、绿 → 一封编出来的格式，红叉，弹回 → Clawd 挠头
//   25.2–31.6 改好的那封过，绿；底稿放回纸摞，纸摞越来越厚
(() => {
  const G = ST.G, U = 24, XS = 1130, LITE = .3;
  const CAS = HD.cas;

  // ---------- 俯视书桌 ----------
  function desk(t, lt, dur) {
    const fold = ease(seg(t, 196.8, 197.9)), chk = ease(seg(t, 198.8, 199.9)), lid = 1 - snap(t, 201.3, .7);
    const nPos = [lerp(700, CAS[0] - 30, fold), lerp(560, CAS[1] - 10, fold)];
    const cPos = [lerp(1640, CAS[0] + 50, chk), lerp(780, CAS[1] - 6, chk)];
    // 卡带被抛起来
    const fly = easeIn(seg(t, 203.9, 204.45));
    const casY = CAS[1] - 1500 * fly;
    const fill = () => { if (fold >= 1) notebook(-30, -10, .3, -.1, 1); if (chk >= 1) checkerBox(55, -6, .55); };
    camBegin(kf(t, [[194, 960], [196, 980], [198.5, 1080], [202, 1150]]), kf(t, [[194, 570], [196, 600], [202, 600], [204.2, 540]]), kf(t, [[194, 1.2], [196, 1.45], [202, 1.7], [203.3, 1.7], [204.2, 1.5]]));
    humanDesk(t, {
      shell: 1, open: lid, casS: 1.2, fill, casPos: [CAS[0], casY], casRot: -.04 + 2.5 * fly, note: fold < 1 ? { x: nPos[0], y: nPos[1], s: lerp(1, .36, fold), rot: lerp(-.06, -.1, fold), fold } : null,
      checker: chk < 1 ? { x: cPos[0], y: cPos[1], s: lerp(1, .66, chk) } : null,
    });
    // 标签上盖"Skill"
    // 卡带标签上的字（扣上盖子后浮现；不再用印章）
    if (t >= 202.0 && t < 204.45) letter('Skill', CAS[0], CAS[1] - 22 + (casY - CAS[1]), 46, PALX.stampInk, { ink: false, rot: -.04, alpha: seg(t, 202.0, 202.35), font: CAP_FONT(46) });
    // 光标：抓笔记本 → 抓小机器 → 扣盖子 → 抓起卡带往上一抛
    const x = kf(t, [[194, 1500], [195.7, 1120], [196, 1120], [196.7, 700], [196.8, 700], [197.9, CAS[0] - 30], [198.3, 1600], [198.8, 1640], [199.9, CAS[0] + 50], [200.4, CAS[0]], [200.8, CAS[0]], [202.0, CAS[0]], [203.3, CAS[0] + 40], [203.9, CAS[0] + 40], [204.4, CAS[0] + 60]]);
    const y = kf(t, [[194, 820], [195.7, 660], [196, 660], [196.7, 560], [196.8, 560], [197.9, CAS[1] - 10], [198.3, 760], [198.8, 780], [199.9, CAS[1] - 6], [200.4, CAS[1] - 260], [200.8, CAS[1] - 260], [202.0, CAS[1] - 40], [203.3, CAS[1]], [203.9, CAS[1]], [204.4, -200]]);
    const pose = (t > 196.8 && t < 197.95) || (t > 198.8 && t < 199.95) || (t > 200.8 && t < 202.0) || t > 203.4 ? 'grab' : 'point';
    // 抓着东西的时候，光标就是那样东西的位置（同一条运动曲线），看起来才跟手
    let hx = x, hy = y;
    if (t > 196.8 && t < 197.9) [hx, hy] = nPos;
    else if (t > 198.8 && t < 199.9) [hx, hy] = cPos;
    else if (t > 200.8 && t < 202.0) { hx = CAS[0]; hy = lerp(CAS[1] - 260, CAS[1] - 40, 1 - lid); }   // 按着盖子往下合
    else if (t > 203.9 && t < 204.45) { hx = CAS[0] + 40 + 20 * fly; hy = casY; }                      // 抓着卡带往上抛
    cursorHand(hx, hy, 3, { pose, key: 'u' });
    camEnd();
  }

  // ---------- 街上 ----------
  const CK = [[204.5, [1250, 640, 1.5]], [205.6, [1250, 640, 1.5]], [206.6, [1060, 640, 2.4]], [207.4, [1000, 640, 3.6]], [208.15, [1000, 640, 3.7]], [208.2, [1172, 730, 4.6]], [211.0, [1172, 730, 4.6]],
    [211.05, [1305, 712, 3.0]], [213.5, [1305, 712, 3.0]], [214.3, [1280, 680, 2.0]], [215.4, [1400, 735, 3.4]], [219.75, [1400, 735, 3.4]], [219.8, [1160, 740, 2.8]], [221.9, [1160, 740, 2.8]],
    [221.95, [1400, 735, 3.4]], [224.6, [1400, 735, 3.4]], [226.6, [1305, 712, 3.4]], [228.6, [1240, 680, 2.2]], [234, [1240, 650, 2.1]]];
  const EMAILS = [216.0, 216.5, 217.0, 217.5, 218.0, 222.2, 222.7, 223.2, 223.7];   // 每封邮件到达校验机的时刻（第 5 封是编出来的）
  function street(t, lt) {
    const [cx, cy, z] = kf(t, CK), ss = t > 208 ? shakeXY(t, 8 * Math.exp(-(t - 208) * 9)) : [0, 0];
    streetSky();
    camBegin(cx + ss[0], cy + ss[1], z);
    streetBG(t, cx);
    building(BLD.archive, t, 1); building(BLD.map, t, 1); building(BLD.browser, t, 1);
    // 天色暗下来（接第 7 章）
    const dusk = ease(seg(t, 230.5, 234));
    if (dusk > 0) { boilSeed('dusk'); paint(rectPts(-1000, -800, 5000, 3000), { wash: '#1B1F35', washOp: 235 * dusk, ink: null }); }

    const mood = emotions(t, [[204.5, 'neutral', { lookY: -.6 }], [205.05, 'dizzy'], [205.9, 'surprised', { lookX: -.8, lookY: -.8 }], [208.2, 'starstruck'], [210.6, 'happy'],
      [211.6, 'neutral', { lookX: .8, lookY: .4 }], [215.4, 'proud'], [218.25, 'surprised', { lookX: .9 }], [219.85, 'shy'], [221.95, 'neutral', { lookX: .9 }], [222.3, 'happy'],
      [228.6, 'surprised', { lookX: .5, lookY: -1 }], [230.5, 'nervous']], { take: .7 });
    const cl = { ...mood, view: 'q', boilKey: 'clawd', dy: (mood.dy || 0) * .6 };
    if (t >= 205.0 && t < 205.6) Object.assign(cl, { sq: (cl.sq || 0) + .2 * Math.exp(-(t - 205) * 8) });
    if (t >= 219.85 && t < 221.9) { cl.aR = 1.5 + .15 * Math.sin(t * 22); }   // 挠头
    // 背包：卡带槽从 205.6 起出现；208 插进去
    const g = packGeom(U, LITE), topL = g.by - 430 * g.s;
    const slotW = clawdToWorld(XS, G, U, cl, g.bx - 120 * g.s + 1.3 * U, topL - .5 * U);
    const reach = t >= 205.3 && t < 208.1;
    const P = { lite: LITE, sockets: 1, slot: t >= 205.6, cassettes: t >= 208.0 ? 1 : 0 };
    if (reach) {
      // 近侧机械臂：先伸到左上接住卡带，再把它送到卡槽上方
      const k1 = ease(seg(t, 205.3, 205.6)), k2 = ease(seg(t, 206.0, 207.5));
      P.near = [lerp(1.62, -1.6, k1) + lerp(0, 1.0, k2), lerp(-2.95, .2, k1) + lerp(0, .9, k2), lerp(2.9, .6, k1) + lerp(0, .5, k2)];
      if (t >= 205.6) P.nearHold = (u, sw) => cassette(0, 0, .16 * u / 24 * 1.4, { rot: -1.2, col: '#7E6BB0', key: 'held', label: () => {} });
    }
    const L = TRAY.c6.slice(0, TRAY.c5.length + (t >= 212.0 ? 1 : 0) + (t >= 225.5 ? 2 : 0) + (t >= 229.5 ? 3 : 0));
    // 校验小机器的灯
    let light = null;
    for (const [i, e] of EMAILS.entries()) if (t >= e + .1 && t < e + .45) light = i === 4 ? 'ng' : 'ok';
    if (t >= 218.1 && t < 219.6) light = 'ng';
    agent(XS, G, U, cl, P, { layers: L, recipe: 1, checker: t >= 214.2 ? { light } : null }, t);
    // 卡带从上面掉下来，砸在头上，弹起
    if (t >= 204.6 && t < 205.6) {
      const head = clawdToWorld(XS, G, U, cl, .6 * U, -8.4 * U);
      const p = t < 205.0 ? [head[0], lerp(head[1] - 700, head[1], easeIn(seg(t, 204.6, 205.0)))] : arcPt(head, [XS - 7.5 * U, G - 11 * U], 110, easeOut(seg(t, 205.0, 205.6)));
      cassette(p[0], p[1], .2, { rot: t * 7, key: 'fall', label: () => {} });
      if (t >= 205.0) emote('stars', head[0], head[1] - 10, 18, seg(t, 205.0, 205.1), t - 205.0);
    }
    // 插进卡槽的那一下：一圈光
    if (t >= 208.0 && t < 208.4) glow(slotW[0], slotW[1], 120 * (1 - seg(t, 208, 208.4)), '#FFE6A0', .9);
    // 说明书页从卡槽飞进纸摞
    if (t >= 211.4 && t < 212.0) { const k = ease(seg(t, 211.4, 212.0)), dst = clawdToWorld(XS, G, U, cl, 6.9 * U, -7 * U), p = arcPt(slotW, dst, 120, k); boilSeed('skillpage'); paint(rectPts(p[0] - 30, p[1] - 6, 60, 12), { wash: LC.skill, ink: PAL.ink, sw: .6 }); }
    // 邮件：从纸摞顶上出来，经过校验小机器往右送出去；编出来的那封被弹回
    const outA = clawdToWorld(XS, G, U, cl, 7.5 * U, -6.4 * U), chkW = clawdToWorld(XS, G, U, cl, 10.2 * U, -5.4 * U);
    EMAILS.forEach((e, i) => {
      const fake = i === 4;
      if (t < e - .3 || t > e + (fake ? 1.65 : .7)) return;
      let p;
      if (t < e) p = [lerp(outA[0], chkW[0], ease(seg(t, e - .3, e))), lerp(outA[1], chkW[1] - 30, ease(seg(t, e - .3, e)))];
      else if (!fake) p = [chkW[0] + 320 * easeIn(seg(t, e + .15, e + .7)), chkW[1] - 30];
      else p = t < e + 1.0 ? [chkW[0] + 6 * Math.sin((t - e) * 40) * (t > e + .2 ? 1 : 0), chkW[1] - 30] : [lerp(chkW[0], outA[0] - 20, ease(seg(t, e + 1.0, e + 1.6))), chkW[1] - 30 - 60 * Math.sin(seg(t, e + 1.0, e + 1.6) * Math.PI)];
      boilSeed('mail' + i);
      icon('mail', p[0], p[1], 22);
      if (fake) inkLine([[p[0] - 10, p[1] + 4], [p[0] - 4, p[1] - 2], [p[0] + 2, p[1] + 5], [p[0] + 9, p[1] - 3]], .9, NG_RED, 'inkfine', .3);   // 编出来的地址格式
    });
    // 改好的那封的底稿：作为一页结果放回纸摞顶上
    if (t >= 224.6 && t < 225.6) { const k = ease(seg(t, 224.6, 225.5)), dst = clawdToWorld(XS, G, U, cl, 6.9 * U, -7.4 * U), p = arcPt([chkW[0] + 30, chkW[1] - 30], dst, 80, k); boilSeed('draft'); paint(rectPts(p[0] - 32, p[1] - 6, 64, 12), { wash: LC.result, ink: PAL.ink, sw: .6 }); }
    camEnd();
    boilSeed('transition');
  }

  // 本章时间 → v001 时间：[本章起, 本章止, v001 起]；段与段之间是硬切。v001 的 193–196 是第 5 章结尾的书桌，这里从 194 接上
  const SEG = [[0, 15.8, 194.0], [15.8, 20.15, 211.05], [20.15, 24.0, 215.9], [24.0, 25.2, 219.8], [25.2, 31.6, 221.95]];
  const oldT = u => { const g = SEG.find(([a, b]) => u >= a && u < b) || SEG[SEG.length - 1]; return g[2] + (u - g[0]); };
  chapter(6, [[0, u => { const t = oldT(u); if (t < 204.5) desk(t); else street(t); }]]);
})();
