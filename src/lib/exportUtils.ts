import { toPng } from 'html-to-image'
import type { BotCReplayRecord } from '../types'

/** 等待字体与图片就绪，确保导出渲染完整 */
async function waitForAssets() {
  try {
    await document.fonts?.ready
  } catch {
    /* ignore */
  }
  const images = Array.from(document.images)
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) resolve()
          else {
            img.onload = () => resolve()
            img.onerror = () => resolve()
          }
        }),
    ),
  )
}

export async function exportLongImage(node: HTMLElement, filename: string, pixelRatio = 2): Promise<void> {
  await waitForAssets()
  // 等待布局稳定
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

  const dataUrl = await toPng(node, {
    pixelRatio,
    cacheBust: true,
    backgroundColor: '#0d1117',
    width: node.offsetWidth,
    height: node.offsetHeight,
    style: {
      margin: '0',
      transform: 'none',
    },
  })

  const link = document.createElement('a')
  link.download = `${filename}.png`
  link.href = dataUrl
  link.click()
}

export function downloadJSON(replay: BotCReplayRecord, filename: string): void {
  const blob = new Blob([JSON.stringify(replay, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = `${filename}.json`
  link.href = url
  link.click()
  URL.revokeObjectURL(url)
}
