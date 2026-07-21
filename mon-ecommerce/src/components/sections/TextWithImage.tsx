"use client";

import Image from "next/image";
import Link from "next/link";
import EditableText, { hasTextValue, plainText } from "@/components/EditableText";

interface Props {
  settings: {
    image?: string;
    title?: any;
    content?: any;
    button_text?: any;
    button_url?: string;
    image_position?: string;
    text_align?: string;
    text_size?: string;
    font_family?: string;
  };
}

export default function TextWithImage({ settings }: Props) {
  if (!hasTextValue(settings.title) && !settings.image) return null;

  const isLeft = settings.image_position !== "right";
  const textAlign = settings.text_align || "left";
  const fontFamily = settings.font_family === "heading" ? "var(--theme-font-heading)" : "var(--theme-font-body)";

  const titleSize = settings.text_size === "small" ? "text-xl sm:text-2xl" : settings.text_size === "large" ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl";
  const bodySize = settings.text_size === "small" ? "text-xs sm:text-sm" : settings.text_size === "large" ? "text-base sm:text-lg" : "text-sm sm:text-base";
  const alt = plainText(settings.title);

  return (
    <section className="py-10 sm:py-16">
      <div className="mx-auto px-4 sm:px-6" style={{ maxWidth: "var(--theme-container-width, 1200px)" }}>
        <div className="flex flex-col sm:flex-row items-center gap-8 sm:gap-12">
          {isLeft && settings.image && (
            <div className="w-full sm:w-1/2">
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden" style={{ border: "1px solid var(--theme-border)" }}>
                <Image
                  src={settings.image}
                  alt={alt}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            </div>
          )}
          <div className="w-full sm:w-1/2" style={{ textAlign: textAlign as any }}>
            {hasTextValue(settings.title) && (
              <EditableText
                as="h2"
                value={settings.title}
                className={`${titleSize} font-bold mb-4`}
                style={{ color: "var(--theme-text)", fontFamily }}
              />
            )}
            {hasTextValue(settings.content) && (
              <EditableText
                as="p"
                value={settings.content}
                className={`${bodySize} leading-relaxed mb-6`}
                style={{ color: "var(--theme-text-muted)" }}
              />
            )}
            {hasTextValue(settings.button_text) && (
              <Link
                href={settings.button_url || "#"}
                className="inline-block px-6 py-2.5 text-sm font-semibold transition-all hover:opacity-90"
                style={{
                  background: "var(--theme-primary)",
                  color: "#ffffff",
                  borderRadius: "var(--theme-radius-button)",
                }}
                onClick={(e) => {
                  if ((e.target as HTMLElement)?.isContentEditable) e.preventDefault();
                }}
              >
                <EditableText as="span" value={settings.button_text} />
              </Link>
            )}
          </div>
          {!isLeft && settings.image && (
            <div className="w-full sm:w-1/2">
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden" style={{ border: "1px solid var(--theme-border)" }}>
                <Image
                  src={settings.image}
                  alt={alt}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
