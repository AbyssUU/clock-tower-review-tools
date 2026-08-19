# Role: Blood on the Clocktower Master Replay & Grimoire Architect
你是一名精通现代前端开发（React 18+, Next.js App Router, Tailwind CSS, Framer Motion, HTML Canvas/SVG, Lucide Icons）与暗黑哥特/奇幻 UI 设计的全栈工程师。
你将开发一款**极致美观、沉浸式、支持自定义编辑与轻量级数据导出的《血染钟楼》复盘与魔典工具**（参考 Merlin-BotC 视觉质感与 Avalon 魔典径向蛛网布局）。

Merlin-BotC https://www.merlin-botc.com/

Avalon2魔典 https://avalon2.top/botc/0721 

---

## 1. 核心视觉与美术设计规范 (Visual System)

- **场景与氛围（参考 Avalon/Merlin）：**
  - **背景：** 暗夜古堡殿堂（深石灰 `#0D1117` 到 `#161B22` 渐变，带暗金黄铜边框与火把/烛火微光）。
  - **中央核心区：** 动态黄铜齿轮法阵，展示剧本基础徽标与存活人数看板（`善良存活 : 邪恶存活`）。
- **魔典环形辐射布局 (Radial Spoke Layout)：**
  - 玩家 Token 沿环形排列（1~20人自适应），从玩家节点向圆心/外圈延伸出细光丝辐射线。
  - 辐射线上挂载该玩家当前的各类 **Reminder Tokens（剧本提示标记/自定义状态气泡/处决标记/私聊房号）**。
- **专属板块视觉强化：**
  - **恶魔伪装展示架 (Demon Bluffs Rack)：** 在魔典上方或侧边以优雅羊皮纸底框展示【3个不在场善良伪装角色】及【首夜邪恶互认信息】。
  - **昼夜色调：** 夜晚为冷月深紫蓝，白天为日光羊皮纸暖金。

---

## 2. 精简版复盘 JSON 数据标准定义 (Lean Replay JSON Specification)

> **注意：** 导出与存储的 JSON **不包含**庞大的剧本角色能力详情库，仅收录剧本基础信息、恶魔伪装、初始配置、自定义词条及各昼夜复盘流。

```typescript
// 1. 轻量剧本基础元数据
export interface ScriptMeta {
  scriptName: string; // 剧本名称，如 "暗藏玄机v2.1"
  scriptId?: string;
  author?: string;
  logo?: string;
  version?: string;
}

// 2. 恶魔伪装与邪恶初始信息
export interface EvilSetupInfo {
  demonBluffs: string[]; // 恶魔的3个不在场伪装角色，如 ["渔夫", "侍女", "茶艺师"]
  lunaticBluffs?: string[]; // 狂人看到的伪装/不在场角色（若有）
  evilKnowledgeNotes?: string; // 首夜邪恶互认额外说明（如提线木偶被告知的伪装、爪牙得知信息等）
  customBluffs?: { label: string; characterName: string }[]; // 其他自定义伪装
}

// 3. Token 定义（剧本原生 + 自由自定义）
export interface BoardToken {
  id: string;
  label: string; // 如 "熟客", "醉酒", "不共戴天", "12-0", "私聊房4"
  type: 'reminder' | 'global' | 'status' | 'custom';
  color?: string; // 气泡颜色 HEX
  icon?: string;
}

// 4. 玩家与魔典座位配置
export interface ReplayPlayer {
  seatNumber: number; // 座位号 1~N
  name: string; // 玩家昵称
  realCharacter: string; // 真实角色（如 "牙嘎巴卜" 或 "yaggababble"）
  fakeCharacter?: string; // 伪装角色（如 提线木偶以为自己是 "博学者"）
  isAlive: boolean;
  hasGhostVote: boolean;
  activeTokens: BoardToken[]; // 当前挂载在该玩家辐射线上的 Token
  customTags?: string[]; // 自定义标签（如 ["跳侍女", "死保2号"]）
}

// 5. 单条复盘日志
export interface LogEntry {
  id: string;
  type: 'st_action' | 'info' | 'player_speech' | 'execution' | 'death' | 'comment' | 'custom';
  sourceSeat?: number; // 发起玩家座位
  targetSeats?: number[]; // 目标玩家座位
  characterName?: string; // 相关角色名
  content: string; // 具体日志内容
  isLie?: boolean; // 是否是虚假/中毒/醉酒信息
  customTag?: string; // 自定义词条（如 "对跳", "自爆"）
  tokensAdded?: { seat: number; token: BoardToken }[];
  tokensRemoved?: { seat: number; tokenId: string }[];
}

// 6. 阶段定义
export interface GamePhase {
  id: string;
  phaseType: 'night' | 'day';
  phaseNumber: number; // 第 1 夜 / 第 1 天 ...
  title: string;
  logs: LogEntry[];
  boardSnapshot?: {
    livingPlayerSeats: number[];
    tokensMap: Record<number, BoardToken[]>; // 座位号 -> 当期 Token 列表
  };
}

// 7. 完整复盘档案根对象（导出的 JSON 结构）
export interface BotCReplayRecord {
  meta: {
    title: string; // 复盘标题，如 "暗藏玄机12人局-鸽子翻盘"
    storyteller: string; // 说书人
    date: string;
    winner: 'good' | 'evil' | 'draw';
    winningReason?: string; // 胜负判定总结
    mvp?: string;
  };
  scriptMeta: ScriptMeta; // 仅保留剧本基础元数据
  evilSetup: EvilSetupInfo; // 恶魔伪装与邪恶初始信息
  customGlossary: { tag: string; color: string; description?: string }[]; // 自定义高亮词条字典
  customSections?: { title: string; content: string }[]; // 自定义复盘模块（如说书人开局构想、逻辑线复盘等）
  initialPlayers: ReplayPlayer[]; // 初始玩家及魔典座位排布
  phases: GamePhase[]; // 全流程昼夜复盘流
}