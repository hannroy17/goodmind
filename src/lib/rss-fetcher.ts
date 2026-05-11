import Parser from 'rss-parser'
import { NewsArticle, NewsSource, Category, Language } from '@/types/news'
import { scorePositivity, isPositive } from './sentiment-filter'
import { RSS_SOURCES } from './sources'
import crypto from 'crypto'

const parser = new Parser({
  timeout: 12000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; GoodMind/1.0; +https://goodmind.app)',
    'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
  },
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: false }],
      ['media:content', 'mediaContentArr', { keepArray: true }],
      ['media:thumbnail', 'mediaThumbnail', { keepArray: false }],
      ['enclosure', 'enclosure'],
      ['image', 'imageField'],
      ['itunes:image', 'itunesImage'],
    ],
  },
})

function isValidImageUrl(url: string): boolean {
  try {
    const u = new URL(url)
    if (!['http:', 'https:'].includes(u.protocol)) return false
    // Skip tiny tracking pixels and data URIs
    if (url.startsWith('data:')) return false
    if (url.includes('pixel') && url.includes('1x1')) return false
    return true
  } catch {
    return false
  }
}

function extractImage(item: Record<string, unknown>): string | undefined {
  const candidates: string[] = []

  // 1. media:content (single)
  const mc = item.mediaContent as Record<string, Record<string, string>> | undefined
  if (mc?.['$']?.url) candidates.push(mc['$'].url)

  // 2. media:content array (pick largest by width if available)
  const mcArr = item.mediaContentArr as Array<Record<string, Record<string, string>>> | undefined
  if (Array.isArray(mcArr)) {
    const sorted = [...mcArr]
      .filter(m => m?.['$']?.url)
      .sort((a, b) => parseInt(b?.['$']?.width || '0') - parseInt(a?.['$']?.width || '0'))
    if (sorted[0]?.['$']?.url) candidates.push(sorted[0]['$'].url)
  }

  // 3. media:thumbnail
  const mt = item.mediaThumbnail as Record<string, Record<string, string>> | undefined
  if (mt?.['$']?.url) candidates.push(mt['$'].url)

  // 4. enclosure (podcast/RSS standard image attachment)
  const enc = item.enclosure as Record<string, unknown> | undefined
  if (enc?.url && (enc.type as string | undefined)?.startsWith('image/')) {
    candidates.push(enc.url as string)
  }

  // 5. <image> field (some feeds)
  const imgField = item.imageField as string | Record<string, unknown> | undefined
  if (typeof imgField === 'string' && imgField.startsWith('http')) candidates.push(imgField)
  if (typeof imgField === 'object' && imgField !== null) {
    const url = (imgField as Record<string, string>).url || (imgField as Record<string, string>).href
    if (url) candidates.push(url)
  }

  // 6. itunes:image
  const itunes = item.itunesImage as Record<string, Record<string, string>> | string | undefined
  if (typeof itunes === 'string') candidates.push(itunes)
  if (typeof itunes === 'object' && itunes?.['$']?.href) candidates.push(itunes['$'].href)

  // 7. Scan content:encoded HTML for the largest/first meaningful image
  const html = ((item['content:encoded'] || item.content || '') as string)
  if (html) {
    // Collect all src= values from <img> tags
    const imgRegex = /<img[^>]+src=["']([^"'\s>]+)["'][^>]*(?:width=["'](\d+)["'])?/gi
    let match: RegExpExecArray | null
    const htmlImgs: { url: string; width: number }[] = []
    while ((match = imgRegex.exec(html)) !== null) {
      htmlImgs.push({ url: match[1], width: parseInt(match[2] || '0') })
    }
    // Prefer images with explicit large width, else first found
    htmlImgs.sort((a, b) => b.width - a.width)
    if (htmlImgs[0]) candidates.push(htmlImgs[0].url)

    // Also try og:image in embedded meta tags (some feeds include full HTML)
    const ogMatch = html.match(/property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
    if (ogMatch) candidates.push(ogMatch[1])
  }

  // 8. summary/description HTML fallback
  const summary = (item.summary || item.description || '') as string
  if (summary) {
    const m = summary.match(/<img[^>]+src=["']([^"']+)["']/i)
    if (m) candidates.push(m[1])
  }

  // Return first valid candidate
  for (const url of candidates) {
    const clean = url.trim()
    if (clean && isValidImageUrl(clean)) return clean
  }

  return undefined
}

function cleanExcerpt(text: string, maxLength = 200): string {
  const cleaned = text
    .replace(/<[^>]*>/g, '') // strip HTML
    .replace(/&[a-z]+;/gi, ' ') // decode entities roughly
    .replace(/\s+/g, ' ')
    .trim()

  if (cleaned.length <= maxLength) return cleaned
  return cleaned.slice(0, maxLength).replace(/\s+\S*$/, '') + '…'
}

function makeId(url: string): string {
  return crypto.createHash('sha256').update(url).digest('hex').slice(0, 16)
}

async function fetchSource(source: NewsSource): Promise<NewsArticle[]> {
  try {
    const feed = await parser.parseURL(source.url)
    const articles: NewsArticle[] = []

    for (const item of feed.items.slice(0, 30)) {
      const title = item.title?.trim() || ''
      const url = item.link || item.guid || ''
      if (!title || !url) continue

      const rawExcerpt = item.contentSnippet || item.summary || item.content || ''
      const excerpt = cleanExcerpt(rawExcerpt)

      const lang = source.language === 'all' ? undefined : source.language
      if (!isPositive(title, excerpt, lang, source.trusted)) {
        continue
      }

      const imageUrl = extractImage(item as unknown as Record<string, unknown>)
      const positivityScore = source.trusted
        ? Math.max(60, scorePositivity(title, excerpt, lang)) // trusted sources start at 60 minimum
        : scorePositivity(title, excerpt, lang)

      articles.push({
        id: makeId(url),
        title,
        excerpt,
        url,
        imageUrl,
        source: feed.title || source.name,
        sourceUrl: feed.link || source.url,
        language: source.language === 'all' ? 'en' : source.language,
        category: source.category,
        publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
        positivityScore,
      })
    }

    return articles
  } catch {
    // Silently skip failing sources — they may be temporarily down
    return []
  }
}

// In-memory cache
let cachedArticles: NewsArticle[] = []
let lastFetch = 0
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

export async function fetchAllNews(options?: {
  language?: Language
  category?: Category
  limit?: number
  offset?: number
}): Promise<{ articles: NewsArticle[]; total: number }> {
  const now = Date.now()

  if (now - lastFetch > CACHE_TTL || cachedArticles.length === 0) {
    const results = await Promise.allSettled(RSS_SOURCES.map(fetchSource))
    const all: NewsArticle[] = []

    for (const result of results) {
      if (result.status === 'fulfilled') {
        all.push(...result.value)
      }
    }

    // Deduplicate by ID
    const seen = new Set<string>()
    cachedArticles = all
      .filter(a => {
        if (seen.has(a.id)) return false
        seen.add(a.id)
        return true
      })
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

    lastFetch = now
  }

  let filtered = [...cachedArticles]

  if (options?.language && options.language !== 'all') {
    filtered = filtered.filter(a => a.language === options.language)
  }

  if (options?.category && options.category !== 'all') {
    filtered = filtered.filter(a => a.category === options.category)
  }

  const total = filtered.length
  const offset = options?.offset || 0
  const limit = options?.limit || 20

  return {
    articles: filtered.slice(offset, offset + limit),
    total,
  }
}
