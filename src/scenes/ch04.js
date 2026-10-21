// ch04.js：第 4 章 · ReAct 循环，以及 Agent 的诞生（正片 58.1 秒）。全片的分水岭。
// v002：前台全部按本章时间重写（真人操作速度）；后台沿用 v001 的时间（样片段落已通过），用下面的 SEG 表把本章时间映射到 v001 时间。
//   调节奏：改 SEG 表（后台段落的起止、对应的 v001 时间），前台各段的动作时间在 front() 里，气泡和配乐要跟着对。
//   0–3.6    前台：光标把 Ctrl+C、Ctrl+V 两个键帽抠下来，拖进屏幕
//   3.6–6.2  后台：收发室的机械臂接住键帽，装到自己身上（从此替人复制粘贴）
//   6.2–9.6  前台：拖进一张工具清单、打开"允许动手"开关 → 9.6–11.4 后台：工具清单落到纸摞上
//   11.4–13.6 前台：打字、发出"修好它"，出现"正在输入"
//   13.6–39   ReAct 三圈，每圈都看得清"判断"：读纸摞 → 能给结论吗？（头上冒问号，再亮叉或勾）→ 不能就写执行单 → 机器去办 → 结果钉回纸摞
//             第一圈取文件（跟拍），第二圈跑代码报错，第三圈改了再跑、通过 → 能给结论了，写回答；中间切一次前台：用户只问了一次，还在等
//             （样片反馈：v001 后半段一连十圈太快，看不清每圈在干什么）
//   39–40.2   前台只看到一条"修好了"，镜头点头
//   40.2–52   收发室收拢成背包、扣上、站起来、机械臂弹出、高兴；两个小标签分别指 Clawd（模型）和背包（Harness）
//   52–58.1   背着沉背包晃到门口，门开，光涌进来
(() => {
  const { G, U, CX0, MX } = BS;
  const CHIMNEY = [MX - 130, G - 528];
  const PG = packGeom(U, 0);

  // ---------- 一圈圈的循环 ----------
  // 每圈：p 塞进执行单的时刻，d 这一圈的长度，res 收发室办完的结果（file 文件、x 红叉、ok 绿勾），ic 执行单上的图标
  // v002：三圈都按正常速度演：取文件 → 跑代码报错 → 改了再跑、通过
  const LOOPS = [{ p: 120.2, d: 5.8, res: 'file', ic: ['search', 'folder'] }, { p: 127.0, d: 4.4, res: 'x', ic: ['terminal'] }, { p: 133.6, d: 4.4, res: 'ok', ic: ['wrench', 'terminal'] }];
  // 每次读完纸摞后的判断"能给结论吗？"：[开始, 结束, 能不能]。前一半头上冒问号，后一半亮叉（还不能）或勾（能了）
  const JUDGE = [[118.9, 119.7, false], [126.0, 126.7, false], [131.9, 132.6, false], [138.2, 138.95, true]];
  // 循环里各段的时间（占这一圈长度的比例）
  const lp = (L, a) => L.p + a * L.d;
  const loopAt = t => { for (let i = LOOPS.length - 1; i >= 0; i--) if (t >= LOOPS[i].p) return i; return -1; };
  const doneLoops = t => LOOPS.filter(L => t >= lp(L, .55)).length;

  // 纸摞的层：前几章留下的对话和咒语 → 工具清单 → "修好它" → 每圈钉回一页结果
  function layersAt(t) {
    const Q = ['dialog', 5], A = ['#D6E5F2', 5];
    const L = [Q, A, Q, A, ['dialog', 14], ['prompt', 4], ['prompt', 4], ['prompt', 4], A];
    if (t >= 114.2) L.push(['tools', 9]);
    if (t >= 117) L.push(Q);
    LOOPS.forEach(Lp => { if (t >= lp(Lp, .55)) L.push(['result', Lp.d >= 1 ? 6 : 4]); });
    return L;
  }
  // 纸摞的位置：在书桌上；每圈先吊回屋顶（钉结果），再送回书桌
  function stackAt(t) {
    const [rx, ry] = BS.ROOF, [dx, dy] = BS.DESKTOP, up = 400;
    const path = k => k < .2 ? [rx, lerp(ry, up, ease(k / .2))] : k < .8 ? [lerp(rx, dx, ease((k - .2) / .6)), up] : [dx, lerp(up, dy, ease((k - .8) / .2))];
    if (t < 113.4) return [rx, ry];
    if (t < 117.2) return t < 116.2 ? [rx, ry] : path(seg(t, 116.2, 117.2));
    const i = loopAt(t);
    if (i < 0) return [dx, dy];
    const L = LOOPS[i];
    if (t < lp(L, .4)) return path(1 - seg(t, L.p, lp(L, .4)));
    if (t < lp(L, .6)) return [rx, ry];
    if (t < lp(L, .9)) return path(seg(t, lp(L, .6), lp(L, .9)));
    return [dx, dy];
  }

  // ---------- 段落表：本章时间 → 前台 / 后台（后台给出对应的 v001 时间起点） ----------
  const SEG = [
    ['F', 0, 3.6], ['B', 3.6, 6.2, 106.0], ['F', 6.2, 9.6], ['B', 9.6, 11.4, 113.4], ['F', 11.4, 13.6],
    ['B', 13.6, 30.7, 116.9],                                                       // 第一圈（跟拍）、第二圈（报错）
    ['F', 30.7, 32.5], ['B', 32.5, 39.0, 134.0],                                     // 前台还在等；第三圈通过、写回答
    ['F', 39.0, 40.2], ['B', 40.2, 58.1, 141.5],                                     // 修好了；收成背包 → 走向门口
  ];
  const segAt = u => SEG.find(([, a, b]) => u >= a && u < b) || SEG[SEG.length - 1];

  // ---------- 前台（本章时间） ----------
  const CK = keyAt(...KEY.c.slice(0, 2)), VK = keyAt(...KEY.v.slice(0, 2));
  const CKC = [CK[0] + 22, CK[1] + 14], VKC = [VK[0] + 22, VK[1] + 14];   // 两个键帽的中心
  const INTO = [600, 560];                                                 // 键帽被拖进屏幕的位置（屏幕下沿的输入框）
  const TOGGLE = [FD.L[0] + FD.L[2] - 49, FD.L[1] + 16], SEND = [FD.L[0] + FD.L[2] - 40, FD.L[1] + FD.L[3] - 30];

  function front(u) {
    // 镜头：抠键帽时看键盘和屏幕下沿；拖工具清单时看两块屏幕；其余看聊天框（"修好了"时点一下头）
    const cam = u < 3.6 ? [720, 760, 2.6] : u < 9.6 ? [960, 400, 1.15] : [540, 390 + (u >= 39.0 ? 14 * Math.sin(seg(u, 39.4, 39.9) * Math.PI) : 0), 1.6];
    camBegin(...cam);
    const msgs = [{ who: 'user', kind: 'text', seed: 41, y: 208, n: 1, tint: LC.prompt }, { who: 'ai', kind: 'text', seed: 42, y: 256, n: 2 }];
    if (u >= 7.85) msgs.push({ who: 'user', kind: 'text', seed: 51, y: 330, n: 1, tint: LC.tools, k: snap(u, 7.85, .1) });
    if (u >= 13.02) msgs.push({ who: 'user', kind: 'text', seed: 52, y: 378, n: 1, k: snap(u, 13.02, .1) });
    if (u >= 13.2) msgs.push(u < 39.1 ? { who: 'ai', kind: 'dots', y: 428, seed: 53 } : { who: 'ai', kind: 'done', seed: 53, y: 428, n: 1, k: seg(u, 39.1, 39.4) });
    const typing = u >= 11.6 && u < 13.0 ? seg(u, 11.6, 12.4) : 0;
    // 被抠走的键帽留下坑（frontDesk 的 gone 只画抠走的那几个）
    frontDesk(u, { msgs, typing, ed: { n: 9, seed: 3, err: 1 }, gone: (u >= .55 ? 'c' : '') + (u >= 2.25 ? 'v' : ''), night: 1 });
    // 工具清单里的小图标、"允许动手"开关（聊天框顶栏右边）、"修好它"上的扳手
    if (u >= 7.85) { icon('folder', 820, 349, 8); icon('terminal', 840, 349, 8); icon('search', 860, 349, 8); }
    const sw = seg(u, 8.8, 8.95);
    boilSeed('toggle'); paint(rrPts(FD.L[0] + FD.L[2] - 74, FD.L[1] + 6, 50, 20, 10), { wash: mixCol('#8C8A9A', MC.amber, sw), ink: PAL.ink, sw: .6 });
    paint(ellPts(FD.L[0] + FD.L[2] - 64 + 30 * sw, FD.L[1] + 16, 8, 8, 10), { wash: PAL.cream, ink: PAL.ink, sw: .5 });
    if (u >= 13.02) icon('wrench', FD.L[0] + FD.L[2] - 150, 397, 9);

    // 光标：每段一张关键帧表 [时间, x, y]；grab 段用抓的手
    let P, grab = false, clicks = [];
    if (u < 3.6) {
      P = [[0, 1000, 600], [.5, ...CKC], [.6, ...CKC], [.9, CKC[0], CKC[1] - 30], [1.5, ...INTO], [1.6, INTO[0] + 20, INTO[1] + 10],
        [2.1, ...VKC], [2.25, ...VKC], [2.55, VKC[0], VKC[1] - 30], [3.2, ...INTO], [3.6, INTO[0] + 60, INTO[1] + 40]];
      grab = (u > .5 && u < 1.55) || (u > 2.15 && u < 3.25);
    } else if (u < 9.6) {
      P = [[6.2, 1300, 420], [6.7, 1400, 330], [6.8, 1400, 330], [7.8, 560, 360], [7.9, 560, 360], [8.6, ...TOGGLE], [9.6, TOGGLE[0], TOGGLE[1] + 14]];
      grab = u > 6.7 && u < 7.85; clicks = [8.75];
    } else if (u < 13.6) {
      P = [[11.4, 700, 470], [11.6, 790, 470], [12.4, 790, 470], [12.9, ...SEND], [13.6, ...SEND]]; clicks = [13.0];
    } else P = [[0, 700, 500]];
    const x = kf(u, P.map(q => [q[0], q[1]])), y = kf(u, P.map(q => [q[0], q[2]]));
    let click = -1;
    for (const c of clicks) if (u >= c && u < c + .45) click = u - c;
    const wait = u >= 30.7 && u < 32.5;                                    // 等的时候一下下点桌面
    if (wait) click = frac((u - segAt(u)[1]) / .5) * .5;

    // 抓着的键帽：跟着光标，拖进屏幕后缩小消失（不用 push/scale，键上的字才跟得上）
    const capAt = (lab, g0, g1, gone) => {
      if (u < g0 || u >= gone + .25) return;
      const s = u < gone ? 1 : 1 - ease(seg(u, gone, gone + .25));
      const cx = u < g1 ? x - 4 : INTO[0], cy = u < g1 ? y + 26 : INTO[1];   // 抓着时键帽在手下面露出来
      keycap(cx - 22 * s, cy - 15 * s, 44 * s, 31 * s, s > .4 ? lab : '', 0, false, 'held' + lab);
    };
    capAt('C', .55, 1.5, 1.5); capAt('V', 2.25, 3.2, 3.2);
    // 拖进来的工具清单卡片
    if (u >= 6.2 && u < 7.85) {
      const dk = ease(seg(u, 6.8, 7.8)), cx = lerp(1400, 560, dk), cy = lerp(330, 360, dk) - 60 * Math.sin(dk * Math.PI);
      flyCard(cx, cy, 200, 60, 61, false, .05);
      icon('folder', cx - 50, cy, 12); icon('terminal', cx, cy, 12); icon('search', cx + 50, cy, 12);
    }
    cursorHand(x, y, cam[2] > 1.9 ? 1.8 : 2.4, { pose: grab ? 'grab' : 'point', click, press: click >= 0 && click < .15 ? 1 : 0, key: 'u' });
    camEnd();
  }

  // ---------- 后台 ----------
  function camBack(t) {
    // 判断的时候推近脸，看清问号和叉 / 勾（第一次判断在跟拍镜头里，不推）
    if (JUDGE.slice(1).some(([a, b]) => t >= a && t < b)) return [1185, 735, 2.9];
    if (t < 110) return [700, 560, 1.5];
    if (t < 116) return [720, 540, 1.6];
    if (t < 126) return kf(t, [[118, [1250, 720, 1.8]], [120.2, [1250, 720, 1.8]], [121.0, [900, 760, 1.6]], [121.7, [640, 700, 1.5]], [122.4, [560, 640, 1.45]], [123.5, [620, 560, 1.45]], [124.1, [900, 560, 1.45]], [125.0, [1250, 700, 1.75]], [126, [1250, 720, 1.8]]]);
    if (t < 141.5) return [950, 620, 1.36];
    return kf(t, [[141.5, [900, 640, 1.42]], [143.9, [940, 650, 1.5]], [144.08, [940, 650, 1.5]], [144.4, [1170, 728, 2.0]], [145.15, [1170, 730, 2.02]], [145.9, [1180, 690, 1.75]],
      [147.0, [1210, 680, 1.6]], [149.8, [1210, 680, 1.6]], [150.3, [1210, 610, 1.3]], [153.0, [1210, 610, 1.3]], [157.4, [1500, 662, 1.45]], [158, [1560, 680, 1.6]], [160, [1790, 700, 2.6]]]);
  }

  function back(t) {
    const LAND = 144.0, worn = t >= LAND;
    const shake = worn ? shakeXY(t, 12 * Math.exp(-(t - LAND) * 7)) : [0, 0], ss = [0, 0];   // v002 取消印章，也就没有盖章的震动
    const [cx, cy, z] = camBack(t);
    camBegin(cx + shake[0] + ss[0], cy + shake[1] + ss[1], z);
    backstageBG(t);
    const doorK = ease(seg(t, 157.5, 157.95));
    glow(MX, 420, 520, MC.lamp, .6);
    backDoor(t, doorK);
    pendantLamp(MX, t, 1);

    // 管道、滑轨、纸摞
    const [sx, sb] = stackAt(t), L = layersAt(t), SS = 1.7, SW = 150;
    const hTot = L.reduce((a, [, h]) => a + h * SS * 1.25, 0), cradleTop = sb - Math.max(70, hTot + 26);
    const railRet = snap(t, 142.5, .36);
    railHook(t, sx, cradleTop + 4, railRet);

    // 收发室：键帽装在面板上、小终端、计数器；最后收拢成背包飞走
    const li = loopAt(t), Lc = li >= 0 ? LOOPS[li] : null;
    const working = Lc && t >= lp(Lc, .4) && t < lp(Lc, .55);
    const termRes = Lc && t >= lp(Lc, .48) && t < lp(Lc, .9) ? Lc.res : null;
    const pin = Lc && t >= lp(Lc, .5) && t < lp(Lc, .6) ? Lc : null;
    const cabPull = li === 0 && t >= 122.3 && t < 123.3;
    const extra = sw => {
      // 面板上的键帽：字按世界坐标单独写（letter() 不跟 house 的 translate 走）
      if (t >= 107.6) { keycap(-176, -276, 40, 30, '', 0, false, 'mc'); letter('C', MX + jolt - 156, G - 263, 15, PAL.ink, { ink: false, font: 'bold 15px "Segoe UI", Arial, sans-serif' }); }
      if (t >= 108.2) { keycap(-126, -276, 40, 30, '', 0, false, 'mv'); letter('V', MX + jolt - 106, G - 263, 15, PAL.ink, { ink: false, font: 'bold 15px "Segoe UI", Arial, sans-serif' }); }
      if (t >= 114.4) {   // 小终端：干活时刷刷滚字，最后亮出结果
        paint(rrPts(40, -276, 128, 92, 8), { wash: '#232638', ink: PAL.ink, sw });
        if (working) for (let i = 0; i < 4; i++) paint(rectPts(52, -262 + i * 16, 40 + 60 * hash(i + Math.floor(t * 12)), 6), { wash: '#7FC8C2', ink: null });
        if (termRes === 'x') icon('cross', 104, -230, 26); else if (termRes === 'ok') icon('check', 104, -230, 26); else if (termRes === 'file') icon('doc', 104, -230, 24);
      }
      if (t >= 120.2) {   // 机械计数器：第几圈
        const n = loopAt(t) + 1;
        paint(rrPts(52, -170, 104, 44, 6), { wash: PAL.cream, ink: PAL.ink, sw });
        letter(String(n), MX + 104 * 1, G - 148, 30, PAL.ink, { ink: false, font: 'bold 30px "Segoe UI", Arial' });
      }
    };
    const shrink = t < 143.0 ? 1 : t < 143.25 ? lerp(1, .66, snap(t, 143.0, .08)) : lerp(.66, PG.s, snap(t, 143.25, .08));
    const jolt = (t > 141.6 && t < 141.66 ? 6 : 0) + (t > 141.75 && t < 141.81 ? -6 : 0) + (working ? 3 * Math.sin(t * 60) : 0);
    const catchK = t >= 106 && t < 108.6;
    const st = {
      arms: true, armL: snap(t, 142.0), armR: snap(t, 142.25), cab: snap(t, 142.75, .14), jolt, extra: shrink > .99 ? extra : null,
      win: Math.max(t > 120.2 + 1.4 && t < 123 ? Math.exp(-(t - 121.6) * 4) : 0, t > 140.0 ? Math.exp(-(t - 140.0) * 5) : 0),
      armPose: catchK ? (w, p) => w === 'R' ? [kf(t, [[106, -.6], [106.4, -1.5], [107.2, -1.2], [107.6, -.3]]), -.8, -.6] : [kf(t, [[106.6, -.6], [107.0, -1.5], [107.8, -1.2], [108.2, -.3]]), -.8, -.6]
        : pin ? (w, p) => w === 'R' ? [-2.2 + .25 * snap(t, lp(pin, .52), .08), -.9, -.7] : p
        : cabPull ? (w, p) => w === 'L' ? [kf(t, [[122.3, -.4], [122.6, .9], [122.9, .9], [123.3, -1.6]]), kf(t, [[122.3, 1], [122.6, .5], [123.3, -.6]]), .3] : p : null,
      armHold: cabPull && t > 122.6 ? (w => w === 'L' ? icon('doc', 0, 0, 16) : null) : null,
    };
    const hop = seg(t, 143.5, 143.97);
    if (t < 143.97) {
      const [hx, hy] = hop > 0 ? arcPt([MX, G], [CX0 + PG.bx, G + 2 * U + PG.by], 260, easeOut(hop) * .3 + ease(hop) * .7) : [MX, G];
      push(); translate(hx, hy); rotate(hop > 0 ? -.35 * Math.sin(hop * Math.PI) : 0); house(0, 0, shrink, st, t); pop();
    }
    // 文件柜抽屉拉开（第一圈取文件）
    if (cabPull && t < 123.0) { boilSeed('drawer'); paint(rectPts(MX - 282 - 40 * seg(t, 122.3, 122.5), G - 190, 84, 80), { wash: MC.mac, ink: PAL.ink, sw: 1 }); }
    // 键帽从画面上方落下，被机械臂接住
    for (const [a, lab, x] of [[106.0, 'C', MX + 300], [106.6, 'V', MX + 340]]) if (t >= a && t < a + .5) { const k = easeIn(seg(t, a, a + .45)); keycap(x - 20, lerp(-60, 300, k) - 15, 40, 30, lab, 0, false, 'fall' + lab); }
    // 工具清单从上方落到屋顶的纸摞上
    if (t >= 113.4 && t < 114.2) { const k = easeIn(seg(t, 113.4, 114.1)); flyCard(BS.ROOF[0] + 20, lerp(-80, BS.ROOF[1] - hTot - 30, k), 150, 46, 61, false, .3 * (1 - k)); }

    // ReAct 的三个小图标：想（书桌上方）→ 做（收发室）→ 看（滑轨上），旁边小字
    if (t >= 125.8 && t < 141.5) {
      const a = seg(t, 125.8, 126.3);
      boilSeed('react');
      icon('think', 1150, 600, 24 * a); icon('gear', MX + 250, 470, 22 * a); icon('eye', 1000, 340, 22 * a);
      for (const [p, q] of [[[1120, 580], [MX + 285, 470]], [[MX + 270, 440], [970, 345]], [[1035, 350], [1150, 570]]]) if (a > .5) inkLine([p, [lerp(p[0], q[0], .5), lerp(p[1], q[1], .5) - 20], q], .8, PAL.cream, 'inkfine', .5);
      if (a > .9) letter('ReAct', 1000, 395, 22, PAL.cream, { ink: false, alpha: .9, font: CAP_FONT(22) });
    }

    // Clawd
    const mood = emotions(t, [[100, 'neutral'], [118, 'thinking', { lookX: .6, lookY: .5 }], [118.9, 'neutral', { lookY: -.7 }], [119.5, 'neutral', { lookX: .8, lookY: .4 }], [120.3, 'neutral', { lookX: -.8, lookY: -.3 }],
      [125.4, 'thinking', { lookX: .6, lookY: .5 }], [126.0, 'neutral', { lookY: -.7 }], [126.7, 'determined'], [127.1, 'neutral', { lookX: -.6 }],
      [131.0, 'thinking', { lookX: .6, lookY: .5 }], [131.9, 'neutral', { lookY: -.7 }], [132.6, 'determined'], [133.7, 'neutral', { lookX: -.6 }],
      [137.6, 'thinking', { lookX: .6, lookY: .5 }], [138.2, 'neutral', { lookY: -.7 }], [138.6, 'happy'], [138.95, 'relieved'], [139.55, 'happy'], [140.1, 'neutral', { lookX: -.9, lookY: .4 }], [141.8, 'confused', { lookX: -1 }],
      [143.35, 'surprised', { lookX: -.7, lookY: -1 }], [144.22, 'nervous'], [144.85, 'determined'], [147.08, 'scared', { lookY: -1 }], [147.85, 'excited'],
      [150.25, 'proud'], [153, 'happy'], [157.55, 'starstruck']], { take: .8 });
    const legK = easeOut(seg(t, 145.15, 145.65));
    const weight = !worn ? 0 : .26 * Math.exp(-(t - LAND) * 7) * Math.cos((t - LAND) * 16) + kf(t, [[LAND, .09], [144.95, .09], [145.15, .18], [145.65, 0], [146.4, .04]]);
    const steps = stroll(t, 145.8, 147.0, CX0, CX0 + 85, U), walk = stroll(t, 153.0, 157.4, CX0 + 85, 1450, U);
    const walking = (t > 145.8 && t < 147.0) || (t > 153.0 && t < 157.4);
    const x = t < 153 ? steps.x : walk.x, wv = t < 153 ? steps : walk;
    const lean = !worn ? 0 : kf(t, [[LAND, .04], [145.15, .04], [145.65, .02]]) + .06 * spring(t, 145.65, 4, 13) + (walking ? .07 * Math.sin(wv.walk * TAU) : 0);
    const moodDy = (mood.dy || 0) * (t > 147.85 ? .45 : worn ? .6 : 1);
    const cl = { ...mood, view: 'q', legK, sq: (mood.sq || 0) + weight, rot: (mood.rot || 0) * .4 + lean, dy: moodDy + (walking ? wv.dy * .6 : 0), boilKey: 'clawd' };
    if (walking) cl.walk = wv.walk;
    // 写单子、塞进投递口
    const writes = LOOPS.map(Lp => [Lp.p - Math.min(.8, Lp.d * .3), Lp.p, 'exec', Lp.ic]).concat([[139.0, 139.5, 'answer', null]]);
    const w = writes.find(([a, b]) => t >= a && t < b + .05);
    if (w && !worn) {
      cl.aR = t < w[1] - .2 ? .95 + .08 * Math.sin(t * 30) : lerp(.95, .45, seg(t, w[1] - Math.min(.2, (w[1] - w[0]) / 3), w[1]));
      if (t < w[1]) cl.armR = (u, sw) => slip(w[2], .8 * u, 0, .62, .2, w[3]);
    }
    // 判断"能给结论吗？"：头上先冒问号，再亮叉（还不能）或勾（能了）
    const jd = JUDGE.find(([a, b]) => t >= a && t < b);
    if (jd && !worn) {
      const [a, b, yes] = jd, mid = (a + b) / 2, [hx, hy] = clawdToWorld(x, G, U, cl, .6 * U, -10.6 * U);   // 头顶正上方
      if (t < mid) emote('?', hx, hy, 12, seg(t, a, a + .15), t - a);
      else icon(yes ? 'check' : 'cross', hx, hy, 14 * backOut(seg(t, mid, mid + .2)));
    }
    if (worn) {
      const ext = snap(t, 147.0, .1) * (1 - snap(t, 147.5, .1));
      agent(x, G, U, cl, { lite: 0, ext }, { layers: TRAY.c4, recipe: 0, buckle: seg(t, LAND - .03, LAND + .12) }, t);
    } else clawd(x, G, U, cl);
    // 管道在 Clawd 身前经过，单子一路看得见
    floorTube(1 - snap(t, 142.5, .36));
    // 执行单：写好 → 塞进投递口 → 沿管道到收发室
    for (const Lp of LOOPS) if (t >= Lp.p && t < lp(Lp, .25)) { const [px, py] = tubeAt(1 - ease(seg(t, Lp.p, lp(Lp, .25)))); slip('exec', px, py - 6, .75, 0, Lp.ic); }
    // 回答：139.5 塞进去 → 140.0 到收发室 → 从烟囱飞走
    if (t >= 139.5 && t < 140.05) { const [ax, ay] = tubeAt(1 - ease(seg(t, 139.5, 140.0))); slip('answer', ax, ay - 6, .75); }
    if (t >= 140.05 && t < 140.5) { const k = easeIn(seg(t, 140.05, 140.5)); slip('answer', CHIMNEY[0] + 20, lerp(CHIMNEY[1], -100, k), .8); }

    // 台灯的光圈在 Clawd 身后的墙上
    glow(t < 143.75 ? 1400 : x + 7 * U, t < LAND ? 780 : G + (cl.dy + (1 - legK) * 2 - 5.6) * U, 300, MC.lamp, .45);

    // 书桌：143.75 起折成小桌板；纸摞跟着缩到小桌板上
    if (!worn) {
      const fold = seg(t, 143.75, 143.97);
      const desk = backDesk(t, fold, 1);
      const tx = lerp(sx, CX0 + 6.95 * U, ease(fold)), tb = lerp(sb, G + 2 * U - 4.8 * U, ease(fold)), ts = lerp(SS, .7 * sumH(TRAY.c4) / sumH(L), ease(fold)), tw = lerp(SW, 2.9 * U, ease(fold));
      const stk = paperStack(tx - tw / 2, tb, tw, ts, 'stack', L);
      if (fold <= 0) stackCradle(sx, sb, SW, cradleTop);
      // 读的时候：一道亮线从第一页扫到最后一页
      const rd = Lc && t >= lp(Lc, .9) && t < (LOOPS[li + 1] ? LOOPS[li + 1].p - .3 : 139);
      if ((rd || (t >= 118 && t < 119.4)) && fold <= 0) { const a0 = t < 119.4 ? 118 : lp(Lc, .9), a1 = t < 119.4 ? 119.4 : (LOOPS[li + 1] ? LOOPS[li + 1].p - .3 : 139); const i = Math.min(stk.ys.length - 1, Math.floor(seg(t, a0, a1) * stk.ys.length)); boilSeed('readline'); inkLine([[sx - 82, stk.ys[i]], [sx + 82, stk.ys[i]]], 2.2, PAL.cream, 'ink', 0); }
    }

    // 150：两个箭头，一个指 Clawd（模型），一个指背包（Harness）；文字交给气泡
    const SX = 1180, SY = 470;
    if (false) {   // v002 样片反馈：箭头绕得太扭，改成两个小标签气泡（见 captions.js），这里不再画
      boilSeed('arrows');
      const a1 = ease(seg(t, 150.5, 150.9)), a2 = ease(seg(t, 150.9, 151.4));
      const arrow = (P, k) => { const n = Math.max(2, Math.round(P.length * k)), Q = P.slice(0, n); inkLine(Q, 1.8, PALX.stampLight, 'ink', .5); if (k > .95) { const [x2, y2] = Q[Q.length - 1], [x1, y1] = Q[Q.length - 2], a = Math.atan2(y2 - y1, x2 - x1); for (const s of [-1, 1]) inkLine([[x2, y2], [x2 - 16 * Math.cos(a + s * .5), y2 - 16 * Math.sin(a + s * .5)]], 1.8, PALX.stampLight, 'ink', 0); } };
      arrow(through([[1150, 500], [1195, 590], [1245, 665]], 6), a1);                                   // 模型 → Clawd
      arrow(through([[1320, 440], [1230, 395], [1050, 398], [975, 490], [1015, 615]], 6), a2);            // Harness → 背包（从字的上方绕过去）
    }
    camEnd();
    // 出场：门里的光铺满画面，接第 5 章的街
    flash(ease(seg(t, 158.6, 159.6)), '#FFF4DA');
  }

  function shot(u) {
    const [kind, a, , t0] = segAt(u);
    if (kind === 'F') front(u); else back(t0 + (u - a));
    // 前后台之间的竖向快切
    for (const [, c] of SEG) if (c > 0) whipLines(seg(u, c - .12, c + .12));
  }

  chapter(4, [[0, shot]]);
})();
