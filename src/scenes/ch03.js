// ch03.js：第 3 章 · 提示词魔法（正片 23.6 秒，时间都是本章正片时间）。前台打咒语，后台深蓝、灶台暖橙。
// v002：从第 2 章结尾搬来"加咒语"（早期提示词工程靠固定句式提升回答质量），咒语原文打在输入框里看得清；取消"提示词工程"印章，交给气泡。
//   0–4.3     前台：光标点进输入框，按真人速度打出三句咒语，点发送
//   4.3–10.5  后台：三张咒语纸条同一落点、同一景别：戴上厨师帽 → 展开成厚菜谱 → 冒汗
//   10.5–12.4 书桌变灶台（匹配剪辑：桌面的长方形就是灶台的长方形）
//   12.4–16   碎剪：菜谱步骤 / 紧张的脸 / 锅里，量勺量了又量
//   16–19.6   一盘菜朝镜头推过来，Clawd 在后面长出一口气；菜变回一张回答，往上飞走
//   19.6–23.6 前台：回答出现在聊天框里，光标还得自己选中、复制、粘贴到编辑器（答案再好，动手的还是人 → 第 4 章）
(() => {
  const { G, U, CX0, MX } = BS;
  const LAND = [1335, 800];                 // 三张纸条的同一落点
  const SPELLS = [['你是一位资深专家', 4.5, 5.3], ['请一步一步思考', 6.4, 7.2], ['做不好我会被开除', 8.4, 9.3]];   // [咒语, 从投递口弹出, 生效]
  const PAN = [1345, 800], BOOK = [1445, 806];
  const FRONT_END = 4.3;                     // 前台打咒语到这里结束，快切到后台
  const STOVE = 10.6;                        // 书桌开始变灶台
  const COOK = [12.4, 16.0];                 // 碎剪做菜

  // 咒语纸条：粉色（提示词的颜色），上面一句咒语
  function spellStrip(txt, x, y, s, rot, a = 1) {
    boilSeed('spell' + txt);
    push(); translate(x, y); rotate(rot); scale(s);
    paint(rectPts(-84, -17, 168, 34), { wash: LC.prompt, ink: PAL.ink, sw: .8 });
    pop();
    // 咒语原文用和气泡一样的黑体，看得清（v001 用的印章字体太细）
    letter(txt, x, y + 1, 17 * s, PAL.ink, { rot, ink: false, alpha: a, font: CAP_FONT(17 * s) });
  }
  // 厚菜谱：立在桌上，封面朝外；open 0..1 翻开（两页摊开，页上是步骤图标），step 当前高亮的步骤
  function recipe(x, by, s, open, step) {
    boilSeed('recipe big');
    const w = 92 * s, h = 112 * s, o = ease(open);
    if (o < .5) {
      paint(rectPts(x - w / 2 - 14 * s, by - h, 14 * s, h), { wash: mixCol('#C9663F', PAL.ink, .25), ink: PAL.ink, sw: .8 });   // 书脊（很厚）
      paint(rectPts(x - w / 2, by - h, w * (1 - o * 2), h), { wash: '#C9663F', ink: PAL.ink, sw: .9 });
      paint(rectPts(x - w / 2 + 10 * s, by - h + 14 * s, (w - 20 * s) * (1 - o * 2), 30 * s), { wash: PAL.cream, ink: PAL.ink, sw: .5 });
      icon('hat', x - w / 2 + w * .5 * (1 - o * 2), by - h * .35, 16 * s * (1 - o * 2));
    } else {
      for (const sd of [-1, 1]) paint(rectPts(sd < 0 ? x - w : x, by - h, w, h), { wash: PAL.cream, ink: PAL.ink, sw: .8 });
      inkLine([[x, by - h], [x, by]], .8, PAL.ink, 'inkfine', 0);
      const items = ['spoon', 'timer', 'flame', 'spoon', 'timer', 'flame'];
      items.forEach((n, i) => {
        const col = i < 3 ? -1 : 1, row = i % 3, ix = x + col * w * .5, iy = by - h + 22 * s + row * 34 * s;
        if (i === step) paint(rectPts(ix - w * .45, iy - 15 * s, w * .9, 30 * s), { wash: '#FFE7A8', ink: null });
        for (let d = 0; d <= i % 3; d++) paint(ellPts(ix - w * .34 + d * 7 * s, iy, 2.6 * s, 2.6 * s, 8), { wash: PAL.ink, ink: null });   // 步骤号（点数）
        icon(n, ix + w * .12, iy, 11 * s, { sw: .55 });
      });
    }
  }
  // 灶台：k 0..1 从书桌长出灶台的身体；火 fire 0..1
  function stove(t, k, fire) {
    boilSeed('stove');
    const x0 = BS.DX, w = 260, top = 806, h = (G - top) * ease(k);
    if (h > 2) {
      paint(rectPts(x0, G - h, w, h), { wash: '#C98F5E', ink: PAL.ink, sw: .9 });
      for (let i = 0; i < 3; i++) paint(ellPts(x0 + 50 + i * 80, G - h * .45, 9, 9, 10), { wash: MC.macDk, ink: PAL.ink, sw: .6 });
    }
    paint(rectPts(x0, top, w, 14), { wash: mixCol(MC.macLt, '#E7B47E', k), ink: PAL.ink, sw: .9 });
    if (fire > 0) {
      glow(PAN[0], top + 2, 70 * fire, '#FF9A4A', .8 * fire, .05);
      for (let i = 0; i < 5; i++) { const fx = PAN[0] - 36 + i * 18, fh = (12 + 8 * Math.abs(Math.sin(t * 9 + i))) * fire; paint([[fx - 6, top], [fx, top - fh], [fx + 6, top]], { wash: '#F5A14A', ink: null }); }
    }
  }
  // 锅：盖在火上；food 0..1 锅里的东西
  function pan(x, y, food) {
    boilSeed('pan');
    paint([[x - 52, y - 30], [x + 52, y - 30], [x + 44, y - 4], [x - 44, y - 4]], { wash: '#3D3A4A', ink: PAL.ink, sw: .9 });
    paint(rectPts(x - 110, y - 26, 60, 8), { wash: '#3D3A4A', ink: PAL.ink, sw: .7 });
    for (let i = 0; i < Math.floor(food * 7); i++) paint(ellPts(x - 34 + (i % 4) * 22, y - 32 - Math.floor(i / 4) * 8, 8, 6, 8), { wash: ['#E58F5B', '#8DBF6A', '#F2C14E'][i % 3], ink: PAL.ink, sw: .4 });
  }

  // 碎剪的镜头表：[开始, 镜头中心 x, y, 缩放, 名字]；每个镜头约 0.6 秒
  const CUTS = [[12.4, 1450, 745, 5.2, 'book'], [13.0, 1192, 795, 4.3, 'face'], [13.6, 1340, 778, 5.0, 'pan'], [14.2, 1450, 745, 5.2, 'book'],
    [14.8, 1192, 795, 4.3, 'face'], [15.4, 1340, 778, 5.0, 'pan'], [16.0, 1290, 745, 2.3, 'mid']];
  const cutAt = t => { let c = null; for (const x of CUTS) if (t >= x[0]) c = x; return c; };

  function back(t) {
    let cx = 1290, cy = 745, z = 2.3;
    const c = t >= COOK[0] && t < COOK[1] ? cutAt(t) : null;
    if (c) [cx, cy, z] = [c[1], c[2], c[3]];
    camBegin(cx, cy, z);
    backstageBG(t);
    glow(MX, 420, 520, MC.lamp, .6);
    glow(1400, 760, 300, MC.lamp, .5);
    backDoor(t, 0);
    pendantLamp(MX, t, 1);
    railHook(t, BS.ROOF[0], BS.ROOF[1] - 90);
    house(MX, G, 1, { arms: true, armR: 0, armL: 0, cab: 0 }, t);
    floorTube(1);

    // Clawd：咒语一张张生效：戴帽 → 菜谱 → 冒汗；做菜时手忙脚乱，端出菜时松一口气
    const hatK = seg(t, 4.8, 5.3);
    const mood = emotions(t, [[0, 'neutral', { lookX: .7, lookY: .3 }], [5.35, 'surprised', { lookY: -1 }], [5.9, 'proud'], [7.25, 'surprised', { lookX: .8 }],
      [7.9, 'neutral', { lookX: .8, lookY: .2 }], [9.35, 'nervous'], [16.3, 'relieved'], [18.9, 'happy']], { take: .7 });
    const cl = { ...mood, view: 'q', legK: 0, boilKey: 'clawd', hat: t >= 5.3 ? 'chef' : null };
    if (t >= COOK[0] && t < COOK[1]) {   // 量勺量了又量：右手拿量勺在锅上一下下舀
      const ph = frac((t - COOK[0]) / .5);
      cl.aR = .5 + .35 * Math.sin(ph * TAU) + .1 * Math.sin(t * 23);
      cl.armR = (u, sw) => { push(); rotate(.5 * Math.sin(ph * TAU)); icon('spoon', .5 * u, 0, .7 * u, { col: MC.macLt }); pop(); };
    }
    clawd(CX0, G, U, cl);
    // 厨师帽从天而降（落到头上的那一下就是 5.3）
    if (t >= 4.7 && t < 5.3) { const k = easeIn(hatK); push(); translate(CX0 + 36, lerp(500, G + 2 * U - 8.5 * U, k)); rotate(.4 * (1 - k)); icon('hat', 0, 0, 40); pop(); }

    // 书桌 → 灶台
    const sk = seg(t, STOVE, STOVE + .8);
    if (sk <= 0) backDesk(t, 0, 1); else { stove(t, sk, seg(t, 11.4, 11.7)); const bulb = deskLamp(BS.DX + 244, 806, 1, .9); glow(...bulb, 46, MC.lamp, .9); }
    if (t >= 11.8) {
      const food = t < COOK[1] ? seg(t, COOK[0], COOK[1] - .1) : 1;
      if (t < 16.3) pan(PAN[0], PAN[1] + 6 - 16 * (1 - easeOut(seg(t, 11.8, 12.0))), food);
      // 量勺倒进锅里的小颗粒
      if (t >= COOK[0] && t < COOK[1]) for (let i = 0; i < 3; i++) { const a = frac((t - COOK[0]) / .5 + i * .33); if (a < .5) paint(ellPts(PAN[0] - 10 + i * 10, PAN[1] - 70 + a * 80, 3, 3, 6), { wash: '#F2C14E', ink: null }); }
    }
    // 菜谱：第二张纸条展开成厚菜谱，立在灶台右边；做菜时翻开
    if (t >= 6.7) {
      const grow = backOut(seg(t, 6.7, 7.2)), open = seg(t, 12.0, 12.4);
      const step = t >= COOK[0] ? Math.floor((t - COOK[0]) / .42) % 6 : -1;
      push(); translate(BOOK[0], BOOK[1]); scale(grow); translate(-BOOK[0], -BOOK[1]); recipe(BOOK[0], BOOK[1], 1, open, step); pop();
    }
    // 三张咒语纸条：从投递口弹出，落在同一个地方
    SPELLS.forEach(([txt, t0, t1], i) => {
      if (t < t0 || t >= t1 + (i === 2 ? 1.2 : .05)) return;
      const k = seg(t, t0, t0 + .35), p = arcPt([1311, 800], LAND, 70, easeOut(k));
      spellStrip(txt, p[0], p[1] - 24, .95, -.06 + .3 * (1 - k), i === 2 ? 1 - seg(t, t1 + .8, t1 + 1.2) : 1);
    });

    // 端出菜：菜从锅里朝镜头推过来（屏幕空间放大），再变回一张回答往上飞走
    camEnd();
    if (t >= 16.1 && t < 20.3) {
      const k = easeOut(seg(t, 16.2, 17.1)), back2 = ease(seg(t, 18.7, 19.5)), [px, py] = toScreen(PAN[0], PAN[1] - 30, LAST_CAM);
      const s = lerp(.6, 3.8, k) * lerp(1, .38, back2), x = lerp(px, W / 2 + 330, k), y = lerp(py, H / 2 + 170, k) - 300 * easeIn(seg(t, 19.5, 20.3));
      const morph = seg(t, 19.1, 19.6);
      boilSeed('dish');
      if (morph < 1) { push(); translate(x, y); scale(s * (1 - morph)); icon('dish', 0, 0, 90); pop(); }
      if (morph > 0) slip('answer', x, y, 1.6 * morph, -.1);
    }
  }

  // 前台：输入框里一个字一个字打出咒语（看得清原文），再点发送
  const SPELL_TXT = '你是一位资深专家。请一步一步思考。做不好我会被开除。';
  function front(t) {
    // 打字时推近输入框，让咒语原文看得清；发送后拉回看消息出现
    camBegin(540, kf(t, [[.2, 390], [.8, 470], [3.75, 470], [4.2, 390]]), kf(t, [[.2, 1.6], [.8, 2.3], [3.75, 2.3], [4.2, 1.6]]));
    const [lx, ly, lw, lh] = FD.L, SEND = [lx + lw - 40, ly + lh - 30];
    const msgs = [{ who: 'user', kind: 'text', seed: 31, y: 208, n: 1 }, { who: 'ai', kind: 'text', seed: 32, y: 254 }];
    if (t >= 3.72) msgs.push({ who: 'user', kind: 'text', seed: 41, y: 318, n: 2, tint: LC.prompt, k: snap(t, 3.72, .1) });
    if (t >= 3.9) msgs.push({ who: 'ai', kind: 'dots', seed: 42, y: 370 });
    frontDesk(t, { msgs, ed: { n: 9, seed: 3, err: 0 }, night: 1 });
    // 打字：约每秒 10 个字，发送后输入框清空
    if (t >= .5 && t < 3.72) {
      const n = Math.min(SPELL_TXT.length, Math.floor(seg(t, .5, 3.0) * SPELL_TXT.length + 1e-6));
      letter(SPELL_TXT.slice(0, n), lx + 38, ly + lh - 30, 17, PAL.ink, { align: 'left', ink: false, font: CAP_FONT(17) });
    }
    const P = [[0, 700, 470], [.4, 560, 528], [.6, 560, 528], [1.0, 790, 470], [3.1, 790, 470], [3.6, ...SEND]];   // 点进输入框后把光标挪开，不挡字
    const ck = t - 3.7, click = ck >= 0 && ck < .45;
    cursorHand(kf(t, P.map(q => [q[0], q[1]])), kf(t, P.map(q => [q[0], q[2]])), 2.4, { click: click ? ck : -1, press: click ? 1 - seg(ck, .05, .15) : 0, key: 'u' });
    camEnd();
  }

  // 结尾的前台：回答到了，光标选中、拖到编辑器里粘贴（按真人速度）
  const ANS_C = [FD.L[0] + 18 + FD.L[2] * .37, 370 + 40];
  function frontEnd(t) {
    camBegin(960, 400, 1.15);
    const msgs = [{ who: 'user', kind: 'text', seed: 31, y: 208, n: 1 }, { who: 'ai', kind: 'text', seed: 32, y: 254 },
      { who: 'user', kind: 'text', seed: 41, y: 318, n: 2, tint: LC.prompt },
      { who: 'ai', kind: 'code', seed: 43, y: 370, n: 5, k: seg(t, 19.7, 20.2), sel: seg(t, 20.6, 21.1) * (t < 21.6 ? 1 : 0) }];
    frontDesk(t, { msgs, ed: { n: 9, seed: 3, k: t < 22.25 ? 1 : seg(t, 22.25, 22.5), err: 0 }, night: 1 });
    if (t > 21.3 && t < 22.3) { const k = ease(seg(t, 21.3, 22.2)), p = arcPt(ANS_C, [1300, 290], 90, k); flyCard(p[0], p[1], 300, 90, 43, false, .1 * Math.sin(k * Math.PI)); }
    const P = [[19.6, 700, 520], [20.4, 240, 382], [20.6, 240, 382], [21.1, 700, 440], [21.3, 700, 440], [22.2, 1300, 300], [22.4, 1300, 300], [23.2, 1380, 430]];
    const x = kf(t, P.map(q => [q[0], q[1]])), y = kf(t, P.map(q => [q[0], q[2]]));
    cursorHand(x, y, 2.4, { pose: t > 20.6 && t < 22.3 ? 'grab' : 'point', key: 'u' });
    camEnd();
  }

  chapter(3, [[0, t => {
    if (t < FRONT_END) front(t); else if (t < 19.6) back(t); else frontEnd(t);
    whipLines(seg(t, FRONT_END - .12, FRONT_END + .12)); whipLines(seg(t, 19.48, 19.72));
  }]]);
})();
