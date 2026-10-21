// config.js: project settings.
//   duration: the video's length in seconds.
//   bpm:      the rhythm that bounces, dances and pulse() follow. Clawd always moves to some beat; if the video has music,
//             set this to the song's tempo, and set offset to the time in seconds of its first downbeat.
// 120 bpm（一拍 0.5 秒，一小节 2 秒）

// 章节表：全片按章拼接，每章 = 章节标题卡（CARD 秒）+ 正片（len 秒）。
// 场景、气泡、配乐、渲染都按章独立：场景和气泡用"本章正片时间"（0 = 标题卡结束），改一章的长度不影响别的章。
// 这张表是唯一的来源：music/score.py 从这里读每章长度，render.mjs 按这里的起点切章渲染。
const CARD = 2.5;
const CHAPTERS = [
  { n: 1, name: '聊天框', sub: '', len: 21.7 },
  { n: 2, name: '收发室和那摞纸', sub: '', len: 25.9 },
  { n: 3, name: '提示词魔法', sub: '', len: 24.1 },
  { n: 4, name: 'ReAct 循环与 Agent 的诞生', sub: '', len: 58.6 },
  { n: 5, name: 'MCP：走上街', sub: '', len: 25.7 },
  { n: 6, name: 'Skill：技能卡带', sub: '', len: 32.1 },
  { n: 7, name: '一本正经地出错', sub: '', len: 46.4 },
  { n: 8, name: '压缩与子 Agent', sub: '', len: 38.8 },
  { n: 9, name: '上下文工程', sub: '管好纸摞里放什么', len: 28.0 },
  { n: 10, name: 'Harness 工程（上）', sub: '一个入口，只拿这次要用的工具', len: 44.6 },
  { n: 11, name: 'Harness 工程（下）', sub: '像一个靠谱员工那样干活', len: 48.7 },
  { n: 12, name: 'Loop', sub: '清楚、可核验的目标', len: 28.3 },
  { n: 13, name: '不是开关', sub: '', len: 37.6 },
  { n: 14, name: '能力边界和装备', sub: '', len: 41.5 },
  { n: 15, name: '许愿', sub: '', len: 28.5 },
  { n: 16, name: '三件事：目标、品味、雄心', sub: '', len: 71.3 },
];
// 片头（src/scenes/intro.js）的长度：在第 1 章标题卡之前，独立于各章
const INTRO = 7.7;   // v005 反馈：两行片名出全后多停 1.2 秒，让观众看清
// 每章在全片里的起点（标题卡开始的时刻）
const CH_START = []; { let s = INTRO; for (const c of CHAPTERS) { CH_START[c.n] = s; s += CARD + c.len; } }
const CH_SCENE = n => CH_START[n] + CARD;   // 本章正片开始的时刻

const PROJECT = { duration: INTRO + CHAPTERS.reduce((s, c) => s + CARD + c.len, 0), bpm: 120, offset: 0, audio: 'out/score.wav' };
