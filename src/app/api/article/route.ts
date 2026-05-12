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

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  agrave: 'à', aacute: 'á', acirc: 'â', atilde: 'ã', auml: 'ä', aring: 'å', aelig: 'æ',
  ccedil: 'ç',
  egrave: 'è', eacute: 'é', ecirc: 'ê', euml: 'ë',
  igrave: 'ì', iacute: 'í', icirc: 'î', iuml: 'ï',
  eth: 'ð', ntilde: 'ñ',
  ograve: 'ò', oacute: 'ó', ocirc: 'ô', otilde: 'õ', ouml: 'ö', oslash: 'ø',
  ugrave: 'ù', uacute: 'ú', ucirc: 'û', uuml: 'ü',
  yacute: 'ý', thorn: 'þ', yuml: 'ÿ',
  Agrave: 'À', Aacute: 'Á', Acirc: 'Â', Atilde: 'Ã', Auml: 'Ä', Aring: 'Å', AElig: 'Æ',
  Ccedil: 'Ç',
  Egrave: 'È', Eacute: 'É', Ecirc: 'Ê', Euml: 'Ë',
  Igrave: 'Ì', Iacute: 'Í', Icirc: 'Î', Iuml: 'Ï',
  Ntilde: 'Ñ',
  Ograve: 'Ò', Oacute: 'Ó', Ocirc: 'Ô', Otilde: 'Õ', Ouml: 'Ö', Oslash: 'Ø',
  Ugrave: 'Ù', Uacute: 'Ú', Ucirc: 'Û', Uuml: 'Ü',
  Yacute: 'Ý', THORN: 'Þ',
  laquo: '«', raquo: '»', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
  ndash: '–', mdash: '—', hellip: '…', euro: '€', copy: '©', reg: '®', trade: '™',
  oe: 'œ', OE: 'Œ', szlig: 'ß',
}

function decodeEntities(str: string): string {
  return str
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&([a-zA-Z]+);/g, (match, name) => NAMED_ENTITIES[name] ?? match)
}

function stripTags(html: string): string {
  const stripped = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
    .replace(/<figure[^>]*>[\s\S]*?<\/figure>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
  return decodeEntities(stripped)
}

function cleanHtml(html: string): string {
  // Strip non-content sections before any extraction
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
    .replace(/<figure[^>]*>[\s\S]*?<\/figure>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
}

function extractParagraphTags(html: string): string {
  const matches = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
  return matches
    .map(m => stripTags(m[1]).trim())
    .filter(t => t.length > 100 && !isNavBlock(t))
    .join('\n\n')
}

function extractMainContent(html: string): string {
  const cleaned = cleanHtml(html)

  // 1. <article>
  const articleMatch = cleaned.match(/<article[^>]*>([\s\S]{200,}?)<\/article>/i)
  if (articleMatch) {
    const text = stripTags(articleMatch[1])
    if (text.length > 200) return text
  }

  // 2. <main>
  const mainMatch = cleaned.match(/<main[^>]*>([\s\S]{200,}?)<\/main>/i)
  if (mainMatch) {
    const text = stripTags(mainMatch[1])
    if (text.length > 200) return text
  }

  // 3. Div with content-related class/id
  const contentDivMatch = cleaned.match(
    /<div[^>]+(?:class|id)=["'][^"']*(?:article|post|content|entry|story|body|text)[^"']*["'][^>]*>([\s\S]{200,}?)<\/div>/i
  )
  if (contentDivMatch) {
    const text = stripTags(contentDivMatch[1])
    if (text.length > 200) return text
  }

  // 4. <p> tags with substantial text (> 100 chars filters out most nav items)
  const fromParagraphs = extractParagraphTags(cleaned)
  if (fromParagraphs.length > 200) return fromParagraphs

  // 5. Last resort: split stripped text into chunks, keep only substantial ones
  return stripTags(cleaned)
    .split(/\s{3,}/)
    .map(s => s.trim())
    .filter(s => s.length > 120 && !isNavBlock(s))
    .slice(0, 8)
    .join('\n\n')
}

function isNavBlock(text: string): boolean {
  const words = text.trim().split(/\s+/)
  if (words.length < 5) return false

  // Short-word heuristic: nav lists often use very short words
  const shortWords = words.filter(w => w.replace(/[^a-zA-ZÀ-ÿ]/g, '').length <= 4)
  if (shortWords.length / words.length > 0.6) return true

  // Category/tag list heuristic: high capitalized-word ratio + no sentence punctuation
  const capitalizedWords = words.filter(w => /^[A-ZÀÂÆÇÉÈÊËÎÏÔŒÙÛÜ]/.test(w))
  const hasSentencePunctuation = /[.!?](?:\s|$)/.test(text)
  if (capitalizedWords.length / words.length > 0.5 && !hasSentencePunctuation) return true

  return false
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
  return paragraphs.filter(p => p.length > 40 && !isNavBlock(p)).slice(0, 8)
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
