"use client";

import { useMemo, useState } from "react";
import type { ThemeConfig, SectionSetting } from "@/lib/theme-config";
import { themeConfigToCSS, enforceFooterAtEnd } from "@/lib/theme-config";
import { sectionComponents } from "@/components/sections";
import { getSectionDefinition } from "@/lib/sections";
import { ShopProvider } from "@/lib/shop-context";
import GoogleFontsLoader from "@/components/GoogleFontsLoader";
import SectionWrapper from "@/components/SectionWrapper";
import {
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Trash2,
  Edit2,
  Smartphone,
  Sparkles,
} from "lucide-react";

interface CustomizerCanvasProps {
  config: ThemeConfig;
  sections: SectionSetting[];
  shopName: string;
  subdomain: string;
  viewport: "desktop" | "mobile" | "fullscreen";
  selectedSectionId: string | null;
  onSelectSection: (sectionId: string) => void;
  onMoveSection: (index: number, direction: "up" | "down") => void;
  onToggleVisibility: (sectionId: string) => void;
  onDeleteSection: (sectionId: string) => void;
}

export default function CustomizerCanvas({
  config,
  sections,
  shopName,
  subdomain,
  viewport,
  selectedSectionId,
  onSelectSection,
  onMoveSection,
  onToggleVisibility,
  onDeleteSection,
}: CustomizerCanvasProps) {
  const [hoveredSectionId, setHoveredSectionId] = useState<string | null>(null);

  const cssVars = useMemo(() => themeConfigToCSS(config), [config]);
  const activeSections = useMemo(
    () => enforceFooterAtEnd(sections.filter((s) => !s.disabled)),
    [sections]
  );

  const sectionSharedProps = useMemo(
    () => ({
      social: config.social,
      menus: config.menus,
      brand: config.brand,
    }),
    [config.social, config.menus, config.brand]
  );

  return (
    <div className="flex-1 min-w-0 bg-gray-100 flex items-center justify-center overflow-auto p-2 sm:p-6 select-none relative">
      {/* Container sizing according to viewport */}
      <div
        className={`transition-all duration-300 ease-out flex flex-col ${
          viewport === "mobile"
            ? "w-[390px] h-[844px] max-h-[calc(100vh-100px)] bg-white rounded-[44px] border-[10px] border-gray-900 shadow-2xl overflow-hidden relative"
            : "w-full h-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
        }`}
      >
        {/* iPhone Dynamic Island & Speaker (Mobile view only) */}
        {viewport === "mobile" && (
          <div className="sticky top-0 left-0 right-0 z-50 flex items-center justify-between px-6 pt-2 pb-1.5 bg-black/90 text-white text-[10px] font-semibold backdrop-blur-md">
            <span>9:41</span>
            <div className="w-20 h-4 bg-black rounded-full mx-auto relative flex items-center justify-end pr-2">
              <span className="w-2 h-2 rounded-full bg-blue-900/60" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[9px]">5G</span>
              <span className="w-3.5 h-2 rounded-xs border border-white/60 inline-block" />
            </div>
          </div>
        )}

        {/* Live Scrollable Canvas Content */}
        <div
          className="flex-1 overflow-y-auto relative scrollbar-thin"
          style={{
            ...cssVars,
            background: cssVars["--theme-bg"] || "#ffffff",
            color: cssVars["--theme-text"] || "#111827",
            fontFamily: cssVars["--theme-font-body"] || "Inter, sans-serif",
            fontSize: `${config.global.fonts.baseSize || 15}px`,
          } as React.CSSProperties}
        >
          <GoogleFontsLoader
            fonts={{
              heading: config.global.fonts.heading,
              body: config.global.fonts.body,
            }}
          />

          <ShopProvider config={config} shopName={shopName} subdomain={subdomain}>
            {activeSections.map((section, idx) => {
              const Component = sectionComponents[section.type];
              if (!Component) return null;

              const isSelected = selectedSectionId === section.id;
              const isHovered = hoveredSectionId === section.id;
              const def = getSectionDefinition(section.type);

              return (
                <div
                  key={`${section.id}-${idx}`}
                  onMouseEnter={() => setHoveredSectionId(section.id)}
                  onMouseLeave={() => setHoveredSectionId(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSection(section.id);
                  }}
                  className={`relative group transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? "ring-2 ring-emerald-500 ring-offset-2 z-20 shadow-md"
                      : isHovered
                      ? "ring-2 ring-blue-400 ring-offset-1 z-10"
                      : ""
                  }`}
                >
                  {/* Floating Selection Badge & Action Toolbar (on hover or select) */}
                  {(isHovered || isSelected) && (
                    <div
                      className="absolute top-2 left-2 z-30 flex items-center gap-1.5 bg-gray-900/90 text-white backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-semibold shadow-lg animate-fade-in"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                        <Edit2 className="w-3 h-3" />
                        {def?.name || section.type}
                      </span>

                      <div className="flex items-center gap-0.5 ml-2 pl-2 border-l border-white/20">
                        <button
                          onClick={() => onMoveSection(idx, "up")}
                          disabled={idx === 0}
                          className="p-1 hover:bg-white/20 rounded disabled:opacity-30"
                          title="Déplacer vers le haut"
                        >
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onMoveSection(idx, "down")}
                          disabled={idx === activeSections.length - 1}
                          className="p-1 hover:bg-white/20 rounded disabled:opacity-30"
                          title="Déplacer vers le bas"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onToggleVisibility(section.id)}
                          className="p-1 hover:bg-white/20 rounded text-amber-300"
                          title="Masquer la section"
                        >
                          <EyeOff className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm("Supprimer cette section ?")) {
                              onDeleteSection(section.id);
                            }
                          }}
                          className="p-1 hover:bg-red-500/40 rounded text-red-300"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* The actual section render */}
                  <SectionWrapper settings={section.settings}>
                    <Component
                      settings={section.settings}
                      blocks={section.blocks}
                      shopName={shopName}
                      {...sectionSharedProps}
                    />
                  </SectionWrapper>
                </div>
              );
            })}

            {activeSections.length === 0 && (
              <div className="py-20 text-center px-4">
                <Sparkles className="w-10 h-10 mx-auto text-emerald-500 mb-3" />
                <h3 className="text-base font-bold text-gray-900">
                  Votre boutique n'a pas encore de section
                </h3>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Cliquez sur "+ Ajouter une section" dans le panneau de gauche pour commencer à personnaliser votre vitrine.
                </p>
              </div>
            )}
          </ShopProvider>
        </div>
      </div>
    </div>
  );
}
