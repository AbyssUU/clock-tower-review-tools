# 魔典复盘生成器 · Blood on the Clocktower Grimoire Replay

一款暗黑哥特 / 奇幻风格的《血染钟楼》复盘与魔典工具：将一局对局的数据渲染成一张高清长图，支持所见即所得编辑、轻量 JSON 导入导出、剧本 JSON 加载，以及多模态识图自动生成复盘数据。

参考视觉：Merlin-BotC（<https://www.merlin-botc.com/>）与 Avalon 魔典径向蛛网布局。

---

## 快速开始

```bash
npm install
npm run dev        # 开发预览  http://localhost:5173
npm run build      # 生产构建（输出到 dist/）
npm run preview    # 预览生产构建
```

打开后默认载入示例对局「暗藏玄机」（12 人局）：左侧编辑栏分栏维护数据，右侧实时预览长图，点击「导出长图 PNG」即可下载。

---

## 功能

### 魔典轮盘（复盘魔典）
- **径向蛛网布局**：玩家沿环形排列（1~20 人自适应），从玩家节点向外延伸辐射光丝。
- **角色肖像 token**：图片加载失败自动回退为「阵营色 + 首字」。
- **Token 挂载**：辐射线上挂载 Reminder Tokens / 自定义 token，深色底 + 浅色文字保证任意背景下文字清晰可见。
- **中央黄铜齿轮法阵**：剧本徽标氛围装饰。
- **下方模块**：恶魔伪装展示架、传奇角色（Fabled）、奇遇角色（Traveler），可单独显隐。

### 昼夜复盘流
- 逐阶段展示说书人动作 / 信息 / 发言 / 提名 / 处决 / 攻击 / 死亡 / 复盘日志。
- 夜晚冷月深紫蓝、白天日光羊皮纸暖金，配色随主题切换。
- 支持自定义高亮词条（`customGlossary`）与日志拖拽排序。

### 编辑能力
- **就地编辑**：预览长图内每个元素均可点击直接修改（标题、说书人、玩家、角色、日志、词条等）。
- **左侧分栏**：剧本 / 基本信息 / 玩家 / 阶段日志 / 扩展 / 导入导出。
- **统一改名**：角色显示名全局生效，图标仍按原角色名匹配。
- **提及语法**：日志正文支持 `[座位号]` 与 `（角色名）`，自动渲染为座位徽章 + 玩家名 + 角色图标。

### 数据导入导出
- **导出长图 PNG**：1x / 2x / 3x 精度，基于 `html-to-image` 渲染。
- **导出 / 导入精简版复盘 JSON**（符合 `src/types.ts` 数据标准）。
- **剧本 JSON 加载**：自动读取 `_meta` 的 `name/author/logo` 字段；有 `logo` 则默认作为居中标题，无则使用文字标题，可手动切换。
- **识图载入**：上传复盘截图或粘贴图片链接，经 OpenAI 兼容 vision 接口自动生成复盘 JSON（需自行配置 baseUrl / apiKey / model）。

### 长图配色主题
内置 5 套主题（暗夜金 / 深海蓝 / 翡翠夜 / 绯红殿 / 紫晶），覆盖页面背景、昼夜阶段、主题强调、说书人手记等配色；工具栏或「基本信息」中可切换。全部采用「深色底 + 浅色文字」保证可读性。

---

## 数据标准

导出的复盘 JSON 为「精简版」——**不包含**庞大的剧本角色能力详情库，仅保留对局所需信息。完整类型定义见 [`src/types.ts`](src/types.ts)，核心根对象 `BotCReplayRecord`：

| 字段 | 说明 |
| --- | --- |
| `meta` | 标题 / 说书人 / 日期 / 胜负 / MVP / 主题 / 长图宽度 / 标题渲染方式 |
| `scriptMeta` | 剧本基础元数据（名称 / 作者 / 版本 / logo） |
| `evilSetup` | 恶魔伪装与首夜邪恶互认信息 |
| `customGlossary` | 自定义高亮词条字典（tag + color + description） |
| `customSections` | 说书人复盘手记（横向 2 列展示） |
| `specialRoles` | 传奇 / 奇遇角色 |
| `characterAliases` | 原角色名 → 显示名（全局改名） |
| `fontSettings` | 中文字体 / 英文字体 |
| `modules` | 魔典下方模块显隐（bluffs / fabled / traveler） |
| `initialPlayers` | 玩家座位、真实/伪装角色、存活状态、token、customTags |
| `phases` | 昼夜阶段与日志流 |

**提及语法约定**：日志 `content` 中的 `[数字]` 表示座位号提及，`（角色名）` 表示角色提及，渲染时自动转换为富文本。

**示例文件**：

- 复盘示例：`reference/复盘数据 (1).json`（运行时复制自 `src/assets/replay-default.json`）
- 剧本示例：`reference/暗藏玄机v2.1.json`（运行时复制自 `src/assets/script-default.json`）

两者与 `src/assets/` 下默认数据保持一致，修改示例请同步更新。

---

## 使用方法

1. **新建 / 编辑**：左侧「基本信息」填标题、说书人、胜负；「玩家」维护座位与角色；「阶段日志」录入各昼夜日志。
2. **加载剧本**：左侧「剧本」上传剧本 JSON（格式见 `reference/暗藏玄机v2.1.json`），自动带入角色图标、阵营配色与 Reminder Tokens。
3. **挂载 token**：预览轮盘中悬停玩家 → 点「+」添加其 reminders 或自定义 token。
4. **调整外观**：工具栏切换配色主题、长图宽度、导出精度；「扩展」调整字体、传奇/奇遇角色、统一改名、说书人手记。
5. **导出**：
   - 「导出长图 PNG」下载高清长图。
   - 「JSON」导出 / 导入精简复盘数据。
6. **识图载入**：左侧「导入导出」→「识图载入」上传截图或填链接，识别后自动载入。

### 导出长图（备用方案）

若浏览器内 `html-to-image` 导出异常，可访问：

```
http://localhost:5173/?export=1
```

该地址仅渲染长图本体，随后用浏览器自带截图（如 Chrome DevTools「Capture full size screenshot」）即可。

---

## 开发参考

### 技术栈

React 18 · TypeScript（strict）· Vite · Tailwind CSS · Framer Motion · lucide-react · zustand · html-to-image

### 目录结构

```
src/
├── App.tsx                  # 应用壳（工具栏 + 编辑栏 + 预览）
├── store.ts                 # zustand 全局状态
├── sampleData.ts            # 示例数据（引用 assets/replay-default.json）
├── types.ts                 # 类型 + 内置角色目录
├── assets/                  # 默认剧本 / 示例复盘 JSON
├── lib/
│   ├── script.ts            # 剧本解析 + 阵营色 + 别名 + 图片代理
│   ├── theme.ts             # 5 套配色主题
│   ├── geometry.ts          # 径向布局几何
│   ├── special.ts           # 传奇/奇遇角色目录
│   ├── exportUtils.ts       # PNG/JSON 导出
│   └── recognize.ts         # 识图（vision 接口）
└── components/
    ├── editable/            # 就地可编辑原语
    ├── editor/              # 左侧编辑面板
    ├── export/              # 长图（Header/分隔线/角饰/LongImage）
    ├── board/               # 轮盘 + 模块 + 角色图标
    └── timeline/            # 昼夜复盘流
```

### 关键约定

- **状态**：单一 zustand store，`replay` 为根数据；编辑态由 `EditModeContext` + `useEditable()` 控制（导出/只读时为 false）。
- **配色**：阵营/角色颜色统一走 `lib/script.ts` 的 `teamColor` / `teamTextColor` / `isEvil` / `displayName`；新增主题在 `lib/theme.ts` 的 `REPLAY_THEMES` 增加一项即可。
- **跨域图片**：远程图标经 `vite.config.ts` 的自定义 `imageProxy` 插件转 `/__img?src=…`，保证 `html-to-image` 可内联导出。
- **数据标准改动**：需同步更新 `types.ts`、`recognize.ts` 的 `SYSTEM_PROMPT`、`sampleData.ts` 及 `reference/` 示例。

更完整的架构说明与近期改动记录见 [`CLAUDE.md`](CLAUDE.md)。

### 提交前检查

```bash
npx tsc --noEmit   # 类型检查
npm run build      # 生产构建
```
