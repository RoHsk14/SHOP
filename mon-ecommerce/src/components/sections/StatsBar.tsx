"use client";

import EditableText from "@/components/EditableText";

interface Stat {
  settings: { value?: any; label?: any; icon?: string };
}

interface Props {
  settings: { background?: string; text_color?: string; text_align?: string; text_size?: string; font_family?: string };
  blocks?: Stat[];
}

export default function StatsBar({ settings, blocks }: Props) {
  const stats = blocks || [];
  if (stats.length === 0) return null;

  const textAlign = settings.text_align || "left";
  const fontFamily = settings.font_family === "heading" ? "var(--theme-font-heading)" : "var(--theme-font-body)";

  const valueSize = settings.text_size === "small" ? "text-xl sm:text-2xl" : settings.text_size === "large" ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl";
  const labelSize = settings.text_size === "small" ? "text-xs sm:text-sm" : settings.text_size === "large" ? "text-sm sm:text-base" : "text-sm sm:text-base";

  return (
    <section style={{ background: settings.background || "var(--theme-primary, #059669)" }}>
      <div className="mx-auto px-4 sm:px-6 py-10 sm:py-14" style={{ maxWidth: "var(--theme-container-width, 1200px)" }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8" style={{ textAlign: textAlign as any }}>
          {stats.map((stat, i) => (
            <div key={(stat as any).id ?? i} className="text-center" style={{ fontFamily }}>
              {typeof stat.settings.icon === "string" && stat.settings.icon && (
                <div className="text-2xl sm:text-3xl mb-2">{stat.settings.icon}</div>
              )}
              <EditableText
                as="p"
                value={stat.settings.value}
                className={`${valueSize} font-bold`}
                style={{ color: settings.text_color || "#ffffff" }}
              />
              <EditableText
                as="p"
                value={stat.settings.label}
                className={`${labelSize} mt-1 opacity-80`}
                style={{ color: settings.text_color || "#ffffff" }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
