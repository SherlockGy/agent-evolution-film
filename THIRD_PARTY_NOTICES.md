# 第三方内容声明

本项目除本片自己的源码和文档外，还使用了以下第三方内容。

## 制作套件和它的上游

本片在 painted-animation-agent-kit 的副本上制作。这个套件改造自 John Heibel 的两个开源项目：

| 项目 | 使用方式 |
|---|---|
| [ClaudeAnimationBase](https://github.com/JohnHeibel/ClaudeAnimationBase)（MIT 许可，基于提交 `0ac8bf2`） | 绘画引擎、渲染器、角色 Clawd 的代码以它为基础修改；`ANIMATION_GUIDE.md` 由它的英文指南翻译改写 |
| [PDoomVideo](https://github.com/JohnHeibel/PDoomVideo)（基于提交 `fa546a3`） | 只借鉴长片的制作方法（分章节、多 Agent 并行分工等），已用套件自己的话写进指南，没有收录它的任何代码或文档 |

原项目的 MIT 许可证见 [LICENSE](LICENSE)。

## npm 依赖（`npm install` 安装，未随项目分发）

| 包 | 版本 | 许可证 |
|---|---|---|
| [p5](https://p5js.org) | 2.3.3 | LGPL-2.1 |
| [p5.brush](https://github.com/acamposuribe/p5.brush) | 2.2.3 | MIT |
| [puppeteer-core](https://pptr.dev) | 25.11.0 | Apache-2.0 |

## Python 依赖（`uv run` 按脚本头部声明自动安装，未随项目分发）

- tinysoundfont、numpy、scipy：`music/score.py` 用来演奏音色、混音。

## GeneralUser GS 音色库

- 文件：`assets/sf/GeneralUser-GS.sf2`
- 作者：S. Christian Collins
- 来源：https://www.schristiancollins.com/generaluser
- 许可证：GeneralUser GS License v2.0，全文见 `assets/sf/GeneralUser-GS-LICENSE.txt`。

## 字体（渲染时读取，未随项目分发）

- 文字气泡、章节标题和封面上的问句：微软雅黑粗体（Windows 系统字体）。
- Permanent Marker：`studio.html` 从 Google Fonts 在线加载（SIL Open Font License 1.1），是引擎默认的手写字体。

## AI 生成的图像

- 片头的手绘标题字（`assets/img/title_a.png`、`assets/img/title_b.png`）和三张封面的插画（`tools/cover/art/`），由 Codex CLI 内置的图像生成工具绘制，提示词和原图都附在项目里（`assets/title_gen/`、`tools/cover/`）。标题字的品红底色是之后用脚本抠掉的。
