// ch15.js：第 15 章 · 许愿（正片 28 秒）。明亮暖色。v002：内容不变，只换成本章时间（v001 时间 = 592 + 本章时间）。
//   0–4      特写：光标递出一张只画了一个小图标的纸条，Clawd 的手接过去。全片最短最轻的一次交接
//   4–11     Clawd 带着几个小 Clawd 在场地里跑起来；揭幕一：一个小游戏世界亮起来，像素风的小 Clawd 跳了一下
//   11–22    揭幕二：画布上的画面动起来；推进画布，画的正是第 4 章背上背包那一下（用渲染好的静帧做贴图）；
//            拉出：机械臂握着画笔在画 → Clawd 写执行单 → 整个画面是人桌上的一块显示器
//   22–28    人的桌前：光标拿起一张空白的点菜单，笔停在半空，迟迟没落下
(() => {
  const G = VN.G, U = 26, NEW = { lite: 1, sockets: 1, slot: 1, cassettes: 4 }, TR = [['#E4DDF0', 5], ['#DCEFD6', 3]];
  let IMG = null;
  (window.PRELOAD = window.PRELOAD || []).push(() => new Promise(r => loadImage('assets/img/ch4_clasp.jpg', im => { IMG = im; r(); }, () => r())));

  // 愿望纸条：只画一个图标（一块播放中的小屏幕）
  function wishSlip(x, y, s, rot = 0) {
    boilSeed('wish'); push(); translate(x, y); rotate(rot); scale(s);
    paint(rectPts(-50, -64, 100, 128), { wash: '#FFF1CF', ink: PAL.ink, sw: 1 });
    paint(rrPts(-30, -26, 60, 44, 6), { wash: '#2A2E45', ink: PAL.ink, sw: .8 }); paint([[-8, -14], [-8, 6], [12, -4]], { wash: PAL.cream, ink: null });
    pop();
  }

  function handoff(t, lt) {
    boilSeed('warm bg'); paint(rectPts(-60, -60, W + 120, H + 120), { wash: '#F6E9D2', ink: null });
    paint(ellPts(W / 2, H / 2, W * .6, H * .5, 30, 0), { fill: '#FFF4E0', fillOp: 120, bleed: .3, tex: .5, ink: null });
    camBegin(1080, 600, 2.2);
    const take = ease(seg(t, 594.0, 594.6));
    const cl = { ...emotions(t, [[592, 'hopeful', { lookX: .8 }], [594.7, 'happy']], { take: .6 }), view: 'q', boilKey: 'clawd', aR: lerp(.2, .9, ease(seg(t, 593.6, 594.2))) };
    if (take >= 1) cl.armR = (u, sw) => wishSlip(.9 * u, -.4 * u, .26, .2);
    agent(880, G, U, cl, NEW, { layers: TR, recipe: 3 }, t);
    if (take < 1) { const x = lerp(1500, 1230, ease(seg(t, 592.3, 593.6))), y = 560; wishSlip(x, y, .55, -.1); cursorHand(x + 30, y + 40, 2.4, { pose: 'grab', key: 'u' }); }
    else if (t < 595.4) cursorHand(lerp(1260, 1500, ease(seg(t, 594.6, 595.4))), 600, 2.4, { pose: 'open', key: 'u' });
    camEnd();
  }

  // 小游戏：一个小小的像素世界（台阶、金币），一个像素小 Clawd 跳一下
  function miniGame(x, y, s, on) {
    boilSeed('game'); push(); translate(x, y); scale(s);
    paint(rrPts(-220, -160, 440, 320, 20), { wash: '#2A2E45', ink: PAL.ink, sw: 2 });
    paint(rectPts(-200, -140, 400, 260), { wash: mixCol('#1E2236', '#8FD3F0', on), ink: null });
    if (on > .3) {
      for (let i = 0; i < 6; i++) paint(rectPts(-200 + i * 70, 80 - (i % 3) * 30, 64, 40 + (i % 3) * 30), { wash: '#7FB060', ink: PAL.ink, sw: .8 });
      for (let i = 0; i < 3; i++) paint(ellPts(-100 + i * 90, -40, 10, 10, 10), { wash: '#F2C14E', ink: PAL.ink, sw: .6 });
      const hop = Math.max(0, Math.sin(clamp((T - 599.4) / .6) * Math.PI)) * 70;
      paint(rectPts(-150, 26 - hop, 48, 34), { wash: PAL.clay, ink: PAL.ink, sw: 1 });
      paint(rectPts(-138, 34 - hop, 6, 10), { wash: PAL.ink, ink: null }); paint(rectPts(-116, 34 - hop, 6, 10), { wash: PAL.ink, ink: null });
    }
    pop();
  }

  function make(t, lt) {
    venueBG(t, 1100); camBegin(...kf(t, [[596, [1100, 620, 1.1]], [598.4, [1100, 620, 1.1]], [599.0, [1500, 560, 1.9]], [602.4, [1500, 560, 1.95]], [603.0, [900, 600, 1.2]]]));
    venueGround(t, 1100);
    miniGame(1500, 560, .8, ease(seg(t, 598.6, 599.2)));
    // 画布（揭幕二要用，这里先立着、蒙着）
    easel(t, 600, 560, 0);
    // Clawd 和几个小 Clawd 跑起来
    const run = t < 598.6;
    for (let i = 0; i < 3; i++) { const mx = 300 + ((t - 596) * 380 + i * 260) % 1700; miniAgent(mx, G, 11 + i, { ...feel('excited', t, { seed: i }), view: 'side', walk: t * 4 + i }, t, { key: 'mini' + i }); }
    agent(lerp(500, 1100, ease(seg(t, 596, 598.4))), G, U, { ...feel(t < 599 ? 'determined' : 'proud', t), view: run ? 'side' : 'q', walk: run ? t * 3.4 : null, boilKey: 'clawd' }, NEW, { layers: TR, recipe: 3 }, t);
    camEnd();
  }

  // 画架和画布；paint 0..1 画面上色的程度（贴第 4 章的静帧）
  function easel(t, x, y, k) {
    boilSeed('easel');
    for (const d of [-150, 150]) inkLine([[x + d * .6, y - 260], [x + d, G]], 6, '#8A6F55', 'ink', 0);
    paint(rectPts(x - 200, y - 150, 400, 240), { wash: '#FFFDF7', ink: PAL.ink, sw: 2 });
    if (k > 0 && IMG) { flushBrush(); push(); tint(255, 255 * clamp(k)); image(IMG, x - 192, y - 142, 384, 224); noTint(); pop(); }
  }

  // 揭幕二和画中画
  function nest(t, lt) {
    const inK = ease(seg(t, 605.6, 607.6)), outK = ease(seg(t, 608.4, 611.0)), monK = ease(seg(t, 611.0, 613.6));
    venueBG(t, 900);
    // 推进画布 → 拉出
    const z = lerp(1.25, 4.8, inK) * lerp(1, 1 / 4.8 * 1.25, outK) * lerp(1, .5, monK);
    camBegin(lerp(lerp(800, 600, inK), 760, outK), lerp(600, 560 - 40, inK), z);
    venueGround(t, 900);
    easel(t, 600, 560, seg(t, 603.4, 605.4));
    // 机械臂握着画笔在画（从 Clawd 的背包伸过来）
    const brushing = Math.sin(t * 9) * .2;
    const P = { ...NEW, near: [-1.0 + brushing * .3, .6 + brushing], nearHold: (u, sw) => { boilSeed('brush'); inkLine([[0, 0], [1.6 * u, -.4 * u]], sw * 3, '#8A6F55', 'ink', 0); paint(ellPts(1.8 * u, -.45 * u, .25 * u, .18 * u, 8), { wash: PAL.clay, ink: PAL.ink, sw: sw * .5 }); } };
    const writing = t >= 608 ? { aR: .95 + .08 * Math.sin(t * 30), armR: (u, sw) => slip('exec', .8 * u, 0, .5, .2, ['code']) } : {};
    agent(980, G, U, { ...feel('proud', t), view: 'q', flip: true, boilKey: 'clawd', ...writing }, P, { layers: TR, recipe: 3 }, t);
    camEnd();
    // 拉出到人桌上的一块显示器：屏幕形状的框收进来，外面是人的桌面
    if (monK > 0) {
      flushLetters();
      const w = lerp(W + 200, 820, monK), h = lerp(H + 200, 470, monK), cx = W / 2, cy = lerp(H / 2, 420, monK);
      boilSeed('monframe');
      irisShape(rectPts(cx - w / 2, cy - h / 2, w, h), '#2B3046');
      if (monK > .2) { paint(rrPts(cx - w / 2 - 22, cy - h / 2 - 22, w + 44, h + 44, 16), { wash: null, ink: FD.bezel, sw: 6 }); boilSeed('desk15'); paint(rectPts(-60, cy + h / 2 + 120, W + 120, 400), { wash: '#B98D62', ink: PAL.ink, sw: 1.2 }); paint(rectPts(cx - 18, cy + h / 2 + 22, 36, 100), { wash: FD.bezel, ink: PAL.ink, sw: 1 }); }
    }
  }

  // 人的桌前：一张空白的点菜单，光标拿着笔停在半空
  function hesitate(t, lt) {
    boilSeed('wall15'); paint(rectPts(-60, -60, W + 120, H + 120), { wash: '#E9DCC6', ink: null });
    camBegin(960, kf(t, [[614, 560], [616, 640]]), kf(t, [[614, 1.05], [616, 1.3], [620, 1.36]]));
    boilSeed('desk15b'); paint(rectPts(-200, 640, W + 400, 600), { wash: '#B98D62', ink: PAL.ink, sw: 1.2 });
    paint(rrPts(560, 120, 820, 470, 16), { wash: FD.bezel, ink: PAL.ink, sw: 1.4 }); if (IMG) { flushBrush(); image(IMG, 580, 140, 780, 430); }
    boilSeed('blank order'); push(); translate(960, 790); rotate(-.04); paint(rectPts(-110, -140, 220, 280), { wash: '#FFF1CF', ink: PAL.ink, sw: 1.2 }); for (let i = 0; i < 3; i++) inkLine([[-80, -60 + i * 50], [80, -60 + i * 50]], .6, '#D9C9A6', 'inkfine', 0); pop();
    // 笔：拿在光标手里，停在纸上方，几次想落又抬起来
    const hover = 30 * Math.sin(seg(t, 615, 620) * Math.PI * 3) * (1 - seg(t, 618.5, 620)) + 40;
    const px = kf(t, [[614, 1400], [615.2, 1000], [620, 990]]), py = kf(t, [[614, 900], [615.2, 700 - hover], [620, 690]]) - (t > 615.2 ? hover * .6 : 0);
    // 只画一支笔，笔尖停在纸上方（v002 反馈：写字时不画拿笔的手）
    { const s = 3; boilSeed('pen16'); push(); translate(px + 21.9 * s, py - 26 * s); rotate(.7); paint(rrPts(-3 * s, -2 * s, 6 * s, 30 * s, 2 * s), { wash: '#4E6FB8', ink: PAL.ink, sw: 1 }); paint([[-3 * s, 28 * s], [3 * s, 28 * s], [0, 34 * s]], { wash: PAL.cream, ink: PAL.ink, sw: .7 }); pop(); }
    camEnd();
  }

  chapter(15, [[0, u => {
    const t = 592 + u;
    (t < 596 ? handoff : t < 603 ? make : t < 614 ? nest : hesitate)(t);
    for (const c of [596, 603]) whipLines(seg(t, c - .12, c + .12), '#E8E1CF');
    // 画中画收进显示器以后，笔刷擦到人的桌前
    boilSeed('transition');
    if (t >= 613.7 && t < 614) brushWipe((t - 613.7) / .6, ['#B98D62', '#E9DCC6']);
    if (t >= 614 && t < 614.3) brushWipe(.5 + (t - 614) / .6, ['#B98D62', '#E9DCC6']);
  }]]);
})();
