// ============ Vercel Edge Function：跨域图片代理 ============
// 作用：转发远程图片并附加 CORS 头 + 边缘缓存，供 GitHub Pages 前端在导出长图时内联跨域图片。
//
// 部署：将本仓库导入 Vercel（或仅部署 api/ 目录），Vercel 会自动把 api/ 下的文件作为函数。
// 函数地址形如 https://<project>.vercel.app/api/image-proxy，
// 将其填入前端构建环境变量 VITE_IMAGE_PROXY_BASE（末尾不要带斜杠）。
//
// 请求方式：
//   GET https://<project>.vercel.app/api/image-proxy?src=<url-encoded-image-url>

export const config = { runtime: 'edge' }

// 可选白名单：留空数组 = 允许任意（注意：等于开放代理，有被滥用风险）。需要时按域名追加。
const ALLOWED_HOSTS = []

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
}

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'

export default async function handler(request) {
  const url = new URL(request.url)

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('method not allowed', { status: 405, headers: CORS_HEADERS })
  }

  const src = url.searchParams.get('src')
  if (!src || !/^https?:\/\//i.test(src)) {
    return new Response('missing or invalid ?src=…', { status: 400, headers: CORS_HEADERS })
  }

  let host
  try {
    host = new URL(src).hostname
  } catch {
    return new Response('invalid src', { status: 400, headers: CORS_HEADERS })
  }
  if (ALLOWED_HOSTS.length > 0 && !ALLOWED_HOSTS.some((h) => host === h || host.endsWith('.' + h))) {
    return new Response('host not allowed', { status: 403, headers: CORS_HEADERS })
  }

  // 边缘缓存（本地运行 / 无 caches 时容错）
  let cache = null
  try {
    cache = caches.default
  } catch {
    /* ignore */
  }

  const cacheKey = new Request(url.toString(), request)
  if (cache) {
    const hit = await cache.match(cacheKey)
    if (hit) return hit
  }

  const upstream = await fetch(src, { headers: { 'User-Agent': UA }, redirect: 'follow' })
  if (!upstream.ok) {
    return new Response(`upstream ${upstream.status}`, { status: 502, headers: CORS_HEADERS })
  }

  const body = await upstream.arrayBuffer()
  const headers = new Headers(CORS_HEADERS)
  headers.set('Content-Type', upstream.headers.get('content-type') ?? 'image/png')
  headers.set('Cache-Control', 'public, max-age=86400, s-maxage=86400')

  const resp = new Response(body, { status: 200, headers })
  if (cache) cache.put(cacheKey, resp.clone()).catch(() => {})
  return resp
}
