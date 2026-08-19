import { useEffect, useRef, useState } from 'react'
import { ImageDown, FileJson, Maximize2, ZoomIn, ZoomOut, Loader2, MoveHorizontal } from 'lucide-react'
import { useReplayStore } from './store'
import LongImage from './components/export/LongImage'
import EditorPanel from './components/editor/EditorPanel'
import { exportLongImage, downloadJSON } from './lib/exportUtils'
import { REPLAY_THEMES } from './lib/theme'

export default function App() {
  const replay = useReplayStore((s) => s.replay)
  const script = useReplayStore((s) => s.script)
  const screenshot = useReplayStore((s) => s.screenshot)
  const updateMeta = useReplayStore((s) => s.updateMeta)
  const imageWidth = replay.meta.imageWidth ?? 1080
  const exportRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(0.75)
  const [naturalH, setNaturalH] = useState(0)
  const [exporting, setExporting] = useState(false)
  const [quality, setQuality] = useState(2) // PNG 精度倍率：1/2/3 倍

  // 独立导出模式：?export=1 时仅渲染长图（供无头浏览器截图 / 调试）
  const standalone = new URLSearchParams(window.location.search).has('export')
  if (standalone) {
    return <LongImage ref={exportRef} replay={replay} script={script} screenshot={screenshot} />
  }

  useEffect(() => {
    const el = exportRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setNaturalH(el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const handleExportPng = async () => {
    if (!exportRef.current || exporting) return
    setExporting(true)
    // 关闭可能处于编辑态的输入框，避免 html-to-image 捕获空 input
    ;(document.activeElement as HTMLElement | null)?.blur()
    // 置导出标志，隐藏所有增删/编辑按钮，再等待渲染提交
    useReplayStore.getState().setExporting(true)
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    try {
      await exportLongImage(exportRef.current, '魔典复盘', quality)
    } catch (e) {
      console.error(e)
      alert('导出失败，请重试或检查浏览器兼容性。')
    } finally {
      useReplayStore.getState().setExporting(false)
      setExporting(false)
    }
  }

  return (
    <div className="flex h-screen flex-col bg-abyss-950">
      {/* 顶部工具栏 */}
      <header className="flex shrink-0 items-center gap-4 border-b border-brass-700/30 bg-abyss-900/80 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-brass-600/60 bg-abyss-900 shadow-brass-glow">
            <span className="h-3.5 w-3.5 rotate-45 bg-brass-400" />
          </span>
          <div>
            <h1 className="font-display text-base font-bold leading-none text-brass-100">魔典复盘生成器</h1>
            <span className="text-[10px] tracking-widest text-abyss-700">BLOOD ON THE CLOCKTOWER</span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-abyss-700 bg-abyss-950/60 px-2 py-1.5" title="图片宽度">
            <MoveHorizontal className="h-3.5 w-3.5 text-abyss-700" />
            <input
              type="range"
              min={900}
              max={1600}
              step={20}
              value={imageWidth}
              onChange={(e) => updateMeta({ imageWidth: Number(e.target.value) })}
              className="w-28 accent-brass-500"
            />
            <span className="w-10 text-right text-[11px] tabular-nums text-brass-300">{imageWidth}</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-abyss-700 bg-abyss-950/60 px-2 py-1.5">
            <ZoomOut className="h-3.5 w-3.5 text-abyss-700" />
            <input
              type="range"
              min={0.4}
              max={1.5}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-24 accent-brass-500"
            />
            <ZoomIn className="h-3.5 w-3.5 text-abyss-700" />
            <button
              onClick={() => setZoom(0.75)}
              className="rounded px-1.5 py-0.5 text-xs text-brass-300 hover:bg-abyss-850"
              title="适应宽度"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-abyss-700 bg-abyss-950/60 px-2 py-1.5" title="长图配色主题">
            <span className="text-[11px] text-abyss-700">配色</span>
            <select
              value={replay.meta.theme ?? REPLAY_THEMES[0].id}
              onChange={(e) => updateMeta({ theme: e.target.value })}
              className="cursor-pointer rounded border border-abyss-700 bg-abyss-950 px-1 py-0.5 text-[11px] text-brass-200 outline-none"
            >
              {REPLAY_THEMES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-abyss-700 bg-abyss-950/60 px-2 py-1.5" title="导出 PNG 精度">
            <span className="text-[11px] text-abyss-700">精度</span>
            <select
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="cursor-pointer rounded border border-abyss-700 bg-abyss-950 px-1 py-0.5 text-[11px] text-brass-200 outline-none"
            >
              <option value={1}>1x · 轻量</option>
              <option value={2}>2x · 高清</option>
              <option value={3}>3x · 超清</option>
            </select>
          </div>

          <button
            onClick={() => downloadJSON(replay, '复盘数据')}
            className="flex items-center gap-1.5 rounded-lg border border-abyss-700 px-3 py-2 text-sm font-medium text-brass-200 hover:bg-abyss-850"
          >
            <FileJson className="h-4 w-4" /> JSON
          </button>
          <button
            onClick={handleExportPng}
            disabled={exporting}
            className="flex items-center gap-1.5 rounded-lg border border-brass-600/70 bg-brass-500/15 px-4 py-2 text-sm font-semibold text-brass-100 shadow-brass-glow hover:bg-brass-500/25 disabled:opacity-50"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageDown className="h-4 w-4" />}
            {exporting ? '导出中…' : '导出长图 PNG'}
          </button>
        </div>
      </header>

      {/* 主体 */}
      <div className="flex min-h-0 flex-1">
        {/* 左侧编辑器 */}
        <aside className="w-[430px] shrink-0 border-r border-abyss-800 bg-abyss-900/40">
          <EditorPanel />
        </aside>

        {/* 右侧预览 */}
        <main className="min-w-0 flex-1 overflow-auto bg-abyss-950" style={{ backgroundImage: 'radial-gradient(circle, #161b22 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
          <div style={{ width: imageWidth * zoom, height: naturalH * zoom }}>
            <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', width: imageWidth }}>
              <LongImage ref={exportRef} replay={replay} script={script} screenshot={screenshot} editable />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
