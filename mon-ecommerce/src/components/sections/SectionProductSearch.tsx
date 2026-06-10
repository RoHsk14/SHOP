"use client";

import { Search } from "lucide-react";
import { useProductGrid } from "@/lib/product-grid-context";

interface Props {
  settings: {
    placeholder?: string;
  };
}

export default function SectionProductSearch({ settings }: Props) {
  const { query, setQuery } = useProductGrid();

  return (
    <div className="mx-auto px-4 sm:px-6 pt-6 sm:pt-10" style={{ maxWidth: "var(--theme-container-width, 1200px)" }}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--theme-text-muted)" }} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={settings?.placeholder || "Rechercher un produit..."}
          className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border"
          style={{
            background: "var(--theme-surface, #fff)",
            borderColor: "var(--theme-border, #e5e7eb)",
            color: "var(--theme-text)",
          }}
        />
      </div>
    </div>
  );
}
