// ch05.js：第 5 章 · MCP：走上街（正片 25.2 秒）。白天，明亮。外部产品是别人家的楼，Agent 用线缆插进去查、拿回结果。
// v002：沿用 v001 的整段街景（时间是 v001 时间），用 SEG 表挑出要的几段；同一个"插进去拿回来"只演一次（档案馆），
// 地图店直接剪过去（插好了、灯亮着），浏览器楼保留（能力不同：翻网页、填表）；取消"MCP"印章；结尾的空卡带壳移到第 6 章开头。
//   0–2.9    门形的光圈打开：一条街，Clawd 小小地站在左边门口
//   2.9–4.3  反应特写：starstruck
//   4.3–16.9 往右走到街中间，够不着；光标把一排插座扣到背包侧面；问题到了，纸摞多几页楼的说明；插进档案馆，企业卡片滑回
//   16.9–25.2 浏览器楼：机器的小手翻网页、填表；三根线缆都插着，回答递出去
(() => {
  const G = ST.G, U = 24, DOOR_X = 230, XS = 1130;     // 门口、街中间站的位置
  const LITE = .3;

  // 背包插座的世界坐标（第 i 个）
  function sockW(x, cl, i) {
    const g = packGeom(U, LITE), lx = g.bx - 190 * g.s, yy = g.by - (330 - i * 90) * g.s + .65 * U;
    return clawdToWorld(x, G, U, cl, lx - .55 * U, yy);
  }

  function camAt(t) {
    return kf(t, [[160, [1100, 560, .62]], [162.9, [1100, 560, .62]], [163.0, [262, 760, 2.6]], [164.9, [262, 760, 2.6]], [165.0, [520, 640, 1.3]], [168.6, [1130, 650, 1.3]],
      [169.0, [1250, 660, 1.5]], [171.0, [1250, 660, 1.5]], [171.6, [1305, 712, 3.0]], [174.4, [1305, 712, 3.0]], [174.9, [1700, 640, 1.0]], [175.4, [1700, 640, 1.0]],
      [175.5, [1625, 800, 3.0]], [176.3, [1625, 800, 3.0]], [177.7, [1290, 720, 1.8]], [178.0, [1700, 640, 1.0]], [178.45, [1700, 640, 1.0]], [178.5, [2072, 800, 3.0]],
      [179.0, [2072, 800, 3.0]], [180.2, [1330, 720, 1.8]], [180.9, [1330, 720, 1.8]], [181.0, [2000, 620, .85]], [185.0, [2000, 620, .85]], [185.1, [1980, 620, .82]], [196, [1980, 620, .82]]]);
  }

  function street(t) {
    const [cx, cy, z] = camAt(t);
    streetSky();
    camBegin(cx, cy, z);
    streetBG(t, cx);
    backstageExit(DOOR_X);
    const plugA = 176.0, plugM = 178.5, plugB = 181.3;
    building(BLD.archive, t, seg(t, plugA, plugA + .05));
    building(BLD.map, t, seg(t, plugM, plugM + .05));
    building(BLD.browser, t, seg(t, plugB, plugB + .05), seg(t, 182.0, 184.8));

    // Clawd：门口 → 街中间
    const walk = stroll(t, 165.0, 168.6, DOOR_X + 40, XS, U), walking = t > 165 && t < 168.6;
    const mood = emotions(t, [[160, 'surprised', { lookX: .6 }], [163.05, 'starstruck'], [165.0, 'happy'], [168.7, 'confused', { lookX: -.6 }], [169.9, 'excited'],
      [171.3, 'thinking', { lookY: -.8 }], [173.5, 'neutral', { lookX: .6, lookY: .4 }], [175.0, 'neutral', { lookX: -.8 }], [177.7, 'happy'], [178.1, 'neutral', { lookX: .8 }],
      [180.4, 'happy'], [181.2, 'neutral', { lookX: .9 }], [185.2, 'proud'], [188.0, 'happy']], { take: .7 });
    const x = t < 165 ? DOOR_X + 40 : walk.x;
    const cl = { ...mood, view: walking ? 'side' : 'q', boilKey: 'clawd', dy: (mood.dy || 0) * .6 + (walking ? walk.dy * .5 : 0) };
    if (walking) cl.walk = walk.walk;
    if (t >= 168.7 && t < 169.6) cl.aL = 1.1 + .15 * Math.sin(t * 20);    // 伸手够不着
    // 写执行单
    if (t >= 173.6 && t < 174.5) { cl.aR = .95 + .08 * Math.sin(t * 30); cl.armR = (u, sw) => slip('exec', .8 * u, 0, .62, .2, ['building', 'map']); }

    // 线缆：从背包插座伸到各栋楼的插口
    const cabs = [[175.0, BLD.archive.sock, 0], [178.0, BLD.map.sock, 1], [181.0, BLD.browser.sock, 2]];
    const paths = cabs.map(([t0, b, i]) => t >= t0 ? cable(sockW(x, cl, i), b, 70, easeOut(seg(t, t0, t0 + .5))) : null);
    // 顺着线缆滑回来的东西：企业卡片、带图钉的路线
    if (paths[0] && t >= 176.3 && t < 177.6) { const p = along(paths[0], 1 - ease(seg(t, 176.3, 177.6))); flyCard(p[0], p[1] - 26, 70, 46, 71, false, 0); icon('building', p[0], p[1] - 26, 14, { col: BLD.archive.col }); }
    if (paths[1] && t >= 179.0 && t < 180.2) { const p = along(paths[1], 1 - ease(seg(t, 179.0, 180.2))); icon('map', p[0], p[1] - 28, 24); icon('pin', p[0] + 12, p[1] - 40, 12); }
    // 浏览器楼里：机器的小手像握着鼠标一样，翻网页、填表
    if (t >= 182 && t < 185.2) {
      const B = BLD.browser, k = seg(t, 182, 184.8), hx = B.x + 120 + 260 * (k > .55 ? (k - .55) / .45 : 0), hy = B.y ?? 0;
      push(); translate(hx, G - B.h + 120 + (k < .55 ? 200 * k : 300)); rotate(.6); icon('wrench', 0, 0, 16, { col: MC.macLt }); pop();
    }

    agent(x, G, U, cl, { lite: LITE, sockets: seg(t, 169.6, 169.8) }, { layers: layersAt(t), recipe: 1 }, t);
    // 插座排还在光标手里、没扣上去之前
    if (t >= 168.9 && t < 169.6) {
      const k = ease(seg(t, 168.9, 169.5)), [sx, sy] = sockW(x, cl, 1);
      const px = lerp(sx - 200, sx, k), py = lerp(sy - 260, sy, k);
      boilSeed('sockrow'); for (let i = 0; i < 3; i++) paint(rrPts(px - 26, py - 90 + i * 60, 26, 30, 5), { wash: MC.macLt, ink: PAL.ink, sw: .7 });
      cursorHand(px - 13, py - 30, 2.4, { pose: 'grab', key: 'u' });
    }
    if (t >= 169.5 && t < 170.3) { const [sx, sy] = sockW(x, cl, 1); cursorHand(sx - 13, sy - 30, 2.4, { pose: 'open', click: t - 169.55, key: 'u' }); }
    // 用户的问题：一张问题单落到小桌板上
    if (t >= 171.2 && t < 171.7) { const k = easeIn(seg(t, 171.2, 171.65)), [tx, ty] = clawdToWorld(x, G, U, cl, 7 * U, -7 * U); slip('question', tx, lerp(ty - 300, ty, k), .7, .2 * (1 - k), ['building', 'car']); }
    // 回答递出去：从小桌板飞向左上（返回用户那边）
    if (t >= 188.0 && t < 189.2) { const k = easeIn(seg(t, 188.0, 189.2)), [tx, ty] = clawdToWorld(x, G, U, cl, 7 * U, -6 * U); slip('answer', lerp(tx, tx - 900, k), lerp(ty, ty - 700, k), .9, -.3 * k); }
    camEnd();
    // 进场：门形的光圈从奶油色里打开
    if (t < 161.2) { const k = easeOut(seg(t, 160.0, 161.2)), [dx, dy] = toScreen(DOOR_X, G - 165, LAST_CAM); irisShape(rectPts(dx - (60 + 2200 * k), dy - (110 + 1400 * k), 2 * (60 + 2200 * k), 2 * (110 + 1400 * k)), '#FFF4DA'); }
  }

  // 纸摞：问题到了以后，多出三页楼的说明
  function layersAt(t) {
    const L = TRAY.c4.slice();
    if (t >= 171.6) L.push(['dialog', 3]);
    if (t >= 172.6) L.push(['tools', 3]);
    if (t >= 172.9) L.push(['tools', 3]);
    if (t >= 173.2) L.push(['tools', 3]);
    return L;
  }

  // 本章时间 → v001 时间：[本章起, 本章止, v001 起]；段与段之间是硬切
  const SEG = [[0, 2.9, 160.0], [2.9, 4.3, 163.0], [4.3, 16.9, 165.0], [16.9, 25.2, 181.0]];
  const oldT = u => { const g = SEG.find(([a, b]) => u >= a && u < b) || SEG[SEG.length - 1]; return g[2] + (u - g[0]); };
  chapter(5, [[0, u => street(oldT(u))]]);
})();
