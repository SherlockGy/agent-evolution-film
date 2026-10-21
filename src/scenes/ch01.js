// ch01.js：第 1 章 · 聊天框（正片 21.2 秒，时间都是本章正片时间）。深夜办公室，第一人称：左屏聊天框，右屏编辑器。人 = 白色光标小手。
// v002 压缩：复制粘贴只演一轮，"很烦"交给气泡说。样片反馈后按人的操作速度放慢：打字、移鼠标、拖选、点按钮都留出人手需要的时间。
//   0–2     键盘大特写（一个固定机位，Ctrl、C、V 都在画面里）：Ctrl 一直按住、一直亮；0.5 按 C，C 亮；1.5 按 V，V 亮
//   2–13.4  一轮搬运：打问题 → 发送 → AI 回答 → 拖选复制 → 飞到右屏 → 点运行 → 红叉 → 看一眼 → 选中报错复制回左屏 → 发送 → AI 回一段"改好的"代码
//   13.4–18.4 笑点：把"改好的"代码搬过去再运行，冒出同一个红叉，镜头推近报错
//   18.4–21.2 摇回左屏，推进 AI 的回复，回复的形状收成光圈，进入黑场
(() => {
  const L = FD.L, R = FD.R;
  const LC_ = [540, 390], RC_ = [1380, 390];          // 两块屏幕中心（镜头对准用）
  const ZS = 1.6;                                      // 看一块屏幕的缩放

  // 消息（左屏）：y 是消息顶边
  const M1 = { who: 'user', kind: 'text', seed: 11, y: 208 };
  const M2 = { who: 'ai', kind: 'code', seed: 1, y: 268, n: 5 };
  const M3 = { who: 'user', kind: 'paste', seed: 21, y: 370, n: 2 };
  const M4 = { who: 'ai', kind: 'code', seed: 1, y: 432, n: 5 };       // seed 和 M2 一样：形状一模一样
  const M2C = [L[0] + 18 + L[2] * .37, 268 + 45], M4C = [L[0] + 18 + L[2] * .37, 432 + 45];
  const RUN = [R[0] + R[2] - 38, R[1] + 15], SEND = [L[0] + L[2] - 40, L[1] + L[3] - 30], ERR = [R[0] + 340, R[1] + R[3] - 50];

  // 动作时间表（本章正片时间）：调节奏改这里，气泡和配乐要跟着对
  const T = {
    type: [3.0, 3.8], send1: 4.25, dots1: 4.4, ans1: [4.9, 5.7],          // 打问题、发送、AI 回答
    sel1: [6.2, 6.8], fly1: [7.0, 7.52], paste1: 7.55,                     // 拖选回答、飞到编辑器、粘贴
    run1: 8.6, err1: 8.85,                                                 // 点运行、红叉
    selE: [10.0, 10.5], flyE: [10.8, 11.27], pasteE: 11.3,                 // 看一眼报错后选中、飞回左屏、粘贴
    send2: 12.0, dots2: 12.15, ans2: [12.6, 13.4],                         // 发送、AI 回"改好的"代码
    sel2: [13.9, 14.4], fly2: [14.6, 15.07], paste2: 15.1, run2: 16.05, err2: 16.3,   // 第二轮：同一个红叉
    look: [16.4, 18.4], push: [18.8, 20.0], iris: [19.7, 21.0],            // 推近报错、摇回推进、光圈收黑
  };

  function camAt(u) {
    if (u < 2) return [754, 925, lerp(5.0, 5.25, ease(seg(u, 0, 2))), 0];   // 键盘特写：慢慢推近一点
    // 卡片飞的时候快摇到另一块屏幕；第二次红叉推近输出面板，看完摇回左屏
    const [l0, l1] = T.look;
    const X = kf(u, [[2, 754], [2.6, 960], [2.9, 960], [3.3, LC_[0]], [T.fly1[0], LC_[0]], [T.fly1[0] + .45, RC_[0]], [T.flyE[0], RC_[0]], [T.flyE[0] + .45, LC_[0]],
      [T.fly2[0], LC_[0]], [T.fly2[0] + .45, RC_[0]], [l0, RC_[0]], [l0 + .5, 1330], [l1, 1330], [l1 + .6, LC_[0]]]);
    const Y = kf(u, [[2, 925], [2.6, 470], [2.9, 470], [3.3, 390], [l0, 390], [l0 + .5, 450], [l1, 450], [l1 + .6, 390]]);
    const Z = kf(u, [[2, 5.25], [2.6, 1.0], [2.9, 1.0], [3.3, ZS], [l0, ZS], [l0 + .5, 2.1], [l1, 2.1], [l1 + .6, ZS]]);
    const whip = [T.fly1, T.flyE, T.fly2].some(([a]) => u > a + .05 && u < a + .35) ? 1 : 0;
    return [X, Y, Z, whip];
  }

  // 光标：位置和手势。移动一段约 0.4–0.6 秒，拖选约 0.5 秒，到位后停一下再点
  function cursorAt(u) {
    if (u < 2.9 || u >= T.look[1]) return null;
    const P = [[2.9, 560, 520], [3.8, 590, 528], [4.15, ...SEND], [5.7, ...SEND],
      [T.sel1[0], 240, 280], [T.sel1[1], 700, 352], [T.fly1[0], 700, 352], [T.fly1[1], 1300, 300], [7.9, 1300, 300], [8.5, ...RUN],
      [T.selE[0] - .4, ...RUN], [T.selE[0], R[0] + 40, ERR[1] - 14], [T.selE[1], R[0] + 620, ERR[1] + 6], [T.flyE[0], R[0] + 620, ERR[1] + 6], [T.flyE[1], 500, 560],
      [11.4, 500, 560], [11.9, ...SEND], [13.5, ...SEND],
      [T.sel2[0], 240, 444], [T.sel2[1], 700, 516], [T.fly2[0], 700, 516], [T.fly2[1], 1300, 300], [15.4, 1300, 300], [15.95, ...RUN],
      [16.6, ...RUN], [17.0, RUN[0] - 60, RUN[1] + 40]];
    const x = kf(u, P.map(p => [p[0], p[1]])), y = kf(u, P.map(p => [p[0], p[2]]));
    const grab = (u > T.sel1[0] && u < T.paste1) || (u > T.selE[0] && u < T.pasteE) || (u > T.sel2[0] && u < T.paste2);
    let click = -1, press = 0; for (const c of [T.send1, T.run1, T.send2, T.run2]) if (u >= c && u < c + .45) { click = u - c; press = 1 - seg(u, c + .05, c + .15); }
    return { x, y, pose: grab ? 'grab' : 'point', click, press };
  }

  function shot(u) {
    const [cx, cy, z, whip] = camAt(u);
    const pushK = easeIn(seg(u, ...T.push));
    camBegin(lerp(cx, M4C[0], pushK), lerp(cy, M4C[1], pushK), lerp(z, 3.7, pushK));

    // 键盘的按键：Ctrl 从 0 起一直按住、一直亮；0.5 按 C（C 亮到 1.2），1.5 按 V（V 亮到 2）
    const keys = {}, lit = {};
    if (u < 2.2) {
      const tap = c => u < c ? 0 : u < c + .05 ? 1 : 1 - easeOut(seg(u, c + .05, c + .3));
      keys.ctrl = .7 * seg(u, 0, .06); lit.ctrl = seg(u, 0, .06);
      keys.c = tap(.5); lit.c = u >= .5 && u < 1.2 ? 1 - seg(u, 1.0, 1.2) : 0;
      keys.v = tap(1.5); lit.v = u >= 1.5 ? 1 : 0;
    }
    // 聊天框：输入框里打问题，发送后变成消息
    const typing = u >= T.type[0] && u < T.send1 ? seg(u, ...T.type) : 0;
    const msgs = [];
    if (u >= T.send1) msgs.push({ ...M1, k: snap(u, T.send1, .1) });
    if (u >= T.dots1) msgs.push(u < T.ans1[0] ? { ...M2, kind: 'dots' } : { ...M2, k: seg(u, ...T.ans1), sel: seg(u, ...T.sel1) * (u < T.fly1[0] + .4 ? 1 : 0) });
    if (u >= T.pasteE) msgs.push({ ...M3, k: snap(u, T.pasteE, .1) });
    if (u >= T.dots2) msgs.push(u < T.ans2[0] ? { ...M4, kind: 'dots' } : { ...M4, k: seg(u, ...T.ans2), sel: seg(u, ...T.sel2) * (u < T.fly2[0] + .4 ? 1 : 0) });
    // 编辑器：第一次粘贴前是空的；两次粘贴各自重新出现代码；报错面板在第二次粘贴时清空，第二次运行冒出同一个红叉
    const ed = { n: 9, seed: 3, k: u < T.paste1 ? 0 : u < T.paste2 ? seg(u, T.paste1, T.paste1 + .25) : seg(u, T.paste2, T.paste2 + .25),
      run: (u >= T.run1 && u < T.run1 + .2) || (u >= T.run2 && u < T.run2 + .2) ? 1 : 0,
      err: u >= T.err1 && u < T.paste2 ? seg(u, T.err1, T.err1 + .25) : u >= T.err2 ? seg(u, T.err2, T.err2 + .25) : 0,
      sel: u > T.selE[0] && u < T.flyE[0] + .1 ? seg(u, ...T.selE) : 0 };
    frontDesk(u, { msgs, ed, keys, lit, typing, night: 1 });

    // 飞过去的"复制内容"卡片：代码从左飞到右，报错从右飞回左
    const fly = ([t0, t1], a, b, seed, dark, h) => { if (u > t0 && u < t1) { const k = ease(seg(u, t0, t1)), p = arcPt(a, b, 90, k); flyCard(p[0], p[1], dark ? 260 : 300, h, seed, dark, (dark ? -.1 : .1) * Math.sin(k * Math.PI)); } };
    fly(T.fly1, M2C, [1300, 290], 1, false, 90);
    fly(T.flyE, ERR, [520, 560], 0, true, 40);
    fly(T.fly2, M4C, [1300, 290], 1, false, 90);

    const cur = cursorAt(u);
    if (cur) cursorHand(cur.x, cur.y, 2.4, { pose: cur.pose, click: cur.click, press: cur.press, key: 'u' });
    camEnd();

    // 快摇时的速度线（屏幕空间）
    if (whip) { boilSeed('whip'); for (let i = 0; i < 7; i++) { const y = 140 + i * 130 + 30 * hash(i + Math.floor(u * 12)); inkLine([[-50, y], [W + 50, y + 6]], 1.4, mixCol(FD.wall, PAL.cream, .45), 'dry', .2); } }
    // 出场：AI 回复的形状收成光圈，进入黑场
    if (u >= T.iris[0]) {
      flushLetters();
      boilSeed('iris1');
      const k = easeIn(seg(u, ...T.iris)), w = lerp(1880, 0, k), h = lerp(340, 0, k);
      if (w < 8) paint(rectPts(-60, -60, W + 120, H + 120), { wash: '#0E0F1A', ink: null });
      else irisShape(rrPts(W / 2 - w / 2, H / 2 - h / 2, w, h, Math.min(40, h / 2)), '#0E0F1A');
    }
  }

  chapter(1, [[0, shot]]);
})();
