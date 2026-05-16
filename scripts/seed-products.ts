import "dotenv/config";
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";

import {
  products,
  product_variants,
  product_prep_options,
  ordering_config,
} from "../drizzle/schema";

dotenv.config({ path: ".env.local" });

const FP = "fresh_produce";
const KIT = "cooking_kit";

const VEG = "vegetable";
const TUB = "tuber";
const HERB = "herb_spice";
const LEG = "legume";

// Price is 0 as placeholder — will be updated by admin
const PRICE = 0;

const SEED_PRODUCTS = [
  // ── Vegetables ────────────────────────────────────────────────
  {
    name: "Tomatoes",
    type: FP,
    category: VEG,
    variants: [{ label: "Per portion", price_ngn: PRICE, is_default: true }],
    prep_options: [
      { label: "Whole", extra_cost_ngn: 0 },
      { label: "Sliced", extra_cost_ngn: 0 },
      { label: "Diced", extra_cost_ngn: 0 },
      { label: "Blended", extra_cost_ngn: 0 },
    ],
  },
  {
    name: "Rodo (Scotch Bonnet)",
    type: FP,
    category: VEG,
    variants: [{ label: "Per portion", price_ngn: PRICE, is_default: true }],
    prep_options: [
      { label: "Whole", extra_cost_ngn: 0 },
      { label: "Chopped", extra_cost_ngn: 0 },
      { label: "Blended", extra_cost_ngn: 0 },
    ],
  },
  {
    name: "Red Bell Pepper",
    type: FP,
    category: VEG,
    variants: [{ label: "Per portion", price_ngn: PRICE, is_default: true }],
    prep_options: [
      { label: "Whole", extra_cost_ngn: 0 },
      { label: "Sliced", extra_cost_ngn: 0 },
      { label: "Diced", extra_cost_ngn: 0 },
      { label: "Blended", extra_cost_ngn: 0 },
    ],
  },
  {
    name: "Yellow Bell Pepper",
    type: FP,
    category: VEG,
    variants: [{ label: "Per portion", price_ngn: PRICE, is_default: true }],
    prep_options: [
      { label: "Whole", extra_cost_ngn: 0 },
      { label: "Sliced", extra_cost_ngn: 0 },
      { label: "Diced", extra_cost_ngn: 0 },
    ],
  },
  {
    name: "Green Bell Pepper",
    type: FP,
    category: VEG,
    variants: [{ label: "Per portion", price_ngn: PRICE, is_default: true }],
    prep_options: [
      { label: "Whole", extra_cost_ngn: 0 },
      { label: "Sliced", extra_cost_ngn: 0 },
      { label: "Diced", extra_cost_ngn: 0 },
    ],
  },
  {
    name: "Shombo (Long Pepper)",
    type: FP,
    category: VEG,
    variants: [{ label: "Per portion", price_ngn: PRICE, is_default: true }],
    prep_options: [
      { label: "Whole", extra_cost_ngn: 0 },
      { label: "Chopped", extra_cost_ngn: 0 },
      { label: "Blended", extra_cost_ngn: 0 },
    ],
  },
  {
    name: "Onions",
    type: FP,
    category: VEG,
    variants: [{ label: "Per portion", price_ngn: PRICE, is_default: true }],
    prep_options: [
      { label: "Whole", extra_cost_ngn: 0 },
      { label: "Sliced", extra_cost_ngn: 0 },
      { label: "Diced", extra_cost_ngn: 0 },
    ],
  },
  {
    name: "Spring Onions",
    type: FP,
    category: VEG,
    variants: [{ label: "Per portion", price_ngn: PRICE, is_default: true }],
    prep_options: [
      { label: "Whole", extra_cost_ngn: 0 },
      { label: "Chopped", extra_cost_ngn: 0 },
    ],
  },
  {
    name: "Ginger",
    type: FP,
    category: VEG,
    variants: [{ label: "Per portion", price_ngn: PRICE, is_default: true }],
    prep_options: [
      { label: "Whole", extra_cost_ngn: 0 },
      { label: "Grated", extra_cost_ngn: 0 },
      { label: "Minced", extra_cost_ngn: 0 },
    ],
  },
  {
    name: "Garlic",
    type: FP,
    category: VEG,
    variants: [{ label: "Per portion", price_ngn: PRICE, is_default: true }],
    prep_options: [
      { label: "Whole", extra_cost_ngn: 0 },
      { label: "Minced / Crushed", extra_cost_ngn: 0 },
      { label: "Blended", extra_cost_ngn: 0 },
    ],
  },
  {
    name: "Ugu",
    type: FP,
    category: VEG,
    variants: [{ label: "Per portion", price_ngn: PRICE, is_default: true }],
    prep_options: [
      { label: "Whole", extra_cost_ngn: 0 },
      { label: "Sliced", extra_cost_ngn: 0 },
    ],
  },
  {
    name: "Spinach",
    type: FP,
    category: VEG,
    variants: [{ label: "Per portion", price_ngn: PRICE, is_default: true }],
    prep_options: [
      { label: "Whole", extra_cost_ngn: 0 },
      { label: "Chopped", extra_cost_ngn: 0 },
    ],
  },
  {
    name: "Broccoli",
    type: FP,
    category: VEG,
    variants: [{ label: "Per portion", price_ngn: PRICE, is_default: true }],
    prep_options: [
      { label: "Whole", extra_cost_ngn: 0 },
      { label: "Florets", extra_cost_ngn: 0 },
    ],
  },
  {
    name: "Carrot",
    type: FP,
    category: VEG,
    variants: [{ label: "Per portion", price_ngn: PRICE, is_default: true }],
    prep_options: [
      { label: "Whole", extra_cost_ngn: 0 },
      { label: "Sliced", extra_cost_ngn: 0 },
      { label: "Diced", extra_cost_ngn: 0 },
    ],
  },
  {
    name: "Cabbage",
    type: FP,
    category: VEG,
    variants: [{ label: "Per portion", price_ngn: PRICE, is_default: true }],
    prep_options: [
      { label: "Whole", extra_cost_ngn: 0 },
      { label: "Shredded", extra_cost_ngn: 0 },
    ],
  },
  {
    name: "Ewedu Leaves",
    type: FP,
    category: VEG,
    variants: [{ label: "Per portion", price_ngn: PRICE, is_default: true }],
    prep_options: [
      { label: "Whole", extra_cost_ngn: 0 },
      { label: "Picked", extra_cost_ngn: 0 },
      { label: "Blended", extra_cost_ngn: 0 },
    ],
  },
  {
    name: "Ugwu",
    type: FP,
    category: VEG,
    variants: [{ label: "Per portion", price_ngn: PRICE, is_default: true }],
    prep_options: [
      { label: "Whole", extra_cost_ngn: 0 },
      { label: "Picked", extra_cost_ngn: 0 },
      { label: "Sliced", extra_cost_ngn: 0 },
    ],
  },

  // ── Tubers ────────────────────────────────────────────────────
  {
    name: "Yam",
    type: FP,
    category: TUB,
    variants: [{ label: "Per portion", price_ngn: PRICE, is_default: true }],
    prep_options: [
      { label: "Whole", extra_cost_ngn: 0 },
      { label: "Sliced", extra_cost_ngn: 0 },
      { label: "Cubed", extra_cost_ngn: 0 },
    ],
  },
  {
    name: "Potato",
    type: FP,
    category: TUB,
    variants: [{ label: "Per portion", price_ngn: PRICE, is_default: true }],
    prep_options: [
      { label: "Whole", extra_cost_ngn: 0 },
      { label: "Sliced", extra_cost_ngn: 0 },
      { label: "Cubed", extra_cost_ngn: 0 },
    ],
  },

  // ── Herbs and Spices ──────────────────────────────────────────
  {
    name: "Melon Seed (Egusi)",
    type: FP,
    category: HERB,
    variants: [{ label: "Per portion", price_ngn: PRICE, is_default: true }],
    prep_options: [
      { label: "Whole", extra_cost_ngn: 0 },
      { label: "Ground", extra_cost_ngn: 0 },
    ],
  },
  {
    name: "Rosemary",
    type: FP,
    category: HERB,
    variants: [{ label: "Per portion", price_ngn: PRICE, is_default: true }],
    prep_options: [{ label: "Whole", extra_cost_ngn: 0 }],
  },
  {
    name: "Bay Leaves",
    type: FP,
    category: HERB,
    variants: [{ label: "Per portion", price_ngn: PRICE, is_default: true }],
    prep_options: [{ label: "Whole", extra_cost_ngn: 0 }],
  },
  {
    name: "Thyme",
    type: FP,
    category: HERB,
    variants: [{ label: "Per portion", price_ngn: PRICE, is_default: true }],
    prep_options: [{ label: "Whole", extra_cost_ngn: 0 }],
  },
  {
    name: "Mint",
    type: FP,
    category: HERB,
    variants: [{ label: "Per portion", price_ngn: PRICE, is_default: true }],
    prep_options: [
      { label: "Whole", extra_cost_ngn: 0 },
      { label: "Chopped", extra_cost_ngn: 0 },
    ],
  },
  {
    name: "Parsley",
    type: FP,
    category: HERB,
    variants: [{ label: "Per portion", price_ngn: PRICE, is_default: true }],
    prep_options: [
      { label: "Whole", extra_cost_ngn: 0 },
      { label: "Chopped", extra_cost_ngn: 0 },
    ],
  },
  {
    name: "Basil",
    type: FP,
    category: HERB,
    variants: [{ label: "Per portion", price_ngn: PRICE, is_default: true }],
    prep_options: [
      { label: "Whole", extra_cost_ngn: 0 },
      { label: "Chopped", extra_cost_ngn: 0 },
    ],
  },
  {
    name: "Cinnamon",
    type: FP,
    category: HERB,
    variants: [{ label: "Per portion", price_ngn: PRICE, is_default: true }],
    prep_options: [{ label: "Whole", extra_cost_ngn: 0 }],
  },
  {
    name: "Oregano",
    type: FP,
    category: HERB,
    variants: [{ label: "Per portion", price_ngn: PRICE, is_default: true }],
    prep_options: [{ label: "Whole", extra_cost_ngn: 0 }],
  },

  // ── Legumes ───────────────────────────────────────────────────
  {
    name: "Beans",
    type: FP,
    category: LEG,
    variants: [{ label: "Per portion", price_ngn: PRICE, is_default: true }],
    prep_options: [
      { label: "Cleaned (picked and washed)", extra_cost_ngn: 0 },
      { label: "Peeled", extra_cost_ngn: 0 },
    ],
  },

  // ── Cooking Kits ──────────────────────────────────────────────
  {
    name: "Jollof Rice / Stew Base",
    description: "Kit contains: Tomatoes, Rodo, Shombo, Onions, Ginger, Garlic",
    type: KIT,
    category: null,
    variants: [
      { label: "Serves 1", price_ngn: PRICE, is_default: true },
      { label: "Serves 3", price_ngn: PRICE, is_default: false },
      { label: "Serves 5", price_ngn: PRICE, is_default: false },
    ],
    prep_options: [
      { label: "Whole", extra_cost_ngn: 0 },
      { label: "Rough Blend", extra_cost_ngn: 0 },
      { label: "Smooth Blend", extra_cost_ngn: 0 },
    ],
  },
  {
    name: "Stir Fry",
    description:
      "Kit contains: Red Bell Pepper, Yellow Bell Pepper, Green Bell Pepper, Carrots, Ginger, Garlic",
    type: KIT,
    category: null,
    variants: [
      { label: "Serves 1", price_ngn: PRICE, is_default: true },
      { label: "Serves 3", price_ngn: PRICE, is_default: false },
      { label: "Serves 5", price_ngn: PRICE, is_default: false },
    ],
    prep_options: [
      { label: "Strips", extra_cost_ngn: 0 },
      { label: "Diced", extra_cost_ngn: 0 },
    ],
  },
  {
    name: "Akara / Moi Moi",
    description: "Kit contains: Beans, Rodo, Shombo, Onions",
    type: KIT,
    category: null,
    variants: [
      { label: "Serves 1", price_ngn: PRICE, is_default: true },
      { label: "Serves 3", price_ngn: PRICE, is_default: false },
      { label: "Serves 5", price_ngn: PRICE, is_default: false },
    ],
    prep_options: [
      { label: "Blended", extra_cost_ngn: 0 },
      { label: "Washed & Prepared (peeled, cleaned, not blended)", extra_cost_ngn: 0 },
    ],
  },
  {
    name: "Egusi / Efo Riro",
    description:
      "Kit contains: Ugu, Locust Beans (Iru), Rodo, Shombo, Onions, Palm Oil, Dried Fish",
    type: KIT,
    category: null,
    variants: [
      { label: "Serves 1", price_ngn: PRICE, is_default: true },
      { label: "Serves 3", price_ngn: PRICE, is_default: false },
      { label: "Serves 5", price_ngn: PRICE, is_default: false },
    ],
    prep_options: [
      { label: "With Egusi", extra_cost_ngn: 0 },
      { label: "Without Egusi", extra_cost_ngn: 0 },
    ],
  },
];

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL must be set in .env.local");

  const client = neon(databaseUrl);
  const db = drizzle({ client });

  // Clear existing product data (cascade handles variants and prep options)
  console.log("Clearing existing product data...");
  await db.execute(sql`TRUNCATE product_prep_options, product_variants, products RESTART IDENTITY CASCADE`);

  // Ensure ordering_config row exists
  await db
    .insert(ordering_config)
    .values({ id: 1, is_ordering_open: true, next_delivery_date: getNextSaturday() })
    .onConflictDoNothing();
  console.log("ordering_config: ensured row 1 exists\n");

  // Seed products
  for (const p of SEED_PRODUCTS) {
    const [inserted] = await db
      .insert(products)
      .values({
        name: p.name,
        description: p.description ?? null,
        type: p.type,
        category: p.category ?? null,
        image_url: null,
        is_active: true,
      })
      .returning({ id: products.id });

    if (!inserted) {
      console.warn(`Skipped: ${p.name}`);
      continue;
    }

    const productId = inserted.id;

    await db.insert(product_variants).values(
      p.variants.map((v) => ({ product_id: productId, ...v }))
    );

    if (p.prep_options.length > 0) {
      await db.insert(product_prep_options).values(
        p.prep_options.map((o) => ({ product_id: productId, ...o }))
      );
    }

    console.log(
      `  ✓ ${p.name} (${p.variants.length} variant${p.variants.length > 1 ? "s" : ""}, ${p.prep_options.length} prep option${p.prep_options.length !== 1 ? "s" : ""})`
    );
  }

  console.log(`\nDone. ${SEED_PRODUCTS.length} products seeded.`);
}

function getNextSaturday(): string {
  const d = new Date();
  const day = d.getDay();
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
