"use client";

import type { ReactNode } from "react";

interface SectionWrapperProps {
  settings?: Record<string, any>;
  children: ReactNode;
  className?: string;
}

function parseSpacing(val: any): string | undefined {
  if (val === undefined || val === null || val === "") return undefined;
  const n = Number(val);
  if (isNaN(n)) return String(val);
  return `${n}px`;
}

export default function SectionWrapper({ settings, children, className }: SectionWrapperProps) {
  if (!settings) return <>{children}</>;

  const paddingTop = parseSpacing(settings.padding_top);
  const paddingBottom = parseSpacing(settings.padding_bottom);
  const paddingLeft = parseSpacing(settings.padding_left);
  const paddingRight = parseSpacing(settings.padding_right);
  const marginTop = parseSpacing(settings.margin_top);
  const marginBottom = parseSpacing(settings.margin_bottom);
  const bgColor = settings.section_bg || "";
  const bgImage = settings.section_bg_image || "";
  const borderColor = settings.section_border_color || "";
  const borderWidth = parseSpacing(settings.section_border_width);
  const borderRadius = parseSpacing(settings.section_border_radius);
  const textColor = settings.text_color || "";
  const headingColor = settings.heading_color || "";
  const maxWidth = settings.section_max_width ? `${settings.section_max_width}px` : undefined;

  const style: React.CSSProperties = {};
  if (paddingTop) style.paddingTop = paddingTop;
  if (paddingBottom) style.paddingBottom = paddingBottom;
  if (paddingLeft) style.paddingLeft = paddingLeft;
  if (paddingRight) style.paddingRight = paddingRight;
  if (marginTop) style.marginTop = marginTop;
  if (marginBottom) style.marginBottom = marginBottom;
  if (bgColor) style.background = bgColor;
  if (bgImage) {
    style.backgroundImage = `url(${bgImage})`;
    style.backgroundSize = settings.section_bg_size || "cover";
    style.backgroundPosition = settings.section_bg_position || "center";
    style.backgroundRepeat = settings.section_bg_repeat || "no-repeat";
  }
  if (borderColor && borderWidth) style.border = `${borderWidth} solid ${borderColor}`;
  if (borderRadius) style.borderRadius = borderRadius;
  if (maxWidth) style.maxWidth = maxWidth;

  const dataAttrs: Record<string, string> = {};
  if (textColor) dataAttrs["data-section-text-color"] = textColor;
  if (headingColor) dataAttrs["data-section-heading-color"] = headingColor;
  if (settings.heading_size && settings.heading_size !== "inherit") {
    dataAttrs["data-section-heading-size"] = settings.heading_size;
  }

  return (
    <div style={Object.keys(style).length > 0 ? style : undefined} className={className} {...dataAttrs as any}>
      {children}
    </div>
  );
}
