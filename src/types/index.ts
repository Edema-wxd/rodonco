// src/types/index.ts
// Shared domain types. DB column names mirror the legacy SQL schema exactly.
// All price fields are integer kobo (1 NGN = 100 kobo) — D-10.

// ── Products ──
export type ProductType = "fresh_produce" | "cooking_kit";

export interface ProductImage {
  url: string;
}

// Admins can create new categories from the product editor, so this is an
// open string (slug-formatted, e.g. "leafy_greens") rather than a fixed union.
export type ProduceCategory = string;

export interface Product {
  id: string;
  name: string;
  description: string | null;
  type: ProductType;
  category: ProduceCategory | null;
  image_url: string | null;
  images: ProductImage[];
  is_active: boolean;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  label: string;
  price_ngn: number; // kobo
  is_default: boolean;
}

export interface PrepOption {
  id: string;
  product_id: string;
  label: string;
  extra_cost_ngn: number; // kobo
}

// ── Orders ──
export type OrderStatus = "pending" | "paid" | "processing" | "delivered" | "cancelled";

export interface Order {
  id: string;
  reference: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  allergy_notes: string | null;
  status: OrderStatus;
  total_ngn: number; // kobo
  week_of: string;
  created_at: string;
  notified_at: string | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  variant_label: string | null;
  prep_option: string | null;
  quantity: number;
  unit_price_ngn: number; // kobo
  subtotal_ngn: number; // kobo
}

// ── Ordering config (single-row config table, id always 1) ──
export interface OrderingConfig {
  id: 1;
  is_ordering_open: boolean;
  cutoff_message: string | null;
  next_delivery_date: string | null;
  updated_at: string;
}

// ── Cart (client-side only; NEVER persisted in DB) ── D-10
export interface CartItem {
  productId: string;
  productName: string;
  variantLabel: string | null;
  prepOption: string | null;
  quantity: number;
  unitPriceNgn: number; // kobo
  subtotalNgn: number;  // kobo
}
