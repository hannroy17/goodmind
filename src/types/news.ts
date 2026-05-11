export type Language = 'en' | 'fr' | 'de' | 'all'

export type Category =
  | 'all'
  | 'science'
  | 'environment'
  | 'solidarity'
  | 'health'
  | 'technology'
  | 'sport'
  | 'culture'
  | 'animals'

export interface NewsArticle {
  id: string
  title: string
  excerpt: string
  url: string
  imageUrl?: string
  source: string
  sourceUrl: string
  language: Language
  category: Category
  publishedAt: string
  positivityScore: number
}

export interface NewsSource {
  url: string
  name: string
  language: Language
  category: Category
  /** Dedicated positive-news outlet — skip score check, only hard-block applies */
  trusted?: boolean
}
