import { useMemo, useState } from 'react'
import { Info, MessageSquare, Swords, Skull, BookMarked, Wand2, Sparkles, Vote, Crosshair, Gavel, X } from 'lucide-react'
import type { LogEntry, ScriptCharacter } from '../../types'
import { teamOf, teamColor, characterImage, displayName } from '../../lib/script'
import { useEditable } from '../editable/editMode'
import CharacterIcon from '../board/CharacterIcon'

export interface GlossaryItem {
  tag: string
  color: string
  description?: string
}

const TYPE_META: Record<NonNullable<LogEntry['type']>, { icon: typeof Info; label: string; color: string }> = {
  st_action: { icon: Wand2, label: '说书人', color: '#C9A227' },
  info: { icon: Info, label: '信息', color: '#7FACDB' },
  player_speech: { icon: MessageSquare, label: '发言', color: '#8A93A6' },
  nomination: { icon: Gavel, label: '提名', color: '#D98E32' },
  execution: { icon: Swords, label: '处决', color: '#E07B39' },
  attack: { icon: Crosshair, label: '攻击', color: '#C0392B' },
  death: { icon: Skull, label: '死亡', color: '#B23A48' },
  comment: { icon: BookMarked, label: '复盘', color: '#9C8CC4' },
  custom: { icon: Sparkles, label: '自定义', color: '#C9A227' },
}

// 全部词条类型（统一顺序，避免昼夜过滤导致当前类型不在选项中）
const ALL_TYPES: NonNullable<LogEntry['type']>[] = ['info', 'player_speech', 'nomination', 'execution', 'attack', 'death', 'st_action', 'comment', 'custom']

// 右侧标签预设（状态类），另有剧本词汇与「自定义」
const STATUS_PRESETS = ['醉酒', '中毒', '死亡']
const CUSTOM_SENTINEL = '__custom__'

// ============ 正文提及解析 ============
// 支持两种格式的动态渲染：
//   1) [n]        座位号提及 → 序号徽章 + 玩家名 +（角色名 + 角色图标）
//   2) （角色名）   若与剧本角色名匹配 →（角色名 + 角色图标）
// 编辑时点击正文回到原始 [n] /（角色名）文本。
type ContentPart = { type: 'text'; text: string } | { type: 'seat'; seat: number } | { type: 'char'; origName: string }

// 判断括号内文本是否命中某个角色（原角色名或统一改名后的显示名），命中返回原角色名
function resolveCharName(raw: string, charMap?: Map<string, ScriptCharacter>, aliases?: Record<string, string>): string | undefined {
  if (!charMap) return undefined
  if (charMap.has(raw)) return raw
  for (const [orig, disp] of Object.entries(aliases ?? {})) {
    if (disp === raw && charMap.has(orig)) return orig
  }
  return undefined
}

function parseContent(content: string, charMap?: Map<string, ScriptCharacter>, aliases?: Record<string, string>): ContentPart[] {
  const parts: ContentPart[] = []
  const re = /\[(\d+)\]|（([^（）\n]+)）/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(content))) {
    if (m.index > last) parts.push({ type: 'text', text: content.slice(last, m.index) })
    if (m[1] != null) {
      parts.push({ type: 'seat', seat: Number(m[1]) })
    } else {
      const raw = (m[2] ?? '').trim()
      const orig = resolveCharName(raw, charMap, aliases)
      if (orig) parts.push({ type: 'char', origName: orig })
      else parts.push({ type: 'text', text: m[0] })
    }
    last = m.index + m[0].length
  }
  if (last < content.length) parts.push({ type: 'text', text: content.slice(last) })
  return parts
}

// 座位提及：序号徽章 + 玩家名 +（角色名 + 角色图标），颜色随玩家阵营
function SeatMention({
  seat,
  charMap,
  aliases,
  playerNames,
  seatCharacters,
}: {
  seat: number
  charMap?: Map<string, ScriptCharacter>
  aliases?: Record<string, string>
  playerNames?: Map<number, string>
  seatCharacters?: Map<number, string>
}) {
  const name = playerNames?.get(seat)
  const char = seatCharacters?.get(seat)
  const team = teamOf(charMap, char)
  const col = teamColor(team)
  // 座位无对应玩家/角色时，仅回退为纯文本序号
  if (!name && !char) return <span>[{seat}]</span>
  return (
    <span className="inline-flex items-center gap-1 align-middle">
      <span
        className="inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none text-white"
        style={{ background: col }}
      >
        {seat}
      </span>
      {name && <span className="font-bold" style={{ color: col }}>{name}</span>}
      {char && (
        <span className="inline-flex items-center gap-0.5">
          <span style={{ color: col }}>（{displayName(char, aliases)}</span>
          <CharacterIcon name={displayName(char, aliases)} image={characterImage(charMap, char)} team={team} size={16} borderWidth={1} />
          <span style={{ color: col }}>）</span>
        </span>
      )}
    </span>
  )
}

// 角色提及：（角色名 + 角色图标）
function CharMention({
  origName,
  charMap,
  aliases,
}: {
  origName: string
  charMap?: Map<string, ScriptCharacter>
  aliases?: Record<string, string>
}) {
  const team = teamOf(charMap, origName)
  const col = teamColor(team)
  const label = displayName(origName, aliases)
  return (
    <span className="inline-flex items-center gap-0.5">
      <span style={{ color: col }}>（{label}</span>
      <CharacterIcon name={label} image={characterImage(charMap, origName)} team={team} size={16} borderWidth={1} />
      <span style={{ color: col }}>）</span>
    </span>
  )
}

// 正文渲染：解析 [n] 与（角色名）为富文本（编辑态展示 + 导出态共用）
function RichContent({
  content,
  charMap,
  aliases,
  playerNames,
  seatCharacters,
  night,
}: {
  content: string
  charMap?: Map<string, ScriptCharacter>
  aliases?: Record<string, string>
  playerNames?: Map<number, string>
  seatCharacters?: Map<number, string>
  night: boolean
}) {
  const parts = useMemo(() => parseContent(content, charMap, aliases), [content, charMap, aliases])
  if (parts.length === 0) return null
  return (
    <span className="break-words text-sm leading-snug" style={{ color: night ? '#c3cde0' : '#3a2f1c' }}>
      {parts.map((p, i) => {
        if (p.type === 'seat') {
          return <SeatMention key={i} seat={p.seat} charMap={charMap} aliases={aliases} playerNames={playerNames} seatCharacters={seatCharacters} />
        }
        if (p.type === 'char') {
          return <CharMention key={i} origName={p.origName} charMap={charMap} aliases={aliases} />
        }
        return <span key={i}>{p.text}</span>
      })}
    </span>
  )
}

// 可编辑正文：编辑态/导出态都实时渲染提及；点击进入编辑时显示原始 [n]/（角色名）文本
function EditableContent({
  value,
  onChange,
  charMap,
  aliases,
  playerNames,
  seatCharacters,
  night,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  charMap?: Map<string, ScriptCharacter>
  aliases?: Record<string, string>
  playerNames?: Map<number, string>
  seatCharacters?: Map<number, string>
  night: boolean
  disabled: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  if (disabled) {
    return <RichContent content={value} charMap={charMap} aliases={aliases} playerNames={playerNames} seatCharacters={seatCharacters} night={night} />
  }
  if (!editing) {
    return (
      <span
        className="editable-spot block min-w-0"
        style={{ color: night ? '#c3cde0' : '#3a2f1c' }}
        title="点击编辑（支持 [n] /（角色名）提及）"
        onClick={(e) => { e.stopPropagation(); setDraft(value); setEditing(true) }}
      >
        {value ? (
          <RichContent content={value} charMap={charMap} aliases={aliases} playerNames={playerNames} seatCharacters={seatCharacters} night={night} />
        ) : (
          <span className="opacity-40 text-sm">（点击填写）</span>
        )}
      </span>
    )
  }
  return (
    <input
      autoFocus
      className="editable-input w-full text-sm leading-snug"
      style={{ color: night ? '#c3cde0' : '#3a2f1c' }}
      value={draft}
      placeholder="正文，支持 [n] 或（角色名）提及"
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => { setEditing(false); onChange(draft) }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.preventDefault(); setEditing(false); onChange(draft) }
        if (e.key === 'Escape') { e.stopPropagation(); setEditing(false) }
      }}
      onClick={(e) => e.stopPropagation()}
    />
  )
}

// 日志行：单行流式布局（类型 + 座位 + 投票 + 正文 + 右侧标签），文字过长才换行
export default function LogRow({
  entry,
  night,
  glossary,
  charMap,
  aliases,
  playerNames,
  seatCharacters,
  onPatch,
}: {
  entry: LogEntry
  night: boolean
  glossary?: GlossaryItem[]
  charMap?: Map<string, ScriptCharacter>
  aliases?: Record<string, string>
  playerNames?: Map<number, string>
  seatCharacters?: Map<number, string>
  onPatch?: (patch: Partial<LogEntry>) => void
}) {
  const editable = useEditable()
  const typeMeta = entry.type ? TYPE_META[entry.type] : undefined
  const TypeIcon = typeMeta?.icon
  const patch = (p: Partial<LogEntry>) => onPatch?.(p)

  const isCustomType = entry.type === 'custom'
  const customTypeLabel = entry.typeLabel?.trim() || ''
  const showTypeChip = entry.type != null && (entry.type !== 'custom' || customTypeLabel !== '')

  const tagColor = entry.customTag ? glossary?.find((g) => g.tag === entry.customTag)?.color : undefined
  // 玩家身份绑定：优先座位绑定的真实角色，其次回退到日志自带角色
  const boundChar = entry.sourceSeat != null ? seatCharacters?.get(entry.sourceSeat) : undefined
  const charName = boundChar ?? entry.characterName
  const charColor = teamColor(teamOf(charMap, charName))

  // 右侧标签：预设命中的回显，非预设文本视为「自定义」
  const presetList = [...STATUS_PRESETS, ...(glossary?.map((g) => g.tag) ?? [])]
  const isPreset = presetList.includes(entry.customTag ?? '')
  const [customOpen, setCustomOpen] = useState(false)
  const showCustomInput = customOpen || (entry.customTag != null && entry.customTag !== '' && !isPreset)
  const selectValue = entry.customTag ? (isPreset ? entry.customTag : CUSTOM_SENTINEL) : ''

  const pillStyle = {
    color: tagColor ?? (night ? '#EBD28A' : '#8a6110'),
    background: tagColor ? `${tagColor}22` : 'rgba(212,175,55,0.2)',
    border: `1px solid ${tagColor ? `${tagColor}55` : 'transparent'}`,
  }

  const typePillStyle = typeMeta
    ? { color: typeMeta.color, background: `${typeMeta.color}18`, border: `1px solid ${typeMeta.color}44` }
    : {}

  const handleTagSelect = (v: string) => {
    if (v === '') {
      patch({ customTag: undefined })
      setCustomOpen(false)
    } else if (v === CUSTOM_SENTINEL) {
      patch({ customTag: undefined })
      setCustomOpen(true)
    } else {
      patch({ customTag: v })
      setCustomOpen(false)
    }
  }

  const typeOptions = ALL_TYPES.map((t) => (
    <option key={t} value={t}>{TYPE_META[t].label}</option>
  ))

  const tagOptions = (withNone: boolean) => (
    <>
      {withNone && <option value="">无</option>}
      {STATUS_PRESETS.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
      {glossary && glossary.length > 0 && (
        <optgroup label="剧本词汇">
          {glossary.map((g) => (
            <option key={g.tag} value={g.tag}>{g.tag}</option>
          ))}
        </optgroup>
      )}
      <option value={CUSTOM_SENTINEL}>自定义</option>
    </>
  )

  const typeChip = (extraClass = '') => (
    <span
      className={`flex shrink-0 items-center gap-1 rounded px-1.5 py-px text-[10px] font-semibold leading-none ${extraClass}`}
      style={typePillStyle}
    >
      {isCustomType ? (
        <span>{customTypeLabel}</span>
      ) : (
        <>
          {TypeIcon && <TypeIcon className="h-3 w-3" style={{ color: typeMeta!.color }} />}
          <span>{typeMeta!.label}</span>
        </>
      )}
    </span>
  )

  return (
    <div
      className="group flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border px-2.5 py-1.5"
      style={{
        background: night ? 'rgba(19,27,43,0.45)' : 'rgba(255,255,255,0.5)',
        borderColor: night ? 'rgba(74,91,147,0.22)' : 'rgba(185,141,74,0.22)',
      }}
      title={entry.content}
    >
      {/* 左侧词条类型 */}
      {editable ? (
        <span className="flex shrink-0 items-center">
          {entry.type ? (
            <>
              {showTypeChip && typeChip('group-hover:hidden')}
              <span className="hidden items-center gap-1 group-hover:flex">
                <select
                  value={entry.type}
                  onChange={(e) => patch({ type: e.target.value ? (e.target.value as LogEntry['type']) : undefined })}
                  onClick={(e) => e.stopPropagation()}
                  className="cursor-pointer rounded border px-1 py-0.5 text-[11px] font-bold leading-none"
                  style={{ color: typeMeta!.color, borderColor: `${typeMeta!.color}55`, background: `${typeMeta!.color}14` }}
                  title="词条类型"
                >
                  <option value="">无</option>
                  {typeOptions}
                </select>
                {isCustomType && (
                  <input
                    value={entry.typeLabel ?? ''}
                    onChange={(e) => patch({ typeLabel: e.target.value || undefined })}
                    placeholder="自定义"
                    className="w-16 rounded border px-1 py-0.5 text-[11px] font-semibold leading-none"
                    style={{ color: typeMeta!.color, borderColor: `${typeMeta!.color}55`, background: `${typeMeta!.color}14` }}
                    title="自定义类型名"
                  />
                )}
                <button onClick={() => patch({ type: undefined })} className="rounded p-0.5 text-abyss-700 hover:text-evil" title="删除类型">
                  <X className="h-3 w-3" />
                </button>
              </span>
            </>
          ) : (
            <select
              value=""
              onChange={(e) => { const v = e.target.value; if (v) patch({ type: v as LogEntry['type'] }) }}
              className="hidden cursor-pointer rounded border border-dashed border-abyss-700 px-1 py-0.5 text-[10px] font-semibold leading-none text-abyss-700 hover:text-brass-300 group-hover:inline-block"
              title="添加类型"
            >
              <option value="">＋类型</option>
              {typeOptions}
            </select>
          )}
        </span>
      ) : (
        entry.type && showTypeChip && typeChip()
      )}

      {/* 玩家序号（团队色徽章） */}
      {entry.sourceSeat != null && (
        <span
          className="inline-flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none text-white"
          style={{ background: charColor }}
        >
          {entry.sourceSeat}
        </span>
      )}

      {/* 投票信息 */}
      {entry.votes && (
        <span
          className="flex shrink-0 items-center gap-1 rounded border px-1.5 py-px text-[10px] font-bold leading-none"
          style={{ borderColor: `${typeMeta?.color ?? '#8A93A6'}55`, background: `${typeMeta?.color ?? '#8A93A6'}1a`, color: typeMeta?.color ?? '#8A93A6' }}
        >
          <Vote className="h-3 w-3" />
          <span>{entry.votes}</span>
        </span>
      )}

      {/* 正文（单行流式，过长才换行；含 [n] /（角色名）提及） */}
      {(editable || entry.content) && (
        <span className="min-w-0 flex-1">
          <EditableContent
            value={entry.content}
            onChange={(v) => patch({ content: v })}
            charMap={charMap}
            aliases={aliases}
            playerNames={playerNames}
            seatCharacters={seatCharacters}
            night={night}
            disabled={!editable}
          />
        </span>
      )}

      {/* 右侧标签 */}
      {editable ? (
        <span className="flex shrink-0 items-center">
          {entry.customTag ? (
            <>
              <span className="shrink-0 rounded-full px-1.5 py-px text-[10px] font-semibold leading-none group-hover:hidden" style={pillStyle}>
                {entry.customTag}
              </span>
              <span className="hidden items-center gap-1 group-hover:flex">
                <select
                  value={selectValue}
                  onChange={(e) => handleTagSelect(e.target.value)}
                  className="cursor-pointer rounded border px-1 py-0.5 text-[10px] font-semibold leading-none text-abyss-700"
                  title="选择标签"
                >
                  {tagOptions(true)}
                </select>
                {showCustomInput && (
                  <input
                    value={entry.customTag ?? ''}
                    onChange={(e) => patch({ customTag: e.target.value || undefined })}
                    className="w-16 rounded border px-1 py-px text-[10px] font-semibold leading-none"
                    style={pillStyle}
                    title="标签文字"
                  />
                )}
                <button onClick={() => { patch({ customTag: undefined }); setCustomOpen(false) }} className="rounded p-0.5 text-abyss-700 hover:text-evil" title="删除标签">
                  <X className="h-3 w-3" />
                </button>
              </span>
            </>
          ) : customOpen ? (
            <span className="hidden items-center gap-1 group-hover:flex">
              <select
                value={CUSTOM_SENTINEL}
                onChange={(e) => handleTagSelect(e.target.value)}
                className="cursor-pointer rounded border px-1 py-0.5 text-[10px] font-semibold leading-none text-abyss-700"
                title="选择标签"
              >
                {tagOptions(true)}
              </select>
              <input
                value={entry.customTag ?? ''}
                onChange={(e) => patch({ customTag: e.target.value || undefined })}
                className="w-16 rounded border px-1 py-px text-[10px] font-semibold leading-none"
                style={pillStyle}
                title="标签文字"
              />
            </span>
          ) : (
            <select
              value=""
              onChange={(e) => handleTagSelect(e.target.value)}
              className="hidden cursor-pointer rounded border border-dashed border-abyss-700 px-1 py-0.5 text-[10px] font-semibold leading-none text-abyss-700 hover:text-brass-300 group-hover:inline-block"
              title="添加标签"
            >
              <option value="">＋标签</option>
              {STATUS_PRESETS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
              {glossary && glossary.length > 0 && (
                <optgroup label="剧本词汇">
                  {glossary.map((g) => (
                    <option key={g.tag} value={g.tag}>{g.tag}</option>
                  ))}
                </optgroup>
              )}
              <option value={CUSTOM_SENTINEL}>自定义</option>
            </select>
          )}
        </span>
      ) : (
        entry.customTag && (
          <span className="shrink-0 rounded-full px-1.5 py-px text-[10px] font-semibold leading-none" style={pillStyle}>
            {entry.customTag}
          </span>
        )
      )}
    </div>
  )
}
