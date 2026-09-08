export const config = {
  runtime: 'edge',
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url)
  const src = searchParams.get('src')

  if (!src) {
    return new Response('Missing or invalid ?src=', { status: 400 })
  }

  try {
    const response = await fetch(src, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
      },
    })

    if (!response.ok) {
      return new Response(`Failed to fetch from source: ${response.status}`, {
        status: response.status,
      })
    }

    const blob = await response.blob()
    const contentType = response.headers.get('content-type')

    return new Response(blob, {
      headers: {
        'Content-Type': contentType || 'image/png',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
    })
  } catch (error) {
    return new Response(`Proxy Error: ${error.message}`, { status: 500 })
  }
}
