import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/utils/uploadthing", () => ({
  UploadButton: () => <button type="button">Upload</button>,
  useUploadThing: () => ({
    startUpload: vi.fn().mockResolvedValue([]),
    isUploading: false,
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

import type { AdminProduct } from "@/lib/admin/products";
import { ProductsList } from "./ProductsList";

function makeProduct(partial: Partial<AdminProduct> & Pick<AdminProduct, "id" | "name">): AdminProduct {
  return {
    id: partial.id,
    name: partial.name,
    description: partial.description ?? null,
    type: partial.type ?? "fresh_produce",
    is_active: partial.is_active ?? true,
    images: partial.images ?? [],
    variants: partial.variants ?? [],
    prep_options: partial.prep_options ?? [],
  };
}

describe("Admin products drawer (PROD-01..PROD-05)", () => {
  it("PROD-01: /admin/products table shows + New Product and columns", () => {
    render(<ProductsList initialProducts={[makeProduct({ id: "p1", name: "Tomatoes" })]} />);
    expect(screen.getByText("+ New Product")).toBeTruthy();
    expect(screen.getByText("Name")).toBeTruthy();
    expect(screen.getByText("Type")).toBeTruthy();
    expect(screen.getByText("Active")).toBeTruthy();
  });

  it("PROD-02: drawer renders image upload section", async () => {
    render(<ProductsList initialProducts={[]} />);
    screen.getAllByText("+ New Product")[0]?.click();
    expect(await screen.findByTestId("image-upload")).toBeTruthy();
  });

  it("PROD-03: variants useFieldArray add/remove controls render", async () => {
    render(<ProductsList initialProducts={[]} />);
    screen.getAllByText("+ New Product")[0]?.click();
    expect(await screen.findByText("+ Add variant")).toBeTruthy();
  });

  it("PROD-04: prep_options useFieldArray add/remove controls render", async () => {
    render(<ProductsList initialProducts={[]} />);
    screen.getAllByText("+ New Product")[0]?.click();
    expect(await screen.findByText("+ Add prep option")).toBeTruthy();
  });

  it("PROD-05: is_active toggle is present in the form", async () => {
    render(<ProductsList initialProducts={[]} />);
    screen.getAllByText("+ New Product")[0]?.click();
    expect(await screen.findByText("Active on shop")).toBeTruthy();
  });
});
