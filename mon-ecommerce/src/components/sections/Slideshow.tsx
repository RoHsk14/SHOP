"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

interface SlideBlock {
  settings: {
    image?: string;
    heading?: string;
    subheading?: string;
    button_text?: string;
    button_url?: string;
    text_color?: string;
    overlay_opacity?: number;
  };
}

interface Props {
  settings: {
    autoplay?: boolean;
    speed?: number;
    full_width?: boolean;
    height?: string;
  };
  blocks?: SlideBlock[];
}

const heightMap: Record<string, string> = {
  small: "h-[40vh]",
  medium: "h-[60vh]",
  large: "h-[80vh]",
};

export default function Slideshow({ settings, blocks }: Props) {
  const slides = blocks || [];
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((i) => (i + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (!settings.autoplay || slides.length < 2) return;
    const id = setInterval(next, settings.speed || 5000);
    return () => clearInterval(id);
  }, [settings.autoplay, settings.speed, slides.length, next]);

  if (slides.length === 0) return null;

  const slide = slides[current];
  const heightClass = heightMap[settings.height || "medium"] || "h-[60vh]";

  return (
    <div className={`relative overflow-hidden ${settings.full_width ? "w-full" : "mx-auto"}`} style={!settings.full_width ? { maxWidth: "var(--theme-container-width, 1200px)" } : undefined}>
      <div className={`relative ${heightClass} min-h-[300px]`}>
        {slide.settings.image && (
          <Image
            src={slide.settings.image}
            alt={slide.settings.heading || ""}
            fill
            className="object-cover"
            unoptimized
          />
        )}
        <div
          className="absolute inset-0"
          style={{ background: `rgba(0,0,0,${slide.settings.overlay_opacity ?? 0.3})` }}
        />
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="text-center max-w-2xl">
            {slide.settings.heading && (
              <h2
                className="text-3xl sm:text-5xl font-bold mb-3"
                style={{
                  color: slide.settings.text_color || "#ffffff",
                  fontFamily: "var(--theme-font-heading)",
                }}
              >
                {slide.settings.heading}
              </h2>
            )}
            {slide.settings.subheading && (
              <p
                className="text-base sm:text-lg mb-6 opacity-90"
                style={{ color: slide.settings.text_color || "#ffffff" }}
              >
                {slide.settings.subheading}
              </p>
            )}
            {slide.settings.button_text && (
              <Link
                href={slide.settings.button_url || "#"}
                className="inline-block px-8 py-3 text-sm font-semibold transition-all hover:opacity-90"
                style={{
                  background: "var(--theme-primary)",
                  color: "#ffffff",
                  borderRadius: "var(--theme-radius-button)",
                }}
              >
                {slide.settings.button_text}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Dots indicator */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="w-2.5 h-2.5 rounded-full transition-all"
              style={{
                background: i === current ? "#ffffff" : "rgba(255,255,255,0.5)",
                transform: i === current ? "scale(1.2)" : "scale(1)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
