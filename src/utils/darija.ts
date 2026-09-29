// Moroccan Darija search expansion -- additive candidate terms for the
// existing scored/ranked/typo-tolerant search in src/utils/normalize.ts.
// This module never replaces that engine: it only produces extra candidate
// strings (the raw query, its filler-stripped core, and any catalog terms a
// colloquial word maps to) that get scored via scoreProduct() -- see
// searchProducts() below, the single pipeline both search surfaces
// (HomePage's catalog filter and GlobalSearchBar's header autocomplete)
// must call, so no surface ever matches against a raw, unexpanded query.
//
// IMPORTANT: scoreProduct -> matchScore -> normalizeStr (normalize.ts) only
// lowercases and strips Latin accents -- it does NOT unify Arabic letter
// variants (ة/ه, ى/ي, أ/ا, ...) or strip punctuation. normalizeDarija()
// below is therefore used ONLY to build/look up synonym-map keys. The
// values stored in the map (and returned by expandDarijaTerms) are kept
// exactly as they appear in the live catalog's name_ar field, so they
// still match via normalizeStr.

import { scoreProduct, MIN_RELEVANT_SCORE, levenshtein, type ScorableProduct } from "./normalize";
import { logVoiceEvent, isVoiceDebugEnabled } from "./voiceDebugLog";

const DIACRITICS = /[ً-ٰٟـ]/g; // tashkeel + tatweel
// Punctuation speech transcripts commonly add ("بغيت مطيشة." / "مطيشة؟") plus
// digits (Latin and Arabic-Indic) -- stripped globally in normalizeDarija,
// not just inside the stopword check, so a trailing "." can't make a
// synonym-map lookup miss (e.g. "مطيشة." must still find the "مطيشة" key).
const PUNCT_AND_DIGITS = /[.,،؛؟?!:"'«»()\-0-9٠-٩]/g;

/** Query-side-only normalization: never applied to synonym map values. */
export function normalizeDarija(s: string): string {
  return s
    .normalize("NFD").replace(/[̀-ͯ]/g, "") // Latin accents
    .toLowerCase()
    .replace(DIACRITICS, "")
    .replace(PUNCT_AND_DIGITS, "")
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
  const n = normalizeDarija(token); // already strips digits/punctuation
  if (!n) return true; // was pure digits/punctuation
  return STOPWORDS.has(n);
}

// Colloquial term -> real catalog name_ar values, verified against the live
// catalog. Values are the literal name_ar strings -- NOT normalized -- so
// they match scoreProduct's own (Arabic-variant-agnostic) comparison.
const RAW_SYNONYMS: Record<string, string[]> = {
  "مطيشة":   ["طماطم"],
  "مطياشة":  ["طماطم"],
  "الطماطم": ["طماطم"],
  // Speech-engine spelling variants for tomatoes -- Google's transcriber
  // isn't consistent about how it renders this word.
  "ماطيشة":   ["طماطم"],
  "مطيشا":    ["طماطم"],
  "طوماطيش":  ["طماطم"],
  "طماطيش":   ["طماطم"],
  "الماطيشة": ["طماطم"],
  "بطاطس":   ["بطاطا"],
  "بطاطة":   ["بطاطا"],
  "دنجال":   ["باذنجان"],
  "برانية":  ["باذنجان"],
  "بادنجال": ["باذنجان"],
  "دنجالة":  ["باذنجان"],
  "بادنجان": ["باذنجان"],
  "قرع":     ["قرعة خضراء", "كرعة حمراء"],
  "الكرعة":  ["قرعة خضراء", "كرعة حمراء"],
  "كرعة":    ["قرعة خضراء", "كرعة حمراء"],
  "فلفلة":   ["فلفل أخضر", "فلفلة حمراء", "فلفل حار"],
  "فلفل":    ["فلفل أخضر", "فلفلة حمراء", "فلفل حار"],
  "فليفلة":  ["فلفل أخضر", "فلفلة حمراء", "فلفل حار"],
  "فلفلا":   ["فلفل أخضر", "فلفلة حمراء", "فلفل حار"],
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
const SYNONYM_KEYS = [...SYNONYMS.keys()];

const MAX_CANDIDATES = 8;
const ALEF_LAM = "ال";

/**
 * Exact-key lookup with the ال-prefix toggle; falls back to a fuzzy
 * (Levenshtein <=1) match against dictionary keys for tokens 4+ characters
 * long, so speech-engine misspellings ("ماطيشة" vs the dictionary's
 * "مطيشة") don't need a hand-listed entry for every variant.
 */
function lookupSynonyms(normalizedToken: string): string[] | undefined {
  const variants = normalizedToken.startsWith(ALEF_LAM)
    ? [normalizedToken, normalizedToken.slice(ALEF_LAM.length)]
    : [normalizedToken, ALEF_LAM + normalizedToken];

  for (const v of variants) {
    const exact = SYNONYMS.get(v);
    if (exact) return exact;
  }

  if (normalizedToken.length < 4) return undefined;
  for (const key of SYNONYM_KEYS) {
    if (Math.abs(key.length - normalizedToken.length) > 1) continue; // cheap pre-filter
    if (levenshtein(normalizedToken, key) <= 1) return SYNONYMS.get(key);
  }
  return undefined;
}

interface DarijaExpansion {
  normalized: string;
  core:       string;
  candidates: string[];
}

function expandDarijaTermsVerbose(raw: string): DarijaExpansion {
  const original = raw.trim();
  if (!original) return { normalized: "", core: "", candidates: [] };

  const normalized = normalizeDarija(original);
  const rawTokens = original.split(/\s+/);
  const coreTokens = rawTokens.filter((t) => !isStopToken(t));
  const core = coreTokens.join(" ").trim();

  const candidates = new Set<string>();
  candidates.add(original);
  if (core) candidates.add(core);

  const lookupTargets = core ? [core, ...coreTokens] : rawTokens;
  for (const t of lookupTargets) {
    if (candidates.size >= MAX_CANDIDATES) break;
    lookupSynonyms(normalizeDarija(t))?.forEach((m) => candidates.add(m));
  }

  return { normalized, core, candidates: [...candidates].slice(0, MAX_CANDIDATES) };
}

/**
 * Returns candidate search strings for `raw`: the original query, its
 * filler-word-stripped core (original spelling preserved -- only stopwords/
 * digits/units/punctuation are dropped), and any catalog terms colloquial
 * words in it map to (exact or fuzzy). Callers run each candidate through
 * scoreProduct() themselves and take the best score -- this function never
 * scores or filters products itself. Prefer searchProducts() below unless
 * you specifically need the raw candidate list.
 */
export function expandDarijaTerms(raw: string): string[] {
  return expandDarijaTermsVerbose(raw).candidates;
}

export interface ScoredProduct<T> {
  p:     T;
  score: number;
}

/**
 * The one search pipeline -- both HomePage's catalog filter and
 * GlobalSearchBar's header autocomplete must call this, not scoreProduct()
 * directly, so neither surface ever matches against a raw, unexpanded
 * query. Empty query returns []; callers keep their own branching for what
 * to show when there's no query (full catalog, closed dropdown, etc).
 */
export function searchProducts<T extends ScorableProduct>(products: T[], rawQuery: string): ScoredProduct<T>[] {
  const q = rawQuery.trim();
  if (!q) return [];

  const { normalized, core, candidates } = expandDarijaTermsVerbose(q);
  const scored = products
    .map((p) => ({ p, score: Math.max(...candidates.map((c) => scoreProduct(p, c))) }))
    .filter(({ score }) => score >= MIN_RELEVANT_SCORE)
    .sort((a, b) => b.score - a.score);

  if (isVoiceDebugEnabled()) {
    const topStr = scored
      .slice(0, 3)
      .map(({ p, score }) => `${p.name_ar || p.name_fr || "?"}(${score})`)
      .join(", ") || "no matches";
    logVoiceEvent(
      "search",
      `raw: "${q}" → normalized: "${normalized}" → core: "${core}" → candidates: [${candidates.join(", ")}] → top: ${topStr}`,
    );
  }

  return scored;
}
