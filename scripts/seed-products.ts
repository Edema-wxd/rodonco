import "dotenv/config";
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

import {
  products,
  product_variants,
  product_prep_options,
  ordering_config,
} from "../drizzle/schema";

dotenv.config({ path: ".env.local" });

const FRESH_PRODUCE = "fresh_produce";
const COOKING_KIT = "cooking_kit";

const SEED_PRODUCTS = [
  // ── Fresh Produce ──────────────────────────────────────────────
  {
    name: "Tomato Pack",
    description: "Fresh, ripe tomatoes sourced locally — perfect for stews, sauces, and jollof.",
    type: FRESH_PRODUCE,
    image_url: null,
    variants: [
      { label: "Small (3 cups)", price_ngn: 2500, is_default: false },
      { label: "Medium (5 cups)", price_ngn: 3800, is_default: true },
      { label: "Large (8 cups)", price_ngn: 5500, is_default: false },
    ],
    prep_options: [
      { label: "Whole", extra_cost_ngn: 0 },
      { label: "Blended", extra_cost_ngn: 500 },
      { label: "Roughly chopped", extra_cost_ngn: 300 },
    ],
  },
  {
    name: "Pepper Mix",
    description: "A balanced blend of tatashe, scotch bonnet, and bell peppers.",
    type: FRESH_PRODUCE,
    image_url: null,
    variants: [
      { label: "Small (2 cups)", price_ngn: 2000, is_default: true },
      { label: "Large (4 cups)", price_ngn: 3500, is_default: false },
    ],
    prep_options: [
      { label: "Whole", extra_cost_ngn: 0 },
      { label: "Blended", extra_cost_ngn: 500 },
      { label: "Sliced", extra_cost_ngn: 300 },
    ],
  },
  {
    name: "Vegetable Bundle",
    description: "Seasonal mix of ugu (fluted pumpkin) and spinach, washed and ready to cook.",
    type: FRESH_PRODUCE,
    image_url: null,
    variants: [
      { label: "Small bundle", price_ngn: 1800, is_default: true },
      { label: "Large bundle", price_ngn: 3200, is_default: false },
    ],
    prep_options: [
      { label: "Whole leaves", extra_cost_ngn: 0 },
      { label: "Washed & shredded", extra_cost_ngn: 400 },
    ],
  },
  {
    name: "Onion Pack",
    description: "Medium-sized red onions — a kitchen staple for every Nigerian dish.",
    type: FRESH_PRODUCE,
    image_url: null,
    variants: [
      { label: "Small (500g)", price_ngn: 1200, is_default: true },
      { label: "Large (1kg)", price_ngn: 2200, is_default: false },
    ],
    prep_options: [
      { label: "Whole", extra_cost_ngn: 0 },
      { label: "Sliced", extra_cost_ngn: 300 },
    ],
  },
  // ── Cooking Kits ───────────────────────────────────────────────
  {
    name: "Jollof Rice Kit",
    description:
      "Everything you need for party-style jollof: prepped tomato-pepper base, parboiled long-grain rice, and seasoning blend.",
    type: COOKING_KIT,
    image_url: null,
    variants: [
      { label: "Serves 4", price_ngn: 8500, is_default: true },
      { label: "Serves 8", price_ngn: 15000, is_default: false },
    ],
    prep_options: [],
  },
  {
    name: "Egusi Soup Kit",
    description:
      "Ground egusi, assorted meats, stockfish, and leafy greens — fully prepped and portioned.",
    type: COOKING_KIT,
    image_url: null,
    variants: [
      { label: "Pot for 4", price_ngn: 9500, is_default: true },
      { label: "Pot for 8", price_ngn: 17500, is_default: false },
    ],
    prep_options: [],
  },
  {
    name: "Pepper Soup Kit",
    description:
      "Goat meat pepper soup kit with authentic spice blend, utazi leaves, and fresh peppers.",
    type: COOKING_KIT,
    image_url: null,
    variants: [
      { label: "Small (serves 2–3)", price_ngn: 7000, is_default: true },
      { label: "Large (serves 5–6)", price_ngn: 12500, is_default: false },
    ],
    prep_options: [],
  },
];

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL must be set in .env.local");

  const sql = neon(databaseUrl);
  const db = drizzle({ client: sql });

  // Ensure ordering_config row exists
  await db
    .insert(ordering_config)
    .values({
      id: 1,
      is_ordering_open: true,
      next_delivery_date: getNextSaturday(),
    })
    .onConflictDoNothing();
  console.log("ordering_config: ensured row 1 exists");

  // Seed products
  for (const p of SEED_PRODUCTS) {
    const [inserted] = await db
      .insert(products)
      .values({
        name: p.name,
        description: p.description,
        type: p.type,
        image_url: p.image_url,
        is_active: true,
      })
      .returning({ id: products.id });

    if (!inserted) {
      console.warn(`Skipped (conflict?): ${p.name}`);
      continue;
    }

    const productId = inserted.id;

    if (p.variants.length > 0) {
      await db.insert(product_variants).values(
        p.variants.map((v) => ({ product_id: productId, ...v }))
      );
    }

    if (p.prep_options.length > 0) {
      await db.insert(product_prep_options).values(
        p.prep_options.map((o) => ({ product_id: productId, ...o }))
      );
    }

    console.log(`Seeded: ${p.name} (${p.variants.length} variants, ${p.prep_options.length} prep options)`);
  }

  console.log("\nDone. 7 products seeded.");
}

function getNextSaturday(): string {
  const d = new Date();
  const day = d.getDay(); // 0=Sun … 6=Sat
  const daysUntilSaturday = day === 6 ? 7 : 6 - day;
  d.setDate(d.getDate() + daysUntilSaturday);
  return d.toISOString().slice(0, 10);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
