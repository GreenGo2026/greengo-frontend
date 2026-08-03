// src/utils/normalize.ts
// Typo-tolerant, Arabic/French bilingual product search — pure utility,
// no external dependency.

// Arabic -> French product name mapping. Add more pairs as the catalog grows.
const AR_TO_FR: Record<string, string[]> = {
  "طماطم":    ["tomate", "tomates"],
  "جزر":      ["carotte", "carottes"],
  "بصل":      ["oignon", "oignons"],
  "بطاطا":    ["pomme de terre", "pommes de terre", "patate"],
  "برتقال":   ["orange", "oranges"],
  "معدنوس":   ["persil"],
  "دجاج":     ["poulet", "volaille"],
  "عسل":      ["miel"],
  "زيت":      ["huile"],
  "زيتون":    ["olive", "olives"],
  "جبن":      ["fromage", "fromages"],
  "بيض":      ["oeuf", "oeufs"],
  "موز":      ["banane", "bananes"],
  "تفاح":     ["pomme", "pommes"],
  "خس":       ["laitue", "salade"],
  "كوسة":     ["courgette", "courgettes"],
  "فلفل":     ["poivron", "poivrons", "piment"],
  "باذنجان":  ["aubergine", "aubergines"],
  "خيار":     ["concombre", "concombres"],
  "ليمون":    ["citron", "citrons"],
  "سبانخ":    ["épinard", "épinards"],
  "كرنب":     ["chou", "choux"],
  "بقدونس":   ["persil"],
  "نعناع":    ["menthe"],
  "ثوم":      ["ail"],
  "زنجبيل":   ["gingembre"],
  "لحم":      ["viande"],
  "سمك":      ["poisson"],
  "حليب":     ["lait"],
  "زبدة":     ["beurre"],
  "دقيق":     ["farine"],
  "سكر":      ["sucre"],
  "ملح":      ["sel"],
  "أناناس":   ["ananas"],
};

// Reverse mapping: French -> Arabic term
const FR_TO_AR: Record<string, string> = {};
for (const [ar, frTerms] of Object.entries(AR_TO_FR)) {
  for (const fr of frTerms) {
    FR_TO_AR[fr] = ar;
  }
}

/**
 * Normalize a string for search matching: lowercase, strip accents,
 * collapse whitespace.
 */
export function normalizeStr(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

/**
 * Score how well `query` matches `target`. Higher is better; 0 = no match.
 * 100 exact, 80 starts-with, 60 contains, 30 typo-tolerant (Levenshtein).
 */
export function matchScore(query: string, target: string): number {
  const q = normalizeStr(query);
  const t = normalizeStr(target);

  if (!q || !t) return 0;
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  if (t.includes(q)) return 60;

  if (q.length >= 4) {
    const words = t.split(" ");
    for (const word of words) {
      if (word.length >= 3) {
        const dist = levenshtein(q, word);
        const threshold = q.length <= 5 ? 1 : 2;
        if (dist <= threshold) return 30;
      }
    }
  }

  return 0;
}

/**
 * Expand a query into itself plus any cross-language (AR<->FR) equivalents,
 * e.g. "طماطم" -> ["طماطم", "tomate", "tomates"].
 */
export function expandQuery(query: string): string[] {
  const q = query.trim().toLowerCase();
  const terms = new Set<string>([q]);

  if (AR_TO_FR[query]) {
    AR_TO_FR[query].forEach((t) => terms.add(t));
  }

  const normalizedQ = normalizeStr(q);
  if (FR_TO_AR[normalizedQ]) {
    terms.add(FR_TO_AR[normalizedQ]);
  }

  for (const [ar, frTerms] of Object.entries(AR_TO_FR)) {
    if (ar.includes(q) || q.includes(ar)) {
      terms.add(ar);
      frTerms.forEach((t) => terms.add(t));
    }
    for (const fr of frTerms) {
      if (normalizeStr(fr).includes(normalizedQ)) {
        terms.add(ar);
        frTerms.forEach((t) => terms.add(t));
      }
    }
  }

  return Array.from(terms);
}

interface ScorableProduct {
  name_fr?: string | null;
  name_ar?: string | null;
  category?: string | null;
  description_fr?: string | null;
}

/**
 * Score a product against a search query across name_fr, name_ar, category,
 * description_fr, and cross-language terms. 0 = no match.
 */
export function scoreProduct(product: ScorableProduct, query: string): number {
  const terms = expandQuery(query);
  let best = 0;

  for (const term of terms) {
    const nameFrScore = matchScore(term, product.name_fr || "") * 3;
    const nameArScore = matchScore(term, product.name_ar || "") * 3;
    const catScore = matchScore(term, product.category || "");
    const descStr = product.description_fr || "";
    const descScore = normalizeStr(descStr).includes(normalizeStr(term)) ? 15 : 0;

    const total = Math.max(nameFrScore, nameArScore, catScore, descScore);
    if (total > best) best = total;
  }

  return best;
}
