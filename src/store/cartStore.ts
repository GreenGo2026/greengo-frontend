// src/store/cartStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Product, DBProduct } from "../services/api";
import { computeLineTotal } from "../utils/pricing";

export interface CartItem extends Product {
  cartQuantity: number;
}

// ── Unit step config — how much each +/- press increments ────────────────────
export type UnitStep = 0.25 | 0.5 | 1;

export function getUnitStep(unit: string | undefined, product?: Partial<Product>): UnitStep {
  const customStep = Number((product as any)?.step);

  if (customStep === 0.25 || customStep === 0.5 || customStep === 1) {
    return customStep as UnitStep;
  }

  const u = (unit ?? "").toLowerCase().trim();
  // Latin
  if (["kg", "kilo", "kilogram", "kgs"].includes(u)) return 0.5;
  if (["g", "gram", "grams"].includes(u)) return 0.25;
  // Arabic/Darija unit names
  if (["كيلو", "كغ", "كيلوغرام"].includes(u)) return 0.5;
  if (["غرام", "غ"].includes(u)) return 0.25;
  return 1;
}

export function normalizeUnit(unit: string | undefined): string {
  const u = (unit ?? "").toLowerCase().trim();
  if (["كيلو", "كغ", "كيلوغرام"].includes(u)) return "kg";
  if (["غرام", "غ"].includes(u)) return "g";
  return u;
}

export function formatQuantity(qty: number, unit: string | undefined): string {
  const u = normalizeUnit(unit);
  if (u === "kg" || u === "kilo" || u === "kilogram") {
    return qty % 1 === 0 ? qty.toFixed(0) + " kg" : qty.toFixed(2).replace(/\.?0+$/, "") + " kg";
  }
  if (u === "g" || u === "gram") {
    return qty % 1 === 0 ? qty.toFixed(0) + " g" : qty.toFixed(2).replace(/\.?0+$/, "") + " g";
  }
  return qty % 1 === 0 ? String(qty) : qty.toFixed(2).replace(/\.?0+$/, "");
}

// A product can have multiple weight variants (250g/500g/1kg) that are the
// same DB document but must occupy separate cart lines -- key on product
// identity *and* the selected variant, not just id/name.
function cartKey(item: { id?: string; name: string; variant_label?: string | null }): string {
  const base = item.id || item.name;
  return item.variant_label ? `${base}::${item.variant_label}` : base;
}

export interface PriceChange {
  name: string;
  variant_label?: string | null;
  old_price: number;
  new_price: number;
}

export type DeliveryZone = "laayayda" | "sale" | "rabat" | "temara";

export const DELIVERY_FEES: Record<DeliveryZone, number> = {
  laayayda: 0,
  sale:     20,
  rabat:    30,
  temara:   40,
};

interface CartState {
  cart: CartItem[];
  addToCart: (product: Product, step?: number) => void;
  removeFromCart: (productName: string, step?: number, variantLabel?: string | null) => void;
  clearCart: () => void;
  totalPrice: () => number;
  refreshPrices: (liveProducts: DBProduct[]) => PriceChange[];
  deliveryZone: DeliveryZone;
  setDeliveryZone: (zone: DeliveryZone) => void;
  deliveryFee: () => number;
  totalWithDelivery: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: [],

      addToCart: (product: Product, step?: number) => {
        const s = step ?? getUnitStep(product.unit, product);
        const key = cartKey(product as any);

        set((state) => {
          const existing = state.cart.find((i) => cartKey(i as any) === key);

          if (existing) {
            const next = Math.round((existing.cartQuantity + s) * 1000) / 1000;
            return {
              cart: state.cart.map((i) =>
                cartKey(i as any) === key ? { ...i, cartQuantity: next } : i
              )
            };
          }

          return { cart: [...state.cart, { ...product, cartQuantity: s }] };
        });
      },

      removeFromCart: (productName: string, step?: number, variantLabel?: string | null) => {
        set((state) => {
          const key = cartKey({ name: productName, variant_label: variantLabel });
          const existing = state.cart.find((i) => cartKey(i as any) === key);
          if (!existing) return state;

          const s = step ?? getUnitStep(existing.unit, existing);
          const next = Math.round((existing.cartQuantity - s) * 1000) / 1000;

          if (next <= 0) {
            return { cart: state.cart.filter((i) => cartKey(i as any) !== key) };
          }

          return {
            cart: state.cart.map((i) =>
              cartKey(i as any) === key ? { ...i, cartQuantity: next } : i
            )
          };
        });
      },

      clearCart: () => set({ cart: [] }),

      // Cart items persist in localStorage indefinitely (a customer can add an
      // item today and not check out for days). Nothing was re-validating the
      // cached price_per_unit against the live catalog before checkout, so if
      // a product's price changed in the meantime, the checkout screen showed
      // a stale total -- while the backend independently recomputes the order
      // total from current authoritative prices at submission time, so the
      // customer would see one number and be charged another. Call this on
      // cart/checkout mount so the two never diverge silently.
      refreshPrices: (liveProducts: DBProduct[]): PriceChange[] => {
        const changes: PriceChange[] = [];

        set((state) => {
          const byNameAr = new Map(liveProducts.map((p) => [p.name_ar, p]));

          const nextCart = state.cart.map((item) => {
            const live = byNameAr.get(item.name);
            if (!live) return item; // product no longer found -- leave as-is, not this function's job to remove it

            let currentPrice = live.price_mad;
            if (item.variant_label && live.variants?.length) {
              const variant = live.variants.find((v) => v.label === item.variant_label);
              if (variant) currentPrice = variant.price_mad;
            }

            if (currentPrice > 0 && currentPrice !== item.price_per_unit) {
              changes.push({
                name: item.name,
                variant_label: item.variant_label,
                old_price: item.price_per_unit,
                new_price: currentPrice,
              });
              return { ...item, price_per_unit: currentPrice };
            }
            return item;
          });

          return { cart: nextCart };
        });

        return changes;
      },

      totalPrice: (): number => {
        const { cart } = get();
        const raw = cart.reduce((sum, i) => sum + computeLineTotal(i.price_per_unit || 0, i.cartQuantity || 0, i.unit || ""), 0);
        return Math.round(raw * 100) / 100;
      },

      deliveryZone: "sale" as DeliveryZone,

      setDeliveryZone: (zone: DeliveryZone) => set({ deliveryZone: zone }),

      deliveryFee: (): number => {
        const zone: DeliveryZone = get().deliveryZone;
        return DELIVERY_FEES[zone] ?? DELIVERY_FEES.sale;
      },

      totalWithDelivery: (): number => {
        const subtotal = get().totalPrice();
        const fee = get().deliveryFee();
        return Math.round((subtotal + fee) * 100) / 100;
      },
    }),
    {
      name: "greengo-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ cart: state.cart }),
      merge: (persisted: any, current: any) => {
        const seen = new Map<string, any>();
        for (const item of (persisted?.cart ?? [])) {
          const key = item.id || item.name;
          if (seen.has(key)) {
            const existing = seen.get(key);
            existing.cartQuantity = Math.round((existing.cartQuantity + item.cartQuantity) * 1000) / 1000;
          } else {
            seen.set(key, { ...item });
          }
        }
        return { ...current, cart: Array.from(seen.values()) };
      },
    }
  )
);
