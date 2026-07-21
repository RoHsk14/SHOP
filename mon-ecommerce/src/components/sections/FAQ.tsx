"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import EditableText, { hasTextValue } from "@/components/EditableText";

interface QA {
  settings: { question?: any; answer?: any };
}

interface Props {
  settings: { title?: any; description?: any; text_align?: string; text_size?: string; font_family?: string };
  blocks?: QA[];
}

export default function FAQ({ settings, blocks }: Props) {
  const items = blocks || [];
  const [openKey, setOpenKey] = useState<string | null>("0");

  const textAlign = settings.text_align || "left";
  const fontFamily = settings.font_family === "heading" ? "var(--theme-font-heading)" : "var(--theme-font-body)";

  const titleSize = settings.text_size === "small" ? "text-xl sm:text-2xl" : settings.text_size === "large" ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl";
  const descSize = settings.text_size === "small" ? "text-xs sm:text-sm" : settings.text_size === "large" ? "text-base sm:text-lg" : "text-sm sm:text-base";

  if (items.length === 0) return null;

  return (
    <section className="py-14 sm:py-20">
      <div className="mx-auto px-4 sm:px-6 max-w-3xl">
        {hasTextValue(settings.title) && (
          <EditableText
            as="h2"
            value={settings.title}
            className={`${titleSize} font-bold text-center mb-2`}
            style={{ color: "var(--theme-text)", fontFamily }}
          />
        )}
        {hasTextValue(settings.description) && (
          <EditableText
            as="p"
            value={settings.description}
            className={`${descSize} text-center mb-10`}
            style={{ color: "var(--theme-text-muted)" }}
          />
        )}

        <div className="space-y-3" style={{ textAlign: textAlign as any }}>
          {items.map((item, i) => {
            const key = String((item as any).id ?? i);
            const isOpen = openKey === key;
            return (
              <div
                key={key}
                className="rounded-xl border overflow-hidden"
                style={{
                  background: "var(--theme-surface, #ffffff)",
                  borderColor: "var(--theme-border, #e5e7eb)",
                }}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    if ((e.target as HTMLElement)?.isContentEditable) return;
                    setOpenKey(isOpen ? null : key);
                  }}
                  className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold"
                  style={{ color: "var(--theme-text)" }}
                >
                  <EditableText as="span" value={item.settings.question} />
                  <ChevronDown
                    className="w-4 h-4 shrink-0 transition-transform"
                    style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                  />
                </button>
                {isOpen && (
                  <EditableText
                    as="div"
                    value={item.settings.answer}
                    className="px-5 pb-4 text-sm leading-relaxed"
                    style={{ color: "var(--theme-text-muted)" }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
