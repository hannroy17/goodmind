'use client'

import { NewsArticle } from '@/types/news'
import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'

interface ArticleModalProps {
  article: NewsArticle | null
  onClose: () => void
  onImageFetched?: (articleId: string, imageUrl: string) => void
  language?: string
}

const T: Record<string, Record<string, string>> = {
  en: {
    open: 'Open ↗',
    readFull: 'Read full article ↗',
    noPreview: 'This site cannot be previewed directly.',
    read: 'Read article ↗',
    fullOnSite: 'Full content available on the publisher\'s site.',
  },
  fr: {
    open: 'Ouvrir ↗',
    readFull: 'Lire l\'article complet ↗',
    noPreview: 'Ce site ne peut pas être prévisualisé directement.',
    read: 'Lire l\'article ↗',
    fullOnSite: 'Contenu complet disponible sur le site de l\'éditeur.',
  },
  de: {
    open: 'Öffnen ↗',
    readFull: 'Vollständigen Artikel lesen ↗',
    noPreview: 'Diese Website kann nicht direkt angezeigt werden.',
    read: 'Artikel lesen ↗',
    fullOnSite: 'Vollständiger Inhalt auf der Website des Herausgebers verfügbar.',
  },
}

interface FetchedContent {
  title: string
  description: string
  image: string
  content: string
  siteName: string
}

type Status = 'idle' | 'loading' | 'ready' | 'error'

export default function ArticleModal({ article, onClose, onImageFetched, language = 'en' }: ArticleModalProps) {
  const t = T[language] ?? T.en
  const [status, setStatus] = useState<Status>('idle')
  const [fetched, setFetched] = useState<FetchedContent | null>(null)
  const [imgSrc, setImgSrc] = useState<string>('')

  const fetchContent = useCallback(async (url: string) => {
    await Promise.resolve()
    setStatus('loading')
    setFetched(null)
    try {
      const res = await fetch(`/api/article?url=${encodeURIComponent(url)}`)
      if (!res.ok) throw new Error('fetch failed')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setFetched(data)
      setImgSrc(data.image || '')
      setStatus('ready')
      if (data.image && article) onImageFetched?.(article.id, data.image)
    } catch {
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    if (!article) return
    document.body.style.overflow = 'hidden'
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchContent(article.url)
    return () => { document.body.style.overflow = '' }
  }, [article, fetchContent])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  if (!article) return null

  const displayImage = imgSrc || article.imageUrl || ''
  const displayTitle = fetched?.title || article.title
  const displaySite = fetched?.siteName || article.source

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative flex flex-col h-full max-w-2xl w-full mx-auto my-0 sm:my-4 sm:rounded-2xl overflow-hidden bg-white shadow-2xl z-10">

        {/* Top bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-gray-100 shrink-0">
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-400 text-lg shrink-0"
            aria-label="Fermer"
          >
            ✕
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[#0D9488] font-medium truncate">{displaySite}</p>
          </div>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-[#6BADA8] hover:bg-[#6BADA8] text-white text-xs font-semibold rounded-full transition-colors"
          >
            {t.open}
          </a>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">

          {/* Hero image */}
          {displayImage && (
            <div className="relative w-full h-52 sm:h-64 bg-gray-100 shrink-0">
              <Image
                src={displayImage}
                alt={displayTitle}
                fill
                className="object-cover"
                onError={() => setImgSrc('')}
                unoptimized
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
          )}

          <div className="px-5 py-5">

            {/* Loading skeleton */}
            {status === 'loading' && (
              <div className="animate-pulse space-y-3">
                <div className="h-6 bg-gray-100 rounded w-5/6" />
                <div className="h-6 bg-gray-100 rounded w-4/6" />
                <div className="h-3 bg-gray-50 rounded w-1/4 mt-4" />
                <div className="space-y-2 mt-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={`h-3 bg-gray-100 rounded ${i === 4 ? 'w-3/4' : 'w-full'}`} />
                  ))}
                </div>
              </div>
            )}

            {/* Content ready */}
            {status === 'ready' && fetched && (
              <>
                <h1 className="text-xl font-bold text-gray-900 leading-snug mb-3">
                  {displayTitle}
                </h1>

                {fetched.description && (
                  <p className="text-base text-orange-700 font-medium leading-relaxed mb-4 border-l-4 border-teal-300 pl-3">
                    {fetched.description}
                  </p>
                )}

                {fetched.content ? (
                  <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-3">
                    {fetched.content.split('\n\n').map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {article.excerpt && (
                      <p className="text-gray-700 leading-relaxed">{article.excerpt}</p>
                    )}
                    <p className="text-gray-400 text-xs italic">
                      {t.fullOnSite}
                    </p>
                  </div>
                )}

                <div className="mt-6 pt-4 border-t border-gray-100">
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#6BADA8] hover:bg-[#6BADA8] text-white font-semibold rounded-full transition-colors text-sm"
                  >
                    {t.readFull}
                  </a>
                </div>
              </>
            )}

            {/* Error fallback */}
            {status === 'error' && (
              <>
                <h1 className="text-xl font-bold text-gray-900 leading-snug mb-3">
                  {article.title}
                </h1>

                {article.excerpt && (
                  <p className="text-gray-600 leading-relaxed mb-5">
                    {article.excerpt}
                  </p>
                )}

                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <span className="text-3xl">🔗</span>
                  <p className="text-sm text-gray-400">
                    {t.noPreview}
                  </p>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#6BADA8] hover:bg-[#6BADA8] text-white font-semibold rounded-full transition-colors text-sm"
                  >
                    {t.read}
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
