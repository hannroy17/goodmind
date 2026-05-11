import { NewsSource } from '@/types/news'

/**
 * All URLs verified as reachable and parseable by rss-parser.
 *
 * EXCLUDED (do not re-add without testing):
 *  - Reddit.*  → 403 on server-side requests
 *  - positivr.fr → XML entity parse error
 *  - wissenschaft.de → XML tag parse error
 *  - apotheken-umschau.de → XML ampersand parse error
 *  - france24/rfi/spiegel/dw (general feeds) → mix war/crime with good news
 *  - BBC Uplifting/Good News → despite the name, content is negative (scams, deepfakes, hantavirus)
 *  - The Optimist Daily → SSL error
 *  - Breaking Bright → connection timeout
 *  - Utopia DE → "wir subventionieren unseren untergang" type content
 *  - Perspective Daily → "nach diesem text deinstallierst du...", "dein Tod" — too mixed
 *  - Reporterre → political/conflict content ("la colère monte", "Trump consumérisme")
 *  - We Demain / Sunny Skyz / Solutions Journalism → 404
 *  - Le Monde Santé/Société/Sport/Culture → general news, too much negative content
 *  - APITube, Open Newswire → require API key or not parseable
 */

export const RSS_SOURCES: NewsSource[] = [

  // ─── ENGLISH — Trusted (100% positive-news outlets) ─────────────────────

  {
    url: 'https://www.goodnewsnetwork.org/feed/',
    name: 'Good News Network',
    language: 'en',
    category: 'all',
    trusted: true,
  },
  {
    url: 'https://www.positive.news/feed/',
    name: 'Positive News',
    language: 'en',
    category: 'all',
    trusted: true,
  },
  {
    url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss',
    name: 'NASA',
    language: 'en',
    category: 'science',
    trusted: true,
  },

  // ─── ENGLISH — Science ───────────────────────────────────────────────────

  {
    url: 'https://www.sciencedaily.com/rss/top/science.xml',
    name: 'Science Daily',
    language: 'en',
    category: 'science',
  },
  {
    url: 'https://www.sciencedaily.com/rss/health_medicine.xml',
    name: 'Science Daily — Health',
    language: 'en',
    category: 'health',
  },
  {
    url: 'https://feeds.nature.com/nature/rss/current',
    name: 'Nature',
    language: 'en',
    category: 'science',
  },
  {
    url: 'https://www.smithsonianmag.com/rss/latest_articles/',
    name: 'Smithsonian Magazine',
    language: 'en',
    category: 'science',
  },

  // ─── ENGLISH — Technology ────────────────────────────────────────────────

  {
    url: 'https://www.wired.com/feed/category/science/latest/rss',
    name: 'Wired Science',
    language: 'en',
    category: 'technology',
  },
  {
    url: 'https://www.technologyreview.com/feed/',
    name: 'MIT Technology Review',
    language: 'en',
    category: 'technology',
  },

  // ─── ENGLISH — Environment ───────────────────────────────────────────────

  {
    url: 'https://www.theguardian.com/environment/climate-crisis/rss',
    name: 'The Guardian — Climate',
    language: 'en',
    category: 'environment',
  },

  // ─── ENGLISH — Health ────────────────────────────────────────────────────

  {
    url: 'https://www.healthline.com/rss/health-news',
    name: 'Healthline',
    language: 'en',
    category: 'health',
  },

  // ─── ENGLISH — Solutions & Constructive journalism ────────────────────────

  {
    url: 'https://reasonstobecheerful.world/feed/',
    name: 'Reasons to Be Cheerful',
    language: 'en',
    category: 'all',
    trusted: true,
  },
  {
    url: 'https://www.upworthy.com/rss',
    name: 'Upworthy',
    language: 'en',
    category: 'solidarity',
  },
  {
    url: 'https://www.shareable.net/feed/',
    name: 'Shareable',
    language: 'en',
    category: 'solidarity',
  },

  // ─── ENGLISH — Impact & Social innovation ────────────────────────────────

  {
    url: 'https://www.thebetterindia.com/feed/',
    name: 'The Better India',
    language: 'en',
    category: 'solidarity',
    trusted: true, // 100% solutions / inspiring stories from India & world
  },

  // ─── FRENCH — Lifestyle & Transition ────────────────────────────────────

  {
    url: 'https://www.kaizen-magazine.com/feed/',
    name: 'Kaizen Magazine',
    language: 'fr',
    category: 'environment',
    // Ecological transition & positive lifestyle — not 100% positive, needs filtering
  },

  // ─── FRENCH — Science & Innovation ───────────────────────────────────────

  {
    url: 'https://www.futura-sciences.com/rss/actualites.xml',
    name: 'Futura Sciences',
    language: 'fr',
    category: 'science',
  },
  {
    url: 'https://www.science-et-vie.com/feed',
    name: 'Science & Vie',
    language: 'fr',
    category: 'science',
  },
  {
    url: 'https://www.lemonde.fr/sciences/rss_full.xml',
    name: 'Le Monde — Sciences',
    language: 'fr',
    category: 'science',
  },

  // ─── FRENCH — Environment ────────────────────────────────────────────────

  {
    url: 'https://www.lemonde.fr/planete/rss_full.xml',
    name: 'Le Monde — Planète',
    language: 'fr',
    category: 'environment',
  },
  {
    url: 'https://mrmondialisation.org/feed/',
    name: 'Mr Mondialisation',
    language: 'fr',
    category: 'environment',
  },

  // ─── FRENCH — Google News (positive-only search queries) ─────────────────

  {
    url: 'https://news.google.com/rss/search?q=d%C3%A9couverte+scientifique+prometteur+OR+record+OR+gu%C3%A9rison+succ%C3%A8s&hl=fr&gl=FR&ceid=FR:fr',
    trusted: true,
    name: 'Google News FR — Découvertes',
    language: 'fr',
    category: 'science',
  },
  {
    url: 'https://news.google.com/rss/search?q=%C3%A9nergie+renouvelable+record+OR+reforestation+OR+esp%C3%A8ce+sauv%C3%A9e+OR+biodiversit%C3%A9+progr%C3%A8s&hl=fr&gl=FR&ceid=FR:fr',
    trusted: true,
    name: 'Google News FR — Environnement',
    language: 'fr',
    category: 'environment',
  },
  {
    url: 'https://news.google.com/rss/search?q=innovation+sant%C3%A9+traitement+r%C3%A9ussi+OR+gu%C3%A9rison+OR+vaccin+efficace+OR+th%C3%A9rapie+prometteuse&hl=fr&gl=FR&ceid=FR:fr',
    trusted: true,
    name: 'Google News FR — Santé',
    language: 'fr',
    category: 'health',
  },
  {
    url: 'https://news.google.com/rss/search?q=solidarit%C3%A9+b%C3%A9n%C3%A9voles+collecte+aide+succ%C3%A8s+France&hl=fr&gl=FR&ceid=FR:fr',
    trusted: true,
    name: 'Google News FR — Solidarité',
    language: 'fr',
    category: 'solidarity',
  },
  {
    url: 'https://news.google.com/rss/search?q=innovation+technologie+fran%C3%A7aise+startup+r%C3%A9ussite+OR+lev%C3%A9e+de+fonds&hl=fr&gl=FR&ceid=FR:fr',
    trusted: true,
    name: 'Google News FR — Tech',
    language: 'fr',
    category: 'technology',
  },
  {
    url: 'https://news.google.com/rss/search?q=sport+exploit+record+victoire+champion+France&hl=fr&gl=FR&ceid=FR:fr',
    trusted: true,
    name: 'Google News FR — Sport',
    language: 'fr',
    category: 'sport',
  },
  {
    url: 'https://news.google.com/rss/search?q=culture+art+patrimoine+r%C3%A9compense+succ%C3%A8s+France&hl=fr&gl=FR&ceid=FR:fr',
    trusted: true,
    name: 'Google News FR — Culture',
    language: 'fr',
    category: 'culture',
  },

  // ─── GERMAN — Trusted (dedicated positive-news outlet) ──────────────────

  {
    url: 'https://goodnews.eu/feed/',
    name: 'Good News EU',
    language: 'de',
    category: 'all',
    trusted: true, // aggregates only positive news from EU & world, multiple stories per item
  },

  // ─── GERMAN — Science ────────────────────────────────────────────────────

  {
    url: 'https://www.spektrum.de/alias/rss/spektrum-de-rss-feed/996406',
    name: 'Spektrum der Wissenschaft',
    language: 'de',
    category: 'science',
  },

  // ─── GERMAN — Technology ─────────────────────────────────────────────────

  {
    url: 'https://t3n.de/rss.xml',
    name: 't3n — Digital Pioneers',
    language: 'de',
    category: 'technology',
  },

  // ─── GERMAN — Google News (positive-only search queries) ─────────────────

  {
    url: 'https://news.google.com/rss/search?q=erneuerbare+Energie+Rekord+OR+Aufforstung+OR+Artenschutz+Erfolg+OR+Naturschutz&hl=de&gl=DE&ceid=DE:de',
    trusted: true,
    name: 'Google News DE — Umwelt',
    language: 'de',
    category: 'environment',
  },
  {
    url: 'https://news.google.com/rss/search?q=medizinischer+Durchbruch+OR+Heilung+OR+neues+Medikament+zugelassen+OR+Therapie+erfolgreich&hl=de&gl=DE&ceid=DE:de',
    trusted: true,
    name: 'Google News DE — Gesundheit',
    language: 'de',
    category: 'health',
  },
  {
    url: 'https://news.google.com/rss/search?q=Innovation+Technologie+Deutschland+Erfolg+OR+Durchbruch+OR+Startup+Wachstum&hl=de&gl=DE&ceid=DE:de',
    trusted: true,
    name: 'Google News DE — Technologie',
    language: 'de',
    category: 'technology',
  },
  {
    url: 'https://news.google.com/rss/search?q=wissenschaftliche+Entdeckung+Durchbruch+OR+Forschungserfolg+OR+neue+Erkenntnisse&hl=de&gl=DE&ceid=DE:de',
    trusted: true,
    name: 'Google News DE — Wissenschaft',
    language: 'de',
    category: 'science',
  },
  {
    url: 'https://news.google.com/rss/search?q=Ehrenamt+Solidarit%C3%A4t+Hilfe+Erfolg+Deutschland+OR+Gemeinschaft&hl=de&gl=DE&ceid=DE:de',
    trusted: true,
    name: 'Google News DE — Solidarität',
    language: 'de',
    category: 'solidarity',
  },
  {
    url: 'https://news.google.com/rss/search?q=Sport+Rekord+Sieg+Meister+Deutschland+Erfolg&hl=de&gl=DE&ceid=DE:de',
    trusted: true,
    name: 'Google News DE — Sport',
    language: 'de',
    category: 'sport',
  },
  {
    url: 'https://news.google.com/rss/search?q=Kultur+Kunst+Auszeichnung+Preis+Erfolg+Deutschland&hl=de&gl=DE&ceid=DE:de',
    trusted: true,
    name: 'Google News DE — Kultur',
    language: 'de',
    category: 'culture',
  },
]
