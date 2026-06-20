"use client";

interface Stat {
  settings: { value?: string; label?: string; icon?: string };
}

interface Props {
  settings: { background?: string; text_color?: string };
  blocks?: Stat[];
}

export default function StatsBar({ settings, blocks }: Props) {
  const stats = blocks || [];
  if (stats.length === 0) return null;

  return (
    <section style={{ background: settings.background || "var(--theme-primary, #059669)" }}>
      <div className="mx-auto px-4 sm:px-6 py-10 sm:py-14" style={{ maxWidth: "var(--theme-container-width, 1200px)" }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              {stat.settings.icon && <div className="text-2xl sm:text-3xl mb-2">{stat.settings.icon}</div>}
              <p className="text-2xl sm:text-3xl font-bold" style={{ color: settings.text_color || "#ffffff" }}>
                {stat.settings.value}
              </p>
              <p className="text-sm sm:text-base mt-1 opacity-80" style={{ color: settings.text_color || "#ffffff" }}>
                {stat.settings.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
