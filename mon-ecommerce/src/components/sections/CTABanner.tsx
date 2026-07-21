"use client";

import Link from "next/link";
import EditableText, { hasTextValue } from "@/components/EditableText";

interface Props {
  settings: {
    title?: any;
    description?: any;
    button_text?: any;
    button_url?: string;
    background?: string;
    text_color?: string;
    button_color?: string;
    text_align?: string;
    text_size?: string;
    font_family?: string;
  };
}

export default function CTABanner({ settings }: Props) {
  if (!hasTextValue(settings.title)) return null;

  const textAlign = settings.text_align || "center";
  const fontFamily = settings.font_family === "heading" ? "var(--theme-font-heading)" : "var(--theme-font-body)";

  const titleSize = settings.text_size === "small" ? "text-xl sm:text-2xl lg:text-3xl" : settings.text_size === "large" ? "text-3xl sm:text-4xl lg:text-5xl" : "text-2xl sm:text-3xl lg:text-4xl";
  const descSize = settings.text_size === "small" ? "text-sm sm:text-base" : settings.text_size === "large" ? "text-lg sm:text-xl" : "text-base sm:text-lg";

  return (
    <section
      className="py-16 sm:py-24"
      style={{ background: settings.background || "var(--theme-primary, #059669)" }}
    >
      <div className="mx-auto px-4 sm:px-6" style={{ maxWidth: "var(--theme-container-width, 1200px)", textAlign: textAlign as any }}>
        <EditableText
          as="h2"
          value={settings.title}
          className={`${titleSize} font-bold mb-3`}
          style={{ color: settings.text_color || "#ffffff", fontFamily }}
        />
        {hasTextValue(settings.description) && (
          <EditableText
            as="p"
            value={settings.description}
            className={`${descSize} mb-8 max-w-2xl mx-auto opacity-90`}
            style={{ color: settings.text_color || "#ffffff" }}
          />
        )}
        {hasTextValue(settings.button_text) && (
          <Link
            href={settings.button_url || "#"}
            className="inline-flex items-center px-8 py-3 text-sm font-semibold rounded-xl transition-all hover:opacity-90"
            style={{
              background: settings.button_color || "#ffffff",
              color: settings.background || "var(--theme-primary, #059669)",
            }}
            onClick={(e) => {
              // Allow selecting/editing button text in the canvas
              if ((e.target as HTMLElement)?.isContentEditable) e.preventDefault();
            }}
          >
            <EditableText as="span" value={settings.button_text} />
          </Link>
        )}
      </div>
    </section>
  );
}
