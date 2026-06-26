export function isValidMoroccanPhone(raw: string): boolean {
  // Strip spaces, dashes, dots
  const cleaned = raw.replace(/[\s\-\.]/g, "");
  // Accepted formats:
  // 06XXXXXXXX, 07XXXXXXXX (mobile with local 0-prefix)
  // +212 6XXXXXXXX, +212 7XXXXXXXX (international)
  // 00212 6XXXXXXXX
  // 05XXXXXXXX (fixed lines)
  return /^(?:(?:\+212|00212|0)(5|6|7)\d{8})$/.test(cleaned);
}

// Normalize before validating when "+212" is shown as a visual prefix
// and the user only types the local part (e.g. "660000000" → "0660000000")
export function normalizeForValidation(raw: string): string {
  const t = raw.trim();
  return /^[+0]/.test(t) ? t : "0" + t;
}
