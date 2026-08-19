import { useMemo, useState } from 'react'
import { Skull, Ghost, Plus, X } from 'lucide-react'
import type { ReplayPlayer, ScriptCharacter, BoardToken } from '../../types'
import { characterTeam, CHARACTER_CATALOG } from '../../types'
import { teamOf, teamColor, teamTextColor, characterImage, isEvil, displayName, characterReminders, type Team } from '../../lib/script'
import { makeWheelConfig, playerPosition, spokePoint, gearTeethPath, svgDefIds } from '../../lib/geometry'
import { useReplayStore, nextId } from '../../store'
import { useEditable } from '../editable/editMode'
import { EditableText, EditableSelect, EditableToggle } from '../editable/Editable'
import CharacterIcon from './CharacterIcon'

interface RadialWheelProps {
  players: ReplayPlayer[]
  alivePlayerSeats?: number[]
  charMap?: Map<string, ScriptCharacter>
  aliases?: Record<string, string>
  size?: number // 轮盘边长，默认 1120（随长图宽度缩放）
}

function aliveOf(p: ReplayPlayer, aliveSeats?: number[]): boolean {
  if (aliveSeats) return aliveSeats.includes(p.seatNumber)
  // 默认存活：isAlive 缺失（如旧数据/导入数据）时按存活处理，仅显式 false 视为死亡
  return p.isAlive !== false
}

function resolveTeam(charMap: Map<string, ScriptCharacter> | undefined, name: string): Team {
  const fromScript = teamOf(charMap, name)
  if (fromScript !== 'unknown') return fromScript
  return characterTeam(name) as Team
}

export default function RadialWheel({ players, alivePlayerSeats, charMap, aliases, size = 1120 }: RadialWheelProps) {
  const editable = useEditable()
  const [tokenEditorSeat, setTokenEditorSeat] = useState<number | null>(null)
  const cfg = makeWheelConfig(size)
  const total = players.length
  // 以 1120 为基准，随 size 等比缩放节点尺寸
  const s = size / 1120
  const nodeSize = Math.round((total <= 10 ? 104 : total <= 14 ? 92 : total <= 17 ? 78 : 68) * s)

  const nodes = useMemo(() => players.map((p, i) => playerPosition(cfg, i, total)), [players, total, cfg])

  // 角色选择选项（剧本角色 + 内置目录，去重）
  const charOptions = useMemo(() => {
    const set = new Set<string>()
    charMap?.forEach((_, name) => set.add(name))
    CHARACTER_CATALOG.forEach((c) => set.add(c.name))
    players.forEach((p) => set.add(p.realCharacter))
    return Array.from(set).map((n) => ({ label: n, value: n }))
  }, [charMap, players])

  // 在场角色（用于 token 放置，仅取有剧本信息的角色）
  const inPlayChars = useMemo(() => {
    const set = new Set<string>()
    players.forEach((p) => set.add(p.realCharacter))
    return Array.from(set).filter((n) => n && charMap?.has(n))
  }, [players, charMap])

  // Token 尺寸：约为玩家角色 token 的一半左右，随数量递减以腾出内圈空间
  const maxTokens = Math.max(0, ...players.map((p) => p.activeTokens?.length ?? 0))
  const tokRatio = maxTokens <= 2 ? 0.56 : maxTokens <= 4 ? 0.5 : maxTokens <= 6 ? 0.44 : 0.38
  const tokenSize = Math.round(nodeSize * tokRatio)

  const updatePlayer = (seat: number, patch: Partial<ReplayPlayer>) => {
    const r = useReplayStore.getState().replay
    useReplayStore.getState().setReplay({
      ...r,
      initialPlayers: r.initialPlayers.map((p) => (p.seatNumber === seat ? { ...p, ...patch } : p)),
    })
  }
  const addToken = (seat: number, token: BoardToken) => {
    const r = useReplayStore.getState().replay
    useReplayStore.getState().setReplay({
      ...r,
      initialPlayers: r.initialPlayers.map((p) =>
        p.seatNumber === seat ? { ...p, activeTokens: [...(p.activeTokens ?? []), token] } : p,
      ),
    })
  }
  const removeToken = (seat: number, tokenId: string) => {
    const r = useReplayStore.getState().replay
    useReplayStore.getState().setReplay({
      ...r,
      initialPlayers: r.initialPlayers.map((p) =>
        p.seatNumber === seat ? { ...p, activeTokens: (p.activeTokens ?? []).filter((t) => t.id !== tokenId) } : p,
      ),
    })
  }

  return (
    <div className="relative" style={{ width: cfg.size, height: cfg.size }}>
      {/* ===== SVG 层：齿轮、光环、辐射线 ===== */}
      <svg width={cfg.size} height={cfg.size} viewBox={`0 0 ${cfg.size} ${cfg.size}`} className="absolute inset-0">
        <defs>
          <radialGradient id={svgDefIds.centerGlow} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(212,175,55,0.22)" />
            <stop offset="45%" stopColor="rgba(212,175,55,0.05)" />
            <stop offset="100%" stopColor="rgba(212,175,55,0)" />
          </radialGradient>
          <linearGradient id={svgDefIds.spokeGrad} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(212,175,55,0.05)" />
            <stop offset="55%" stopColor="rgba(212,175,55,0.35)" />
            <stop offset="100%" stopColor="rgba(212,175,55,0.55)" />
          </linearGradient>
          <linearGradient id={svgDefIds.gearGrad} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EBD28A" />
            <stop offset="50%" stopColor="#C9A227" />
            <stop offset="100%" stopColor="#96690D" />
          </linearGradient>
        </defs>

        {/* 中心暖光 */}
        <circle cx={cfg.center} cy={cfg.center} r={cfg.outerRadius * 0.62} fill={`url(#${svgDefIds.centerGlow})`} />

        {/* 外环齿轮 */}
        <path
          d={gearTeethPath(cfg, 48, 15)}
          fill="rgba(201,162,39,0.10)"
          stroke="rgba(201,162,39,0.35)"
          strokeWidth={1.5}
        />
        <circle cx={cfg.center} cy={cfg.center} r={cfg.outerRadius - 17} fill="none" stroke="rgba(201,162,39,0.30)" strokeWidth={2} />
        <circle cx={cfg.center} cy={cfg.center} r={cfg.playerRadius + 46} fill="none" stroke="rgba(201,162,39,0.16)" strokeWidth={1} />

        {/* 装饰刻度环 */}
        {Array.from({ length: 60 }).map((_, i) => {
          const a = (i / 60) * Math.PI * 2
          const r1 = cfg.outerRadius - 22
          const r2 = cfg.outerRadius - 14
          return (
            <line
              key={i}
              x1={cfg.center + r1 * Math.cos(a)}
              y1={cfg.center + r1 * Math.sin(a)}
              x2={cfg.center + r2 * Math.cos(a)}
              y2={cfg.center + r2 * Math.sin(a)}
              stroke="rgba(201,162,39,0.25)"
              strokeWidth={1}
            />
          )
        })}

        {/* 辐射光丝 */}
        {nodes.map((n, i) => {
          const p = players[i]
          const dead = !aliveOf(p, alivePlayerSeats)
          const team = resolveTeam(charMap, p.realCharacter)
          const col = dead ? 'rgba(120,128,140,0.30)' : isEvil(team) ? 'rgba(192,57,43,0.55)' : 'rgba(79,134,198,0.45)'
          const inner = spokePoint(cfg, n, 0.30)
          const outer = spokePoint(cfg, n, 0.84)
          return (
            <g key={p.seatNumber}>
              <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke={col} strokeWidth={dead ? 1 : 1.6} strokeDasharray={dead ? '3 5' : undefined} opacity={0.75} />
              <circle cx={outer.x} cy={outer.y} r={2.2} fill={col} opacity={0.9} />
            </g>
          )
        })}

        {/* 中央黄铜齿轮（不标记存活人数；随轮盘尺寸等比缩放，内部小圆盘更小） */}
        <g>
          <circle cx={cfg.center} cy={cfg.center} r={118 * s} fill="rgba(13,17,23,0.85)" stroke={`url(#${svgDefIds.gearGrad})`} strokeWidth={3 * s} />
          <circle cx={cfg.center} cy={cfg.center} r={96 * s} fill="none" stroke="rgba(201,162,39,0.4)" strokeWidth={1.5 * s} />
          <circle cx={cfg.center} cy={cfg.center} r={54 * s} fill="rgba(212,175,55,0.06)" stroke="rgba(201,162,39,0.5)" strokeWidth={2 * s} />
          {Array.from({ length: 16 }).map((_, i) => {
            const a = (i / 16) * Math.PI * 2
            return (
              <line
                key={i}
                x1={cfg.center + 112 * s * Math.cos(a)}
                y1={cfg.center + 112 * s * Math.sin(a)}
                x2={cfg.center + 130 * s * Math.cos(a)}
                y2={cfg.center + 130 * s * Math.sin(a)}
                stroke={`url(#${svgDefIds.gearGrad})`}
                strokeWidth={8 * s}
                strokeLinecap="round"
              />
            )
          })}
          {Array.from({ length: 6 }).map((_, i) => {
            const a = (i / 6) * Math.PI * 2
            return (
              <line
                key={i}
                x1={cfg.center + 14 * s * Math.cos(a)}
                y1={cfg.center + 14 * s * Math.sin(a)}
                x2={cfg.center + 46 * s * Math.cos(a)}
                y2={cfg.center + 46 * s * Math.sin(a)}
                stroke="rgba(201,162,39,0.35)"
                strokeWidth={2 * s}
              />
            )
          })}
        </g>
      </svg>

      {/* ===== Token 层：圆形 token，沿辐射线置于玩家内圈（与角色图标不重叠） ===== */}
      {players.map((p, i) => {
        const n = nodes[i]
        const toks = p.activeTokens ?? []
        if (toks.length === 0) return null
        const ux = -Math.cos(n.angle)
        const uy = -Math.sin(n.angle)
        return toks.map((t, k) => {
          // 首个 token 中心距角色图标边缘留 26px（避开下方昵称模块），相邻 token 间距 = tokenSize + 10
          const d = nodeSize / 2 + tokenSize / 2 + 26 + k * (tokenSize + 10)
          const tx = n.x + ux * d
          const ty = n.y + uy * d
          const team = teamOf(charMap, t.characterName)
          const col = t.color ?? teamColor(team)
          const img = t.characterName ? characterImage(charMap, t.characterName) : t.icon
          const labelFont = Math.max(Math.round(tokenSize * 0.2), 8)
          const customFont = Math.max(Math.round(tokenSize * 0.26), 10)
          return (
            <div
              key={t.id}
              className="group/tok absolute z-30"
              style={{ left: tx - tokenSize / 2, top: ty - tokenSize / 2, width: tokenSize, height: tokenSize }}
            >
              {img ? (
                <div
                  className="flex h-full w-full flex-col items-center justify-center rounded-full"
                  style={{
                    background: isEvil(team)
                      ? 'radial-gradient(circle at 50% 30%, #3a1416 0%, #160a0c 100%)'
                      : 'radial-gradient(circle at 50% 30%, #1a2740 0%, #0a1118 100%)',
                    boxShadow: `0 0 6px ${col}66, inset 0 0 4px rgba(0,0,0,0.5)`,
                    border: `1px solid ${col}77`,
                    padding: '2px',
                  }}
                >
                  <CharacterIcon
                    name={t.characterName ?? t.label}
                    image={img}
                    team={team}
                    size={Math.round(tokenSize * 0.52)}
                    ringColor={col}
                    shape="circle"
                    bordered={false}
                  />
                  <span
                    className="mt-0 w-full text-center font-semibold"
                    style={{ color: '#f2f5f9', fontSize: labelFont, wordBreak: 'break-all', lineHeight: 1.1, textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}
                  >
                    {t.label}
                  </span>
                </div>
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center rounded-full text-center"
                  style={{ border: `2px solid ${col}`, background: 'radial-gradient(circle at 50% 35%, rgba(34,46,66,0.95) 0%, rgba(10,16,26,0.96) 100%)', boxShadow: `0 0 6px ${col}55, inset 0 0 6px rgba(0,0,0,0.5)`, padding: '3px' }}
                >
                  <span
                    className="font-bold"
                    style={{ color: '#f2f5f9', fontSize: customFont, wordBreak: 'break-all', lineHeight: 1.15, textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}
                  >
                    {t.label}
                  </span>
                </div>
              )}
              {editable && (
                <button
                  onClick={() => removeToken(p.seatNumber, t.id)}
                  className="absolute -right-0.5 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-evil text-white shadow group-hover/tok:flex"
                  title="移除 token"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          )
        })
      })}

      {/* ===== HTML 层：圆形角色肖像 + 圆内角色名 ===== */}
      {nodes.map((n, i) => {
        const p = players[i]
        const dead = !aliveOf(p, alivePlayerSeats)
        const team = resolveTeam(charMap, p.realCharacter)
        const col = teamColor(team)
        const textCol = teamTextColor(team)

        return (
          <div key={p.seatNumber} className="group absolute" style={{ left: n.x - nodeSize / 2, top: n.y - nodeSize / 2, width: nodeSize, height: nodeSize }}>
            {/* 座位号徽章（放大字号） */}
            <div
              className="absolute -top-2 left-1/2 z-20 -translate-x-1/2 rounded-full px-2 py-0.5 text-[15px] font-bold leading-none text-white"
              style={{ background: dead ? '#6b7280' : col, boxShadow: '0 1px 3px rgba(0,0,0,0.6)' }}
            >
              {p.seatNumber}
            </div>

            {/* 圆形角色肖像 + 圆内底部角色名 */}
            <EditableToggle
              checked={p.isAlive !== false}
              onChange={(v) => updatePlayer(p.seatNumber, { isAlive: v })}
              disabled={!editable}
              title={dead ? '点击复活' : '点击死亡'}
            >
              <div className="relative overflow-hidden" style={{ width: nodeSize, height: nodeSize, borderRadius: '9999px' }}>
                <CharacterIcon
                  name={displayName(p.realCharacter, aliases)}
                  image={characterImage(charMap, p.realCharacter)}
                  team={team}
                  size={nodeSize}
                  dead={dead}
                  ringColor={col}
                  shape="circle"
                />
                {/* 角色名（圆内底部，渐变过渡避免出现黑圈） */}
                <div
                  className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-center px-1 pb-1.5"
                  style={{
                    height: Math.round(nodeSize * 0.4),
                    background: 'linear-gradient(180deg, transparent 0%, rgba(6,8,12,0.88) 100%)',
                  }}
                >
                  <EditableSelect
                    value={p.realCharacter}
                    displayValue={displayName(p.realCharacter, aliases)}
                    onChange={(v) => updatePlayer(p.seatNumber, { realCharacter: v })}
                    disabled={!editable}
                    options={charOptions}
                    className="max-w-full truncate whitespace-nowrap rounded px-1 text-center font-bold leading-none"
                    style={{ color: textCol, fontSize: Math.max(nodeSize * 0.12, 11), textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}
                  />
                </div>
              </div>
            </EditableToggle>

            {/* 悬停添加 token 按钮（放大） */}
            {editable && (
              <button
                onClick={(e) => { e.stopPropagation(); setTokenEditorSeat(p.seatNumber) }}
                className="absolute -right-2.5 -top-2.5 z-30 flex h-9 w-9 items-center justify-center rounded-full border-2 border-brass-500/80 bg-abyss-950 text-brass-300 opacity-0 shadow transition group-hover:opacity-100 hover:bg-brass-500/25"
                title="添加 token"
              >
                <Plus className="h-5 w-5" />
              </button>
            )}

            {/* 死亡 / 亡魂票标记（圆内左上角） */}
            {dead && (
              <div className="absolute left-0 top-0 z-20 flex gap-0.5 rounded-full bg-abyss-950/60 p-0.5">
                <Skull className="h-3.5 w-3.5 text-abyss-700" />
                {p.hasGhostVote && <Ghost className="h-3.5 w-3.5 text-moon-400" />}
              </div>
            )}

            {/* 玩家昵称（角色下方，独立模块，单行显示） */}
            <div className="absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap" style={{ top: nodeSize + 3 }}>
              <EditableText
                value={p.name}
                onChange={(v) => updatePlayer(p.seatNumber, { name: v })}
                disabled={!editable}
                className="rounded-full px-2.5 py-1 text-[14px] font-bold leading-none"
                style={{
                  color: dead ? '#9aa3b2' : '#e6edf3',
                  background: 'rgba(13,17,23,0.88)',
                  border: `1px solid ${col}66`,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
                }}
              />
            </div>

          </div>
        )
      })}

      {/* ===== 添加 token 浮层 ===== */}
      {editable && tokenEditorSeat != null && (() => {
        const p = players.find((x) => x.seatNumber === tokenEditorSeat)
        if (!p) return null
        return (
          <div className="absolute inset-0 z-50 flex items-center justify-center" onClick={() => setTokenEditorSeat(null)}>
            <div className="absolute inset-0 bg-black/45" />
            <div
              className="relative z-10 max-h-[480px] w-[430px] overflow-auto rounded-xl border border-brass-600/60 bg-abyss-900 p-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <TokenAdder
                seat={p.seatNumber}
                playerName={p.name}
                charMap={charMap}
                inPlayChars={inPlayChars}
                onAdd={addToken}
                onClose={() => setTokenEditorSeat(null)}
              />
            </div>
          </div>
        )
      })()}
    </div>
  )
}

// 为某玩家添加 token 的面板：选择在场角色 + 其 reminders，或自定义 token
function TokenAdder({
  seat,
  playerName,
  charMap,
  inPlayChars,
  onAdd,
  onClose,
}: {
  seat: number
  playerName: string
  charMap?: Map<string, ScriptCharacter>
  inPlayChars: string[]
  onAdd: (seat: number, token: BoardToken) => void
  onClose: () => void
}) {
  const [charName, setCharName] = useState(inPlayChars[0] ?? '')
  const [custom, setCustom] = useState('')
  const reminders = characterReminders(charMap, charName)

  const addReminder = (label: string) => {
    onAdd(seat, { id: nextId('tok'), label, type: 'reminder', characterName: charName, color: teamColor(teamOf(charMap, charName)) })
    onClose()
  }
  const addCustom = () => {
    if (!custom.trim()) return
    onAdd(seat, { id: nextId('tok'), label: custom.trim(), type: 'custom', color: '#D4AF37' })
    setCustom('')
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h4 className="font-display text-sm font-bold text-brass-200">为 {seat} 号 {playerName} 添加 Token</h4>
        <button onClick={onClose} className="rounded p-1 text-abyss-700 hover:text-evil"><X className="h-4 w-4" /></button>
      </div>

      {/* 选择在场角色 */}
      {inPlayChars.length > 0 ? (
        <>
          <div>
            <span className="label-caps">选择在场角色</span>
            <select className="input-dark mt-1" value={charName} onChange={(e) => setCharName(e.target.value)}>
              {inPlayChars.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          {/* 该角色的 reminders / globals */}
          <div>
            <span className="label-caps">Reminders（{reminders.length}）</span>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {reminders.length === 0 && <span className="text-xs text-abyss-700">该角色暂无 reminders</span>}
              {reminders.map((r) => (
                <button
                  key={r}
                  onClick={() => addReminder(r)}
                  className="rounded-full border border-abyss-700 bg-abyss-950/70 px-2 py-1 text-xs font-semibold text-brass-200 transition hover:border-brass-500/60 hover:bg-brass-500/10"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </>
      ) : (
        <p className="text-xs text-abyss-700">暂无在场角色（请先在剧本中加载角色）</p>
      )}

      {/* 自定义 token */}
      <div>
        <span className="label-caps">自定义 Token</span>
        <div className="mt-1 flex items-center gap-2">
          <input
            className="input-dark flex-1"
            value={custom}
            placeholder="输入 token 名称"
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addCustom() }}
          />
          <button onClick={addCustom} className="flex items-center gap-1 rounded-md border border-brass-600/60 bg-brass-500/10 px-3 py-2 text-sm font-semibold text-brass-200 hover:bg-brass-500/20">
            <Plus className="h-3.5 w-3.5" /> 添加
          </button>
        </div>
      </div>
    </div>
  )
}
