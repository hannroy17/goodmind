/**
 * Two-stage positivity filter:
 * 1. HARD BLOCK — any match → article is immediately rejected, no matter what else it says
 * 2. SCORE — starts at 0, positive signals add points, soft-negative signals subtract
 *    → article must reach threshold to pass
 *
 * Sources flagged as `trusted` skip the score check (they are 100% positive-news outlets)
 * but still go through the hard block (safety net).
 */

// ---------------------------------------------------------------------------
// HARD BLOCK — these topics should NEVER appear in GoodMind
// One match = immediate rejection
// ---------------------------------------------------------------------------

const HARD_BLOCK_EN = [
  // War & military conflict
  'war crimes', 'war criminal', 'bombing', 'airstrike', 'air strike', 'missile attack',
  'military offensive', 'troops deployed', 'civilian casualties', 'killed in', 'dead in',
  'invasion', 'occupation', 'occupied territory', 'ceasefire violated', 'hostage',
  'siege', 'genocide', 'massacre', 'ethnic cleansing', 'war zone', 'warzone', 'frontline',
  'shelling', 'artillery', 'insurgent', 'rebel forces', 'militia', 'west bank', 'gaza',
  'ukraine war', 'russia attacks', 'russian forces',
  // Death & violence
  'shooting', 'stabbing', 'murder', 'homicide', 'manslaughter', 'assassination',
  'death toll', 'fatalities', 'bodies found', 'found dead', 'execution',
  'suicide bomb', 'suicide attack', 'mass shooting', 'gunshot wound',
  // Crime & justice (negative framing)
  'trafficking', 'child abuse', 'sexual abuse', 'rape', 'terrorism', 'terrorist attack',
  'sentenced to prison', 'convicted of', 'pleads guilty', 'data breach', 'hacked',
  'cyberattack', 'ransomware', 'scam', 'phishing', 'fraud charges', 'money laundering',
  // Surveillance & privacy violations
  'mass surveillance', 'unauthorized tracking', 'privacy violation', 'spyware',
  // Disease outbreaks
  'hantavirus', 'ebola', 'epidemic spreads', 'outbreak spreads', 'virus spreads',
  'pandemic risk', 'disease spreading', 'new variant spreads', 'avian flu spread',
  'contamination alert', 'health emergency declared',
  // Natural disasters with victims
  'earthquake kills', 'tsunami kills', 'hurricane kills', 'floods kill', 'wildfire kills',
  'disaster kills', 'victims of flood', 'victims of earthquake',
  // Political crises
  'coup attempt', 'violent crackdown', 'riot police', 'political crisis',
  // Accidents
  'plane crash', 'train crash', 'deadly crash', 'fatal accident', 'crash kills',
]

const HARD_BLOCK_FR = [
  // Guerre & conflit militaire
  'crimes de guerre', 'bombardement', 'frappe aérienne', 'attaque de missile',
  'offensive militaire', 'victimes civiles', 'tués dans', 'morts dans',
  'invasion', 'occupation', 'occupé', 'territoire occupé', 'otage', 'siège',
  'génocide', 'massacre', 'zone de guerre', 'ligne de front', 'obus', 'milice',
  'cisjordanie', 'gaza', 'ukraine', 'exhumation', 'sidération',
  // Mort & violence
  'fusillade', 'coup de couteau', 'meurtre', 'homicide', 'assassinat',
  'bilan humain', 'corps retrouvés', 'retrouvé mort', 'exécution',
  'attentat-suicide', 'attentat terroriste', 'tuerie de masse',
  // Crime & justice
  'trafic d\'êtres humains', 'abus sexuels', 'viol', 'terrorisme', 'attaque terroriste',
  'condamné à la prison', 'reconnu coupable',
  // Cybersécurité négative & surveillance
  'cyberattaque', 'cyberattaques', 'piratage', 'ransomware', 'logiciel espion',
  'données compromises', 'fuite de données', 'données volées', 'arnaque',
  'hameçonnage', 'surveillance omniprésente', 'espionnage', 'piégé',
  'blanchiment d\'argent', 'enquête judiciaire', 'mis en examen',
  // Politique polémique
  'union des gauches', 'extrême droite', 'extrême gauche', 'souverainisme',
  'clash politique', 'polémique', 'affrontement politique',
  // Épidémies
  'hantavirus', 'ebola', 'épidémie se propage', 'foyer épidémique', 'virus se propage',
  'risque pandémique', 'maladie en expansion', 'nouveau variant se propage',
  'grippe aviaire se propage', 'alerte sanitaire', 'urgence sanitaire déclarée',
  // Catastrophes avec victimes
  'séisme fait des morts', 'tsunami meurtrier', 'ouragan meurtrier', 'inondations meurtrières',
  'incendie meurtrier', 'catastrophe fait des victimes',
  // Crises politiques
  'coup d\'état', 'répression violente', 'police anti-émeutes',
  // Décès & nécrologies
  'est mort', 'est décédée', 'est décédé', 'a trouvé la mort', 'décède', 'décédé à',
  'nous a quittés', 'vient de mourir',
  // Accidents mortels
  'crash d\'avion', 'déraillement meurtrier', 'accident mortel', 'collision fatale',
]

const HARD_BLOCK_DE = [
  // Krieg & Militärkonflikt
  'kriegsverbrechen', 'bombardierung', 'luftangriff', 'raketenangriff',
  'militäroffensive', 'zivile opfer', 'getötet in', 'tot in',
  'invasion', 'besatzung', 'besetzt', 'geisel', 'belagerung', 'völkermord', 'massaker',
  'kriegsgebiet', 'frontlinie', 'granaten', 'miliz', 'gazastreifen', 'ukraine-krieg',
  // Tod & Gewalt
  'schießerei', 'messerstecherei', 'mord', 'totschlag', 'attentat',
  'opferzahl', 'leichen gefunden', 'tot aufgefunden', 'hinrichtung',
  'selbstmordanschlag', 'terroranschlag', 'massenschießerei',
  // Kriminalität, Cybersecurity & Justiz
  'menschenhandel', 'sexueller missbrauch', 'vergewaltigung', 'terrorismus',
  'zu gefängnis verurteilt', 'schuldig gesprochen', 'cyberangriff', 'ransomware',
  'datenpanne', 'daten gestohlen', 'betrug mit', 'phishing', 'geldwäsche',
  // Epidemien
  'hantavirus', 'ebola', 'epidemie breitet sich aus', 'ausbruch breitet sich aus',
  'virus breitet sich aus', 'pandemierisiko', 'krankheit verbreitet sich',
  'neue variante breitet sich aus', 'kontaminationsalarm', 'gesundheitsnotstand',
  // Naturkatastrophen mit Opfern
  'erdbeben tötet', 'tsunami tötet', 'hurrikan tötet', 'überschwemmungen töten',
  'waldbrand tötet', 'katastrophe fordert opfer',
  // Politische Krisen
  'putschversuch', 'gewaltsame niederschlagung', 'bereitschaftspolizei',
  // Spionage & Geopolitik
  'industriespionage', 'nordkorea', 'russland-krieg', 'spionage', 'geheimdienst skandal',
  // Todesfälle & Nachrufe
  'ist gestorben', 'ist tot', 'verstarb', 'tod von', 'gestorben am',
  // Tödliche Unfälle
  'flugzeugabsturz', 'tödlicher zugunglück', 'tödlicher unfall',
]

// ---------------------------------------------------------------------------
// SOFT NEGATIVE — subtract points but don't auto-reject
// ---------------------------------------------------------------------------

const SOFT_NEGATIVE_EN = [
  'warn', 'warning', 'concern', 'worried', 'risk', 'threat', 'danger', 'fear',
  'decline', 'drop', 'fall', 'loss', 'fail', 'failure', 'problem', 'trouble',
  'struggle', 'difficult', 'challenge', 'crisis', 'conflict', 'dispute',
  'protest', 'strike', 'sanction', 'ban', 'restrict', 'inflation', 'recession',
  'layoff', 'bankrupt', 'collapse', 'fraud', 'corruption', 'scandal',
  'arrested', 'accused', 'suspect', 'investigation',
]

const SOFT_NEGATIVE_FR = [
  'avertissement', 'inquiétude', 'risque', 'menace', 'danger', 'peur',
  'baisse', 'chute', 'perte', 'échec', 'problème', 'difficulté',
  'lutte', 'crise', 'conflit', 'différend', 'grève', 'sanction', 'interdiction',
  'inflation', 'récession', 'licenciement', 'faillite', 'effondrement',
  'fraude', 'corruption', 'scandale', 'arrestation', 'accusé', 'suspect',
  'défi', 'inquiétant', 'alarmant', 'sidération',
]

const SOFT_NEGATIVE_DE = [
  'warnung', 'sorge', 'risiko', 'bedrohung', 'gefahr', 'angst',
  'rückgang', 'verlust', 'versagen', 'misserfolg', 'problem', 'schwierigkeiten',
  'kampf', 'krise', 'konflikt', 'streit', 'streik', 'sanktion', 'verbot',
  'inflation', 'rezession', 'entlassung', 'insolvenz', 'zusammenbruch',
  'betrug', 'korruption', 'skandal', 'verhaftet', 'beschuldigt', 'verdächtig',
]

// ---------------------------------------------------------------------------
// POSITIVE SIGNALS — score starts at 0, must accumulate enough points
// ---------------------------------------------------------------------------

const POSITIVE_EN = [
  // Breakthroughs & science
  'breakthrough', 'discovery', 'scientists discover', 'researchers find', 'new cure',
  'first ever', 'world first', 'historic achievement', 'milestone', 'record-breaking',
  'revolutionary', 'game-changer', 'pioneering',
  // Health & healing
  'cure', 'treatment works', 'vaccine success', 'recovery', 'remission',
  'healed', 'restored', 'survived', 'life-saving', 'healing',
  // Environment & nature
  'species saved', 'population recovers', 'reforestation', 'clean energy record',
  'renewable energy', 'carbon reduction', 'ocean cleanup', 'rewilding',
  'protected area', 'conservation success', 'ecosystem restored',
  // Solidarity & community
  'volunteers', 'community comes together', 'raises money for', 'donates',
  'fundraiser', 'helped', 'rescued', 'saved', 'reunited', 'support',
  // Joy & inspiration
  'inspiring', 'heartwarming', 'uplifting', 'wholesome', 'joy', 'happiness',
  'celebrate', 'celebration', 'award', 'honored', 'recognized', 'grateful',
  // Progress & innovation
  'innovation', 'solution', 'progress', 'improvement', 'advance', 'achieves',
  'succeeds', 'success', 'win', 'victory', 'champion', 'accomplish',
  // Positive outcomes
  'hope', 'positive', 'good news', 'great news', 'wonderful', 'remarkable',
  'thriving', 'flourishing', 'growing', 'booming', 'expanding',
]

const POSITIVE_FR = [
  // Percées & science
  'percée', 'découverte', 'scientifiques découvrent', 'chercheurs trouvent',
  'nouveau traitement', 'première mondiale', 'exploit historique', 'record',
  'révolutionnaire', 'pionnier', 'étude montre', 'recherche prouve',
  // Santé & guérison
  'guérison', 'traitement efficace', 'vaccin réussi', 'rémission',
  'guéri', 'rétabli', 'survécu', 'sauve des vies', 'thérapie prometteuse',
  'santé améliorée', 'bien-être', 'longévité', 'espérance de vie',
  // Environnement & nature
  'espèce sauvée', 'population se rétablit', 'reforestation', 'record d\'énergie renouvelable',
  'énergie propre', 'réduction carbone', 'nettoyage des océans', 'rewilding',
  'zone protégée', 'succès de conservation', 'écosystème restauré', 'biodiversité',
  'espèce protégée', 'nature préservée', 'forêt restaurée',
  // Solidarité & communauté
  'bénévoles', 'bénévole', 'communauté se mobilise', 'collecte de fonds', 'don',
  'aidé', 'sauvé', 'secouru', 'réuni', 'soutien', 'solidarité', 'entraide',
  'mobilise', 'mobilisation', 'générosité', 'dons', 'collecte', 'aide humanitaire',
  // Joie, inspiration & humain
  'inspirant', 'inspirante', 'touchant', 'réconfortant', 'positif', 'joie', 'bonheur',
  'célébrer', 'célébration', 'récompense', 'honoré', 'reconnu', 'fière', 'fier',
  'exploit', 'prouesse', 'performance', 'médaille', 'podium', 'lauréat', 'primé',
  'hommage', 'témoignage', 'vie meilleure', 'success story',
  // Progrès & innovation
  'innovation', 'solution', 'progrès', 'amélioration', 'avancée',
  'réussit', 'réussite', 'succès', 'victoire', 'champion', 'accomplissement',
  'développement durable', 'startup', 'levée de fonds', 'croissance',
  // Résultats positifs
  'espoir', 'bonne nouvelle', 'formidable', 'remarquable',
  'prospère', 'florissant', 'en croissance', 'optimiste', 'prometteur',
]

const POSITIVE_DE = [
  // Durchbrüche & Wissenschaft
  'durchbruch', 'entdeckung', 'wissenschaftler entdecken', 'forscher finden',
  'neue therapie', 'weltpremiere', 'historische leistung', 'rekord',
  'revolutionär', 'wegweisend', 'studie zeigt', 'forschung beweist',
  // Gesundheit & Heilung
  'heilung', 'behandlung wirkt', 'impfstoff erfolgreich', 'genesung', 'remission',
  'geheilt', 'wiederhergestellt', 'überlebt', 'lebensrettend', 'wohlbefinden',
  'gesundheit verbessert', 'lebenserwartung steigt', 'neue therapie zugelassen',
  // Umwelt & Natur
  'art gerettet', 'population erholt sich', 'aufforstung', 'rekord erneuerbare energie',
  'saubere energie', 'co2-reduzierung', 'meeresreinigung', 'rewilding',
  'schutzgebiet', 'naturschutz-erfolg', 'ökosystem wiederhergestellt', 'biodiversität',
  'artenschutz', 'natur geschützt', 'wald restauriert',
  // Solidarität & Gemeinschaft
  'ehrenamtliche', 'ehrenamt', 'gemeinschaft', 'spendensammlung', 'spendet',
  'geholfen', 'gerettet', 'wieder vereint', 'unterstützung', 'solidarität', 'zusammenhalt',
  'mobilisiert', 'generosität', 'spenden', 'hilfe', 'humanitär',
  // Freude, Inspiration & Leistung
  'inspirierend', 'herzerwärmend', 'positiv', 'freude', 'glück',
  'feiern', 'feier', 'auszeichnung', 'geehrt', 'anerkannt', 'stolz',
  'leistung', 'erfolg', 'sieg', 'meister', 'rekord', 'medaille', 'podium', 'preis',
  'hommage', 'würdigung',
  // Fortschritt & Innovation
  'innovation', 'lösung', 'fortschritt', 'verbesserung', 'durchbruch',
  'gelingt', 'startup', 'wachstum', 'nachhaltigkeit', 'erneuerbar',
  // Positive Ergebnisse
  'hoffnung', 'gute nachrichten', 'wunderbar', 'bemerkenswert',
  'gedeihen', 'blühend', 'wachsend', 'optimistisch', 'vielversprechend',
]

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

type Lang = 'en' | 'fr' | 'de'

function detectLanguage(text: string): Lang {
  const frMarkers = [' le ', ' la ', ' les ', ' de ', ' du ', ' un ', ' une ', ' est ', ' sont ', ' avec ', ' pour ', ' dans ']
  const deMarkers = [' der ', ' die ', ' das ', ' ein ', ' eine ', ' ist ', ' sind ', ' mit ', ' für ', ' und ', ' auf ']
  const lower = text.toLowerCase()
  const frScore = frMarkers.filter(w => lower.includes(w)).length
  const deScore = deMarkers.filter(w => lower.includes(w)).length
  if (frScore > deScore && frScore >= 2) return 'fr'
  if (deScore > frScore && deScore >= 2) return 'de'
  return 'en'
}

function isHardBlocked(text: string, lang: Lang): boolean {
  const lower = text.toLowerCase()
  const blocks = lang === 'fr' ? HARD_BLOCK_FR : lang === 'de' ? HARD_BLOCK_DE : HARD_BLOCK_EN
  // Always also check English hard blocks (many articles mix languages or use English terms)
  const allBlocks = lang === 'en' ? blocks : [...blocks, ...HARD_BLOCK_EN]
  return allBlocks.some(term => lower.includes(term.toLowerCase()))
}

function computeScore(text: string, lang: Lang): number {
  const lower = text.toLowerCase()

  const positives = lang === 'fr' ? POSITIVE_FR : lang === 'de' ? POSITIVE_DE : POSITIVE_EN
  const softNegs = lang === 'fr' ? SOFT_NEGATIVE_FR : lang === 'de' ? SOFT_NEGATIVE_DE : SOFT_NEGATIVE_EN

  let score = 0
  for (const term of positives) {
    if (lower.includes(term.toLowerCase())) score += 15
  }
  for (const term of softNegs) {
    if (lower.includes(term.toLowerCase())) score -= 8
  }
  return Math.max(0, Math.min(100, score))
}

export function scorePositivity(title: string, excerpt: string, lang?: string): number {
  const text = `${title} ${excerpt}`
  const detectedLang = (lang as Lang | undefined) || detectLanguage(text)
  if (isHardBlocked(text, detectedLang)) return 0
  return computeScore(text, detectedLang)
}

/**
 * @param trusted - if true, skip score check (source is a dedicated positive-news outlet
 *                  or uses a positive-only search query). Hard blocks still apply.
 */
export function isPositive(
  title: string,
  excerpt: string,
  lang?: string,
  trusted = false,
  threshold = 15,
): boolean {
  const text = `${title} ${excerpt}`
  const detectedLang = (lang as Lang | undefined) || detectLanguage(text)

  // Hard block always wins
  if (isHardBlocked(text, detectedLang)) return false

  // Trusted sources only need to pass the hard-block check
  if (trusted) return true

  return computeScore(text, detectedLang) >= threshold
}
