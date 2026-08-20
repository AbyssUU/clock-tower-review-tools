// ============ 跨域图片代理（统一入口） ============
// html-to-image 导出长图时，远程图片若缺少 CORS 响应头会污染 canvas，导致导出失败。
// 因此所有远程图片统一经「图片代理」转发并附加 CORS 头。
//
// 代理地址由环境变量 VITE_IMAGE_PROXY_BASE 决定：
//   - 未设置（默认）：/__img —— 走本地 Vite 中间件（vite.config.ts 的 imageProxy 插件），
//     适用于 npm run dev / npm run preview（本地开发与预览）。
//   - 设置为云端代理地址：走 Cloudflare Worker / Vercel Serverless（见 workers/ 与 api/ 目录），
//     适用于 GitHub Pages 等纯静态托管环境。
//     例：VITE_IMAGE_PROXY_BASE=https://your-worker.your-subdomain.workers.dev
const PROXY_BASE = (import.meta.env.VITE_IMAGE_PROXY_BASE as string | undefined)?.trim() || '/__img'

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
