import { NextRequest, NextResponse } from 'next/server'
import { fetchAllNews } from '@/lib/rss-fetcher'
import { Language, Category } from '@/types/news'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // 1 hour

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl

  const language = (searchParams.get('language') || 'all') as Language
  const category = (searchParams.get('category') || 'all') as Category
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
  const offset = parseInt(searchParams.get('offset') || '0')

  try {
    const result = await fetchAllNews({ language, category, limit, offset })

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('Error fetching news:', error)
    return NextResponse.json({ articles: [], total: 0 }, { status: 500 })
  }
}
