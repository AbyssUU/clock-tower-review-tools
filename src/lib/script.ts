import type { ScriptCharacter } from '../types'

// 从剧本 JSON 数组解析角色（跳过 _meta 等非角色项）
export function parseScriptArray(raw: unknown[]): { characters: ScriptCharacter[]; metaName?: string; metaAuthor?: string; metaLogo?: string } {
  const characters: ScriptCharacter[] = []
  let metaName: string | undefined
  let metaAuthor: string | undefined
  let metaLogo: string | undefined
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const c = item as Record<string, unknown>
    if (c.id === '_meta') {
      if (typeof c.name === 'string') metaName = c.name
      if (typeof c.author === 'string') metaAuthor = c.author
      if (typeof c.logo === 'string' && c.logo.trim()) metaLogo = c.logo.trim()
      continue
    }
    if (typeof c.id === 'string' && typeof c.name === 'string') {
      characters.push({
        id: c.id,
        name: c.name,
        team: (c.team as ScriptCharacter['team']) ?? 'townsfolk',
        ability: typeof c.ability === 'string' ? c.ability : undefined,
        image: typeof c.image === 'string' ? c.image : undefined,
        reminders: Array.isArray(c.reminders) ? (c.reminders as string[]) : [],
        remindersGlobal: Array.isArray(c.remindersGlobal) ? (c.remindersGlobal as string[]) : [],
      })
    }
  }
  return { characters, metaName, metaAuthor, metaLogo }
}

// 将剧本角色数组转为 name -> 角色 的查找表
export function buildCharacterMap(script: ScriptCharacter[]): Map<string, ScriptCharacter> {
  const map = new Map<string, ScriptCharacter>()
  for (const c of script) {
    if (c?.name) map.set(c.name, c)
  }
  return map
}

export type Team = 'townsfolk' | 'outsider' | 'minion' | 'demon' | 'unknown'

export function teamOf(map: Map<string, ScriptCharacter> | undefined, name?: string): Team {
  if (!name) return 'unknown'
  const hit = map?.get(name)
  return hit?.team ?? 'unknown'
}

export function teamColor(team: Team): string {
  switch (team) {
    case 'demon':
      return '#C0392B'
    case 'minion':
      return '#B23A48'
    case 'townsfolk':
      return '#4F86C6'
    case 'outsider':
      return '#6FA86C'
    default:
      return '#8A93A6'
  }
}

export function isEvil(team: Team): boolean {
  return team === 'demon' || team === 'minion'
}

// 深色底上的文字颜色（比 teamColor 更亮，保证 token 内部文字可见）
export function teamTextColor(team: Team): string {
  switch (team) {
    case 'demon':
      return '#F08A7D'
    case 'minion':
      return '#E8A0AA'
    case 'townsfolk':
      return '#9CC3F0'
    case 'outsider':
      return '#A9D6A1'
    default:
      return '#C7CDD8'
  }
}

// 统一改名：将原角色名映射为显示名（未配置别名时原样返回）
export function displayName(name?: string, aliases?: Record<string, string>): string {
  if (!name) return ''
  return aliases?.[name] ?? name
}

export function proxiedImage(url?: string): string | undefined {
  if (!url) return undefined
  if (url.startsWith('data:') || url.startsWith('/') || url.startsWith('blob:')) return url

  try {
    if (import.meta.env.DEV) {
      // 本地开发/预览走 vite 插件代理
      return `/__img?src=${encodeURIComponent(url)}`
    }
  } catch (e) {
    // 某些环境下 import.meta 访问异常，继续到生产分支
  }

  // 生产环境（静态托管）使用公共图片代理以避免 /__img 404 或无 CORS 问题
  const trimmed = url.replace(/^https?:\/\//i, '')
  return `https://images.weserv.nl/?url=${encodeURIComponent(trimmed)}`
}

// 角色图标（优先剧本 image，回退到常见 icon 路径）
export function characterImage(map: Map<string, ScriptCharacter> | undefined, name?: string): string | undefined {
  if (!name) return undefined
  return proxiedImage(map?.get(name)?.image)
}

// 角色的 Reminder Tokens 词汇（用于编辑器提示与魔典挂载）
export function characterReminders(map: Map<string, ScriptCharacter> | undefined, name?: string): string[] {
  if (!name) return []
  const c = map?.get(name)
  return c ? [...c.reminders, ...c.remindersGlobal] : []
}
