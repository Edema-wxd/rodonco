// drizzle/schema.ts
// Single source of truth for all DB tables.
// Column names match supabase/migrations/0001_initial_schema.sql exactly.

import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  date,
} from "drizzle-orm/pg-core";

// ============================================================
// PRODUCTS
// ============================================================
export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // 'fresh_produce' | 'cooking_kit'
  image_url: text("image_url"),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================
// PRODUCT VARIANTS
// ============================================================
export const product_variants = pgTable("product_variants", {
  id: uuid("id").defaultRandom().primaryKey(),
  product_id: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  price_ngn: integer("price_ngn").notNull(),
  is_default: boolean("is_default").notNull().default(false),
});

// ============================================================
// PRODUCT PREP OPTIONS
// ============================================================
export const product_prep_options = pgTable("product_prep_options", {
  id: uuid("id").defaultRandom().primaryKey(),
  product_id: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  extra_cost_ngn: integer("extra_cost_ngn").notNull().default(0),
});

// ============================================================
// ORDERS
// ============================================================
export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  reference: text("reference").unique().notNull(),
  customer_name: text("customer_name").notNull(),
  customer_email: text("customer_email").notNull(),
  customer_phone: text("customer_phone").notNull(),
  delivery_address: text("delivery_address").notNull(),
  allergy_notes: text("allergy_notes"),
  status: text("status").notNull().default("pending"), // 'pending'|'paid'|'processing'|'delivered'|'cancelled'
  total_ngn: integer("total_ngn").notNull(),
  week_of: date("week_of").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  notified_at: timestamp("notified_at", { withTimezone: true }),
});

// ============================================================
// ORDER ITEMS
// ============================================================
export const order_items = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  order_id: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  product_id: uuid("product_id")
    .notNull()
    .references(() => products.id),
  product_name: text("product_name").notNull(),
  variant_label: text("variant_label"),
  prep_option: text("prep_option"),
  quantity: integer("quantity").notNull(),
  unit_price_ngn: integer("unit_price_ngn").notNull(),
  subtotal_ngn: integer("subtotal_ngn").notNull(),
});

// ============================================================
// ORDERING CONFIG (single-row table — id always 1)
// ============================================================
export const ordering_config = pgTable("ordering_config", {
  id: integer("id").primaryKey().default(1),
  is_ordering_open: boolean("is_ordering_open").notNull().default(true),
  cutoff_message: text("cutoff_message"),
  next_delivery_date: date("next_delivery_date"),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================
// ADMINS (new table — D-06)
// ============================================================
export const admins = pgTable("admins", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").unique().notNull(),
  password_hash: text("password_hash").notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
