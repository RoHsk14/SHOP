"use client";

import Image from "next/image";
import Link from "next/link";

interface Props {
  settings: {
    image?: string;
    title?: string;
    content?: string;
    button_text?: string;
    button_url?: string;
    image_position?: string;
  };
}

export default function TextWithImage({ settings }: Props) {
  if (!settings.title && !settings.image) return null;

  const isLeft = settings.image_position !== "right";

  return (
    <section className="py-10 sm:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center gap-8 sm:gap-12">
          {isLeft && settings.image && (
            <div className="w-full sm:w-1/2">
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden" style={{ border: "1px solid var(--theme-border)" }}>
                <Image
                  src={settings.image}
                  alt={settings.title || ""}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            </div>
          )}
          <div className="w-full sm:w-1/2">
            {settings.title && (
              <h2
                className="text-2xl sm:text-3xl font-bold mb-4"
                style={{
                  color: "var(--theme-text)",
                  fontFamily: "var(--theme-font-heading)",
                }}
              >
                {settings.title}
              </h2>
            )}
            {settings.content && (
              <p className="text-sm sm:text-base leading-relaxed mb-6" style={{ color: "var(--theme-text-muted)" }}>
                {settings.content}
              </p>
            )}
            {settings.button_text && (
              <Link
                href={settings.button_url || "#"}
                className="inline-block px-6 py-2.5 text-sm font-semibold transition-all hover:opacity-90"
                style={{
                  background: "var(--theme-primary)",
                  color: "#ffffff",
                  borderRadius: "var(--theme-radius-button)",
                }}
              >
                {settings.button_text}
              </Link>
            )}
          </div>
          {!isLeft && settings.image && (
            <div className="w-full sm:w-1/2">
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden" style={{ border: "1px solid var(--theme-border)" }}>
                <Image
                  src={settings.image}
                  alt={settings.title || ""}
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
