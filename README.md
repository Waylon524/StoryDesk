# StoryDeck

<table>
  <tr>
    <td align="center"><a href="#中文"><strong>中文</strong></a></td>
    <td align="center"><a href="#english"><strong>English</strong></a></td>
  </tr>
</table>

![StoryDeck workspace](docs/images/storydeck-workspace.png)

## 中文

StoryDeck 是一个 AI Native PPT 叙事工作台，用来把一个粗糙的演示想法变成结构清晰、可编辑、可预览、可导出的 PowerPoint。它的核心理念很简单：好的 PPT 不是一页一页孤立堆出来的，而是来自清晰的叙事地图、稳定的视觉规则，以及对每一页表达意图的快速迭代。

当前 MVP 面向路演、汇报、分析型 Deck。你可以定义全局演示目标，生成叙事地图，编辑每个节点的表达意图，用 OpenAI-compatible 模型重写单页，通过 LibreOffice 渲染真实 PPT 预览，给每页指定稳定布局，锁定整套 Deck 的模板，保存本地版本，并导出 `.pptx`。

[Back to language tabs](#storydeck)

### 为什么需要 StoryDeck

传统幻灯片工具通常从空白画布开始。这很自由，但也容易让用户过早陷入视觉排版，在论证逻辑还没有清楚之前就开始调形状、字号和颜色。StoryDeck 反过来：先确定故事结构，再稳定内容和视觉系统。

StoryDeck 把一份 Deck 拆成三层：

- **叙事地图**：演讲的有序结构，包括每个节点的角色、时长和表达意图。
- **页面内容**：绑定到叙事节点的标题、正文、要点和演讲备注。
- **Deck 模板**：整套 Deck 的稳定视觉语言，在新建叙事地图时生成，后续单页编辑不会自动改变它。

这样你可以修改某一页“想表达什么”，而不会意外破坏整套 Deck 的结构和视觉一致性。AI 在这里是一个受控编辑器，而不是每次都覆盖整份 PPT 的黑箱。

### 核心理念

#### 1. 意图优先

每一页都绑定一个表达意图。你不需要先编辑像素，而是先说明这一页要完成什么任务：引入问题、制造共鸣、暴露冲突、解释路径、支撑论点，或者收束行动。

应用会把这个意图作为 AI 重写和页面编辑的控制面。

#### 2. 叙事地图是全局事实源

叙事地图位于 Deck 全局层级，而不是重复出现在每一页的 Intent Panel 里。这样可以让整套 PPT 的逻辑一直可见，也避免逐页编辑把故事拆碎。

你可以拖拽重排节点、选择节点、查看结构风险提示、编辑节点表达目标。每个节点仍然绑定到一页幻灯片。

#### 3. 模板保持稳定

新建叙事地图时，StoryDeck 会先让 AI 生成叙事结构，然后开启第二个独立 AI 请求，把生成好的叙事地图交给模型生成 Deck 模板。后续单页重写不会改变模板。这能保护视觉一致性，同时允许内容持续演进。

#### 4. 统一布局注册表

每页都带有布局类型，例如场景陈述、三点论证、流程路径、行动收束。网页预览和 PPTX 导出都读取同一个布局注册表，避免预览和导出走两套互相漂移的结构规则。

#### 5. LibreOffice 真实预览

StoryDeck 可以运行一个本地 Node 预览服务。前端会生成临时单页 PPTX，发送给服务端，由 LibreOffice 渲染成 PNG 后返回浏览器。这样预览更接近真实 PowerPoint 渲染，而不是只依赖 CSS 近似。

#### 6. AI 是聚焦的重写工具

StoryDeck 支持 OpenAI-compatible chat completions。当前 AI 流程可以：

- 根据 brief 生成新的叙事地图。
- 在新对话中根据叙事地图生成模板。
- 根据当前节点意图只重写选中页。
- 在单页重写时保留其他页面和 Deck 模板。

默认本地测试配置使用 DeepSeek-compatible endpoint shape，但设置项可以修改。

#### 7. Local-first 项目状态

当前项目状态和版本历史保存在浏览器 localStorage。应用也支持导出/导入 `.storydeck.json` 项目文件。API 设置与项目文件分离，导出的项目文件不会包含 API key。

### 功能特性

- 可拖拽排序的线性叙事地图。
- 全局设置中配置 AI、生成叙事地图、管理模板和版本。
- OpenAI-compatible API 设置：API key、base URL、model。
- AI 生成新叙事地图。
- 新建叙事地图后，由第二个独立 AI 对话生成模板。
- AI 重写当前选中页。
- 预览和导出共享同一个布局注册表。
- 预览工具栏支持单页布局切换。
- 本地 LibreOffice 服务渲染当前页真实 PPT 预览。
- 桌面工作区固定 16:9 预览比例。
- 新建 Deck 时生成并锁定稳定模板。
- 模板面板展示锁定状态、色板和 AI 重新生成入口。
- 本地版本管理，支持手动保存和恢复。
- 最近 Deck 级编辑支持撤销，包括布局切换、重写、重置、导入、恢复和模板重生成。
- 项目导出/导入为 `.storydeck.json`。
- 通过 `pptxgenjs` 导出 PPTX。
- 测试覆盖持久化、AI 生成、单页重写、模板稳定性、版本历史和撤销。

### 截图

#### 工作台

主工作台由叙事地图、当前页预览和 Intent Panel 组成。

![StoryDeck workspace](docs/images/storydeck-workspace.png)

#### 全局设置和版本管理

全局设置弹窗包含叙事地图生成、API 配置、模板管理、版本管理和项目文件操作。

![StoryDeck settings and versions](docs/images/storydeck-settings-versions.png)

#### 固定 16:9 桌面预览

幻灯片预览在桌面工作区中保持固定 16:9 画布比例，匹配 PowerPoint 导出目标。

### 使用方法

#### 1. 安装依赖

```bash
npm install
```

#### 2. 启动开发服务器

```bash
npm run dev
```

默认地址是 `http://127.0.0.1:5173/`。如果端口被占用，Vite 可能会自动选择下一个可用端口。

#### 3. 启动 LibreOffice 预览服务

先安装 LibreOffice，然后在第二个终端运行：

```bash
npm run preview-server
```

预览服务默认启动在 `http://127.0.0.1:5175/`，并查找 `/Applications/LibreOffice.app/Contents/MacOS/soffice`。你也可以手动指定路径：

```bash
LIBREOFFICE_PATH=/path/to/soffice npm run preview-server
```

如果服务未启动，StoryDeck 会回退到可编辑 CSS 预览，并在预览状态栏显示提示。

#### 4. 配置 AI

打开 **Settings**，填写：

- **API Key**：OpenAI-compatible API key。
- **Base URL**：例如 `https://api.deepseek.com`。
- **Model**：例如 `deepseek-v4-flash`。

API 设置只保存在本地浏览器中，不会写入导出的项目文件。

#### 5. 生成叙事地图

在 **Settings** 中使用 **New Narrative Map**：

1. 输入主题。
2. 定义听众。
3. 描述 Deck 目标。
4. 设置目标时长。
5. 点击 **Generate Narrative Map**。

StoryDeck 会执行两次 AI 调用：第一次生成叙事节点和页面内容，第二次在新对话中接收叙事地图并生成 Deck 模板。

#### 6. 重写单页

1. 在叙事地图中选择一个节点。
2. 在 Intent Panel 中编辑表达目标。
3. 点击预览工具栏中的 **AI Rewrite**。

只有选中页的标题、正文、要点和演讲备注会被重写。叙事结构、其他页面和 Deck 模板保持不变。

#### 7. 管理 Deck 模板

打开 **Settings**，使用 **Current Template**：

- 查看当前锁定模板名称和色板。
- 点击 **Regenerate Template**，让 AI 基于当前叙事地图生成新模板。
- StoryDeck 会在模板重生成前自动保存一个版本。

模板重生成只改变 Deck 的视觉语言。叙事节点、页面内容和页面布局不会被改变。

#### 8. 保存、恢复和撤销

打开 **Settings**，使用 **Version Management**：

- 在大幅重写或结构调整前点击 **Save Current Version**。
- 填写版本名称和变更摘要，方便之后理解恢复点。
- 点击某个版本的 **Restore** 回到该快照。
- 恢复前，StoryDeck 会自动保存当前状态为 **恢复前自动保存**，避免最新工作丢失。

顶部工具栏的 **撤销** 按钮可以回退最近一次 Deck 级编辑。版本历史和撤销栈都只保存在本地。

#### 9. 导出 PPTX

点击顶部栏 **Export PPTX**。StoryDeck 会根据当前内容和锁定模板导出 PowerPoint 文件。

#### 10. 导出或导入项目文件

打开 **Settings**，使用 **Project File**：

- **Export Project** 导出 `.storydeck.json` 文件。
- **Import Project** 恢复之前导出的 StoryDeck 项目。
- **Reset to Example Deck** 回到内置示例。

### 项目结构

```text
StoryDeck/
  src/
    App.tsx                    # React 主界面和核心 UI 流程
    data/seedDeck.ts           # 内置示例 Deck
    lib/aiGeneration.ts        # OpenAI-compatible Deck 和单页生成
    lib/aiSettings.ts          # 本地 AI 设置持久化
    lib/deckLogic.ts           # 叙事和页面状态更新
    lib/deckPersistence.ts     # 项目保存、导入、导出
    lib/libreOfficePreview.ts  # 本地预览服务的浏览器客户端
    lib/pptxExport.ts          # 导出和预览共用的 PPTX 生成
    lib/slideLayout.ts         # 网页/PPTX 共用布局注册表
    lib/deckTemplate.ts        # 稳定模板创建和迁移
    lib/deckVersions.ts        # 本地版本历史
    styles.css                 # 应用布局和固定 16:9 画布
  server/
    preview-server.mjs         # 用 LibreOffice 渲染 PPTX 的本地 Node 服务
  docs/images/                 # README 截图
  output/playwright/           # 本地验证截图，默认不提交
```

### 可用脚本

```bash
npm run dev
npm run preview-server
npm test
npm run lint
npm run build
```

- `npm run dev` 启动 Vite 开发服务器。
- `npm run preview-server` 启动本地 LibreOffice 渲染服务。
- `npm test` 运行 Vitest 测试。
- `npm run lint` 运行 TypeScript 项目检查。
- `npm run build` 创建生产构建。

### AI Provider 说明

StoryDeck 调用 OpenAI-compatible `/v1/chat/completions` API。本地浏览器开发时，发往 `https://api.deepseek.com` 的请求会通过 Vite proxy 路径 `/deepseek/v1/chat/completions` 转发。

应用期望 Deck 生成和单页重写都返回 JSON。提示词会明确要求模型不要编造用户没有提供的数据。

### 当前 MVP 状态

已实现：

- 基于叙事地图的编辑。
- 全局 AI 设置。
- AI 叙事地图生成。
- 叙事地图生成后，单独生成 AI 模板。
- AI 单页重写。
- LibreOffice-backed 当前页预览。
- 固定 16:9 预览。
- 布局注册表 v1：场景陈述、三点论证、流程路径、行动收束。
- 预览工具栏中的当前页布局选择。
- 稳定 Deck 模板。
- 锁定模板控件和 AI 模板重生成。
- Undo 栈。
- 本地项目持久化。
- 项目导出/导入。
- 带摘要的命名版本历史和恢复前自动保存。
- PPTX 导出。

计划中：

- 每页图片和证据素材。
- 基于 LibreOffice 渲染图片的预览/导出回归检查。
- 云同步或 Git-backed 项目历史。

### 隐私和本地数据

StoryDeck 当前是 local-first：

- 项目状态存储在浏览器 localStorage。
- 版本历史存储在浏览器 localStorage。
- API 设置与项目文件分离存储。
- 导出的 `.storydeck.json` 不包含 API key。

在浏览器原型中使用真实 API key 时请谨慎。生产环境建议通过后端或可信边缘函数转发 AI 请求。

### License

当前尚未选择 License。公开分发或接受外部贡献前，建议先补充 License。

---

## English

StoryDeck is an AI-native slide narrative workspace for turning a rough presentation idea into a structured, editable, previewable, and exportable PowerPoint deck. It is designed around a simple belief: great slides are not made one page at a time in isolation. They come from a clear story map, stable visual rules, and fast iteration on intent.

The current MVP focuses on pitch and analysis decks. It lets you define a global presentation goal, generate a narrative map, edit each node's communication intent, rewrite a single slide with an OpenAI-compatible model, render the current slide through LibreOffice for a true PPT preview, assign stable slide layouts, lock a deck template for consistency, save local versions, and export a `.pptx`.

[Back to language tabs](#storydeck)

### Why StoryDeck Exists

Traditional slide tools usually start from a blank canvas. That is flexible, but it often pushes the user into premature visual editing before the argument is clear. StoryDeck reverses that order: clarify the story first, then stabilize content and visual rules.

StoryDeck treats a deck as three connected layers:

- **Narrative map**: the ordered structure of the talk, including each node's role, timing, and intent.
- **Slide content**: the title, body, bullets, and speaker note bound to each narrative node.
- **Deck template**: the stable visual language for the whole deck, generated when the narrative map is created and preserved during later edits.

This means you can adjust what a slide is trying to say without accidentally changing the deck's structure or visual system. AI is used as an editor inside that model, not as a black box that overwrites the whole presentation every time.

### Core Ideas

#### 1. Intent First

Every slide is attached to an intent. Instead of editing pixels first, you describe what the page should accomplish: introduce a problem, create resonance, expose a conflict, explain a solution path, support a claim, or close with action.

The app then uses that intent as the control surface for rewriting the slide.

#### 2. Narrative Map as the Source of Truth

The narrative map lives at the deck level. It is not repeated inside every slide panel. This keeps the deck's logic visible and prevents page-by-page editing from fragmenting the story.

You can reorder nodes, select a node, inspect its risk prompt, and edit the node's expression target. Each node remains bound to one slide.

#### 3. Stable Templates

When a new narrative map is generated, StoryDeck first asks AI to create the story structure, then starts a separate AI request that receives that narrative map and generates the deck template. Later slide rewrites do not change that template. This protects visual consistency while allowing content to evolve.

#### 4. Shared Layout Registry

Each slide carries a layout kind such as scene statement, three-point argument, process path, or closing action. The web preview and PPTX export both read from the same layout registry, so a page's structure is not reinterpreted differently during export.

#### 5. LibreOffice Preview

StoryDeck can run a local Node preview service that receives a temporary single-slide PPTX, asks LibreOffice to render it, and returns a PNG to the browser. This makes the preview match the real PPTX rendering path instead of relying only on CSS approximation.

#### 6. AI as a Focused Rewrite Tool

StoryDeck supports OpenAI-compatible chat completions. The current AI flow can:

- Generate a new narrative map from a brief.
- Generate the deck template in a separate AI conversation after the narrative map is created.
- Rewrite only the selected slide from the current node intent.
- Preserve the rest of the deck and the deck template during a single-slide rewrite.

The default test configuration uses a DeepSeek-compatible endpoint shape, but the settings are editable.

#### 7. Local-First Project State

The app stores the current project and version history in browser local storage. It also supports exporting and importing `.storydeck.json` project files. API settings are kept separate from project exports.

### Features

- Linear narrative map with draggable story nodes.
- Global settings for AI configuration, narrative-map generation, template management, and version history.
- OpenAI-compatible API settings: API key, base URL, and model name.
- AI generation for a fresh narrative map.
- Separate AI template generation after the narrative map is created.
- AI rewrite for the currently selected slide.
- Layout-aware slide preview and PPTX export.
- Per-slide layout selection from the preview toolbar.
- LibreOffice-backed current-slide preview through a local Node service.
- Fixed 16:9 slide preview for the desktop workspace.
- Stable deck template generated at deck creation time.
- Template management with locked palette preview and AI template regeneration.
- Local version management with manual save and restore.
- Undo for recent deck-level edits such as layout changes, rewrites, resets, imports, restores, and template regeneration.
- Project export/import as `.storydeck.json`.
- PPTX export through `pptxgenjs`.
- Tests for persistence, AI generation, single-slide rewrite, template stability, version history, and undo.

### Screenshots

#### Workspace

The main workspace combines the narrative map, current slide preview, and intent panel.

![StoryDeck workspace](docs/images/storydeck-workspace.png)

#### Global Settings and Version Management

The global settings modal contains narrative-map generation, API configuration, template management, version management, and project file actions.

![StoryDeck settings and versions](docs/images/storydeck-settings-versions.png)

#### Fixed 16:9 Desktop Preview

The slide preview keeps a fixed 16:9 canvas in the desktop workspace, matching the PowerPoint export target.

### How to Use

#### 1. Install Dependencies

```bash
npm install
```

#### 2. Start the Development Server

```bash
npm run dev
```

The app starts on `http://127.0.0.1:5173/` by default. If that port is already in use, Vite may choose the next available port.

#### 3. Start the LibreOffice Preview Service

Install LibreOffice, then run the local preview server in a second terminal:

```bash
npm run preview-server
```

The preview service starts on `http://127.0.0.1:5175/` by default and looks for LibreOffice at `/Applications/LibreOffice.app/Contents/MacOS/soffice`. You can override it with:

```bash
LIBREOFFICE_PATH=/path/to/soffice npm run preview-server
```

If the service is not running, StoryDeck falls back to the editable CSS preview and shows an error in the preview status line.

#### 4. Configure AI

Open **Settings** and fill in:

- **API Key**: your OpenAI-compatible API key.
- **Base URL**: for example `https://api.deepseek.com`.
- **Model**: for example `deepseek-v4-flash`.

API settings are stored locally in the browser and are not included in exported project files.

#### 5. Generate a Narrative Map

In **Settings**, use **New Narrative Map**:

1. Enter a topic.
2. Define the audience.
3. Describe the deck goal.
4. Set the target duration.
5. Click **Generate Narrative Map**.

StoryDeck creates a deck in two AI calls: the first call generates narrative nodes and slides, then a second fresh AI call receives that narrative map and generates the deck template.

#### 6. Rewrite a Single Slide

1. Select a node in the narrative map.
2. Edit the expression target in the intent panel.
3. Click **AI Rewrite** in the slide toolbar.

Only the selected slide's title, body, bullets, and speaker note are rewritten. The narrative structure, other slides, and deck template stay unchanged.

#### 7. Manage the Deck Template

Open **Settings** and use **Current Template**:

- Review the locked template name and palette.
- Click **Regenerate Template** to ask AI for a new template based on the current narrative map.
- StoryDeck automatically saves a version before regenerating the template.

Regenerating a template changes the deck's visual language only. Narrative nodes, slide content, and slide layouts stay unchanged.

#### 8. Save, Restore, and Undo

Open **Settings** and use **Version Management**:

- Click **Save Current Version** before a larger rewrite or structural change.
- Add a version name and change summary when you want the restore point to be self-explanatory.
- Click **Restore** on a saved version to return to that snapshot.
- Before restoring, StoryDeck automatically saves the current state as **恢复前自动保存** so the latest work is not lost.

The top-bar **Undo** button rolls back the most recent deck-level edit. Version history and the undo stack are both local to the browser.

#### 9. Export a PPTX

Click **Export PPTX** in the top bar. StoryDeck exports the deck using the current content and the locked deck template.

#### 10. Export or Import a Project File

Open **Settings** and use **Project File**:

- **Export Project** saves a `.storydeck.json` file.
- **Import Project** restores a previously exported StoryDeck project.
- **Reset to Example Deck** returns to the bundled sample.

### Project Structure

```text
StoryDeck/
  src/
    App.tsx                    # Main React shell and UI flows
    data/seedDeck.ts           # Bundled example deck
    lib/aiGeneration.ts        # OpenAI-compatible deck and slide generation
    lib/aiSettings.ts          # Local AI settings persistence
    lib/deckLogic.ts           # Narrative and slide state transitions
    lib/deckPersistence.ts     # Project save/import/export helpers
    lib/libreOfficePreview.ts  # Browser client for the local preview renderer
    lib/pptxExport.ts          # Shared PPTX generation for export and preview
    lib/slideLayout.ts         # Shared web/PPTX layout registry
    lib/deckTemplate.ts        # Stable deck template creation and migration
    lib/deckVersions.ts        # Local version history
    styles.css                 # App layout and fixed 16:9 slide canvas
  server/
    preview-server.mjs         # Local Node service that renders PPTX via LibreOffice
  docs/images/                 # README screenshots
  output/playwright/           # Local verification screenshots, ignored by default
```

### Available Scripts

```bash
npm run dev
npm run preview-server
npm test
npm run lint
npm run build
```

- `npm run dev` starts the Vite development server.
- `npm run preview-server` starts the local LibreOffice rendering service.
- `npm test` runs the Vitest suite.
- `npm run lint` runs TypeScript project checks.
- `npm run build` creates a production build.

### AI Provider Notes

StoryDeck calls an OpenAI-compatible `/v1/chat/completions` API. For DeepSeek during local browser development, requests to `https://api.deepseek.com` are routed through the local Vite proxy path `/deepseek/v1/chat/completions`.

The app expects JSON responses for deck generation and slide rewrites. The prompts explicitly ask the model not to invent statistics unless the user provided them.

### Current MVP Status

Implemented:

- Narrative-map based editing.
- Global AI settings.
- AI narrative-map generation.
- Separate AI-generated template creation from the narrative map.
- AI single-slide rewrite.
- LibreOffice-backed current-slide preview.
- Fixed 16:9 preview.
- Layout registry v1 for statement, three-point, process, and closing slides.
- Preview-toolbar layout selection for the current slide.
- Stable deck template.
- Locked template controls and AI template regeneration.
- Undo stack for quick local reversions.
- Local project persistence.
- Project export/import.
- Named version history with summaries and pre-restore autosave.
- PPTX export.

Planned next:

- Image and evidence attachment per slide.
- Preview/export regression checks through LibreOffice-rendered images.
- Cloud sync or Git-backed project history.

### Privacy and Local Data

StoryDeck is currently local-first:

- Project state is stored in browser local storage.
- Version history is stored in browser local storage.
- API settings are stored separately from exported project files.
- Exported `.storydeck.json` files do not include API keys.

Be careful when using real API keys in browser-based prototypes. For production use, route AI calls through a backend or trusted edge function.

### License

No license has been selected yet. Add a license before distributing or accepting external contributions.
