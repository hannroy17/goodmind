'use client'

import { NewsArticle } from '@/types/news'
import { CATEGORIES } from '@/lib/categories'
import { formatDistanceToNow } from 'date-fns'
import { fr, de, enUS, type Locale } from 'date-fns/locale'
import Image from 'next/image'
import { useState } from 'react'

interface NewsCardProps {
  article: NewsArticle
  onClick: (article: NewsArticle) => void
  uiLanguage: string
  priority?: boolean
}

const DATE_LOCALES: Record<string, Locale> = {
  en: enUS,
  fr,
  de,
  all: enUS,
}

// Pool of 12 varied images per category — selected deterministically via article ID
// so the same article always shows the same image (no flicker on re-render)
const FALLBACK_POOLS: Record<string, string[]> = {
  science: [
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=700&q=80', // microscope blue
    'https://images.unsplash.com/photo-1628595351029-c2bf17511435?w=700&q=80', // DNA helix
    'https://images.unsplash.com/photo-1518152006812-edab29b069ac?w=700&q=80', // atom model
    'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=700&q=80', // lab test tubes
    'https://images.unsplash.com/photo-1564325724739-bae0bd08762c?w=700&q=80', // telescope stars
    'https://images.unsplash.com/photo-1581093804475-577d72e35328?w=700&q=80', // research lab
    'https://images.unsplash.com/photo-1613843433065-2a4f8fd1d6e7?w=700&q=80', // brain neuron
    'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=700&q=80', // earth from space
    'https://images.unsplash.com/photo-1538370965046-79c0d6907d47?w=700&q=80', // chemistry
    'https://images.unsplash.com/photo-1454789548928-9efd52dc4031?w=700&q=80', // space galaxy
    'https://images.unsplash.com/photo-1460186136353-977e9d6085a1?w=700&q=80', // satellite
    'https://images.unsplash.com/photo-1576086213369-97a306d36557?w=700&q=80', // petri dish
  ],
  environment: [
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=700&q=80', // forest light
    'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=700&q=80', // green mountains
    'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=700&q=80', // ocean waves
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=700&q=80', // sunrise mountains
    'https://images.unsplash.com/photo-1504275107627-0c2ba7a43dba?w=700&q=80', // wind turbines
    'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=700&q=80', // autumn forest
    'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=700&q=80', // aerial green
    'https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=700&q=80', // solar panels
    'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=700&q=80', // coral reef
    'https://images.unsplash.com/photo-1425913397330-cf8af2ff40a1?w=700&q=80', // river valley
    'https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=700&q=80', // wildflowers
    'https://images.unsplash.com/photo-1491555103944-7c647fd857e6?w=700&q=80', // snowy peak
  ],
  solidarity: [
    'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=700&q=80', // people hands
    'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=700&q=80', // volunteers
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=700&q=80', // group friends
    'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=700&q=80', // helping hands
    'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=700&q=80', // handshake
    'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=700&q=80', // community
    'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=700&q=80', // food bank
    'https://images.unsplash.com/photo-1543269664-7eef42226a21?w=700&q=80', // team work
    'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=700&q=80', // people together
    'https://images.unsplash.com/photo-1455849318743-b2233052fcff?w=700&q=80', // unity
    'https://images.unsplash.com/photo-1525026198548-4baa812f1183?w=700&q=80', // hug
    'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=700&q=80', // smile
  ],
  health: [
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=700&q=80', // running
    'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=700&q=80', // healthy food
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=700&q=80', // yoga sunrise
    'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=700&q=80', // medical
    'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?w=700&q=80', // fruits veggies
    'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=700&q=80', // heart health
    'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=700&q=80', // wellness salad
    'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=700&q=80', // doctor
    'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=700&q=80', // jogging
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=700&q=80', // vitamins
    'https://images.unsplash.com/photo-1593811167562-9cef47bfc4a7?w=700&q=80', // meditation
    'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=700&q=80', // family bike
  ],
  technology: [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?w=700&q=80', // circuit board
    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=700&q=80', // robot
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=700&q=80', // code matrix
    'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=700&q=80', // laptop dark
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=700&q=80', // cybersecurity
    'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=700&q=80', // AI neural
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=700&q=80', // globe data
    'https://images.unsplash.com/photo-1563770660941-20978e870e26?w=700&q=80', // VR headset
    'https://images.unsplash.com/photo-1516110833967-0b5716ca1387?w=700&q=80', // smart home
    'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=700&q=80', // drone
    'https://images.unsplash.com/photo-1589254065878-42c9da997008?w=700&q=80', // 5G network
    'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=700&q=80', // electric car
  ],
  sport: [
    'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=700&q=80', // stadium
    'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=700&q=80', // running track
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=700&q=80', // cycling
    'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=700&q=80', // football
    'https://images.unsplash.com/photo-1601855379898-88c9d80f5b2b?w=700&q=80', // swimming
    'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=700&q=80', // basketball
    'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=700&q=80', // golf
    'https://images.unsplash.com/photo-1540539234-c14a20fb7c7b?w=700&q=80', // marathon
    'https://images.unsplash.com/photo-1562552052-56f4c3e2f1cf?w=700&q=80', // tennis
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=700&q=80', // surf
    'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=700&q=80', // climbing
    'https://images.unsplash.com/photo-1547347298-4074fc3086f0?w=700&q=80', // gymnastics
  ],
  culture: [
    'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=700&q=80', // art painting
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=700&q=80', // music
    'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=700&q=80', // books library
    'https://images.unsplash.com/photo-1574126154517-d1e0d89ef734?w=700&q=80', // dance
    'https://images.unsplash.com/photo-1535016120720-40c646be5580?w=700&q=80', // cinema
    'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=700&q=80', // concert
    'https://images.unsplash.com/photo-1560523159-4a9692d222ef?w=700&q=80', // sculpture
    'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?w=700&q=80', // architecture
    'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=700&q=80', // music festival
    'https://images.unsplash.com/photo-1580542732183-b2a5e026b5f3?w=700&q=80', // museum
    'https://images.unsplash.com/photo-1525869916826-972fd09a7b47?w=700&q=80', // theater
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=700&q=80', // dj music
  ],
  animals: [
    'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=700&q=80', // fox
    'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=700&q=80', // turtle
    'https://images.unsplash.com/photo-1415369629372-26f2fe60c467?w=700&q=80', // cat curious
    'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=700&q=80', // golden retriever
    'https://images.unsplash.com/photo-1504006833117-8886a355efbf?w=700&q=80', // elephant
    'https://images.unsplash.com/photo-1549480017-d76466a4b7e8?w=700&q=80', // penguin
    'https://images.unsplash.com/photo-1568393691622-c7ba131d1b16?w=700&q=80', // whale
    'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=700&q=80', // panda
    'https://images.unsplash.com/photo-1591824438708-ce405b36b05b?w=700&q=80', // parrot
    'https://images.unsplash.com/photo-1516934024742-b461fba47600?w=700&q=80', // lion cubs
    'https://images.unsplash.com/photo-1528155987-c4fa91c32d56?w=700&q=80', // deer
    'https://images.unsplash.com/photo-1602491453631-e2a5ad90a131?w=700&q=80', // owl
  ],
  all: [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=700&q=80', // mountains
    'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=700&q=80', // ocean
    'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=700&q=80', // sunset field
    'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=700&q=80', // northern lights
    'https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=700&q=80', // cityscape
    'https://images.unsplash.com/photo-1491555103944-7c647fd857e6?w=700&q=80', // alpine
    'https://images.unsplash.com/photo-1518098268026-4e89f1a2cd8e?w=700&q=80', // meadow
    'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=700&q=80', // lake reflection
    'https://images.unsplash.com/photo-1542601906897-c4c8d6fe8820?w=700&q=80', // hands plant
    'https://images.unsplash.com/photo-1489549132488-d00b7eee80f1?w=700&q=80', // sunrise
    'https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?w=700&q=80', // forest path
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=700&q=80', // smile portrait
  ],
}

/** Pick a fallback from the pool deterministically using the article ID */
function pickFallback(category: string, articleId: string): string {
  const pool = FALLBACK_POOLS[category] || FALLBACK_POOLS.all
  // Turn the first 4 hex chars of the ID into a number → stable index
  const idx = parseInt(articleId.slice(0, 4), 16) % pool.length
  return pool[idx]
}

export default function NewsCard({ article, onClick, uiLanguage, priority = false }: NewsCardProps) {
  const cat = CATEGORIES.find(c => c.value === article.category)
  const dateLocale = DATE_LOCALES[uiLanguage] || enUS
  const fallback = pickFallback(article.category, article.id)
  const [imgSrc, setImgSrc] = useState(article.imageUrl || fallback)

  let timeAgo = ''
  try {
    timeAgo = formatDistanceToNow(new Date(article.publishedAt), {
      addSuffix: true,
      locale: dateLocale,
    })
  } catch {
    timeAgo = ''
  }

  return (
    <article
      onClick={() => onClick(article)}
      className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden border border-gray-100 hover:border-orange-200 hover:-translate-y-0.5 active:scale-[0.99]"
    >
      {/* Image */}
      <div className="relative h-48 w-full overflow-hidden bg-orange-50">
        <Image
          src={imgSrc}
          alt={article.title}
          fill
          className="object-cover"
          onError={() => setImgSrc(fallback)}
          unoptimized
          priority={priority}
        />
        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-sm text-orange-700 shadow-sm">
            {cat?.emoji} {cat?.labels[uiLanguage === 'all' ? 'en' : uiLanguage] || cat?.labels.en}
          </span>
        </div>
        {/* Language badge */}
        <div className="absolute top-3 right-3">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-black/30 text-white backdrop-blur-sm uppercase">
            {article.language}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h2 className="font-semibold text-gray-800 text-base leading-snug mb-2 line-clamp-2">
          {article.title}
        </h2>
        {article.excerpt && (
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 mb-3">
            {article.excerpt}
          </p>
        )}

        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="font-medium text-[#0D9488] truncate max-w-[140px]">{article.source}</span>
            {timeAgo && <span>· {timeAgo}</span>}
          </div>
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${
                  i < Math.round(article.positivityScore / 20)
                    ? 'bg-[#6BADA8]'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </article>
  )
}
