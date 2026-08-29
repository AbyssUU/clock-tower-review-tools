import { createContext, useContext } from 'react'
import { useReplayStore } from '../store'
import type { SectionKey, ReorderableSection } from '../types'

// ============ 长图配色主题 ============
// 每个主题提供一套完整的深色配色：页面背景、主强调色、昼夜阶段、卡片（说书人手记）等。
// 全部采用「深色底 + 浅色文字」，保证文字在 token 与背景上均清晰可见，各功能正常。

export interface PhasePalette {
  bg: string // 阶段卡片背景（CSS background 值）
  border: string // 卡片边框
  title: string // 阶段标题文字
  text: string // 正文文字
  muted: string // 副标题 / 次要文字
  icon: string // 昼夜图标颜色
  glow: string // 卡片内氛围光晕
}

export interface CardPalette {
  bg: string
  border: string
  title: string
  text: string
}

export interface ReplayTheme {
  id: string
  label: string
  bg: string // 页面背景
  glowTop: string // 顶部氛围光晕
  glowBottom: string // 底部氛围光晕
  frame: string // 外框描边
  accent: string // 主强调色（标题 / 分隔线 / 装饰）
  accentSoft: string // 浅强调色（深色底上的标题文字，如暗色 Header）
  heading?: string // 长图区块标题文字色（在页面背景上可读，浅色主题需为深色；缺省回退 accentSoft）
  vignette?: string // 页面边缘暗角；浅色主题用更淡的暗角（缺省使用深色默认值）
  night: PhasePalette
  day: PhasePalette
  card: CardPalette // 说书人手记等卡片
}

export const REPLAY_THEMES: ReplayTheme[] = [
  {
    id: 'midnight-gold',
    label: '暗夜金',
    bg: 'linear-gradient(180deg, #0b0f16 0%, #10141c 25%, #0e1219 50%, #0b0f16 100%)',
    glowTop: 'rgba(201,162,39,0.08)',
    glowBottom: 'rgba(74,91,147,0.10)',
    frame: 'rgba(201,162,39,0.20)',
    accent: '#C9A227',
    accentSoft: '#EBD28A',
    night: {
      bg: 'linear-gradient(165deg, #131b2b 0%, #1b2740 55%, #0e1420 100%)',
      border: 'rgba(74,91,147,0.35)',
      title: '#dbe4f5',
      text: '#c3cde0',
      muted: '#6b7cb4',
      icon: '#aebde8',
      glow: 'radial-gradient(circle at 85% 15%, rgba(107,124,180,0.18), transparent 45%), radial-gradient(circle at 15% 85%, rgba(74,91,147,0.15), transparent 50%)',
    },
    day: {
      bg: 'linear-gradient(165deg, #f6ecd4 0%, #efe0bf 55%, #e6d2a8 100%)',
      border: 'rgba(185,141,74,0.35)',
      title: '#3a2a0e',
      text: '#3a2f1c',
      muted: '#a0782c',
      icon: '#8a6110',
      glow: 'radial-gradient(circle at 85% 15%, rgba(255,255,255,0.55), transparent 45%), radial-gradient(circle at 15% 85%, rgba(185,141,74,0.18), transparent 50%)',
    },
    card: { bg: 'rgba(13,17,23,0.6)', border: 'rgba(201,162,39,0.25)', title: '#EBD28A', text: '#c3cde0' },
  },
  {
    id: 'abyss-blue',
    label: '深海蓝',
    bg: 'linear-gradient(180deg, #071522 0%, #0c1d30 25%, #0a1826 50%, #07131e 100%)',
    glowTop: 'rgba(96,165,250,0.10)',
    glowBottom: 'rgba(56,130,200,0.10)',
    frame: 'rgba(120,180,240,0.22)',
    accent: '#7FB3E8',
    accentSoft: '#C7DDF5',
    night: {
      bg: 'linear-gradient(165deg, #0e1b2e 0%, #16283f 55%, #0a1420 100%)',
      border: 'rgba(96,150,210,0.35)',
      title: '#dbeaf7',
      text: '#c3d4e6',
      muted: '#7fa8d0',
      icon: '#aac9ec',
      glow: 'radial-gradient(circle at 85% 15%, rgba(110,170,230,0.18), transparent 45%), radial-gradient(circle at 15% 85%, rgba(70,130,190,0.15), transparent 50%)',
    },
    day: {
      bg: 'linear-gradient(165deg, #eef4fa 0%, #e2ecf5 55%, #d4e2ee 100%)',
      border: 'rgba(120,160,200,0.35)',
      title: '#2a3a4e',
      text: '#31435a',
      muted: '#6b87a6',
      icon: '#5c7ea0',
      glow: 'radial-gradient(circle at 85% 15%, rgba(255,255,255,0.6), transparent 45%), radial-gradient(circle at 15% 85%, rgba(120,160,200,0.16), transparent 50%)',
    },
    card: { bg: 'rgba(9,20,32,0.6)', border: 'rgba(127,179,232,0.25)', title: '#C7DDF5', text: '#c3d4e6' },
  },
  {
    id: 'jade-night',
    label: '翡翠夜',
    bg: 'linear-gradient(180deg, #08150f 0%, #0d2017 25%, #0a1a12 50%, #07120c 100%)',
    glowTop: 'rgba(110,200,150,0.10)',
    glowBottom: 'rgba(60,150,110,0.10)',
    frame: 'rgba(120,210,160,0.22)',
    accent: '#7CC79A',
    accentSoft: '#C4EAD2',
    night: {
      bg: 'linear-gradient(165deg, #0e2018 0%, #173026 55%, #0a1712 100%)',
      border: 'rgba(100,180,140,0.35)',
      title: '#dff5ea',
      text: '#c5dccf',
      muted: '#7fb99a',
      icon: '#a5d8bc',
      glow: 'radial-gradient(circle at 85% 15%, rgba(120,200,160,0.18), transparent 45%), radial-gradient(circle at 15% 85%, rgba(80,160,120,0.15), transparent 50%)',
    },
    day: {
      bg: 'linear-gradient(165deg, #eff6f1 0%, #e3efe7 55%, #d4e6db 100%)',
      border: 'rgba(110,180,145,0.35)',
      title: '#2a3a30',
      text: '#31453a',
      muted: '#6b947a',
      icon: '#5c806a',
      glow: 'radial-gradient(circle at 85% 15%, rgba(255,255,255,0.6), transparent 45%), radial-gradient(circle at 15% 85%, rgba(110,180,145,0.16), transparent 50%)',
    },
    card: { bg: 'rgba(8,22,16,0.6)', border: 'rgba(124,199,154,0.25)', title: '#C4EAD2', text: '#c5dccf' },
  },
  {
    id: 'crimson-hall',
    label: '绯红殿',
    bg: 'linear-gradient(180deg, #190c10 0%, #221116 25%, #1b0d12 50%, #140a0d 100%)',
    glowTop: 'rgba(230,110,90,0.10)',
    glowBottom: 'rgba(170,60,70,0.10)',
    frame: 'rgba(230,130,110,0.22)',
    accent: '#E0867A',
    accentSoft: '#F2C4BC',
    night: {
      bg: 'linear-gradient(165deg, #2b1418 0%, #401d24 55%, #200f13 100%)',
      border: 'rgba(210,110,100,0.35)',
      title: '#f7e4e1',
      text: '#e6cbc8',
      muted: '#d08a84',
      icon: '#e6ada7',
      glow: 'radial-gradient(circle at 85% 15%, rgba(220,120,105,0.18), transparent 45%), radial-gradient(circle at 15% 85%, rgba(170,70,65,0.15), transparent 50%)',
    },
    day: {
      bg: 'linear-gradient(165deg, #f8eee9 0%, #f1e1da 55%, #e8d2c8 100%)',
      border: 'rgba(200,130,110,0.35)',
      title: '#3e2a24',
      text: '#46302a',
      muted: '#a06b5a',
      icon: '#8a5c4e',
      glow: 'radial-gradient(circle at 85% 15%, rgba(255,255,255,0.6), transparent 45%), radial-gradient(circle at 15% 85%, rgba(200,130,110,0.16), transparent 50%)',
    },
    card: { bg: 'rgba(26,13,16,0.6)', border: 'rgba(224,134,122,0.25)', title: '#F2C4BC', text: '#e6cbc8' },
  },
  {
    id: 'amethyst',
    label: '紫晶',
    bg: 'linear-gradient(180deg, #120c1d 0%, #1a1229 25%, #140e20 50%, #0e0a17 100%)',
    glowTop: 'rgba(180,140,230,0.10)',
    glowBottom: 'rgba(120,90,200,0.10)',
    frame: 'rgba(190,150,235,0.22)',
    accent: '#B89AE0',
    accentSoft: '#DCCBF0',
    night: {
      bg: 'linear-gradient(165deg, #1d1428 0%, #2a1d3a 55%, #150e20 100%)',
      border: 'rgba(160,130,210,0.35)',
      title: '#efe8f7',
      text: '#d8cde6',
      muted: '#a890c8',
      icon: '#c4b0e0',
      glow: 'radial-gradient(circle at 85% 15%, rgba(180,140,230,0.18), transparent 45%), radial-gradient(circle at 15% 85%, rgba(120,90,200,0.15), transparent 50%)',
    },
    day: {
      bg: 'linear-gradient(165deg, #f5f1fa 0%, #ebe3f4 55%, #ded2ec 100%)',
      border: 'rgba(170,140,210,0.35)',
      title: '#352a44',
      text: '#3d314e',
      muted: '#8a74a6',
      icon: '#75609a',
      glow: 'radial-gradient(circle at 85% 15%, rgba(255,255,255,0.6), transparent 45%), radial-gradient(circle at 15% 85%, rgba(170,140,210,0.16), transparent 50%)',
    },
    card: { bg: 'rgba(18,12,28,0.6)', border: 'rgba(184,154,224,0.25)', title: '#DCCBF0', text: '#d8cde6' },
  },
  {
    id: 'parchment',
    label: '羊皮纸',
    bg: 'linear-gradient(180deg, #f7efe0 0%, #f3e7cf 25%, #f5ecd9 50%, #efe3c9 100%)',
    glowTop: 'rgba(190,150,80,0.14)',
    glowBottom: 'rgba(150,110,60,0.10)',
    frame: 'rgba(120,95,55,0.28)',
    accent: '#8a6a1a',
    accentSoft: '#EBD28A',
    heading: '#5a4312',
    vignette: 'radial-gradient(ellipse at 50% 45%, transparent 62%, rgba(90,70,30,0.14) 100%)',
    night: {
      bg: 'linear-gradient(165deg, #2a2418 0%, #3a3020 55%, #1f1a10 100%)',
      border: 'rgba(150,120,60,0.4)',
      title: '#efe5cd',
      text: '#d8cab0',
      muted: '#a08a5a',
      icon: '#d8bd82',
      glow: 'radial-gradient(circle at 85% 15%, rgba(180,140,80,0.18), transparent 45%), radial-gradient(circle at 15% 85%, rgba(120,90,50,0.15), transparent 50%)',
    },
    day: {
      bg: 'linear-gradient(165deg, #faf4e6 0%, #f2e7cd 55%, #e8dab6 100%)',
      border: 'rgba(160,120,60,0.35)',
      title: '#4a3a1a',
      text: '#4e3f20',
      muted: '#9a7b3a',
      icon: '#8a6a1a',
      glow: 'radial-gradient(circle at 85% 15%, rgba(255,255,255,0.7), transparent 45%), radial-gradient(circle at 15% 85%, rgba(160,120,60,0.15), transparent 50%)',
    },
    card: { bg: 'rgba(255,250,240,0.72)', border: 'rgba(138,106,26,0.3)', title: '#5a4312', text: '#4a3d22' },
  },
  {
    id: 'blank',
    label: '空白极简',
    bg: '#ffffff',
    glowTop: 'rgba(0,0,0,0.03)',
    glowBottom: 'rgba(0,0,0,0.03)',
    frame: 'rgba(0,0,0,0.10)',
    accent: '#6b6b6b',
    accentSoft: '#d9d9d9',
    heading: '#2a2a2a',
    vignette: 'radial-gradient(ellipse at 50% 45%, transparent 70%, rgba(0,0,0,0.06) 100%)',
    night: {
      bg: 'linear-gradient(165deg, #2a2e33 0%, #3a3f45 55%, #202327 100%)',
      border: 'rgba(140,145,150,0.4)',
      title: '#eef0f2',
      text: '#d5d8dc',
      muted: '#9aa0a6',
      icon: '#c4c9ce',
      glow: 'radial-gradient(circle at 85% 15%, rgba(160,165,170,0.16), transparent 45%), radial-gradient(circle at 15% 85%, rgba(120,125,130,0.12), transparent 50%)',
    },
    day: {
      bg: 'linear-gradient(165deg, #ffffff 0%, #f5f6f7 55%, #ecedef 100%)',
      border: 'rgba(120,125,130,0.35)',
      title: '#2a2a2a',
      text: '#3a3a3a',
      muted: '#7a7a7a',
      icon: '#5a5a5a',
      glow: 'radial-gradient(circle at 85% 15%, rgba(255,255,255,0.9), transparent 45%), radial-gradient(circle at 15% 85%, rgba(120,125,130,0.1), transparent 50%)',
    },
    card: { bg: 'rgba(0,0,0,0.03)', border: 'rgba(0,0,0,0.12)', title: '#2a2a2a', text: '#3a3a3a' },
  },
]

export const DEFAULT_THEME_ID = 'midnight-gold'

/** 长图主体区块默认顺序：截图 → 魔典 → 时间线 → 手记（截图默认置于魔典上方） */
export const DEFAULT_SECTION_ORDER: ReorderableSection[] = ['snapshot', 'grimoire', 'timeline', 'storyteller']

/** 长图边缘暗角默认值（深色主题） */
export const DEFAULT_VIGNETTE = 'radial-gradient(ellipse at 50% 45%, transparent 58%, rgba(0,0,0,0.46) 100%)'

export function getTheme(id?: string): ReplayTheme {
  return REPLAY_THEMES.find((t) => t.id === id) ?? REPLAY_THEMES[0]
}

/** 在长图组件内读取当前主题（未设置时回退默认暗夜金） */
export function useTheme(): ReplayTheme {
  const id = useReplayStore((s) => s.replay.meta.theme)
  return getTheme(id)
}

/** 区块标题文字色：在页面背景上保持可读（浅色主题为深色，缺省回退 accentSoft） */
export function headingColor(theme: ReplayTheme): string {
  return theme.heading ?? theme.accentSoft
}

/** 是否为浅色/空白主题（设置了 heading 字段即浅色背景，需用深色前景） */
export function isLightTheme(theme: ReplayTheme): boolean {
  return !!theme.heading
}

/** 将 hex 颜色向白色混合（ratio 0~1），用于派生强调色的浅色变体 */
export function tint(hex: string, ratio: number): string {
  const h = hex.replace('#', '')
  if (h.length !== 6 || !/^[0-9a-fA-F]{6}$/.test(h)) return hex
  const n = parseInt(h, 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  const mix = (c: number) => Math.round(c + (255 - c) * ratio)
  return `#${((mix(r) << 16) | (mix(g) << 8) | mix(b)).toString(16).padStart(6, '0')}`
}

// ============ 各模块强调色 ============
// 长图每个区块（标题 / 魔典 / 时间线 / 截图 / 手记）可单独覆盖强调色；
// 未覆盖时跟随主题 accent。区块标题文字色仍用 headingColor（保证可读）。

interface AccentColors {
  accent: string
  accentSoft: string
}

/** 区块强调色上下文（由 LongImage 按区块注入，子组件经 useAccent 读取） */
export const SectionAccentContext = createContext<AccentColors | null>(null)

/** 读取当前区块强调色（无上下文时回退主题 accent） */
export function useAccent(): AccentColors {
  const theme = useTheme()
  const ctx = useContext(SectionAccentContext)
  return ctx ?? { accent: theme.accent, accentSoft: theme.accentSoft }
}

/** 计算某个区块的强调色（含用户覆盖） */
export function useSectionAccent(section: SectionKey): AccentColors {
  const theme = useTheme()
  const override = useReplayStore((s) => s.replay.meta.sectionAccents?.[section])
  if (override) return { accent: override, accentSoft: tint(override, 0.35) }
  return { accent: theme.accent, accentSoft: theme.accentSoft }
}
