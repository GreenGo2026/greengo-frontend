// src/utils/urgencySignals.ts

export type UrgencyLevel = "none" | "low" | "medium" | "high";

export interface UrgencySignal {
  level: UrgencyLevel;
  badge: string | null;
  color: string;
}

const FRESH_CATEGORIES = ["Vegetables", "Fruits", "Volailles", "White Meats"];

/**
 * Urgency signal for a product card. Priority order:
 * 1. Out of stock
 * 2. On sale with a discount
 * 3. Low stock (stock_qty <= 5)
 * 4. Fresh-today badge for produce categories
 */
export function getUrgencySignal(product: {
  in_stock: boolean;
  on_sale?: boolean;
  discount_pct?: number;
  stock_qty?: number | null;
  category?: string;
}): UrgencySignal {
  if (!product.in_stock) {
    return { level: "high", badge: "❌ Rupture de stock", color: "bg-red-100 text-red-700" };
  }

  if (product.on_sale && product.discount_pct) {
    return { level: "high", badge: `-${product.discount_pct}% 🔥`, color: "bg-orange-500 text-white" };
  }

  if (
    product.stock_qty !== null &&
    product.stock_qty !== undefined &&
    product.stock_qty <= 5 &&
    product.stock_qty > 0
  ) {
    return {
      level: "medium",
      badge: `Plus que ${product.stock_qty} disponible${product.stock_qty > 1 ? "s" : ""}`,
      color: "bg-amber-100 text-amber-700",
    };
  }

  if (FRESH_CATEGORIES.includes(product.category || "")) {
    return { level: "low", badge: "🌿 Frais du jour", color: "bg-green-100 text-green-700" };
  }

  return { level: "none", badge: null, color: "" };
}

/**
 * Computes the pre-discount price from the current (discounted) price_mad
 * and discount_pct, for strikethrough display.
 * price_mad is the ORIGINAL price in the DB — the sale price customers pay
 * is price_mad * (1 - discount_pct/100). See OffresPage.tsx for the same convention.
 */
export function getDiscountedPrice(priceMad: number, discountPct: number): number {
  return Math.round(priceMad * (1 - discountPct / 100) * 100) / 100;
}

/**
 * Delivery time copy based on current hour. Real urgency: order now to get
 * it today, tied to the actual 8h-20h delivery window.
 */
export function getDeliveryUrgency(): string {
  const hour = new Date().getHours();

  if (hour < 8)  return "Livraison dès 8h ce matin ⚡";
  if (hour < 17) return "Livraison en 30 min ⚡";
  if (hour < 19) return "⏰ Commandez avant 20h — livraison aujourd'hui";
  if (hour < 20) return "⚠️ Dernière heure de livraison aujourd'hui !";
  return "🌙 Livraison demain dès 8h";
}
