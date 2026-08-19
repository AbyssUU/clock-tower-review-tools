import { createContext, useContext } from 'react'
import { useReplayStore } from '../../store'

// 是否处于「可编辑」预览模式（导出 / 只读时为 false）
export const EditModeContext = createContext(false)

// 可编辑 = 编辑模式 且 未处于导出过程（导出 PNG 时隐藏所有增删/编辑按钮）
export function useEditable(): boolean {
  const ctx = useContext(EditModeContext)
  const exporting = useReplayStore((s) => s.exporting)
  return ctx && !exporting
}
