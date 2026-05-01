"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import type { AdminProduct } from "@/lib/admin/products";
import { productPayloadSchema, type ProductPayload } from "@/lib/admin/schemas";

import { ProductImageUpload } from "./ProductImageUpload";

const EMPTY_DEFAULTS: ProductPayload = {
  name: "",
  description: null,
  type: "fresh_produce",
  image_url: null,
  is_active: true,
  variants: [],
  prep_options: [],
};

export function ProductDrawer({
  open,
  product,
  onClose,
}: {
  open: boolean;
  product: AdminProduct | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const form = useForm<ProductPayload>({
    resolver: zodResolver(productPayloadSchema),
    defaultValues: EMPTY_DEFAULTS,
    mode: "onSubmit",
  });

  const variants = useFieldArray({ control: form.control, name: "variants" });
  const prepOptions = useFieldArray({ control: form.control, name: "prep_options" });

  useEffect(() => {
    if (!open) return;

    form.reset(
      product
        ? {
            name: product.name,
            description: product.description ?? null,
            type: product.type as ProductPayload["type"],
            image_url: product.image_url ?? null,
            is_active: product.is_active,
            variants: product.variants.map((v) => ({
              id: v.id,
              label: v.label,
              price_ngn: v.price_ngn,
              is_default: v.is_default,
            })),
            prep_options: product.prep_options.map((p) => ({
              id: p.id,
              label: p.label,
              extra_cost_ngn: p.extra_cost_ngn,
            })),
          }
        : EMPTY_DEFAULTS,
    );

    setConfirmingDelete(false);
  }, [open, product, form]);

  async function onSubmit(values: ProductPayload) {
    const url = product ? `/api/admin/products/${product.id}` : "/api/admin/products";
    const method = product ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (res.status === 401) {
      toast.error("Unauthorized");
      return;
    }

    if (res.status === 400) {
      toast.error("Invalid product details");
      return;
    }

    if (!res.ok) {
      toast.error("Failed to save product. Please try again.");
      return;
    }

    toast.success("Product saved");
    router.refresh();
    onClose();
  }

  async function handleDelete() {
    if (!product) return;

    const res = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
    if (res.status === 401) {
      toast.error("Unauthorized");
      return;
    }
    if (!res.ok) {
      toast.error("Failed to delete product.");
      return;
    }

    toast.success("Product deleted");
    router.refresh();
    onClose();
  }

  if (!open) return null;

  return (
    <div>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-[480px] overflow-y-auto bg-white shadow-xl">
        <div className="border-b px-4 py-4">
          <div className="text-base font-semibold text-gray-900">
            {product ? product.name : "New Product"}
          </div>
        </div>

        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-4">
            <ProductImageUpload />

            <div className="space-y-1.5">
              <label htmlFor="prod-name" className="text-sm font-medium text-gray-900">
                Name
              </label>
              <input
                id="prod-name"
                className="h-10 w-full rounded-md border px-3"
                {...form.register("name")}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="prod-desc" className="text-sm font-medium text-gray-900">
                Description
              </label>
              <textarea
                id="prod-desc"
                rows={3}
                className="w-full rounded-md border px-3 py-2"
                {...form.register("description")}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="prod-type" className="text-sm font-medium text-gray-900">
                Type
              </label>
              <select
                id="prod-type"
                className="h-10 w-full rounded-md border px-3"
                value={form.watch("type")}
                onChange={(e) =>
                  form.setValue("type", e.target.value as ProductPayload["type"], {
                    shouldDirty: true,
                  })
                }
              >
                <option value="fresh_produce">Fresh Produce</option>
                <option value="cooking_kit">Cooking Kit</option>
              </select>
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <label htmlFor="prod-active" className="text-sm font-medium text-gray-900">
                Active on shop
              </label>
              <input
                id="prod-active"
                type="checkbox"
                checked={form.watch("is_active")}
                onChange={(e) =>
                  form.setValue("is_active", e.target.checked, { shouldDirty: true })
                }
              />
            </div>

            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Size Variants</h3>
                <button
                  type="button"
                  onClick={() => variants.append({ label: "", price_ngn: 0, is_default: false })}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  + Add variant
                </button>
              </div>
              <ul className="space-y-2">
                {variants.fields.map((field, i) => (
                  <li key={field.id} className="flex items-center gap-2">
                    <input
                      className="h-10 flex-1 rounded-md border px-3"
                      placeholder="Label"
                      {...form.register(`variants.${i}.label` as const)}
                    />
                    <input
                      className="h-10 w-32 rounded-md border px-3"
                      type="number"
                      placeholder="Price (kobo)"
                      {...form.register(`variants.${i}.price_ngn` as const, { valueAsNumber: true })}
                    />
                    <button
                      type="button"
                      aria-label="Remove variant"
                      className="rounded-md px-2 py-2 text-gray-400 hover:text-red-600"
                      onClick={() => variants.remove(i)}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Prep Options</h3>
                <button
                  type="button"
                  onClick={() => prepOptions.append({ label: "", extra_cost_ngn: 0 })}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  + Add prep option
                </button>
              </div>
              <ul className="space-y-2">
                {prepOptions.fields.map((field, i) => (
                  <li key={field.id} className="flex items-center gap-2">
                    <input
                      className="h-10 flex-1 rounded-md border px-3"
                      placeholder="Label"
                      {...form.register(`prep_options.${i}.label` as const)}
                    />
                    <input
                      className="h-10 w-32 rounded-md border px-3"
                      type="number"
                      placeholder="Extra (kobo)"
                      {...form.register(`prep_options.${i}.extra_cost_ngn` as const, {
                        valueAsNumber: true,
                      })}
                    />
                    <button
                      type="button"
                      aria-label="Remove prep option"
                      className="rounded-md px-2 py-2 text-gray-400 hover:text-red-600"
                      onClick={() => prepOptions.remove(i)}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            {product ? (
              <section className="rounded-md border border-red-200 p-3">
                {confirmingDelete ? (
                  <div className="space-y-2">
                    <p className="text-sm text-red-700" id="delete-confirm-text">
                      Are you sure? This cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                        aria-describedby="delete-confirm-text"
                        onClick={handleDelete}
                      >
                        Confirm Delete
                      </button>
                      <button
                        type="button"
                        className="rounded-md px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        onClick={() => setConfirmingDelete(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                    onClick={() => setConfirmingDelete(true)}
                  >
                    Delete Product
                  </button>
                )}
              </section>
            ) : null}

            <div className="flex items-center justify-end gap-2 border-t pt-4">
              <button
                type="button"
                className="rounded-md px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800"
              >
                Save Product
              </button>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}

