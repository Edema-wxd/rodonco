"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
  images: { url: string }[];
  alt: string;
  className?: string;
};

export function ProductImageCarousel({ images, alt, className = "" }: Props) {
  const [current, setCurrent] = React.useState(0);

  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length);
  const next = () => setCurrent((c) => (c + 1) % images.length);

  if (images.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-stone-100 ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt={alt} className="h-20 w-auto opacity-20" />
      </div>
    );
  }

  return (
    <div className={`group relative overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={current}
        src={images[current].url}
        alt={images.length > 1 ? `${alt} — ${current + 1} of ${images.length}` : alt}
        loading={current === 0 ? "eager" : "lazy"}
        className="h-full w-full object-cover transition-opacity duration-200"
      />

      {images.length > 1 && (
        <>
          {/* Prev */}
          <button
            type="button"
            onClick={prev}
            aria-label="Previous image"
            className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 shadow-md backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          >
            <ChevronLeft className="h-4 w-4 text-zinc-800" />
          </button>

          {/* Next */}
          <button
            type="button"
            onClick={next}
            aria-label="Next image"
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 shadow-md backdrop-blur-sm opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          >
            <ChevronRight className="h-4 w-4 text-zinc-800" />
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrent(i)}
                aria-label={`Go to image ${i + 1}`}
                className={[
                  "h-1.5 rounded-full bg-white transition-all duration-200 shadow-sm",
                  i === current ? "w-4 opacity-100" : "w-1.5 opacity-50",
                ].join(" ")}
              />
            ))}
          </div>

          {/* Counter badge */}
          <div className="absolute right-3 bottom-3 rounded-full bg-zinc-900/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
            {current + 1}/{images.length}
          </div>
        </>
      )}
    </div>
  );
}
