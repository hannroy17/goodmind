'use client'

import { Language } from '@/types/news'
import { LANGUAGES } from '@/lib/categories'
import Image from 'next/image'

interface HeaderProps {
  language: Language
  onLanguageChange: (lang: Language) => void
}

export default function Header({ language, onLanguageChange }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-orange-100 shadow-sm">
      <div className="max-w-2xl mx-auto px-4 py-2.5 flex items-center justify-between">

        <div className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="GoodMind" width={40} height={40} priority />
          <div>
            <h1 className="text-lg font-bold leading-none">
              <span className="text-[#1E3A5F]">Good</span><span className="text-[#0D9488]">Mind</span>
            </h1>
            <p className="text-[10px] tracking-wide text-gray-400 leading-none mt-0.5 uppercase font-medium">
              Positive news
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-orange-50 rounded-full p-1">
          {LANGUAGES.map(lang => (
            <button
              key={lang.value}
              onClick={() => onLanguageChange(lang.value)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                language === lang.value
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-teal-600 hover:bg-teal-50'
              }`}
            >
              <span>{lang.flag}</span>
              <span className="hidden sm:inline">{lang.label}</span>
            </button>
          ))}
        </div>

      </div>
    </header>
  )
}
