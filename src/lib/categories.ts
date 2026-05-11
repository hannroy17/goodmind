import { Category, Language } from '@/types/news'

export const CATEGORIES: { value: Category; emoji: string; labels: Record<string, string> }[] = [
  { value: 'all', emoji: '✨', labels: { en: 'All', fr: 'Tout', de: 'Alle' } },
  { value: 'science', emoji: '🔬', labels: { en: 'Science', fr: 'Science', de: 'Wissenschaft' } },
  { value: 'environment', emoji: '🌿', labels: { en: 'Environment', fr: 'Environnement', de: 'Umwelt' } },
  { value: 'solidarity', emoji: '🤝', labels: { en: 'Solidarity', fr: 'Solidarité', de: 'Solidarität' } },
  { value: 'health', emoji: '💚', labels: { en: 'Health', fr: 'Santé', de: 'Gesundheit' } },
  { value: 'technology', emoji: '🚀', labels: { en: 'Technology', fr: 'Technologie', de: 'Technologie' } },
  { value: 'sport', emoji: '🏅', labels: { en: 'Sport', fr: 'Sport', de: 'Sport' } },
  { value: 'culture', emoji: '🎨', labels: { en: 'Culture', fr: 'Culture', de: 'Kultur' } },
  { value: 'animals', emoji: '🐾', labels: { en: 'Animals', fr: 'Animaux', de: 'Tiere' } },
]

export const LANGUAGES: { value: Language; flag: string; label: string }[] = [
  { value: 'all', flag: '🌍', label: 'All' },
  { value: 'en', flag: '🇬🇧', label: 'English' },
  { value: 'fr', flag: '🇫🇷', label: 'Français' },
  { value: 'de', flag: '🇩🇪', label: 'Deutsch' },
]

export function getCategoryLabel(cat: Category, lang: Language | 'all'): string {
  const found = CATEGORIES.find(c => c.value === cat)
  if (!found) return cat
  const l = (lang === 'all' ? 'en' : lang) as string
  return found.labels[l] || found.labels.en
}
