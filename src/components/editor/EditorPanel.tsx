import { useMemo, useRef, useState } from 'react'
import {
  Settings2,
  Users,
  Layers,
  Database,
  BookMarked,
  Plus,
  Trash2,
  Moon,
  Sun,
  RotateCcw,
  Download,
  Upload,
  Image as ImageIcon,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Link2,
  ScanLine,
  Loader2,
  ChevronDown,
  GripVertical,
} from 'lucide-react'
import { useReplayStore, nextId } from '../../store'
import type { ReplayPlayer, GamePhase, LogEntry } from '../../types'
import { CHARACTER_CATALOG } from '../../types'
import { buildCharacterMap, characterImage, teamColor } from '../../lib/script'
import { REPLAY_THEMES } from '../../lib/theme'
import { FABLED_CATALOG, TRAVELER_CATALOG } from '../../lib/special'
import { downloadJSON } from '../../lib/exportUtils'
import { recognizeReplayImage, extractJSON, type VisionConfig } from '../../lib/recognize'
import CharacterIcon from '../board/CharacterIcon'
import { Field, TextInput, TextArea, Select } from './Field'

type TabKey = 'script' | 'meta' | 'players' | 'phases' | 'data' | 'extras'

const TABS: { key: TabKey; label: string; icon: typeof Settings2 }[] = [
  { key: 'script', label: '剧本', icon: BookMarked },
  { key: 'meta', label: '基本信息', icon: Settings2 },
  { key: 'players', label: '玩家', icon: Users },
  { key: 'phases', label: '阶段日志', icon: Layers },
  { key: 'extras', label: '扩展', icon: Sparkles },
  { key: 'data', label: '导入导出', icon: Database },
]

export default function EditorPanel() {
  const [tab, setTab] = useState<TabKey>('meta')

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* 标签栏 */}
      <div className="flex shrink-0 flex-wrap gap-1 border-b border-abyss-800 bg-abyss-900/60 px-2 pt-2">
        {TABS.map((t) => {
          const Icon = t.icon
          const active = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? 'bg-abyss-950 text-brass-300 shadow-brass-inner'
                  : 'text-abyss-700 hover:bg-abyss-850 hover:text-brass-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto p-4">
        {tab === 'script' && <ScriptTab />}
        {tab === 'meta' && <MetaTab />}
        {tab === 'players' && <PlayersTab />}
        {tab === 'phases' && <PhasesTab />}
        {tab === 'extras' && <ExtrasTab />}
        {tab === 'data' && <DataTab />}
      </div>
    </div>
  )
}

/* ============ 剧本 JSON ============ */
function ScriptTab() {
  const script = useReplayStore((s) => s.script)
  const scriptName = useReplayStore((s) => s.scriptName)
  const loadScript = useReplayStore((s) => s.loadScript)
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')
  const charMap = useMemo(() => buildCharacterMap(script), [script])

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const r = loadScript(String(reader.result))
      setMsg(r.message)
    }
    reader.readAsText(file)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="label-caps">剧本 JSON</h3>
        <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 rounded-md border border-brass-600/60 bg-brass-500/10 px-3 py-2 text-sm font-semibold text-brass-200 hover:bg-brass-500/20">
          <Upload className="h-4 w-4" /> 上传剧本 JSON
        </button>
        <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </div>

      {msg && <p className="text-sm text-brass-200">{msg}</p>}

      {script.length === 0 ? (
        <div className="rounded-lg border border-dashed border-abyss-700 p-6 text-center text-sm text-abyss-700">
          尚未加载剧本。请上传剧本 JSON（参考 <span className="font-mono text-brass-300">暗藏玄机v2.1.json</span>），
          加载后魔典将显示对应角色图标、阵营配色与 Reminder Tokens。
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 text-sm text-abyss-700">
            <span className="font-semibold text-brass-200">{scriptName || '剧本'}</span>
            <span>· {script.length} 个角色</span>
          </div>
          <div className="flex flex-col gap-1.5">
            {script.map((c) => (
              <div key={c.id} className="flex items-center gap-2.5 rounded-md border border-abyss-800 bg-abyss-900/50 px-2.5 py-1.5">
                <CharacterIcon name={c.name} image={characterImage(charMap, c.name)} team={c.team} size={34} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: teamColor(c.team) }}>{c.name}</span>
                    <span className="text-[10px] uppercase tracking-wider text-abyss-700">{c.team}</span>
                  </div>
                  {c.ability && <p className="truncate text-xs text-abyss-700" title={c.ability}>{c.ability}</p>}
                </div>
                {(c.reminders.length > 0 || c.remindersGlobal.length > 0) && (
                  <span className="shrink-0 text-[10px] text-brass-300/70">
                    {[...c.reminders, ...c.remindersGlobal].slice(0, 4).join(' / ')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/* ============ 基本信息 ============ */
function MetaTab() {
  const replay = useReplayStore((s) => s.replay)
  const updateMeta = useReplayStore((s) => s.updateMeta)
  const updateScript = useReplayStore((s) => s.updateScript)
  const updateEvilSetup = useReplayStore((s) => s.updateEvilSetup)

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-3">
        <h3 className="label-caps">对局信息</h3>
        <Field label="复盘标题">
          <TextInput value={replay.meta.title} onChange={(e) => updateMeta({ title: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="说书人">
            <TextInput value={replay.meta.storyteller} onChange={(e) => updateMeta({ storyteller: e.target.value })} />
          </Field>
          <Field label="日期">
            <TextInput value={replay.meta.date} onChange={(e) => updateMeta({ date: e.target.value })} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="胜负结果">
            <Select value={replay.meta.winner} onChange={(e) => updateMeta({ winner: e.target.value as never })}>
              <option value="good">善良获胜</option>
              <option value="evil">邪恶获胜</option>
              <option value="storyteller">说书人获胜</option>
              <option value="custom">自定义</option>
            </Select>
          </Field>
          {replay.meta.winner === 'custom' && (
            <Field label="自定义胜负文案">
              <TextInput value={replay.meta.winnerCustom ?? ''} onChange={(e) => updateMeta({ winnerCustom: e.target.value })} placeholder="如：和平结局" />
            </Field>
          )}
          <Field label="MVP">
            <TextInput value={replay.meta.mvp ?? ''} onChange={(e) => updateMeta({ mvp: e.target.value })} />
          </Field>
        </div>
        <Field label="胜负判定总结">
          <TextArea rows={2} value={replay.meta.winningReason ?? ''} onChange={(e) => updateMeta({ winningReason: e.target.value })} />
        </Field>
        <Field label="长图宽度（px）" hint="默认 1080，可拖动调整；轮盘会随宽度等比缩放">
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={900}
              max={1600}
              step={20}
              value={replay.meta.imageWidth ?? 1080}
              onChange={(e) => updateMeta({ imageWidth: Number(e.target.value) })}
              className="flex-1 accent-brass-500"
            />
            <TextInput
              type="number"
              className="w-20"
              value={replay.meta.imageWidth ?? 1080}
              onChange={(e) => updateMeta({ imageWidth: Number(e.target.value) || undefined })}
            />
          </div>
        </Field>
        <Field label="长图配色主题" hint="切换页面背景与氛围光晕，均为深色底 + 浅色文字以保证可读性">
          <Select value={replay.meta.theme ?? REPLAY_THEMES[0].id} onChange={(e) => updateMeta({ theme: e.target.value })}>
            {REPLAY_THEMES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </Select>
        </Field>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="label-caps">剧本信息</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="剧本名称">
            <TextInput value={replay.scriptMeta.scriptName} onChange={(e) => updateScript({ scriptName: e.target.value })} />
          </Field>
          <Field label="版本">
            <TextInput value={replay.scriptMeta.version ?? ''} onChange={(e) => updateScript({ version: e.target.value })} />
          </Field>
        </div>
        <Field label="作者">
          <TextInput value={replay.scriptMeta.author ?? ''} onChange={(e) => updateScript({ author: e.target.value })} />
        </Field>
        <Field label="Logo 图片地址（有则默认作为标题，可切换）" hint="可填 URL；留空则使用文字标题">
          <TextInput value={replay.scriptMeta.logo ?? ''} placeholder="https://…" onChange={(e) => updateScript({ logo: e.target.value || undefined })} />
        </Field>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="label-caps">恶魔伪装与邪恶初始</h3>
        <Field label="三个恶魔伪装角色（用顿号或逗号分隔）" hint="如：洗衣妇、厨师、处女">
          <TextInput
            value={replay.evilSetup.demonBluffs.join('、')}
            onChange={(e) =>
              updateEvilSetup({
                demonBluffs: e.target.value.split(/[、,，]/).map((s) => s.trim()).filter(Boolean),
              })
            }
          />
        </Field>
        <Field label="首夜邪恶互认说明">
          <TextArea
            rows={2}
            value={replay.evilSetup.evilKnowledgeNotes ?? ''}
            onChange={(e) => updateEvilSetup({ evilKnowledgeNotes: e.target.value })}
          />
        </Field>
      </section>
    </div>
  )
}

/* ============ 玩家 ============ */
function PlayersTab() {
  const replay = useReplayStore((s) => s.replay)
  const script = useReplayStore((s) => s.script)
  const setReplay = useReplayStore((s) => s.setReplay)
  const players = replay.initialPlayers
  // 剧本角色优先，未加载剧本时用内置目录
  const charOptions = script.length
    ? script.map((c) => ({ name: c.name, team: c.team }))
    : CHARACTER_CATALOG

  const updatePlayer = (seat: number, patch: Partial<ReplayPlayer>) => {
    setReplay({
      ...replay,
      initialPlayers: players.map((p) => (p.seatNumber === seat ? { ...p, ...patch } : p)),
    })
  }

  const addPlayer = () => {
    const nextSeat = players.length ? Math.max(...players.map((p) => p.seatNumber)) + 1 : 1
    setReplay({
      ...replay,
      initialPlayers: [
        ...players,
        { seatNumber: nextSeat, name: `玩家${nextSeat}`, realCharacter: '村民', isAlive: true, hasGhostVote: false, activeTokens: [] },
      ],
    })
  }

  const removePlayer = (seat: number) => {
    setReplay({ ...replay, initialPlayers: players.filter((p) => p.seatNumber !== seat) })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="label-caps">玩家与座位（{players.length} 人）</h3>
        <button onClick={addPlayer} className="flex items-center gap-1 rounded-md border border-brass-700/50 px-2.5 py-1.5 text-xs font-semibold text-brass-300 hover:bg-brass-500/10">
          <Plus className="h-3.5 w-3.5" /> 添加玩家
        </button>
      </div>

      {players.map((p) => (
        <div key={p.seatNumber} className="flex flex-wrap items-end gap-2 rounded-lg border border-abyss-800 bg-abyss-900/50 p-3">
          <div className="w-14">
            <Field label="座位">
              <TextInput
                type="number"
                value={p.seatNumber}
                onChange={(e) => updatePlayer(p.seatNumber, { seatNumber: Number(e.target.value) })}
              />
            </Field>
          </div>
          <div className="w-28">
            <Field label="昵称">
              <TextInput value={p.name} onChange={(e) => updatePlayer(p.seatNumber, { name: e.target.value })} />
            </Field>
          </div>
          <div className="w-32">
            <Field label="真实角色">
              <Select value={p.realCharacter} onChange={(e) => updatePlayer(p.seatNumber, { realCharacter: e.target.value })}>
                <option value={p.realCharacter}>{p.realCharacter}</option>
                {charOptions.filter((c) => c.name !== p.realCharacter).map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="w-24">
            <Field label="伪装角色">
              <TextInput
                value={p.fakeCharacter ?? ''}
                placeholder="（可选）"
                onChange={(e) => updatePlayer(p.seatNumber, { fakeCharacter: e.target.value || undefined })}
              />
            </Field>
          </div>
          <button
            onClick={() => removePlayer(p.seatNumber)}
            className="ml-auto rounded-md p-2 text-abyss-700 hover:bg-evil/10 hover:text-evil"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}

/* ============ 阶段与日志 ============ */
function PhasesTab() {
  const replay = useReplayStore((s) => s.replay)
  const setReplay = useReplayStore((s) => s.setReplay)
  const phases = replay.phases
  // 拖拽排序中的日志（phaseId + logId）
  const [dragged, setDragged] = useState<{ phaseId: string; logId: string } | null>(null)

  const updatePhase = (id: string, patch: Partial<GamePhase>) => {
    setReplay({ ...replay, phases: phases.map((ph) => (ph.id === id ? { ...ph, ...patch } : ph)) })
  }

  const addPhase = () => {
    const nextNum = phases.length ? Math.max(...phases.map((p) => p.phaseNumber)) + 1 : 1
    setReplay({
      ...replay,
      phases: [
        ...phases,
        { id: nextId('phase'), phaseType: 'night', phaseNumber: nextNum, title: `第 ${nextNum} 夜`, logs: [] },
      ],
    })
  }

  const removePhase = (id: string) => setReplay({ ...replay, phases: phases.filter((p) => p.id !== id) })

  const addLog = (phaseId: string) => {
    setReplay({
      ...replay,
      phases: phases.map((ph) =>
        ph.id === phaseId
          ? { ...ph, logs: [...ph.logs, { id: nextId('log'), type: 'info', content: '新日志' }] }
          : ph,
      ),
    })
  }

  const updateLog = (phaseId: string, logId: string, patch: Partial<LogEntry>) => {
    setReplay({
      ...replay,
      phases: phases.map((ph) =>
        ph.id === phaseId
          ? { ...ph, logs: ph.logs.map((l) => (l.id === logId ? { ...l, ...patch } : l)) }
          : ph,
      ),
    })
  }

  const removeLog = (phaseId: string, logId: string) => {
    setReplay({
      ...replay,
      phases: phases.map((ph) => (ph.id === phaseId ? { ...ph, logs: ph.logs.filter((l) => l.id !== logId) } : ph)),
    })
  }

  // 日志拖拽排序：把 fromId 插到 toId 所在位置
  const moveLog = (phaseId: string, fromId: string, toId: string) => {
    setReplay({
      ...replay,
      phases: phases.map((ph) => {
        if (ph.id !== phaseId) return ph
        const logs = [...ph.logs]
        const from = logs.findIndex((l) => l.id === fromId)
        const to = logs.findIndex((l) => l.id === toId)
        if (from < 0 || to < 0 || from === to) return ph
        const [moved] = logs.splice(from, 1)
        logs.splice(to, 0, moved)
        return { ...ph, logs }
      }),
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="label-caps">昼夜复盘流（{phases.length} 阶段）</h3>
        <button onClick={addPhase} className="flex items-center gap-1 rounded-md border border-brass-700/50 px-2.5 py-1.5 text-xs font-semibold text-brass-300 hover:bg-brass-500/10">
          <Plus className="h-3.5 w-3.5" /> 添加阶段
        </button>
      </div>

      {phases.map((ph) => (
        <div key={ph.id} className="rounded-lg border border-abyss-800 bg-abyss-900/50">
          <div className="flex flex-wrap items-center gap-2 border-b border-abyss-800 p-3">
            <button
              onClick={() => updatePhase(ph.id, { phaseType: ph.phaseType === 'night' ? 'day' : 'night' })}
              className={`flex h-7 w-7 items-center justify-center rounded-md border ${
                ph.phaseType === 'night' ? 'border-moon-600 bg-moon-800 text-moon-300' : 'border-brass-600 bg-brass-500/10 text-brass-300'
              }`}
              title="切换昼夜"
            >
              {ph.phaseType === 'night' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </button>
            <Field label="阶段名">
              <TextInput className="w-56" value={ph.title} onChange={(e) => updatePhase(ph.id, { title: e.target.value })} />
            </Field>
            <button onClick={() => addLog(ph.id)} className="ml-auto flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold text-brass-300 hover:bg-brass-500/10">
              <Plus className="h-3.5 w-3.5" /> 日志
            </button>
            <button onClick={() => removePhase(ph.id)} className="rounded-md p-1.5 text-abyss-700 hover:bg-evil/10 hover:text-evil">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-col gap-2 p-3">
            {ph.logs.length === 0 && <p className="py-2 text-center text-xs text-abyss-700">暂无日志</p>}
            {ph.logs.map((log) => {
              const isDragging = dragged?.logId === log.id
              return (
              <div
                key={log.id}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
                onDragEnter={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  if (dragged && dragged.phaseId === ph.id && dragged.logId !== log.id) {
                    moveLog(ph.id, dragged.logId, log.id)
                  }
                  setDragged(null)
                }}
                className={`flex flex-col gap-2 rounded border p-2 transition ${isDragging ? 'border-brass-500/60 bg-brass-500/5 opacity-50' : 'border-abyss-800 bg-abyss-950/50'}`}
              >
                {/* 第一行：类型 + 投票 + 标签（与时间线单行顺序一致） */}
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    draggable
                    onDragStart={(e) => { setDragged({ phaseId: ph.id, logId: log.id }); e.dataTransfer.effectAllowed = 'move' }}
                    onDragEnd={() => setDragged(null)}
                    className="cursor-grab text-abyss-700 hover:text-brass-300"
                    title="拖动排序"
                  >
                    <GripVertical className="h-4 w-4" />
                  </span>
                  <Select
                    className="w-28"
                    value={log.type ?? ''}
                    onChange={(e) => updateLog(ph.id, log.id, { type: e.target.value ? (e.target.value as LogEntry['type']) : undefined })}
                  >
                    <option value="">无</option>
                    <option value="st_action">说书人动作</option>
                    <option value="info">信息</option>
                    <option value="player_speech">发言</option>
                    <option value="nomination">提名</option>
                    <option value="execution">处决</option>
                    <option value="attack">攻击</option>
                    <option value="death">死亡</option>
                    <option value="comment">复盘</option>
                    <option value="custom">自定义</option>
                  </Select>
                  <Field label="投票">
                    <TextInput
                      className="w-16"
                      value={log.votes ?? ''}
                      placeholder="如 7:3"
                      onChange={(e) => updateLog(ph.id, log.id, { votes: e.target.value || undefined })}
                    />
                  </Field>
                  <Field label="标签">
                    <TextInput
                      className="w-20"
                      value={log.customTag ?? ''}
                      placeholder="自曝/对跳"
                      onChange={(e) => updateLog(ph.id, log.id, { customTag: e.target.value || undefined })}
                    />
                  </Field>
                  {log.type === 'custom' && (
                    <Field label="自定义类型名">
                      <TextInput
                        className="w-24"
                        value={log.typeLabel ?? ''}
                        placeholder="类型名"
                        onChange={(e) => updateLog(ph.id, log.id, { typeLabel: e.target.value || undefined })}
                      />
                    </Field>
                  )}
                  <button onClick={() => removeLog(ph.id, log.id)} className="ml-auto rounded p-1 text-abyss-700 hover:bg-evil/10 hover:text-evil">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {/* 第二行：内容整行 */}
                <Field label="内容">
                  <TextInput
                    className="w-full"
                    value={log.content}
                    onChange={(e) => updateLog(ph.id, log.id, { content: e.target.value })}
                  />
                </Field>
              </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ============ 扩展：传奇/奇遇角色 + 统一改名 + 说书人手记 ============ */
function ExtrasTab() {
  const script = useReplayStore((s) => s.script)
  const replay = useReplayStore((s) => s.replay)
  const setAlias = useReplayStore((s) => s.setAlias)
  const updateSpecialRoles = useReplayStore((s) => s.updateSpecialRoles)
  const setReplay = useReplayStore((s) => s.setReplay)

  const aliases = replay.characterAliases ?? {}
  const roles = replay.specialRoles ?? []
  const sections = replay.customSections ?? []

  // 收集复盘里出现过的所有角色名，用于统一改名
  const names = useMemo(() => {
    const set = new Set<string>()
    script.forEach((c) => set.add(c.name))
    replay.initialPlayers.forEach((p) => {
      if (p.realCharacter) set.add(p.realCharacter)
      if (p.fakeCharacter) set.add(p.fakeCharacter)
    })
    replay.evilSetup.demonBluffs.forEach((b) => set.add(b))
    replay.evilSetup.lunaticBluffs?.forEach((b) => set.add(b))
    replay.evilSetup.customBluffs?.forEach((c) => set.add(c.characterName))
    replay.phases.forEach((ph) => ph.logs.forEach((l) => l.characterName && set.add(l.characterName)))
    return Array.from(set).filter(Boolean)
  }, [script, replay])

  const addRole = (category: 'fabled' | 'traveler', name: string, nameEn: string) => {
    updateSpecialRoles([...roles, { id: nextId(`special-${category}`), category, name, nameEn }])
  }
  const removeRole = (id: string) => updateSpecialRoles(roles.filter((r) => r.id !== id))
  const renameRole = (id: string, name: string) => updateSpecialRoles(roles.map((r) => (r.id === id ? { ...r, name } : r)))

  const updateSection = (i: number, p: Partial<{ title: string; content: string }>) =>
    setReplay({ ...replay, customSections: sections.map((s, idx) => (idx === i ? { ...s, ...p } : s)) })
  const addSection = () => setReplay({ ...replay, customSections: [...sections, { title: '新章节', content: '' }] })
  const removeSection = (i: number) => setReplay({ ...replay, customSections: sections.filter((_, idx) => idx !== i) })
  const moveSection = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= sections.length) return
    const next = [...sections]
    ;[next[i], next[j]] = [next[j], next[i]]
    setReplay({ ...replay, customSections: next })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 字体设置 */}
      <section className="flex flex-col gap-3">
        <h3 className="label-caps">字体设置</h3>
        <p className="text-[11px] text-abyss-700">中文默认宋体，英文/数字默认 Times New Roman；可分别调整。</p>
        <Field label="中文字体">
          <Select
            value={replay.fontSettings?.cn ?? ''}
            onChange={(e) =>
              setReplay({ ...replay, fontSettings: { ...replay.fontSettings, cn: e.target.value || undefined } })
            }
          >
            <option value="">宋体（默认）</option>
            <option value="'PingFang SC','Heiti SC','Microsoft YaHei',sans-serif">黑体</option>
            <option value="'Kaiti SC','STKaiti','KaiTi',serif">楷体</option>
            <option value="'FangSong','STFangsong',serif">仿宋</option>
            <option value="'Microsoft YaHei','PingFang SC',sans-serif">微软雅黑</option>
          </Select>
        </Field>
        <Field label="英文 / 数字字体">
          <Select
            value={replay.fontSettings?.latin ?? ''}
            onChange={(e) =>
              setReplay({ ...replay, fontSettings: { ...replay.fontSettings, latin: e.target.value || undefined } })
            }
          >
            <option value="">Times New Roman（默认）</option>
            <option value="'Georgia',serif">Georgia</option>
            <option value="'Arial','Helvetica',sans-serif">Arial</option>
            <option value="'Courier New','Courier',monospace">Courier New</option>
            <option value="'Palatino Linotype','Book Antiqua',serif">Palatino</option>
          </Select>
        </Field>
      </section>

      {/* 传奇 / 奇遇角色 */}
      <section className="flex flex-col gap-3">
        <h3 className="label-caps">传奇角色（Fabled）</h3>
        {roles.filter((r) => r.category === 'fabled').map((r) => (
          <div key={r.id} className="flex items-center gap-2">
            <TextInput value={r.name} onChange={(e) => renameRole(r.id, e.target.value)} className="flex-1" />
            <span className="text-[10px] text-abyss-700">{r.nameEn}</span>
            <button onClick={() => removeRole(r.id)} className="rounded p-1.5 text-abyss-700 hover:bg-evil/10 hover:text-evil"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        ))}
        <AddRoleSelect category="fabled" added={roles.filter((r) => r.category === 'fabled').map((r) => r.nameEn ?? r.name)} onAdd={addRole} />

        <h3 className="label-caps mt-2">奇遇角色（Traveler）</h3>
        {roles.filter((r) => r.category === 'traveler').map((r) => (
          <div key={r.id} className="flex items-center gap-2">
            <TextInput value={r.name} onChange={(e) => renameRole(r.id, e.target.value)} className="flex-1" />
            <span className="text-[10px] text-abyss-700">{r.nameEn}</span>
            <button onClick={() => removeRole(r.id)} className="rounded p-1.5 text-abyss-700 hover:bg-evil/10 hover:text-evil"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        ))}
        <AddRoleSelect category="traveler" added={roles.filter((r) => r.category === 'traveler').map((r) => r.nameEn ?? r.name)} onAdd={addRole} />
      </section>

      {/* 统一改名 */}
      <section className="flex flex-col gap-3">
        <h3 className="label-caps">角色统一改名（显示名，全局生效）</h3>
        <p className="text-[11px] text-abyss-700">修改显示名后，时间线、魔典、伪装架中的该角色名将统一更新；图标仍按原角色名匹配。</p>
        {names.length === 0 && <p className="text-xs text-abyss-700">暂无角色</p>}
        {names.map((name) => (
          <div key={name} className="flex items-center gap-2">
            <span className="w-24 shrink-0 truncate text-xs font-semibold" style={{ color: teamColor(script.find((c) => c.name === name)?.team ?? 'unknown') }} title={name}>{name}</span>
            <span className="text-abyss-700">→</span>
            <TextInput
              value={aliases[name] ?? ''}
              placeholder={name}
              onChange={(e) => setAlias(name, e.target.value)}
            />
          </div>
        ))}
      </section>

      {/* 说书人复盘手记 */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="label-caps">说书人复盘手记</h3>
          <button onClick={addSection} className="flex items-center gap-1 rounded-md border border-brass-700/50 px-2.5 py-1.5 text-xs font-semibold text-brass-300 hover:bg-brass-500/10">
            <Plus className="h-3.5 w-3.5" /> 添加章节
          </button>
        </div>
        {sections.map((s, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-lg border border-abyss-800 bg-abyss-900/50 p-3">
            <div className="flex items-center gap-2">
              <TextInput value={s.title} onChange={(e) => updateSection(i, { title: e.target.value })} className="flex-1" />
              <button onClick={() => moveSection(i, -1)} className="rounded p-1 text-abyss-700 hover:text-brass-300"><ArrowUp className="h-3.5 w-3.5" /></button>
              <button onClick={() => moveSection(i, 1)} className="rounded p-1 text-abyss-700 hover:text-brass-300"><ArrowDown className="h-3.5 w-3.5" /></button>
              <button onClick={() => removeSection(i)} className="rounded p-1 text-abyss-700 hover:bg-evil/10 hover:text-evil"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
            <TextArea rows={3} value={s.content} onChange={(e) => updateSection(i, { content: e.target.value })} />
          </div>
        ))}
      </section>
    </div>
  )
}

function AddRoleSelect({
  category,
  added,
  onAdd,
}: {
  category: 'fabled' | 'traveler'
  added: string[]
  onAdd: (category: 'fabled' | 'traveler', name: string, nameEn: string) => void
}) {
  const catalog = category === 'fabled' ? FABLED_CATALOG : TRAVELER_CATALOG
  const available = catalog.filter((c) => !added.includes(c.nameEn))
  return (
    <select
      className="input-dark"
      value=""
      onChange={(e) => {
        const hit = catalog.find((c) => c.id === e.target.value)
        if (hit) onAdd(category, hit.name, hit.nameEn)
      }}
    >
      <option value="" disabled>+ 添加{category === 'fabled' ? '传奇' : '奇遇'}角色</option>
      {available.map((c) => (
        <option key={c.id} value={c.id}>{c.name} · {c.nameEn}</option>
      ))}
    </select>
  )
}

/* ============ 导入导出 ============ */
function DataTab() {
  const replay = useReplayStore((s) => s.replay)
  const importJSON = useReplayStore((s) => s.importJSON)
  const reset = useReplayStore((s) => s.reset)
  const screenshot = useReplayStore((s) => s.screenshot)
  const setScreenshot = useReplayStore((s) => s.setScreenshot)
  const [message, setMessage] = useState<string>('')
  const jsonText = useMemo(() => JSON.stringify(replay, null, 2), [replay])

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const ok = importJSON(String(reader.result))
      setMessage(ok ? '✅ 导入成功' : '❌ 导入失败：JSON 格式无效')
    }
    reader.readAsText(file)
  }

  const handleScreenshot = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => setScreenshot(String(reader.result))
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => downloadJSON(replay, '复盘数据')} className="flex items-center gap-1.5 rounded-md border border-brass-600/60 bg-brass-500/10 px-3 py-2 text-sm font-semibold text-brass-200 hover:bg-brass-500/20">
          <Download className="h-4 w-4" /> 导出 JSON
        </button>
        <label className="flex cursor-pointer items-center gap-1.5 rounded-md border border-abyss-700 px-3 py-2 text-sm font-semibold text-abyss-700 hover:bg-abyss-850">
          <Upload className="h-4 w-4" /> 导入 JSON
          <input type="file" accept=".json" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </label>
        <button onClick={reset} className="flex items-center gap-1.5 rounded-md border border-abyss-700 px-3 py-2 text-sm font-semibold text-abyss-700 hover:bg-abyss-850">
          <RotateCcw className="h-4 w-4" /> 恢复示例
        </button>
      </div>
      {message && <p className="text-sm text-brass-200">{message}</p>}

      {/* 可选：复盘截图上传 */}
      <div className="rounded-lg border border-abyss-800 bg-abyss-900/50 p-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="label-caps">复盘截图（可选，附于长图）</h3>
          <label className="flex cursor-pointer items-center gap-1.5 rounded-md border border-abyss-700 px-2.5 py-1.5 text-xs font-semibold text-abyss-700 hover:bg-abyss-850">
            <ImageIcon className="h-3.5 w-3.5" /> 上传截图
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleScreenshot(e.target.files[0])} />
          </label>
        </div>
        {screenshot ? (
          <div className="relative">
            <img src={screenshot} alt="复盘截图" className="max-h-48 w-full rounded-md object-contain" />
            <button onClick={() => setScreenshot(null)} className="absolute right-1.5 top-1.5 rounded bg-abyss-950/80 p-1 text-abyss-700 hover:text-evil">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <p className="text-xs text-abyss-700">未上传截图</p>
        )}
      </div>

      <RecognizeModule />

      <div className="flex flex-col gap-2">
        <h3 className="label-caps">当前数据（可直接编辑后复制）</h3>
        <textarea
          className="h-[320px] w-full resize-y rounded-lg border border-abyss-800 bg-abyss-950/70 p-3 font-mono text-xs leading-relaxed text-brass-100 outline-none focus:border-brass-500/60"
          value={jsonText}
          spellCheck={false}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value)
              useReplayStore.getState().setReplay(parsed)
              setMessage('')
            } catch {
              setMessage('JSON 语法错误')
            }
          }}
        />
      </div>
    </div>
  )
}

/* ============ 识图载入：图片 / 链接 → 复盘内容 ============ */
const RECOGNIZE_CONFIG_KEY = 'botc-recognize-config'

function loadVisionConfig(): VisionConfig {
  try {
    const raw = localStorage.getItem(RECOGNIZE_CONFIG_KEY)
    if (raw) {
      const p = JSON.parse(raw) as Partial<VisionConfig>
      return { baseUrl: p.baseUrl || 'https://api.openai.com/v1', apiKey: p.apiKey || '', model: p.model || 'gpt-4o' }
    }
  } catch {
    /* ignore */
  }
  return { baseUrl: 'https://api.openai.com/v1', apiKey: '', model: 'gpt-4o' }
}

function RecognizeModule() {
  const importJSON = useReplayStore((s) => s.importJSON)
  const [autoLoad, setAutoLoad] = useState(true) // 是否载入：识别成功后自动载入复盘内容
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [config, setConfig] = useState<VisionConfig>(loadVisionConfig)
  const [showConfig, setShowConfig] = useState(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [rawResult, setRawResult] = useState('')

  const persistConfig = (c: VisionConfig) => {
    setConfig(c)
    try {
      localStorage.setItem(RECOGNIZE_CONFIG_KEY, JSON.stringify(c))
    } catch {
      /* ignore */
    }
  }

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      setImageDataUrl(String(reader.result))
      setRawResult('')
      setStatus('')
    }
    reader.readAsDataURL(file)
  }

  const handleRecognize = async () => {
    if (!imageDataUrl && !imageUrl.trim()) {
      setStatus('⚠️ 请先上传图片或填写图片链接')
      return
    }
    if (!config.apiKey.trim()) {
      setStatus('⚠️ 请先在「接口配置」中填写 API Key')
      setShowConfig(true)
      return
    }
    setBusy(true)
    setStatus('识别中…')
    try {
      const text = await recognizeReplayImage(
        { dataUrl: imageDataUrl ?? undefined, url: imageUrl.trim() || undefined },
        config,
      )
      const jsonStr = extractJSON(text)
      setRawResult(jsonStr)
      if (autoLoad) {
        const ok = importJSON(jsonStr)
        setStatus(ok ? '✅ 识别成功，复盘内容已载入，可在左侧各标签中继续修改' : '❌ 识别文本无法解析为复盘 JSON，已保留原始结果供检查')
      } else {
        setStatus('✅ 识别完成（未自动载入），结果见下方，可手动复制或调整')
      }
    } catch (e) {
      setStatus(`❌ ${e instanceof Error ? e.message : '识别失败'}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-lg border border-abyss-800 bg-abyss-900/50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="label-caps">识图载入（图片 / 链接 → 复盘内容）</h3>
        <button
          onClick={() => setShowConfig((v) => !v)}
          className="flex items-center gap-1 rounded-md border border-abyss-700 px-2 py-1 text-xs font-semibold text-abyss-700 hover:bg-abyss-850"
        >
          <ChevronDown className={`h-3.5 w-3.5 transition ${showConfig ? 'rotate-180' : ''}`} /> 接口配置
        </button>
      </div>

      {showConfig && (
        <div className="mb-3 flex flex-col gap-2 rounded-md border border-abyss-800 bg-abyss-950/50 p-2">
          <Field label="接口地址（OpenAI 兼容）">
            <TextInput value={config.baseUrl} placeholder="https://api.openai.com/v1" onChange={(e) => persistConfig({ ...config, baseUrl: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="API Key">
              <TextInput type="password" value={config.apiKey} placeholder="sk-…" onChange={(e) => persistConfig({ ...config, apiKey: e.target.value })} />
            </Field>
            <Field label="模型（需支持视觉）">
              <TextInput value={config.model} placeholder="gpt-4o" onChange={(e) => persistConfig({ ...config, model: e.target.value })} />
            </Field>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex cursor-pointer items-center gap-1.5 rounded-md border border-abyss-700 px-2.5 py-1.5 text-xs font-semibold text-abyss-700 hover:bg-abyss-850">
            <ImageIcon className="h-3.5 w-3.5" /> 上传图片
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          </label>
          <div className="flex min-w-0 flex-1 items-center gap-1">
            <Link2 className="h-3.5 w-3.5 shrink-0 text-abyss-700" />
            <TextInput className="flex-1" value={imageUrl} placeholder="或粘贴图片链接 https://…" onChange={(e) => setImageUrl(e.target.value)} />
          </div>
        </div>

        {imageDataUrl && (
          <div className="relative">
            <img src={imageDataUrl} alt="待识别图片" className="max-h-40 w-full rounded-md object-contain" />
            <button onClick={() => setImageDataUrl(null)} className="absolute right-1.5 top-1.5 rounded bg-abyss-950/80 p-1 text-abyss-700 hover:text-evil">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex cursor-pointer items-center gap-1.5 text-xs text-abyss-700">
            <input type="checkbox" checked={autoLoad} onChange={(e) => setAutoLoad(e.target.checked)} className="h-3.5 w-3.5 accent-brass-500" />
            是否载入（识别成功后自动载入复盘内容）
          </label>
          <button
            onClick={handleRecognize}
            disabled={busy}
            className="ml-auto flex items-center gap-1.5 rounded-md border border-brass-600/60 bg-brass-500/10 px-3 py-1.5 text-sm font-semibold text-brass-200 hover:bg-brass-500/20 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
            {busy ? '识别中…' : '识别并载入'}
          </button>
        </div>

        {status && <p className="text-xs text-brass-200">{status}</p>}

        {rawResult && (
          <textarea
            className="h-40 w-full resize-y rounded-md border border-abyss-800 bg-abyss-950/70 p-2 font-mono text-xs leading-relaxed text-brass-100 outline-none"
            value={rawResult}
            spellCheck={false}
            readOnly={autoLoad}
            onChange={(e) => setRawResult(e.target.value)}
            placeholder="识别结果（JSON）"
          />
        )}
        {rawResult && !autoLoad && (
          <button
            onClick={() => setStatus(importJSON(rawResult) ? '✅ 已手动载入复盘内容' : '❌ 解析失败，请检查 JSON')}
            className="flex items-center gap-1.5 rounded-md border border-abyss-700 px-2.5 py-1.5 text-xs font-semibold text-abyss-700 hover:bg-abyss-850"
          >
            <Upload className="h-3.5 w-3.5" /> 手动载入该 JSON
          </button>
        )}
      </div>
    </div>
  )
}
