'use client'

import { useState, useEffect, useRef } from 'react'
import { NewsArticle, Category, Language } from '@/types/news'
import NewsCard from './NewsCard'
import ArticleModal from './ArticleModal'

interface NewsFeedProps {
  language: Language
  category: Category
}

const PAGE_SIZE = 12

export default function NewsFeed({ language, category }: NewsFeedProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const offsetRef = useRef(0)
  const loaderRef = useRef<HTMLDivElement>(null)
  const loadingRef = useRef(false)
  const filterKeyRef = useRef(`${language}-${category}`)

  const loadPage = async (reset: boolean) => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)

    const currentOffset = reset ? 0 : offsetRef.current

    try {
      const params = new URLSearchParams({
        language,
        category,
        limit: String(PAGE_SIZE),
        offset: String(currentOffset),
      })

      const res = await fetch(`/api/news?${params}`)
      const data: { articles: NewsArticle[]; total: number } = await res.json()

      if (reset) {
        setArticles(data.articles)
      } else {
        setArticles(prev => [...prev, ...data.articles])
      }

      setTotal(data.total)
      offsetRef.current = currentOffset + PAGE_SIZE
      setHasMore(currentOffset + PAGE_SIZE < data.total)
    } catch (err) {
      console.error('Failed to fetch news', err)
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }

  // Trigger fresh load when filters change
  useEffect(() => {
    const newKey = `${language}-${category}`
    filterKeyRef.current = newKey
    offsetRef.current = 0
    loadPage(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, category])

  // Infinite scroll observer
  useEffect(() => {
    const el = loaderRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
          loadPage(false)
        }
      },
      { rootMargin: '200px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, language, category])

  const isInitialLoading = loading && articles.length === 0

  if (isInitialLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
            <div className="h-48 bg-orange-50" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-gray-100 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-full" />
              <div className="h-3 bg-gray-100 rounded w-5/6" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!loading && articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <span className="text-5xl mb-4">🌤️</span>
        <p className="text-gray-500 text-lg font-medium">No positive news found</p>
        <p className="text-gray-400 text-sm mt-1">Try changing the language or category filters</p>
      </div>
    )
  }

  return (
    <>
      <div className="px-4 pb-2">
        <p className="text-xs text-gray-400">{total} positive stories found</p>
      </div>

      <div className="grid grid-cols-1 gap-4 px-4">
        {articles.map((article, index) => (
          <NewsCard
            key={article.id}
            article={article}
            onClick={setSelectedArticle}
            priority={index === 0}
            uiLanguage={language}
          />
        ))}
      </div>

      <div ref={loaderRef} className="py-6 flex justify-center">
        {loading && (
          <div className="flex gap-2">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-teal-500 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        )}
        {!hasMore && articles.length > 0 && (
          <p className="text-xs text-gray-300">You&apos;ve seen all the good news for now ☀️</p>
        )}
      </div>

      <ArticleModal
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />
    </>
  )
}
