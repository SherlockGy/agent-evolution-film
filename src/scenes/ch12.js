// ch12.js：第 12 章 · Loop：清楚、可核验的目标（正片 27.8 秒）。
// v002：沿用 v001（时间是 v001 时间），用 SEG 表挑段；SEG 第 4 项是播放速度：延时里 Clawd 一圈圈跑过用 1.6 倍，
// "不达标、回去重做"那一下按正常速度；取消门楣上的"Loop"印章（交给气泡）。
//   0–6      前景桌上，光标把一杯冒热气的茶放下，离开；椅子空着。背景是场地和目标门
//   6–18.6   延时：Clawd 一次次跑过，灯一盏盏变绿；中间一盏绿了又变红，Clawd 咬牙掉头；茶慢慢不冒气，天色变暗
//   18.6–27.8 光标回来端起凉掉的茶，镜头一抬：全绿；Clawd 跑来和光标击掌；整排灯亮到最亮，白光漫过画面
(() => {
  const G = VN.G, U = 22, GX = 1250, LITE = .6;
  const P0 = { lite: LITE, sockets: 1, slot: 1, cassettes: 3 };
  // 每圈经过目标门的时刻；第 3 圈那盏灯绿了又变红，Clawd 掉头回去再来
  const PASS = [482.0, 485.0, 488.0, 492.6, 495.4, 498.0];
  const RED = [488.0, 492.6];          // 第 3 圈过门就亮红灯（v002 反馈：不要先绿再变红）
  function lights(t) {
    const L = [];
    let n = 0; for (const p of PASS) if (t >= p) n++;
    const greens = Math.min(5, n - (t >= RED[0] ? 1 : 0));   // 第 3 圈不算，回去重做那一圈补上
    for (let i = 0; i < 5; i++) L.push(i < greens ? 'g' : 'off');
    if (t >= RED[0] && t < RED[1]) L[2] = 'r';
    return L;
  }
  // Clawd 在背景里跑：每圈从左往右跑过门；红灯时掉头往回跑
  function runner(t) {
    if (t < 480) return { x: 360, view: 'q', mv: false };
    if (t >= RED[0] && t < RED[1]) { const k = seg(t, RED[0] + .6, RED[1]); return { x: lerp(GX + 140, GX - 360, ease(k < .5 ? k * 2 : 2 - k * 2)), view: 'side', flip: k < .5, mv: true, walk: t * 4 }; }
    const laps = PASS.map((p, i) => [p - 1.6, p + 1.2]);
    for (const [a, b] of laps) if (t >= a && t < b) return { x: lerp(GX - 700, GX + 700, seg(t, a, b)), view: 'side', mv: true, walk: t * 4 };
    if (t >= 500 && t < 504.6) return { x: lerp(GX - 200, 900, ease(seg(t, 502.6, 504.4))), view: t < 502.6 ? 'q' : 'side', flip: t >= 502.6 && t < 504.4, mv: t >= 502.6 && t < 504.4, walk: t * 4 };
    if (t >= 504.4) return { x: 900, view: 'q', mv: false };
    return { x: GX - 700, view: 'q', mv: false };
  }

  function shot(t, lt, dur) {
    const dusk = ease(seg(t, 481, 499)) * .8;
    const redClose = t >= RED[0] && t < RED[0] + .55, faceClose = t >= RED[0] + .55 && t < RED[0] + 1.2;
    const up = ease(seg(t, 501.2, 502.2));
    const cam = redClose ? [GX - 68, G - 450, 4.2] : faceClose ? [GX + 60, G - 120, 3.6] : [1000, lerp(600, 540, up), 1.0];
    camBegin(...cam);
    venueBG(t, cam[0], { dusk }); venueGround(t, cam[0]);
    const bright = ease(seg(t, 506.2, 507.6));
    const gg = goalGate(GX, t, 1, lights(t), bright);
    const r = runner(t);
    const mood = r.mv ? feel('determined', t) : feel(t > 504 ? 'happy' : 'neutral', t);
    if (faceClose) Object.assign(mood, feel('determined', t), { squint: .3 });
    const cl = { ...mood, view: faceClose ? 'q' : r.view, flip: faceClose ? true : r.flip, walk: r.mv ? r.walk : null, boilKey: 'clawd' };
    if (t >= 504.4 && t < 506) cl.aR = 1.5;    // 击掌
    agent(r.x, G, U, cl, P0, { layers: [['#E4DDF0', 5], ['#DCEFD6', 3]], recipe: 2 }, t);
    if (t >= 504.4 && t < 506) { const [hx, hy] = clawdToWorld(r.x, G, U, cl, 6 * U, -9 * U); cursorHand(hx + 26, hy - 6, 2.4, { pose: 'open', key: 'u', click: t - 504.9 }); if (t >= 504.9 && t < 505.3) emote('spark', hx + 10, hy - 20, 22, seg(t, 504.9, 505.0), t - 504.9); }
    camEnd();

    // 前景（屏幕空间）：人的桌子边、空椅子、一杯茶
    if (!redClose && !faceClose) {
      const fy = lerp(0, 60, up);
      // 人的空椅子：从背后看的椅背（带头枕），很近、很大，压在画面左下
      boilSeed('fg chair');
      paint(rrPts(60, H - 560 + fy, 420, 640, 80), { wash: '#3E4358', ink: PAL.ink, sw: 1.6 });
      paint(rrPts(100, H - 520 + fy, 340, 560, 64), { wash: '#4E546E', ink: null });
      paint(rrPts(160, H - 700 + fy, 220, 120, 40), { wash: '#3E4358', ink: PAL.ink, sw: 1.4 });
      inkLine([[270, H - 580 + fy], [270, H - 560 + fy]], 6, '#2E3244', 'ink', 0);
      // 桌面：横在画面底部
      boilSeed('fg desk'); paint(rectPts(-40, H - 190 + fy, W + 80, 260), { wash: '#B98D62', ink: PAL.ink, sw: 1.4 }); inkLine([[-40, H - 160 + fy], [W + 40, H - 158 + fy]], .8, '#8E6A48', 'inkfine', 0);
      // 茶：一开始冒热气，延时里慢慢不冒了
      const tx = 1480, ty = H - 200 + fy, steam = 1 - seg(t, 482, 498);
      const tea = t >= 477.3 && !(t >= 500.6);
      const cupAt = t < 477.3 ? [lerp(1700, tx, ease(seg(t, 476.4, 477.3))), lerp(H + 100, ty, ease(seg(t, 476.4, 477.3)))] : t >= 500.6 ? [lerp(tx, 1600, ease(seg(t, 500.6, 501.4))), lerp(ty, ty - 160, ease(seg(t, 500.6, 501.4)))] : [tx, ty];
      boilSeed('cup'); push(); translate(cupAt[0], cupAt[1]); scale(1.6); paint(rectPts(-50, -90, 100, 90), { wash: PAL.cream, ink: PAL.ink, sw: 1.2 }); paint(ellPts(58, -46, 20, 26, 14), { wash: null, ink: PAL.ink, sw: 1 }); paint(ellPts(0, -88, 46, 10, 16), { wash: '#B5763C', ink: null }); pop();
      if (tea && steam > .05) for (let i = 0; i < 3; i++) { const ph = frac(t * .8 + i / 3), a = steam * Math.sin(ph * Math.PI); boilSeed('steam' + i); inkLine([[cupAt[0] - 30 + i * 30, cupAt[1] - 160 - ph * 80], [cupAt[0] - 18 + i * 30 + 12 * Math.sin(ph * 6), cupAt[1] - 205 - ph * 80], [cupAt[0] - 30 + i * 30, cupAt[1] - 250 - ph * 80]], 2.4 * a, mixCol(PAL.cream, '#FFFFFF', .5), 'inkfine', .6); }
      if (t < 478.2) cursorHand(cupAt[0] + 30 + 200 * ease(seg(t, 477.4, 478.2)), cupAt[1] - 90 + 120 * ease(seg(t, 477.4, 478.2)), 3, { pose: t < 477.4 ? 'grab' : 'point', key: 'u' });
      if (t >= 500.2 && t < 502.2) cursorHand(cupAt[0] + 30, cupAt[1] - 90, 3, { pose: 'grab', key: 'u' });
    }
    // 出场：整排灯亮到最亮，白光漫过画面
    flash(ease(seg(t, 507.2, 509.2)), '#FBF8F0');
  }

  // 本章时间 → v001 时间：[本章起, 本章止, v001 起, 播放速度（默认 1）]
  const SEG = [[0, 6, 476.0], [6, 9.75, 482.0, 1.6], [9.75, 14.35, 488.0], [14.35, 18.6, 492.6, 1.741], [18.6, 27.8, 500.0]];
  const oldT = u => { const g = SEG.find(([a, b]) => u >= a && u < b) || SEG[SEG.length - 1]; return g[2] + (u - g[0]) * (g[3] || 1); };
  chapter(12, [[0, u => shot(oldT(u))]]);
})();
