export const config = {
  runtime: 'edge',
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
}

const ALLOWED_HOSTS = [
  'bloodontheclocktower.com',
  'www.bloodontheclocktower.com',
  'clocktower-wiki.gstonegames.com',
  'oss.gstonegames.com',
  'raw.githubusercontent.com',
  'www.merlin-botc.com',
  'merlin-botc.com',
]

function isAllowedHost(hostname) {
  return ALLOWED_HOSTS.some((host) => hostname === host || hostname.endsWith(`.${host}`))
}

export default async function handler(req) {
  const url = new URL(req.url)

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405, headers: CORS_HEADERS })
  }

  const src = url.searchParams.get('src')
  if (!src || !/^https?:\/\//i.test(src)) {
    return new Response('Missing or invalid ?src=', { status: 400, headers: CORS_HEADERS })
  }

  let target
  try {
    target = new URL(src)
  } catch {
    return new Response('Invalid src URL', { status: 400, headers: CORS_HEADERS })
  }

  if (!isAllowedHost(target.hostname)) {
    return new Response(`Host not allowed: ${target.hostname}`, {
      status: 403,
      headers: CORS_HEADERS,
    })
  }

  try {
    const response = await fetch(src, {
      headers: {
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
      },
      redirect: 'follow',
    })

    if (!response.ok) {
      return new Response(`Failed to fetch from source: ${response.status}`, {
        status: response.status,
        headers: CORS_HEADERS,
      })
    }

    const blob = await response.blob()
    const contentType = response.headers.get('content-type') || 'image/png'

    return new Response(blob, {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (error) {
    return new Response(`Proxy Error: ${error instanceof Error ? error.message : String(error)}`, {
      status: 500,
      headers: CORS_HEADERS,
    })
  }
}
