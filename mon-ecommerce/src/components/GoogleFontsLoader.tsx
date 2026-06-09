"use client";

import { useEffect } from "react";

const FONT_CACHE = new Set<string>();

export default function GoogleFontsLoader({ fonts }: { fonts: { heading?: string; body?: string } }) {
  useEffect(() => {
    const families = [fonts.heading, fonts.body]
      .filter(Boolean)
      .map((f) => f?.split(",")[0]?.trim())
      .filter((f) => f && !FONT_CACHE.has(f!));

    if (families.length === 0) return;

    const params = families
      .map((f) => f!.replace(/\s+/g, "+"))
      .map((f) => `family=${f}:wght@300;400;500;600;700;800;900`)
      .join("&");

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?${params}&display=swap`;
    document.head.appendChild(link);

    families.forEach((f) => f && FONT_CACHE.add(f));
  }, [fonts.heading, fonts.body]);

  return null;
}
