import { create } from 'zustand'
import type { BotCReplayRecord, ScriptCharacter, SpecialRoleEntry, ModuleVisibility } from './types'
import { SAMPLE_REPLAY } from './sampleData'
import { parseScriptArray } from './lib/script'
import defaultScriptRaw from './assets/script-default.json'

const defaultScript = parseScriptArray(defaultScriptRaw as unknown[])

interface ReplayStore {
  replay: BotCReplayRecord
  script: ScriptCharacter[]
  scriptName: string
  screenshot: string | null // 可选：复盘截图 data URL
  exporting: boolean // 正在导出 PNG（此时隐藏所有增删/编辑按钮）
  setExporting: (v: boolean) => void
  setReplay: (r: BotCReplayRecord) => void
  updateMeta: (patch: Partial<BotCReplayRecord['meta']>) => void
  updateScript: (patch: Partial<BotCReplayRecord['scriptMeta']>) => void
  updateEvilSetup: (patch: Partial<BotCReplayRecord['evilSetup']>) => void
  setAlias: (original: string, display: string) => void
  updateSpecialRoles: (roles: SpecialRoleEntry[]) => void
  updateModules: (patch: Partial<ModuleVisibility>) => void
  loadScript: (json: string) => { ok: boolean; message: string }
  setScreenshot: (dataUrl: string | null) => void
  importJSON: (json: string) => boolean
  reset: () => void
}

let uid = 0
export const nextId = (prefix = 'id') => `${prefix}-${Date.now().toString(36)}-${(uid++).toString(36)}`

export const useReplayStore = create<ReplayStore>((set, get) => ({
  replay: structuredClone(SAMPLE_REPLAY),
  script: defaultScript.characters,
  scriptName: defaultScript.metaName ?? '',
  screenshot: null,
  exporting: false,

  setExporting: (v) => set({ exporting: v }),

  setReplay: (r) => set({ replay: r }),

  updateMeta: (patch) => set((s) => ({ replay: { ...s.replay, meta: { ...s.replay.meta, ...patch } } })),

  updateScript: (patch) =>
    set((s) => ({ replay: { ...s.replay, scriptMeta: { ...s.replay.scriptMeta, ...patch } } })),

  updateEvilSetup: (patch) =>
    set((s) => ({ replay: { ...s.replay, evilSetup: { ...s.replay.evilSetup, ...patch } } })),

  setAlias: (original, display) =>
    set((s) => {
      const aliases = { ...(s.replay.characterAliases ?? {}) }
      if (display && display.trim() && display !== original) aliases[original] = display.trim()
      else delete aliases[original]
      return { replay: { ...s.replay, characterAliases: aliases } }
    }),

  updateSpecialRoles: (roles) => set((s) => ({ replay: { ...s.replay, specialRoles: roles } })),

  updateModules: (patch) =>
    set((s) => ({ replay: { ...s.replay, modules: { ...(s.replay.modules ?? {}), ...patch } } })),

  loadScript: (json) => {
    try {
      const parsed = JSON.parse(json)
      if (!Array.isArray(parsed)) return { ok: false, message: '剧本 JSON 应为角色数组' }
      const { characters: chars, metaName, metaAuthor, metaLogo } = parseScriptArray(parsed)
      if (chars.length === 0) return { ok: false, message: '未解析到任何角色' }
      // logo 自动读取：剧本 _meta.logo 字段存在则采用，并默认切到 logo 标题模式；无则沿用文字标题
      const hasLogo = !!metaLogo
      set({
        script: chars,
        scriptName: metaName ?? '',
        replay: {
          ...get().replay,
          scriptMeta: {
            ...get().replay.scriptMeta,
            scriptName: metaName ?? get().replay.scriptMeta.scriptName,
            author: metaAuthor ?? get().replay.scriptMeta.author,
            logo: metaLogo ?? get().replay.scriptMeta.logo,
          },
          meta: {
            ...get().replay.meta,
            titleMode: hasLogo ? 'logo' : get().replay.meta.titleMode,
          },
        },
      })
      return { ok: true, message: `已加载剧本「${metaName ?? '未命名'}」：${chars.length} 个角色` }
    } catch {
      return { ok: false, message: 'JSON 解析失败' }
    }
  },

  setScreenshot: (dataUrl) => set({ screenshot: dataUrl }),

  importJSON: (json) => {
    try {
      const parsed = JSON.parse(json)
      if (!parsed || !Array.isArray(parsed.initialPlayers) || !Array.isArray(parsed.phases)) {
        return false
      }
      set({ replay: parsed as BotCReplayRecord })
      return true
    } catch {
      return false
    }
  },

  reset: () => set({ replay: structuredClone(SAMPLE_REPLAY) }),
}))
