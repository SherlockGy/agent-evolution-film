// ch14.js：第 14 章 · 能力边界和装备（正片 41 秒）。淡紫灰的雾，明亮。
// v002：沿用 v001（时间是 v001 时间），用 SEG 表挑段：照菜谱拘谨翻页那段剪短，其余不变。
//   0–3.4    前提：模型一代比一代强，Clawd 亮了一下，边界线自己往外移、雾退了一段（v002 反馈：这一章的变化都建立在模型变强上，要先说）
//   3.4–13   全身镜头（镜头不动）：Clawd 走到雾前的边界线；光标插上新卡带、接上新线缆，边界线往右推两次（各约 1.2 秒），
//            扫过固定在地上的任务图标，扫过的变彩色；旧边界留淡虚线，扩出来的地面染浅黄
//   9–19     后来模型又变强了（Clawd 亮一下）；小桌板变灶台：光标还递来当初的厚菜谱，Clawd 照着翻，又慢又拘谨；卸下菜谱、换成一张点菜单，Clawd 放开手做，端出的菜更好
//   19–25    俯视手部特写：从卡带里抽出一大叠说明，只剩一张薄卡
//   25–31    新旧背包并排；Clawd 背上新背包，轻轻一跳
//   31–37    光标在边界地图上把线往外画一圈；Clawd 走进雾里，雾退开；光标拿着一张点菜单，推到纸上
(() => {
  const G = 880, U = 26, FOG = '#CEC7DB';
  const OLD = { lite: .7, sockets: 1, slot: 1, cassettes: 3 };
  const NEW = { lite: 1, sockets: 1, slot: 1, cassettes: 4 };
  const TR = [['#E4DDF0', 5], ['#DCEFD6', 3]];

  // 雾里的任务（图标、世界坐标 x）：模型变强扫过第 1 个，两次装备各扫过一个，最后走进雾里时再扫过后面的
  const TASKS = [['building', 960], ['map', 1220], ['code', 1450], ['cat', 1700], ['chair', 1900], ['mail', 2120]];
  // ghosts：边界以前待过的位置（淡虚线留痕），和现在的边界之间的地面淡淡染一层，看得出"往外扩了多少"
  function fogField(t, cx, bx, clear = 0, ghosts = []) {
    boilSeed('fog sky'); paint(rectPts(-60, -60, W + 120, H + 120), { wash: '#E9E4EF', ink: null });
    camBegin(cx, 600, 1.15);
    boilSeed('fog ground'); paint(rectPts(-3000, G, 9000, 600), { wash: '#D9D2C2', ink: null }); for (let x0 = -3000; x0 < 6000; x0 += 1000) inkLine([[x0, G], [x0 + 1000, G + 1]], .8, PAL.ink, 'ink', .5);
    if (ghosts.length && bx - ghosts[0] > 4) { boilSeed('gained'); paint(rectPts(ghosts[0], G + 3, bx - ghosts[0], 600), { wash: '#E6DCB8', ink: null }); }
    // 雾：边界线右边一堵淡紫灰的雾墙（底色 + 一层层水彩，无描边、顶点不抖），雾散时往右退开
    const fx = bx + 1400 * clear;
    boilSeed('fog');
    paint(rectPts(fx + 40, -400, 4000, G + 400), { wash: '#D6CFE2', washOp: 255 * (1 - clear * .9), ink: null });
    for (let i = 0; i < 6; i++) paint(ellPts(fx + 60 + i * 340, G - 240 + 90 * Math.sin(i * 2), 360, 420, 30, 0), { fill: FOG, fillOp: 230 * (1 - clear), bleed: .35, tex: .5, ink: null });
    paint(ellPts(fx + 30, G - 300, 120, 520, 24, 0), { fill: '#E3DDEB', fillOp: 200 * (1 - clear), bleed: .4, tex: .4, ink: null });
    // 任务图标：固定在地上（v004 反馈：原来跟着边界一起移，观众拿它当参照物，看不出边界在动）
    // 还在雾里的是灰的；边界扫过去，它弹一下、变成彩色——现在它能做了
    TASKS.forEach(([ic, x], i) => {
      const y = G - 300 - 60 * hash(i + 4), d = bx - x;   // 高过 Clawd 头顶，它走到边界上时不挡图标
      if (d <= 0) return icon(ic, x, y, 64, { col: '#C3BBD3', ink: '#A9A0BC' });
      icon(ic, x, y, 64 * (1 + .3 * Math.sin(Math.PI * clamp(d / 140))));
    });
    // 边界线：一条竖着的等粗虚线；以前的位置留一条更淡更细的虚线
    boilSeed('bline');
    for (const gx of ghosts) if (Math.abs(gx - bx) > 20) dashPath([[gx, G - 4], [gx, G - 420]], 1.8, '#B9ADCF', 18, 14);
    dashPath([[bx, G - 4], [bx, G - 420]], 3, '#7B5CA8', 18, 14);
    letter('能力边界', bx, G - 450, 22, '#7B5CA8', { ink: false, font: CAP_FONT(22) });   // 线是什么，直接写在线上方
  }

  // ---------- 552–562：边界、给装备 ----------
  function edge(t, lt) {
    // 边界每次往外推约 1.2 秒，看得清它扫过任务图标；推完 Clawd 再跟上去
    const bx = kf(t, [[552, 1100], [557.3, 1100], [558.5, 1330], [560.2, 1330], [561.3, 1560]]);
    const x = kf(t, [[552, 520], [554.4, 1000], [558.3, 1000], [559.0, 1230], [560.9, 1230], [561.6, 1460]]);
    const moving = (t > 552 && t < 554.4) || (t > 558.3 && t < 559.0) || (t > 560.9 && t < 561.6);
    // 镜头不动（v004 反馈：镜头、Clawd、边界一起右移，看起来边界没变）；以前的边界位置留淡线
    fogField(t, 1100, bx, 0, [820, ...[[557.3, 1100], [560.2, 1330]].filter(([a]) => t >= a).map(([, x]) => x)]);
    const mood = emotions(t, [[552, 'hopeful'], [554.5, 'neutral', { lookX: .8 }], [556.7, 'surprised'], [557.4, 'excited'], [559.2, 'happy'], [561.5, 'hopeful']], { take: .6 });
    const cl = { ...mood, view: moving ? 'side' : 'q', walk: moving ? t * 3 : null, boilKey: 'clawd' };
    const P = { ...OLD, cassettes: t >= 556.6 ? 4 : 3 };
    const cab = t >= 559.0 ? 1 : 0;
    agent(x, G, U, cl, P, { layers: TR, recipe: 2 }, t);
    if (cab) cable(clawdToWorld(x, G, U, cl, -6 * U, -5 * U), [x - 400, G - 40], 60, 1);
    // 光标：插卡带、接线缆
    if (t >= 555.6 && t < 557) { const k = ease(seg(t, 555.6, 556.5)), [sx, sy] = clawdToWorld(x, G, U, cl, -6 * U, -8.6 * U); push(); translate(lerp(sx - 200, sx, k), lerp(sy - 200, sy, k)); boilSeed('newcas'); paint(rrPts(-16, -12, 32, 24, 4), { wash: CAS_COLS[5], ink: PAL.ink, sw: .6 }); pop(); cursorHand(lerp(sx - 190, sx + 10, k), lerp(sy - 190, sy + 10, k), 2.4, { pose: 'grab', key: 'u' }); }
    if (t >= 558.2 && t < 559.4) { const k = ease(seg(t, 558.2, 559.0)), [sx, sy] = clawdToWorld(x, G, U, cl, -6 * U, -5 * U); cursorHand(lerp(x - 500, sx, k), lerp(G - 300, sy, k), 2.4, { pose: 'grab', key: 'u' }); }
    camEnd();
  }

  // ---------- 562–574：菜谱收网 ----------
  function cook(t, lt) {
    const free = t >= 570.0;
    const shake = [0, 0];   // 放开手做：从容地做，镜头不抖
    boilSeed('kitchen'); paint(rectPts(-60, -60, W + 120, H + 120), { wash: '#F1E4CF', ink: null });
    paint(ellPts(W / 2, H * .4, W * .6, H * .5, 30, 0), { fill: '#FFF2DC', fillOp: 120, bleed: .3, tex: .5, ink: null });
    camBegin(980 + shake[0], 620 + shake[1], 1.6);
    boilSeed('k floor'); paint(rectPts(-1000, G, 4000, 400), { wash: '#D9C3A0', ink: null });
    // 灶台（小桌板的化身）
    const sx = 980, top = 760;
    boilSeed('stove14'); paint(rectPts(sx - 60, top, 380, G - top), { wash: '#C98F5E', ink: PAL.ink, sw: 1 }); paint(rectPts(sx - 70, top - 14, 400, 18), { wash: '#E7B47E', ink: PAL.ink, sw: 1 });
    glow(sx + 90, top, 70, '#FF9A4A', .7, .05);
    boilSeed('pan14'); paint([[sx + 30, top - 44], [sx + 150, top - 44], [sx + 140, top - 16], [sx + 40, top - 16]], { wash: '#3D3A4A', ink: PAL.ink, sw: 1 });
    const toss = free && t < 573 ? .45 * Math.abs(Math.sin((t - 570) * TAU * .9)) : 0;   // 颠一下锅，不乱跳
    for (let i = 0; i < 6; i++) paint(ellPts(sx + 50 + (i % 3) * 30, top - 50 - Math.floor(i / 3) * 10 - 70 * toss * (.6 + .4 * hash(i)), 12, 9, 8), { wash: ['#E58F5B', '#8DBF6A', '#F2C14E'][i % 3], ink: PAL.ink, sw: .5 });
    // Clawd：戴着厨师帽；照菜谱时一下一下、手几次想自己调味又缩回；拿到点菜单以后放开做
    const mood = emotions(t, [[562, 'excited'], [562.9, 'neutral', { lookX: .7, lookY: .3 }], [563.4, 'nervous', { lookX: .7, lookY: .4 }], [568.6, 'surprised'], [569.6, 'hopeful'], [570.0, 'happy'], [573.2, 'proud']], { take: .7 });
    const cl = { ...mood, view: 'q', hat: 'chef', boilKey: 'clawd' };
    if (t < 568) { const ph = frac((t - 563) / 1.4); cl.aR = .3 + .4 * (ph < .5 ? ease(ph * 2) : 1 - ease((ph - .5) * 2)) ; if (ph > .7 && ph < .85) cl.aR = .9; }   // 想伸出去又缩回
    if (free && t < 573) { cl.aR = .9 + .25 * Math.sin(t * 7); cl.aL = .1; }   // 一手稳稳地翻炒
    const tt = t;
    // 后来，模型又变强了：和开头的前提一样，Clawd 身上亮一下（同一种画法表示"变强"）
    const glowK = Math.sin(seg(t, 562.0, 563.2) * Math.PI);
    if (glowK > 0) glow(760, G - 6 * 30, 260, '#FFD27A', .9 * glowK);   // 背景是暖米色，光要比开头更饱和才看得见；表情同开头一样先兴奋一下
    agent(760, G, 30, { ...cl }, NEW.lite ? OLD : OLD, null, tt);
    // 厚菜谱：光标递来、立在灶台右边，一页页翻；后来合上拿走，换成一张点菜单
    const rx = sx + 260;
    if (t >= 562.6 && t < 569.2) {
      const k = ease(seg(t, 562.6, 563.2)), gone = ease(seg(t, 568.4, 569.2));
      recipeBook(lerp(rx + 300, rx, k) + 400 * gone, top - 14, 34, 0);
      if (t < 568.4 && t > 563.4) { const fl = frac((t - 563.4) / 1.4); boilSeed('pageflip'); push(); translate(rx - 44, top - 14 - 56); rotate(-Math.PI * fl); paint(rectPts(0, -4, 88, 6), { wash: PAL.cream, ink: PAL.ink, sw: .5 }); pop(); }
      if (t < 563.3) cursorHand(lerp(rx + 300, rx, k) + 20, top - 80, 2.6, { pose: 'grab', key: 'u' });
      if (t >= 568.2) cursorHand(rx + 400 * gone + 20, top - 80, 2.6, { pose: 'grab', key: 'u' });
    }
    // 点菜单：一张立着的米黄小卡，上面画一盘菜（彩色），顶上写"点菜单"（v002 反馈：原来又小又黑，看不出是什么）
    if (t >= 569.0) {
      const k = easeOut(seg(t, 569.0, 569.5)), cy = top - 60 - 30 * (1 - k);
      boilSeed('ordercard'); paint(rectPts(rx - 40, cy - 52, 80, 104), { wash: '#FFF1CF', ink: PAL.ink, sw: 1 });
      letter('点菜单', rx, cy - 34, 14, PAL.ink, { ink: false, font: CAP_FONT(14) });
      paint(ellPts(rx, cy + 12, 28, 12, 18), { wash: PAL.cream, ink: PAL.ink, sw: .7 });
      for (const [dx, c] of [[-10, '#E58F5B'], [2, '#8DBF6A'], [12, '#F2C14E']]) paint(ellPts(rx + dx, cy + 6, 8, 6, 8), { wash: c, ink: PAL.ink, sw: .4 });
      if (t < 569.8) cursorHand(rx + 30, top - 60, 2.6, { pose: 'open', key: 'u', click: t - 569.5 });
    }
    // 端出来：比菜谱配图上的还好（配图在左，做出来的在右，更丰盛）
    if (t >= 573.2) { const k = backOut(seg(t, 573.2, 573.6)); icon('dish', sx + 90, top - 120, 60 * k); emote('spark', sx + 170, top - 180, 18, seg(t, 573.4, 573.6), t - 573.4); }
    camEnd();
  }

  // ---------- 574–580：从卡带里抽掉说明 ----------
  function slim(t, lt) {
    camBegin(1150, 600, 1.7);
    const pull = ease(seg(t, 575.0, 576.8));
    humanDesk(t, { shell: 1, open: 1 - snap(t, 578.4, .4), casS: 1.2, fill: () => { if (pull < 1) notebook(-30 + 0, -10 - 260 * pull, .3, -.1, 1); boilSeed('thincard'); paint(rectPts(-60, -40, 50, 70), { wash: PAL.cream, ink: PAL.ink, sw: .8 }); checkerBox(55, -6, .55); } });
    // 抽出来的那一大叠说明，放在一边
    if (pull >= 1) notebook(1500, 420, .55, .2, 0);
    const x = kf(t, [[574, 1500], [574.8, HD.cas[0] - 40], [576.8, HD.cas[0] - 40], [577.6, 1500], [578.2, HD.cas[0]], [579.4, HD.cas[0] + 100]]), y = kf(t, [[574, 900], [574.8, HD.cas[1] - 20], [576.8, HD.cas[1] - 300], [577.6, 420], [578.2, HD.cas[1] - 200], [579.4, HD.cas[1] - 40]]);
    cursorHand(x, y, 3, { pose: (t > 574.8 && t < 577.6) || (t > 578.2 && t < 579) ? 'grab' : 'point', key: 'u' });
    camEnd();
  }

  // ---------- 580–586：新旧背包并排 ----------
  function compare(t, lt) {
    boilSeed('cmp bg'); paint(rectPts(-60, -60, W + 120, H + 120), { wash: '#EDE6F1', ink: null });
    camBegin(1000, 680, 1.7);
    boilSeed('cmp floor'); paint(rectPts(-200, G, 2400, 400), { wash: '#D9D2C2', ink: null });
    const u = 30;
    // 两个背包：旧的又大又沉（导轨、步骤拨盘），新的小一圈、机械臂细而灵活
    const on = ease(seg(t, 583.0, 583.6));
    for (const [px, lite, tag] of [[760, 0, 'old'], [1200, 1, 'new']]) {
      if (tag === 'new' && on > .99) continue;
      const g = packGeom(u, lite), y0 = G;
      push(); translate(px - g.bx, G - 20 - g.by);
      const P = { lite, sockets: 1, slot: 1, cassettes: 3 };
      backpack(u, 1.6, P, t);
      pop();
      boilSeed('pedestal' + tag); paint(rectPts(px - 230, G - 20, 300, 20), { wash: '#C9C1D6', ink: PAL.ink, sw: 1 });
    }
    // Clawd 背上新背包，轻轻一跳，落地很轻
    if (t >= 583.0) {
      const hop = jump(t, 584.4, 585.0, 1.6);
      agent(1180 + 160, G, 28, { ...feel('excited', t), view: 'q', dy: hop.dy, sq: hop.sq * .6, boilKey: 'clawd' }, NEW, { layers: TR, recipe: 3 }, t);
    } else agent(1500, G, 28, { ...feel('hopeful', t), view: 'q', boilKey: 'clawd' }, null, null, t);
    camEnd();
  }

  // ---------- 586–592：画边界、走进雾里、点菜单 ----------
  function stride(t, lt) {
    const clear = ease(seg(t, 588.0, 590.4));
    const x = kf(t, [[586, 1000], [588, 1000], [590.4, 1900]]);
    fogField(t, kf(t, [[586, 1300], [590.4, 1950], [592, 2050]]), kf(t, [[586, 1560], [587.4, 1560], [588.2, 2300]]), clear);
    const walking = t > 588 && t < 590.4;
    agent(x, G, 26, { ...feel(walking ? 'determined' : 'hopeful', t), view: walking ? 'side' : 'q', walk: walking ? t * 3.4 : null, dy: walking ? -Math.abs(Math.sin(t * 10)) * .3 : 0, boilKey: 'clawd' }, NEW, { layers: TR, recipe: 3 }, t);
    camEnd();
    // 边界地图在人手里（屏幕左下角），光标把线往外画一圈
    if (t < 588.6) {
      boilSeed('bmap'); paint(rectPts(120, 640, 380, 300), { wash: '#EFE2C4', ink: PAL.ink, sw: 1.2 });
      const r = lerp(70, 120, ease(seg(t, 586.6, 587.8)));
      inkLine(ellPts(310, 790, 70, 56, 20).concat([[380, 790]]), 1.4, '#7B5CA8', 'ink', .3);
      inkLine(ellPts(310, 790, r, r * .8, 26).slice(0, Math.max(2, Math.round(26 * seg(t, 586.6, 587.8)))), 2, '#7B5CA8', 'ink', .3);
      cursorHand(310 + r * Math.cos(seg(t, 586.6, 587.8) * TAU), 790 + r * .8 * Math.sin(seg(t, 586.6, 587.8) * TAU), 2.6, { key: 'u' });
    }
    // 雾散处：光标拿着一张点菜单入画，推到纸上
    if (t >= 590.6) { const k = ease(seg(t, 590.6, 591.4)), z = 1 + 4 * easeIn(seg(t, 591.2, 592)); push(); translate(W / 2 + 200 * (1 - k), H / 2 + 60); scale(z); boilSeed('orderslip'); paint(rectPts(-60, -80, 120, 160), { wash: '#FFF1CF', ink: PAL.ink, sw: 1 }); icon('dish', 0, 0, 36); pop(); if (z < 2) cursorHand(W / 2 + 200 * (1 - k) + 50, H / 2 + 120, 3, { pose: 'grab', key: 'u' }); }
  }

  // ---------- 开头的前提：模型变强，边界自己往外移 ----------
  const PRE = 3.4;
  function stronger(u) {
    const k = ease(seg(u, 1.0, 2.6));
    fogField(552 + u, 1100, lerp(820, 1100, k), 0, k > 0 ? [820] : []);
    const glowK = Math.sin(seg(u, .8, 2.4) * Math.PI);
    if (glowK > 0) glow(520, G - 6 * U, 260, '#FFE6A0', .7 * glowK);
    const mood = emotions(u, [[0, 'neutral', { lookX: .8 }], [.9, 'excited'], [2.6, 'hopeful', { lookX: .8 }]], { take: .6 });
    agent(520, G, U, { ...mood, view: 'q', boilKey: 'clawd' }, OLD, { layers: TR, recipe: 2 }, 552 + u);
    camEnd();
  }

  // 本章时间（扣掉开头的前提）→ v001 时间：[本章起, 本章止, v001 起]；段与段之间是硬切
  const SEG = [[0, 9.6, 552.0], [9.6, 13.2, 562.0], [13.2, 38.0, 567.6]];
  const oldT = u => { const g = SEG.find(([a, b]) => u >= a && u < b) || SEG[SEG.length - 1]; return g[2] + (u - g[0]); };
  chapter(14, [[0, u => {
    if (u < PRE) return stronger(u);
    const t = oldT(u - PRE);
    (t < 562 ? edge : t < 574 ? cook : t < 580 ? slim : t < 586 ? compare : stride)(t);
    for (const c of [13.0, 23.0, 29.0, 35.0]) whipLines(seg(u, c - .12, c + .12), '#E8E1CF');
  }]]);
})();
