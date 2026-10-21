# /// script
# requires-python = ">=3.12"
# dependencies = ["tinysoundfont", "numpy", "scipy"]
# ///
# 全片配乐：120 bpm（一拍 0.5 秒，一小节 2 秒）。v002 起按章生成：每章一个 wav（标题卡 + 正片），章与章之间由标题卡的过门隔开，
# 改一章只重做这一章。章节长度从 src/config.js 的 CHAPTERS 读，和画面同一个来源；章内时间 = 本章正片时间（0 = 标题卡结束），
# 标题卡在负的时间里（-CARD 到 0）。
# 用法：uv run music/score.py 1 2   → out/music/ch01.wav、ch02.wav（不带参数 = 所有已经按章写好的章）
# 做法参照 three-pigs/src/music.py：GeneralUser GS 采样音色演奏；音效由乐器跟着画面动作演奏；
# 全程不用金属音色（钟、铃、镲、三角铁、钢片琴），不用合成噪声，不铺底噪。
import random
import re
import sys
from collections import defaultdict
from pathlib import Path

import numpy as np
import tinysoundfont as tsf
from scipy.io import wavfile
from scipy.signal import butter, oaconvolve, sosfilt

ROOT = Path(__file__).resolve().parent.parent
SF2 = ROOT / "assets" / "sf" / "GeneralUser-GS.sf2"
OUT_DIR = ROOT / "out" / "music"
SR = 44100
B = 0.5            # 一拍的秒数

# 章节表：从 src/config.js 读 CARD 和每章的 len（唯一来源）
_cfg = (ROOT / "src" / "config.js").read_text(encoding="utf-8")
CARD = float(re.search(r"const CARD = ([\d.]+);", _cfg).group(1))
CH_LEN = {int(n): float(l) for n, l in re.findall(r"\{ n: (\d+),.*?len: ([\d.]+) \}", _cfg)}
INTRO = float(re.search(r"const INTRO = ([\d.]+);", _cfg).group(1))   # 片头（第 0 段）的长度
LOG = "[score 全片配乐]"
rng = random.Random(16)

PARTS = {
    "flute": dict(prog=73, vol=0.70, pan=0.25, rev=0.32),
    "clarinet": dict(prog=71, vol=0.80, pan=-0.2, rev=0.30),
    "oboe": dict(prog=68, vol=0.60, pan=0.15, rev=0.30),
    "bassoon": dict(prog=70, vol=0.85, pan=-0.1, rev=0.25),
    "horn": dict(prog=60, vol=0.55, pan=-0.3, rev=0.40),
    "trombone": dict(prog=57, vol=0.65, pan=0.1, rev=0.30),
    "strings": dict(prog=48, vol=0.50, pan=0.0, rev=0.45),
    "trem": dict(prog=44, vol=0.45, pan=0.0, rev=0.45),
    "pizz": dict(prog=45, vol=0.80, pan=-0.15, rev=0.28),
    "bass": dict(prog=45, vol=0.90, pan=0.0, rev=0.18),
    "harp": dict(prog=46, vol=0.70, pan=0.35, rev=0.45),
    "marimba": dict(prog=12, vol=0.65, pan=0.2, rev=0.30),
    "xylo": dict(prog=13, vol=0.50, pan=0.25, rev=0.28),
    "accordion": dict(prog=21, vol=0.45, pan=-0.2, rev=0.30),
    "timpani": dict(prog=47, vol=0.70, pan=0.0, rev=0.35),
    "drums": dict(prog=0, bank=128, drums=True, vol=0.70, pan=0.0, rev=0.25),
}
KICK, LO_TOM, MID_TOM, CLAVES, WOOD_HI, WOOD_LO, CASTANET = 36, 41, 45, 75, 76, 77, 85
NOTE = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}


def m(name):
    acc = 1 if "#" in name else -1 if (len(name) > 2 and name[1] == "b") else 0
    return NOTE[name[0]] + acc + (int(name[-1]) + 1) * 12


CHORDS = {
    "F": "F A C", "C": "C E G", "C7": "C E G Bb", "Dm": "D F A", "Gm": "G Bb D", "Bb": "Bb D F", "Am": "A C E",
    "A7": "A C# E G", "D7": "D F# A C", "Gm7": "G Bb D F", "Fmaj7": "F A C E", "Bbmaj7": "Bb D F A", "Dm7": "D F A C",
    "Em": "E G B", "G": "G B D", "Am7": "A C E G", "Csus": "C F G", "Fadd9": "F A C G",
}


def pcs(ch):
    return [m(x + "4") % 12 for x in CHORDS[ch].split()]


def voicing(ch, low, count=3):
    p, out, k = pcs(ch), [], low
    while len(out) < count:
        if k % 12 in p:
            out.append(k)
        k += 1
    return out


def root(ch, octave):
    return m(CHORDS[ch].split()[0] + str(octave))


class Score:
    # base：章内时间 0（正片开始）在这一章 wav 里的位置，也就是标题卡的长度；total：这一章 wav 的总长
    def __init__(self, base=0.0, total=1e9):
        self.ev = defaultdict(list)
        self.base = base
        self.total = total

    def note(self, part, t, dur, key, vel, human=True):
        t += self.base
        if t >= self.total:
            return
        if human:
            t += rng.uniform(-0.005, 0.005)
            vel = vel + rng.uniform(-4, 4)
        vel = int(max(1, min(127, vel)))
        self.ev[part].append((max(0.0, t), 1, "on", key, vel))
        self.ev[part].append((max(0.0, t + dur), 0, "off", key, 0))

    def notes(self, part, t, text, vel=80, legato=0.9):
        # "C5e F5q re [F3,A3]h"：e 八分、q 四分、h 二分、w 全音符、s 十六分、t 三十二分；r 开头是休止
        dur = {"w": 4, "h": 2, "q": 1, "e": .5, "s": .25, "t": .125}
        for tok in text.split():
            d = dur[tok[-1]] * B
            p = tok[:-1]
            if p != "r":
                for k in p.strip("[]").split(","):
                    self.note(part, t, d * legato, m(k), vel)
            t += d
        return t

    # 临时平移时间：with S.shift(off): 里面按别的时间轴写（比如 v001 的绝对时间），落到本章时间 = 那个时间 + off
    def shift(self, off):
        S = self

        class _Shift:
            def __enter__(self):
                S.base += off
                return S

            def __exit__(self, *a):
                S.base -= off
        return _Shift()

    def cc(self, part, t, ctrl, val):
        self.ev[part].append((max(0.0, t + self.base), 0, "cc", ctrl, int(val)))

    def ramp(self, part, t0, t1, v0, v1, steps=24):
        for i in range(steps + 1):
            a = i / steps
            self.cc(part, t0 + (t1 - t0) * a, 11, v0 + (v1 - v0) * a)

    def bend(self, part, t0, t1, s0, s1, rng_semis=12, steps=30):
        o = self.base
        self.ev[part].append((t0 + o - 0.002, 0, "pbr", rng_semis, 0))
        for i in range(steps + 1):
            a = i / steps
            self.ev[part].append((t0 + o + (t1 - t0) * a, 0, "pb", int(8192 + (s0 + (s1 - s0) * a) / rng_semis * 8191), 0))
        self.ev[part].append((t1 + o + 0.3, 0, "pb", 8192, 0))

    def gliss(self, part, t0, t1, k0, k1, vel=70, scale=(0, 2, 4, 5, 7, 9, 10), tonic=5):
        keys = [k for k in range(min(k0, k1), max(k0, k1) + 1) if (k - tonic) % 12 in scale]
        if k0 > k1:
            keys = keys[::-1]
        if not keys:
            return
        step = (t1 - t0) / len(keys)
        for i, k in enumerate(keys):
            self.note(part, t0 + i * step, max(step * 3, 0.15), k, vel, human=False)

    def drum(self, t, key, vel):
        self.note("drums", t, 0.15, key, vel, human=False)

    # ---------- 织体 ----------
    def bars(self, t0, t1, prog):
        # 按小节（2 秒）轮流取和弦
        out, t, i = [], t0, 0
        while t < t1 - 1e-6:
            out.append((t, prog[i % len(prog)]))
            t += 2 * B * 2
            i += 1
        return out

    def pad(self, part, t0, t1, prog, vel=50, low=53, count=3):
        for t, ch in self.bars(t0, t1, prog):
            for k in voicing(ch, low, count):
                self.note(part, t, min(4 * B, t1 - t) * 0.98, k, vel, human=False)

    def bass(self, part, t0, t1, prog, vel=70, octave=2, style="root"):
        for t, ch in self.bars(t0, t1, prog):
            r = root(ch, octave)
            fifth = voicing(ch, r + 1, 2)[1] if len(pcs(ch)) > 2 else r + 7
            if style == "root":
                self.note(part, t, 2 * B * 0.9, r, vel)
                if t + 2 * B < t1:
                    self.note(part, t + 2 * B, 2 * B * 0.9, fifth - 12 if fifth - 12 > r - 6 else fifth, vel - 6)
            elif style == "oompah":
                for b in range(4):
                    if t + b * B >= t1:
                        break
                    self.note(part, t + b * B, B * 0.8, r if b % 2 == 0 else fifth - 12, vel - (0 if b == 0 else 8))
            elif style == "walk":
                for b in range(4):
                    if t + b * B >= t1:
                        break
                    self.note(part, t + b * B, B * 0.9, [r, r + 4 if (r + 4) % 12 in pcs(ch) else r + 3, fifth - 12 + 12, r + 2][b] if b else r, vel - 4 * b)

    def chords_off(self, part, t0, t1, prog, vel=60, low=55):
        # 弱拍上的和弦（"嘭-嚓"里的"嚓"）
        for t, ch in self.bars(t0, t1, prog):
            for b in (1, 3):
                if t + b * B < t1:
                    for k in voicing(ch, low):
                        self.note(part, t + b * B, B * 0.45, k, vel)

    def ostinato(self, part, t0, t1, prog, step=0.5, vel=62, low=50, pattern=(0, 2, 1, 2)):
        for t, ch in self.bars(t0, t1, prog):
            v = voicing(ch, low, 3)
            n = int(round(4 / step))
            for i in range(n):
                tt = t + i * step * B
                if tt >= t1:
                    break
                self.note(part, tt, step * B * 0.55, v[pattern[i % len(pattern)] % 3], vel + (8 if i % (n // 4 or 1) == 0 else 0))

    def arp(self, part, t0, t1, prog, step=0.5, vel=55, low=55, pattern=(0, 1, 2, 3, 2, 1)):
        for t, ch in self.bars(t0, t1, prog):
            v = voicing(ch, low, 4)
            n = int(round(4 / step))
            for i in range(n):
                tt = t + i * step * B
                if tt >= t1:
                    break
                self.note(part, tt, step * B * 1.6, v[pattern[i % len(pattern)] % 4], vel)

    def tick(self, t0, t1, every=1.0, key=WOOD_HI, vel=40):
        t = t0
        while t < t1 - 1e-6:
            self.drum(t, key, vel)
            t += every * B

    # ---------- 动作音效（乐器演奏的） ----------
    def sfx(self, kind, t, w=1.0):
        S = self
        if kind == "stamp":        # 盖章：低沉的皮面鼓声（w 越大越重）
            S.drum(t, LO_TOM, 90 + 20 * w); S.drum(t, KICK, 80 + 30 * w); S.note("timpani", t, 0.6, m("F2"), 80 + 30 * w, False)
            if w > 1.5:
                S.notes("horn", t, "[F3,C4]q", 80 + 20 * w)
        elif kind == "click":      # 开关、按键的咔哒（每次完全一样）
            S.note("drums", t, 0.1, CLAVES, 100, human=False)
        elif kind == "wood":
            S.drum(t, WOOD_HI, 90 * w)
        elif kind == "woodlo":
            S.drum(t, WOOD_LO, 90 * w)
        elif kind == "castanet":
            S.drum(t, CASTANET, 95 * w)
        elif kind == "pluck":
            S.note("pizz", t, 0.3, m("C5"), 85 * w)
        elif kind == "pluckhi":
            S.note("pizz", t, 0.25, m("F5"), 85 * w)
        elif kind == "ok":         # 通过：木琴上行短句
            S.notes("marimba", t, "C5s E5s G5e", int(85 * w))
        elif kind == "ng":         # 失败：低音长号一下
            S.note("trombone", t, 0.6, m("C3"), 95 * w); S.bend("trombone", t + 0.1, t + 0.5, 0, -2)
        elif kind == "whooshdown":
            S.gliss("harp", t, t + 0.45, m("C6"), m("C4"), int(66 * w))
        elif kind == "whooshup":
            S.gliss("harp", t, t + 0.45, m("C4"), m("C6"), int(66 * w))
        elif kind == "fluteup":
            S.notes("flute", t, "C5t E5t G5t C6e", int(80 * w))
        elif kind == "flutedown":
            S.notes("flute", t, "C6t G5t E5t C5e", int(78 * w))
        elif kind == "question":   # 冒问号：单簧管往上一挑
            S.note("clarinet", t, 0.34, m("E5"), 76 * w); S.bend("clarinet", t, t + 0.3, -2, 1)
        elif kind == "bang":       # 冒叹号 / 吓一跳：长笛尖叫一下
            S.note("flute", t, 0.22, m("A6"), 92 * w); S.bend("flute", t, t + 0.17, 0, 2)
        elif kind == "idea":       # 想到了：单簧管上行
            S.notes("clarinet", t, "C5t E5t G5t C6q", int(84 * w))
        elif kind == "womp":       # 被压弯 / 泄气：长号往下一滑
            S.note("trombone", t, 0.75, m("F3"), 92 * w); S.bend("trombone", t + 0.1, t + 0.7, 0, -5)
        elif kind == "confident":  # 一本正经写错：自信圆满的木管短句，最后一个音稍微跑调
            S.notes("oboe", t, "C5e E5e G5e C6q", int(84 * w)); S.bend("oboe", t + 1.5 * B, t + 2.3 * B, 0, -0.45, rng_semis=2)
        elif kind == "slam":       # 压纸机砸下
            S.drum(t, KICK, 125); S.drum(t, LO_TOM, 120); S.note("timpani", t, 0.8, m("D2"), 127, False); S.notes("trombone", t, "[D2,A2]q", 110)
        elif kind == "hit":        # 强拍上的全体齐奏
            S.notes("horn", t, "[F3,A3,C4]h", 115); S.notes("strings", t, "[F3,C4,F4,A4]q", 110); S.notes("bass", t, "F1h", 110)
            S.note("timpani", t, 0.6, m("F2"), 127, False); S.drum(t, KICK, 120)
        elif kind == "cascade":    # 卡带像瀑布倒下：木质音色快速下行
            S.gliss("xylo", t, t + 0.6, m("C7"), m("C5"), int(80 * w)); S.gliss("marimba", t + 0.1, t + 0.7, m("A6"), m("A4"), int(70 * w))
        elif kind == "gate":       # 门在强拍上打开
            S.notes("horn", t, "[C4,F4,A4]h", 100); S.gliss("harp", t, t + 0.6, m("F4"), m("F6"), 75)
        elif kind == "lamp":       # 台灯"啪"
            S.note("pizz", t, 0.4, m("F5"), 100); S.note("harp", t, 1.0, m("F6"), 70, False)
        elif kind == "plug":       # 插头插进去：拨弦 + 木鱼，楼灯亮起时木琴一个和弦
            S.note("pizz", t, 0.3, m("F3"), 100); S.drum(t, WOOD_HI, 90); S.notes("marimba", t + 0.05, "[F5,A5,C6]e", 80)
        elif kind == "boing":      # 卡带砸到头上
            S.drum(t, MID_TOM, 100); S.note("bassoon", t, 0.4, m("F2"), 95); S.bend("bassoon", t, t + 0.35, 0, 7)


MAJ = ["F", "Dm", "Bb", "C"]
MIN = ["Dm", "Bb", "Gm", "A7"]


def card(S, n):
    # 标题卡过门（-CARD 到 0）：每章同一个音型，竖琴往上一拨、圆号托一个和弦、木琴两个音，听到它就知道换章了
    t0 = -CARD
    for i, k in enumerate(["F3", "A3", "C4", "F4", "A4", "C5"]):
        S.note("harp", t0 + 0.1 + i * 0.07, 1.6, m(k), 62 - i * 2, human=False)
    S.notes("horn", t0 + 0.1, "[F3,C4]w", 44)
    S.notes("marimba", t0 + 0.6, "C5e F5q", 58)
    S.gliss("harp", -0.35, 0.05, m("C5"), m("C6"), 40)        # 笔刷擦过进正片


def ch01(S):
    # 第 1 章 聊天框（21.2 秒）：深夜办公室，机械的复制粘贴，只演一轮（按人的操作速度）；时间和 ch01.js 的 T 表对齐
    # 0 按住 Ctrl（轻），0.5 按 C、1.5 按 V（重）
    for t, v in [(0.0, 70), (0.5, 110), (1.0, 60), (1.5, 110)]:
        S.drum(t, WOOD_HI if v > 100 else WOOD_LO, v)
    S.note("pizz", 0.5, 0.2, m("D3"), 100); S.note("pizz", 1.5, 0.2, m("A3"), 100)
    prog = ["Dm", "Bb", "F", "C"]
    S.ostinato("bassoon", 2, 16.3, prog, step=0.5, vel=70, low=45)
    S.ostinato("pizz", 2, 16.3, prog, step=0.5, vel=60, low=57, pattern=(2, 0, 1, 0))
    S.bass("bass", 2, 16.3, prog, vel=72)
    S.sfx("castanet", 6.85); S.sfx("wood", 7.55); S.sfx("castanet", 10.6); S.sfx("wood", 11.3)   # 复制、粘贴
    S.sfx("whooshup", 7.0, .8); S.sfx("whooshdown", 10.8, .8)
    S.sfx("ng", 8.85, .8)
    # 第二轮：把"改好的"代码搬过去再运行
    S.sfx("castanet", 14.45); S.sfx("whooshup", 14.6, .8); S.sfx("wood", 15.1)
    # 笑点：同一个红叉——抽空，只留一个长号泄气
    S.sfx("ng", 16.3, .9)
    S.notes("strings", 16.35, "[D4,F4,A4]h", 45)
    S.sfx("womp", 16.8, 1)
    # 摇回聊天框，推进，进入黑场
    S.notes("strings", 18.6, "[D4,A4]w", 55); S.ramp("strings", 18.8, 20.0, 60, 120)
    S.gliss("harp", 19.7, 21.0, m("C6"), m("C3"), 55)


def ch02(S):
    # 第 2 章 收发室和那摞纸（25.4 秒）：后台，稀疏；机器每拍一下轻木鱼
    S.sfx("lamp", 0.15); S.sfx("lamp", 1.0)
    S.pad("strings", 2, 15.6, ["F", "Am", "Bb", "C"], vel=40)
    S.arp("harp", 4, 13, ["F", "Am", "Bb", "C"], step=1, vel=45, low=60)
    S.tick(2, 15.6, every=1.0, vel=34)
    S.notes("clarinet", 4.0, "C5q A4q F4h G4q A4q C5h", 62)
    for t in [4.4, 19.9]:
        S.sfx("pluck", t)       # 问题钉上去
    for t in [11.4, 23.4]:
        S.sfx("whooshdown", t, .7)
    S.notes("flute", 13.4, "A5h", 40)         # 表情归零：一个孤零零的长音
    # 前台：把项目背景贴进去，再问
    S.notes("marimba", 15.7, "F4e A4e C5e F5e", 60); S.sfx("wood", 17.35, .8)
    S.pad("horn", 15.6, 19.5, ["F", "Bb"], vel=34, low=48, count=2); S.arp("harp", 15.6, 19.5, ["F", "Bb"], step=1.0, vel=34, low=60)
    # 资料够了，答对了，停在主和弦上收尾
    S.pad("strings", 19.5, 25.4, ["F", "Bb", "F"], vel=46); S.bass("bass", 19.5, 25.4, ["F", "Bb", "F"], vel=60)
    S.sfx("idea", 22.5, .8); S.notes("clarinet", 22.8, "C5e D5e E5e F5e G5q A5h", 72)


def ch03(S):
    # 第 3 章 提示词魔法（21.2 秒）：前台打咒语，后台俏皮的三连，做菜手忙脚乱
    S.notes("marimba", 0.5, "C5s D5s E5s F5s G5s A5s", 46); S.notes("marimba", 1.8, "C5s D5s E5s F5s G5s A5s", 46)   # 打字
    S.sfx("wood", 3.7, .7)                                                                   # 发送
    S.bass("bass", 4.3, 10.6, ["F", "C7"], vel=66, style="oompah"); S.chords_off("pizz", 4.3, 10.6, ["F", "C7"], vel=50)
    S.sfx("boing", 5.3); S.sfx("whooshup", 6.7); S.notes("flute", 6.9, "F5e A5e C6q", 76)
    S.notes("clarinet", 9.3, "E5t F5t E5t F5t E5t F5t E5t F5t", 70)   # 冒汗：抖音
    S.gliss("xylo", 10.6, 12.2, m("F4"), m("F6"), 70)
    # 做菜：手忙脚乱
    S.ostinato("pizz", 12.4, 16.0, ["F", "Gm", "C7", "F"], step=0.25, vel=58, low=60)
    S.ostinato("bassoon", 12.4, 16.0, ["F", "Gm", "C7", "F"], step=0.5, vel=66, low=45)
    for i in range(3):
        S.notes("clarinet", 12.4 + i * 1.2, "C5t D5t E5t F5t G5t A5t", 66)
    S.sfx("flutedown", 16.3); S.notes("strings", 16.3, "[F3,A3,C4,F4]w", 70)
    S.sfx("whooshup", 19.5); S.notes("strings", 18.6, "[D4,F4,A4]w", 48)


def ch04(S):
    # 第 4 章 ReAct 循环与 Agent 的诞生（58.1 秒）。后台段落沿用 v001 的配乐，用 S.shift 平移到本章时间（和 ch04.js 的 SEG 表对齐）
    S.pad("strings", 0, 13.6, ["F", "Bb", "C", "F"], vel=40)
    for t in [0.55, 2.25]:
        S.sfx("pluckhi", t)                 # 抠起键帽
    for t in [0.9, 2.6]:
        S.sfx("fluteup", t, .8)             # 拖进屏幕
    with S.shift(3.6 - 106.0):              # 后台：机械臂接住键帽
        for t in [106.4, 107.0]:
            S.sfx("wood", t)
        for t in [107.6, 108.2]:
            S.sfx("castanet", t)
    S.notes("marimba", 6.8, "F4e A4e C5e", 60); S.sfx("click", 8.75)   # 拖工具清单、开开关
    with S.shift(9.6 - 113.4):
        S.sfx("pluck", 114.1)               # 工具清单落到纸摞上
    S.notes("marimba", 11.6, "C5s D5s E5s F5s", 44); S.notes("clarinet", 13.0, "C5e F5e", 66)   # 打字、发送
    with S.shift(13.6 - 116.9):             # 第一圈（取文件）、第二圈（跑代码报错）
        S.ostinato("bassoon", 116.9, 134, ["F", "Dm", "Gm", "C7"], step=0.5, vel=62, low=45)
        S.bass("bass", 116.9, 134, ["F", "Dm", "Gm", "C7"], vel=60)
        for t in [119.0, 126.0, 131.9]:
            S.sfx("question", t, .7)        # 能给结论吗？
        for t in [120.2, 127.0, 133.6]:
            S.sfx("whooshdown", t, .7)      # 执行单塞进管道
        S.tick(122.4, 123.4, every=0.25, key=WOOD_LO, vel=45)
        S.sfx("ng", 129.1, .9)              # 报错
    S.tick(30.7, 32.5, every=0.5, key=WOOD_LO, vel=55)    # 前台：一下下敲桌面，一动不动地等
    with S.shift(32.5 - 134.0):             # 第三圈：通过 → 能给结论了
        S.ostinato("bassoon", 134, 139, ["F", "Dm", "Gm", "C7"], step=0.5, vel=62, low=45)
        S.bass("bass", 134, 139, ["F", "Dm", "Gm", "C7"], vel=60)
        S.sfx("ok", 135.75); S.sfx("idea", 138.2)
        S.notes("clarinet", 139.5, "F5e A5e C6q", 74)
    S.notes("marimba", 39.1, "C6e A5e", 76)  # 修好了
    with S.shift(40.2 - 141.5):             # 样片段落：收拢、强拍扣上、站起来；箭头；走向门口
        S.drum(141.6, WOOD_LO, 85); S.drum(141.75, WOOD_LO, 75); S.sfx("question", 141.8)
        t = 142.0
        while t < 143.74:
            S.note("timpani", t, 0.12, m("C3") if t < 143 else m("F2"), int(30 + 60 * (t - 142) / 1.74), False); t += B / 4
        S.notes("strings", 142.0, "[C4,F4]q [D4,G4]q [E4,Bb4]q [F4,A4]q", 50)
        S.notes("strings", 143.0, "C5e D5e E5e F5e G5e A5e Bb5e", 62, legato=.95); S.ramp("strings", 142, 143.7, 65, 108)
        S.notes("bass", 142.0, "C2q C2q C2e C2e C2e C2e", 80)
        S.sfx("wood", 142.0); S.sfx("wood", 142.25)
        S.notes("bassoon", 142.5, "C4s Bb3s G3s E3s C3e", 88, legato=.8)
        S.sfx("castanet", 142.75); S.drum(143.0, LO_TOM, 100); S.drum(143.25, LO_TOM, 110)
        S.notes("pizz", 143.0, "[C3,G3]e", 100); S.notes("pizz", 143.25, "[C3,Bb3]e", 105)
        S.gliss("harp", 143.5, 143.73, m("C4"), m("C6"), 62); S.gliss("harp", 143.73, 143.93, m("A5"), m("F4"), 58)
        S.sfx("hit", 144.0); S.drum(144.02, CASTANET, 115); S.notes("trombone", 144.0, "[F2,C3]e", 110)
        S.sfx("womp", 144.15)
        S.notes("pizz", 144.5, "C4e re E4e re", 62)
        S.note("timpani", 144.9, 0.2, m("C3"), 90, False); S.note("timpani", 145.0, 0.3, m("F2"), 105, False)
        S.notes("clarinet", 145.15, "F4t G4t A4t Bb4t C5t D5t E5t F5t", 82, legato=1.0); S.notes("flute", 145.65, "F5q", 80)
        S.notes("bassoon", 145.8, "F2q C3q", 84, legato=.6)
        S.sfx("wood", 147.0); S.drum(147.06, WOOD_HI, 95); S.sfx("bang", 147.08); S.drum(147.5, WOOD_LO, 100); S.drum(147.56, WOOD_LO, 90)
        S.notes("clarinet", 147.85, "C5s", 80); S.notes("clarinet", 148.0, "F5e A5e C6e A5e F5e A5e C6q", 90); S.notes("flute", 148.0, "F5e A5e C6e A5e F5e A5e C6q", 70)
        S.bass("bass", 148, 150, ["F"], vel=84, style="oompah"); S.chords_off("pizz", 148, 150, ["F"], vel=66)
        S.pad("strings", 150, 153, ["F", "Bb"], vel=60); S.notes("horn", 150.5, "C4q F4h", 80)   # 箭头（v001 这里是盖章声，已去掉）
        S.notes("clarinet", 153.0, "A5e G5e F5e G5e A5q Bb5e B5e C6q A5q F5h", 86); S.notes("flute", 153.0, "A5e G5e F5e G5e A5q Bb5e B5e C6q A5q F5h", 66)
        S.notes("bassoon", 153.0, "F2q C3q C2q G2q F2q C3q C2q G2q", 88, legato=.6)
        S.bass("bass", 153, 157.5, ["F", "C7"], vel=78)
        S.notes("strings", 157.5, "[C4,E4,G4,Bb4]h", 60); S.ramp("strings", 157.5, 159.5, 70, 127); S.gliss("harp", 157.5, 158.0, m("C4"), m("C7"), 82)


def ch05(S):
    # 第 5 章 MCP：走上街（25.2 秒）。沿用 v001 的街道主题，按 ch05.js 的 SEG 表平移；取消盖章声
    st = ["F", "Bb", "C7", "F"]
    with S.shift(0 - 160.0):
        S.notes("horn", 160.0, "[F3,A3,C4]h", 100); S.notes("strings", 160.0, "[F3,C4,F4,A4]w", 90)
    with S.shift(2.9 - 163.0):
        S.sfx("bang", 163.1, .7); S.notes("flute", 163.2, "C6e A5e F5e A5e C6h", 72)
    with S.shift(4.3 - 165.0):
        S.bass("bass", 165, 177.6, st, vel=70, style="oompah"); S.chords_off("accordion", 165, 177.6, st, vel=56, low=55)
        S.notes("flute", 165, "F5q G5e A5e C6q A5q G5q F5e G5e A5h", 76); S.notes("flute", 169, "C6q Bb5e A5e G5q F5q E5q G5q C5h", 74)
        S.sfx("pluck", 169.6); S.sfx("click", 169.8)
        S.sfx("whooshdown", 171.2, .6)
        for t in [172.6, 172.9, 173.2]:
            S.sfx("pluck", t, .8)
        S.sfx("plug", 176.0); S.sfx("whooshdown", 176.3, .7); S.notes("clarinet", 177.0, "C5e F5e", 70)
    with S.shift(16.9 - 181.0):
        S.bass("bass", 181, 189.3, st, vel=70, style="oompah"); S.chords_off("accordion", 181, 185, st, vel=56, low=55)
        S.sfx("plug", 181.3)
        S.tick(182.0, 184.8, every=0.25, key=CASTANET, vel=48)
        S.notes("flute", 185.2, "F5q A5q C6h F6w", 74); S.pad("strings", 185, 189.3, st, vel=52)
        S.sfx("fluteup", 188.0)


def ch06(S):
    # 第 6 章 Skill（31.6 秒）。沿用 v001，按 ch06.js 的 SEG 表平移；取消盖章声，开头接上原第 5 章结尾的书桌
    with S.shift(0 - 194.0):
        S.notes("marimba", 194.2, "F5q C5q A4q C5q F4h", 56)
        S.pad("strings", 196, 204, ["F", "C"], vel=42)
        for t in [197.9, 199.9, 201.3]:
            S.sfx("pluck", t)                # 塞进笔记本、塞进小机器、扣上
        S.sfx("fluteup", 204.0)
        S.sfx("boing", 205.0); S.sfx("wood", 205.6)
        S.notes("strings", 206.0, "[C4,E4,G4]w", 60); S.ramp("strings", 206, 208, 70, 120)
        S.sfx("hit", 208.0); S.drum(208.0, CASTANET, 120)
        S.gliss("harp", 208.3, 209.0, m("F5"), m("F7"), 80); S.notes("flute", 208.4, "C6t D6t C6t D6t C6t D6t C6q", 70)
    with S.shift(15.8 - 211.05):
        S.ramp("strings", 211.05, 211.1, 120, 100)
        S.bass("bass", 211.05, 215.4, ["F", "Dm", "Bb", "C"], vel=60); S.pad("strings", 211.05, 215.4, ["F", "Dm", "Bb", "C"], vel=40)
        S.sfx("pluck", 212.0); S.sfx("castanet", 214.2)
    with S.shift(20.15 - 215.9):
        S.bass("bass", 215.9, 219.75, ["F", "Dm"], vel=60); S.pad("strings", 215.9, 219.75, ["F", "Dm"], vel=40)
        for t in [216.0, 216.5, 217.0, 217.5]:
            S.sfx("ok", t + 0.1, .8)
        S.sfx("ng", 218.2, 1.0); S.notes("bassoon", 219.0, "C4s A3s F3s C3e", 80)
    with S.shift(24.0 - 219.8):
        S.notes("clarinet", 219.9, "E5e D#5e E5e D#5e", 60)    # 不好意思地挠头
    with S.shift(25.2 - 221.95):
        S.bass("bass", 221.95, 228.35, ["Bb", "C", "F"], vel=60); S.pad("strings", 221.95, 228.35, ["Bb", "C", "F"], vel=40)
        for t in [222.2, 222.7, 223.2, 223.7]:
            S.sfx("ok", t + 0.1, .8)
        S.sfx("pluck", 225.4)
        S.notes("trem", 226.4, "[D4,F4,A4]w", 46)


def ch07(S):
    # 第 7 章 一本正经地出错（46.4 秒）：神秘的小调，台灯一个光源。沿用 v001，按 ch07.js 的 SEG 表平移；取消盖章声
    S.pad("strings", 0, 46.4, ["Dm", "Bb", "Gm", "A7"], vel=38, low=50)
    S.bass("bass", 0, 46.4, ["Dm", "Bb", "Gm", "A7"], vel=52)
    S.notes("clarinet", 0.1, "D4q E4q F4q G4q A4q Bb4q C5q D5h", 52)       # 往上摇：一层层往上
    with S.shift(5.4 - 242.0):
        S.notes("clarinet", 242.4, "A4h F4q E4q D4w", 50)
        S.sfx("question", 242.6, .6); S.sfx("confident", 246.4)
    with S.shift(13.3 - 250.1):
        for t in [250.5, 251.3, 252.1, 252.9, 253.7]:
            S.sfx("pluckhi", t, .7)
        S.tick(255.5, 257.8, every=0.12, key=WOOD_LO, vel=38)   # 一家家比评分：卡片翻一家"嗒"一声（第 1 到第 20 家）
        S.sfx("confident", 256.6)
    S.sfx("womp", 22.6, .8)                                      # "……所以，饭呢？"：泄气
    with S.shift(23.8 - 260.3):
        S.notes("clarinet", 260.4, "D4e F4e A4e D5e", 56); S.notes("bassoon", 261.6, "D3q C3q Bb2q A2q", 64)
        S.notes("oboe", 266.1, "A4q D5q", 56)
        S.sfx("confident", 268.8)
    with S.shift(33.7 - 272.5):
        for t in [273.0, 273.9, 274.8]:
            S.sfx("woodlo", t, .7)
        for t in [276.0, 276.5, 277.0]:
            S.sfx("pluck", t)
        S.notes("trombone", 279.6, "D3h", 70)
    with S.shift(43.6 - 284.4):
        t = 284.5
        while t < 286.7:
            S.note("timpani", t, 0.12, m("D2"), int(30 + 70 * (t - 284.5) / 2.2), False); t += B / 4


def ch08(S):
    # 第 8 章 压缩与子 Agent（38.3 秒）。沿用 v001，按 ch08.js 的 SEG 表平移；取消盖章声
    S.pad("strings", 0, 1.0, ["Dm"], vel=34)   # 先看一眼快撑不住的纸摞
    with S.shift(1.0 - 290.0):
        S.notes("trem", 290, "[D4,F4,A4]w [D4,G4,Bb4]w", 70); S.ramp("trem", 290, 293.9, 70, 127)
        S.sfx("click", 291.4); S.sfx("slam", 294.0)
        S.notes("flute", 294.1, "D6t C6t A5t F5t D5t C5t A4q", 70)
        S.gliss("harp", 294.4, 296.4, m("D6"), m("D4"), 50, scale=(0, 2, 3, 5, 7, 8, 10), tonic=2)   # 卡片慢慢飘进废纸篓
        S.pad("strings", 296, 302.8, ["Dm", "Gm"], vel=40)
        S.sfx("question", 299.3); S.sfx("confident", 301.0); S.notes("trombone", 302.4, "D3q", 60)
    with S.shift(13.8 - 303.0):
        S.pad("strings", 303, 304, ["Dm"], vel=36)
        S.bass("bass", 304, 311.6, ["F", "C7"], vel=64, style="oompah"); S.chords_off("pizz", 304, 311.6, ["F", "C7"], vel=52)
        for t in [306.6, 307.0, 307.45, 307.9]:
            S.sfx("fluteup", t, .55)
        S.notes("clarinet", 310, "C5s D5s E5s F5s G5s A5s Bb5s C6s", 70)
    for off, a, b in [(22.4 - 312.0, 312.0, 314.5), (24.9 - 317.0, 317.0, 319.5)]:
        with S.shift(off):
            S.ostinato("bassoon", a, b, ["F", "Dm"], step=0.5, vel=64, low=45); S.ostinato("pizz", a, b, ["F", "Dm"], step=0.25, vel=50, low=60)
            S.sfx("wood", a)
    with S.shift(27.4 - 322.0):
        S.bass("bass", 322, 330, ["F", "Bb", "C", "F"], vel=62)
        for i, t in enumerate([323.0, 324.0, 325.0, 326.0]):
            S.notes("marimba", t, ["C5e", "E5e", "G5e", "C6e"][i], 84)
        S.notes("strings", 330, "[F3,A3,C4,F4]w", 62); S.sfx("flutedown", 330.2, .7)
        S.pad("strings", 331, 332.9, ["Dm"], vel=40)


def ch09(S):
    # 第 9 章 上下文工程（27.5 秒）：延时，舒缓。沿用 v001，按 ch09.js 的 SEG 表平移；取消盖章声
    day = ["F", "Am", "Bb", "C"]; night = ["Dm", "Am", "Bb", "Gm"]
    with S.shift(0 - 336.0):
        S.notes("bassoon", 336.3, "F2e re F2e re F2e re", 70); S.sfx("pluck", 338.4); S.sfx("pluck", 339.1); S.sfx("woodlo", 339.75)
        S.pad("strings", 341, 345, ["F", "C"], vel=36)
        S.arp("harp", 345, 353, day, step=0.5, vel=46, low=57); S.pad("strings", 345, 353, day, vel=38)
        S.arp("harp", 353, 354.6, night, step=0.5, vel=40, low=55); S.pad("strings", 353, 354.6, night, vel=36)
        S.bass("bass", 345, 354.6, day + night, vel=50)
        for t in [346.0, 354.0]:
            S.notes("marimba", t + 0.5, "C6e", 72)
        S.note("timpani", 348.6, 0.5, m("F2"), 100, False); S.drum(348.6, LO_TOM, 90)
        S.sfx("question", 349.0, .6); S.sfx("idea", 350.6)
        S.notes("harp", 352.8, "F6q", 60)
    with S.shift(18.6 - 363.4):
        S.arp("harp", 363.4, 370, day, step=0.5, vel=48, low=57); S.pad("strings", 363.4, 372.3, day, vel=40)
        S.bass("bass", 363.4, 370, day, vel=50)
        S.notes("bassoon", 363.6, "F2e A2e C3e D3e", 70)   # 墨镜：酷
        S.note("timpani", 364.0, 0.5, m("F2"), 100, False); S.drum(364.0, LO_TOM, 90)
        for t in [365.8, 369.3]:
            S.notes("marimba", t + 0.5, "C6e", 72)
        S.notes("harp", 367.2, "F6q", 60)
        S.notes("strings", 370, "C4h F4h A4h C5h", 56); S.ramp("strings", 370, 372.2, 60, 115)


def ch10(S):
    # 第 10 章 Harness 工程（上）（44.1 秒）。沿用 v001，按 ch10.js 的 SEG 表平移（术语表那段放慢 0.75 倍，手算位置）；取消盖章声
    S.notes("marimba", 0.0, "F4e A4e C5e F5e A5q", 56)
    with S.shift(3.3 - 378.3):
        S.sfx("pluck", 378.9); S.gliss("harp", 379.0, 379.5, m("C4"), m("C6"), 66); S.notes("horn", 379.4, "[D3,A3]h", 70)
        S.notes("bassoon", 381.0, "F2e", 70); S.sfx("woodlo", 381.6); S.sfx("click", 382.2)
    with S.shift(7.8 - 383.0):
        S.bass("bass", 383, 389.4, ["F", "C7"], vel=64, style="oompah")
        for t in [384.8, 385.6, 386.4, 387.2, 388.0]:
            S.sfx("cascade", t, .8)
        S.notes("clarinet", 388.2, "E5t F5t E5t F5t D5t E5t D5t C5q", 66)
    with S.shift(14.2 - 391.9):
        S.notes("bassoon", 392.2, "C3e Bb2e", 70); S.sfx("whooshup", 393.0, .6)
    with S.shift(16.9 - 395.0):
        S.pad("strings", 395, 399.8, ["F", "Bb"], vel=44); S.sfx("pluck", 395.6); S.notes("marimba", 396.2, "F4s A4s C5s F5s A5s C6e", 62)
    with S.shift(21.7 - 400.0):
        S.bass("bass", 400, 408.4, ["F", "Gm", "C7", "F"], vel=64, style="oompah"); S.chords_off("pizz", 400, 408.4, ["F", "Gm", "C7", "F"], vel=50)
        S.notes("clarinet", 400.4, "F5q E5e D5e C5h", 64)
        S.sfx("wood", 404.4); S.sfx("woodlo", 404.48)
        for t in [404.9, 405.4, 405.9]:
            S.sfx("pluckhi", t + 0.3, .8)
    with S.shift(30.1 - 409.3):
        S.bass("bass", 409.3, 416, ["F", "Gm", "C7", "F"], vel=64, style="oompah"); S.chords_off("pizz", 409.3, 416, ["F", "Gm", "C7", "F"], vel=50)
        S.notes("clarinet", 409.4, "F5q E5e D5e C5h", 64)
        S.sfx("wood", 413.4); S.sfx("woodlo", 413.48)
        for t in [413.9, 414.4, 414.9, 415.4]:
            S.sfx("pluckhi", t + 0.3, .8)
    S.sfx("question", 38.2); S.sfx("bang", 40.87, .7); S.notes("marimba", 41.07, "C5e F5e A5e", 70)   # 术语表（放慢段，位置手算）
    S.notes("bassoon", 42.33, "F2e C3e F3e", 70)


def ch11(S):
    # 第 11 章 Harness 工程（下）（48.2 秒）。沿用 v001，按 ch11.js 的 SEG 表平移
    with S.shift(0 - 424.0):
        S.bass("bass", 424, 428, ["F", "C7"], vel=66, style="oompah"); S.notes("clarinet", 424.3, "C5s D5s E5s F5s G5e", 72)
        S.notes("trombone", 428.5, "C3e B2e Bb2q", 90); S.bend("trombone", 429.2, 429.8, 0, -3)   # 桌子？哇哇
        S.notes("bassoon", 430.8, "C4s A3s F3s C3e", 74)
        for t in [433.0, 433.5, 434.0]:
            S.sfx("pluck", t)
        S.bass("bass", 436, 446, ["F", "Bb", "C7", "F"], vel=66, style="walk")
        S.notes("clarinet", 436.0, "F5q G5e A5e Bb5q A5q G5q F5e G5e A5h", 76); S.notes("flute", 440.0, "C6q Bb5e A5e G5q F5q E5q G5q F5h", 70)
        S.sfx("plug", 438.8, .8); S.sfx("plug", 439.8, .8); S.sfx("pluckhi", 441.1); S.notes("horn", 443.5, "[F2,C3]h", 56); S.sfx("whooshdown", 444.3, .6)
        S.pad("strings", 446, 452, ["Bb", "C"], vel=42)          # 确认站：最慢的一拍，音乐收窄
        S.notes("oboe", 448.2, "C5h D5q C5q", 54); S.sfx("click", 451.45)
        S.sfx("gate", 452.0)
        S.bass("bass", 452, 464.6, ["F", "Bb", "C7", "F"], vel=70, style="walk"); S.chords_off("pizz", 452, 464.6, ["F", "Bb", "C7", "F"], vel=52)
        S.notes("clarinet", 452.5, "F5q A5q C6h A5q G5q F5h", 80)
        S.sfx("pluck", 457.2); S.sfx("ok", 460.2); S.sfx("ok", 462.6)
    with S.shift(40.6 - 466.0):
        S.pad("strings", 466, 469.6, ["F", "C"], vel=40); S.sfx("pluck", 467.6)
    with S.shift(44.2 - 470.4):
        t = 470.6
        while t < 472.4:
            S.note("timpani", t, 0.12, m("C3"), int(40 + 50 * (t - 470.6) / 1.8), False); t += B / 4
        S.notes("strings", 470.6, "[C4,F4,A4]w", 60); S.ramp("strings", 470.6, 472.4, 60, 115); S.notes("horn", 472.4, "[C4,F4]h", 80)


def ch12(S):
    # 第 12 章 Loop（27.8 秒）：安静的循环。延时段 1.6 倍速，过门的音按本章时间手算（和 ch12.js 的 SEG 表对齐）；取消盖章声
    prog = ["F", "C", "Dm", "Bb"]
    S.arp("harp", 0, 24.8, prog, step=0.5, vel=40, low=60)
    S.pad("strings", 0, 24.8, prog, vel=34)
    S.bass("bass", 0, 24.8, prog, vel=46)
    for i, t in enumerate([6.0, 7.875, 14.35, 15.96, 17.45]):
        S.notes("marimba", t, ["C5e", "D5e", "E5e", "F5e", "G5e"][i], 80)   # 每亮一盏绿灯
    S.sfx("ng", 9.75); S.notes("bassoon", 10.35, "F2e F2e F2q", 80)         # 第 3 圈亮红灯，回去重做
    S.sfx("wood", 23.5); S.notes("flute", 23.55, "C6s F6e", 80)                    # 击掌
    S.notes("strings", 24.8, "[F4,A4,C5]w", 70); S.ramp("strings", 24.8, 27.6, 60, 127); S.gliss("harp", 24.8, 27.2, m("F4"), m("F7"), 70)


def ch13(S):
    # 第 13 章 不是开关（37.1 秒）。沿用 v001，按 ch13.js 的 SEG 表平移；取消盖章声
    with S.shift(0 - 510.5):
        for t in [511.0, 512.5, 514.0]:
            S.sfx("click", t + 0.08)             # 抽空：只剩开关的咔哒声，每次完全一样
    with S.shift(4.5 - 518.0):
        S.pad("strings", 518, 532, ["C", "Am", "F", "G"], vel=40)
        S.notes("flute", 520.0, "C6e E6e G6q", 72)      # 圆滚滚
        S.notes("bassoon", 523.0, "C3e E3e G3e Bb3q", 74)   # 细长、戴墨镜
        S.notes("clarinet", 526.0, "G5h E5h", 54)        # 在睡觉
        S.pad("strings", 532, 538, ["F", "C"], vel=50)
        for t in [535.1, 535.3, 536.0]:
            S.sfx("woodlo", t, .6)                # 机械臂夹住开关、地图、表格
        S.sfx("click", 536.5); S.sfx("ok", 536.9, .8)   # 拨亮开关；检查灯亮绿灯
        S.notes("clarinet", 538.4, "C5q E5q G5h F5q E5q D5h", 64); S.bass("bass", 538, 546, ["C", "Am", "F", "G"], vel=50)
        S.sfx("pluck", 540.2); S.sfx("woodlo", 541.2); S.notes("marimba", 544.2, "G5e C6e", 66)
        S.pad("strings", 546, 550.6, ["Fadd9", "Csus"], vel=44)


def ch14(S):
    # 第 14 章 能力边界和装备（41 秒）。开头 3.4 秒是新加的前提（模型变强），其余沿用 v001，按 ch14.js 的 SEG 表平移
    S.pad("strings", 0, 3.4, ["F", "C"], vel=40); S.sfx("fluteup", 0.9, .8)
    S.notes("harp", 1.0, "F4s A4s C5s F5s A5s C6e", 60)
    with S.shift(3.4 - 552.0):
        S.pad("strings", 552.0, 562, ["F", "Bb", "C", "F"], vel=42); S.notes("oboe", 552.4, "C5q D5q F5h", 58)
        S.sfx("castanet", 556.6); S.sfx("pluck", 559.0)
        S.sfx("whooshup", 557.4, .6); S.sfx("whooshup", 560.3, .6)   # 边界往外推（各约 1.2 秒）
    with S.shift(13.0 - 562.0):
        S.notes("pizz", 563, "F3q C4q F3q C4q F3q", 60, legato=.4)   # 照菜谱：拘谨、一板一眼
    with S.shift(16.6 - 567.6):
        S.notes("pizz", 567.6, "C4q F3q", 60, legato=.4)
        S.sfx("bang", 568.6, .6); S.notes("strings", 569.5, "[F4,A4]h", 50)
        S.bass("bass", 570, 574, ["F", "C7"], vel=78, style="oompah"); S.chords_off("accordion", 570, 574, ["F", "C7"], vel=60)
        S.notes("clarinet", 570.0, "F5s G5s A5s C6s A5s G5s F5s A5s C6s D6s C6s A5s F5e C6e", 82); S.notes("flute", 572.0, "C6s D6s F6s D6s C6e A5e F5q", 76)
        S.sfx("hit", 573.2)
        S.pad("strings", 574, 580, ["F", "Dm"], vel=40)
        S.sfx("pluck", 575.0); S.sfx("whooshup", 575.6, .5); S.sfx("click", 578.6)
        S.notes("horn", 580.4, "[F3,A3,C4]h", 70); S.notes("marimba", 581.0, "F5e C6e", 66); S.sfx("fluteup", 584.4, .7)
        S.gliss("harp", 586.6, 587.8, m("F4"), m("F6"), 60)
        S.notes("strings", 588, "[F3,C4,F4]w [Bb3,D4,F4]w", 60); S.ramp("strings", 588, 590.4, 60, 115)
        S.notes("flute", 590.6, "F5h", 60)


def ch15(S):
    # 第 15 章 许愿（28 秒）。内容不变，v001 时间 = 592 + 本章时间
    with S.shift(-592.0):
        S.notes("harp", 592.6, "F5e A5e C6q", 62); S.pad("strings", 592, 614, ["F", "Am", "Bb", "C"], vel=40)
        S.arp("harp", 596, 614, ["F", "Am", "Bb", "C"], step=0.5, vel=40, low=60)
        S.notes("marimba", 599.0, "F5s G5s A5s C6s A5e F5e", 74)        # 小游戏亮起来
        S.notes("flute", 603.4, "C6h A5q F5q", 62)
        S.notes("strings", 605.6, "[F4,A4,C5]w", 54)
        S.notes("strings", 614.0, "[Bb3,D4,F4,A4]w [Bb3,D4,F4,A4]w [Bb3,D4,F4,A4]w", 40)    # 悬住，不解决
        for t in [615.6, 617.2, 618.4]:
            S.note("pizz", t, 0.3, m("A4"), 50)


def ch16(S):
    # 第 16 章 三件事（71.3 秒；v005 在"0.2s"写完处加了 1.5 秒：写字放慢 + 定格）。沿用 v001，按 ch16.js 的 SEG 表平移；延时段 1.4 倍速的音按本章时间手算；取消三次盖章声
    crash = [621.6 + i * .32 * (1 - i / 40) for i in range(16)]
    with S.shift(0 - 620.0):                 # 目标：打地鼠
        S.bass("bass", 621.5, 624.4, ["Dm", "A7"], vel=70, style="oompah")
        for i, t in enumerate(crash):
            if t < 624.4:
                S.sfx("wood" if i % 2 else "woodlo", t, .8)
    with S.shift(4.4 - 625.8):               # 越来越乱 → 改写愿望 → 安静下来
        S.bass("bass", 625.8, 627, ["A7"], vel=70, style="oompah")
        for i, t in enumerate(crash):
            if 625.8 <= t < 627:
                S.sfx("wood" if i % 2 else "woodlo", t, .8)
        S.notes("bassoon", 627.3, "C4s A3s F3s C3e", 74); S.notes("clarinet", 628.0, "F5e A5e", 66)
        for t in [629.2, 629.7, 630.2]:
            S.sfx("pluck", t)
        S.pad("strings", 630.8, 634, ["F"], vel=40); S.notes("flute", 631.6, "A5h", 50)
    with S.shift(12.6 - 634.3):              # 品味；雄心的开头
        S.bass("bass", 634.3, 641.6, ["F", "C7"], vel=56)
        for i in range(3):
            S.notes("marimba", 636.0 + i * .3, "C6s E6s", 70)
        S.notes("trombone", 637.4, "C3e Bb2e", 80)
        for i, t in enumerate([638.6, 639.5, 640.4]):
            S.sfx("ng" if i == 1 else "ok", t + 0.45, .9)
        for t in [641.6, 642.2, 642.8, 643.4]:
            S.notes("harp", t, "C6q", 50)
        S.note("timpani", 645.8, 0.3, m("F2"), 90, False); S.note("timpani", 647.2, 0.3, m("G2"), 100, False)
    S.pad("strings", 26.0, 27.8, ["C7"], vel=40)   # "0.2s"写完的定格：弦乐悬着，不解决
    with S.shift(27.8 - 648.0):              # 定格之后：Clawd 吓一跳 → 坚定 → 冲刺
        S.sfx("bang", 648.1, 1.0); S.notes("horn", 648.7, "[F3,C4]q [A3,F4]q", 96)
        S.gliss("strings", 649.4, 650.4, m("C4"), m("C6"), 80)
    long_ = ["F", "Am", "Bb", "C"]                # 长期使用的延时（1.4 倍速段）
    S.arp("harp", 30.4, 36.7, long_, step=0.5, vel=42, low=60); S.pad("strings", 30.4, 36.7, long_, vel=38)
    S.notes("clarinet", 30.4, "A5q G5q F5h G5q A5q C6h", 62)
    for t in [31.69, 34.26]:
        S.notes("marimba", t, "C6e F6e", 70)
    S.notes("horn", 36.7, "[F3,C4,F4]h", 70)       # 三、雄心（v001 这里是最重的一次盖章，改成圆号）
    with S.shift(36.69 - 659.4):             # 交接回放、走向新边界、结尾
        a = 661.3
        for i in range(10):
            S.note("pizz", a, 0.3, [m("F4"), m("G4"), m("A4"), m("Bb4"), m("C5"), m("D5"), m("E5"), m("F5"), m("G5"), m("A5")][i], 82)
            a += 0.95 + (0.45 - 0.95) * i / 9
        S.notes("strings", 668.6, "[F3,A3,C4,F4]w", 56)
        S.pad("strings", 671, 677, ["Bb", "C", "F"], vel=50); S.ramp("strings", 673, 677, 70, 120); S.notes("horn", 673.4, "[F3,C4]h [A3,F4]h", 80)
        S.bass("bass", 673, 677, ["Bb", "C"], vel=64)
        S.ramp("strings", 677.0, 677.1, 120, 90)
        S.notes("strings", 677.0, "[F4,A4]w", 36)
        S.sfx("click", 679.1)
        S.notes("clarinet", 680.0, "D5q F5q A5q F5q C5h A4h", 56)     # 第 1 章的音型，慢下来、换成大调
        S.pad("strings", 680, 683.4, ["F", "Bb"], vel=42)
        S.ramp("strings", 683.4, 685.3, 60, 120); S.notes("strings", 683.4, "[C4,F4,A4]w", 60); S.gliss("harp", 684.4, 685.3, m("C4"), m("C7"), 80)
        S.sfx("hit", 685.4)
        fin = ["F", "Bb", "C", "F"]
        S.bass("bass", 685.4, 692, fin, vel=78, style="oompah"); S.chords_off("accordion", 685.4, 692, fin, vel=56)
        S.notes("flute", 685.6, "C6q A5q F5q A5q C6h F6h", 86); S.notes("clarinet", 685.6, "A5q F5q C5q F5q A5h C6h", 76)
        S.notes("horn", 689.4, "[F3,A3,C4]w", 90); S.notes("strings", 689.4, "[F3,C4,F4,A4,C5]w", 90)
        S.notes("flute", 690.0, "F6w", 70); S.gliss("harp", 689.4, 690.6, m("F3"), m("F6"), 70)




def legacy_v001():
    # v001 的整片配乐（绝对时间），只作改写参考，不再生成
    S = Score()

    # ===== 第 1 章 0–28：深夜办公室，机械的复制粘贴 =====
    for i, t in enumerate([0.0, 0.5, 1.0, 1.5]):
        S.drum(t, WOOD_HI if i % 2 == 0 else WOOD_LO, 110); S.note("pizz", t, 0.2, m("D3") if i % 2 == 0 else m("A3"), 100)
    S.ostinato("bassoon", 2, 12, ["Dm", "Bb", "F", "C"], step=0.5, vel=70, low=45)
    S.ostinato("pizz", 2, 12, ["Dm", "Bb", "F", "C"], step=0.5, vel=60, low=57, pattern=(2, 0, 1, 0))
    S.bass("bass", 2, 12, ["Dm", "Bb", "F", "C"], vel=72)
    for t, lab in [(3.5, "c"), (4.02, "v"), (5.46, "c"), (6.0, "v"), (8.22, "c"), (8.95, "v")]:
        S.sfx("castanet" if lab == "c" else "wood", t)
    for t in [3.55, 8.45]:
        S.sfx("whooshup", t, .8)
    S.sfx("whooshdown", 5.55, .8)
    S.sfx("ng", 4.85, .8); S.sfx("ng", 9.65, .9)
    # 笑点：两段一模一样——抽空，只留一个长号泄气
    S.notes("strings", 10.4, "[D4,F4,A4]h", 45)
    S.sfx("womp", 13.0, 1)
    # 第三轮：麻木，越来越快
    S.ostinato("bassoon", 14, 18, ["Dm", "Bb", "F", "C"], step=0.5, vel=72, low=45)
    S.ostinato("bassoon", 18, 22, ["Dm", "Bb", "F", "C"], step=0.25, vel=76, low=45)
    S.ostinato("pizz", 14, 22, ["Dm", "Bb", "F", "C"], step=0.25, vel=58, low=57)
    S.bass("bass", 14, 22, ["Dm", "Bb", "F", "C"], vel=76, style="oompah")
    t = 14.0
    while t < 22:
        S.drum(t, WOOD_HI, 70); t += 0.5 if t < 18 else 0.25
    # 推向聊天框，进入黑场
    S.notes("strings", 22, "[D4,A4]w [F4,C5]w", 55); S.ramp("strings", 22, 26, 60, 120)
    S.gliss("harp", 25.4, 27.2, m("C6"), m("C3"), 55)

    # ===== 第 2 章 28–74：后台，稀疏；机器每拍一下轻木鱼 =====
    S.sfx("lamp", 28.0); S.sfx("lamp", 30.0)
    S.pad("strings", 30, 55, ["F", "Am", "Bb", "C"], vel=40)
    S.arp("harp", 34, 44, ["F", "Am", "Bb", "C"], step=1, vel=45, low=60)
    S.tick(32, 55, every=1.0, vel=34)
    S.notes("clarinet", 34.0, "C5q A4q F4h G4q A4q C5h", 62)
    for t in [35.0, 47.5, 59.6]:
        S.sfx("pluck", t)       # 钉上去
    for t in [42.5, 53.3, 65.0]:
        S.sfx("whooshdown", t, .7)
    S.notes("flute", 44.5, "A5h", 40)         # 表情归零：一个孤零零的长音
    S.sfx("stamp", 52.0, 1)
    S.notes("clarinet", 47.0, "C5q A4q F4h", 58)
    # 前台：粘贴背景资料
    S.notes("marimba", 55.2, "F4e A4e C5e F5e", 60); S.sfx("wood", 56.5, .8)
    S.pad("strings", 59, 67, ["F", "Dm", "Bb", "C"], vel=46); S.bass("bass", 59, 67, ["F", "Dm", "Bb", "C"], vel=60)
    S.notes("clarinet", 64.1, "C5e D5e E5e F5e G5q A5q", 72); S.sfx("idea", 63.9, .8)
    S.notes("clarinet", 67.6, "G4e C5q", 70)      # 点头："嗯"
    S.notes("marimba", 69.5, "C5e D5e E5e", 50); S.sfx("whooshup", 72.0, .7)

    # ===== 第 3 章 74–100：俏皮的三连 =====
    S.bass("bass", 74, 82, ["F", "C7"], vel=66, style="oompah"); S.chords_off("pizz", 74, 82, ["F", "C7"], vel=50)
    S.sfx("boing", 75.0); S.sfx("whooshup", 77.0); S.notes("flute", 77.2, "F5e A5e C6q", 76)
    S.notes("clarinet", 79.8, "E5t F5t E5t F5t E5t F5t E5t F5t", 70)   # 冒汗：抖音
    S.gliss("xylo", 81.0, 82.6, m("F4"), m("F6"), 70)
    # 做菜：手忙脚乱
    S.ostinato("pizz", 83, 93, ["F", "Gm", "C7", "F"], step=0.25, vel=58, low=60)
    S.ostinato("bassoon", 83, 93, ["F", "Gm", "C7", "F"], step=0.5, vel=66, low=45)
    for i in range(8):
        S.notes("clarinet", 83 + i * 1.25, "C5t D5t E5t F5t G5t A5t", 66)
    S.sfx("flutedown", 93.3); S.notes("strings", 93.3, "[F3,A3,C4,F4]w", 70)
    S.sfx("whooshup", 96.6); S.notes("marimba", 98.2, "F5e C5e A4q", 64)

    # ===== 第 4 章 100–160：ReAct 循环，以及 Agent 的诞生 =====
    S.pad("strings", 100, 118, ["F", "Bb", "C", "F"], vel=40)
    for t in [100.5, 103.0]:
        S.sfx("pluckhi", t)
    for t in [100.95, 103.45]:
        S.sfx("fluteup", t, .8)
    for t in [106.4, 107.0]:
        S.sfx("wood", t)
    for t in [107.6, 108.2]:
        S.sfx("castanet", t)
    S.notes("marimba", 110.4, "F4e A4e C5e", 60); S.sfx("click", 112.2); S.sfx("pluck", 114.1)
    S.notes("clarinet", 116.5, "C5e F5e", 66)
    # 循环：固定音型，一圈比一圈快
    S.ostinato("bassoon", 118, 131, ["F", "Dm", "Gm", "C7"], step=0.5, vel=62, low=45)
    S.bass("bass", 118, 131, ["F", "Dm", "Gm", "C7"], vel=60)
    for t in [120.2, 126.0]:
        S.sfx("whooshdown", t, .7)
    S.tick(122.4, 123.4, every=0.25, key=WOOD_LO, vel=45); S.tick(127.7, 128.3, every=0.25, key=WOOD_LO, vel=50)
    S.sfx("ng", 127.6, .9); S.sfx("question", 129.9)
    for a, b in [(132, 134), (135, 137), (137.5, 139)]:
        S.ostinato("bassoon", a, b, ["F", "C7"], step=0.25, vel=74, low=45); S.ostinato("pizz", a, b, ["F", "C7"], step=0.25, vel=60, low=60)
        S.bass("bass", a, b, ["F", "C7"], vel=72, style="oompah")
    for a, b in [(131, 132), (134, 135), (137, 137.5)]:
        S.tick(a, b, every=1.0, key=WOOD_LO, vel=55)        # 前台：一下下敲桌面，一动不动地等
    for t in [133.4, 135.4, 136.4, 137.8, 138.2]:
        S.sfx("ng", t, .55)
    S.sfx("idea", 136.45); S.sfx("ok", 138.9)
    S.notes("clarinet", 139.5, "F5e A5e C6q", 74); S.notes("marimba", 140.6, "C6e A5e", 76)   # 修好了
    # 样片段落（时间 = 样片 + 140）：收拢、强拍扣上
    S.drum(141.6, WOOD_LO, 85); S.drum(141.75, WOOD_LO, 75); S.sfx("question", 141.8)
    t = 142.0
    while t < 143.74:
        S.note("timpani", t, 0.12, m("C3") if t < 143 else m("F2"), int(30 + 60 * (t - 142) / 1.74), False); t += B / 4
    S.notes("strings", 142.0, "[C4,F4]q [D4,G4]q [E4,Bb4]q [F4,A4]q", 50)
    S.notes("strings", 143.0, "C5e D5e E5e F5e G5e A5e Bb5e", 62, legato=.95); S.ramp("strings", 142, 143.7, 65, 108)
    S.notes("bass", 142.0, "C2q C2q C2e C2e C2e C2e", 80)
    S.sfx("wood", 142.0); S.sfx("wood", 142.25)
    S.notes("bassoon", 142.5, "C4s Bb3s G3s E3s C3e", 88, legato=.8)
    S.sfx("castanet", 142.75); S.drum(143.0, LO_TOM, 100); S.drum(143.25, LO_TOM, 110)
    S.notes("pizz", 143.0, "[C3,G3]e", 100); S.notes("pizz", 143.25, "[C3,Bb3]e", 105)
    S.gliss("harp", 143.5, 143.73, m("C4"), m("C6"), 62); S.gliss("harp", 143.73, 143.93, m("A5"), m("F4"), 58)
    S.sfx("hit", 144.0); S.drum(144.02, CASTANET, 115); S.notes("trombone", 144.0, "[F2,C3]e", 110)
    S.sfx("womp", 144.15)
    S.notes("pizz", 144.5, "C4e re E4e re", 62)
    S.note("timpani", 144.9, 0.2, m("C3"), 90, False); S.note("timpani", 145.0, 0.3, m("F2"), 105, False)
    S.notes("clarinet", 145.15, "F4t G4t A4t Bb4t C5t D5t E5t F5t", 82, legato=1.0); S.notes("flute", 145.65, "F5q", 80)
    # 晃两步（大管踩脚）、机械臂弹出、吓一跳、高兴起来
    S.notes("bassoon", 145.8, "F2q C3q", 84, legato=.6)
    S.sfx("wood", 147.0); S.drum(147.06, WOOD_HI, 95); S.sfx("bang", 147.08); S.drum(147.5, WOOD_LO, 100); S.drum(147.56, WOOD_LO, 90)
    S.notes("clarinet", 147.85, "C5s", 80); S.notes("clarinet", 148.0, "F5e A5e C6e A5e F5e A5e C6q", 90); S.notes("flute", 148.0, "F5e A5e C6e A5e F5e A5e C6q", 70)
    S.bass("bass", 148, 150, ["F"], vel=84, style="oompah"); S.chords_off("pizz", 148, 150, ["F"], vel=66)
    S.sfx("stamp", 150.0, 1.2); S.pad("strings", 150, 153, ["F", "Bb"], vel=60); S.notes("horn", 150.5, "C4q F4h", 80)
    # 背着沉背包走向门口
    S.notes("clarinet", 153.0, "A5e G5e F5e G5e A5q Bb5e B5e C6q A5q F5h", 86); S.notes("flute", 153.0, "A5e G5e F5e G5e A5q Bb5e B5e C6q A5q F5h", 66)
    S.notes("bassoon", 153.0, "F2q C3q C2q G2q F2q C3q C2q G2q", 88, legato=.6)
    S.bass("bass", 153, 157.5, ["F", "C7"], vel=78)
    S.notes("strings", 157.5, "[C4,E4,G4,Bb4]h", 60); S.ramp("strings", 157.5, 159.5, 70, 127); S.gliss("harp", 157.5, 158.0, m("C4"), m("C7"), 82)

    # ===== 第 5 章 160–196：明亮的街道主题 =====
    st = ["F", "Bb", "C7", "F"]
    S.notes("horn", 160.0, "[F3,A3,C4]h", 100); S.notes("strings", 160.0, "[F3,C4,F4,A4]w", 90)
    S.sfx("bang", 163.1, .7); S.notes("flute", 163.2, "C6e A5e F5e A5e C6h", 72)
    S.bass("bass", 165, 190, st, vel=70, style="oompah"); S.chords_off("accordion", 165, 190, st, vel=56, low=55)
    S.notes("flute", 165, "F5q G5e A5e C6q A5q G5q F5e G5e A5h", 76); S.notes("flute", 169, "C6q Bb5e A5e G5q F5q E5q G5q C5h", 74)
    S.sfx("pluck", 169.6); S.sfx("click", 169.8); S.sfx("stamp", 170.2, .8)
    S.sfx("whooshdown", 171.2, .6)
    for t in [172.6, 172.9, 173.2]:
        S.sfx("pluck", t, .8)
    for t in [176.0, 178.5, 181.3]:
        S.sfx("plug", t)
    S.sfx("whooshdown", 176.3, .7); S.sfx("whooshdown", 179.0, .7)
    S.notes("clarinet", 177.7, "C5e F5e", 70); S.notes("clarinet", 180.4, "C5e F5e", 70)
    S.tick(182.0, 184.8, every=0.25, key=CASTANET, vel=48)
    S.notes("flute", 185.2, "F5q A5q C6h F6w", 74); S.pad("strings", 185, 193, st, vel=52)
    S.sfx("fluteup", 188.0)
    S.notes("marimba", 193.2, "F5q C5q A4q C5q F4h", 56)

    # ===== 第 6 章 196–234：Skill =====
    S.pad("strings", 196, 204, ["F", "C"], vel=42)
    for t in [198.0, 200.0, 202.0]:
        S.sfx("pluck", t)
    S.sfx("stamp", 202.5, .9); S.sfx("fluteup", 204.0)
    S.sfx("boing", 205.0); S.sfx("wood", 205.6)
    S.notes("strings", 206.0, "[C4,E4,G4]w", 60); S.ramp("strings", 206, 208, 70, 120)
    S.sfx("hit", 208.0); S.drum(208.0, CASTANET, 120)
    S.gliss("harp", 208.3, 209.0, m("F5"), m("F7"), 80); S.notes("flute", 208.4, "C6t D6t C6t D6t C6t D6t C6q", 70)
    S.bass("bass", 211, 230, ["F", "Dm", "Bb", "C"], vel=60); S.pad("strings", 211, 230, ["F", "Dm", "Bb", "C"], vel=40)
    S.sfx("pluck", 212.0); S.sfx("castanet", 214.2)
    for t in [216.0, 216.5, 217.0, 217.5, 222.2, 222.7, 223.2, 223.7]:
        S.sfx("ok", t + 0.1, .8)
    S.sfx("ng", 218.2, 1.0); S.notes("bassoon", 219.0, "C4s A3s F3s C3e", 80)
    S.notes("clarinet", 219.9, "E5e D#5e E5e D#5e E5q", 60)    # 不好意思地挠头
    S.sfx("pluck", 225.4)
    S.sfx("bang", 228.6, .6); S.notes("trem", 229, "[D4,F4,A4]w [D4,F4,Bb4]w", 50)
    S.pad("strings", 231, 234, ["Dm"], vel=40)

    # ===== 第 7 章 234–290：神秘的小调，台灯一个光源 =====
    S.pad("strings", 234, 290, ["Dm", "Bb", "Gm", "A7"], vel=38, low=50)
    S.bass("bass", 234, 290, ["Dm", "Bb", "Gm", "A7"], vel=52)
    S.notes("clarinet", 234.3, "D4q E4q F4q G4q A4q Bb4q C5q D5h", 52)       # 往上摇：一层层往上
    S.notes("clarinet", 242.4, "A4h F4q E4q D4w", 50)
    S.sfx("question", 242.6, .6)
    S.sfx("confident", 246.4); S.sfx("stamp", 247.8, .7)
    for t in [250.5, 251.3, 252.1, 252.9, 253.7]:
        S.sfx("pluckhi", t, .7)
    S.sfx("confident", 256.6)
    S.notes("clarinet", 260.4, "D4e F4e A4e D5e", 56); S.notes("bassoon", 261.6, "D3q C3q Bb2q A2q", 64)
    S.notes("oboe", 266.1, "A4q D5q", 56)
    S.sfx("confident", 268.8)
    for t in [273.0, 273.9, 274.8]:
        S.sfx("woodlo", t, .7)
    for t in [276.0, 276.5, 277.0]:
        S.sfx("pluck", t)
    S.notes("trombone", 279.6, "D3h", 70)
    t = 284.5
    while t < 290:
        S.note("timpani", t, 0.12, m("D2"), int(30 + 70 * (t - 284.5) / 5.5), False); t += B / 4

    # ===== 第 8 章 290–336：压缩与子 Agent =====
    S.notes("trem", 290, "[D4,F4,A4]w [D4,G4,Bb4]w", 70); S.ramp("trem", 290, 293.9, 70, 127)
    S.sfx("click", 291.4); S.sfx("slam", 294.0)
    S.notes("flute", 294.1, "D6t C6t A5t F5t D5t C5t A4q", 70)
    S.gliss("harp", 294.4, 296.4, m("D6"), m("D4"), 50, scale=(0, 2, 3, 5, 7, 8, 10), tonic=2)   # 卡片慢慢飘进废纸篓
    S.pad("strings", 296, 304, ["Dm", "Gm"], vel=40)
    S.sfx("question", 299.3); S.sfx("confident", 301.0); S.notes("trombone", 302.4, "D3q", 60)
    S.bass("bass", 304, 312, ["F", "C7"], vel=64, style="oompah"); S.chords_off("pizz", 304, 312, ["F", "C7"], vel=52)
    for t in [306.6, 307.0, 307.45, 307.9]:
        S.sfx("fluteup", t, .55)
    S.sfx("stamp", 309.5, .7); S.notes("clarinet", 310, "C5s D5s E5s F5s G5s A5s Bb5s C6s", 70)
    S.ostinato("bassoon", 312, 322, ["F", "Dm", "Gm", "C7"], step=0.5, vel=64, low=45); S.ostinato("pizz", 312, 322, ["F", "Dm", "Gm", "C7"], step=0.25, vel=50, low=60)
    for t in [312.0, 314.5, 317.0, 319.5]:
        S.sfx("wood", t)
    S.bass("bass", 322, 330, ["F", "Bb", "C", "F"], vel=62)
    for i, t in enumerate([323.0, 324.0, 325.0, 326.0]):
        S.notes("marimba", t, ["C5e", "E5e", "G5e", "C6e"][i], 84)
    S.notes("strings", 330, "[F3,A3,C4,F4]w", 62); S.sfx("flutedown", 330.2, .7)

    # ===== 第 9 章 336–374：延时，舒缓 =====
    S.notes("bassoon", 336.3, "F2e re F2e re F2e re", 70); S.sfx("pluck", 338.4); S.sfx("pluck", 339.1); S.sfx("woodlo", 339.75)
    S.sfx("stamp", 343.6, .8)
    day = ["F", "Am", "Bb", "C"]; night = ["Dm", "Am", "Bb", "Gm"]
    S.arp("harp", 345, 353, day, step=0.5, vel=46, low=57); S.pad("strings", 345, 353, day, vel=38)
    S.arp("harp", 353, 364, night, step=0.5, vel=40, low=55); S.pad("strings", 353, 364, night, vel=36)
    S.arp("harp", 364, 370, day, step=0.5, vel=48, low=57); S.pad("strings", 364, 372, day, vel=40)
    S.bass("bass", 345, 370, day + night + night + day, vel=50)
    for t in [346.0, 354.0, 359.2, 361.6, 365.8, 369.3]:
        S.notes("marimba", t + 0.5, "C6e", 72)
    for t in [348.6, 356.4, 364.0]:
        S.note("timpani", t, 0.5, m("F2"), 100, False); S.drum(t, LO_TOM, 90)
    S.sfx("question", 349.0, .6); S.sfx("idea", 350.6); S.notes("bassoon", 363.6, "F2e A2e C3e D3e", 70)   # 墨镜：酷
    for t in [352.8, 360.4, 367.2]:
        S.notes("harp", t, "F6q", 60)
    S.notes("strings", 370, "C4h F4h A4h C5h", 56); S.ramp("strings", 370, 372.2, 60, 115); S.note("timpani", 372.2, 0.6, m("C2"), 100, False)

    # ===== 第 10 章 374–424：Harness 工程（上） =====
    S.notes("marimba", 374.2, "F4e A4e C5e F5e A5q", 56)
    S.sfx("pluck", 378.9); S.gliss("harp", 379.0, 379.5, m("C4"), m("C6"), 66); S.notes("horn", 379.4, "[D3,A3]h", 70)
    S.notes("bassoon", 381.0, "F2e", 70); S.sfx("woodlo", 381.6); S.sfx("click", 382.2)
    S.bass("bass", 383, 392, ["F", "C7"], vel=64, style="oompah")
    for t in [384.8, 385.6, 386.4, 387.2, 388.0]:
        S.sfx("cascade", t, .8)
    S.notes("clarinet", 388.2, "E5t F5t E5t F5t D5t E5t D5t C5q", 66)
    S.notes("bassoon", 392.2, "C3e Bb2e", 70); S.sfx("whooshup", 393.0, .6)
    S.pad("strings", 395, 400, ["F", "Bb"], vel=44); S.sfx("pluck", 395.6); S.notes("marimba", 396.2, "F4s A4s C5s F5s A5s C6e", 62)
    S.sfx("stamp", 397.8, .9)
    S.bass("bass", 400, 418, ["F", "Gm", "C7", "F"], vel=64, style="oompah"); S.chords_off("pizz", 400, 418, ["F", "Gm", "C7", "F"], vel=50)
    S.notes("clarinet", 400.4, "F5q E5e D5e C5h", 64); S.notes("clarinet", 409.4, "F5q E5e D5e C5h", 64)
    for t in [404.4, 413.4]:
        S.sfx("wood", t); S.sfx("woodlo", t + 0.08)
    for t in [404.9, 405.4, 405.9, 413.9, 414.4, 414.9, 415.4]:
        S.sfx("pluckhi", t + 0.3, .8)
    S.sfx("question", 419.05); S.sfx("bang", 421.05, .7); S.notes("marimba", 421.2, "C5e F5e A5e", 70)
    S.notes("bassoon", 422.2, "F2e C3e F3e", 70)

    # ===== 第 11 章 424–476：Harness 工程（下） =====
    S.bass("bass", 424, 428, ["F", "C7"], vel=66, style="oompah"); S.notes("clarinet", 424.3, "C5s D5s E5s F5s G5e", 72)
    S.notes("trombone", 428.5, "C3e B2e Bb2q", 90); S.bend("trombone", 429.2, 429.8, 0, -3)   # 桌子？哇哇
    S.notes("bassoon", 430.8, "C4s A3s F3s C3e", 74)
    for t in [433.0, 433.5, 434.0]:
        S.sfx("pluck", t)
    S.bass("bass", 436, 446, ["F", "Bb", "C7", "F"], vel=66, style="walk")
    S.notes("clarinet", 436.0, "F5q G5e A5e Bb5q A5q G5q F5e G5e A5h", 76); S.notes("flute", 440.0, "C6q Bb5e A5e G5q F5q E5q G5q F5h", 70)
    S.sfx("plug", 438.8, .8); S.sfx("plug", 439.8, .8); S.sfx("pluckhi", 441.1); S.notes("horn", 443.5, "[F2,C3]h", 56); S.sfx("whooshdown", 444.3, .6)
    S.pad("strings", 446, 452, ["Bb", "C"], vel=42)          # 确认站：最慢的一拍，音乐收窄
    S.notes("oboe", 448.2, "C5h D5q C5q", 54); S.sfx("click", 451.45)
    S.sfx("gate", 452.0)
    S.bass("bass", 452, 466, ["F", "Bb", "C7", "F"], vel=70, style="walk"); S.chords_off("pizz", 452, 466, ["F", "Bb", "C7", "F"], vel=52)
    S.notes("clarinet", 452.5, "F5q A5q C6h A5q G5q F5h", 80)
    S.sfx("pluck", 457.2); S.sfx("ok", 460.2); S.sfx("ok", 462.6)
    S.sfx("pluck", 467.6)
    t = 470.6
    while t < 472.4:
        S.note("timpani", t, 0.12, m("C3"), int(40 + 50 * (t - 470.6) / 1.8), False); t += B / 4
    S.notes("strings", 470.6, "[C4,F4,A4]w", 60); S.ramp("strings", 470.6, 472.4, 60, 115); S.notes("horn", 472.4, "[C4,F4]h", 80)

    # ===== 第 12 章 476–510：Loop，安静的循环 =====
    S.arp("harp", 476, 506, ["F", "C", "Dm", "Bb"], step=0.5, vel=40, low=60)
    S.pad("strings", 476, 506, ["F", "C", "Dm", "Bb"], vel=34)
    S.bass("bass", 476, 506, ["F", "C", "Dm", "Bb"], vel=46)
    S.sfx("stamp", 479.0, .8)
    for i, t in enumerate([482.0, 485.0, 488.0, 492.6, 495.4, 498.0]):
        S.notes("marimba", t, ["C5e", "D5e", "E5e", "E5e", "F5e", "G5e"][i], 80)
    S.sfx("ng", 489.3); S.notes("bassoon", 489.9, "F2e F2e F2q", 80)
    S.sfx("wood", 504.9); S.notes("flute", 504.95, "C6s F6e", 80)
    S.notes("strings", 506.2, "[F4,A4,C5]w", 70); S.ramp("strings", 506.2, 509.0, 60, 127); S.gliss("harp", 506.2, 508.6, m("F4"), m("F7"), 70)
    S.ramp("strings", 509.0, 509.9, 127, 20)

    # ===== 第 13 章 510–552：不是开关 =====
    for t in [511.0, 512.5, 514.0, 515.5, 517.0]:
        S.sfx("click", t + 0.08)                 # 抽空：只剩开关的咔哒声，每次完全一样
    S.pad("strings", 518, 532, ["C", "Am", "F", "G"], vel=40)
    S.notes("flute", 520.0, "C6e E6e G6q", 72)      # 圆滚滚
    S.notes("bassoon", 523.0, "C3e E3e G3e Bb3q", 74)   # 细长、戴墨镜
    S.notes("clarinet", 526.0, "G5h E5h", 54)        # 在睡觉
    S.sfx("stamp", 529.0, 1.0)
    S.pad("strings", 532, 538, ["F", "C"], vel=50); S.sfx("ok", 536.6, .8)
    S.notes("clarinet", 538.4, "C5q E5q G5h F5q E5q D5h", 64); S.bass("bass", 538, 546, ["C", "Am", "F", "G"], vel=50)
    S.sfx("pluck", 540.2); S.sfx("woodlo", 541.2); S.notes("marimba", 544.2, "G5e C6e", 66)
    S.pad("strings", 546, 552, ["Fadd9", "Csus"], vel=44)

    # ===== 第 14 章 552–592：能力边界 =====
    S.pad("strings", 552, 562, ["F", "Bb", "C", "F"], vel=42); S.notes("oboe", 552.4, "C5q D5q F5h", 58)
    S.sfx("castanet", 556.6); S.sfx("pluck", 559.0)
    S.sfx("whooshup", 558.1, .6); S.sfx("whooshup", 561.1, .6)
    S.notes("pizz", 563, "F3q C4q F3q C4q F3q C4q F3q C4q F3q C4q", 60, legato=.4)   # 照菜谱：拘谨、一板一眼
    S.sfx("bang", 568.6, .6); S.notes("strings", 569.5, "[F4,A4]h", 50)
    S.bass("bass", 570, 574, ["F", "C7"], vel=78, style="oompah"); S.chords_off("accordion", 570, 574, ["F", "C7"], vel=60)
    S.notes("clarinet", 570.0, "F5s G5s A5s C6s A5s G5s F5s A5s C6s D6s C6s A5s F5e C6e", 82); S.notes("flute", 572.0, "C6s D6s F6s D6s C6e A5e F5q", 76)
    S.sfx("hit", 573.2)
    S.pad("strings", 574, 580, ["F", "Dm"], vel=40)
    S.sfx("pluck", 575.0); S.sfx("whooshup", 575.6, .5); S.sfx("click", 578.6)
    S.notes("horn", 580.4, "[F3,A3,C4]h", 70); S.notes("marimba", 581.0, "F5e C6e", 66); S.sfx("fluteup", 584.4, .7)
    S.gliss("harp", 586.6, 587.8, m("F4"), m("F6"), 60)
    S.notes("strings", 588, "[F3,C4,F4]w [Bb3,D4,F4]w", 60); S.ramp("strings", 588, 590.4, 60, 115)
    S.notes("flute", 590.6, "F5h", 60)

    # ===== 第 15 章 592–620：许愿 =====
    S.notes("harp", 592.6, "F5e A5e C6q", 62); S.pad("strings", 592, 614, ["F", "Am", "Bb", "C"], vel=40)
    S.arp("harp", 596, 614, ["F", "Am", "Bb", "C"], step=0.5, vel=40, low=60)
    S.notes("marimba", 599.0, "F5s G5s A5s C6s A5e F5e", 74)        # 小游戏亮起来
    S.notes("flute", 603.4, "C6h A5q F5q", 62)
    S.notes("strings", 605.6, "[F4,A4,C5]w", 54)
    S.notes("strings", 614.0, "[Bb3,D4,F4,A4]w [Bb3,D4,F4,A4]w [Bb3,D4,F4,A4]w", 40)    # 悬住，不解决
    for t in [615.6, 617.2, 618.4]:
        S.note("pizz", t, 0.3, m("A4"), 50)

    # ===== 第 16 章 620–694：目标、品味、雄心 =====
    # 目标：打地鼠，越来越乱 → 改写愿望 → 安静下来 → 盖章
    S.bass("bass", 621.5, 627, ["Dm", "A7"], vel=70, style="oompah")
    for i in range(16):
        S.sfx("wood" if i % 2 else "woodlo", 621.6 + i * .32 * (1 - i / 40), .8)
    S.notes("bassoon", 627.3, "C4s A3s F3s C3e", 74); S.notes("clarinet", 628.0, "F5e A5e", 66)
    for t in [629.2, 629.7, 630.2]:
        S.sfx("pluck", t)
    S.pad("strings", 630.8, 634, ["F"], vel=40); S.notes("flute", 631.6, "A5h", 50)
    S.sfx("stamp", 632.6, 1.0)
    # 品味
    S.bass("bass", 634, 641.6, ["F", "C7"], vel=56)
    for i in range(3):
        S.notes("marimba", 636.0 + i * .3, "C6s E6s", 70)
    S.notes("trombone", 637.4, "C3e Bb2e", 80)
    for i, t in enumerate([638.6, 639.5, 640.4]):
        S.sfx("ng" if i == 1 else "ok", t + 0.45, .9)
    for t in [641.6, 642.2, 642.8, 643.4]:
        S.notes("harp", t, "C6q", 50)
    S.sfx("stamp", 644.2, 1.4)
    # 雄心
    S.note("timpani", 645.8, 0.3, m("F2"), 90, False); S.note("timpani", 647.2, 0.3, m("G2"), 100, False)
    S.sfx("bang", 648.1, 1.0); S.notes("horn", 648.7, "[F3,C4]q [A3,F4]q", 96)
    S.gliss("strings", 649.4, 650.4, m("C4"), m("C6"), 80)
    long_ = ["F", "Am", "Bb", "C", "Dm", "Bb", "Gm", "C7"]
    S.arp("harp", 650.5, 659.6, long_, step=0.5, vel=42, low=60); S.pad("strings", 650.5, 659.6, long_, vel=38)
    S.notes("clarinet", 650.6, "A5q G5q F5h G5q A5q C6h A5q G5q F5h G5w", 62)
    for t in [652.4, 656.0]:
        S.notes("marimba", t, "C6e F6e", 70)
    S.sfx("stamp", 659.6, 2.0)
    # 交接回放：每交出一样东西一个拨弦，越来越快，停在空出来的那双手上
    a = 661.3
    for i in range(10):
        S.note("pizz", a, 0.3, [m("F4"), m("G4"), m("A4"), m("Bb4"), m("C5"), m("D5"), m("E5"), m("F5"), m("G5"), m("A5")][i], 82)
        a += 0.95 + (0.45 - 0.95) * i / 9
    S.notes("strings", 668.6, "[F3,A3,C4,F4]w", 56)
    # 走向新边界
    S.pad("strings", 671, 677, ["Bb", "C", "F"], vel=50); S.ramp("strings", 673, 677, 70, 120); S.notes("horn", 673.4, "[F3,C4]h [A3,F4]h", 80)
    S.bass("bass", 673, 677, ["Bb", "C"], vel=64)
    # 结尾：只按一下回车；同一个开头，状态完全相反
    S.notes("strings", 677.0, "[F4,A4]w", 36)
    S.sfx("click", 679.1)
    S.notes("clarinet", 680.0, "D5q F5q A5q F5q C5h A4h", 56)     # 第 1 章的音型，慢下来、换成大调
    S.pad("strings", 680, 683.4, ["F", "Bb"], vel=42)
    S.ramp("strings", 683.4, 685.3, 60, 120); S.notes("strings", 683.4, "[C4,F4,A4]w", 60); S.gliss("harp", 684.4, 685.3, m("C4"), m("C7"), 80)
    S.sfx("hit", 685.4)
    fin = ["F", "Bb", "C", "F"]
    S.bass("bass", 685.4, 692, fin, vel=78, style="oompah"); S.chords_off("accordion", 685.4, 692, fin, vel=56)
    S.notes("flute", 685.6, "C6q A5q F5q A5q C6h F6h", 86); S.notes("clarinet", 685.6, "A5q F5q C5q F5q A5h C6h", 76)
    S.notes("horn", 689.4, "[F3,A3,C4]w", 90); S.notes("strings", 689.4, "[F3,C4,F4,A4,C5]w", 90)
    S.notes("flute", 690.0, "F6w", 70); S.gliss("harp", 689.4, 690.6, m("F3"), m("F6"), 70)
    for p in ("flute", "clarinet", "horn", "strings", "accordion", "bass"):
        S.ramp(p, 691.0, 693.9, 127, 10)
    # ===== 铺底：转场段落只剩零星音效的地方补上轻的和声，配乐跨章节连续不断开 =====
    S.cc("strings", 510.2, 11, 127)          # 第 12 章结尾弦乐渐弱到 20，第 13 章起恢复
    for a, b, prog in [(22, 26, ["Dm", "Bb"]), (55, 59, ["F", "Bb"]), (67, 74, ["F", "C", "Bb", "C"]), (95, 98, ["F"]), (158, 160, ["C7"]),
                       (208.5, 211, ["F"]), (330.5, 345, ["F", "Am", "Bb", "C"]), (374, 384, ["F", "Bb", "C", "F"]), (418, 424, ["F", "C"]),
                       (430, 436, ["Dm", "Bb", "C"]), (466, 476, ["F", "Bb", "C", "C"]), (580, 590, ["F", "Bb", "C", "F"]), (620, 622, ["Dm"])]:
        S.pad("horn", a, b, prog, vel=34, low=48, count=2)
        S.arp("harp", a, b, prog, step=1.0, vel=34, low=60)
    S.arp("harp", 518, 532, ["C", "Am", "F", "G"], step=0.5, vel=36, low=60)
    return S


def intro(S):
    # 片头（6.5 秒）：冲进来 → 机械臂展开 → 大步一跨"Agent 往前一步" → 镜头上抬、按下星星"我们，往上一层"
    S.drum(0.3, LO_TOM, 110); S.notes("pizz", 0.3, "[F2,C3]e", 100)
    S.bass("bass", 0.3, 2.5, ["F", "C7"], vel=80, style="oompah")
    S.ostinato("bassoon", 0.3, 2.5, ["F", "C7"], step=0.25, vel=70, low=45)
    S.notes("flute", 0.5, "C6s D6s F6s A6s C7e", 78)
    S.sfx("bang", 1.6, .8); S.notes("clarinet", 1.6, "F5e A5e C6q", 80)
    S.sfx("whooshup", 2.45, .7)
    S.sfx("hit", 3.1); S.notes("horn", 3.1, "[F3,A3,C4,F4]h", 100); S.notes("strings", 3.1, "[F3,C4,F4,A4]w", 90)
    S.gliss("harp", 4.0, 4.9, m("F4"), m("F6"), 70); S.ramp("strings", 4.0, 4.9, 80, 120)
    S.notes("horn", 5.3, "[A3,C4,F4]w", 96); S.notes("flute", 5.3, "F6h", 80); S.sfx("pluck", 5.3)
    S.pad("strings", 5.3, INTRO, ["F"], vel=46)   # 片名出全后的停顿：和弦铺住，到片头结尾淡出


# 各章配乐（0 = 片头），放在 intro 定义之后，否则导入时 intro 还没定义
CHAPTER_MUSIC = {0: intro, 1: ch01, 2: ch02, 3: ch03, 4: ch04, 5: ch05, 6: ch06, 7: ch07, 8: ch08, 9: ch09, 10: ch10, 11: ch11, 12: ch12, 13: ch13, 14: ch14, 15: ch15, 16: ch16}


def compose(n):
    if n == 0:
        S = Score(base=0.0, total=INTRO)
        intro(S)
        return S
    S = Score(base=CARD, total=CARD + CH_LEN[n])
    card(S, n)
    CHAPTER_MUSIC[n](S)
    return S


def render_part(spec, events, n, sfbytes):
    syn = tsf.Synth(samplerate=SR)
    sfid = syn.sfload(sfbytes)
    syn.program_select(0, sfid, spec.get("bank", 0), spec["prog"], spec.get("drums", False))
    out = np.zeros((n, 2), np.float32)
    pos = 0
    for t, _, kind, a, b in sorted(events, key=lambda e: (e[0], e[1])):
        s = min(n, int(t * SR))
        if s > pos:
            out[pos:s] = np.frombuffer(syn.generate_simple(s - pos), np.float32).reshape(-1, 2)
            pos = s
        if kind == "on":
            syn.noteon(0, a, b)
        elif kind == "off":
            syn.noteoff(0, a)
        elif kind == "cc":
            syn.control_change(0, a, b)
        elif kind == "pb":
            syn.pitchbend(0, a)
        elif kind == "pbr":
            syn.pitchbend_range(0, a)
    if pos < n:
        out[pos:] = np.frombuffer(syn.generate_simple(n - pos), np.float32).reshape(-1, 2)
    return out


def reverb_ir(seconds=2.0):
    # 混响脉冲响应（只用于混响，不作为可听的音效）
    k = int(seconds * SR)
    g = np.random.default_rng(11)
    x = np.arange(k) / SR
    ir = np.zeros((k, 2))
    lp = butter(1, 5000, "lowpass", fs=SR, output="sos")
    for c in range(2):
        ir[:, c] = sosfilt(lp, g.standard_normal(k)) * np.exp(-x * 6.9 / 1.6)
    ir[: int(0.02 * SR)] = 0
    return ir / np.sqrt((ir ** 2).sum(0))


def render_chapter(n, sfbytes, ir):
    log = f"{LOG}[第 {n} 章]"
    S = compose(n)
    total = INTRO if n == 0 else CARD + CH_LEN[n]
    count = int(round(total * SR))
    dry = np.zeros((count, 2), np.float32)
    send = np.zeros((count, 2), np.float32)
    for name, evs in S.ev.items():
        spec = PARTS[name]
        y = render_part(spec, evs, count, sfbytes)
        p = spec["pan"]
        y[:, 0] *= np.sqrt((1 - p) / 2) * 1.414
        y[:, 1] *= np.sqrt((1 + p) / 2) * 1.414
        y *= spec["vol"]
        dry += y
        send += y * spec["rev"]
        del y
    wet = np.stack([oaconvolve(send[:, c], ir[:, c])[:count] for c in range(2)], 1).astype(np.float32)
    mix = dry + wet * 0.8
    mix = sosfilt(butter(2, 35, "highpass", fs=SR, output="sos"), mix, axis=0).astype(np.float32)
    mix = mix / (np.percentile(np.abs(mix), 99.95) + 1e-9) * 0.7
    mix = np.tanh(mix * 1.1) / np.tanh(1.1)
    mix *= 10 ** (-1.0 / 20) / max(1e-9, np.abs(mix).max())
    # 章首 20 毫秒淡入；章尾 1.2 秒余弦淡出，配合画面的笔刷收尾，不再戛然而止
    f = int(0.02 * SR)
    mix[:f] *= np.linspace(0, 1, f)[:, None]
    g = int(1.2 * SR)
    mix[-g:] *= (0.5 + 0.5 * np.cos(np.linspace(0, np.pi, g)))[:, None]
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out = OUT_DIR / f"ch{n:02d}.wav"
    wavfile.write(out, SR, (mix * 32767).astype(np.int16))
    print(f"{log} 输出 {out}，时长 {count / SR:.2f}s")


def main():
    chs = [int(a) for a in sys.argv[1:]] or sorted(CHAPTER_MUSIC)
    sfbytes = SF2.read_bytes()
    ir = reverb_ir()
    for n in chs:
        if n not in CHAPTER_MUSIC:
            print(f"{LOG}[第 {n} 章] 还没有按章写配乐，跳过")
            continue
        render_chapter(n, sfbytes, ir)


if __name__ == "__main__":
    main()
