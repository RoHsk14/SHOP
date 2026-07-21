"use client";

import { useState, useMemo, useCallback } from "react";
import { Puck } from "@puckeditor/core";
import type { Data } from "@puckeditor/core";
import type {
  SectionSetting,
  PageConfig,
  SettingDefinition,
  BrandAssets,
  NavMenu,
  SocialLinks,
} from "@/lib/theme-config";
import { SYSTEM_PAGES, getContentSections, getSystemPageDefaultContentSections, getSystemPageId } from "@/lib/theme-config";
import { getPuckConfig } from "@/lib/puck-config";
import {
  sectionsToPuckData,
  puckDataToSections,
} from "@/lib/puck-adapter";
import { getSectionDefinition } from "@/lib/sections";
import { PreviewProvider } from "@/lib/preview-context";
import {
  Settings2,
  FilePlus,
  X,
  Copy,
  Eye,
  EyeOff,
  Maximize2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  PaintBucket,
} from "lucide-react";
import ImagePicker from "@/components/ImagePicker";

/* ──────────────────────────────────────────── */
/*  SettingInput — réutilisé du SectionEditor   */
/* ──────────────────────────────────────────── */
function SettingInput({
  setting,
  value,
  onChange,
}: {
  setting: SettingDefinition;
  value: any;
  onChange: (val: any) => void;
}) {
  const baseInput =
    "w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors";

  switch (setting.type) {
    case "color":
      return (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={value || (setting.default as string) || "#000000"}
            onChange={(e) => onChange(e.target.value)}
            className="w-9 h-9 p-0.5 border border-gray-200 rounded-lg cursor-pointer bg-white flex-shrink-0"
          />
          <input
            type="text"
            value={value || (setting.default as string) || ""}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
            placeholder="#000000"
          />
        </div>
      );
    case "boolean":
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="text-sm text-gray-600">{setting.label}</span>
        </label>
      );
    case "select":
      return (
        <select
          value={value || (setting.default as string)}
          onChange={(e) => onChange(e.target.value)}
          className={baseInput}
        >
          {setting.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    case "alignment":
      return (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onChange("left")}
            className={`p-2 rounded-lg border transition-colors ${value === "left" ? "bg-gray-900 text-white border-gray-900" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"}`}
            title="Gauche"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onChange("center")}
            className={`p-2 rounded-lg border transition-colors ${value === "center" ? "bg-gray-900 text-white border-gray-900" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"}`}
            title="Centré"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onChange("right")}
            className={`p-2 rounded-lg border transition-colors ${value === "right" ? "bg-gray-900 text-white border-gray-900" : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"}`}
            title="Droite"
          >
            <AlignRight className="w-4 h-4" />
          </button>
        </div>
      );
    case "textarea":
      return (
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={setting.placeholder || setting.label}
          rows={3}
          className={`${baseInput} resize-none`}
        />
      );
    case "image":
      return <ImagePicker value={value || ""} onChange={onChange} />;
    case "number":
      return (
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={setting.options?.[0]?.value || 0}
            max={setting.options?.[1]?.value || 200}
            value={Number(value) || Number(setting.default) || 0}
            onChange={(e) => onChange(Number(e.target.value))}
            className="flex-1 accent-emerald-600"
          />
          <input
            type="number"
            value={value ?? (setting.default as number) ?? ""}
            onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-16 text-sm px-2 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      );
    default:
      return (
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={setting.placeholder || setting.label}
          className={baseInput}
        />
      );
  }
}

/* ──────────────────────────────────────────── */
/*  GlobalSectionList — édition des sections    */
/*  globales (header, footer, announcement)     */
/* ──────────────────────────────────────────── */
interface GlobalSectionListProps {
  sections: SectionSetting[];
  onChange: (sections: SectionSetting[]) => void;
}

function GlobalSectionList({ sections, onChange }: GlobalSectionListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const globalTypes = ["announcement-bar", "header", "footer"];
  const globalSections = sections.filter((s) =>
    globalTypes.includes(s.type)
  );

  const updateSection = (id: string, updated: SectionSetting) => {
    onChange(sections.map((s) => (s.id === id ? updated : s)));
  };

  if (globalSections.length === 0) return null;

  return (
    <div className="space-y-3 mt-6">
      <h3 className="text-sm font-semibold text-gray-900">
        Sections globales
      </h3>
      <p className="text-xs text-gray-400">
        L'en-tête, le pied de page et la barre d'annonce sont partagés sur toutes les pages.
      </p>
      {globalSections.map((section) => {
        const def = getSectionDefinition(section.type);
        if (!def) return null;
        const isExpanded = expandedId === section.id;

        return (
          <div
            key={section.id}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden"
          >
            <div className="flex items-center justify-between p-3">
              <button
                onClick={() =>
                  setExpandedId(isExpanded ? null : section.id)
                }
                className="flex items-center gap-2"
              >
                <Settings2 className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-900">
                  {def.name}
                </span>
              </button>
              <button
                onClick={() =>
                  updateSection(section.id, {
                    ...section,
                    disabled: !section.disabled,
                  })
                }
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                title={section.disabled ? "Afficher" : "Masquer"}
              >
                {section.disabled ? (
                  <EyeOff className="w-4 h-4 text-gray-300" />
                ) : (
                  <Eye className="w-4 h-4 text-gray-400" />
                )}
              </button>
            </div>

            {isExpanded && (
              <div className="px-3 pb-3 border-t border-gray-100 pt-3 space-y-3">
                {def.settings.map((s) => (
                  <div key={s.key}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {s.label}
                    </label>
                    <SettingInput
                      setting={s}
                      value={section.settings[s.key]}
                      onChange={(val) =>
                        updateSection(section.id, {
                          ...section,
                          settings: { ...section.settings, [s.key]: val },
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ──────────────────────────────────────────── */
/*  PuckPageEditor — page selector + Puck       */
/* ──────────────────────────────────────────── */
interface Props {
  pagesProp: PageConfig[];
  defaultSections: SectionSetting[];
  onChange: (
    pages: PageConfig[],
    defaultSections: SectionSetting[]
  ) => void;
  brand?: BrandAssets;
  shopName?: string;
  social?: SocialLinks;
  menus?: NavMenu[];
  onFullscreen?: () => void;
  hideToolbar?: boolean;
  cssVars?: Record<string, string>;
}

const systemPageIcons: Record<string, string> = {};

export default function PuckPageEditor({
  pagesProp,
  defaultSections,
  onChange,
  brand,
  shopName: shopNameProp,
  social,
  menus,
  onFullscreen,
  hideToolbar,
  cssVars,
}: Props) {
  const [activePageId, setActivePageId] = useState("__default__");
  const pages = pagesProp || [];
  const puckConfig = useMemo(() => getPuckConfig(), []);

  const allSystemPages = useMemo(() => SYSTEM_PAGES.map((sp) => {
    const existing = pages.find((p) => p.slug === sp.slug);
    if (existing) return existing;
    return {
      id: getSystemPageId(sp.slug),
      slug: sp.slug,
      name: sp.name,
      sections: getSystemPageDefaultContentSections(sp.slug),
    };
  }), [pages]);

  const activePage = useMemo(() =>
    activePageId === "__default__"
      ? {
          id: "__default__" as const,
          slug: "/",
          name: "Page d'accueil",
          sections: defaultSections,
        }
      : pages.find((p) => p.id === activePageId) ||
        allSystemPages.find((p) => p.id === activePageId),
    [activePageId, defaultSections, pages, allSystemPages]
  );

  const globalTypes = ["announcement-bar", "header", "footer"];

  const isHome = activePageId === "__default__";

  let dedupCounter = 0;
  const activeSettings = useMemo(() =>
    activePage
      ? (() => {
          const raw = isHome
            ? activePage.sections
            : getContentSections(activePage.sections);
          const seen = new Set<string>();
          return raw.map((s) => {
            if (!seen.has(s.id)) { seen.add(s.id); return s; }
            dedupCounter++;
            return { ...s, id: `${s.type}-dedup-${dedupCounter}` };
          });
        })()
      : [],
    [activePage, isHome]
  );

  const activeGlobals = useMemo(() =>
    activePage
      ? activePage.sections.filter((s) => globalTypes.includes(s.type))
      : [],
    [activePage, globalTypes]
  );

  const setActiveSections = (sections: SectionSetting[]) => {
    if (isHome) {
      onChange(pages, sections);
    } else {
      const existingIndex = pages.findIndex((p) => p.id === activePageId);
      if (existingIndex >= 0) {
        onChange(
          pages.map((p) =>
            p.id === activePageId ? { ...p, sections } : p
          ),
          defaultSections
        );
      } else {
        const sysPage = allSystemPages.find((p) => p.id === activePageId);
        if (sysPage) {
          onChange([...pages, { ...sysPage, sections }], defaultSections);
        }
      }
    }
  };

  const handlePuckPublish = useCallback((data: Data) => {
    const newSections = puckDataToSections(data, activeSettings);

    if (isHome) {
      const headers = newSections.filter((s) =>
        ["announcement-bar", "header"].includes(s.type)
      );
      const content = newSections.filter((s) =>
        !globalTypes.includes(s.type)
      );
      const footers = newSections.filter((s) => s.type === "footer");
      onChange(pages, [...headers, ...content, ...footers]);
    } else {
      const existingGlobals = activeGlobals.length > 0
        ? activeGlobals
        : defaultSections.filter((s) => globalTypes.includes(s.type));
      setActiveSections([...existingGlobals, ...newSections]);
    }
  }, [activeSettings, isHome, pages, activeGlobals, defaultSections, onChange, globalTypes]);

  const addPage = () => {
    const count = pages.filter(
      (p) => !SYSTEM_PAGES.some((sp) => sp.slug === p.slug)
    ).length;
    const name = `Page ${count + 1}`;
    const slug = `/page-${count + 1}`;
    const pageId = `page-${Date.now()}`;
    const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newPage: PageConfig = {
      id: pageId,
      slug,
      name,
      sections: [
        {
          id: `hero-${uid()}`,
          type: "text-with-image",
          settings: {
            image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop",
            title: `Bienvenue sur ${name}`,
            content: "Découvrez nos produits et laissez-vous séduire par notre sélection unique.",
            button_text: "Voir les produits",
            button_url: "/products",
            image_position: "right",
          },
        },
      ],
    };
    onChange([...pages, newPage], defaultSections);
    setActivePageId(newPage.id);
  };

  const duplicatePage = () => {
    if (!activePage || activePageId === "__default__") return;
    if (SYSTEM_PAGES.some((sp) => sp.slug === activePage.slug)) return;
    const newPage: PageConfig = {
      ...activePage,
      id: `page-${Date.now()}`,
      name: `${activePage.name} (copie)`,
      slug: `${activePage.slug}-copy`,
      sections: activePage.sections.map((s) => ({
        ...s,
        id: `${s.type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        blocks: s.blocks?.map((b) => ({
          ...b,
          id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        })),
      })),
    };
    onChange([...pages, newPage], defaultSections);
    setActivePageId(newPage.id);
  };

  const deletePage = (id: string) => {
    const p = pages.find((pg) => pg.id === id);
    if (!p) return;
    if (SYSTEM_PAGES.some((sp) => sp.slug === p.slug)) return;
    if (window.confirm(`Supprimer la page "${p.name}" ?`)) {
      onChange(
        pages.filter((pg) => pg.id !== id),
        defaultSections
      );
      setActivePageId("__default__");
    }
  };

  const isSystemPage =
    activePageId !== "__default__" &&
    SYSTEM_PAGES.some((sp) => sp.slug === activePage?.slug);

  const compact = hideToolbar;
  const btnPad = compact ? 'px-1 py-0' : 'px-2 py-0.5';

  const viewports = useMemo(() => [
    { width: 375, label: "Mobile", icon: "Smartphone" as const },
    { width: 768, label: "Tablette", icon: "Tablet" as const },
    { width: 1280, label: "Desktop", icon: "Monitor" as const },
  ], []);

  return (
    <div className={compact ? 'h-full flex flex-col' : 'space-y-2'}>
      {/* Page selector */}
      <div className={`flex items-center gap-0.5 ${compact ? 'shrink-0' : ''}`}>
        <div className="flex-1 flex items-center gap-0.5 overflow-x-auto pb-0">
          <button
            onClick={() => setActivePageId("__default__")}
            className={`${btnPad} text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
              activePageId === "__default__"
                ? "bg-gray-900 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
            }`}
          >
            Accueil
          </button>
          <span className="text-xs text-gray-300 mx-0.5">|</span>
          {allSystemPages
            .filter((sp) => sp.slug !== "/")
            .map((sp) => (
              <button
                key={sp.id}
                onClick={() => setActivePageId(sp.id)}
                className={`${btnPad} text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                  activePageId === sp.id
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                }`}
              >
                {sp.name}
              </button>
            ))}
          {pages.filter(
            (p) => !SYSTEM_PAGES.some((sp) => sp.slug === p.slug)
          ).length > 0 && <span className="text-xs text-gray-300 mx-0.5">|</span>}
          {pages
            .filter(
              (p) => !SYSTEM_PAGES.some((sp) => sp.slug === p.slug)
            )
            .map((p) => (
              <span key={p.id} className="flex items-center gap-0.5">
                <button
                  onClick={() => setActivePageId(p.id)}
                  className={`${btnPad} text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                    activePageId === p.id
                      ? "bg-gray-900 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  }`}
                >
                  {p.name}
                </button>
                {activePageId === p.id && (
                  <button
                    onClick={() => deletePage(p.id)}
                    className="p-0.5 hover:bg-red-50 rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    <X className="w-3 h-3 text-red-400" />
                  </button>
                )}
              </span>
            ))}
        </div>
        <div className="flex items-center gap-0.5">
          {activePageId !== "__default__" && !isSystemPage && (
            <button
              onClick={duplicatePage}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              title="Dupliquer la page"
            >
              <Copy className="w-3.5 h-3.5 text-gray-400" />
            </button>
          )}
          <button
            onClick={addPage}
            className={`inline-flex items-center gap-0.5 ${compact ? 'px-1 py-0' : 'px-2 py-0.5'} text-[10px] font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors`}
            title="Nouvelle page"
          >
            <FilePlus className="w-3 h-3" />
            Page
          </button>
          {onFullscreen && (
            <button
              onClick={onFullscreen}
              className="p-0.5 hover:bg-gray-100 rounded-lg transition-colors ml-0.5"
              title="Éditeur plein écran"
            >
              <Maximize2 className="w-3 h-3 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Editor */}
      {activePage ? (
        <div className={compact ? 'flex-1 min-h-0 flex flex-col' : 'space-y-2'}>
          {!hideToolbar && (
            <p className="text-xs text-gray-400">
              {isHome
                ? "Glissez-déposez et configurez toutes les sections — en-tête, contenu et pied de page"
                : `Personnalisez les sections de contenu de "${activePage?.name}"`}
            </p>
          )}

          {/* Puck editor for content sections */}
          <div
            className={`border border-gray-200 rounded-xl overflow-hidden ${compact ? 'flex-1 min-h-0' : ''}`}
            style={{ ...(compact ? {} : { minHeight: 600 }), ...cssVars } as React.CSSProperties}
          >
            <PreviewProvider value={{
              brand, shopName: shopNameProp, social, menus,
              onDeleteSection: (sectionId: string) => {
                if (!window.confirm("Supprimer cette section ?")) return;
                const updated = activeSettings.filter((s) => s.id !== sectionId);
                setActiveSections(updated);
                handlePuckPublish(sectionsToPuckData(updated));
              },
              onDuplicateSection: (sectionId: string) => {
                const section = activeSettings.find((s) => s.id === sectionId);
                if (!section) return;
                const newId = `${section.type}-dup-${Date.now()}`;
                const duplicated: SectionSetting = {
                  ...section,
                  id: newId,
                  settings: { ...section.settings },
                  blocks: section.blocks?.map((b) => ({ ...b, id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` })),
                };
                const idx = activeSettings.findIndex((s) => s.id === sectionId);
                const updated = [...activeSettings];
                updated.splice(idx + 1, 0, duplicated);
                setActiveSections(updated);
                handlePuckPublish(sectionsToPuckData(updated));
              },
              onToggleSectionVisibility: (sectionId: string) => {
                const updated = activeSettings.map((s) =>
                  s.id === sectionId ? { ...s, disabled: !s.disabled } : s
                );
                setActiveSections(updated);
                handlePuckPublish(sectionsToPuckData(updated));
              },
            }}>
              <Puck
                key={activePage.id}
                config={puckConfig}
                data={sectionsToPuckData(activeSettings)}
                onChange={handlePuckPublish}
                onPublish={handlePuckPublish}
                viewports={viewports}
                overrides={{
                  header: ({ children }: any) => (
                    <div className={`flex items-center justify-between px-1 border-b border-gray-200 bg-white ${hideToolbar ? 'py-0' : 'py-0'}`}>
                      <div className="flex items-center gap-0.5">
                        <span className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider leading-none">
                          {activePage?.name || "Page"}
                        </span>
                        <span className="text-[9px] text-gray-300 bg-gray-100 px-0.5 py-0 rounded leading-none">
                          {activeSettings.length}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {children}
                      </div>
                    </div>
                  ),
                }}
              />
            </PreviewProvider>
          </div>

          {/* On sub-pages, show inherited global sections */}
          {!isHome && (
            <GlobalSectionList
              sections={defaultSections}
              onChange={(globalSections) => {
                const content = activePage
                  ? getContentSections(activePage.sections)
                  : [];
                onChange(pages, [...globalSections, ...content]);
              }}
            />
          )}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <p className="text-sm text-gray-400">
            Sélectionnez ou créez une page
          </p>
        </div>
      )}
    </div>
  );
}
