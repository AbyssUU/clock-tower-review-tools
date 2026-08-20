// ============ Cloudflare Worker：跨域图片代理 ============
// 作用：转发远程图片并附加 CORS 头 + 边缘缓存，供 GitHub Pages 前端在导出长图时内联跨域图片。
//
// 部署：
//   cd workers
//   npx wrangler login
//   npx wrangler deploy
// 部署完成后得到形如 https://botc-image-proxy.<your-subdomain>.workers.dev 的地址，
// 将其填入前端构建环境变量 VITE_IMAGE_PROXY_BASE（末尾不要带斜杠）。
//
// 请求方式（二者等价）：
//   GET https://<worker>.workers.dev/?src=<url-encoded-image-url>
//   GET https://<worker>.workers.dev/<url-encoded-image-url>

// 可选白名单：限制仅允许转发这些域名。留空数组 = 允许任意（注意：等于开放代理，有被滥用风险）。
// 若只想放行本工具用到的图源，取消注释并按需追加自定义 logo 域名：
// const ALLOWED_HOSTS = [
//   'oss.gstonegames.com',
//   'clocktower-wiki.gstonegames.com',
//   'www.merlin-botc.com',
//   'merlin-botc.com',
//   'raw.githubusercontent.com',
// ]
const ALLOWED_HOSTS = []

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
}

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS })
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('method not allowed', { status: 405, headers: CORS_HEADERS })
    }

    // 解析目标图片地址：优先 ?src=，其次路径 /<encoded-url>
    let src = url.searchParams.get('src')
    if (!src) {
      const path = url.pathname.replace(/^\/+/, '')
      if (path) src = decodeURIComponent(path)
    }
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

    // 边缘缓存（wrangler dev 本地运行时 caches 可能不可用，容错处理）
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
    if (cache) ctx.waitUntil(cache.put(cacheKey, resp.clone()))
    return resp
  },
}
