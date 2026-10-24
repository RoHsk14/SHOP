"use client";

import {
  useState,
  useRef,
  useEffect,
  type CSSProperties,
  type ElementType,
  type ReactNode,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { useEditor, useSection, useBlock } from "@/lib/editor-context";

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

export interface EditableTextProps {
  value: EditableTextValue;
  field?: string;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  /** When true, empty values still render an invisible placeholder hit area in editor only — unused on storefront */
  fallback?: ReactNode;
  multiline?: boolean;
}

/** Rich ReactNodes contain block-level elements (<div>). Use a block wrapper to avoid <div> inside <p>. */
function isRichReactNode(v: unknown): boolean {
  if (!v || typeof v !== "object") return false;
  if ("$$typeof" in (v as object)) return true;
  if (typeof (v as any)?.type === "string") return true;
  return false;
}

function resolveTag(as: ElementType, value: EditableTextValue): ElementType {
  if (isRichReactNode(value) && as === "p") return "div";
  return as;
}

function findFieldKeyAndBlockId(
  explicitField: string | undefined,
  value: EditableTextValue,
  sectionSettings: Record<string, any> | undefined,
  sectionBlocks: Array<any> | undefined,
  blockContext: { blockId: string; blockSettings?: Record<string, any> } | null
): { fieldKey: string | null; blockId?: string } {
  if (explicitField) {
    return { fieldKey: explicitField, blockId: blockContext?.blockId };
  }

  const strVal = typeof value === "string" ? value.trim() : typeof value === "number" ? String(value) : "";

  // 1. Check if inside blockContext
  if (blockContext?.blockSettings) {
    for (const [k, v] of Object.entries(blockContext.blockSettings)) {
      if (v != null && (v === value || (strVal && String(v).trim() === strVal))) {
        return { fieldKey: k, blockId: blockContext.blockId };
      }
    }
  }

  // 2. Check section settings
  if (sectionSettings) {
    for (const [k, v] of Object.entries(sectionSettings)) {
      if (v != null && (v === value || (strVal && String(v).trim() === strVal))) {
        return { fieldKey: k };
      }
    }
  }

  // 3. Check section blocks if any block matches value
  if (sectionBlocks && Array.isArray(sectionBlocks)) {
    for (const b of sectionBlocks) {
      if (b.settings) {
        for (const [k, v] of Object.entries(b.settings)) {
          if (v != null && (v === value || (strVal && String(v).trim() === strVal))) {
            return { fieldKey: k, blockId: b.id };
          }
        }
      }
    }
  }

  return { fieldKey: null };
}

export default function EditableText({
  value,
  field,
  as: Tag = "span",
  className = "",
  style,
  fallback = null,
  multiline,
}: EditableTextProps) {
  const editor = useEditor();
  const section = useSection();
  const block = useBlock();

  const [isEditingInline, setIsEditingInline] = useState(false);
  const [isHoveredLocally, setIsHoveredLocally] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);

  const content = normalizeTextValue(value);
  const RenderTag = resolveTag(Tag, value);

  // If NOT in editor mode (live customer storefront): pure static render
  if (!editor || !editor.isEditor) {
    if (content == null) {
      return fallback ? (
        <RenderTag className={className} style={style}>
          {fallback}
        </RenderTag>
      ) : null;
    }

    if (typeof content === "string") {
      return (
        <RenderTag className={className} style={style}>
          {content}
        </RenderTag>
      );
    }

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

  // --- IN THEME CUSTOMIZER STUDIO (EDITOR MODE) ---
  const sectionId = section?.sectionId || "";
  const resolved = findFieldKeyAndBlockId(
    field,
    value,
    section?.settings,
    section?.blocks,
    block
  );
  const fieldKey = resolved.fieldKey;
  const blockId = resolved.blockId;

  // Sync state from editor
  const isFieldHoveredFromSidebar =
    !!fieldKey &&
    editor.hoveredField?.sectionId === sectionId &&
    editor.hoveredField?.fieldKey === fieldKey &&
    (!blockId || editor.hoveredField?.blockId === blockId);

  const isFieldActiveInSidebar =
    !!fieldKey &&
    editor.selectedSectionId === sectionId &&
    editor.activeFieldKey === fieldKey &&
    (!blockId || editor.activeBlockId === blockId);

  const isHighlighted = isFieldHoveredFromSidebar || isFieldActiveInSidebar;

  const handleMouseEnter = () => {
    setIsHoveredLocally(true);
    if (fieldKey) {
      editor.setHoveredField({ sectionId, fieldKey, blockId });
    }
  };

  const handleMouseLeave = () => {
    setIsHoveredLocally(false);
    if (fieldKey && editor.hoveredField?.fieldKey === fieldKey) {
      editor.setHoveredField(null);
    }
  };

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (fieldKey) {
      editor.onFocusField(sectionId, fieldKey, blockId);
    }
    setIsEditingInline(true);
  };

  useEffect(() => {
    if (isEditingInline && elementRef.current) {
      elementRef.current.focus();
      // Position cursor at end of text
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(elementRef.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [isEditingInline]);

  const handleBlur = (e: FormEvent<HTMLElement>) => {
    setIsEditingInline(false);
    if (fieldKey) {
      const text = e.currentTarget.innerText || e.currentTarget.textContent || "";
      editor.onUpdateText(sectionId, fieldKey, text, blockId);
    }
  };

  const handleInput = (e: FormEvent<HTMLElement>) => {
    if (!fieldKey) return;
    const text = e.currentTarget.innerText || e.currentTarget.textContent || "";
    editor.onUpdateText(sectionId, fieldKey, text, blockId);
  };

  const isSingleLine =
    !multiline && ["h1", "h2", "h3", "h4", "h5", "h6", "span", "button"].includes(String(Tag));

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" && isSingleLine) {
      e.preventDefault();
      setIsEditingInline(false);
      elementRef.current?.blur();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsEditingInline(false);
      elementRef.current?.blur();
    }
  };

  const editorStyles: CSSProperties = {
    ...style,
    cursor: isEditingInline ? "text" : "pointer",
  };

  const editorClasses = [
    className,
    "relative transition-all duration-150 inline-block min-w-[20px]",
    isEditingInline
      ? "outline-2 outline-emerald-500 ring-2 ring-emerald-500/40 rounded-sm bg-white/40 text-black shadow-sm"
      : isHighlighted
      ? "ring-2 ring-emerald-500 ring-offset-2 animate-pulse rounded-sm bg-emerald-50/30"
      : isHoveredLocally
      ? "outline-dashed outline-2 outline-emerald-500/80 outline-offset-2 rounded-sm bg-emerald-50/15"
      : "hover:outline-dashed hover:outline-2 hover:outline-emerald-500/70 hover:outline-offset-2 hover:rounded-sm",
  ]
    .filter(Boolean)
    .join(" ");

  const displayContent = content ?? fallback ?? "Texte";

  return (
    <RenderTag
      ref={elementRef as any}
      contentEditable={isEditingInline}
      suppressContentEditableWarning={true}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onBlur={handleBlur}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      className={editorClasses}
      style={editorStyles}
      title="Cliquez pour modifier directement ce texte ou dans la barre latérale"
    >
      {/* Floating modifier badge on hover or active */}
      {(isHoveredLocally || isHighlighted) && !isEditingInline && (
        <span
          className="absolute -top-6 left-0 z-50 inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded shadow-md pointer-events-none whitespace-nowrap animate-in fade-in"
          style={{ transform: "translateY(0)" }}
        >
          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          {isHighlighted ? "Modification en cours" : "Modifier"}
        </span>
      )}

      {/* Render raw html or standard text */}
      {typeof displayContent === "string" ? (
        displayContent
      ) : (
        displayContent
      )}
    </RenderTag>
  );
}
