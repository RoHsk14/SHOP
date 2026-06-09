"use client";

import { useEffect } from "react";
import type { BrandAssets } from "@/lib/theme-config";

export default function HeadManager({ brand }: { brand?: BrandAssets }) {
  useEffect(() => {
    const existing: Element[] = [];
    const add = (tag: string, attrs: Record<string, string>) => {
      const el = document.createElement(tag);
      Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
      document.head.appendChild(el);
      existing.push(el);
    };
    const removeAll = () => {
      existing.forEach((el) => el.remove());
      existing.length = 0;
    };

    removeAll();

    if (brand?.favicon) {
      add("link", { rel: "icon", type: "image/x-icon", href: brand.favicon });
    }
    if (brand?.themeColor) {
      add("meta", { name: "theme-color", content: brand.themeColor });
    }
    if (brand?.ogImage) {
      add("meta", { property: "og:image", content: brand.ogImage });
    }

    return removeAll;
  }, [brand?.favicon, brand?.themeColor, brand?.ogImage]);

  return null;
}
