// src/utils/categoryLabels.ts
// French display labels for DB category values shown in admin dropdowns.
// The DB value (used for filtering/writes) stays in English/canonical form
// where that's already established -- this only affects what admins see.
export const CATEGORY_LABEL_FR: Record<string, string> = {
  "Vegetables": "Légumes",
  "White Meats": "Viandes blanches",
  "Natural Juices": "Jus naturels 🧃",
  "Mixed Packs": "Paniers mixtes",
  "Purified Greens": "Herbes fraîches",
};

export function categoryLabel(value: string): string {
  return CATEGORY_LABEL_FR[value] ?? value;
}
