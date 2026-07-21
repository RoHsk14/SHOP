import type { Field } from "@puckeditor/core";
import { RichTextMenu } from "@puckeditor/core";
import { Trash2, Eye, EyeOff, Copy, Eraser } from "lucide-react";
import { sectionRegistry, getSectionDefinition } from "./sections";
import { sectionComponents } from "@/components/sections";
import { usePreview } from "./preview-context";
import SectionWrapper from "@/components/SectionWrapper";

/** Fields that must stay plain (URLs, IDs) — no inline edit */
const NON_EDITABLE_TEXT_KEYS = new Set([
  "button_url",
  "url",
  "href",
  "link",
  "logo_url",
  "image",
  "video_url",
  "video_id",
  "collection_slug",
  "product_id",
  "product_slug",
  "sheet_url",
  "google_sheet_url",
  "placeholder",
  "sku",
  "id",
]);

/** Content-like keys → richtext + floating toolbar (size, style, align…) */
const RICH_TEXT_KEYS = new Set([
  "title",
  "heading",
  "subheading",
  "subtitle",
  "text",
  "content",
  "description",
  "question",
  "answer",
  "quote",
  "message",
  "caption",
  "button_text",
  "label",
  "name",
  "author",
  "role",
  "value",
  "prefix",
  "suffix",
  "cta_text",
  "badge",
  "announcement",
]);

function InlineRichTextMenu({
  children,
  editor,
  editorState,
}: {
  children: React.ReactNode;
  editor: any;
  editorState: any;
}) {
  return (
    <RichTextMenu>
      <RichTextMenu.Group>
        <RichTextMenu.HeadingSelect />
      </RichTextMenu.Group>
      <RichTextMenu.Group>
        <RichTextMenu.Bold />
        <RichTextMenu.Italic />
        <RichTextMenu.Underline />
        <RichTextMenu.Strikethrough />
      </RichTextMenu.Group>
      <RichTextMenu.Group>
        <RichTextMenu.AlignLeft />
        <RichTextMenu.AlignCenter />
        <RichTextMenu.AlignRight />
      </RichTextMenu.Group>
      <RichTextMenu.Group>
        <RichTextMenu.Control
          icon={<Eraser className="w-3.5 h-3.5" />}
          onClick={() => {
            editor?.chain().focus().clearContent().run();
          }}
          disabled={!editor}
          title="Effacer le texte"
        />
      </RichTextMenu.Group>
      {children}
    </RichTextMenu>
  );
}

function ColorField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <input
        type="color"
        value={value || "#000000"}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: 36,
          height: 36,
          padding: 2,
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          cursor: "pointer",
          background: "white",
          flexShrink: 0,
        }}
      />
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#hex"
        style={{
          flex: 1,
          fontSize: 13,
          padding: "6px 10px",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          fontFamily: "monospace",
          outline: "none",
        }}
      />
    </div>
  );
}

function ImageField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const pickFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) { alert("L'image ne doit pas dépasser 2 Mo"); return; }
      const reader = new FileReader();
      reader.onload = () => onChange(reader.result as string);
      reader.readAsDataURL(file);
    };
    input.click();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {value && (
        <div style={{
          position: "relative",
          width: "100%",
          height: 100,
          borderRadius: 8,
          overflow: "hidden",
          border: "1px solid #e5e7eb",
          background: "#f9fafb",
        }}>
          <img
            src={value}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <button
            onClick={() => onChange("")}
            style={{
              position: "absolute",
              top: 4,
              right: 4,
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.5)",
              color: "white",
              border: "none",
              fontSize: 12,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>
      )}
      <div style={{ display: "flex", gap: 6 }}>
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="URL de l'image..."
          style={{
            flex: 1,
            fontSize: 13,
            padding: "6px 10px",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            outline: "none",
          }}
        />
        <button
          onClick={pickFile}
          style={{
            padding: "6px 12px",
            fontSize: 12,
            fontWeight: 500,
            background: "#f3f4f6",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            cursor: "pointer",
            whiteSpace: "nowrap",
            color: "#374151",
          }}
        >
          Importer
        </button>
      </div>
    </div>
  );
}

function isRichTextKey(key: string) {
  if (RICH_TEXT_KEYS.has(key)) return true;
  // e.g. slide_heading, feature_title, panel_content
  return /(title|heading|subheading|subtitle|text|content|description|question|answer|quote|label|message|caption)$/i.test(
    key
  );
}

function mapSettingToField(setting: {
  key: string;
  label: string;
  type: string;
  default: any;
  options?: { label: string; value: string }[];
  placeholder?: string;
}): Field {
  const base = { label: setting.label };

  switch (setting.type) {
    case "text": {
      if (NON_EDITABLE_TEXT_KEYS.has(setting.key)) {
        return { ...base, type: "text", placeholder: setting.placeholder || setting.label };
      }
      if (isRichTextKey(setting.key)) {
        return {
          ...base,
          type: "richtext",
          contentEditable: true,
          options: {
            heading: { levels: [1, 2, 3, 4] },
            bulletList: false,
            orderedList: false,
            listItem: false,
            codeBlock: false,
            blockquote: false,
            horizontalRule: false,
            code: false,
          },
          renderInlineMenu: (props: any) => <InlineRichTextMenu {...props} />,
        } as Field;
      }
      return {
        ...base,
        type: "text",
        contentEditable: true,
        placeholder: setting.placeholder || setting.label,
      };
    }
    case "textarea":
      return {
        ...base,
        type: "richtext",
        contentEditable: true,
        options: {
          heading: { levels: [1, 2, 3, 4] },
          codeBlock: false,
          horizontalRule: false,
        },
        renderInlineMenu: (props: any) => <InlineRichTextMenu {...props} />,
      } as Field;
    case "color":
      return {
        ...base,
        type: "custom",
        render: ({ value, onChange }: any) => (
          <ColorField value={value} onChange={onChange} />
        ),
      } as any;
    case "number":
      return { ...base, type: "number" };
    case "boolean":
      return {
        ...base,
        type: "radio",
        options: [
          { label: "Oui", value: true },
          { label: "Non", value: false },
        ],
      };
    case "select":
      return {
        ...base,
        type: "select",
        options: (setting.options || []).map((o) => ({
          label: o.label,
          value: o.value,
        })),
      };
    case "image":
      return {
        ...base,
        type: "custom",
        render: ({ value, onChange }: any) => (
          <ImageField value={value} onChange={onChange} />
        ),
      } as any;
    case "url":
      return { ...base, type: "text", placeholder: "https://..." };
    default:
      if (!NON_EDITABLE_TEXT_KEYS.has(setting.key) && isRichTextKey(setting.key)) {
        return {
          ...base,
          type: "richtext",
          contentEditable: true,
          renderInlineMenu: (props: any) => <InlineRichTextMenu {...props} />,
        } as Field;
      }
      return {
        ...base,
        type: "text",
        contentEditable: !NON_EDITABLE_TEXT_KEYS.has(setting.key),
        placeholder: setting.placeholder || setting.label,
      };
  }
}

function mapBlocksToArrayField(blockDef: NonNullable<import("./sections").SectionDefinition["blocks"]>[number]) {
  const arrayFields: Record<string, Field> = {};
  for (const s of blockDef.settings) {
    arrayFields[s.key] = mapSettingToField(s);
  }
  return {
    type: "array" as const,
    label: blockDef.name,
    arrayFields,
    defaultItemProps: Object.fromEntries(
      blockDef.settings.map((s) => [s.key, s.default])
    ),
    getItemSummary: (item: any, index?: number) => {
      const titleKey = blockDef.settings.find(
        (s) => s.key === "title" || s.key === "heading" || s.key === "question" || s.key === "value"
      )?.key;
      return titleKey && item[titleKey] ? String(item[titleKey]) : `${blockDef.name} ${(index ?? 0) + 1}`;
    },
  };
}

function buildPuckComponent(sectionType: string) {
  const def = getSectionDefinition(sectionType);
  const Component = sectionComponents[sectionType];
  if (!def || !Component) return null;

  const fields: Record<string, Field> = {};
  const defaultProps: Record<string, any> = {};

  for (const s of def.settings) {
    fields[s.key] = mapSettingToField(s);
    if (s.default !== undefined) {
      defaultProps[s.key] = s.default;
    }
  }

  if (def.blocks && def.blocks.length > 0) {
    if (def.blocks.length === 1) {
      const blockField = mapBlocksToArrayField(def.blocks[0]);
      const blockKey = `${def.blocks[0].type}s`;
      fields[blockKey] = blockField;
      defaultProps[blockKey] = (def.defaultBlocks || []).map((b: any) => ({ ...b.settings }));
    } else {
      for (const bd of def.blocks) {
        const blockField = mapBlocksToArrayField(bd);
        const blockKey = `${bd.type}_blocks`;
        fields[blockKey] = blockField;
        defaultProps[blockKey] = (def.defaultBlocks || [])
          .filter((b: any) => b.type === bd.type)
          .map((b: any) => ({ ...b.settings }));
      }
    }
  }

  return {
    label: def.name,
    fields,
    defaultProps,
    render: (props: any) => {
      const preview = usePreview();
      const { id, puck, _disabled, ...rest } = props;

      let settings: Record<string, any>;
      const blocks: any[] = [];

      if (def.blocks && def.blocks.length > 0) {
        settings = {};
        for (const s of def.settings) {
          if (s.key in rest) settings[s.key] = rest[s.key];
        }

        let blockIdx = 0;
        if (def.blocks.length === 1) {
          const blockKey = `${def.blocks[0].type}s`;
          const items = rest[blockKey] || [];
          items.forEach((item: any) => {
            const { id: _bid, ...blockSettings } = item;
            blocks.push({
              id: _bid || `block-${blockIdx++}`,
              type: def.blocks![0].type,
              settings: blockSettings,
            });
          });
        } else {
          for (const bd of def.blocks) {
            const blockKey = `${bd.type}_blocks`;
            const items = rest[blockKey] || [];
            items.forEach((item: any) => {
              const { id: _bid, ...blockSettings } = item;
              blocks.push({
                id: _bid || `block-${blockIdx++}`,
                type: bd.type,
                settings: blockSettings,
              });
            });
          }
        }
      } else {
        settings = { ...rest };
      }

      return (
        <SectionWrapper settings={settings}>
          <div className={`relative group/section ${rest._disabled ? "opacity-40" : ""}`}>
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-0.5 px-1 py-0.5 opacity-0 group-hover/section:opacity-100 transition-opacity pointer-events-none">
              <span className="text-[9px] font-medium text-gray-400 bg-white/90 rounded px-1.5 py-0 mr-auto truncate max-w-[140px]">
                {def.name}{rest._disabled ? " (masqué)" : ""}
              </span>
              <div className="flex items-center gap-0.5 pointer-events-auto">
                {preview.onToggleSectionVisibility && (
                  <button
                    onClick={(e) => { e.stopPropagation(); preview.onToggleSectionVisibility?.((props as any)._puckId || id || ""); }}
                    className="p-0.5 bg-white border border-gray-200 rounded hover:bg-gray-50 shadow-sm"
                    title={rest._disabled ? "Afficher" : "Masquer"}
                  >
                    {rest._disabled ? <EyeOff className="w-3 h-3 text-amber-400" /> : <Eye className="w-3 h-3 text-gray-400" />}
                  </button>
                )}
                {preview.onDuplicateSection && (
                  <button
                    onClick={(e) => { e.stopPropagation(); preview.onDuplicateSection?.((props as any)._puckId || id || ""); }}
                    className="p-0.5 bg-white border border-gray-200 rounded hover:bg-gray-50 shadow-sm"
                    title="Dupliquer"
                  >
                    <Copy className="w-3 h-3 text-gray-400" />
                  </button>
                )}
                {preview.onDeleteSection && (
                  <button
                    onClick={(e) => { e.stopPropagation(); preview.onDeleteSection?.((props as any)._puckId || id || ""); }}
                    className="p-0.5 bg-white border border-red-200 rounded hover:bg-red-50 shadow-sm"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3 h-3 text-red-400" />
                  </button>
                )}
              </div>
            </div>
            <Component
              settings={settings}
              blocks={blocks.length > 0 ? blocks : undefined}
              shopName={preview.shopName}
              social={preview.social}
              menus={preview.menus}
              brand={preview.brand}
            />
          </div>
        </SectionWrapper>
      );
    },
  };
}

let puckConfig: any = null;
let registryHash = "";

export function getPuckConfig(): any {
  const currentHash = `v2-inline-text:${sectionRegistry.length}:${sectionRegistry.map(s => s.type).join(",")}`;
  if (puckConfig && registryHash === currentHash) return puckConfig;
  registryHash = currentHash;

  const contentTypes = sectionRegistry.filter(
    (s) => s.category !== "advanced"
  );

  const components: Record<string, any> = {};
  const categories: Record<string, { title: string; components: string[] }> = {};

  for (const section of contentTypes) {
    const comp = buildPuckComponent(section.type);
    if (comp) {
      components[section.type] = comp;
      const catKey = section.category;
      if (!categories[catKey]) {
        const catTitle =
          catKey === "content" ? "Contenu" :
          catKey === "header" ? "En-tête" :
          catKey === "footer" ? "Pied de page" :
          catKey === "social" ? "Social" :
          catKey === "advanced" ? "Avancé" : catKey;
        categories[catKey] = { title: catTitle, components: [] };
      }
      categories[catKey].components.push(section.type);
    }
  }

  puckConfig = {
    components,
    categories: categories as any,
    root: {
      fields: {
        title: { type: "text", label: "Titre de la page" },
      },
      defaultProps: { title: "Page" },
      render: ({ children }: any) => <>{children}</>,
    },
  };

  return puckConfig;
}
