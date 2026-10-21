// ch07.js：第 7 章 · 纸摞太厚，它开始一本正经地出错（正片 46.4 秒，含结尾 0.5 秒笔刷）。傍晚转夜，全章只有台灯一个光源。
// v002：沿用 v001 的整段（时间是 v001 时间），用 SEG 表挑段；三个原因各演一次，取消"幻觉"印章（交给气泡）。
//   0–5.4     沿纸摞侧面往上摇，像看岩层；越往上越亮，中间一片暗
//   5.4–13.3  原因一：地址页夹在暗处，Clawd 眯眼，笔没停，一脸笃定地写出一个工整的假地址 → 出件筐
//   13.3–23.8 原因二：任务是订个午饭；步骤单一张张压在最上面，最新一步写着"要评分高的"，底下的星星目标页沉进暗处；
//             拿放大镜一家家比评分，比到第 20 家 → 交出一张餐厅评分表；切到人的屏幕，愣住："……所以，饭呢？"
//   23.8–33.7 原因三：搜索带回一堆灰纸和发黄的旧纸，夹进纸摞；新旧两个地址，Clawd 拿了发黄那张
//   33.7–43.6 查原因：光标把三份错答案摆成一列，每份用同色框标出纸摞里对应那页
//   43.6–45.9 纸摞晃了一下，快要倒
(() => {
  const G = ST.G, U = 30, XS = 1130, LITE = .35;
  const NIGHT = '#1B1F35';

  // ---------- 纸摞：每层 { c 颜色, h 厚度, tag 标签 } ----------
  const BASE = [{ c: '#FFF1C9', h: 6, tag: 'goal' }].concat(TRAY.c6.map(([c, h], i) => ({ c, h, tag: c + i })));
  BASE.splice(9, 0, { c: 'result', h: 5, tag: 'addr' });     // 公司地址那一页（第 5 章查到的企业卡片），夹在中间
  function layersAt(t) {
    const L = BASE.slice();
    // 原因二：一张张步骤单落在最上面
    [250.5, 251.3, 252.1, 252.9, 253.7].forEach((a, i) => { if (t >= a) L.push({ c: '#F6E7A6', h: 5, tag: 'step' + i }); });
    // 原因三：搜索带回来的灰纸、发黄的旧纸，夹进彩色层之间
    if (t >= 263.0) [[14, 'grey'], [11, 'old'], [17, 'grey'], [6, 'old'], [20, 'grey'], [8, 'oldaddr']].forEach(([at, c], i) => L.splice(at + i, 0, { c: c === 'oldaddr' ? 'old' : c, h: 4, tag: c === 'oldaddr' ? 'oldaddr' : c + i }));
    return L;
  }
  // 台灯的光：最上面几页最亮，越往下越暗；原因二时光整体往上偏
  function dimAt(t) {
    const up = seg(t, 250.5, 256);
    return (i, n) => { const d = (n - 1 - i) / Math.max(1, n - 1); return clamp((d - .12 + .1 * up) / .55) * lerp(.85, 1, up) * (d > .92 ? lerp(.8, 1, up) : 1); };
  }
  // 小桌板纸摞在世界坐标里的位置（底边左端 x、底边 y、宽、缩放）
  const stackGeom = (x, cl) => { const [bx, by] = clawdToWorld(x, G, U, cl, 5.4 * U, -4.8 * U); return { bx, by, w: 3.4 * U, s: 1.5 * .7 * U / 24 }; };   // 这一章的纸摞高过头顶
  // 画纸摞（不用 trayGear 里的纸摞，因为要画特殊的页和图标）；返回每层的 y
  function drawStack(t, cl, L, sway = 0) {
    const sg = stackGeom(XS, cl), dim = dimAt(t);
    push(); translate(sg.bx + sg.w / 2, sg.by); rotate(sway); translate(-(sg.bx + sg.w / 2), -sg.by);
    const st = paperStack(sg.bx, sg.by, sg.w, sg.s, 'ch7stack', L.map(l => [l.c, l.h]), { dim });
    // 特殊的页：星星目标页（公司 + 日历）、地址页（图钉）
    L.forEach((l, i) => {
      const y = st.ys[i], dk = dim(i, L.length);
      if (l.tag === 'goal') { const a = 1 - dk * .8; icon('star', sg.bx + 14, y, 7 * a + 1, { col: mixCol('#F5C542', '#3A3550', dk * .8) }); }
      if (l.tag === 'addr' || l.tag === 'oldaddr') icon('pin', sg.bx + sg.w - 12, y, 6, { col: mixCol(l.tag === 'addr' ? NG_RED : '#9A7A4A', '#3A3550', dk * .7) });
    });
    pop();
    return { st, sg };
  }

  // 出件筐：挂在小桌板最前端（Clawd 局部坐标）
  function outbox(u, sw, n) {
    boilSeed('outbox');
    for (let i = 0; i < n; i++) paint(rectPts(9.4 * u + i * .25 * u, -5.4 * u - i * .2 * u, 1.7 * u, .6 * u), { wash: PAL.cream, ink: PAL.ink, sw: sw * .5 });
    paint([[9.1 * u, -4.9 * u], [11.6 * u, -4.9 * u], [11.3 * u, -3.7 * u], [9.4 * u, -3.7 * u]], { wash: MC.macDk, ink: PAL.ink, sw: sw * .7 });
    for (let i = 1; i < 5; i++) inkLine([[9.1 * u + i * .5 * u, -4.9 * u], [9.3 * u + i * .45 * u, -3.7 * u]], sw * .5, PAL.ink, 'inkfine', 0);
  }
  // 三份错答案：假地址（图钉）、餐厅评分表（星星，饭没订）、旧地址（发黄的图钉）
  const WRONG = [{ t: 248.6, ic: ['pin'], tint: PAL.cream }, { t: 257.4, ic: ['star', 'dots'], tint: PAL.cream }, { t: 269.6, ic: ['pin'], tint: '#E9D7A8' }];

  function camAt(t, sg, top) {
    const sx = sg.bx + sg.w / 2;
    if (t < 242) { const k = ease(seg(t, 234.3, 241.2)); return [sx + 60, lerp(sg.by - 40, top + 50, k), 2.7]; }
    return kf(t, [[242, [sx - 90, sg.by - 120, 2.6]], [244.8, [sx - 110, sg.by - 140, 3.2]], [247.2, [sx - 110, sg.by - 140, 3.2]], [248.2, [sx + 120, sg.by - 60, 2.6]], [250, [sx + 120, sg.by - 60, 2.6]],
      [250.1, [sx - 40, top + 40, 2.6]], [253.9, [sx - 40, top + 20, 2.6]], [254.0, [sx - 10, sg.by - 10, 4.2]], [255.4, [sx - 10, sg.by - 10, 4.2]], [255.5, [sx - 80, top + 70, 2.8]],
      [257.0, [sx - 80, top + 70, 2.8]], [257.3, [sx + 120, sg.by - 60, 2.6]], [258.9, [sx + 120, sg.by - 60, 2.6]],
      [260, [sx - 300, sg.by - 200, 1.5]], [263, [sx - 300, sg.by - 200, 1.5]], [263.2, [sx, sg.by - 30, 3.2]], [266.0, [sx, top + 30, 3.2]], [266.1, [sx, sg.by - 120, 4.4]], [268.3, [sx, sg.by - 120, 4.4]],
      [268.4, [sx + 40, sg.by - 80, 2.6]], [271.5, [sx + 120, sg.by - 60, 2.6]], [272.5, [sx + 110, (sg.by + top) / 2, 2.2]], [279.0, [sx + 110, (sg.by + top) / 2, 2.2]], [279.6, [sx + 110, (sg.by + top) / 2 + 30, 2.25]],
      [284, [sx + 110, (sg.by + top) / 2 + 30, 2.25]], [286, [sx - 60, (sg.by + top) / 2, 1.7]], [290, [sx - 60, (sg.by + top) / 2, 1.75]]]);
  }

  function shot(t, lt, dur) {
    const L = layersAt(t);
    // 原因一 / 原因二 / 原因三 / 查原因 的情绪
    const mood = emotions(t, [[234, 'nervous', { lookX: .5, lookY: -1 }], [242, 'neutral', { lookX: .7, lookY: .3 }], [244.6, 'neutral', { eyes: 'narrow', lookX: .7 }], [246.4, 'proud'], [247.6, 'smug'],
      [250.1, 'neutral', { lookX: .6, lookY: -.6 }], [253.9, 'determined', { lookX: .8 }], [256.6, 'proud'], [260, 'neutral', { lookX: -.8 }], [263.2, 'neutral', { lookX: .7 }],
      [267.6, 'smug'], [272, 'neutral', { lookX: .9 }], [284.5, 'scared', { lookX: .8, lookY: -1 }]], { take: .7 });
    const cl = { ...mood, view: 'q', boilKey: 'clawd', dy: (mood.dy || 0) * .4 };
    // 写字：原因一的假地址、原因二的评分表、原因三的旧地址
    const writing = [[245.0, 248.4], [255.6, 257.2], [268.4, 269.4]].find(([a, b]) => t >= a && t < b);
    if (writing) { cl.aR = .95 + .1 * Math.sin(t * 28); cl.armR = (u, sw) => slip('answer', .8 * u, 0, .55, .2); }
    if (t >= 267.6 && t < 268.4) { cl.aR = .7 + .3 * seg(t, 267.6, 268.2); }   // 手伸向发黄的那张

    const sg0 = stackGeom(XS, cl), sumL = L.reduce((a, l) => a + l.h, 0), top0 = sg0.by - sumL * sg0.s * 1.25;
    const [cx, cy, z] = camAt(t, sg0, top0), sink = t >= 279 && t < 284 ? 0 : 0;
    camBegin(cx, cy + sink, z);
    // 夜：全黑的底，远处只有一点点街景的影子
    boilSeed('night bg');
    paint(rectPts(-1000, -800, 5000, 3000), { wash: NIGHT, ink: null });
    paint(ellPts(XS + 200, G - 200, 900, 500, 30, 0), { fill: '#262B47', fillOp: 120, bleed: .3, tex: .5, ink: null });
    boilSeed('night ground'); paint(rectPts(-1000, G, 5000, 800), { wash: '#15182A', ink: null });
    // 台灯的光：照在纸摞顶上，光圈大小不变；纸摞越高，光越显得摊薄
    const lampY = lerp(sg0.by - 2.6 * U, top0 + 10, seg(t, 250.5, 256) * .7 + .3);
    glow(sg0.bx + sg0.w / 2, lampY, 330, MC.lamp, .55);

    const sway = t >= 284.5 ? .06 * Math.sin((t - 284.5) * 7) * seg(t, 284.5, 286) : 0;
    const P = { lite: LITE, sockets: 1, slot: 1, cassettes: 1 };
    // 原因三：背包的机械臂伸出画面去搜，带回一堆纸
    if (t >= 260.4 && t < 263.2) { const k = ease(seg(t, 260.4, 261.2)) * (1 - ease(seg(t, 262.4, 263.1))); P.near = [lerp(1.62, -.3, k), lerp(-2.95, -.2, k), lerp(2.9, 0, k)]; if (t > 261.6) P.nearHold = (u, sw) => { for (let i = 0; i < 5; i++) paint(rectPts(-.5 * u + i * .1 * u, -.4 * u - i * .25 * u, 1.4 * u, .3 * u), { wash: i % 2 ? LC.old : LC.grey, ink: PAL.ink, sw: sw * .4 }); }; }
    const nIn = WRONG.filter(w => t >= w.t + .4).length - (t >= 272.6 ? 3 : 0);
    agent(XS, G, U, cl, P, { layers: [], lamp: false, recipe: 1, buckle: 1 }, t);
    // 出件筐和里面的错答案
    push(); { const [ox, oy] = clawdToWorld(XS, G, U, cl, 0, 0); translate(ox, oy); outbox(U, 1.2, Math.max(0, nIn)); } pop();
    const { st, sg } = drawStack(t, cl, L, sway);
    const lampB = clawdToWorld(XS, G, U, cl, 9 * U - .37 * U, -4.8 * U);
    { const bulb = deskLamp(lampB[0], lampB[1], .55 * U / 24, 1); glow(...bulb, 25 * U / 24, MC.lamp, .9); }

    // 开场的岩层：经过每种层时闪一下它来自哪章（对话 / 咒语 / 工具 / Skill / 结果）
    if (t < 242.2) {
      const firsts = {}; L.forEach((l, i) => { const k = LC[l.c] ? l.c : null; if (k && !(k in firsts)) firsts[k] = i; });
      const ICON = { dialog: 'bubble', prompt: 'hat', tools: 'wrench', skill: 'cassette', result: 'check' };
      for (const [k, i] of Object.entries(firsts)) { const y = st.ys[i], near = 1 - clamp(Math.abs(y - cy) / 40); if (near > 0) icon(ICON[k] || 'doc', sg.bx + sg.w + 26, y, 11 * backOut(near), { col: k === 'result' ? null : undefined }); }
    }
    // 原因二：拿着放大镜，越来越专注最上面这一步（画在纸摞前面）
    if (t >= 253.9 && t < 257.2) { const k = backOut(seg(t, 253.9, 254.2)); push(); translate(sg.bx + sg.w * .45, st.top + 18 + 4 * Math.sin(t * 9)); scale(k); icon('search', 0, 0, 34, { col: '#DDEAF3' }); pop(); }
    // 原因二：纸摞顶上方一张小评分卡，和气泡同步——
    //   先写着最新那一步"要评分高的"；镜头回到顶上（255.5）后它一家家比下去，卡上的店号和星数一直在换，到第 20 家停住，留到"饭还没订"
    if (t >= 252.4 && t < 258.9) {
      const k = backOut(seg(t, 252.4, 252.7)), cx = sg.bx + sg.w / 2, cy = st.top - 48;
      boilSeed('rating'); paint(rrPts(cx - 72 * k, cy - 20 * k, 144 * k, 40 * k, 6), { wash: PAL.cream, ink: PAL.ink, sw: .8 });
      if (k > .9 && t < 255.5) {
        letter('要评分高的', cx - 10, cy, 13, PAL.ink, { ink: false, font: CAP_FONT(13) });
        icon('star', cx + 48, cy, 7, { col: '#F5C542' });
      } else if (k > .9) {
        const n = Math.min(20, 1 + Math.floor((t - 255.5) * 8.3)), stars = [4, 3, 5, 4, 2, 5, 3][n % 7];
        letter(`第 ${n} 家`, cx - 40, cy, 13, PAL.ink, { ink: false, font: CAP_FONT(13) });
        for (let i = 0; i < 5; i++) icon('star', cx + 2 + i * 13, cy, 6, { col: i < stars ? '#F5C542' : '#CFC8B8' });
      }
    }
    // 原因一：暗处的地址页上，一个问号；原因三：新旧两个地址
    const iA = L.findIndex(l => l.tag === 'addr'), iO = L.findIndex(l => l.tag === 'oldaddr'), iG = 0;
    if (t >= 242.6 && t < 245) emote('?', sg.bx + sg.w + 16, st.ys[iA], 10, seg(t, 242.6, 242.9), t - 242.6);
    if (t >= 266.1 && t < 268.4) {   // 并排特写：干净的地址 / 发黄的地址
      const k = ease(seg(t, 266.1, 266.5)), y0 = sg.by - 140;
      boilSeed('two addr');
      for (const [dx, col, pc] of [[-42, PAL.cream, NG_RED], [42, LC.old, '#9A7A4A']]) { paint(rectPts(sg.bx + sg.w / 2 + dx - 36, y0 - 22 * k, 72, 44 * k), { wash: col, ink: PAL.ink, sw: .6 }); if (k > .9) { icon('pin', sg.bx + sg.w / 2 + dx - 18, y0, 9, { col: pc }); codeLines(sg.bx + sg.w / 2 + dx - 4, y0 - 6, 34, 2, 120 + (dx > 0 ? 1 : 0), 1, 10); } }
    }
    // 错答案落进出件筐
    WRONG.forEach((w, i) => {
      if (t >= w.t - .3 && t < w.t + .4) { const k = easeIn(seg(t, w.t - .3, w.t + .35)), [ox, oy] = clawdToWorld(XS, G, U, cl, 10.3 * U, -5.6 * U); slip('answer', ox, lerp(oy - 160, oy, k), .7, .2 * (1 - k), w.ic); }
    });
    // "幻觉"盖在那张编出来的地址上（落进出件筐之前，先停在半空一下）
    if (t >= 247.7 && t < 248.3) { const [ox, oy] = clawdToWorld(XS, G, U, cl, 10.3 * U, -5.6 * U); slip('answer', ox, oy - 160, 1.2, 0, ['pin']); }

    // 查原因：三份错答案摆成一排（纸摞右边），每份拉一根墨线连回对应的那页
    if (t >= 272.6) {
      const targets = [iA, iG, iO], col = sg.bx + sg.w + 120;
      // 三份错答案排成一列（等距，不重叠）；每个原因一个颜色：纸摞里对应那页框同色的细框，答案旁边同色的短标签
      const CAUSE = [['看不清', '#F2C14E'], ['忘了目标', '#7FC8C2'], ['拿错了纸', '#F09A8A']], mid = (sg.by + top0) / 2;
      WRONG.forEach((w, i) => {
        const at = 273.0 + i * .9, k = ease(seg(t, at, at + .6)), [ox, oy] = clawdToWorld(XS, G, U, cl, 10.3 * U, -5.6 * U);
        const yT = st.ys[targets[i]] ?? sg.by;
        const px = lerp(ox, col, k), py = lerp(oy, mid - 110 + i * 110, k);
        slip('answer', px, py, .85, 0, w.ic);
        if (t >= 276 + i * .7) {
          const q = seg(t, 276 + i * .7, 276.3 + i * .7), [name, c] = CAUSE[i];
          boilSeed('cause' + i);
          inkLine(rectPts(sg.bx - 5, yT - 7, sg.w + 10, 14).concat([[sg.bx - 5, yT - 7]]), 2 * q, c, 'inkfine', 0);
          paint(ellPts(px - 30, py - 22, 7 * q, 7 * q, 10), { wash: c, ink: PAL.ink, sw: .6 });
          letter(name, px + 46, py, 16, c, { align: 'left', ink: false, alpha: q, font: CAP_FONT(16) });
        }
      });
      // 摆好以后光标挪到右下角，不挡标签
      const cx2 = kf(t, [[272.6, col], [273.0, col], [275.6, col + 36], [276.3, col + 330]]);
      cursorHand(cx2 + 30, kf(t, [[272.6, sg.by - 60], [275.6, mid], [276.3, mid + 220]]), 2.4, { pose: t < 275.6 ? 'grab' : 'point', key: 'u' });
    }
    camEnd();
    // 原因二结束时切到人：前台夜里，屏幕上一长串餐厅评分，饭没订，镜头愣住
    if (t >= 258.9 && t < 260) frontFreeze(t);
    // 查原因后的皱眉：镜头下沉
    boilSeed('transition');
  }
  // 人的反应镜头（屏幕空间整画面）：前台，聊天框里一份满是车的回复，镜头定住、轻推
  function frontFreeze(t) {
    camBegin(540, 400, 1.6 + .08 * seg(t, 259.0, 259.9));
    frontDesk(t, { msgs: [{ who: 'user', kind: 'text', seed: 61, y: 208, n: 1 }, { who: 'ai', kind: 'blank', seed: 62, y: 256, n: 7 }], ed: { n: 9, seed: 3 } });
    // 屏幕上的回复：一张餐厅评分表——每行左边一个店名色条、右边一排星，行与行对齐不重叠；没有订单
    boilSeed('rating rows');
    for (let r = 0; r < 4; r++) {
      const y = 284 + r * 24;
      paint(rrPts(232, y - 4, [58, 46, 64, 52][r], 8, 3), { wash: ['#D9A441', '#5B7FC0', '#4FA59A', '#9A7CC0'][r], ink: null });
      for (let i = 0; i < 5; i++) icon('star', 318 + i * 22, y, 8, { col: i < [5, 4, 4, 3][r] ? '#F5C542' : '#CFC8B8' });
    }
    camEnd();
  }

  // 本章时间 → v001 时间：[本章起, 本章止, v001 起]；段与段之间是硬切
  // 第 4 段是人愣住的镜头（"我只是想订个午饭……"），放慢到 0.65 倍，字来得及读；第 4 项是播放速度（默认 1）
  const SEG = [[0, 5.4, 236.4], [5.4, 13.3, 242.0], [13.3, 22.1, 250.1], [22.1, 23.8, 258.9, .65], [23.8, 33.7, 260.3], [33.7, 43.6, 272.5], [43.6, 45.9, 284.4]];
  const oldT = u => { const g = SEG.find(([a, b]) => u >= a && u < b) || SEG[SEG.length - 1]; return g[2] + (u - g[0]) * (g[3] || 1); };
  chapter(7, [[0, u => shot(oldT(u))]]);
})();
