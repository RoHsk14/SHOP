"use client";

import type { CSSProperties, ElementType, ReactNode } from "react";

export type EditableTextValue = string | number | ReactNode | null | undefined;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v) && !("$$typeof" in (v as object));
}

/** Normalize Puck contentEditable / richtext values for safe rendering. */
export function normalizeTextValue(value: EditableTextValue): ReactNode {
  if (value == null || value === false) return null;
  if (typeof value === "number") return String(value);
  if (typeof value !== "string") {
    // React element / Puck inline editor node
    if (isPlainObject(value) && "props" in value) return value as ReactNode;
    return value as ReactNode;
  }
  const str = value.trim();
  if (!str) return null;
  if (/<[a-z][\s\S]*>/i.test(str)) {
    return <span dangerouslySetInnerHTML={{ __html: str }} />;
  }
  return str;
}

export function hasTextValue(value: EditableTextValue): boolean {
  if (value == null || value === false || value === "") return false;
  if (typeof value === "string") {
    const plain = value.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
    return plain.length > 0 || /<(img|br|hr)\b/i.test(value);
  }
  if (typeof value === "number") return true;
  return true;
}

/** Strip HTML / React nodes for attributes like alt, title */
export function plainText(value: EditableTextValue): string {
  if (value == null || value === false) return "";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value.replace(/<[^>]*>/g, "").trim();
  return "";
}

interface EditableTextProps {
  value: EditableTextValue;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  /** When true, empty values still render an invisible placeholder hit area in editor only — unused on storefront */
  fallback?: ReactNode;
}

/**
 * Renders section text that may be:
 * - plain string (storefront / saved data)
 * - HTML string (richtext)
 * - ReactNode (Puck contentEditable inline editor)
 */
/** Detect if value is a rich ReactNode (from Puck contentEditable). */
function isRichReactNode(v: unknown): boolean {
  if (!v || typeof v !== "object") return false;
  if ("$$typeof" in (v as object)) return true;
  if (typeof (v as any)?.type === "string") return true;
  return false;
}

/** Rich ReactNodes contain block-level elements (<div>). Use a block wrapper to avoid <div> inside <p>. */
function resolveTag(as: ElementType, value: EditableTextValue): ElementType {
  if (isRichReactNode(value) && as === "p") return "div";
  return as;
}

export default function EditableText({
  value,
  as: Tag = "span",
  className,
  style,
  fallback = null,
}: EditableTextProps) {
  const content = normalizeTextValue(value);
  const RenderTag = resolveTag(Tag, value);

  if (content == null) return fallback ? <RenderTag className={className} style={style}>{fallback}</RenderTag> : null;

  if (typeof content === "string") {
    return <RenderTag className={className} style={style}>{content}</RenderTag>;
  }

  // HTML already wrapped in span from normalize
  if (
    typeof content === "object" &&
    content !== null &&
    "type" in (content as any) &&
    (content as any).type === "span" &&
    (content as any).props?.dangerouslySetInnerHTML
  ) {
    return (
      <RenderTag
        className={className}
        style={style}
        dangerouslySetInnerHTML={(content as any).props.dangerouslySetInnerHTML}
      />
    );
  }

  return (
    <RenderTag className={className} style={style}>
      {content}
    </RenderTag>
  );
}
