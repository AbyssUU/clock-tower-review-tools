import { useReplayStore } from '../store'

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
  accentSoft: string // 浅强调色（标题文字）
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
]

export const DEFAULT_THEME_ID = 'midnight-gold'

export function getTheme(id?: string): ReplayTheme {
  return REPLAY_THEMES.find((t) => t.id === id) ?? REPLAY_THEMES[0]
}

/** 在长图组件内读取当前主题（未设置时回退默认暗夜金） */
export function useTheme(): ReplayTheme {
  const id = useReplayStore((s) => s.replay.meta.theme)
  return getTheme(id)
}
