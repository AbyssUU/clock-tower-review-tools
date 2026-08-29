import { forwardRef, useMemo } from 'react'
import { Compass, BookOpen, Image as ImageIcon, Plus, X } from 'lucide-react'
import type { BotCReplayRecord, ScriptCharacter, ReorderableSection } from '../../types'
import { buildCharacterMap } from '../../lib/script'
import {
  useTheme,
  useSectionAccent,
  useAccent,
  headingColor,
  SectionAccentContext,
  DEFAULT_SECTION_ORDER,
  DEFAULT_VIGNETTE,
} from '../../lib/theme'
import { useReplayStore } from '../../store'
import { EditModeContext, useEditable } from '../editable/editMode'
import { EditableText, EditableTextarea } from '../editable/Editable'
import Header from './Header'
import RadialWheel from '../board/RadialWheel'
import GrimoireModulesRow from '../board/GrimoireModulesRow'
import PhaseTimeline from '../timeline/PhaseTimeline'
import OrnateDivider from './OrnateDivider'
import CornerOrnament from './CornerOrnament'

interface LongImageProps {
  replay: BotCReplayRecord
  script?: ScriptCharacter[]
  screenshot?: string | null
  editable?: boolean
}

const LongImage = forwardRef<HTMLDivElement, LongImageProps>(function LongImage(
  { replay, script, screenshot, editable = false },
  ref,
) {
  const { initialPlayers, phases, evilSetup } = replay
  const charMap = useMemo(() => buildCharacterMap(script ?? []), [script])
  const aliases = replay.characterAliases ?? {}
  const playerNames = useMemo(() => new Map(initialPlayers.map((p) => [p.seatNumber, p.name])), [initialPlayers])
  // 座位号 -> 真实角色（用于时间线日志的「玩家身份」绑定与 [n] 提及）
  const seatCharacters = useMemo(() => new Map(initialPlayers.map((p) => [p.seatNumber, p.realCharacter])), [initialPlayers])

  // 字体设置：中文默认宋体、英文/数字默认 Times New Roman，可单独调整
  const fs = replay.fontSettings ?? {}
  const cnFont = fs.cn || "'Songti SC','STSong','SimSun',serif"
  const latinFont = fs.latin || "'Times New Roman','Times',serif"

  // 长图宽度（可自定义，默认 1080）；轮盘随宽度等比缩放
  const imageWidth = replay.meta.imageWidth ?? 1080
  const wheelSize = Math.max(680, Math.min(1120, imageWidth - 112))

  // 配色主题：控制页面背景、氛围光晕与外框
  const theme = useTheme()
  const heading = headingColor(theme)

  // 各区块强调色（含用户在「布局」标签里的覆盖）
  const headerAccent = useSectionAccent('header')
  const grimoireAccent = useSectionAccent('grimoire')
  const timelineAccent = useSectionAccent('timeline')
  const snapshotAccent = useSectionAccent('snapshot')
  const storytellerAccent = useSectionAccent('storyteller')

  // 主体区块显示顺序（默认：截图 → 魔典 → 时间线 → 手记）
  const order: ReorderableSection[] = replay.meta.sectionOrder?.length ? replay.meta.sectionOrder : DEFAULT_SECTION_ORDER

  // 手记为空且非编辑态时，整个手记区块（含分隔线）不显示
  const hasNotes = (replay.customSections?.length ?? 0) > 0
  const showStoryteller = editable || hasNotes

  return (
    <EditModeContext.Provider value={editable}>
      <div
        ref={ref}
        className="relative overflow-hidden"
        style={{
          width: imageWidth,
          background: theme.bg,
          fontFamily: `${latinFont}, ${cnFont}, serif`,
          '--font-cn': cnFont,
          '--font-latin': latinFont,
        } as React.CSSProperties}
      >
        {/* ===== 全局氛围纹理 ===== */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              `radial-gradient(circle at 50% 0%, ${theme.glowTop}, transparent 42%), radial-gradient(circle at 50% 100%, ${theme.glowBottom}, transparent 45%)`,
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: theme.vignette ?? DEFAULT_VIGNETTE }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.35) 0 1px, transparent 1px 3px)',
          }}
        />

        {/* ===== 外框 ===== */}
        <div className="pointer-events-none absolute" style={{ inset: 18, border: `1px solid ${theme.frame}` }} />
        <CornerOrnament position="tl" />
        <CornerOrnament position="tr" />
        <CornerOrnament position="bl" />
        <CornerOrnament position="br" />

        <div className="relative z-10 flex flex-col gap-5 px-14 py-10">
          <SectionAccentContext.Provider value={headerAccent}>
            <Header replay={replay} />
          </SectionAccentContext.Provider>

          {order.map((key) => {
            if (key === 'grimoire') {
              return (
                <SectionAccentContext.Provider key={key} value={grimoireAccent}>
                  <OrnateDivider label="GRIMOIRE" />
                  <section className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <Compass className="h-5 w-5" style={{ color: grimoireAccent.accent }} />
                      <h2 className="font-display text-xl font-bold tracking-[0.2em]" style={{ color: heading }}>复盘魔典</h2>
                      <span className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${grimoireAccent.accent}99, transparent)` }} />
                      <span className="text-xs" style={{ color: grimoireAccent.accent }}>{initialPlayers.length} 名玩家</span>
                    </div>
                    <div className="flex justify-center">
                      <RadialWheel players={initialPlayers} charMap={charMap} aliases={aliases} size={wheelSize} />
                    </div>
                    <GrimoireModulesRow evilSetup={evilSetup} charMap={charMap} aliases={aliases} />
                  </section>
                </SectionAccentContext.Provider>
              )
            }
            if (key === 'timeline') {
              return (
                <SectionAccentContext.Provider key={key} value={timelineAccent}>
                  <OrnateDivider label="TIMELINE" />
                  <PhaseTimeline phases={phases} glossary={replay.customGlossary} charMap={charMap} aliases={aliases} playerNames={playerNames} seatCharacters={seatCharacters} />
                </SectionAccentContext.Provider>
              )
            }
            if (key === 'snapshot' && screenshot) {
              return (
                <SectionAccentContext.Provider key={key} value={snapshotAccent}>
                  <OrnateDivider label="SNAPSHOT" />
                  <section className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <ImageIcon className="h-5 w-5" style={{ color: snapshotAccent.accent }} />
                      <h2 className="font-display text-xl font-bold tracking-[0.2em]" style={{ color: heading }}>复盘截图</h2>
                      <span className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${snapshotAccent.accent}99, transparent)` }} />
                    </div>
                    <img src={screenshot} alt="复盘截图" className="w-full rounded-xl border border-brass-700/40" />
                  </section>
                </SectionAccentContext.Provider>
              )
            }
            if (key === 'storyteller' && showStoryteller) {
              return (
                <SectionAccentContext.Provider key={key} value={storytellerAccent}>
                  <OrnateDivider label="STORYTELLER" />
                  <StorytellerNotes />
                </SectionAccentContext.Provider>
              )
            }
            return null
          })}

          <footer className="flex flex-col items-center gap-1.5 border-t pt-5 pb-1" style={{ borderColor: `${theme.accent}44` }}>
            <span className="font-display text-xs tracking-[0.3em]" style={{ color: theme.accent }}>BLOOD ON THE CLOCKTOWER · GRIMOIRE REPLAY</span>
            <span className="text-[11px]" style={{ color: theme.accent, opacity: 0.7 }}>魔典复盘生成器 · 由说书人手工整理</span>
          </footer>
        </div>
      </div>
    </EditModeContext.Provider>
  )
})

// 说书人复盘手记（自由编辑）
function StorytellerNotes() {
  const editable = useEditable()
  const theme = useTheme()
  const accent = useAccent()
  const heading = headingColor(theme)
  const sections = useReplayStore((s) => s.replay.customSections) ?? []

  const update = (list: { title: string; content: string }[]) => {
    useReplayStore.getState().setReplay({ ...useReplayStore.getState().replay, customSections: list })
  }
  const patch = (i: number, p: Partial<{ title: string; content: string }>) =>
    update(sections.map((s, idx) => (idx === i ? { ...s, ...p } : s)))

  // 手记为空且非编辑态（导出/只读）：整个区块不显示（避免出现虚线空框）
  if (!editable && sections.length === 0) return null

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <BookOpen className="h-5 w-5" style={{ color: accent.accent }} />
        <h2 className="font-display text-xl font-bold tracking-[0.2em]" style={{ color: heading }}>说书人复盘手记</h2>
        <span className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${accent.accent}99, transparent)` }} />
        {editable && (
          <button
            onClick={() => update([...sections, { title: '新章节', content: '' }])}
            className="flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-semibold transition hover:opacity-80"
            style={{ borderColor: `${accent.accent}55`, color: accent.accent }}
          >
            <Plus className="h-3.5 w-3.5" /> 添加章节
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {sections.length === 0 && (
          <p
            className="col-span-2 rounded-xl border border-dashed px-4 py-6 text-center text-sm"
            style={{ borderColor: `${theme.card.border}66`, color: accent.accent, opacity: 0.7 }}
          >
            暂无手记，点击右上角「添加章节」开始记录。
          </p>
        )}
        {sections.map((s, i) => (
          <div
            key={i}
            className="group relative rounded-xl border p-5"
            style={{ borderColor: theme.card.border, background: theme.card.bg, boxShadow: `inset 0 0 20px ${accent.accent}0d` }}
          >
            {editable && (
              <button
                onClick={() => update(sections.filter((_, idx) => idx !== i))}
                className="absolute right-2.5 top-2.5 rounded p-1 opacity-0 transition hover:opacity-100 group-hover:opacity-100"
                style={{ color: accent.accent }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <div className="mb-2 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rotate-45" style={{ background: accent.accent }} />
              <EditableText
                value={s.title}
                onChange={(v) => patch(i, { title: v })}
                disabled={!editable}
                className="font-display text-base font-bold"
                style={{ color: theme.card.title }}
              />
            </div>
            <EditableTextarea
              value={s.content}
              onChange={(v) => patch(i, { content: v })}
              disabled={!editable}
              rows={4}
              className="whitespace-pre-wrap text-sm leading-relaxed"
              style={{ color: theme.card.text }}
            />
          </div>
        ))}
      </div>
    </section>
  )
}

export default LongImage
