// Moroccan Darija search expansion -- additive candidate terms for the
// existing scored/ranked/typo-tolerant search in src/utils/normalize.ts.
// This module never replaces that engine: it only produces extra candidate
// strings (the raw query, its filler-stripped core, and any catalog terms a
// colloquial word maps to) that the caller runs through scoreProduct()
// itself, so ranking, typo tolerance, and description matching are all
// still driven by normalize.ts, unchanged.
//
// IMPORTANT: scoreProduct -> matchScore -> normalizeStr (normalize.ts) only
// lowercases and strips Latin accents -- it does NOT unify Arabic letter
// variants (ة/ه, ى/ي, أ/ا, ...). normalizeDarija() below is
// therefore used ONLY to build/look up synonym-map keys. The values stored
// in the map (and returned by expandDarijaTerms) are kept exactly as they
// appear in the live catalog's name_ar field, so they still match via
// normalizeStr.

const DIACRITICS = /[ً-ٰٟـ]/g; // tashkeel + tatweel
const DIGITS = /[0-9٠-٩.,]/g;

/** Query-side-only normalization: never applied to synonym map values. */
export function normalizeDarija(s: string): string {
  return s
    .normalize("NFD").replace(/[̀-ͯ]/g, "") // Latin accents
    .toLowerCase()
    .replace(DIACRITICS, "")
    .replace(/[أإآ]/g, "ا") // أإآ -> ا (alef variants)
    .replace(/ة/g, "ه")               // ة -> ه (ta marbuta -> ha)
    .replace(/ى/g, "ي")               // ى -> ي (alef maksura -> ya)
    .replace(/ؤ/g, "و")               // ؤ -> و (waw hamza -> waw)
    .replace(/ئ/g, "ي")               // ئ -> ي (ya hamza -> ya)
    .replace(/\s+/g, " ")
    .trim();
}

// Filler words common in spoken/typed Darija orders (normalized form).
const STOPWORDS = new Set([
  "بغيت", "بغينا", "عطيني", "عطينا", "جيب", "ديال", "ديالي", "كيلو", "كيلوغرام", "كغ",
  "kg", "نص", "نصف", "ربع", "شي", "واحد", "وحده", "جوج", "زوج", "تلاته", "من", "فيه",
  "عافاك", "الله", "يخليك", "عندكم", "واش", "je", "veux", "un", "une", "des", "du", "de", "kilo",
]);

function isStopToken(token: string): boolean {
  const n = normalizeDarija(token).replace(DIGITS, "");
  if (!n) return true; // pure digits/punctuation
  return STOPWORDS.has(n);
}

// Colloquial term -> real catalog name_ar values, verified against the live
// catalog. Values are the literal name_ar strings -- NOT normalized -- so
// they match scoreProduct's own (Arabic-variant-agnostic) comparison.
const RAW_SYNONYMS: Record<string, string[]> = {
  "مطيشة":   ["طماطم"],
  "مطياشة":  ["طماطم"],
  "الطماطم": ["طماطم"],
  "بطاطس":   ["بطاطا"],
  "دنجال":   ["باذنجان"],
  "برانية":  ["باذنجان"],
  "قرع":     ["قرعة خضراء", "كرعة حمراء"],
  "الكرعة":  ["قرعة خضراء", "كرعة حمراء"],
  "كرعة":    ["قرعة خضراء", "كرعة حمراء"],
  "فلفلة":   ["فلفل أخضر", "فلفلة حمراء", "فلفل حار"],
  "فلفل":    ["فلفل أخضر", "فلفلة حمراء", "فلفل حار"],
  "حرور":    ["فلفل حار"],
  "كزبرة":   ["قوزبر"],
  "قزبور":   ["قوزبر"],
  "بقدونس":  ["معدنوس"],
  "مقدونس":  ["معدنوس"],
  "ليمون":   ["الحامض"],
  "حامض":    ["الحامض"],
  "بصلة":    ["بصل أحمر", "بصل أصفر"],
  "خيزو":    ["جزر"],
  "لوبيا":   ["فاصوليا خضراء"],
  "بنان":    ["موز", "بنان كبير"],
  "دلاح":    ["دلاح طبيعي", "الدّلاح"],
  "فريز":    ["فراولة"],
  "لحم":     ["شرائح لحم بقري", "لحم الإنتركوت البقري"],
  "دجاجة":   ["دجاج كامل"],
  "فروج":    ["دجاج كامل"],
  "بيض":     ["بيض بلدي", "بلاطو 12 البيضة"],
  "زيت":     ["زيت زيتون"],
  "عسل":     ["عسل الأزهار 500غ"],
  // French -> Arabic bridges
  "tomate":  ["طماطم"],
  "tomates": ["طماطم"],
  "oignon":  ["بصل أحمر", "بصل أصفر"],
  "citron":  ["الحامض"],
  "poulet":  ["دجاج كامل", "صدر الدجاج"],
};

// Keys normalized for lookup; values kept exactly as written above (raw
// catalog form) -- see the module docstring for why.
const SYNONYMS = new Map<string, string[]>(
  Object.entries(RAW_SYNONYMS).map(([k, v]) => [normalizeDarija(k), v]),
);

const MAX_CANDIDATES = 8;

/**
 * Returns candidate search strings for `raw`: the original query, its
 * filler-word-stripped core (original spelling preserved -- only stopwords/
 * digits/units are dropped), and any catalog terms colloquial words in it
 * map to. Callers run each candidate through scoreProduct() themselves and
 * take the best score -- this function never scores or filters products
 * itself.
 */
export function expandDarijaTerms(raw: string): string[] {
  const original = raw.trim();
  if (!original) return [];

  const rawTokens = original.split(/\s+/);
  const coreTokens = rawTokens.filter((t) => !isStopToken(t));
  const core = coreTokens.join(" ").trim();

  const candidates = new Set<string>();
  candidates.add(original);
  if (core) candidates.add(core);

  const lookupTargets = core ? [core, ...coreTokens] : rawTokens;
  const ALEF_LAM = "ال"; // "ال"
  for (const t of lookupTargets) {
    if (candidates.size >= MAX_CANDIDATES) break;
    const norm = normalizeDarija(t);
    const variants = norm.startsWith(ALEF_LAM)
      ? [norm, norm.slice(ALEF_LAM.length)]
      : [norm, ALEF_LAM + norm];
    for (const v of variants) {
      const mapped = SYNONYMS.get(v);
      mapped?.forEach((m) => candidates.add(m));
    }
  }

  return [...candidates].slice(0, MAX_CANDIDATES);
}
