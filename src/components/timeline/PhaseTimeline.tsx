import type { GamePhase, ScriptCharacter } from '../../types'
import PhaseSection from './PhaseSection'
import type { GlossaryItem } from './LogRow'

export default function PhaseTimeline({
  phases,
  glossary,
  charMap,
  aliases,
  playerNames,
  seatCharacters,
}: {
  phases: GamePhase[]
  glossary?: GlossaryItem[]
  charMap?: Map<string, ScriptCharacter>
  aliases?: Record<string, string>
  playerNames?: Map<number, string>
  seatCharacters?: Map<number, string>
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* 时间轴标题 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rotate-45 bg-brass-400" />
          <span className="font-display text-lg font-bold tracking-[0.2em] text-brass-200">
            昼夜复盘流 · TIMELINE
          </span>
          <span className="h-2 w-2 rotate-45 bg-brass-400" />
        </div>
        <span className="h-px flex-1 bg-gradient-to-r from-brass-700/60 to-transparent" />
        <span className="text-xs text-abyss-700">{phases.length} 个阶段</span>
      </div>

      {phases.map((phase) => (
        <PhaseSection key={phase.id} phase={phase} glossary={glossary} charMap={charMap} aliases={aliases} playerNames={playerNames} seatCharacters={seatCharacters} />
      ))}
    </div>
  )
}
