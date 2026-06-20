"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface QA {
  settings: { question?: string; answer?: string };
}

interface Props {
  settings: { title?: string; description?: string };
  blocks?: QA[];
}

export default function FAQ({ settings, blocks }: Props) {
  const items = blocks || [];
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (items.length === 0) return null;

  return (
    <section className="py-14 sm:py-20">
      <div className="mx-auto px-4 sm:px-6 max-w-3xl">
        {settings.title && (
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2" style={{ color: "var(--theme-text)", fontFamily: "var(--theme-font-heading)" }}>
            {settings.title}
          </h2>
        )}
        {settings.description && (
          <p className="text-center text-sm mb-10" style={{ color: "var(--theme-text-muted)" }}>
            {settings.description}
          </p>
        )}

        <div className="space-y-3">
          {items.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className="rounded-xl border overflow-hidden"
                style={{
                  background: "var(--theme-surface, #ffffff)",
                  borderColor: "var(--theme-border, #e5e7eb)",
                }}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold"
                  style={{ color: "var(--theme-text)" }}
                >
                  {item.settings.question}
                  <ChevronDown
                    className="w-4 h-4 shrink-0 transition-transform"
                    style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                  />
                </button>
                {isOpen && (
                  <div
                    className="px-5 pb-4 text-sm leading-relaxed"
                    style={{ color: "var(--theme-text-muted)" }}
                  >
                    {item.settings.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
