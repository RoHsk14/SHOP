"use client";

import Image from "next/image";
import Link from "next/link";
import EditableText, { hasTextValue } from "@/components/EditableText";
import { useShop } from "@/lib/shop-context";
import { useEditor } from "@/lib/editor-context";

interface Props {
  settings: {
    image?: string;
    image_mobile?: string;
    title?: any;
    subheading?: any;
    button_text?: any;
    button_url?: string;
    secondary_button_text?: any;
    secondary_button_url?: string;
    height?: "small" | "medium" | "large" | "full";
    text_position?: "center" | "bottom-left" | "bottom-center" | "center-left";
    text_align?: "left" | "center" | "right";
    text_max_width?: number;
    background?: string;
    text_color?: string;
    overlay_color?: string;
    overlay_opacity?: number;
    button_style?: "solid" | "white" | "outline";
    button_color?: string;
    show_text_box?: boolean;
    full_width?: boolean;
  };
}

export default function ImageBanner({ settings }: Props) {
  const { shopLink, isMobile } = useShop();
  const { isEditor } = useEditor();

  const title = settings.title ?? "Bienvenue sur notre boutique";
  const subheading = settings.subheading ?? "Découvrez notre sélection exclusive de produits de qualité";
  const hasButton = hasTextValue(settings.button_text);
  const hasSecondaryButton = hasTextValue(settings.secondary_button_text);

  const height = settings.height || "large";
  const heightClass = isMobile
    ? height === "full"
      ? "min-h-[75vh]"
      : height === "small"
      ? "min-h-[260px]"
      : height === "medium"
      ? "min-h-[340px]"
      : "min-h-[420px]"
    : height === "full"
    ? "min-h-[85vh] sm:min-h-screen"
    : height === "small"
    ? "min-h-[280px] sm:min-h-[420px]"
    : height === "medium"
    ? "min-h-[350px] sm:min-h-[520px]"
    : "min-h-[440px] sm:min-h-[640px]";

  const textPosition = settings.text_position || "center";
  const positionClasses: Record<string, string> = {
    center: "items-center justify-center",
    "center-left": "items-center justify-start",
    "bottom-left": "items-end justify-start pb-8 sm:pb-16",
    "bottom-center": "items-end justify-center pb-8 sm:pb-16",
  };

  const textAlign = settings.text_align || "center";
  const alignClass =
    textAlign === "left" ? "text-left items-start" : textAlign === "right" ? "text-right items-end" : "text-center items-center";

  const textColor = settings.text_color || "#ffffff";
  const overlayColor = settings.overlay_color || "#000000";
  const overlayOpacity = typeof settings.overlay_opacity === "number" ? settings.overlay_opacity : 0.35;

  const buttonStyle = settings.button_style || "solid";
  const primaryBtnClass =
    buttonStyle === "white"
      ? "bg-white text-gray-900 hover:bg-gray-100 shadow-md"
      : buttonStyle === "outline"
      ? "border-2 border-white text-white hover:bg-white hover:text-gray-900 backdrop-blur-xs"
      : "text-white shadow-lg shadow-black/25";

  const activeImage = isMobile && settings.image_mobile ? settings.image_mobile : settings.image;

  return (
    <section
      className={`relative overflow-hidden w-full ${heightClass} flex flex-col justify-center`}
      style={{
        background: settings.background || "#111827",
      }}
    >
      {/* Background Image (Desktop & Mobile) */}
      {activeImage && (
        <div className="absolute inset-0 z-0">
          <Image
            src={activeImage}
            alt={typeof title === "string" ? title : "Bannière boutique"}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
            unoptimized={activeImage.startsWith("data:") || !activeImage.startsWith("/")}
          />
        </div>
      )}

      {/* Dark / Tint Overlay for high contrast & readability */}
      <div
        className="absolute inset-0 z-1 pointer-events-none transition-opacity"
        style={{
          backgroundColor: overlayColor,
          opacity: overlayOpacity,
        }}
      />
      {/* Subtle vignette gradient so text is always 100% legible */}
      <div className="absolute inset-0 z-2 pointer-events-none bg-gradient-to-t from-black/60 via-black/25 to-black/35" />

      {/* Content Container */}
      <div
        className={`relative z-10 w-full h-full flex ${positionClasses[textPosition] || positionClasses.center} px-4 sm:px-8 lg:px-12 py-8 sm:py-12`}
      >
        <div
          className={`flex flex-col ${alignClass} ${
            settings.show_text_box
              ? "bg-black/55 backdrop-blur-md p-5 sm:p-9 rounded-2xl sm:rounded-3xl border border-white/15 shadow-2xl"
              : ""
          }`}
          style={{
            maxWidth: settings.text_max_width || 760,
            width: "100%",
          }}
        >
          {/* Main Title */}
          {hasTextValue(title) && (
            <EditableText
              as="h1"
              field="title"
              value={title}
              className={`${
                isMobile ? "text-2xl" : "text-2xl sm:text-4xl lg:text-5xl"
              } font-extrabold tracking-tight mb-2.5 sm:mb-4 leading-tight sm:leading-[1.18]`}
              style={{
                color: textColor,
                fontFamily: "var(--theme-font-heading, inherit)",
                textShadow: settings.show_text_box ? "none" : "0 2px 10px rgba(0,0,0,0.6)",
              }}
            />
          )}

          {/* Subheading / Description */}
          {hasTextValue(subheading) && (
            <EditableText
              as="p"
              field="subheading"
              value={subheading}
              multiline
              className={`${
                isMobile ? "text-xs sm:text-sm" : "text-sm sm:text-base lg:text-lg"
              } font-normal sm:font-medium mb-5 sm:mb-7 max-w-sm sm:max-w-xl leading-relaxed opacity-90`}
              style={{
                color: textColor,
                fontFamily: "var(--theme-font-body, inherit)",
                textShadow: settings.show_text_box ? "none" : "0 1px 6px rgba(0,0,0,0.5)",
              }}
            />
          )}

          {/* Call-to-action buttons (Permet à l'utilisateur d'aller plus loin ou pas) */}
          {(hasButton || hasSecondaryButton) && (
            <div
              className={`flex flex-wrap gap-2.5 sm:gap-4 ${
                textAlign === "left"
                  ? "justify-start"
                  : textAlign === "right"
                  ? "justify-end"
                  : "justify-center"
              }`}
            >
              {/* Primary Button */}
              {hasButton && (
                <Link
                  href={shopLink(settings.button_url || "/products")}
                  className={`inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm font-bold tracking-wide transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${primaryBtnClass}`}
                  style={
                    buttonStyle === "solid"
                      ? {
                          backgroundColor: settings.button_color || "var(--theme-primary, #059669)",
                          color: "var(--theme-button-text, #ffffff)",
                          borderRadius: "var(--theme-radius-button, 12px)",
                        }
                      : {
                          borderRadius: "var(--theme-radius-button, 12px)",
                        }
                  }
                  onClick={(e) => {
                    if (isEditor || (e.target as HTMLElement)?.isContentEditable) {
                      e.preventDefault();
                    }
                  }}
                >
                  <EditableText as="span" field="button_text" value={settings.button_text} />
                </Link>
              )}

              {/* Secondary Optional Button */}
              {hasSecondaryButton && (
                <Link
                  href={shopLink(settings.secondary_button_url || "/")}
                  className="inline-flex items-center justify-center px-5 sm:px-7 py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm font-bold border-2 border-white/80 text-white hover:bg-white hover:text-gray-900 transition-all duration-200 backdrop-blur-xs"
                  style={{
                    borderRadius: "var(--theme-radius-button, 12px)",
                  }}
                  onClick={(e) => {
                    if (isEditor || (e.target as HTMLElement)?.isContentEditable) {
                      e.preventDefault();
                    }
                  }}
                >
                  <EditableText
                    as="span"
                    field="secondary_button_text"
                    value={settings.secondary_button_text}
                  />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
