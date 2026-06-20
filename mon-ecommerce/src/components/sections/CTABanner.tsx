"use client";

import Link from "next/link";

interface Props {
  settings: {
    title?: string;
    description?: string;
    button_text?: string;
    button_url?: string;
    background?: string;
    text_color?: string;
    button_color?: string;
  };
}

export default function CTABanner({ settings }: Props) {
  if (!settings.title) return null;

  return (
    <section
      className="py-16 sm:py-24"
      style={{ background: settings.background || "var(--theme-primary, #059669)" }}
    >
      <div className="mx-auto px-4 sm:px-6 text-center" style={{ maxWidth: "var(--theme-container-width, 1200px)" }}>
        <h2
          className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3"
          style={{ color: settings.text_color || "#ffffff", fontFamily: "var(--theme-font-heading)" }}
        >
          {settings.title}
        </h2>
        {settings.description && (
          <p className="text-base sm:text-lg mb-8 max-w-2xl mx-auto opacity-90" style={{ color: settings.text_color || "#ffffff" }}>
            {settings.description}
          </p>
        )}
        {settings.button_text && (
          <Link
            href={settings.button_url || "#"}
            className="inline-flex items-center px-8 py-3 text-sm font-semibold rounded-xl transition-all hover:opacity-90"
            style={{
              background: settings.button_color || "#ffffff",
              color: settings.background || "var(--theme-primary, #059669)",
            }}
          >
            {settings.button_text}
          </Link>
        )}
      </div>
    </section>
  );
}
