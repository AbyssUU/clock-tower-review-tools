# CLAUDE.md — 魔典复盘生成器（Blood on the Clocktower Grimoire Replay）

一款面向《血染钟楼》(Blood on the Clocktower) 的复盘工具：将一局对局的数据（玩家座位、角色、昼夜阶段、日志、token、词条等）渲染成一张暗黑哥特风格的高清长图，支持所见即所得编辑、轻量 JSON 导入导出、剧本 JSON 加载，以及可选的多模态识图自动生成复盘数据。

> 本文件是给后续在此仓库工作的 AI/协作者看的项目地图，包含架构、数据标准、关键实现思路与近期改动。面向用户的说明见 [`README.md`](README.md)。

---

## 1. 技术栈

| 领域 | 选型 |
| --- | --- |
| 框架 | React 18 + TypeScript（strict） |
| 构建 | Vite 5 |
| 样式 | Tailwind CSS 3.4（自定义暗夜/黄铜/羊皮纸/冷月配色） |
| 状态 | zustand（全局单一 store） |
| 图标 | lucide-react |
| 动画 | Framer Motion（部分装饰） |
| 导出 | html-to-image（`toPng`） |

常用命令：

```bash
npm install
npm run dev        # 开发预览 http://localhost:5173
npm run build      # tsc -b && vite build（输出 dist/）
npm run preview    # 预览生产构建
npx tsc --noEmit   # 仅类型检查
```

---

## 2. 目录结构

```
src/
├── App.tsx                     # 应用壳：顶部工具栏 + 左侧编辑栏 + 右侧长图预览
├── main.tsx                    # 入口
├── index.css                   # Tailwind + 全局字体变量 + .input-dark / .editable-* 组件类
├── store.ts                    # zustand store（唯一数据源）
├── sampleData.ts               # 示例复盘数据（引用 src/assets/replay-default.json）
├── types.ts                    # 全部 TypeScript 类型 + 内置角色目录 CHARACTER_CATALOG
├── assets/
│   ├── script-default.json     # 默认剧本（= reference/暗藏玄机v2.1.json）
│   └── replay-default.json     # 默认示例复盘（= reference/复盘数据 (1).json）
├── lib/
│   ├── script.ts               # 剧本解析 + 阵营/颜色/别名/图片代理/reminders
│   ├── theme.ts                # 长图配色主题系统（5 套 ReplayTheme）
│   ├── geometry.ts             # 径向布局几何计算
│   ├── special.ts              # 传奇(Fabled)/奇遇(Traveler)角色目录
│   ├── exportUtils.ts          # PNG 导出 + JSON 下载
│   └── recognize.ts            # 多模态识图（OpenAI 兼容 vision 接口）
└── components/
    ├── editable/               # 就地可编辑原语（EditableText/Textarea/Select/Toggle）
    ├── editor/                 # 左侧编辑面板（EditorPanel + Field）
    ├── export/                 # 长图导出组件
    │   ├── LongImage.tsx       # 长图容器（含 StorytellerNotes）
    │   ├── Header.tsx          # 标题/logo/胜负徽章/元信息
    │   ├── OrnateDivider.tsx   # 华丽分隔线
    │   └── CornerOrnament.tsx  # 黄铜角饰
    ├── board/                  # 魔典轮盘
    │   ├── RadialWheel.tsx     # 径向蛛网布局 + token 挂载 + token 编辑器
    │   ├── GrimoireModulesRow.tsx # 恶魔伪装 / 传奇 / 奇遇模块
    │   └── CharacterIcon.tsx   # 角色肖像 token（图片回退首字）
    └── timeline/               # 昼夜复盘流
        ├── PhaseTimeline.tsx   # 阶段容器
        ├── PhaseSection.tsx    # 单阶段（主题化昼夜配色）
        └── LogRow.tsx          # 单条日志（提及解析 + 词条/类型编辑）
```

`reference/` 目录存放「源参考文件」，`src/assets/` 下两份默认 JSON 由其复制而来（保持二者同步）。

---

## 3. 数据标准（精简版复盘 JSON）

完整类型定义见 [`src/types.ts`](src/types.ts)，核心根对象 `BotCReplayRecord`：

```typescript
interface BotCReplayRecord {
  meta: {
    title: string; storyteller: string; date: string
    winner: 'good' | 'evil' | 'storyteller' | 'custom'; winnerCustom?: string
    winningReason?: string; mvp?: string
    titleMode?: 'logo' | 'text'    // 标题渲染：logo 或文字
    imageWidth?: number            // 长图宽度 px，默认 1080
    theme?: string                 // 配色主题 id（见 lib/theme.ts），默认 midnight-gold
  }
  scriptMeta: ScriptMeta          // { scriptName, scriptId?, author?, logo?, version? }
  evilSetup: EvilSetupInfo        // { demonBluffs, lunaticBluffs?, evilKnowledgeNotes?, customBluffs? }
  customGlossary: { tag; color; description? }[]
  customSections?: { title; content }[]   // 说书人复盘手记
  specialRoles?: SpecialRoleEntry[]       // 传奇/奇遇角色
  characterAliases?: Record<string,string>// 原角色名 -> 显示名（全局改名）
  fontSettings?: { cn?; latin? }          // 中/英文字体
  modules?: { bluffs?; fabled?; traveler? } // 魔典下方模块显隐
  initialPlayers: ReplayPlayer[]  // 玩家座位、真实/伪装角色、token、customTags
  phases: GamePhase[]             // 昼夜阶段 + logs
}
```

关键子类型：

- `ReplayPlayer`：`seatNumber / name / realCharacter / fakeCharacter? / isAlive / hasGhostVote / activeTokens[] / customTags?[]`
- `BoardToken`：`id / label / type('reminder'|'global'|'status'|'custom') / color? / icon? / characterName?`
- `LogEntry`：`id / type? / sourceSeat? / targetSeats? / characterName? / content / isLie? / customTag? / typeLabel? / votes? / tokensAdded? / tokensRemoved?`
- `GamePhase`：`id / phaseType('night'|'day') / phaseNumber / title / logs[] / boardSnapshot?`

**重要约定**：

- 导出/存储的复盘 JSON **不包含**剧本角色能力详情库，只保留 `scriptMeta` 精简元数据。
- 正文支持两种**提及语法**：`[座位号]`（绑定玩家名 + 角色图标）、`（角色名）`（绑定角色图标），由 `LogRow.tsx` 的 `parseContent` 实时解析渲染；编辑时点击回到原始文本。
- `customTag` 命中 `customGlossary` 时使用词条色，否则按自定义文本回显。

---

## 4. 状态管理（zustand）

单一 store：`useReplayStore`（见 `store.ts`）。

- 核心字段：`replay`（根数据）、`script`（剧本角色数组）、`scriptName`、`screenshot`、`exporting`。
- `replay` 初始值来自 `structuredClone(SAMPLE_REPLAY)`；`script` 来自 `parseScriptArray(script-default.json)`。
- 关键方法：
  - `updateMeta / updateScript / updateEvilSetup / updateModules` — 局部 patch。
  - `setAlias(original, display)` — 统一改名。
  - `loadScript(json)` — 解析剧本 JSON，自动读取 `_meta.logo`（有则默认切到 `titleMode: 'logo'`）。
  - `importJSON(json)` — 校验 `initialPlayers`/`phases` 为数组后整体替换 `replay`。
  - `setScreenshot / setExporting / reset`。
- `nextId(prefix)` 生成运行时 id（`prefix-时间戳-计数`）。

**编辑态判断**：`EditModeContext`（默认 false）+ `useEditable()` = `useContext(EditModeContext) && !exporting`。长图在编辑模式下 `editable=true`，导出/`?export=1` 只读模式下为 false，从而隐藏所有增删/编辑按钮。

---

## 5. 长图渲染与主题系统

`LongImage.tsx` 是长图根组件，自上而下依次渲染：

1. **Header** — 标题（logo 或文字）+ 胜负徽章 + 元信息 + MVP + 胜负判定。
2. **OrnateDivider**（GRIMOIRE）→ **RadialWheel**（魔典轮盘）+ **GrimoireModulesRow**（伪装/传奇/奇遇）。
3. **OrnateDivider**（TIMELINE）→ **PhaseTimeline**（昼夜复盘流）。
4. **OrnateDivider**（SNAPSHOT，可选截图）。
5. **OrnateDivider**（STORYTELLER）→ **StorytellerNotes**（2 列横向手记）。
6. **footer**。

### 主题系统（lib/theme.ts）

`ReplayTheme` 提供一套完整深色配色，`useTheme()` 从 `replay.meta.theme` 读取，未设置回退 `midnight-gold`：

```typescript
interface ReplayTheme {
  id; label; bg; glowTop; glowBottom; frame   // 页面背景/光晕/外框
  accent; accentSoft                            // 主/浅强调色（标题、分隔线、装饰）
  night: PhasePalette; day: PhasePalette        // 昼夜阶段配色
  card: CardPalette                             // 说书人手记卡片配色
}
```

5 套内置主题：`midnight-gold 暗夜金`（默认）、`abyss-blue 深海蓝`、`jade-night 翡翠夜`、`crimson-hall 绯红殿`、`amethyst 紫晶`。

**可读性设计原则**：夜晚阶段保持深色底 + 浅色文字，白昼阶段保持浅色底 + 深色文字，从而在任意主题下都保证文字对比度；强调色、分隔线、图标、卡片均随主题切换。`teamTextColor()` 提供比 `teamColor()` 更亮的文字色，用于深色底上的角色名/token 文字。

---

## 6. 魔典轮盘（RadialWheel）与 token

- 玩家按 `playerPosition`（自 12 点顺时针）环形排列，1~20 人自适应节点尺寸。
- SVG 层绘制：中心暖光、外环齿轮、刻度环、辐射光丝（阵营色）。
- HTML 层绘制：圆形角色肖像（`CharacterIcon`）+ 座位号徽章 + 圆内角色名 + 玩家昵称（单行）+ 死亡/亡魂票标记。
- **Token 挂载**：`activeTokens` 沿辐射线置于玩家内圈；图片 token 用角色图标 + label，自定义 token 用「深色径向底 + 浅色 `#f2f5f9` 文字 + 2px 彩色边框 + 辉光 + text-shadow」，保证文字溢出边框后在深色背景上仍清晰可见。边框色 `col = token.color ?? teamColor(team)`（自定义 token 默认金色 `#D4AF37`）。
- 编辑模式下悬停出现「+ 添加 token」，弹出 `TokenAdder`：选择在场角色并挂载其 reminders，或自定义 token。

> 注意：历史版本曾在座位号上方渲染「自定义标签(customTags)」模块，现已被移除（仅删显示层，`customTags` 数据字段仍保留在类型与 JSON 中以兼容旧数据）。

---

## 7. 昼夜复盘流（timeline）

- `PhaseTimeline` 渲染所有 `PhaseSection`。
- `PhaseSection` 按 `phase.phaseType` 选择 `theme.night` / `theme.day` 配色，标题下方副标题仅显示 `Night · 夜晚 / Day · 白昼`（不含「第 N 阶段」）。
- `LogRow` 单行流式布局：类型徽章 + 座位徽章 + 投票 + 正文（含 `[n]`/`（角色名）` 提及富文本）+ 右侧词条标签。
- 日志类型：`info 信息 / player_speech 发言 / nomination 提名 / execution 处决 / attack 攻击 / death 死亡 / st_action 说书人 / comment 复盘 / custom 自定义`。

---

## 8. 导出与识图

- **PNG 导出**（`exportUtils.exportLongImage`）：等待字体/图片就绪 → `toPng(node, { pixelRatio })`。工具栏可选 1x/2x/3x 精度。导出前 `setExporting(true)` 隐藏编辑控件。
- **跨域图片代理**：`vite.config.ts` 内自定义 `imageProxy` 插件，把远程图标转发为 `/__img?src=…` 并附加 CORS 头，避免 `html-to-image` 因跨域污染 canvas。`proxiedImage()`/`proxiedSpecial()` 统一处理。
- **`?export=1` 只读模式**：`App.tsx` 检测 query 后仅渲染 `<LongImage>`，供无头浏览器/浏览器截图备用。
- **JSON 导出/导入**：`downloadJSON` / `importJSON`。
- **识图载入**（`recognize.ts` + `EditorPanel.RecognizeModule`）：调用任意 OpenAI 兼容 vision 接口（`chat/completions`），让模型按 `BotCReplayRecord` 结构输出 JSON，`extractJSON` 剥离 Markdown 代码块后 `importJSON` 载入。配置（baseUrl/apiKey/model）持久化在 `localStorage`。

---

## 9. 近期改动要点（供快速回归参考）

1. **示例数据替换**：默认剧本 `src/assets/script-default.json` 现为「暗藏玄机 v2.1」（25 角色，含 `_meta.logo`）；示例复盘 `src/assets/replay-default.json` 现为真实对局「暗藏玄机」（12 玩家 / 11 阶段，含 token 挂载、词条、`theme: crimson-hall`）。`sampleData.ts` 改为直接引用该 JSON。
2. **阶段名简化**：删除阶段名下方「Day · 白昼 ｜ 第 1 阶段」中的「第 X 阶段」部分。
3. **日志排序**：左侧「阶段日志」内日志支持 HTML5 拖拽排序（`moveLog`）。
4. **token 文字可见性**：自定义/图片 token 改为深色底 + 浅色文字 + text-shadow，解决「文字过长溢出边框在背景下看不清」的问题。
5. **多配色主题**：新增 `lib/theme.ts` 5 套主题，覆盖页面背景、阶段（昼夜）、主题强调、说书人手记；工具栏与左侧「基本信息」均可切换。
6. **玩家名单行显示**：昵称模块 `whitespace-nowrap`。
7. **删除座位号上方杂项**：移除 customTags 显示层（token 挂载功能保留）。
8. **说书人手记横向排列**：`grid grid-cols-2 gap-4`，2 个模块一行。
9. **logo 自动读取**：剧本 `_meta.logo` 存在则默认采用并自动居中；无则用文字标题；可手动切换。
10. **删除左侧「填写座位」区块**：座位号改为在「玩家」标签内维护，UI 排布已相应调整。

---

## 10. 开发注意事项

- 修改主题配色集中在 `lib/theme.ts`；新增主题只需在 `REPLAY_THEMES` 加一项（`id/label` 会同步出现在下拉）。
- 修改数据标准时需同步：`types.ts`（类型）、`recognize.ts` 的 `SYSTEM_PROMPT`（识图输出结构）、`sampleData.ts` 引用、以及 `reference/` 下的示例 JSON。
- 阵营/角色颜色统一经 `lib/script.ts` 的 `teamColor` / `teamTextColor` / `isEvil` / `displayName`，避免组件内硬编码。
- 所有可编辑原语均接受 `className`/`style`，可在长图内直接内联样式（配合主题变量使用）。
- 提交前请跑 `npx tsc --noEmit` 与 `npm run build`。
