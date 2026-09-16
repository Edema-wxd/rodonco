"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import {
  MENU_PREVIEW_FALLBACK_COUNT,
  MENU_PREVIEW_MAX_PRODUCTS,
  type MenuPreviewConfig,
} from "@/lib/homepage/menuPreviewShared";

export type MenuPreviewProductOption = {
  id: string;
  name: string;
  type: string;
  coming_soon: boolean;
};

interface Props {
  initialConfig: MenuPreviewConfig;
  products: MenuPreviewProductOption[];
}

const labelClass = "text-[10px] font-black uppercase tracking-widest text-stone-400";
const inputClass =
  "h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-zinc-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100";

function typeLabel(type: string): string {
  return type === "cooking_kit" ? "Kit" : "Produce";
}

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className={labelClass} style={{ fontFamily: "var(--font-quicksand)" }}>
        {label}
      </label>
      {children}
      {hint ? (
        <p className="text-xs text-stone-400" style={{ fontFamily: "var(--font-inter)" }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function MenuPreviewForm({ initialConfig, products }: Props) {
  const router = useRouter();
  const [config, setConfig] = React.useState<MenuPreviewConfig>(initialConfig);
  const [pendingProductId, setPendingProductId] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const productsById = React.useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  // Curated products that are no longer active are hidden on the homepage;
  // drop them here so saving cleans up the stored list.
  const selectedIds = config.product_ids.filter((id) => productsById.has(id));
  const available = products.filter((p) => !selectedIds.includes(p.id));
  const atLimit = selectedIds.length >= MENU_PREVIEW_MAX_PRODUCTS;

  function set<K extends keyof MenuPreviewConfig>(key: K, value: MenuPreviewConfig[K]) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  function addProduct() {
    if (!pendingProductId || atLimit) return;
    set("product_ids", [...selectedIds, pendingProductId]);
    setPendingProductId("");
  }

  function moveProduct(index: number, delta: -1 | 1) {
    const next = [...selectedIds];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    set("product_ids", next);
  }

  function removeProduct(id: string) {
    set("product_ids", selectedIds.filter((pid) => pid !== id));
  }

  async function handleSave() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/homepage/menu-preview", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...config, product_ids: selectedIds }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error((data as { error?: string }).error ?? "Failed to save homepage section.");
        return;
      }
      toast.success("Homepage section saved.");
      router.refresh();
    } catch {
      toast.error("Failed to save homepage section.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-tl-[28px] rounded-tr-xl rounded-bl-xl rounded-br-[28px] bg-white p-6 shadow-sm outline outline-1 outline-stone-200/60">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={labelClass} style={{ fontFamily: "var(--font-quicksand)" }}>
            Homepage
          </p>
          <h2
            className="mt-1.5 text-lg font-black text-zinc-800"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            &ldquo;{config.heading} {config.heading_accent}&rdquo; section
          </h2>
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm font-bold text-zinc-800" style={{ fontFamily: "var(--font-quicksand)" }}>
          <input
            type="checkbox"
            checked={config.is_visible}
            onChange={(e) => set("is_visible", e.target.checked)}
            className="h-4 w-4 accent-red-600"
          />
          Show on homepage
        </label>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id="mp-heading" label="Heading">
          <input
            id="mp-heading"
            value={config.heading}
            onChange={(e) => set("heading", e.target.value)}
            maxLength={80}
            className={inputClass}
            style={{ fontFamily: "var(--font-inter)" }}
          />
        </Field>
        <Field id="mp-heading-accent" label="Heading accent (red)" hint="Shown in red after the heading. Optional.">
          <input
            id="mp-heading-accent"
            value={config.heading_accent}
            onChange={(e) => set("heading_accent", e.target.value)}
            maxLength={40}
            className={inputClass}
            style={{ fontFamily: "var(--font-inter)" }}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field id="mp-subheading" label="Subheading" hint="Optional.">
            <textarea
              id="mp-subheading"
              value={config.subheading}
              onChange={(e) => set("subheading", e.target.value)}
              maxLength={240}
              rows={2}
              className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              style={{ fontFamily: "var(--font-inter)" }}
            />
          </Field>
        </div>
        <Field id="mp-card-button" label="Card button text" hint="Opens the product so customers can add it.">
          <input
            id="mp-card-button"
            value={config.card_button_label}
            onChange={(e) => set("card_button_label", e.target.value)}
            maxLength={30}
            className={inputClass}
            style={{ fontFamily: "var(--font-inter)" }}
          />
        </Field>
        <div className="hidden sm:block" />
        <Field id="mp-cta-label" label="Bottom button text">
          <input
            id="mp-cta-label"
            value={config.cta_label}
            onChange={(e) => set("cta_label", e.target.value)}
            maxLength={40}
            className={inputClass}
            style={{ fontFamily: "var(--font-inter)" }}
          />
        </Field>
        <Field id="mp-cta-href" label="Bottom button link" hint="A site path like /shop, or a full https:// URL.">
          <input
            id="mp-cta-href"
            value={config.cta_href}
            onChange={(e) => set("cta_href", e.target.value)}
            maxLength={300}
            placeholder="/shop"
            className={inputClass}
            style={{ fontFamily: "var(--font-inter)" }}
          />
        </Field>
      </div>

      {/* Products */}
      <div className="mt-6">
        <p className={labelClass} style={{ fontFamily: "var(--font-quicksand)" }}>
          Featured products ({selectedIds.length}/{MENU_PREVIEW_MAX_PRODUCTS})
        </p>
        <p className="mt-1 text-xs text-stone-400" style={{ fontFamily: "var(--font-inter)" }}>
          {selectedIds.length === 0
            ? `None picked — the homepage shows the first ${MENU_PREVIEW_FALLBACK_COUNT} active cooking kits (A–Z).`
            : "Shown in this order. Inactive products are hidden automatically."}
        </p>

        {selectedIds.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {selectedIds.map((id, index) => {
              const product = productsById.get(id)!;
              return (
                <li
                  key={id}
                  className="flex items-center gap-2 rounded-xl border border-stone-200 px-3 py-2"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  <span className="w-5 text-xs font-bold text-stone-400">{index + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-800">
                    {product.name}
                  </span>
                  <span className="shrink-0 text-[10px] font-bold uppercase text-stone-400">
                    {product.coming_soon ? "Coming soon" : typeLabel(product.type)}
                  </span>
                  <button
                    type="button"
                    onClick={() => moveProduct(index, -1)}
                    disabled={index === 0}
                    aria-label={`Move ${product.name} up`}
                    className="rounded-lg p-1 text-stone-500 hover:bg-stone-100 disabled:opacity-30"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveProduct(index, 1)}
                    disabled={index === selectedIds.length - 1}
                    aria-label={`Move ${product.name} down`}
                    className="rounded-lg p-1 text-stone-500 hover:bg-stone-100 disabled:opacity-30"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeProduct(id)}
                    aria-label={`Remove ${product.name}`}
                    className="rounded-lg p-1 text-stone-500 hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}

        <div className="mt-3 flex gap-2">
          <select
            aria-label="Product to feature"
            value={pendingProductId}
            onChange={(e) => setPendingProductId(e.target.value)}
            disabled={atLimit || available.length === 0}
            className={`${inputClass} min-w-0 flex-1 disabled:opacity-50`}
            style={{ fontFamily: "var(--font-inter)" }}
          >
            <option value="">
              {atLimit
                ? `Maximum of ${MENU_PREVIEW_MAX_PRODUCTS} reached`
                : available.length === 0
                  ? "No more active products"
                  : "Choose a product…"}
            </option>
            {available.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.coming_soon ? "Coming soon" : typeLabel(p.type)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={addProduct}
            disabled={!pendingProductId || atLimit}
            className="shrink-0 rounded-full border border-stone-200 px-4 text-sm font-bold text-zinc-800 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            Add
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-full bg-zinc-800 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {submitting ? "Saving…" : "Save"}
        </button>
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="text-sm font-bold text-stone-500 underline-offset-4 hover:text-zinc-800 hover:underline"
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          View homepage ↗
        </a>
      </div>
    </div>
  );
}
