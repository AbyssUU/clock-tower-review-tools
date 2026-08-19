// ============ 精简版复盘 JSON 数据标准定义 ============
// 导出与存储的 JSON 不包含庞大的剧本角色能力详情库

// 1. 轻量剧本基础元数据
export interface ScriptMeta {
  scriptName: string
  scriptId?: string
  author?: string
  logo?: string
  version?: string
}

// 2. 恶魔伪装与邪恶初始信息
export interface EvilSetupInfo {
  demonBluffs: string[] // 恶魔的 3 个不在场伪装角色
  lunaticBluffs?: string[] // 狂人看到的伪装/不在场角色
  evilKnowledgeNotes?: string // 首夜邪恶互认额外说明
  customBluffs?: { label: string; characterName: string }[] // 其他自定义伪装
}

// 3. Token 定义
export interface BoardToken {
  id: string
  label: string
  type: 'reminder' | 'global' | 'status' | 'custom'
  color?: string
  icon?: string // 可选自定义图标 URL
  characterName?: string // 关联角色名（token 图标 = 该角色图像）
}

// 4. 玩家与魔典座位配置
export interface ReplayPlayer {
  seatNumber: number
  name: string
  realCharacter: string
  fakeCharacter?: string
  isAlive: boolean
  hasGhostVote: boolean
  activeTokens: BoardToken[]
  customTags?: string[]
}

// 5. 单条复盘日志
export interface LogEntry {
  id: string
  type?: 'st_action' | 'info' | 'player_speech' | 'nomination' | 'execution' | 'attack' | 'death' | 'comment' | 'custom' // 可选；undefined = 无（不显示左侧类型）
  sourceSeat?: number
  targetSeats?: number[]
  characterName?: string
  content: string
  isLie?: boolean
  customTag?: string
  typeLabel?: string // type === 'custom' 时的自定义标签文字
  votes?: string // 投票信息，如 "7 : 3"
  tokensAdded?: { seat: number; token: BoardToken }[]
  tokensRemoved?: { seat: number; tokenId: string }[]
}

// 6. 阶段定义
export interface GamePhase {
  id: string
  phaseType: 'night' | 'day'
  phaseNumber: number
  title: string
  logs: LogEntry[]
  boardSnapshot?: {
    livingPlayerSeats: number[]
    tokensMap: Record<number, BoardToken[]>
  }
}

// 7. 传奇角色 / 奇遇角色（Fabled / Travelers，源自 townsquare）
export interface SpecialRoleEntry {
  id: string
  category: 'fabled' | 'traveler'
  name: string // 显示名（中文）
  nameEn?: string // 英文名，用于匹配 townsquare 图标
  image?: string // 可选自定义图标（覆盖目录默认图）
  note?: string // 备注 / 规则说明
}

// 7.5 字体设置（中文字体 + 英文/数字字体，可单独调整）
export interface FontSettings {
  cn?: string // 中文字体 family，默认宋体
  latin?: string // 英文/数字字体 family，默认 Times New Roman
}

// 7.6 魔典下方模块显隐（恶魔伪装 / 传奇角色 / 奇遇角色）
export interface ModuleVisibility {
  bluffs?: boolean // 恶魔伪装（默认显示）
  fabled?: boolean // 传奇角色（默认显示）
  traveler?: boolean // 奇遇角色（默认不显示，可添加）
}

// 8. 完整复盘档案根对象
export interface BotCReplayRecord {
  meta: {
    title: string
    storyteller: string
    date: string
    winner: 'good' | 'evil' | 'storyteller' | 'custom'
    winnerCustom?: string // winner === 'custom' 时的自定义胜负文案
    winningReason?: string
    mvp?: string
    titleMode?: 'logo' | 'text' // 标题渲染方式：logo 或文字
    imageWidth?: number // 长图宽度（px），默认 1080
    theme?: string // 长图配色主题 id（见 src/lib/theme.ts），默认 midnight-gold
  }
  scriptMeta: ScriptMeta
  evilSetup: EvilSetupInfo
  customGlossary: { tag: string; color: string; description?: string }[]
  customSections?: { title: string; content: string }[]
  specialRoles?: SpecialRoleEntry[] // 传奇角色 + 奇遇角色
  characterAliases?: Record<string, string> // 原角色名 -> 显示名（统一改名）
  fontSettings?: FontSettings // 字体设置
  modules?: ModuleVisibility // 魔典下方模块显隐
  initialPlayers: ReplayPlayer[]
  phases: GamePhase[]
}

// ============ 剧本角色（来自剧本 JSON） ============
export interface ScriptCharacter {
  id: string
  name: string
  team: 'townsfolk' | 'outsider' | 'minion' | 'demon'
  ability?: string
  image?: string
  reminders: string[]
  remindersGlobal: string[]
}

// ============ 角色与阵营辅助 ============
// 仅用于编辑器下拉与颜色归类，不进入导出 JSON
export const CHARACTER_CATALOG: { name: string; team: 'townsfolk' | 'outsider' | 'minion' | 'demon' }[] = [
  { name: '洗衣妇', team: 'townsfolk' },
  { name: '图书管理员', team: 'townsfolk' },
  { name: '调查员', team: 'townsfolk' },
  { name: '厨师', team: 'townsfolk' },
  { name: '共情者', team: 'townsfolk' },
  { name: '占卜师', team: 'townsfolk' },
  { name: '送葬者', team: 'townsfolk' },
  { name: '僧侣', team: 'townsfolk' },
  { name: '守鸦人', team: 'townsfolk' },
  { name: '处女', team: 'townsfolk' },
  { name: '杀手', team: 'townsfolk' },
  { name: '士兵', team: 'townsfolk' },
  { name: '市长', team: 'townsfolk' },
  { name: '小恶魔', team: 'demon' },
  { name: '女巫', team: 'demon' },
  { name: '间谍', team: 'minion' },
  { name: '投毒者', team: 'minion' },
  { name: '男爵', team: 'minion' },
  { name: '猩红女士', team: 'minion' },
  { name: '酒鬼', team: 'outsider' },
  { name: '圣徒', team: 'outsider' },
  { name: '管家', team: 'outsider' },
  { name: '隐士', team: 'outsider' },
]

export function characterTeam(name?: string): 'townsfolk' | 'outsider' | 'minion' | 'demon' | 'unknown' {
  if (!name) return 'unknown'
  const hit = CHARACTER_CATALOG.find((c) => c.name === name)
  return hit?.team ?? 'unknown'
}

export function teamColor(team: string): string {
  switch (team) {
    case 'demon':
    case 'minion':
      return '#B23A48'
    case 'townsfolk':
      return '#4F86C6'
    case 'outsider':
      return '#7A9E5B'
    default:
      return '#8A93A6'
  }
}
