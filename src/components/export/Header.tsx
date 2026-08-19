import { Crown, Shield, Skull, Star, Plus, X, BookOpen, Sparkles } from 'lucide-react'
import type { BotCReplayRecord } from '../../types'
import { useReplayStore } from '../../store'
import { useEditable } from '../editable/editMode'
import { EditableText } from '../editable/Editable'
import { proxiedImage } from '../../lib/script'
import { useTheme } from '../../lib/theme'

const WINNER_META = {
  good: { label: '善良阵营获胜', color: '#4F86C6', bg: 'rgba(79,134,198,0.14)', Icon: Shield },
  evil: { label: '邪恶阵营获胜', color: '#B23A48', bg: 'rgba(178,58,72,0.14)', Icon: Skull },
  storyteller: { label: '说书人获胜', color: '#C9A227', bg: 'rgba(201,162,39,0.14)', Icon: BookOpen },
  custom: { label: '自定义', color: '#9C8CC4', bg: 'rgba(156,140,196,0.14)', Icon: Sparkles },
} as const

export default function Header({ replay }: { replay: BotCReplayRecord }) {
  const editable = useEditable()
  const theme = useTheme()
  const updateMeta = useReplayStore((s) => s.updateMeta)
  const updateScript = useReplayStore((s) => s.updateScript)
  const { meta, scriptMeta } = replay
  const isCustom = meta.winner === 'custom'
  const w = WINNER_META[meta.winner] ?? WINNER_META.good
  const WinnerIcon = w.Icon
  const winnerLabel = isCustom ? (meta.winnerCustom?.trim() || '自定义') : w.label
  // 标题渲染：有 logo 字段默认用 logo，可切换为文字；无 logo 用文字
  const hasLogo = !!scriptMeta.logo
  const titleMode = meta.titleMode ?? (hasLogo ? 'logo' : 'text')
  const showLogoTitle = hasLogo && titleMode === 'logo'

  return (
    <div className="relative overflow-hidden rounded-2xl border border-brass-700/50 bg-night-hall">
      {/* 氛围光 */}
      <div className="pointer-events-none absolute inset-0 bg-ember-radial" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 120%, rgba(201,162,39,0.14), transparent 50%), radial-gradient(circle at 90% -10%, rgba(74,91,147,0.18), transparent 55%)',
        }}
      />

      {/* 顶部装饰线 */}
      <div className="absolute inset-x-0 top-0 flex h-1">
        <span className="flex-1 bg-gradient-to-r from-transparent via-brass-500 to-transparent opacity-70" />
      </div>

      <div className="relative z-10 flex flex-col gap-5 p-7">
        {/* 标题行 */}
        {showLogoTitle ? (
          <div className="relative flex items-center justify-center py-1">
            <div className="flex items-center gap-3">
              <img src={proxiedImage(scriptMeta.logo)} alt="logo" draggable={false} className="h-20 max-w-[420px] object-contain" />
              {editable && (
                <button
                  onClick={() => updateMeta({ titleMode: 'text' })}
                  className="rounded border border-brass-700/50 px-1.5 py-0.5 text-[10px] text-abyss-700 hover:text-brass-300"
                  title="改用文字标题"
                >
                  文字
                </button>
              )}
            </div>
            {/* 胜负徽章（logo 模式右下，不挤占居中） */}
            <div
              className="absolute right-0 top-1/2 flex shrink-0 -translate-y-1/2 flex-col items-center gap-1 rounded-xl border px-5 py-3"
              style={{ background: w.bg, borderColor: `${w.color}66`, boxShadow: `0 0 24px ${w.color}33` }}
            >
              <WinnerIcon className="h-5 w-5" style={{ color: w.color }} />
              <span className="font-display text-sm font-bold tracking-widest" style={{ color: w.color }}>
                {winnerLabel}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full border bg-abyss-900" style={{ borderColor: `${theme.accent}66`, boxShadow: `0 0 14px ${theme.accent}44` }}>
                <Crown className="h-5 w-5" style={{ color: theme.accent }} />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <EditableText
                    value={meta.title}
                    onChange={(v) => updateMeta({ title: v })}
                    disabled={!editable}
                    className="block font-display text-3xl font-bold leading-tight"
                    style={{ color: theme.accentSoft }}
                  />
                  {editable && hasLogo && (
                    <button
                      onClick={() => updateMeta({ titleMode: 'logo' })}
                      className="rounded border border-brass-700/50 px-1.5 py-0.5 text-[10px] text-abyss-700 hover:text-brass-300"
                      title="改用 Logo 标题"
                    >
                      Logo
                    </button>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-abyss-700">
                  <EditableText
                    value={scriptMeta.scriptName}
                    onChange={(v) => updateScript({ scriptName: v })}
                    disabled={!editable}
                    className="rounded border border-brass-700/50 bg-abyss-900/60 px-2 py-0.5 font-serif text-brass-300/90"
                  />
                  {scriptMeta.author && (
                    <EditableText
                      value={scriptMeta.author}
                      onChange={(v) => updateScript({ author: v })}
                      disabled={!editable}
                      className="text-abyss-700"
                    />
                  )}
                  {scriptMeta.version && <span className="font-serif text-abyss-700">v{scriptMeta.version}</span>}
                </div>
              </div>
            </div>

            {/* 胜负徽章 */}
            <div
              className="flex shrink-0 flex-col items-center gap-1 rounded-xl border px-5 py-3"
              style={{ background: w.bg, borderColor: `${w.color}66`, boxShadow: `0 0 24px ${w.color}33` }}
            >
              <WinnerIcon className="h-5 w-5" style={{ color: w.color }} />
              <span className="font-display text-sm font-bold tracking-widest" style={{ color: w.color }}>
                {winnerLabel}
              </span>
            </div>
          </div>
        )}

        {/* 元信息 */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-brass-700/30 pt-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="label-caps">说书人</span>
            <EditableText value={meta.storyteller} onChange={(v) => updateMeta({ storyteller: v })} disabled={!editable} className="text-brass-100" />
          </div>
          <div className="flex items-center gap-2">
            <span className="label-caps">日期</span>
            <EditableText value={meta.date} onChange={(v) => updateMeta({ date: v })} disabled={!editable} className="text-brass-100" />
          </div>
          {meta.mvp && meta.mvp.trim() ? (
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-brass-400" />
              <span className="label-caps">MVP</span>
              <EditableText value={meta.mvp} onChange={(v) => updateMeta({ mvp: v || undefined })} disabled={!editable} className="text-brass-100" />
              {editable && (
                <button onClick={() => updateMeta({ mvp: undefined })} className="rounded p-0.5 text-abyss-700 hover:text-evil" title="移除 MVP">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ) : editable ? (
            <button
              onClick={() => updateMeta({ mvp: 'MVP 玩家' })}
              className="flex items-center gap-1 rounded border border-dashed border-brass-700/50 px-2 py-0.5 text-xs text-abyss-700 hover:text-brass-300"
            >
              <Plus className="h-3.5 w-3.5" /> 添加 MVP
            </button>
          ) : null}
        </div>

        {/* 胜负判定 */}
        {meta.winningReason && (
          <div className="rounded-lg border border-brass-700/40 bg-abyss-900/50 px-4 py-3">
            <span className="label-caps mr-2">胜负判定</span>
            <EditableText value={meta.winningReason} onChange={(v) => updateMeta({ winningReason: v })} disabled={!editable} className="text-sm text-[#c3cde0]" />
          </div>
        )}
      </div>
    </div>
  )
}
