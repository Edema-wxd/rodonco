"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { X, GripVertical, ImagePlus, Loader2 } from "lucide-react";

import { useUploadThing } from "@/utils/uploadthing";
import type { ProductPayload } from "@/lib/admin/schemas";

type ImageItem = ProductPayload["images"][number];

const MAX_IMAGES = 5;

export function ProductImageUpload() {
  const { watch, setValue } = useFormContext<ProductPayload>();
  const images = watch("images") ?? [];

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const dragIndex = React.useRef<number | null>(null);
  const [dragOver, setDragOver] = React.useState<number | null>(null);

  const { startUpload, isUploading } = useUploadThing("productImage", {
    onClientUploadComplete(res) {
      const current = watch("images") ?? [];
      const incoming: ImageItem[] = res.map((file, i) => ({
        url: file.url,
        key: file.key,
        sort_order: current.length + i,
      }));
      const merged = [...current, ...incoming].slice(0, MAX_IMAGES);
      setValue("images", merged, { shouldDirty: true });
      toast.success(`${res.length} image${res.length > 1 ? "s" : ""} uploaded`);
    },
    onUploadError(err) {
      toast.error(`Upload failed: ${err.message}`);
    },
  });

  function openPicker() {
    fileInputRef.current?.click();
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const remaining = MAX_IMAGES - images.length;
    const toUpload = files.slice(0, remaining);
    try {
      await startUpload(toUpload);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed. Please try again.");
    }
    e.target.value = "";
  }

  function removeImage(index: number) {
    const updated = images
      .filter((_, i) => i !== index)
      .map((img, i) => ({ ...img, sort_order: i }));
    setValue("images", updated, { shouldDirty: true });
  }

  // ── Drag-to-reorder ──────────────────────────────────────────────
  function handleDragStart(index: number) {
    dragIndex.current = index;
  }

  function handleDragEnter(index: number) {
    setDragOver(index);
  }

  function handleDrop(targetIndex: number) {
    const from = dragIndex.current;
    if (from === null || from === targetIndex) {
      dragIndex.current = null;
      setDragOver(null);
      return;
    }
    const reordered = [...images];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(targetIndex, 0, moved);
    setValue(
      "images",
      reordered.map((img, i) => ({ ...img, sort_order: i })),
      { shouldDirty: true },
    );
    dragIndex.current = null;
    setDragOver(null);
  }

  function handleDragEnd() {
    dragIndex.current = null;
    setDragOver(null);
  }

  const canAddMore = images.length < MAX_IMAGES && !isUploading;

  return (
    <div className="space-y-3" data-testid="image-upload">
      <div className="flex items-center justify-between">
        <p
          className="text-xs font-black uppercase tracking-wider text-stone-400"
          style={{ fontFamily: "var(--font-lexend)" }}
        >
          Images
          <span className="ml-1.5 font-normal text-stone-300">
            ({images.length}/{MAX_IMAGES})
          </span>
        </p>
        {images.length > 1 && (
          <p className="text-[11px] text-stone-300" style={{ fontFamily: "var(--font-inter)" }}>
            Drag to reorder · First = primary
          </p>
        )}
      </div>

      <div className="grid grid-cols-5 gap-2">
        {images.map((img, i) => (
          <div
            key={img.url}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragEnter={() => handleDragEnter(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(i)}
            onDragEnd={handleDragEnd}
            className={[
              "group relative aspect-square cursor-grab overflow-hidden rounded-xl border bg-stone-50 transition-all active:cursor-grabbing",
              dragOver === i && dragIndex.current !== i
                ? "scale-105 border-red-400 ring-2 ring-red-200"
                : "border-stone-200",
              dragIndex.current === i ? "opacity-40" : "opacity-100",
            ].join(" ")}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={`Product image ${i + 1}`}
              loading="lazy"
              className="h-full w-full object-cover"
              draggable={false}
            />

            {/* Drag handle */}
            <div className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded bg-zinc-900/60 text-white opacity-0 transition-opacity group-hover:opacity-100">
              <GripVertical className="h-3 w-3" />
            </div>

            {/* Delete */}
            <button
              type="button"
              aria-label="Remove image"
              onClick={() => removeImage(i)}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900/70 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>

            {/* Primary badge */}
            {i === 0 && (
              <span
                className="absolute bottom-1 left-1 rounded px-1.5 py-0.5 text-[9px] font-bold bg-zinc-900/70 text-white"
                style={{ fontFamily: "var(--font-lexend)" }}
              >
                Primary
              </span>
            )}
          </div>
        ))}

        {/* Add tile */}
        {canAddMore && (
          <button
            type="button"
            onClick={openPicker}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-stone-200 bg-stone-50 text-stone-400 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-500"
          >
            <ImagePlus className="h-5 w-5" />
            <span
              className="text-[10px] font-bold uppercase tracking-wide"
              style={{ fontFamily: "var(--font-lexend)" }}
            >
              Add
            </span>
          </button>
        )}

        {/* Upload progress tile */}
        {isUploading && (
          <div className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-stone-200 bg-stone-50 text-stone-400">
            <Loader2 className="h-5 w-5 animate-spin text-red-500" />
            <span
              className="text-[10px] font-bold uppercase tracking-wide"
              style={{ fontFamily: "var(--font-lexend)" }}
            >
              Uploading
            </span>
          </div>
        )}
      </div>

      {/* Hidden file input — triggered by the Add tile */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => void onFileChange(e)}
      />
    </div>
  );
}
