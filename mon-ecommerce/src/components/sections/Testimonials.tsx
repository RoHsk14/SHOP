"use client";

import { Star } from "lucide-react";
import EditableText, { hasTextValue } from "@/components/EditableText";

interface Testimonial {
  settings: {
    quote?: any;
    author?: any;
    role?: any;
    avatar?: string;
    rating?: number;
  };
}

interface Props {
  settings: { title?: any; description?: any; text_align?: string; text_size?: string; font_family?: string };
  blocks?: Testimonial[];
}

export default function Testimonials({ settings, blocks }: Props) {
  const items = blocks || [];
  if (items.length === 0) return null;

  const textAlign = settings.text_align || "left";
  const fontFamily = settings.font_family === "heading" ? "var(--theme-font-heading)" : "var(--theme-font-body)";

  const titleSize = settings.text_size === "small" ? "text-xl sm:text-2xl" : settings.text_size === "large" ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl";
  const descSize = settings.text_size === "small" ? "text-xs sm:text-sm" : settings.text_size === "large" ? "text-base sm:text-lg" : "text-sm sm:text-base";

  return (
    <section className="py-14 sm:py-20">
      <div className="mx-auto px-4 sm:px-6" style={{ maxWidth: "var(--theme-container-width, 1200px)" }}>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" style={{ textAlign: textAlign as any }}>
          {items.map((item, i) => (
            <div
              key={(item as any).id ?? i}
              className="p-6 rounded-2xl border"
              style={{
                background: "var(--theme-surface, #ffffff)",
                borderColor: "var(--theme-border, #e5e7eb)",
              }}
            >
              {item.settings.rating && (
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star
                      key={j}
                      className="w-4 h-4"
                      style={{ fill: j < (item.settings.rating || 0) ? "#f59e0b" : "none", color: "#f59e0b", stroke: j < (item.settings.rating || 0) ? "#f59e0b" : "#d1d5db" }}
                    />
                  ))}
                </div>
              )}

              <div className="text-sm leading-relaxed mb-4" style={{ color: "var(--theme-text, #111827)" }}>
                &ldquo;<EditableText as="span" value={item.settings.quote} />&rdquo;
              </div>

              <div className="flex items-center gap-3">
                {item.settings.avatar && (
                  <img src={item.settings.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                )}
                <div>
                  <EditableText
                    as="p"
                    value={item.settings.author}
                    className="text-sm font-semibold"
                    style={{ color: "var(--theme-text, #111827)" }}
                  />
                  {hasTextValue(item.settings.role) && (
                    <EditableText
                      as="p"
                      value={item.settings.role}
                      className="text-xs"
                      style={{ color: "var(--theme-text-muted)" }}
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
