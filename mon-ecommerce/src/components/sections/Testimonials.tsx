"use client";

import { Star } from "lucide-react";

interface Testimonial {
  settings: {
    quote?: string;
    author?: string;
    role?: string;
    avatar?: string;
    rating?: number;
  };
}

interface Props {
  settings: { title?: string; description?: string };
  blocks?: Testimonial[];
}

export default function Testimonials({ settings, blocks }: Props) {
  const items = blocks || [];
  if (items.length === 0) return null;

  return (
    <section className="py-14 sm:py-20">
      <div className="mx-auto px-4 sm:px-6" style={{ maxWidth: "var(--theme-container-width, 1200px)" }}>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl border"
              style={{
                background: "var(--theme-surface, #ffffff)",
                borderColor: "var(--theme-border, #e5e7eb)",
              }}
            >
              {/* Stars */}
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

              <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--theme-text, #111827)" }}>
                &ldquo;{item.settings.quote}&rdquo;
              </p>

              <div className="flex items-center gap-3">
                {item.settings.avatar && (
                  <img src={item.settings.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                )}
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--theme-text, #111827)" }}>
                    {item.settings.author}
                  </p>
                  {item.settings.role && (
                    <p className="text-xs" style={{ color: "var(--theme-text-muted)" }}>
                      {item.settings.role}
                    </p>
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
