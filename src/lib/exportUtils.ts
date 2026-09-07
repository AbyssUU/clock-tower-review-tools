import { toPng, toJpeg, toBlob } from 'html-to-image'
import type { BotCReplayRecord } from '../types'

// ============ 导出格式 ============
// 默认 JPEG（体积最小，文字在 1x 精度下仍清晰可读）；PNG 为无损可选，WebP 更小。
export type ExportFormat = 'jpeg' | 'png' | 'webp'

export interface ExportOptions {
  pixelRatio?: number // 精度倍率，默认 1x（体积最小，可读）
  format?: ExportFormat // 导出格式，默认 jpeg
  quality?: number // JPEG/WebP 质量 0~1，默认 0.92
  backgroundColor?: string // 画布底色（配合当前主题，避免透明区变黑）
}

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

export async function exportLongImage(
  node: HTMLElement,
  filename: string,
  options: ExportOptions = {},
): Promise<void> {
  const { pixelRatio = 1, format = 'jpeg', quality = 0.92, backgroundColor = '#f7efe0' } = options
  await waitForAssets()
  // 等待布局稳定
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

  const common = {
    pixelRatio,
    cacheBust: true,
    // 关键：角色图标经图片代理后 URL 为 `/__img?src=…`，真实地址藏在查询参数里。
    // html-to-image 内部缓存默认会剥掉查询串作为缓存键，导致不同角色的代理图全部命中同一缓存、图标串图。
    // 开启 includeQueryParams 让缓存键保留查询参数，确保每个角色图标唯一。
    includeQueryParams: true,
    backgroundColor,
    width: node.offsetWidth,
    height: node.offsetHeight,
    style: {
      margin: '0',
      transform: 'none',
    },
  }

  let url: string
  let ext: string
  if (format === 'png') {
    url = await toPng(node, common)
    ext = 'png'
  } else if (format === 'jpeg') {
    url = await toJpeg(node, { ...common, quality })
    ext = 'jpg'
  } else {
    const blob = await toBlob(node, { ...common, type: 'image/webp', quality })
    if (!blob) throw new Error('WebP 导出失败')
    url = URL.createObjectURL(blob)
    ext = 'webp'
  }

  const link = document.createElement('a')
  link.download = `${filename}.${ext}`
  link.href = url
  link.click()
  if (format === 'webp') URL.revokeObjectURL(url)
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
