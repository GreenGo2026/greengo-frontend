export function computeLineTotal(
  basePrice: number,
  quantity: number,
  // unit is the same unit-of-sale as the price (kg, piece, 100g, …)
  // the formula is identical across all unit types: price is always per unit-of-sale
  _unit: string
): number {
  return Math.round(basePrice * quantity * 100) / 100;
}
