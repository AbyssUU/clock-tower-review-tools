// ============ 跨域图片代理（统一入口） ============
// html-to-image 导出长图时，远程图片若缺少 CORS 响应头会污染 canvas，导致导出失败。
// 因此所有远程图片统一经「图片代理」转发并附加 CORS 头。
//
// 代理地址按构建环境自动选择（优先级：环境变量 > 构建模式 > 本地默认）：
//   - VITE_IMAGE_PROXY_BASE 已设置：直接用（末尾不带斜杠），用于 GitHub Pages 指向 Cloudflare Worker 等跨域代理。
//   - Electron 桌面构建（--mode electron）：botc-img://image —— 走主进程自定义协议（electron/main.cjs）。
//   - Vercel 构建（--mode vercel）：/api/image-proxy —— 相对路径，同源函数，生产/预览域名均自动适配。
//   - 本地开发 / 预览：/__img —— 走 Vite 中间件（vite.config.ts 的 imageProxy 插件）。
const PROXY_BASE = (import.meta.env.VITE_IMAGE_PROXY_BASE as string | undefined)?.trim()
  || (import.meta.env.MODE === 'electron' ? 'botc-img://image'
    : import.meta.env.MODE === 'vercel' ? '/api/image-proxy'
    : '/__img')

/** 是否为本地资源（data/blob/相对路径），是则原样返回，不经过代理 */
function isLocal(url: string): boolean {
  return url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('/') || url.startsWith('#')
}

/** 将远程图片 URL 转为经代理的 URL（本地资源原样返回） */
export function proxiedImage(url?: string): string | undefined {
  if (!url) return undefined
  if (isLocal(url)) return url
  return `${PROXY_BASE}?src=${encodeURIComponent(url)}`
}
