// src/types/index.ts
// Shared domain types. DB column types mirrored from supabase/migrations/*.sql.
// All price fields are integer kobo (1 NGN = 100 kobo) — D-10.

// ── Products ──
export type ProductType = "fresh_produce" | "cooking_kit";

export interface Product {
  id: string;
  name: string;
  description: string | null;
  type: ProductType;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  label: string;
  price_ngn: number; // kobo
  is_active: boolean;
  created_at: string;
}

export interface PrepOption {
  id: string;
  product_id: string;
  label: string;
  is_active: boolean;
  created_at: string;
}

// ── Orders ──
export type OrderStatus = "pending" | "paid" | "processing" | "delivered";

export interface Order {
  id: string;
  paystack_reference: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  allergy_notes: string | null;
  total_ngn: number; // kobo
  status: OrderStatus;
  delivery_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  prep_option_id: string | null;
  product_name: string;
  variant_label: string | null;
  prep_option: string | null;
  quantity: number;
  unit_price_ngn: number; // kobo
  subtotal_ngn: number; // kobo
  created_at: string;
}

// ── Ordering config (single-row config table) ──
export interface OrderingConfig {
  id: 1;
  is_ordering_open: boolean;
  delivery_date: string | null;
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
