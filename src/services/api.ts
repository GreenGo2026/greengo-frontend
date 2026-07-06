// src/services/api.ts
import axios from "axios";
import { getJwt } from "./adminJwt";

const _rawBase = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

export const apiClient = axios.create({
  baseURL:         `${_rawBase}/api/v1`,
  headers:         { "Content-Type": "application/json" },
  timeout:         10_000,
  withCredentials: true,
});

// Inject Authorization: Bearer <jwt> on every request when logged in
apiClient.interceptors.request.use((config) => {
  const jwt = getJwt();
  if (jwt) {
    config.headers["Authorization"] = `Bearer ${jwt}`;
  }
  return config;
});

// Propagate errors — callers handle 401 explicitly at the page level.
// Do NOT call clearJwt() here: a single 401 mid-loop would wipe auth
// for every remaining request in bulk operations like handlePublishAll.
apiClient.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err),
);

export interface Product {
  name:           string;
  price_per_unit: number;
  unit:           string;
  available:      boolean;
  variant_label?: string | null;
}

export interface ProductVariant {
  label:     string;
  price_mad: number;
  weight_g?: number | null;
  sku?:      string | null;
  in_stock:  boolean;
}

export interface DBProduct {
  id:         string;
  name_ar:    string;
  name_fr:    string | null;
  category:   string;
  price_mad:  number;
  unit:       string;
  in_stock:    boolean;
  image_url:   string;
  image_status:string;
  visible:     boolean;
  created_at: string | null;
  on_sale?:      boolean;
  discount_pct?: number;
  description_fr?: string;
  step?: 0.25 | 0.5 | 1;
  stock_qty?: number | null;
  variants?: ProductVariant[] | null;
}

export interface DBProductUpdate {
  price_mad?:  number;
  in_stock?:   boolean;
  name_ar?:    string;
  name_fr?:    string;
  unit?:       string;
  category?:   string;
  step?:       0.25 | 0.5 | 1;
}

export interface DBProductUpdateResponse extends DBProduct {}

export interface ProductUpdate {
  price_per_unit?: number;
  available?:      boolean;
}
export interface ProductUpdateResponse {
  message:        string;
  product_name:   string;
  price_per_unit: number;
  available:      boolean;
}

export interface CheckoutItem {
  name:           string;
  quantity:       number;
  price_per_unit: number;
}
export interface CheckoutOrderPayload {
  customer_phone:   string;
  delivery_address: string;
  items:            CheckoutItem[];
  total_price:      number;
}
export interface CheckoutOrderResponse {
  message:     string;
  order_id:    string;
  status:      string;
  total_price: number;
}

export type OrderStatus =
  | "pending"
  | "preparing"
  | "out_for_delivery"
  | "delivered"
  | "completed"
  | "cancelled";

export interface OrderItem {
  item_name?:     string;
  name?:          string;
  quantity:       number;
  unit?:          string;
  price_per_unit: number;
  line_total?:    number;
}
export interface Order {
  id:               string;
  customer_phone:   string;
  customer_name?:   string;
  delivery_address?: string;
  payment_method?:  string;
  items:            OrderItem[];
  total_price:      number;
  status:           OrderStatus;
  created_at:       string;
}
export interface OrderStatusUpdateResponse {
  message:    string;
  order_id:   string;
  new_status: OrderStatus;
}

// â”€â”€ Analytics â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export type AnalyticsPeriod = "today" | "week" | "month" | "all";

export interface StatusBreakdown {
  pending:          number;
  preparing:        number;
  out_for_delivery: number;
  delivered:        number;
  completed:        number;
  cancelled:        number;
}
export interface TopItem {
  name:     string;
  qty_sold: number;
  revenue:  number;
}
export interface AnalyticsData {
  total_revenue:     number;
  total_orders:      number;
  orders_by_status:  StatusBreakdown;
  top_selling_items: TopItem[];
  avg_order_value:   number;
  completion_rate:   number;
  period:            string;
}

// â”€â”€ Envelope helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface ApiEnvelope {
  products?: unknown; data?: unknown; items?: unknown;
  orders?: unknown;   results?: unknown;
}
function toArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  const e = raw as ApiEnvelope;
  if (Array.isArray(e?.products)) return e.products as T[];
  if (Array.isArray(e?.data))     return e.data     as T[];
  if (Array.isArray(e?.items))    return e.items    as T[];
  if (Array.isArray(e?.orders))   return e.orders   as T[];
  if (Array.isArray(e?.results))  return e.results  as T[];
  return [];
}

export async function getCatalog(): Promise<Product[]> {
  const r = await apiClient.get<unknown>("/catalog");
  return toArray<Product>(r.data);
}
export async function getAvailableCatalog(): Promise<Product[]> {
  const r = await apiClient.get<unknown>("/catalog", { params: { available_only: true } });
  return toArray<Product>(r.data);
}
export async function updateProduct(name: string, updates: ProductUpdate): Promise<ProductUpdateResponse> {
  const r = await apiClient.patch<ProductUpdateResponse>("/catalog", { product_name: name, ...updates });
  return r.data;
}

export async function getProducts(options?: { availableOnly?: boolean; category?: string }): Promise<DBProduct[]> {
  const params: Record<string, string | boolean> = {};
  if (options?.availableOnly) params.available_only = true;
  if (options?.category)      params.category       = options.category;
  const r = await apiClient.get<unknown>("/products", { params });
  return toArray<DBProduct>(r.data);
}
export async function updateProductById(id: string, updates: DBProductUpdate): Promise<DBProductUpdateResponse> {
  const r = await apiClient.patch<DBProductUpdateResponse>(`/products/${id}`, updates);
  return r.data;
}

export async function getAnalytics(period: AnalyticsPeriod = "all"): Promise<AnalyticsData> {
  const r = await apiClient.get<AnalyticsData>("/analytics", { params: { period } });
  return r.data;
}

export async function createOrder(payload: CheckoutOrderPayload): Promise<CheckoutOrderResponse> {
  const r = await apiClient.post<CheckoutOrderResponse>("/orders", payload);
  return r.data;
}
export async function getOrders(status?: OrderStatus, limit = 50): Promise<Order[]> {
  const params: Record<string, string | number> = { limit };
  if (status) params.status = status;
  const r = await apiClient.get<unknown>("/orders", { params });
  return toArray<Order>(r.data).map((o: Order) => {
    const raw = o as unknown as Record<string, string>;
    return {
      ...o,
      id: o.id || raw["_id"] || "",
      // The backend stores/returns "phone" and "address" (see app/routes/orders.py),
      // not "customer_phone"/"delivery_address" — normalize here so the rest of the
      // admin UI can rely on the Order type's field names.
      customer_phone: o.customer_phone || raw["phone"] || "",
      delivery_address: o.delivery_address || raw["address"] || "",
      status: (o.status?.toLowerCase() as OrderStatus) || "pending",
    };
  });
}
export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<OrderStatusUpdateResponse> {
  const r = await apiClient.patch<OrderStatusUpdateResponse>(`/orders/${orderId}/status`, null, { params: { status } });
  return r.data;
}

export async function fetchProductById(id: string): Promise<DBProduct | null> {
  try {
    const r = await apiClient.get<DBProduct>(`/products/${id}`);
    return r.data;
  } catch {
    // Fall back: search in full list
    try {
      const all = await getProducts();
      return all.find(p => p.id === id) ?? null;
    } catch {
      return null;
    }
  }
}

export async function getRelatedProducts(category: string, excludeId: string): Promise<DBProduct[]> {
  try {
    const all = await getProducts({ category });
    return all.filter(p => p.id !== excludeId).slice(0, 4);
  } catch {
    return [];
  }
}



export interface CreateProductPayload {
  name_fr:       string;
  name_ar?:      string;
  category:      string;
  price_mad:     number;
  unit:          string;
  in_stock:      boolean;
  description_fr?: string;
  on_sale:       boolean;
  discount_pct:  number;
  image_url?:    string;
  step?:         number;
  visible:       boolean;
  stock_qty?:    number;
}

export async function createProduct(payload: CreateProductPayload): Promise<DBProduct> {
  const r = await apiClient.post<DBProduct>("/products", payload);
  return r.data;
}

export async function deleteProduct(id: string): Promise<void> {
  await apiClient.delete(`/products/${id}`);
}

export async function uploadProductImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const r = await apiClient.post<{ url: string }>("/admin/upload-image", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return r.data.url;
}

// ── Paniers ────────────────────────────────────────────────────────────────────

export interface PanierItem {
  label: string;
  qty:   number;
  unit:  string;
}

export interface Panier {
  id:      string;
  order?:  number;
  title:   string;
  persons: number;
  accent:  string;
  items:   PanierItem[];
}

export async function getPaniers(): Promise<Panier[]> {
  const r = await apiClient.get<unknown>("/paniers");
  return toArray<Panier>(r.data);
}

export async function updatePanier(id: string, data: Omit<Panier, "id" | "order">): Promise<void> {
  await apiClient.put(`/paniers/${id}`, data);
}

export async function applyProductCorrections(): Promise<{ changed: number; skipped: number; details: unknown[] }> {
  const r = await apiClient.post<{ changed: number; skipped: number; details: unknown[] }>("/products/corrections");
  return r.data;
}

export interface FixLabelsResult {
  ok: boolean;
  total_fixed: number;
  total_unfixed: number;
  report: { panier: string; changes: { from?: string; to?: string; label?: string; status?: string }[] }[];
}

export async function fixPanierLabels(): Promise<FixLabelsResult> {
  const r = await apiClient.post<FixLabelsResult>("/paniers/fix-labels");
  return r.data;
}

export interface CatalogBroadcastResult {
  ok: boolean;
  count: number;
  with_images: number;
  without_images: number;
  estimated_minutes: number;
  message: string;
}

export async function sendCatalogToWhatsApp(
  phone: string,
  category = "all",
  inStockOnly = true,
): Promise<CatalogBroadcastResult> {
  const r = await apiClient.post<CatalogBroadcastResult>("/admin/whatsapp/send-catalog", null, {
    params: { phone, category, in_stock_only: inStockOnly },
  });
  return r.data;
}
