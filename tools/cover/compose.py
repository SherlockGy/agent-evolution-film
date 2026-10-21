# /// script
# requires-python = ">=3.12"
# dependencies = ["pillow"]
# ///
# 封面排版：codex 画的插画（无字）+ 片头的手绘标题字贴图 + 一句对观众说的话（对话气泡）
# 用法：uv run tools/cover/compose.py <wide|43|tall> <文案> <输出.png>
# 本片用的文案："AI 越来越能干，你的位置在哪？"；字体用 Windows 自带的微软雅黑粗体
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).parent / "art"
TITLE = Path(__file__).resolve().parents[2] / "assets" / "img"
FONT = r"C:\Windows\Fonts\msyhbd.ttc"
INK, PAPER = (43, 34, 51), (255, 253, 245)

# 每种尺寸：画布、插画文件、文字栏（中心 x、可用宽度）、气泡顶 y、两行标题的 y、标题宽度
SPEC = {
    "wide": dict(size=(1920, 1080), art="cover_wide.png", cx=1470, colw=820, bubble_y=150, title_y=(470, 650), title_w=780),
    "43": dict(size=(1440, 1080), art="cover_43.png", cx=1120, colw=580, bubble_y=110, title_y=(370, 515), title_w=560),
    # 抖音：主信息放在中间 3:4 区域（y 240–1680），气泡一行排下；标题底边要高过光标小手（约 y 745）
    "tall": dict(size=(1080, 1920), art="cover_tall.png", cx=540, colw=900, bubble_y=240, title_y=(390, 568), title_w=800),
}


def cover_fit(img, size):
    """按比例铺满画布，多出的部分居中裁掉"""
    W, H = size
    s = max(W / img.width, H / img.height)
    img = img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)
    x, y = (img.width - W) // 2, (img.height - H) // 2
    return img.crop((x, y, x + W, y + H))


def bubble(canvas, text, cx, top, maxw):
    """一句对观众说的话：米白圆角气泡，深墨描边 + 右下硬投影，和片头标题字同一套贴纸感"""
    d = ImageDraw.Draw(canvas)
    # 先试一行（字号 64→56）；放不下就在逗号处折成两行，字号保持大（窄画布上字比缩小更重要）
    lines, size = [text], 64
    while size >= 56 and d.textlength(text, font=ImageFont.truetype(FONT, size)) + 80 > maxw:
        size -= 2
    if size < 56 and "，" in text:
        i = text.index("，") + 1
        lines, size = [text[:i], text[i:]], 64
    while max(d.textlength(l, font=ImageFont.truetype(FONT, size)) for l in lines) + 80 > maxw and size > 40:
        size -= 2
    f = ImageFont.truetype(FONT, size)
    lh = size * 1.32
    w = max(d.textlength(l, font=f) for l in lines) + 80
    h = lh * len(lines) + 44
    x0, y0 = cx - w / 2, top
    d.rounded_rectangle((x0 + 9, y0 + 11, x0 + w + 9, y0 + h + 11), radius=30, fill=INK)          # 投影
    d.rounded_rectangle((x0, y0, x0 + w, y0 + h), radius=30, fill=PAPER, outline=INK, width=7)
    for i, l in enumerate(lines):
        d.text((cx, y0 + 22 + lh * i + lh / 2), l, font=f, fill=INK, anchor="mm")
    return y0 + h


def compose(kind, text, out):
    sp = SPEC[kind]
    canvas = cover_fit(Image.open(HERE / sp["art"]).convert("RGB"), sp["size"]).convert("RGBA")
    bubble(canvas, text, sp["cx"], sp["bubble_y"], sp["colw"])
    a = Image.open(TITLE / "title_a.png")
    b = Image.open(TITLE / "title_b.png")
    s = sp["title_w"] / a.width   # 两行用同一个缩放，字高一致
    for img, y in ((a, sp["title_y"][0]), (b, sp["title_y"][1])):
        img = img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)
        canvas.alpha_composite(img, (round(sp["cx"] - img.width / 2), y))
    canvas.convert("RGB").save(out)
    print(out, canvas.size)


if __name__ == "__main__":
    compose(sys.argv[1], sys.argv[2], sys.argv[3])
