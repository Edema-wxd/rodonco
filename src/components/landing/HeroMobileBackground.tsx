"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const IMAGES = ["/images/hero1.png", "/images/hero2.png", "/images/hero3.png"];
const INTERVAL_MS = 5000;

export function HeroMobileBackground({ className }: { className?: string }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveIndex((i) => (i + 1) % IMAGES.length);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={`absolute inset-0 ${className ?? ""}`}>
      {IMAGES.map((src, i) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          priority={i === 0}
          className={`object-cover transition-opacity duration-1000 ease-in-out ${
            i === activeIndex ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
    </div>
  );
}
