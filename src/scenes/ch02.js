// ch02.js：第 2 章 · 收发室和那摞纸（正片 25.4 秒，时间都是本章正片时间）。深蓝后台，全片的地基：
// 模型自己不记事，每次提问都是新问题连同之前的整段对话（整摞纸）一起送去重读；它只知道纸上写的。
// v002 压缩：整摞送过去只演一轮。样片反馈后：咒语一段移到第 3 章开头；前台操作按真人速度。
//   0–2     黑场里台灯"啪"亮，照出 Clawd 和书桌；吊灯亮，照出收发室和滑轨
//   2–13    一轮（慢）：问题单落进收发室、叠到旧对话上 → 吊钩把整摞送到书桌 → Clawd 从头读到尾 → 写回答塞回去 → 纸摞被收走
//   13–15.6 特写：Clawd 表情归零（纸上没有的，它不知道）
//   15.6–19.5 前台：光标从右屏编辑器拖出一段项目背景，贴进对话框，再打问题、发送
//   19.5–25.4 后台：纸摞多了厚厚一层，这次答对了（proud）
(() => {
  const { G, U, CX0, MX } = BS;
  const CHIMNEY = [MX - 130, G - 528];

  // 纸摞的层随时间增加：旧对话 → 每轮钉上问题、收回时多一页回答 → 前台粘进来的厚厚一层资料
  function layersAt(t) {
    // 问题页用对话记录的蓝，回答页浅一点，看得出一页一页
    const Q = ['dialog', 5], A = ['#D6E5F2', 5];
    const L = [Q, A];
    if (t >= 4.4) L.push(Q);
    if (t >= 13.2) L.push(A);
    if (t >= 19.9) L.push(['dialog', 14], Q);
    return L;
  }
  // 每轮的时间点：钉上、吊起、放到桌上、开始读、读完、写、塞进去、吊回
  const RD = [
    { pin: 4.4, lift: 6.0, arrive: 7.6, read: [7.8, 10.6], write: [10.7, 11.3], post: 11.4, back: [12.0, 13.2], drop: 3.4 },
    { pin: 19.9, lift: 20.2, arrive: 21.4, read: [21.6, 22.6], write: [22.7, 23.3], post: 23.4, back: [24.1, 25.0], drop: 19.5 },
  ];
  // 纸摞的位置：屋顶 ↔ 书桌，沿滑轨吊运（先吊起，再平移，再放下）
  function stackAt(t) {
    const [rx, ry] = BS.ROOF, [dx, dy] = BS.DESKTOP, up = 400;
    const path = (k) => k < .2 ? [rx, lerp(ry, up, ease(k / .2))] : k < .8 ? [lerp(rx, dx, ease((k - .2) / .6)), up] : [dx, lerp(up, dy, ease((k - .8) / .2))];
    for (const r of RD) {
      if (t >= r.lift && t < r.arrive) return path(seg(t, r.lift, r.arrive));
      if (t >= r.arrive && t < r.back[0]) return [dx, dy];
      if (t >= r.back[0] && t < r.back[1]) return path(1 - seg(t, r.back[0], r.back[1]));
    }
    return [rx, ry];
  }

  // 哪一段是前台
  const FRONT = [[15.6, 19.5]];
  const isFront = t => FRONT.some(([a, b]) => t >= a && t < b);

  function back(t) {
    // 镜头
    const cx = kf(t, [[0, 1210], [1.0, 1210], [2.0, 950], [6.0, 950], [7.6, 1240], [13.2, 1240], [13.6, 1190], [15.6, 1190], [15.61, 1060], [23.4, 1060], [25.4, 1120]]);
    const cy = kf(t, [[0, 730], [1.0, 730], [2.0, 620], [6.0, 620], [7.6, 700], [13.2, 700], [13.6, 790], [15.6, 790], [15.61, 640], [23.4, 640], [25.4, 660]]);
    const z = kf(t, [[0, 1.75], [1.0, 1.75], [2.0, 1.36], [6.0, 1.36], [7.6, 1.72], [13.2, 1.72], [13.6, 3.1], [15.6, 3.2], [15.61, 1.45], [23.4, 1.45], [25.4, 1.58]]);
    camBegin(cx, cy, z);
    backstageBG(t);
    glow(MX, 420, 520, MC.lamp, .6 * seg(t, 1.0, 1.2));
    glow(1400, 760, 300, MC.lamp, .5);
    backDoor(t, 0);
    pendantLamp(MX, t, seg(t, 1.0, 1.05));

    // 吊钩和滑轨（纸摞挂在托板上，托板一直挂在吊钩上）
    const [sx, sb] = stackAt(t), L = layersAt(t);
    const SS = 1.7, SW = 150;
    const hTot = L.reduce((a, [, h]) => a + h * SS * 1.25, 0), cradleTop = sb - Math.max(70, hTot + 26);
    railHook(t, sx, cradleTop + 4);

    // 收发室：右臂在钉纸的时候伸上去压一下
    const pinning = RD.find(r => t >= r.pin - .35 && t < r.pin + .25);
    const exitK = RD.map(r => seg(t, r.post + .7, r.post + 1.2)).find(k => k > 0 && k < 1);
    house(MX, G, 1, {
      arms: true, armR: 0, armL: 0, cab: 0, win: Math.max(...RD.map(r => t > r.post + .6 ? Math.exp(-(t - r.post - .6) * 5) : 0)),
      armPose: pinning ? (w, p) => w === 'R' ? [-2.2 + .25 * snap(t, pinning.pin - .1, .1), -.9, -.7] : p : null,
    }, t);

    // 纸摞（托板 + 纸）
    const st = paperStack(sx - SW / 2, sb, SW, SS, 'stack', L);
    stackCradle(sx, sb, SW, cradleTop);
    // 读的时候：一道亮线从第一页扫到最后一页
    const rr = RD.find(r => t >= r.read[0] && t < r.read[1]);
    if (rr) { const k = seg(t, rr.read[0], rr.read[1]), i = Math.min(st.ys.length - 1, Math.floor(k * st.ys.length)); boilSeed('readline'); inkLine([[sx - 82, st.ys[i]], [sx + 82, st.ys[i]]], 2.2, PAL.cream, 'ink', 0); }

    // 问题单：从画面上方落到屋顶，钉进纸摞
    for (const q of RD) if (t >= q.drop && t < q.pin) { const k = easeIn(seg(t, q.drop, q.pin - .1)); slip('question', lerp(BS.ROOF[0] + 40, BS.ROOF[0], k), lerp(-80, BS.ROOF[1] - 40, k), .8, .3 * (1 - k)); }

    floorTube(1);
    // 回答：写好 → 塞进投递口 → 沿管道回收发室 → 从烟囱飞走
    for (const q of RD) {
      if (t >= q.post && t < q.post + .65) { const [ax, ay] = tubeAt(1 - ease(seg(t, q.post, q.post + .6))); slip('answer', ax, ay - 6, .7); }
      if (t >= q.post + .7 && t < q.post + 1.3) { const k = easeIn(seg(t, q.post + .7, q.post + 1.3)); slip('answer', CHIMNEY[0] + 20, lerp(CHIMNEY[1], -100, k), .8, .2 * k); }
    }

    // Clawd：坐在书桌前，没有背包
    const mood = emotions(t, [[0, 'neutral'], [1.0, 'neutral', { lookX: -.8, lookY: -.6 }], [7.7, 'thinking', { lookX: .6, lookY: .5 }], [10.7, 'neutral', { lookX: .8, lookY: .4 }],
      [11.8, 'neutral', { lookX: -.8, lookY: -.4 }], [13.4, 'neutral', { eyes: 'dot' }], [19.5, 'neutral', { lookX: -.8, lookY: -.6 }], [21.5, 'thinking', { lookX: .6, lookY: .5 }],
      [22.5, 'idea'], [23.0, 'proud']], { take: .7 });
    const cl = { ...mood, view: 'q', legK: 0, boilKey: 'clawd' };
    // 眨眨眼：表情归零那一刻
    if ((t > 14.0 && t < 14.1) || (t > 14.35 && t < 14.43)) cl.squint = 1;
    const w = RD.find(q => t >= q.write[0] && t < q.post + .05);
    if (w) {
      cl.aR = t < w.post - .2 ? .95 + .08 * Math.sin(t * 30) : lerp(.95, .45, seg(t, w.post - .2, w.post));
      if (t < w.post) cl.armR = (u, sw) => slip('answer', .8 * u, 0, .62, .2);
    }
    clawd(CX0, G, U, cl);
    backDesk(t, 0, seg(t, .15, .2));
    camEnd();

    // 开场：黑场里只有台灯照到的一圈，吊灯亮起时一圈扩到全画面
    boilSeed('dark');
    if (t < .15) paint(rectPts(-60, -60, W + 120, H + 120), { wash: '#0E0F1A', ink: null });
    else if (t < 1.6) {
      const k = easeOut(seg(t, 1.0, 1.6)), r = lerp(1, 6, k);
      const [lx, ly] = toScreen(1260, 760, LAST_CAM);
      irisShape(ellPts(lx - 60 * k * 4, ly - 40 * k, 420 * r, 300 * r, 40), '#0E0F1A');
    }
  }

  function front(t) {
    // 镜头先停在两块屏幕之间（看得到右屏的项目代码），拖资料时移到左屏聊天框
    camBegin(kf(t, [[15.6, 900], [16.3, 900], [17.2, 540]]), 390, kf(t, [[15.6, 1.25], [16.3, 1.25], [17.2, 1.6]]));
    const msgs = [{ who: 'user', kind: 'text', seed: 31, y: 208, n: 1 }, { who: 'ai', kind: 'text', seed: 32, y: 254 }];
    if (t >= 17.35) msgs.push({ who: 'user', kind: 'paste', seed: 33, y: 318, n: 6, k: snap(t, 17.35, .15) });
    if (t >= 19.02) msgs.push({ who: 'user', kind: 'text', seed: 34, y: 432, n: 1, k: snap(t, 19.02, .1) });
    if (t >= 19.2) msgs.push({ who: 'ai', kind: 'dots', seed: 35, y: 480 });
    // 输入框里打问题，发送后清空
    const typing = t >= 17.6 && t < 19.0 ? seg(t, 17.6, 18.4) : 0;
    frontDesk(t, { msgs, typing, ed: { n: 9, seed: 3, err: 0, sel: 0 }, night: 1 });
    // 光标：从右屏编辑器抓起一段项目代码 → 拖进对话框 → 打问题 → 点发送
    const drag = t >= 16.2 && t < 17.35;
    if (drag) { const k = ease(seg(t, 16.2, 17.3)); flyCard(lerp(1300, 520, k), lerp(330, 380, k), 300, 110, 9, false, .05 * Math.sin(k * 3)); }
    const SEND = [FD.L[0] + FD.L[2] - 40, FD.L[1] + FD.L[3] - 30];
    const P = [[15.6, 1150, 500], [16.1, 1300, 330], [16.2, 1300, 330], [17.3, 520, 380], [17.4, 520, 380], [17.6, 560, 520], [18.4, 590, 528], [18.9, ...SEND]];
    const x = kf(t, P.map(q => [q[0], q[1]])), y = kf(t, P.map(q => [q[0], q[2]]));
    const ck = t - 19.0, click = ck >= 0 && ck < .45;
    cursorHand(x, y, 2.4, { pose: t > 16.1 && t < 17.35 ? 'grab' : 'point', click: click ? ck : -1, press: click ? 1 - seg(ck, .05, .15) : 0, key: 'u' });
    camEnd();
  }

  function shot(t, lt, dur) {
    if (isFront(t)) front(t); else back(t);
    // 前后台之间的竖向快切
    for (const c of FRONT.flat()) whipLines(seg(t, c - .12, c + .12));
  }

  chapter(2, [[0, shot]]);
})();
