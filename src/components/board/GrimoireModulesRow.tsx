import { useState, type ReactNode } from 'react'
import { ScrollText, Star, Compass, Eye, Sparkles, Plus, X } from 'lucide-react'
import type { EvilSetupInfo, ScriptCharacter, SpecialRoleEntry } from '../../types'
import { teamOf, characterImage, displayName } from '../../lib/script'
import {
  specialImage,
  specialColor,
  FABLED_CATALOG,
  TRAVELER_CATALOG,
  type SpecialCatalogItem,
} from '../../lib/special'
import { useReplayStore, nextId } from '../../store'
import { useEditable } from '../editable/editMode'
import { EditableText } from '../editable/Editable'
import CharacterIcon from './CharacterIcon'

// 三个模块默认显隐：恶魔伪装、传奇角色默认显示；奇遇角色默认不显示（可手动添加）
const MODULE_DEFAULTS = { bluffs: true, fabled: true, traveler: false } as const
type ModuleKey = keyof typeof MODULE_DEFAULTS

// 魔典下方：恶魔伪装靠左、传奇角色靠右、奇遇角色在传奇右侧
// 角色均为「圆形 token 在上、名称在下」的横向并排排列，模块不强制占满整行
export default function GrimoireModulesRow({
  evilSetup,
  charMap,
  aliases,
}: {
  evilSetup: EvilSetupInfo
  charMap?: Map<string, ScriptCharacter>
  aliases?: Record<string, string>
}) {
  const editable = useEditable()
  const modules = useReplayStore((s) => s.replay.modules) ?? {}
  const mods = { ...MODULE_DEFAULTS, ...modules }
  const roles = useReplayStore((s) => s.replay.specialRoles) ?? []
  const setMods = (patch: Partial<Record<ModuleKey, boolean>>) =>
    useReplayStore.getState().updateModules(patch)

  const fabled = roles.filter((r) => r.category === 'fabled')
  const traveler = roles.filter((r) => r.category === 'traveler')

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-start gap-6">
        {mods.bluffs && (
          <div className="min-w-0">
            <BluffsModule evilSetup={evilSetup} charMap={charMap} aliases={aliases} onRemove={() => setMods({ bluffs: false })} />
          </div>
        )}
        <div className="ml-auto flex shrink-0 items-start gap-4">
          {mods.fabled && (
            <SpecialModule category="fabled" items={fabled} onRemove={() => setMods({ fabled: false })} />
          )}
          {mods.traveler && (
            <SpecialModule category="traveler" items={traveler} onRemove={() => setMods({ traveler: false })} />
          )}
        </div>
      </div>

      {/* 已删除模块的恢复按钮（仅编辑模式） */}
      {editable && (!mods.bluffs || !mods.fabled || !mods.traveler) && (
        <div className="flex flex-wrap gap-2">
          {!mods.bluffs && <RestoreButton label="恶魔伪装" onClick={() => setMods({ bluffs: true })} />}
          {!mods.fabled && <RestoreButton label="传奇角色" onClick={() => setMods({ fabled: true })} />}
          {!mods.traveler && <RestoreButton label="奇遇角色" onClick={() => setMods({ traveler: true })} />}
        </div>
      )}
    </div>
  )
}

function RestoreButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 rounded-md border border-dashed border-abyss-700 px-2.5 py-1 text-[11px] font-semibold text-abyss-700 transition hover:border-brass-500/60 hover:text-brass-300"
    >
      <Plus className="h-3 w-3" /> 添加{label}模块
    </button>
  )
}

// 通用模块卡片：标题 + 删除按钮 + 内容（内容按内容自适应宽度，不强制占满）
function ModuleCard({
  title,
  sub,
  icon: Icon,
  color,
  onRemove,
  children,
}: {
  title: string
  sub?: string
  icon: typeof ScrollText
  color: string
  onRemove: () => void
  children: ReactNode
}) {
  const editable = useEditable()
  return (
    <div
      className="relative h-full overflow-hidden rounded-xl border"
      style={{ borderColor: `${color}44`, background: 'rgba(13,17,23,0.6)' }}
    >
      <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 85% 10%, ${color}22, transparent 45%)` }} />
      <div className="relative z-10 flex h-full flex-col gap-3 p-3.5">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 shrink-0" style={{ color }} />
          <span className="font-display text-sm font-bold tracking-[0.12em]" style={{ color: '#EBD28A' }}>
            {title}
          </span>
          {sub && <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: `${color}cc` }}>{sub}</span>}
          {editable && (
            <button
              onClick={onRemove}
              className="ml-auto rounded p-1 text-abyss-700 transition hover:bg-evil/10 hover:text-evil"
              title="删除此模块"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  )
}

// ============ 恶魔伪装模块：三伪装横向并排，圆形 token 在上、名称在下 ============
function BluffsModule({
  evilSetup,
  charMap,
  aliases,
  onRemove,
}: {
  evilSetup: EvilSetupInfo
  charMap?: Map<string, ScriptCharacter>
  aliases?: Record<string, string>
  onRemove: () => void
}) {
  const editable = useEditable()
  const bluffs = evilSetup.demonBluffs ?? []
  const setBluff = (index: number, name: string) => {
    const next = [...bluffs]
    next[index] = name
    useReplayStore.getState().updateEvilSetup({ demonBluffs: next })
  }
  const addBluff = () => useReplayStore.getState().updateEvilSetup({ demonBluffs: [...bluffs, '新伪装'] })
  const removeBluff = (index: number) =>
    useReplayStore.getState().updateEvilSetup({ demonBluffs: bluffs.filter((_, i) => i !== index) })

  return (
    <ModuleCard title="恶魔伪装" sub="BLUFFS" icon={ScrollText} color="#C9A227" onRemove={onRemove}>
      <div className="flex flex-wrap items-start gap-4">
        {bluffs.map((b, i) => (
          <div key={i} className="group/bluff flex w-16 flex-col items-center gap-1.5">
            <CharacterIcon
              name={displayName(b, aliases)}
              image={characterImage(charMap, b)}
              team={teamOf(charMap, b)}
              size={52}
            />
            <div className="relative flex w-full justify-center">
              <EditableText
                value={b}
                displayValue={displayName(b, aliases)}
                onChange={(v) => setBluff(i, v)}
                disabled={!editable}
                className="w-full truncate text-center text-xs font-semibold text-white"
              />
              {editable && (
                <button
                  onClick={() => removeBluff(i)}
                  className="absolute -right-1 -top-2 hidden rounded-full bg-evil p-0.5 text-white group-hover/bluff:flex"
                  title="删除伪装"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              )}
            </div>
          </div>
        ))}

        {editable && (
          <button
            onClick={addBluff}
            className="flex h-[52px] w-16 flex-col items-center justify-center gap-1 rounded-full border border-dashed border-abyss-700 text-abyss-700 transition hover:border-brass-500/60 hover:text-brass-300"
            title="额外添加伪装"
          >
            <Plus className="h-4 w-4" />
            <span className="text-[10px] leading-none">伪装</span>
          </button>
        )}
      </div>

      {/* 互认补充（三并排下方） */}
      {evilSetup.lunaticBluffs && evilSetup.lunaticBluffs.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-white/90">
          <Sparkles className="h-3 w-3 shrink-0 text-brass-500" />
          <span className="font-semibold text-brass-200">狂人所见：</span>
          <span className="truncate">{evilSetup.lunaticBluffs.map((n) => displayName(n, aliases)).join('、')}</span>
        </div>
      )}

      {evilSetup.evilKnowledgeNotes && (
        <div className="flex items-start gap-1.5 rounded-md border px-2.5 py-1.5" style={{ borderColor: 'rgba(201,162,39,0.2)', background: 'rgba(13,17,23,0.5)' }}>
          <Eye className="mt-0.5 h-3 w-3 shrink-0 text-brass-500" />
          <EditableText
            value={evilSetup.evilKnowledgeNotes}
            onChange={(v) => useReplayStore.getState().updateEvilSetup({ evilKnowledgeNotes: v })}
            disabled={!editable}
            className="text-xs leading-relaxed text-white/90"
          />
        </div>
      )}
    </ModuleCard>
  )
}

// ============ 传奇角色 / 奇遇角色模块：横向并排，圆形 token 在上、名称在下 ============
function SpecialModule({
  category,
  items,
  onRemove,
}: {
  category: SpecialRoleEntry['category']
  items: SpecialRoleEntry[]
  onRemove: () => void
}) {
  const editable = useEditable()
  const [open, setOpen] = useState(false)
  const col = specialColor(category)
  const roles = useReplayStore((s) => s.replay.specialRoles) ?? []
  const update = (list: SpecialRoleEntry[]) => useReplayStore.getState().updateSpecialRoles(list)

  const rename = (id: string, name: string) => update(roles.map((r) => (r.id === id ? { ...r, name } : r)))
  const remove = (id: string) => update(roles.filter((r) => r.id !== id))
  const add = (item: SpecialCatalogItem) =>
    update([...roles, { id: nextId(`special-${category}`), category, name: item.name, nameEn: item.nameEn }])

  const catalog = category === 'fabled' ? FABLED_CATALOG : TRAVELER_CATALOG
  const available = catalog.filter((c) => !items.some((it) => (it.nameEn && it.nameEn === c.nameEn) || it.name === c.name))
  const isFabled = category === 'fabled'

  return (
    <ModuleCard
      title={isFabled ? '传奇角色' : '奇遇角色'}
      sub={isFabled ? 'FABLED' : 'TRAVELER'}
      icon={isFabled ? Star : Compass}
      color={col}
      onRemove={onRemove}
    >
      <div className="flex flex-wrap items-start gap-4">
        {items.length === 0 && (
          <p className="rounded-md border border-dashed border-abyss-700 px-3 py-4 text-center text-xs text-abyss-700">
            {editable ? '点击下方添加角色' : '未启用'}
          </p>
        )}
        {items.map((r) => (
          <div key={r.id} className="group/role flex w-16 flex-col items-center gap-1.5">
            <CharacterIcon name={r.name} image={specialImage(r)} team="unknown" size={52} ringColor={col} shape="circle" />
            <div className="relative flex w-full flex-col items-center">
              <EditableText
                value={r.name}
                onChange={(v) => rename(r.id, v)}
                disabled={!editable}
                className="w-full truncate text-center text-xs font-semibold"
                style={{ color: '#c3cde0' }}
              />
              {r.nameEn && <span className="truncate text-center text-[10px] uppercase tracking-wide text-abyss-700">{r.nameEn}</span>}
              {editable && (
                <button
                  onClick={() => remove(r.id)}
                  className="absolute -right-1 -top-2 hidden rounded-full bg-evil p-0.5 text-white group-hover/role:flex"
                  title="删除角色"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              )}
            </div>
          </div>
        ))}

        {editable && (
          <div>
            {open ? (
              <select
                autoFocus
                className="editable-input"
                defaultValue=""
                onChange={(e) => {
                  const hit = catalog.find((c) => c.id === e.target.value)
                  if (hit) add(hit)
                  setOpen(false)
                }}
                onBlur={() => setOpen(false)}
              >
                <option value="" disabled>选择要添加的角色…</option>
                {available.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} · {c.nameEn}</option>
                ))}
              </select>
            ) : (
              <button
                onClick={() => setOpen(true)}
                className="flex h-[52px] w-16 flex-col items-center justify-center gap-1 rounded-full border border-dashed text-abyss-700 transition hover:border-brass-500/60 hover:text-brass-300"
                style={{ borderColor: `${col}55`, color: col }}
                title={`添加${isFabled ? '传奇' : '奇遇'}角色`}
              >
                <Plus className="h-4 w-4" />
                <span className="text-[10px] leading-none">添加</span>
              </button>
            )}
          </div>
        )}
      </div>
    </ModuleCard>
  )
}
