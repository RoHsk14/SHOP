"use client";

import { useState, ReactNode } from "react";
import { Info, Truck, RefreshCw, CreditCard } from "lucide-react";
import { useProduct } from "@/lib/product-context";

interface PanelBlock {
  settings: {
    title?: string;
    content?: string;
    icon?: "none" | "info" | "truck" | "refresh" | "credit-card";
    open_by_default?: boolean;
  };
}

interface Props {
  settings?: Record<string, any>;
  blocks?: PanelBlock[];
}

const iconMap: Record<string, ReactNode> = {
  info: <Info className="w-4 h-4" />,
  truck: <Truck className="w-4 h-4" />,
  refresh: <RefreshCw className="w-4 h-4" />,
  "credit-card": <CreditCard className="w-4 h-4" />,
};

export default function SectionProductAccordion({ blocks }: Props) {
  const { product, loading } = useProduct();
  const [openPanels, setOpenPanels] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {};
    (blocks || []).forEach((b, i) => {
      if (b.settings?.open_by_default) initial[i] = true;
    });
    return initial;
  });

  if (loading || !product) return null;
  if (!blocks?.length) return null;

  const togglePanel = (index: number) => {
    setOpenPanels((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="mx-auto px-4 sm:px-6 pb-6 sm:pb-10" style={{ maxWidth: "var(--theme-container-width, 1200px)" }}>
      <div
        className="overflow-hidden divide-y"
        style={{
          background: "var(--theme-surface, #ffffff)",
          borderRadius: "var(--theme-radius-card, 16px)",
          border: "1px solid var(--theme-border, #e5e7eb)",
          borderColor: "var(--theme-border, #e5e7eb)",
        }}
      >
        {blocks.map((block, i) => {
          const title = block.settings?.title || "";
          const content = block.settings?.content || "";
          const icon = block.settings?.icon || "none";
          const isOpen = openPanels[i];

          return (
            <div key={i}>
              <button
                onClick={() => togglePanel(i)}
                className="w-full flex items-center justify-between gap-3 px-6 py-4 text-left transition-colors hover:opacity-80"
                style={{ color: "var(--theme-text, #111827)" }}
              >
                <div className="flex items-center gap-3">
                  {icon !== "none" && iconMap[icon] && (
                    <span style={{ color: "var(--theme-primary, #059669)" }}>
                      {iconMap[icon]}
                    </span>
                  )}
                  <span className="text-sm font-semibold">{title}</span>
                </div>
                <span className={`transition-transform text-xs ${isOpen ? "rotate-180" : ""}`}>
                  ▼
                </span>
              </button>
              {isOpen && content && (
                <div className="px-6 pb-4">
                  {content.includes("<") ? (
                    <div
                      className="prose prose-sm max-w-none text-sm leading-relaxed"
                      style={{ color: "var(--theme-text-muted, #6b7280)" }}
                      dangerouslySetInnerHTML={{ __html: content }}
                    />
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--theme-text-muted, #6b7280)" }}>
                      {content}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
