import { z } from "zod";

const emptyStringToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

const variantSchema = z
  .object({
    id: z.string().uuid().optional(),
    label: z.string().min(1).max(80),
    price_ngn: z.coerce.number().int().nonnegative(),
    is_default: z.boolean().default(false),
  })
  .strict();

const prepOptionSchema = z
  .object({
    id: z.string().uuid().optional(),
    label: z.string().min(1).max(80),
    extra_cost_ngn: z.coerce.number().int().nonnegative().default(0),
  })
  .strict();

const productImageSchema = z
  .object({
    id: z.string().uuid().optional(), // present for images already saved in DB
    url: z.string().url(),
    key: z.string().min(1), // UploadThing file key
    sort_order: z.number().int().nonnegative(),
  })
  .strict();

export const productPayloadSchema = z
  .object({
    name: z.string().min(1).max(120),
    description: z.preprocess(
      emptyStringToUndefined,
      z.string().max(2000).nullable().optional(),
    ),
    type: z.enum(["fresh_produce", "cooking_kit"]),
    category: z.preprocess(
      emptyStringToUndefined,
      z.string().max(50).nullable().optional(),
    ),
    is_active: z.boolean(),
    images: z.array(productImageSchema).max(5).default([]),
    variants: z.array(variantSchema).max(20),
    prep_options: z.array(prepOptionSchema).max(20),
  })
  .strict();

export type ProductPayload = z.infer<typeof productPayloadSchema>;

export const orderStatusPatchSchema = z
  .object({
    status: z.enum(["paid","processing","delivered"]),
  })
  .strict();

const deliveryZoneSchema = z.object({
  area: z.string().min(1).max(100),
  fee_ngn: z.number().int().nonnegative(),
});

export const orderingConfigPatchSchema = z
  .object({
    is_ordering_open: z.boolean().optional(),
    next_delivery_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "next_delivery_date must be YYYY-MM-DD")
      .nullable()
      .optional(),
    cutoff_message: z.string().max(300).nullable().optional(),
    delivery_fee_ngn: z.coerce.number().int().nonnegative().optional(),
    delivery_zones: z.array(deliveryZoneSchema).max(50).optional(),
  })
  .strict()
  .refine(
    (d) => Object.values(d).some((v) => v !== undefined),
    { message: "At least one field required" }
  );

export const siteSettingsPatchSchema = z
  .object({
    whatsapp_number: z.string().max(20).nullable().optional(),
    contact_email: z.preprocess(
      emptyStringToUndefined,
      z.string().email("Must be a valid email").nullable().optional(),
    ),
    instagram_handle: z.string().max(50).nullable().optional(),
  })
  .strict()
  .refine(
    (d) => Object.values(d).some((v) => v !== undefined),
    { message: "At least one field required" },
  );

export type SiteSettingsPatch = z.infer<typeof siteSettingsPatchSchema>;

export const bulkStatusTransitionSchema = z
  .object({
    week_of: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "week_of must be YYYY-MM-DD"),
    from_status: z.enum(["paid", "processing"]),
    to_status: z.enum(["processing", "delivered"]),
  })
  .strict()
  .refine(
    (d) =>
      (d.from_status === "paid" && d.to_status === "processing") ||
      (d.from_status === "processing" && d.to_status === "delivered"),
    { message: "Invalid status transition: only paid→processing and processing→delivered are allowed" }
  );

export type BulkStatusTransition = z.infer<typeof bulkStatusTransitionSchema>;

export type OrderStatusPatch = z.infer<typeof orderStatusPatchSchema>;
export type OrderingConfigPatch = z.infer<typeof orderingConfigPatchSchema>;
