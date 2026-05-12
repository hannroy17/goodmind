'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import CategoryFilter from '@/components/CategoryFilter'
import NewsFeed from '@/components/NewsFeed'
import { Category, Language } from '@/types/news'

export default function Home() {
  const [language, setLanguage] = useState<Language>('all')
  const [category, setCategory] = useState<Category>('all')

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-orange-50/50 to-white">
      <Header language={language} onLanguageChange={setLanguage} />

      <main className="max-w-2xl mx-auto pb-16">
        <div className="pt-5 pb-2 px-4 text-center">
          <p className="text-gray-500 text-sm">
            Only good things happen here 🌻
          </p>
        </div>

        <div className="sticky top-[61px] z-30 bg-orange-50/90 backdrop-blur-sm border-b border-orange-100">
          <CategoryFilter
            category={category}
            language={language}
            onCategoryChange={setCategory}
          />
        </div>

        <div className="mt-4">
          <NewsFeed language={language} category={category} />
        </div>
      </main>
    </div>
  )
}
