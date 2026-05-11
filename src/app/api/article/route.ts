import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface ArticleContent {
  title: string
  description: string
  image: string
  content: string
  siteName: string
  url: string
}

function extractMeta(html: string, property: string): string {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${property.replace('og:', '')}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property.replace('og:', '')}["']`, 'i'),
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m?.[1]) return decodeEntities(m[1].trim())
  }
  return ''
}

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
    .replace(/&[a-z]+;/g, ' ')
}

function stripTags(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
    .replace(/<figure[^>]*>[\s\S]*?<\/figure>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/&#\d+;/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function extractMainContent(html: string): string {
  // Priority order: <article>, <main>, biggest <div class=*content*>, body
  const articleMatch = html.match(/<article[^>]*>([\s\S]{200,}?)<\/article>/i)
  if (articleMatch) {
    const text = stripTags(articleMatch[1])
    if (text.length > 200) return text
  }

  const mainMatch = html.match(/<main[^>]*>([\s\S]{200,}?)<\/main>/i)
  if (mainMatch) {
    const text = stripTags(mainMatch[1])
    if (text.length > 200) return text
  }

  // Find divs with content-related class names
  const contentDivMatch = html.match(
    /<div[^>]+(?:class|id)=["'][^"']*(?:article|post|content|entry|story|body|text)[^"']*["'][^>]*>([\s\S]{200,}?)<\/div>/i
  )
  if (contentDivMatch) {
    const text = stripTags(contentDivMatch[1])
    if (text.length > 200) return text
  }

  // Fallback: strip everything
  return stripTags(html).slice(0, 3000)
}

function extractParagraphs(text: string, maxChars = 2500): string[] {
  // Split on sentence boundaries into logical paragraphs
  const sentences = text
    .split(/(?<=[.!?])\s+(?=[A-ZÀÂÆÇÉÈÊËÎÏÔŒÙÛÜ«"])/)
    .map(s => s.trim())
    .filter(s => s.length > 40)

  const paragraphs: string[] = []
  let current = ''

  for (const sentence of sentences) {
    if ((current + ' ' + sentence).length > 350 && current) {
      paragraphs.push(current.trim())
      current = sentence
    } else {
      current = current ? current + ' ' + sentence : sentence
    }
    if (paragraphs.join('\n').length > maxChars) break
  }

  if (current) paragraphs.push(current.trim())
  return paragraphs.filter(p => p.length > 40).slice(0, 8)
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 })

  try {
    new URL(url) // validate
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 })
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8,de;q=0.7',
        'Cache-Control': 'no-cache',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const html = await res.text()

    const title = extractMeta(html, 'og:title')
      || html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim()
      || ''

    const description = extractMeta(html, 'og:description')
      || extractMeta(html, 'description')
      || ''

    const image = extractMeta(html, 'og:image')
      || extractMeta(html, 'twitter:image')
      || ''

    const siteName = extractMeta(html, 'og:site_name')
      || new URL(url).hostname.replace('www.', '')

    const rawContent = extractMainContent(html)
    const paragraphs = extractParagraphs(rawContent)
    const content = paragraphs.join('\n\n')

    const result: ArticleContent = {
      title: decodeEntities(title),
      description: decodeEntities(description),
      image,
      content,
      siteName,
      url,
    }

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=3600' },
    })
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to fetch article', detail: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    )
  }
}
