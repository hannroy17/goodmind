'use client'

import { Category, Language } from '@/types/news'
import { CATEGORIES } from '@/lib/categories'

interface CategoryFilterProps {
  category: Category
  language: Language
  onCategoryChange: (cat: Category) => void
}

export default function CategoryFilter({ category, language, onCategoryChange }: CategoryFilterProps) {
  const langKey = language === 'all' ? 'en' : language

  return (
    <div className="w-full overflow-x-auto py-3 px-4">
      <div className="flex gap-2 min-w-max">
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => onCategoryChange(cat.value)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              category === cat.value
                ? 'bg-teal-400 text-white shadow-md scale-105'
                : 'bg-white text-gray-600 hover:bg-teal-50 hover:text-teal-500 border border-gray-200'
            }`}
          >
            <span>{cat.emoji}</span>
            <span>{cat.labels[langKey] || cat.labels.en}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
