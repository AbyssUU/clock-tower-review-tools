import { Moon, Sun } from 'lucide-react'
import type { GamePhase, LogEntry, ScriptCharacter } from '../../types'
import { useReplayStore } from '../../store'
import { useTheme } from '../../lib/theme'
import { useEditable } from '../editable/editMode'
import { EditableText } from '../editable/Editable'
import LogRow, { type GlossaryItem } from './LogRow'

export default function PhaseSection({
  phase,
  glossary,
  charMap,
  aliases,
  playerNames,
  seatCharacters,
}: {
  phase: GamePhase
  glossary?: GlossaryItem[]
  charMap?: Map<string, ScriptCharacter>
  aliases?: Record<string, string>
  playerNames?: Map<number, string>
  seatCharacters?: Map<number, string>
}) {
  const editable = useEditable()
  const theme = useTheme()
  const night = phase.phaseType === 'night'
  const pal = night ? theme.night : theme.day
  const Icon = night ? Moon : Sun

  const updatePhase = (patch: Partial<GamePhase>) => {
    const r = useReplayStore.getState().replay
    useReplayStore.getState().setReplay({
      ...r,
      phases: r.phases.map((p) => (p.id === phase.id ? { ...p, ...patch } : p)),
    })
  }
  const updateLog = (logId: string, patch: Partial<LogEntry>) => {
    updatePhase({
      logs: phase.logs.map((l) => (l.id === logId ? { ...l, ...patch } : l)),
    })
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl border"
      style={{
        borderColor: pal.border,
        background: pal.bg,
        boxShadow: night
          ? '0 12px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)'
          : '0 12px 32px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.55)',
      }}
    >
      {/* 氛围纹理 */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: pal.glow }}
      />

      {/* 阶段标题 */}
      <div className="relative z-10 flex items-center gap-3 px-6 pt-5">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full border"
          style={{
            borderColor: `${pal.icon}55`,
            background: night ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.6)',
            color: pal.icon,
            boxShadow: `0 0 18px ${pal.border}`,
          }}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <EditableText
            value={phase.title}
            onChange={(v) => updatePhase({ title: v })}
            disabled={!editable}
            className="font-display text-lg font-bold tracking-wide"
            style={{ color: pal.title }}
          />
          <div
            className="text-[11px] font-semibold uppercase tracking-[0.2em]"
            style={{ color: pal.muted }}
          >
            {night ? 'Night · 夜晚' : 'Day · 白昼'}
          </div>
        </div>
        <div
          className="ml-auto font-serif text-xs"
          style={{ color: pal.muted, opacity: 0.8 }}
        >
          {phase.logs.length} 条记录
        </div>
      </div>

      {/* 分隔线 */}
      <div className="relative z-10 mx-6 mt-4 flex items-center gap-2">
        <span className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${pal.muted})` }} />
        <span
          className="h-1.5 w-1.5 rotate-45"
          style={{ background: pal.muted }}
        />
        <span className="h-px flex-1" style={{ background: `linear-gradient(270deg, transparent, ${pal.muted})` }} />
      </div>

      {/* 日志列表 */}
      <div className="relative z-10 flex flex-col gap-1.5 p-4">
        {phase.logs.map((log) => (
          <LogRow
            key={log.id}
            entry={log}
            night={night}
            glossary={glossary}
            charMap={charMap}
            aliases={aliases}
            playerNames={playerNames}
            seatCharacters={seatCharacters}
            onPatch={(p) => updateLog(log.id, p)}
          />
        ))}
      </div>
    </div>
  )
}
