import { useTheme } from '../../lib/theme'

// 华丽装饰分隔线：中央菱形 + 两侧渐隐线 + 端点小钻（随主题主强调色变化）
export default function OrnateDivider({ label }: { label?: string }) {
  const theme = useTheme()
  const { accent, accentSoft } = theme
  return (
    <div className="flex items-center gap-4 py-2">
      <span className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${accent}88, ${accent})` }} />
      <span className="h-1.5 w-1.5 rotate-45 border" style={{ borderColor: accent, background: `${accent}cc` }} />
      <span
        className="h-2.5 w-2.5 rotate-45 border"
        style={{ borderColor: accentSoft, background: `linear-gradient(135deg, ${accentSoft}, ${accent})`, boxShadow: `0 0 10px ${accent}66` }}
      />
      {label && (
        <span className="font-display text-xs font-bold uppercase tracking-[0.35em]" style={{ color: accent }}>{label}</span>
      )}
      <span
        className="h-2.5 w-2.5 rotate-45 border"
        style={{ borderColor: accentSoft, background: `linear-gradient(135deg, ${accentSoft}, ${accent})`, boxShadow: `0 0 10px ${accent}66` }}
      />
      <span className="h-1.5 w-1.5 rotate-45 border" style={{ borderColor: accent, background: `${accent}cc` }} />
      <span className="h-px flex-1" style={{ background: `linear-gradient(270deg, transparent, ${accent}88, ${accent})` }} />
    </div>
  )
}
