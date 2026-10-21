// ch16.js：第 16 章 · 三件事（正片 71.3 秒）。三段同一结构：一个问题 → 人做了一个选择 → 结果变了。
// v002：沿用 v001（时间是 v001 时间），用 SEG 表挑段；SEG 第 4 项是播放速度（长期使用的延时 1.4 倍）；
// 取消"目标""品味""雄心"三个印章，交给气泡。
//   0–12.6   目标：许愿"修好这个崩溃"→ 打地鼠；光标把愿望划掉重写"别再崩溃"→ Clawd 搭起一条路线，安静下来
//   12.6–23.3 品味：三份结果，Clawd 自己全打绿勾；镜头摇头；外部裁判：一份红叉弹回；光标在剩下的里慢慢挑一份
//   23.3–38.3 雄心：10s → 5s → 0.2s（写完定格 1.2 秒）；Clawd 吓一跳 → 坚定 → 冲刺出画；工位延时：四季、墙上的边界地图越画越细、雾越退越远
//   38.3–48.3 交接回放：光标手里的东西一样接一样交出去，越来越快；最后只剩笔和边界地图
//   48.3–54.3 雾又退了一圈；光标把边界再往外画；镜头往雾里推，Clawd 并肩往前
//   54.3–71.3 结尾：键盘特写（C、V 的位置空着），只按一下回车；后拉抬高；推进屏幕：清晨的场地，Clawd 挥手、往右走；收在纸色上
(() => {
  const G = VN.G, U = 26, NEW = { lite: 1, sockets: 1, slot: 1, cassettes: 4 }, TR = [['#E4DDF0', 5], ['#DCEFD6', 3]];
  const PIN = [380, 300];   // 钉在左上角板子上的愿望纸条

  // 愿望纸条：图标 + 可被划掉；lines：[[内容, 划掉进度]]，内容是图标名数组或文字
  function wishCard(x, y, s, lines) {
    boilSeed('wish16'); push(); translate(x, y); scale(s);
    paint(rectPts(-120, -90, 240, 180), { wash: '#FFF1CF', ink: PAL.ink, sw: 1.2 });
    // 两行：-40、20；三行（雄心的 10s/5s/0.2s）行距收紧到 50，第三行整个落在卡片里（v004：0.2s 压在卡片下边框上）
    const y0 = lines.length > 2 ? -50 : -40, step = lines.length > 2 ? 50 : 60;
    lines.forEach(([c, strike, k = 1], i) => {
      const yy = y0 + i * step;
      if (k <= 0) return;
      if (Array.isArray(c)) c.forEach((ic, j) => icon(ic, -60 + j * 50, yy, 18 * k));
      else letter(c, x, y + yy * s, 46 * s * k, PAL.ink, { ink: false, font: `bold ${46 * s * k}px "Segoe UI", Arial` });
      if (strike > 0) inkLine([[-90, yy], [lerp(-90, 90, strike), yy - 4]], 1.1, PAL.ink, 'inkfine', 0);
    });
    pop();
  }

  // ---------- 目标 ----------
  const CRASH = []; for (let i = 0; i < 16; i++) CRASH.push({ t0: 621.6 + i * .32 * (1 - i / 40), x: 500 + 1000 * hash(i + 21), y: G - 80 - 260 * hash(i + 43) });
  function goal(t, lt) {
    venueBG(t, 960); camBegin(...(t >= 627.0 && t < 628.6 ? [PIN[0], PIN[1], 3.2] : [940, 610, 1.25]));
    venueGround(t, 960);
    // 打地鼠：崩溃的小乌云此起彼伏地冒出来，Clawd 跑过去，机械臂拍掉一个，旁边又冒出一个
    const calm = t >= 628.6;
    let target = null;
    if (!calm) for (const c of CRASH) { const a = t - c.t0; if (a >= 0 && a < .7) { const k = backOut(clamp(a / .15)) * (1 - seg(a, .5, .7)); push(); translate(c.x, c.y); scale(k); icon('crash', 0, 0, 64); emote('steam', 0, -30, 16, 1, a); pop(); target = c; } }
    const cx = target ? target.x - 180 : 900;
    const x = calm ? kf(t, [[628.6, 900], [629.2, 760]]) : 760 + 500 * Math.sin((t - 621.5) * 1.6 + .3 * Math.sin(t * 5)) * seg(t, 621.4, 622);
    const busy = t >= 621.6 && !calm;
    const mood = emotions(t, [[620, 'neutral', { lookY: -.6 }], [621.8, 'nervous'], [624.8, 'dizzy'], [628.7, 'thinking'], [631.6, 'relieved']], { take: .6 });
    agent(x, G, U, { ...mood, view: busy ? 'side' : 'q', flip: busy && Math.cos((t - 621.5) * 1.6) < 0, walk: busy ? t * 4 : null, boilKey: 'clawd' }, { ...NEW, ext: busy ? .6 + .4 * Math.sin(t * 9) : 0 }, { layers: TR, recipe: 3 }, t);
    // 新路线：收集报告 → 复现 → 验证（三个小站一个接一个立起来）
    if (calm) { [['doc', 1150], ['terminal', 1420], ['check', 1690]].forEach(([ic, sx], i) => { const k = ease(seg(t, 629.2 + i * .5, 629.7 + i * .5)); if (k > 0) { push(); translate(sx, G + (1 - k) * 260); translate(-sx, -G); station(sx, ic); pop(); } }); if (t > 630.8) inkLine([[1150, G + 14], [1690, G + 14]], 6, '#C9A06A', 'ink', 0); }
    // 钉在左上角的愿望纸条：修好这个崩溃 → 划掉 → 别再崩溃（路线图标）
    const strike = ease(seg(t, 627.3, 627.9)), rew = seg(t, 628.0, 628.5);
    wishCard(...PIN, .9, [[['crash', 'wrench'], strike], [['doc', 'terminal', 'check'], 0, rew]]);
    if (t >= 627.0 && t < 628.6) penAt(PIN[0] + (rew > 0 ? lerp(-60, 40, rew) : lerp(-90, 90, strike)) * .9, PIN[1] + (rew > 0 ? 20 : -40) * .9, 1.6);
    camEnd();
  }
  // 只画一支笔：笔尖落在 (x, y)（v002 反馈：划线、写字时不画拿笔的手）
  const penAt = (x, y, s = 2) => { push(); translate(x + 21.9 * s, y - 26 * s); penHold(s, 1); pop(); };
  const penHold = (s, sw) => { boilSeed('pen'); push(); rotate(.7); paint(rrPts(-3 * s, -2 * s, 6 * s, 30 * s, 2 * s), { wash: '#4E6FB8', ink: PAL.ink, sw }); paint([[-3 * s, 28 * s], [3 * s, 28 * s], [0, 34 * s]], { wash: PAL.cream, ink: PAL.ink, sw: sw * .7 }); pop(); };

  // ---------- 品味 ----------
  const RES = [[620, 'A'], [960, 'B'], [1300, 'C']];
  function taste(t, lt) {
    const shake = t >= 637.4 && t < 638.3 ? 34 * Math.sin((t - 637.4) * TAU * 2.2) * (1 - seg(t, 637.4, 638.3)) : 0;
    boilSeed('taste bg'); paint(rectPts(-60, -60, W + 120, H + 120), { wash: '#EFE6D6', ink: null });
    camBegin(980 + shake, 600, 1.4);
    boilSeed('taste desk'); paint(rectPts(-200, 760, W + 400, 500), { wash: '#B98D62', ink: PAL.ink, sw: 1.2 });
    // 外部裁判：校验小机器（右）、目标门（更右）
    checkerBox(1600, 600, 1.2);
    const judge = t >= 638.4;
    RES.forEach(([x, id], i) => {
      let px = x, py = 560, show = true;
      // 裁判：一份份从左往右经过校验机；B 红叉弹回
      if (judge) { const a0 = 638.6 + i * .9, k = ease(seg(t, a0, a0 + .5)), back = id === 'B' ? ease(seg(t, a0 + .7, a0 + 1.2)) : 0; px = lerp(x, 1500, k * (1 - back)) ; py = 560 - 40 * Math.sin(k * Math.PI); if (t >= a0 + .45 && t < a0 + .9) { icon(id === 'B' ? 'cross' : 'check', 1600, 470, 30); } if (id !== 'B' && t >= a0 + .5) { px = x; } }
      if (id === 'B' && t >= 640.8) { py = 560 + 120 * ease(seg(t, 640.8, 641.2)); }
      boilSeed('res' + id); paint(rectPts(px - 120, py - 150, 240, 300), { wash: '#FFFDF7', ink: PAL.ink, sw: 1.2 });
      codeLines(px - 90, py - 110, 180, 6, 200 + i * 7, 1, 22);
      icon(['cat', 'map', 'building'][i], px, py + 90, 26);
      // Clawd 自己评自己：全打绿勾
      if (t >= 636.0 + i * .3 && t < 638.4) icon('check', px + 80, py - 120, 22);
      if (id === 'B' && judge && t >= 639.9) icon('cross', px + 80, py - 120, 22);
      if (id !== 'B' && t >= 638.6 + i * .9 + .5 && t < 641.6) icon('check', px + 80, py - 120, 22);
    });
    // Clawd：得意地给自己画勾；被摇头以后不好意思
    const mood = emotions(t, [[634, 'neutral', { lookX: .6 }], [636.0, 'smug'], [638.4, 'shy']], { take: .6 });
    const cl = { ...mood, view: 'q', boilKey: 'clawd' };
    if (t >= 635.9 && t < 637.2) { cl.aR = .95 + .08 * Math.sin(t * 30); cl.armR = (u, sw) => { boilSeed('pen2'); inkLine([[0, 0], [u * .9, -u * .3]], sw * 2, PAL.ink, 'ink', 0); }; }
    agent(380, 860, 24, cl, NEW, null, t);
    // 光标在剩下的两份之间停一下，慢慢选中一份（品味）
    if (t >= 641.6) {
      const hov = kf(t, [[641.6, 1100], [642.2, 620], [642.8, 620], [643.4, 1300], [643.9, 1300]]);
      cursorHand(hov + 40, 640, 3, { pose: 'point', key: 'u', click: t - 643.9 });
      if (t >= 643.9) { boilSeed('pick'); inkLine(rectPts(1300 - 136, 560 - 166, 272, 332).concat([[1300 - 136, 560 - 166]]), 3.2, '#E8A33A', 'ink', 0); }
    }
    camEnd();
  }

  // ---------- 雄心 ----------
  function ambition(t, lt) {
    if (t < 650.5) {
      const card = t < 648.0, react = t >= 648.0 && t < 649.2;
      venueBG(t, 960);
      camBegin(...(card ? [960, 560, 2.4] : react ? [900, G - 120, 3.4] : [1100, 620, 1.2]));
      venueGround(t, 960);
      // 647.97–648.0 是定格段（SEG 里拉成 1.2 秒）：0.2s 已经写完，笔抬起来移开，让观众看清
      const s1 = ease(seg(t, 645.8, 646.3)), w2 = seg(t, 646.4, 646.7), s2 = ease(seg(t, 647.2, 647.6)), w3 = seg(t, 647.7, 647.97);
      wishCard(960, 560, 1.2, [['10s', s1], ['5s', s2, w2], ['0.2s', 0, w3]]);
      const lift = ease(seg(t, 647.97, 647.985));
      if (card && lift < 1) {   // 笔尖跟着划线、写新数字走
        const [px, py] = t < 646.4 ? [lerp(-90, 90, s1), -50] : t < 647.2 ? [lerp(-30, 30, w2), 0] : t < 647.7 ? [lerp(-90, 90, s2), 0] : [lerp(-30, 30, w3), 50];
        penAt(960 + (px + 260 * lift) * 1.2, 560 + (py - 120 * lift) * 1.2, 2);
      }
      const dash = seg(t, 649.4, 650.4);
      const mood = emotions(t, [[645, 'neutral'], [648.1, 'scared'], [648.7, 'determined']], { take: 1 });
      const x = 900 + 1400 * easeIn(dash);
      if (!card) agent(x, G, U, { ...mood, view: dash > 0 ? 'side' : 'q', walk: dash > 0 ? t * 6 : null, smear: dash > 0 ? .8 : 0, smearDir: 1, boilKey: 'clawd' }, NEW, { layers: TR, recipe: 3 }, t);
      if (dash > 0) { boilSeed('speed'); for (let i = 0; i < 6; i++) inkLine([[x - 400 - 200 * hash(i), G - 60 - i * 40], [x - 160, G - 60 - i * 40]], 1.6, '#8E9AAF', 'dry', .2); }
      camEnd();
      return;
    }
    // 长期使用的延时：第 13 章那个工位镜头，机位完全不变
    const k = seg(t, 650.6, 659.4);
    boilSeed('office wall16'); paint(rectPts(-60, -60, W + 120, H + 120), { wash: '#EDE3D2', ink: null });
    camBegin(1080, 600, 1.2);
    // 窗外：四季的树 + 越退越远的雾
    boilSeed('win16'); paint(rectPts(1290, 120, 420, 420), { wash: '#8A6F55', ink: PAL.ink, sw: 1.4 }); paint(rectPts(1310, 140, 380, 380), { wash: '#BFE0F2', ink: null });
    const season = Math.floor(k * 4) % 4, leaf = ['#7FB060', '#E0A040', null, '#A8D88A'][season];
    paint(ellPts(1700 - 200 * k + 300, 400, 160, 200, 24, 0), { fill: '#D6CFE2', fillOp: 200 * (1 - k), bleed: .3, tex: .5, ink: null });
    inkLine([[1420, 520], [1420, 360], [1380, 300]], 6, '#6E5440', 'ink', .3); inkLine([[1420, 400], [1470, 330]], 4, '#6E5440', 'ink', .3);
    if (leaf) paint(ellPts(1430, 300, season === 3 ? 60 : 110, season === 3 ? 50 : 90, 20), { wash: leaf, ink: PAL.ink, sw: 1 });
    inkLine([[1500, 140], [1500, 520]], 2, '#8A6F55', 'ink', 0); inkLine([[1310, 330], [1690, 330]], 2, '#8A6F55', 'ink', 0);
    // 墙上的边界地图：越画越细
    boilSeed('wallmap'); paint(rectPts(700, 140, 420, 300), { wash: '#EFE2C4', ink: PAL.ink, sw: 1.2 });
    for (let r = 0; r < 1 + Math.floor(k * 5); r++) inkLine(ellPts(910, 290, 40 + r * 34, 30 + r * 22, 22).concat([[950 + r * 34, 290]]), 1.6, '#7B5CA8', 'ink', .3);
    boilSeed('office floor16'); paint(rectPts(-200, 880, W + 400, 400), { wash: '#C9B497', ink: null });
    // 相邻的工位：Clawd 坐在旁边；偶尔击掌、一起挠头
    boilSeed('cl desk16'); paint(rectPts(1240, 700, 360, 24), { wash: '#C98F5E', ink: PAL.ink, sw: 1.1 });
    const hi = [652.4, 656.0].find(a => t >= a && t < a + .8), scratch = t >= 654.0 && t < 655.0;
    agent(1100, 880, 26, { ...feel(hi ? 'excited' : scratch ? 'confused' : 'happy', t), view: 'front', legK: 0, aR: hi ? 1.5 : scratch ? 1.4 + .2 * Math.sin(t * 20) : .2, boilKey: 'clawd' }, NEW, null, t);
    boilSeed('our desk16'); paint(rectPts(-200, 760, 900, 400), { wash: '#B98D62', ink: PAL.ink, sw: 1.4 }); paint(rrPts(60, 330, 520, 360, 16), { wash: FD.bezel, ink: PAL.ink, sw: 1.4 }); paint(rectPts(80, 350, 480, 320), { wash: FD.chat, ink: null });
    if (hi) cursorHand(1250, 500, 2.4, { pose: 'open', key: 'u', click: t - hi - .2 });
    if (scratch) cursorHand(480 + 12 * Math.sin(t * 30), 300, 2.4, { key: 'u' });
    camEnd();
  }

  // ---------- 交接回放 ----------
  const ITEMS = ['keys', 'spell', 'tools', 'socket', 'cassette', 'cabinet', 'blueprint', 'gate', 'badge', 'order'];
  // 每样东西代表一件原来由我们做的活（交到 Clawd 手里 = 这件活交给了 Agent）
  const JOBS = ['复制粘贴', '写咒语', '动手执行', '接外部系统', '教它做法', '管上下文', '定流程', '验收结果', '一个岗位', '拆解任务'];
  const ITT = []; { let a = 661.3; for (let i = 0; i < ITEMS.length; i++) { ITT.push(a); a += lerp(.95, .45, i / (ITEMS.length - 1)); } }
  function drawItem(name, x, y, s) {
    push(); translate(x, y); scale(s); boilSeed('item' + name);
    switch (name) {
      case 'keys': keycap(-48, -16, 44, 31, 'C', 0, false, 'ik1'); keycap(4, -16, 44, 31, 'V', 0, false, 'ik2'); break;
      case 'spell': paint(rectPts(-70, -14, 140, 28), { wash: LC.prompt, ink: PAL.ink, sw: .8 }); break;
      case 'tools': flyCard(0, 0, 130, 50, 61, false, 0); icon('folder', -36, 0, 10); icon('terminal', 0, 0, 10); icon('search', 36, 0, 10); break;
      case 'socket': for (let i = 0; i < 3; i++) paint(rrPts(-14, -46 + i * 32, 28, 28, 5), { wash: MC.macLt, ink: PAL.ink, sw: .7 }); break;
      case 'cassette': cassette(0, 0, .35, { key: 'ic', label: () => {} }); break;
      case 'cabinet': fileCabinet(-40, 50, .35, {}); break;
      case 'blueprint': blueprint(0, 0, .5, 'armchair'); break;
      case 'gate': push(); scale(.25); translate(0, 280 - VN.G); goalGate(0, T, 1, ['g', 'g', 'g', 'g', 'g']); pop(); break;
      case 'badge': paint(rectPts(-30, -22, 60, 44), { wash: PAL.cream, ink: PAL.ink, sw: .8 }); paint(rectPts(-22, -14, 18, 22), { wash: PAL.clay, ink: null }); break;
      case 'order': paint(rectPts(-40, -54, 80, 108), { wash: '#FFF1CF', ink: PAL.ink, sw: .8 }); icon('dish', 0, 0, 22); break;
    }
    pop();
  }
  function replay(t, lt) {
    boilSeed('replay bg'); paint(rectPts(-60, -60, W + 120, H + 120), { wash: '#EFE6D6', ink: null });
    paint(ellPts(W / 2, H / 2, W * .5, H * .45, 30, 0), { fill: '#F8F0E2', fillOp: 120, bleed: .3, tex: .5, ink: null });
    camBegin(1080, 580, 1.25);
    // 右边：Clawd 和背包那边，接过每一样
    agent(1560, 880, 30, { ...feel('happy', t), view: 'q', flip: true, aL: .9, boilKey: 'clawd' }, NEW, null, t);
    // 一样接一样：出现在光标手里 → 交到右边
    const i = ITT.reduce((a, b, j) => t >= b ? j : a, -1);
    for (let j = 0; j < ITEMS.length; j++) {
      const a = ITT[j], d = (ITT[j + 1] ?? a + .5) - a;
      if (t < a - .05 || t > a + d + .2) continue;
      const k = ease(seg(t, a + d * .45, a + d * .95)), appear = backOut(seg(t, a - .05, a + .15));
      drawItem(ITEMS[j], lerp(860, 1380, k), 520 - 140 * Math.sin(k * Math.PI), lerp(2.8, 1.2, k) * appear);
    }
    // 交过去的活，一条条记在上方的清单里（两列）
    boilSeed('jobs');
    letter('原来是我们的活，现在交给 Agent：', 1180, 165, 24, PAL.ink, { ink: false, font: CAP_FONT(24) });
    JOBS.forEach((job, j) => {
      const a = ITT[j], d = (ITT[j + 1] ?? a + .5) - a, k = seg(t, a + d * .9, a + d * .9 + .2);
      if (k > 0) { const col = j < 5 ? 0 : 1, row = j % 5; icon('check', 1000 + col * 260, 215 + row * 34, 9 * k); letter(job, 1018 + col * 260, 216 + row * 34, 20, PAL.ink, { align: 'left', ink: false, alpha: k, font: CAP_FONT(20) }); }
    });
    const done = t >= ITT[ITT.length - 1] + .5;
    // 最后：光标手里只剩一支笔和一张边界地图
    if (done) { const k = backOut(seg(t, ITT[ITT.length - 1] + .5, ITT[ITT.length - 1] + .8)); boilSeed('lastmap'); push(); translate(780, 600); scale(k); paint(rectPts(-110, -80, 220, 160), { wash: '#EFE2C4', ink: PAL.ink, sw: 1 }); for (let r = 0; r < 3; r++) inkLine(ellPts(0, 0, 30 + r * 24, 22 + r * 16, 20).concat([[30 + r * 24, 0]]), 1.4, '#7B5CA8', 'ink', .3); pop(); }
    cursorHand(860, 600, 4.2, { pose: done ? 'grab' : 'open', key: 'u', hold: done ? penHold : null });
    camEnd();
  }

  // ---------- 走向新边界 ----------
  function frontier(t, lt) {
    boilSeed('fr sky'); paint(rectPts(-60, -60, W + 120, H + 120), { wash: '#E9E4EF', ink: null });
    const push2 = ease(seg(t, 673.4, 677));
    camBegin(lerp(960, 1300, push2), lerp(700, 560, push2), lerp(1.0, 1.4, push2));
    boilSeed('fr ground'); paint(rectPts(-2000, G, 7000, 600), { wash: '#D9D2C2', ink: null });
    // 雾又往外退了一圈
    const fx = lerp(1300, 1700, ease(seg(t, 671.2, 672.6)));
    boilSeed('fr fog'); paint(rectPts(fx, -400, 4000, G + 400), { wash: '#D6CFE2', ink: null }); for (let i = 0; i < 5; i++) paint(ellPts(fx + 40 + i * 330, G - 240 + 80 * Math.sin(i * 2), 340, 400, 30, 0), { fill: '#CEC7DB', fillOp: 220, bleed: .35, tex: .5, ink: null });
    // 光标在地图上再往外画一圈
    if (t < 673.6) { boilSeed('frmap'); paint(rectPts(260, 360, 380, 300), { wash: '#EFE2C4', ink: PAL.ink, sw: 1.2 }); for (let r = 0; r < 4; r++) inkLine(ellPts(450, 510, 40 + r * 28, 30 + r * 20, 22).concat([[490 + r * 28, 510]]), 1.4, '#7B5CA8', 'ink', .3); const q = seg(t, 672.6, 673.4); inkLine(ellPts(450, 510, 160, 120, 30).slice(0, Math.max(2, Math.round(30 * q))), 2, '#7B5CA8', 'ink', .3); penAt(450 + 160 * Math.cos(q * TAU), 510 + 120 * Math.sin(q * TAU), 2); }
    // Clawd 从左边走进来，和镜头并肩往前
    const x = kf(t, [[673.2, 200], [677, 1200]]);
    if (t >= 673.2) agent(x, G, 26, { ...feel('determined', t), view: 'side', walk: t * 3.2, boilKey: 'clawd' }, NEW, { layers: TR, recipe: 3 }, t);
    camEnd();
  }

  // ---------- 结尾 ----------
  function ending(t, lt) {
    if (t < 685.4) {
      // 键盘特写 → 第一人称两块屏幕（清晨），镜头缓缓后拉抬高（往后一靠）→ 推进屏幕
      const kb = t < 679.6;
      const lean = ease(seg(t, 680.2, 683.2)), dive = easeIn(seg(t, 683.4, 685.4));
      const cam = kb ? [752, 926, 4.9] : [lerp(540, 600, lean) , lerp(390, 300, lean), lerp(1.6, 1.1, lean) * lerp(1, 4, dive)];
      if (!kb) { cam[0] = lerp(cam[0], 540, dive); cam[1] = lerp(cam[1], 380, dive); }
      camBegin(...cam);
      const enter = t >= 679.0 && t < 679.4 ? 1 - Math.abs(t - 679.1) / .3 : 0;
      frontDesk(t, { msgs: [{ who: 'user', kind: 'text', seed: 91, y: 208, n: 1, k: seg(t, 679.2, 679.4) }], ed: { n: 9, seed: 3, ok: 1 }, keys: { enter }, gone: true, night: kf(t, [[677, .35], [684, .15]]), typing: seg(t, 677.6, 678.9) * (t < 679.2 ? 1 : 0) });
      // 被抠走的 C、V 留下两个坑
      const CK = keyAt(3, 4), VK = keyAt(3, 5); keycap(CK[0], CK[1], 44, 31, '', 0, true, 'holec'); keycap(VK[0], VK[1], 44, 31, '', 0, true, 'holev');
      if (kb) { const [ex, ey] = keyAt(2, 13); cursorHand(ex + 30, ey + 10, 1.6, { press: enter, click: t - 679.05, key: 'u' }); }
      camEnd();
      if (dive > .6) { boilSeed('endiris'); const k = seg(dive, .6, 1), w = lerp(1600, 3400, k), h = lerp(950, 2000, k); irisShape(rectPts(W / 2 - w / 2, H / 2 - h / 2, w, h), FD.bezel); }
      return;
    }
    // 屏幕后面是亮的：清晨的场地，Clawd 挥手，转身往右走；镜头上摇停在清晨的天空，天边留一圈淡雾
    const up = ease(seg(t, 688.6, 691.8));
    boilSeed('dawn sky'); paint(rectPts(-60, -60, W + 120, H + 120), { wash: '#F7D9B0', ink: null });
    paint(ellPts(W / 2, H * .2, W * .9, H * .4, 30, 0), { fill: '#BFD9EE', fillOp: 160, bleed: .3, tex: .5, ink: null });
    camBegin(1000, lerp(620, -40, up), 1.1);
    glow(1500, -200, 600, '#FFE6B0', .7);
    paint(ellPts(1000, 300, 1600, 70, 30, 0), { fill: '#E2DCEA', fillOp: 180, bleed: .4, tex: .5, ink: null });   // 天边那圈淡雾
    boilSeed('dawn ground'); paint(rectPts(-2000, G, 7000, 600), { wash: '#A8CE88', ink: null }); paint(rectPts(-2000, G + 26, 7000, 600), { wash: VN.soil, ink: null });
    for (const [ic, sx] of [['doc', 300], ['search', 560], ['question', 1300], ['check', 1560]]) station(sx, ic);
    goalGate(1800, t, 1, ['g', 'g', 'g', 'g', 'g']);
    const wave = t < 687.4, walk = stroll(t, 687.6, 690.5, 950, 1700, U);
    const cl = { ...feel(wave ? 'happy' : 'excited', t), view: wave ? 'front' : 'side', walk: wave ? null : walk.walk, aL: wave ? 1.2 + .5 * Math.sin((t - 685.4) * 13) : .3, boilKey: 'clawd' };
    agent(wave ? 950 : walk.x, G, U, cl, NEW, null, t);
    camEnd();
    flash(1 - seg(t, 685.4, 685.9), '#FFF4DA');
    boilSeed('transition'); if (t > 692.2) brushWipe(Math.min(.5, (t - 692.2) / .8 * .5), ['#EFE6D6', PAL.paper]);   // 笔刷擦过，收在纸色上
  }

  // 本章时间 → v001 时间：[本章起, 本章止, v001 起, 播放速度（默认 1）]；段与段之间是硬切
  // v005：写"0.2s"放慢到 0.5 倍（真人写字速度），写完定格 1.2 秒再切 Clawd 吓一跳（v004 反馈：0.2 一写完就切走，观众还没看见）
  const SEG = [[0, 4.4, 620.0], [4.4, 12.6, 625.8], [12.6, 26.0, 634.3], [26.0, 26.6, 647.7, .45], [26.6, 27.8, 647.97, .025], [27.8, 30.4, 648.0],
    [30.4, 36.69, 650.6, 1.4], [36.69, 71.3, 659.4]];
  const oldT = u => { const g = SEG.find(([a, b]) => u >= a && u < b) || SEG[SEG.length - 1]; return g[2] + (u - g[0]) * (g[3] || 1); };
  chapter(16, [[0, u => {
    const t = oldT(u);
    (t < 634 ? goal : t < 645 ? taste : t < 661 ? ambition : t < 671 ? replay : t < 677 ? frontier : ending)(t);
    for (const c of [12.6, 23.3, 36.79, 46.79, 52.79]) whipLines(seg(u, c - .12, c + .12), '#E8E1CF');
  }]]);
})();
