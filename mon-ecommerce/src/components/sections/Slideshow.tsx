"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import EditableText, { hasTextValue, plainText } from "@/components/EditableText";

interface SlideBlock {
  settings: {
    image?: string;
    image_mobile?: string;
    heading?: string;
    heading_size?: string;
    subheading?: string;
    button_text?: string;
    button_url?: string;
    button_style?: string;
    button_color?: string;
    text_color?: string;
    text_align?: string;
    overlay_color?: string;
    overlay_opacity?: number;
  };
}

interface Props {
  settings: {
    autoplay?: boolean;
    speed?: number;
    full_width?: boolean;
    height?: string;
    text_position?: string;
    text_max_width?: number;
    arrow_style?: string;
    show_dots?: boolean;
  };
  blocks?: SlideBlock[];
}

const headingSizes: Record<string, string> = {
  small: "text-2xl sm:text-3xl",
  medium: "text-3xl sm:text-4xl",
  large: "text-4xl sm:text-5xl lg:text-6xl",
  xlarge: "text-5xl sm:text-6xl lg:text-7xl",
};

export default function Slideshow({ settings, blocks }: Props) {
  const slides = blocks || [];
  const [current, setCurrent] = useState(0);

  const safeCurrent = current < slides.length ? current : 0;

  const next = useCallback(() => {
    setCurrent((i) => (i + 1) % slides.length);
  }, [slides.length]);

  const prev = useCallback(() => {
    setCurrent((i) => (i - 1 + slides.length) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    if (current >= slides.length) {
      setCurrent(Math.max(0, slides.length - 1));
    }
  }, [slides.length, current]);

  useEffect(() => {
    if (!settings.autoplay || slides.length < 2) return;
    const id = setInterval(next, settings.speed || 5000);
    return () => clearInterval(id);
  }, [settings.autoplay, settings.speed, slides.length, next]);

  if (slides.length === 0) return null;

  const slide = slides[safeCurrent];
  const textPosition = settings.text_position || "center";
  const textAlign = slide?.settings?.text_align || "center";
  const headingSize = slide?.settings?.heading_size || "large";
  const buttonStyle = slide?.settings?.button_style || "solid";
  const arrowStyle = settings.arrow_style || "outline";
  const showDots = settings.show_dots !== false;

  const heightClass = settings.height === "fullscreen"
    ? "h-screen"
    : settings.height === "small"
      ? "h-[40vh]"
      : settings.height === "large"
        ? "h-[80vh]"
        : "h-[60vh]";

  const positionClasses: Record<string, string> = {
    center: "items-center justify-center",
    left: "items-center justify-start",
    right: "items-center justify-end",
    "bottom-left": "items-end justify-start pb-12",
    "bottom-right": "items-end justify-end pb-12",
  };

  const contentAlignClass = textAlign === "left" ? "text-left" : textAlign === "right" ? "text-right" : "text-center";

  const btnClasses = buttonStyle === "outline"
    ? "border-2 bg-transparent"
    : buttonStyle === "ghost"
      ? "bg-transparent underline underline-offset-4"
      : "";

  return (
    <div
      className={`relative overflow-hidden group ${settings.full_width ? "w-full" : "mx-auto"}`}
      style={!settings.full_width ? { maxWidth: "var(--theme-container-width, 1200px)" } : undefined}
    >
      <div className={`relative ${heightClass} min-h-[300px]`}>
        {slide?.settings?.image && (
          <>
            <Image
              src={slide?.settings?.image}
              alt={plainText(slide?.settings?.heading)}
              fill
              className="object-cover hidden sm:block"
              unoptimized
            />
            {slide?.settings?.image_mobile && (
              <Image
                src={slide?.settings?.image_mobile}
                alt={plainText(slide?.settings?.heading)}
                fill
                className="object-cover sm:hidden"
                unoptimized
              />
            )}
          </>
        )}

        {/* Overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: slide?.settings?.overlay_color || "#000000",
            opacity: slide?.settings?.overlay_opacity ?? 0.3,
          }}
        />

        {/* Text content */}
        <div className={`absolute inset-0 flex p-6 sm:p-12 lg:p-16 ${positionClasses[textPosition] || "items-center justify-center"}`}>
          <div
            className={`${contentAlignClass}`}
            style={{ maxWidth: settings.text_max_width || 600, width: "100%" }}
          >
            {hasTextValue(slide?.settings?.heading) && (
              <EditableText
                as="h2"
                value={slide?.settings?.heading}
                className={`${headingSizes[headingSize] || headingSizes.large} font-bold mb-4 leading-tight`}
                style={{
                  color: slide?.settings?.text_color || "#ffffff",
                  fontFamily: "var(--theme-font-heading)",
                }}
              />
            )}
            {hasTextValue(slide?.settings?.subheading) && (
              <EditableText
                as="p"
                value={slide?.settings?.subheading}
                className="text-base sm:text-lg mb-6 opacity-90 max-w-xl mx-auto"
                style={{
                  color: slide?.settings?.text_color || "#ffffff",
                  marginLeft: textAlign === "left" ? "0" : textAlign === "right" ? "0" : "auto",
                  marginRight: textAlign === "right" ? "0" : textAlign === "left" ? "0" : "auto",
                }}
              />
            )}
            {hasTextValue(slide?.settings?.button_text) && (
              <Link
                href={slide?.settings?.button_url || "#"}
                className={`inline-block px-8 py-3 text-sm font-semibold transition-all hover:opacity-90 ${btnClasses}`}
                style={
                  buttonStyle === "outline"
                    ? {
                        borderColor: slide?.settings?.button_color || "#ffffff",
                        color: slide?.settings?.button_color || "#ffffff",
                        borderRadius: "var(--theme-radius-button)",
                      }
                    : buttonStyle === "ghost"
                      ? { color: slide?.settings?.button_color || "#ffffff" }
                      : {
                          background: slide?.settings?.button_color || "var(--theme-primary)",
                          color: "#ffffff",
                          borderRadius: "var(--theme-radius-button)",
                        }
                }
                onClick={(e) => {
                  if ((e.target as HTMLElement)?.isContentEditable) e.preventDefault();
                }}
              >
                <EditableText as="span" value={slide?.settings?.button_text} />
              </Link>
            )}
          </div>
        </div>

        {/* Arrow buttons */}
        {slides.length > 1 && arrowStyle !== "none" && (
          <>
            <button
              onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
              style={
                arrowStyle === "filled"
                  ? { background: "rgba(255,255,255,0.9)", color: "#111827" }
                  : { border: "2px solid rgba(255,255,255,0.8)", color: "#ffffff" }
              }
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full transition-all opacity-0 group-hover:opacity-100"
              style={
                arrowStyle === "filled"
                  ? { background: "rgba(255,255,255,0.9)", color: "#111827" }
                  : { border: "2px solid rgba(255,255,255,0.8)", color: "#ffffff" }
              }
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Dots indicator */}
      {slides.length > 1 && showDots && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="rounded-full transition-all"
              style={{
                width: i === current ? 20 : 8,
                height: 8,
                background: i === current ? "#ffffff" : "rgba(255,255,255,0.5)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
