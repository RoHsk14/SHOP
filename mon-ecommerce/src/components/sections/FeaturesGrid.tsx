"use client";

import { Truck, Shield, HeadphonesIcon, RotateCcw, Clock, Gift } from "lucide-react";
import EditableText, { hasTextValue } from "@/components/EditableText";

const iconMap: Record<string, any> = {
  truck: Truck,
  shield: Shield,
  headphones: HeadphonesIcon,
  "rotate-ccw": RotateCcw,
  clock: Clock,
  gift: Gift,
};

interface Feature {
  settings: { icon?: string; title?: any; description?: any };
}

interface Props {
  settings: { title?: any; description?: any; columns?: number; text_align?: string; text_size?: string; font_family?: string };
  blocks?: Feature[];
}

export default function FeaturesGrid({ settings, blocks }: Props) {
  const features = blocks || [];
  if (features.length === 0) return null;

  const cols = settings.columns || 3;
  const lgColsClass = cols === 4 ? "lg:grid-cols-4" : cols === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3";
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

        <div className={`grid grid-cols-1 sm:grid-cols-2 ${lgColsClass} gap-6 sm:gap-8`} style={{ textAlign: textAlign as any }}>
          {features.map((f, i) => {
            const iconKey = typeof f.settings.icon === "string" ? f.settings.icon.toLowerCase() : "";
            const Icon = iconKey ? iconMap[iconKey] : null;
            return (
              <div key={(f as any).id ?? i} className="text-center sm:text-left">
                {Icon && (
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto sm:mx-0 mb-4"
                    style={{ background: "var(--theme-primary-opacity, #05966915)" }}
                  >
                    <Icon className="w-6 h-6" style={{ color: "var(--theme-primary, #059669)" }} />
                  </div>
                )}
                <EditableText
                  as="h3"
                  value={f.settings.title}
                  className="text-base font-semibold mb-1"
                  style={{ color: "var(--theme-text)" }}
                />
                <EditableText
                  as="p"
                  value={f.settings.description}
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--theme-text-muted)" }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
