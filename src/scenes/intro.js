// intro.js：片头（INTRO = 7.7 秒，在第 1 章标题卡之前，独立于各章）。片名的画面化：
//   0–0.35  笔刷揭开：明亮的场地
//   0.3–1.5 Clawd 背着全套背包冲进画面（侧面跑）
//   1.5–2.5 站定，背包的机械臂"唰"地展开、收回，高兴
//   2.5–3.1 大步往前一跨，落地的那一下砸出"Agent 往前一步"
//   4.0–5.0 镜头拉远上抬：同时看见两层——下面是往前跨了一步的 Clawd，上面半空铺着人的图纸，白色光标手把一颗星（目标）按上去，"我们，往上一层"
//   5.5–7.2 两行片名出全，停住让观众看清（v005 反馈：原来出全后 0.7 秒就盖掉）
//   7.2–7.7 笔刷盖过，接第 1 章标题卡
(() => {
  const G = VN.G, U = 30;
  const P = { lite: 1, sockets: 1, slot: 1, cassettes: 4 };
  const MAP = [620, -760, 760, 400];   // 上面一层的图纸 [x, y, w, h]（世界坐标，在场地上方）
  const STAR = [1180, -560];           // 光标手按下星星的位置

  // 片名的手绘标题字（codex 生成、抠掉底色的贴图，见 assets/img/title_*.png）；贴图没加载到就退回普通粗体字
  const TITLE_IMG = {};
  (window.PRELOAD = window.PRELOAD || []).push(() => Promise.all([['Agent 往前一步', 'assets/img/title_a.png'], ['我们，往上一层', 'assets/img/title_b.png']].map(([k, src]) =>
    new Promise(res => { const im = new Image(); im.onload = () => { TITLE_IMG[k] = im; res(); }; im.onerror = () => res(); im.src = src; }))));

  // 片名的一行字：屏幕坐标，落下时弹一下；size 是字高，贴图按字高折算宽度
  function titleLine(txt, x, y, size, t0, t, alpha = 1) {
    if (t < t0 || alpha <= 0) return;
    const im = TITLE_IMG[txt], o = { screen: true, alpha, pop: clamp((t - t0) / .22) };
    if (im) letter('', x, y, size, null, { ...o, img: im, w: size * 1.45 * im.width / im.height });
    else letter(txt, x, y, size, '#FFF5E2', { ...o, ink: true, stroke: PAL.ink, font: CAP_FONT(size) });
  }

  function intro(t) {
    const push = ease(seg(t, .3, 1.6)), up = ease(seg(t, 4.0, 5.0));
    const cx = lerp(lerp(700, 880, push), 960, up), cy = lerp(lerp(640, 660, push), 60, up), z = lerp(lerp(1.0, 1.3, push), .58, up);   // 拉远到两层都在画面里
    venueBG(t, cx);
    camBegin(cx, cy, z);
    venueGround(t, cx);

    // 上面一层：半空里的图纸（路线 + 边界圈），光标手按下一颗星
    boilSeed('intro map');
    paint(rectPts(...MAP), { wash: '#EFE2C4', ink: PAL.ink, sw: 1.6 });
    for (let i = 1; i < 6; i++) inkLine([[MAP[0] + i * MAP[2] / 6, MAP[1] + 10], [MAP[0] + i * MAP[2] / 6, MAP[1] + MAP[3] - 10]], .5, '#D9C9A6', 'inkfine', 0);
    for (let i = 1; i < 4; i++) inkLine([[MAP[0] + 10, MAP[1] + i * MAP[3] / 4], [MAP[0] + MAP[2] - 10, MAP[1] + i * MAP[3] / 4]], .5, '#D9C9A6', 'inkfine', 0);
    inkLine(ellPts(MAP[0] + 380, MAP[1] + 210, 260, 140, 30).concat([[MAP[0] + 640, MAP[1] + 210]]), 2.4, '#7B5CA8', 'ink', .3);
    for (let d = 0; d < 420; d += 26) inkLine([[MAP[0] + 150 + d, MAP[1] + 240 - d * .1], [MAP[0] + 164 + d, MAP[1] + 240 - (d + 14) * .1]], 3, '#8A6F55', 'inkfine', 0);
    const drop = ease(seg(t, 4.9, 5.3));
    if (t >= 4.6) {
      const sy = lerp(STAR[1] - 160, STAR[1], drop);
      icon('star', STAR[0], sy, 26 * (1 + .25 * Math.sin(seg(t, 5.3, 5.6) * Math.PI)), { col: '#F5C542' });
      if (t >= 5.3) glow(STAR[0], STAR[1], 90, '#FFE6A0', .7 * (1 - seg(t, 5.3, 6.2)));
      cursorHand(STAR[0] + 18, sy + 34, 3.2, { pose: t < 5.3 ? 'grab' : 'open', key: 'u' });
    }

    // Clawd：冲进来 → 站定、机械臂展开 → 大步往前一跨
    const run = stroll(t, .3, 1.5, 150, 760, U), hop = jump(t, 2.5, 3.1, 2.2);
    const x = t < 1.5 ? run.x : lerp(760, 1040, ease(seg(t, 2.5, 3.1)));
    const mood = t < 1.5 ? feel('determined', t) : t < 2.5 ? feel('excited', t) : feel('proud', t);
    const ext = t >= 1.6 && t < 2.5 ? Math.sin(seg(t, 1.6, 2.5) * Math.PI) : 0;
    const running = t > .3 && t < 1.5;
    agent(x, G, U, { ...mood, view: running ? 'side' : 'q', walk: running ? run.walk : null, dy: (mood.dy || 0) * .5 + (t >= 2.5 ? hop.dy : running ? run.dy * .5 : 0), sq: t >= 2.5 ? hop.sq : 0, boilKey: 'clawd' },
      { ...P, ext }, { layers: [['#E4DDF0', 5], ['#DCEFD6', 3]], recipe: 3 }, t);
    if (t >= 3.1 && t < 3.6) emote('spark', x + 4 * U, G - 9 * U, 22, seg(t, 3.1, 3.2), t - 3.1);
    camEnd();

    // 片名两行：落地那一下"Agent 往前一步"；镜头抬上去后"我们，往上一层"
    // 镜头拉远后两行从上往下读：上面"Agent 往前一步"，下面"我们，往上一层"（v004 反馈：原来上下颠倒，读反了）
    if (t < 4.1) titleLine('Agent 往前一步', W / 2, H - 170, 96, 3.1, t, 1 - seg(t, 3.9, 4.1));   // 镜头移动时先淡掉，免得扫过 Clawd
    else titleLine('Agent 往前一步', W / 2, 410, 96, 5.0, t);
    titleLine('我们，往上一层', W / 2, 620, 96, 5.3, t);

    // 开场笔刷揭开；结尾笔刷盖上，接第 1 章标题卡（标题卡开头会揭开）
    if (t < .35) { flushLetters(); brushWipe(.5 + t / .7); }
    if (t > INTRO - .5) { flushLetters(); brushWipe((t - (INTRO - .5)) / 1.0); }
  }

  shots([[0, intro]]);
})();
