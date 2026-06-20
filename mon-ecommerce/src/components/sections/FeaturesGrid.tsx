"use client";

import { Truck, Shield, HeadphonesIcon, RotateCcw, Clock, Gift } from "lucide-react";

const iconMap: Record<string, any> = {
  truck: Truck,
  shield: Shield,
  headphones: HeadphonesIcon,
  "rotate-ccw": RotateCcw,
  clock: Clock,
  gift: Gift,
};

interface Feature {
  settings: { icon?: string; title?: string; description?: string };
}

interface Props {
  settings: { title?: string; description?: string; columns?: number };
  blocks?: Feature[];
}

export default function FeaturesGrid({ settings, blocks }: Props) {
  const features = blocks || [];
  if (features.length === 0) return null;

  const cols = settings.columns || 3;

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

        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${cols} gap-6 sm:gap-8`}>
          {features.map((f, i) => {
            const Icon = f.settings.icon ? iconMap[f.settings.icon.toLowerCase()] : null;
            return (
              <div key={i} className="text-center sm:text-left">
                {Icon && (
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto sm:mx-0 mb-4"
                    style={{ background: "var(--theme-primary-opacity, #05966915)" }}
                  >
                    <Icon className="w-6 h-6" style={{ color: "var(--theme-primary, #059669)" }} />
                  </div>
                )}
                <h3 className="text-base font-semibold mb-1" style={{ color: "var(--theme-text)" }}>
                  {f.settings.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--theme-text-muted)" }}>
                  {f.settings.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
