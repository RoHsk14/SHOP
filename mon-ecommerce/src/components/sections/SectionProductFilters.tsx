"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useProductGrid } from "@/lib/product-grid-context";

interface Props {
  settings: {
    show_sort?: boolean;
    show_price_range?: boolean;
  };
}

export default function SectionProductFilters({ settings }: Props) {
  const { sortBy, setSortBy, priceMin, setPriceMin, priceMax, setPriceMax } = useProductGrid();
  const [open, setOpen] = useState(false);

  const showSort = settings?.show_sort !== false;
  const showPriceRange = settings?.show_price_range !== false;

  return (
    <div className="mx-auto px-4 sm:px-6 py-4" style={{ maxWidth: "var(--theme-container-width, 1200px)" }}>
      <div className="flex items-center gap-3">
        {showPriceRange && (
          <button
            onClick={() => setOpen(!open)}
            className="p-2.5 rounded-xl border"
            style={{ borderColor: "var(--theme-border, #e5e7eb)" }}
          >
            <SlidersHorizontal className="w-4 h-4" style={{ color: open ? "var(--theme-primary)" : "var(--theme-text-muted)" }} />
          </button>
        )}
        {showSort && (
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2.5 text-sm rounded-xl border"
            style={{
              background: "var(--theme-surface, #fff)",
              borderColor: "var(--theme-border, #e5e7eb)",
              color: "var(--theme-text)",
            }}
          >
            <option value="newest">Plus récents</option>
            <option value="price-asc">Prix croissant</option>
            <option value="price-desc">Prix décroissant</option>
            <option value="name">Nom A-Z</option>
          </select>
        )}
      </div>

      {open && showPriceRange && (
        <div className="flex items-center gap-3 p-3 mt-3 rounded-xl border" style={{ borderColor: "var(--theme-border, #e5e7eb)" }}>
          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--theme-text-muted)" }}>
            Prix min :
            <input
              type="number"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              placeholder="0"
              className="w-20 px-2 py-1.5 rounded-lg border text-xs"
              style={{ borderColor: "var(--theme-border, #e5e7eb)" }}
            />
          </div>
          <span style={{ color: "var(--theme-text-muted)" }}>—</span>
          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--theme-text-muted)" }}>
            Prix max :
            <input
              type="number"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              placeholder="99999"
              className="w-20 px-2 py-1.5 rounded-lg border text-xs"
              style={{ borderColor: "var(--theme-border, #e5e7eb)" }}
            />
          </div>
          {(priceMin || priceMax) && (
            <button onClick={() => { setPriceMin(""); setPriceMax(""); }} className="p-1 hover:opacity-70">
              <X className="w-3.5 h-3.5" style={{ color: "var(--theme-text-muted)" }} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
