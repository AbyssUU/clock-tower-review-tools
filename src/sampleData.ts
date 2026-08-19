import type { BotCReplayRecord } from './types'
import replayDefault from './assets/replay-default.json'

// ============ 示例复盘：暗藏玄机 12 人局 ============
// 数据源：reference/复盘数据 (1).json（真实对局导出，含 token 挂载、词条、主题配色等完整字段）
// 参考剧本：reference/暗藏玄机v2.1.json（src/assets/script-default.json）
export const SAMPLE_REPLAY = replayDefault as unknown as BotCReplayRecord
