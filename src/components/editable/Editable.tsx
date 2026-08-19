import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react'

// ============ 就地可编辑组件 ============
// 预览长图中的每个元素都可点击直接编辑，改动同步写回 zustand store（从而与左侧栏一致）。
// disabled 时（导出 / 只读模式）退化为普通文本，不带交互样式。

interface BaseProps {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  className?: string
  style?: CSSProperties
  placeholder?: string
  title?: string
  /** 非编辑状态下显示的内容（如统一改名后的显示名），编辑时仍使用 value */
  displayValue?: string
}

function useEditing(value: string, onChange: (v: string) => void) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    if (editing) {
      const el = ref.current
      el?.focus()
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) el.select()
    }
  }, [editing])
  return {
    editing,
    draft,
    setDraft,
    ref,
    begin: () => { setDraft(value); setEditing(true) },
    commit: (v: string) => { setEditing(false); onChange(v) },
    cancel: () => setEditing(false),
  }
}

const HINT = 'editable-spot'

export function EditableText({
  value, onChange, disabled, className = '', style, placeholder, title, displayValue,
}: BaseProps) {
  const { editing, draft, setDraft, ref, begin, commit, cancel } = useEditing(value, onChange)
  const shown = displayValue ?? value
  if (disabled) return <span className={className} style={style}>{shown}</span>
  if (!editing) {
    return (
      <span
        className={`${className} ${HINT}`}
        style={style}
        title={title ?? '点击编辑'}
        onClick={(e) => { e.stopPropagation(); begin() }}
      >
        {shown || <span className="opacity-40">{placeholder ?? '（点击填写）'}</span>}
      </span>
    )
  }
  return (
    <input
      ref={ref as never}
      className={`${className} editable-input`}
      style={style}
      value={draft}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => commit(draft)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.preventDefault(); commit(draft) }
        if (e.key === 'Escape') { e.stopPropagation(); cancel() }
      }}
      onClick={(e) => e.stopPropagation()}
    />
  )
}

export function EditableTextarea({
  value, onChange, disabled, className = '', style, placeholder, rows = 3,
}: BaseProps & { rows?: number }) {
  const { editing, draft, setDraft, ref, begin, commit, cancel } = useEditing(value, onChange)
  if (disabled) return <span className={className} style={style}>{value}</span>
  if (!editing) {
    return (
      <span
        className={`${className} ${HINT} block`}
        style={style}
        title="点击编辑"
        onClick={(e) => { e.stopPropagation(); begin() }}
      >
        {value || <span className="opacity-40">{placeholder ?? '（点击填写）'}</span>}
      </span>
    )
  }
  return (
    <textarea
      ref={ref as never}
      className={`${className} editable-input`}
      style={style}
      rows={rows}
      value={draft}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => commit(draft)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') { e.stopPropagation(); cancel() }
      }}
      onClick={(e) => e.stopPropagation()}
    />
  )
}

export function EditableSelect({
  value, onChange, disabled, className = '', style, options, placeholder, displayValue,
}: BaseProps & { options: { label: string; value: string }[] }) {
  const { editing, draft, setDraft, ref, begin, commit, cancel } = useEditing(value, onChange)
  const shown = displayValue ?? value
  if (disabled) return <span className={className} style={style}>{shown}</span>
  if (!editing) {
    return (
      <span
        className={`${className} ${HINT}`}
        style={style}
        title="点击选择"
        onClick={(e) => { e.stopPropagation(); begin() }}
      >
        {shown || <span className="opacity-40">{placeholder ?? '（点击选择）'}</span>}
      </span>
    )
  }
  return (
    <select
      ref={ref as never}
      className={`${className} editable-input`}
      style={style}
      value={draft}
      onChange={(e) => { setDraft(e.target.value); commit(e.target.value) }}
      onBlur={() => commit(draft)}
      onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); cancel() } }}
      onClick={(e) => e.stopPropagation()}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

// 布尔开关（点击切换）
export function EditableToggle({
  checked, onChange, disabled, children, title,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  children: ReactNode
  title?: string
}) {
  if (disabled) return <>{children}</>
  return (
    <span
      className={`${HINT} inline-flex`}
      title={title ?? '点击切换'}
      onClick={(e) => { e.stopPropagation(); onChange(!checked) }}
    >
      {children}
    </span>
  )
}
