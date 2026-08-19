import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { NextHandleFunction } from 'connect'

// 本地图片代理：服务端转发远程角色图标并附加 CORS 头，
// 使 html-to-image 导出时能跨域内联图片（浏览器直连无 CORS 头会污染 canvas）。
function imageProxy(): Plugin {
  const handler: NextHandleFunction = (req, res, next) => {
    const url = new URL(req.url ?? '/', 'http://localhost')
    if (!url.pathname.startsWith('/__img')) {
      next()
      return
    }
    const src = url.searchParams.get('src')
    if (!src || !/^https?:\/\//.test(src)) {
      res.statusCode = 400
      res.end('bad src')
      return
    }
    fetch(src, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error(`upstream ${r.status}`)
        const buf = Buffer.from(await r.arrayBuffer())
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Content-Type', r.headers.get('content-type') ?? 'image/png')
        res.setHeader('Cache-Control', 'public, max-age=86400')
        res.setHeader('Content-Length', buf.length)
        res.statusCode = 200
        res.end(buf)
      })
      .catch(() => {
        if (!res.headersSent) {
          res.statusCode = 502
          res.end('proxy error')
        }
      })
  }

  return {
    name: 'botc-image-proxy',
    configureServer(server) {
      server.middlewares.use(handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler)
    },
  }
}

export default defineConfig({
  plugins: [react(), imageProxy()],
  server: {
    port: 5173,
    host: true,
  },
})
