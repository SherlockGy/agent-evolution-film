// chapters.js：按章组织全片。每章开头一张章节标题卡，正片在角落常驻一个小章节名，让观众知道在看哪一章。
// 场景文件用 chapter(n, [[u0, fn], ...]) 注册镜头：u0 是本章正片时间（0 = 标题卡结束），fn(u, lu, dur) 收到的也是本章正片时间。
// 标题卡和正片之间用笔刷擦过转场；章与章之间不做跨章的连续镜头，每章自成一段，方便单独改、单独渲染。
const CH_WIPE = .3;   // 标题卡 → 正片的笔刷转场，一半在卡上、一半在正片开头
const CH_OUT = .5;    // 每章结尾：最后 0.5 秒笔刷盖过画面（连气泡一起），下一章标题卡再用笔刷揭开。最后一章不做，它自己收在纸色上

function chapter(n, list) {
  const s = CH_SCENE(n), len = CHAPTERS[n - 1].len;
  const lst = list.map(([u0, fn]) => [u0, fn]).sort((a, b) => a[0] - b[0]);
  lst.forEach(([u0, fn], i) => {
    const u1 = i + 1 < lst.length ? lst[i + 1][0] : len;
    shots([[s + u0, (t) => {
      const u = t - s;
      fn(u, u - u0, u1 - u0);
      if (u < CH_WIPE) { flushLetters(); brushWipe(.5 + u / (CH_WIPE * 2)); }
    }]]);
  });
}

// 标题卡：米白纸面，"第 N 章"小字 + 章节名大字（+ 副标题），下面一笔赤陶色的刷痕
function chapterCard(c, lt) {
  boilSeed('card' + c.n);
  paint(rectPts(-40, -40, W + 80, H + 80), { wash: PAL.paper, ink: null });
  const inK = easeOut(seg(lt, .05, .45)), lineK = ease(seg(lt, .3, .9));
  const cy = c.sub ? H / 2 - 30 : H / 2;
  letter(`第 ${c.n} 章`, W / 2, cy - 110 + 20 * (1 - inK), 46, PAL.clayDk, { screen: true, ink: false, alpha: inK, font: CAP_FONT(46) });
  letter(c.name, W / 2, cy + 10 * (1 - inK), 96, PAL.ink, { screen: true, ink: false, alpha: inK, font: CAP_FONT(96) });
  if (c.sub) letter(c.sub, W / 2, cy + 120, 44, '#5A4E5F', { screen: true, ink: false, alpha: easeOut(seg(lt, .35, .75)), font: CAP_FONT(44) });
  if (lineK > 0) {
    const half = Math.min(560, textW(c.name, 96) / 2 + 40), y = cy + 70;
    boilSeed('cardline' + c.n);
    inkLine([[W / 2 - half, y], [lerp(W / 2 - half, W / 2 + half, lineK), y + 4]], 4, PAL.clay, 'ink', 0);
  }
  if (lt > CARD - CH_WIPE) { flushLetters(); brushWipe((lt - (CARD - CH_WIPE)) / (CH_WIPE * 2)); }
  // 揭开：上一章结尾盖上的笔刷，在标题卡开头揭开（第 1 章的标题卡也这样开场）
  if (lt < CH_WIPE) { flushLetters(); brushWipe(.5 + lt / (CH_WIPE * 2)); }
}
// 每章结尾的收尾：画在气泡之上（timeline.js 在气泡之后调用）
function chapterOutro(t) {
  const c = chapterAt(t); if (c.n === CHAPTERS.length) return;
  const k = t - CH_SCENE(c.n) - (c.len - CH_OUT);
  if (k > 0) { flushLetters(); brushWipe(k / (CH_OUT * 2)); }
}
for (const c of CHAPTERS) shots([[CH_START[c.n], (t, lt) => chapterCard(c, lt)]]);

// 正片角落的小章节名：左上角一块半透明的小牌子
function chapterAt(t) { for (let i = CHAPTERS.length - 1; i >= 0; i--) if (t >= CH_START[CHAPTERS[i].n]) return CHAPTERS[i]; return CHAPTERS[0]; }
function drawChapterLabel(t) {
  const c = chapterAt(t), u = t - CH_SCENE(c.n);
  if (u < .4) return;
  const a = easeOut(seg(u, .4, .9)), fs = 26, txt = `${c.n} · ${c.name}`, w = textW(txt, fs) + 36, h = fs + 20;
  boilSeed('chlabel' + c.n);
  paint(rrPts(28, 24, w, h, h / 2), { wash: '#1B1F33', washOp: 150 * a, ink: null });
  letter(txt, 28 + w / 2, 24 + h / 2 + 1, fs, '#FFF5E2', { screen: true, ink: false, alpha: .92 * a, font: CAP_FONT(fs) });
}
