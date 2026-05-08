"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { X, Plus, Trash2, AlertTriangle } from "lucide-react";

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

const inputCls =
  "h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-zinc-800 outline-none placeholder:text-stone-300 focus:border-red-400 focus:ring-2 focus:ring-red-100";

const labelCls =
  "block text-xs font-black uppercase tracking-wider text-stone-400";

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

    if (res.status === 401) { toast.error("Unauthorized"); return; }
    if (res.status === 400) { toast.error("Invalid product details"); return; }
    if (!res.ok) { toast.error("Failed to save product. Please try again."); return; }

    toast.success("Product saved");
    router.refresh();
    onClose();
  }

  async function handleDelete() {
    if (!product) return;

    const res = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
    if (res.status === 401) { toast.error("Unauthorized"); return; }
    if (!res.ok) { toast.error("Failed to delete product."); return; }

    toast.success("Product deleted");
    router.refresh();
    onClose();
  }

  if (!open) return null;

  return (
    <div>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-zinc-900/30 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[480px] flex-col bg-stone-50 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 bg-white px-6 py-5">
          <div>
            <p
              className="text-xs font-black uppercase tracking-wider text-red-600"
              style={{ fontFamily: "var(--font-lexend)" }}
            >
              {product ? "Edit" : "New"}
            </p>
            <h2
              className="mt-0.5 text-xl font-black text-zinc-800"
              style={{ fontFamily: "var(--font-quicksand)" }}
            >
              {product ? product.name : "Product"}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-400 transition-colors hover:bg-stone-200 hover:text-zinc-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <FormProvider {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-1 flex-col overflow-y-auto"
          >
            <div className="flex-1 space-y-6 p-6">
              <ProductImageUpload />

              {/* Name */}
              <div className="space-y-2">
                <label htmlFor="prod-name" className={labelCls} style={{ fontFamily: "var(--font-lexend)" }}>
                  Name
                </label>
                <input
                  id="prod-name"
                  className={inputCls}
                  style={{ fontFamily: "var(--font-inter)" }}
                  {...form.register("name")}
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label htmlFor="prod-desc" className={labelCls} style={{ fontFamily: "var(--font-lexend)" }}>
                  Description
                </label>
                <textarea
                  id="prod-desc"
                  rows={3}
                  className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-zinc-800 outline-none placeholder:text-stone-300 focus:border-red-400 focus:ring-2 focus:ring-red-100"
                  style={{ fontFamily: "var(--font-inter)" }}
                  {...form.register("description")}
                />
              </div>

              {/* Type */}
              <div className="space-y-2">
                <label htmlFor="prod-type" className={labelCls} style={{ fontFamily: "var(--font-lexend)" }}>
                  Type
                </label>
                <select
                  id="prod-type"
                  className={inputCls}
                  style={{ fontFamily: "var(--font-inter)" }}
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

              {/* Active toggle */}
              <div className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white px-4 py-3">
                <label
                  htmlFor="prod-active"
                  className="text-sm font-bold text-zinc-800"
                  style={{ fontFamily: "var(--font-lexend)" }}
                >
                  Active on shop
                </label>
                <input
                  id="prod-active"
                  type="checkbox"
                  checked={form.watch("is_active")}
                  onChange={(e) =>
                    form.setValue("is_active", e.target.checked, { shouldDirty: true })
                  }
                  className="h-4 w-4 accent-red-600"
                />
              </div>

              {/* Size Variants */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3
                    className="text-xs font-black uppercase tracking-wider text-stone-400"
                    style={{ fontFamily: "var(--font-lexend)" }}
                  >
                    Size Variants
                  </h3>
                  <button
                    type="button"
                    onClick={() => variants.append({ label: "", price_ngn: 0, is_default: false })}
                    className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700"
                    style={{ fontFamily: "var(--font-lexend)" }}
                  >
                    <Plus className="h-3 w-3" />
                    + Add variant
                  </button>
                </div>
                <ul className="space-y-2">
                  {variants.fields.map((field, i) => (
                    <li key={field.id} className="flex items-center gap-2">
                      <input
                        className={`${inputCls} flex-1`}
                        style={{ fontFamily: "var(--font-inter)" }}
                        placeholder="Label"
                        {...form.register(`variants.${i}.label` as const)}
                      />
                      <input
                        className="h-10 w-28 rounded-xl border border-stone-200 bg-white px-3 text-sm text-zinc-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                        style={{ fontFamily: "var(--font-inter)" }}
                        type="number"
                        placeholder="Price (₦)"
                        {...form.register(`variants.${i}.price_ngn` as const, { valueAsNumber: true })}
                      />
                      <button
                        type="button"
                        aria-label="Remove variant"
                        className="flex h-8 w-8 items-center justify-center rounded-full text-stone-300 transition-colors hover:bg-red-50 hover:text-red-600"
                        onClick={() => variants.remove(i)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Prep Options */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3
                    className="text-xs font-black uppercase tracking-wider text-stone-400"
                    style={{ fontFamily: "var(--font-lexend)" }}
                  >
                    Prep Options
                  </h3>
                  <button
                    type="button"
                    onClick={() => prepOptions.append({ label: "", extra_cost_ngn: 0 })}
                    className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700"
                    style={{ fontFamily: "var(--font-lexend)" }}
                  >
                    <Plus className="h-3 w-3" />
                    + Add prep option
                  </button>
                </div>
                <ul className="space-y-2">
                  {prepOptions.fields.map((field, i) => (
                    <li key={field.id} className="flex items-center gap-2">
                      <input
                        className={`${inputCls} flex-1`}
                        style={{ fontFamily: "var(--font-inter)" }}
                        placeholder="Label"
                        {...form.register(`prep_options.${i}.label` as const)}
                      />
                      <input
                        className="h-10 w-28 rounded-xl border border-stone-200 bg-white px-3 text-sm text-zinc-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                        style={{ fontFamily: "var(--font-inter)" }}
                        type="number"
                        placeholder="Extra (₦)"
                        {...form.register(`prep_options.${i}.extra_cost_ngn` as const, {
                          valueAsNumber: true,
                        })}
                      />
                      <button
                        type="button"
                        aria-label="Remove prep option"
                        className="flex h-8 w-8 items-center justify-center rounded-full text-stone-300 transition-colors hover:bg-red-50 hover:text-red-600"
                        onClick={() => prepOptions.remove(i)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Delete zone */}
              {product ? (
                <section className="rounded-2xl border border-red-100 bg-red-50 p-4">
                  {confirmingDelete ? (
                    <div className="space-y-3">
                      <p
                        className="flex items-center gap-2 text-sm font-bold text-red-700"
                        id="delete-confirm-text"
                        style={{ fontFamily: "var(--font-lexend)" }}
                      >
                        <AlertTriangle className="h-4 w-4" />
                        Are you sure? This cannot be undone.
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="rounded-full bg-red-600 px-5 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90"
                          aria-describedby="delete-confirm-text"
                          style={{ fontFamily: "var(--font-lexend)" }}
                          onClick={handleDelete}
                        >
                          Confirm Delete
                        </button>
                        <button
                          type="button"
                          className="rounded-full bg-white px-5 py-2 text-sm font-bold text-stone-500 transition-colors hover:bg-stone-100"
                          style={{ fontFamily: "var(--font-lexend)" }}
                          onClick={() => setConfirmingDelete(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 text-sm font-bold text-red-600 hover:text-red-700"
                      style={{ fontFamily: "var(--font-lexend)" }}
                      onClick={() => setConfirmingDelete(true)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Product
                    </button>
                  )}
                </section>
              ) : null}
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-end gap-3 border-t border-stone-200 bg-white px-6 py-4">
              <button
                type="button"
                className="rounded-full px-6 py-2.5 text-sm font-bold text-stone-500 transition-colors hover:bg-stone-100"
                style={{ fontFamily: "var(--font-lexend)" }}
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-full bg-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90"
                style={{ fontFamily: "var(--font-lexend)" }}
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
