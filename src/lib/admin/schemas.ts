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

export const productPayloadSchema = z
  .object({
    name: z.string().min(1).max(120),
    description: z
      .preprocess(emptyStringToUndefined, z.string().max(2000))
      .nullable()
      .optional(),
    type: z.enum(["fresh_produce", "cooking_kit"]),
    image_url: z
      .preprocess(emptyStringToUndefined, z.string().url())
      .nullable()
      .optional(),
    is_active: z.boolean(),
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

export const orderingConfigPatchSchema = z
  .object({
    is_ordering_open: z.boolean(),
  })
  .strict();

export type OrderStatusPatch = z.infer<typeof orderStatusPatchSchema>;
export type OrderingConfigPatch = z.infer<typeof orderingConfigPatchSchema>;
