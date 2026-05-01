"use client";

import { toast } from "sonner";
import { useFormContext } from "react-hook-form";

import { UploadButton } from "@/utils/uploadthing";
import type { ProductPayload } from "@/lib/admin/schemas";

export function ProductImageUpload() {
  const { watch, setValue } = useFormContext<ProductPayload>();
  const url = watch("image_url");

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt="Product image preview"
            className="h-20 w-20 rounded-md border object-cover"
          />
        ) : (
          <div
            className="h-20 w-20 rounded-md border border-dashed bg-gray-50"
            aria-label="No image yet"
          />
        )}

        <div data-testid="upload-button">
          <UploadButton
            endpoint="productImage"
            onClientUploadComplete={(res) => {
              const uploaded = res?.[0];
              if (uploaded?.url) {
                setValue("image_url", uploaded.url, { shouldDirty: true });
                toast.success("Image uploaded");
              }
            }}
            onUploadError={(error) => {
              toast.error(`Upload failed: ${error.message}`);
            }}
          />
        </div>
      </div>
    </div>
  );
}

