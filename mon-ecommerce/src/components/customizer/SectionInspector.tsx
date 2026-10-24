"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  Plus,
  ChevronDown,
  ChevronUp,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sliders,
  Layers,
  Sparkles,
  MousePointerClick,
} from "lucide-react";
import { getSectionDefinition } from "@/lib/sections";
import type { SectionSetting, BlockSetting, SettingDefinition } from "@/lib/theme-config";
import ImagePicker from "@/components/ImagePicker";
import { useEditor } from "@/lib/editor-context";

interface SectionInspectorProps {
  section: SectionSetting;
  onUpdateSection: (updated: SectionSetting) => void;
  onDuplicateSection: () => void;
  onDeleteSection: () => void;
  onBack: () => void;
}

export default function SectionInspector({
  section,
  onUpdateSection,
  onDuplicateSection,
  onDeleteSection,
  onBack,
}: SectionInspectorProps) {
  const [activeTab, setActiveTab] = useState<"content" | "style">("content");
  const [expandedBlockIndex, setExpandedBlockIndex] = useState<number | null>(0);

  const { activeFieldKey, activeBlockId, hoveredField, setHoveredField } = useEditor();

  const definition = useMemo(() => {
    return getSectionDefinition(section.type);
  }, [section.type]);

  // If a block is focused from the preview canvas, auto-expand it
  useEffect(() => {
    if (activeBlockId && section.blocks) {
      const idx = section.blocks.findIndex(
        (b, i) => b.id === activeBlockId || String(i) === activeBlockId
      );
      if (idx >= 0) {
        setExpandedBlockIndex(idx);
      }
    }
  }, [activeBlockId, section.blocks]);

  // When activeFieldKey is selected, smoothly scroll the input into view and focus it
  useEffect(() => {
    if (!activeFieldKey) return;
    const targetId = `field-input-${section.id}-${activeFieldKey}${
      activeBlockId ? `-${activeBlockId}` : ""
    }`;
    const timer = setTimeout(() => {
      const el =
        document.getElementById(targetId) ||
        document.getElementById(`field-input-${section.id}-${activeFieldKey}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
          el.focus();
          el.select?.();
        }
      }
    }, 120);
    return () => clearTimeout(timer);
  }, [activeFieldKey, activeBlockId, section.id]);

  const updateSetting = (key: string, value: any) => {
    onUpdateSection({
      ...section,
      settings: {
        ...section.settings,
        [key]: value,
      },
    });
  };

  const updateBlockSetting = (blockIndex: number, key: string, value: any) => {
    const updatedBlocks = [...(section.blocks || [])];
    if (!updatedBlocks[blockIndex]) return;
    updatedBlocks[blockIndex] = {
      ...updatedBlocks[blockIndex],
      settings: {
        ...updatedBlocks[blockIndex].settings,
        [key]: value,
      },
    };
    onUpdateSection({
      ...section,
      blocks: updatedBlocks,
    });
  };

  const addBlock = () => {
    if (!definition?.blocks || definition.blocks.length === 0) return;
    const blockDef = definition.blocks[0];
    const newBlock: BlockSetting = {
      id: `${blockDef.type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: blockDef.type,
      settings: {
        title: `Nouvel élément ${(section.blocks?.length || 0) + 1}`,
      },
    };
    const updatedBlocks = [...(section.blocks || []), newBlock];
    onUpdateSection({
      ...section,
      blocks: updatedBlocks,
    });
    setExpandedBlockIndex(updatedBlocks.length - 1);
  };

  const deleteBlock = (blockIndex: number) => {
    const updatedBlocks = (section.blocks || []).filter((_, i) => i !== blockIndex);
    onUpdateSection({
      ...section,
      blocks: updatedBlocks,
    });
    if (expandedBlockIndex === blockIndex) {
      setExpandedBlockIndex(null);
    }
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    const blocks = [...(section.blocks || [])];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    const temp = blocks[index];
    blocks[index] = blocks[targetIndex];
    blocks[targetIndex] = temp;
    onUpdateSection({
      ...section,
      blocks,
    });
    setExpandedBlockIndex(targetIndex);
  };

  // Group settings into primary content vs layout/style
  const universalKeys = [
    "padding_top",
    "padding_bottom",
    "padding_left",
    "padding_right",
    "margin_top",
    "margin_bottom",
    "section_bg",
    "section_bg_image",
    "section_bg_size",
    "section_border_color",
    "section_border_width",
    "section_border_radius",
    "section_max_width",
    "heading_size",
    "heading_color",
    "text_color",
  ];

  const contentSettings = useMemo(() => {
    if (!definition) return [];
    return definition.settings.filter((s) => !universalKeys.includes(s.key));
  }, [definition]);

  const styleSettings = useMemo(() => {
    if (!definition) return [];
    return definition.settings.filter((s) => universalKeys.includes(s.key));
  }, [definition]);

  const renderField = (
    setting: SettingDefinition,
    value: any,
    onChange: (val: any) => void,
    blockId?: string
  ) => {
    const inputId = `field-input-${section.id}-${setting.key}${blockId ? `-${blockId}` : ""}`;
    const isFieldFocused =
      activeFieldKey === setting.key && (!blockId || activeBlockId === blockId);
    const isFieldHovered =
      hoveredField?.sectionId === section.id &&
      hoveredField?.fieldKey === setting.key &&
      (!blockId || hoveredField?.blockId === blockId);

    const isHighlighted = isFieldFocused || isFieldHovered;

    const baseInput = `w-full text-sm px-3 py-2 bg-white border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all shadow-sm ${
      isHighlighted
        ? "border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/20"
        : "border-gray-200 focus:border-emerald-500"
    }`;

    switch (setting.type) {
      case "text":
      case "url":
        return (
          <input
            id={inputId}
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={setting.placeholder || (setting.default as string) || ""}
            className={baseInput}
          />
        );

      case "textarea":
        return (
          <textarea
            id={inputId}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={setting.placeholder || (setting.default as string) || ""}
            rows={3}
            className={`${baseInput} resize-none`}
          />
        );

      case "image":
        return <ImagePicker value={value || ""} onChange={onChange} />;

      case "color":
        return (
          <div className="space-y-1.5" id={inputId}>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={value || (setting.default as string) || "#000000"}
                onChange={(e) => onChange(e.target.value)}
                className="w-9 h-9 p-0.5 border border-gray-200 rounded-xl cursor-pointer bg-white shrink-0 shadow-sm"
              />
              <input
                type="text"
                value={value || (setting.default as string) || ""}
                onChange={(e) => onChange(e.target.value)}
                placeholder="#000000"
                className="flex-1 font-mono uppercase text-xs px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            {/* Quick swatches */}
            <div className="flex items-center gap-1.5 pt-1">
              {["#059669", "#111827", "#ffffff", "#f3f4f6", "#dc2626", "#8b5cf6", "#b8860b"].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => onChange(c)}
                  className="w-5 h-5 rounded-full border border-gray-200 hover:scale-110 transition-transform shadow-xs"
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>
        );

      case "select":
        return (
          <select
            id={inputId}
            value={value ?? (setting.default as string)}
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

      case "boolean":
        return (
          <label
            id={inputId}
            className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-colors ${
              isHighlighted
                ? "bg-emerald-50/70 border-emerald-400"
                : "bg-gray-50 border-gray-200/80 hover:bg-gray-100"
            }`}
          >
            <span className="text-xs font-semibold text-gray-800">{setting.label}</span>
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
          </label>
        );

      case "alignment":
        return (
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            {[
              { val: "left", icon: AlignLeft, label: "Gauche" },
              { val: "center", icon: AlignCenter, label: "Centré" },
              { val: "right", icon: AlignRight, label: "Droite" },
            ].map(({ val, icon: Icon, label }) => (
              <button
                key={val}
                type="button"
                onClick={() => onChange(val)}
                className={`flex-1 py-1.5 flex items-center justify-center rounded-lg text-xs font-medium transition-all ${
                  (value || setting.default) === val
                    ? "bg-white text-gray-900 shadow-sm font-semibold"
                    : "text-gray-500 hover:text-gray-900"
                }`}
                title={label}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        );

      case "number":
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={150}
                value={Number(value ?? setting.default ?? 0)}
                onChange={(e) => onChange(Number(e.target.value))}
                className="flex-1 accent-emerald-600 cursor-pointer"
              />
              <span className="w-12 text-center text-xs font-mono font-semibold px-2 py-1 bg-gray-100 rounded-lg text-gray-700">
                {value ?? setting.default ?? 0}px
              </span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Top Header */}
      <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 transition-colors px-2 py-1 -ml-2 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft className="w-4 h-4" />
          Sections
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onUpdateSection({ ...section, disabled: !section.disabled })}
            className={`p-1.5 rounded-lg border transition-colors ${
              section.disabled
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "text-gray-400 hover:text-gray-700 border-gray-200 hover:bg-gray-50"
            }`}
            title={section.disabled ? "Section masquée — cliquez pour afficher" : "Masquer la section"}
          >
            {section.disabled ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Section Title & Subtitle */}
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-gray-900 truncate">
            {definition?.name || section.type}
          </h2>
          {section.disabled && (
            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md">
              Masquée
            </span>
          )}
        </div>
        <p className="text-[11px] text-gray-500 mt-0.5 truncate">
          {definition?.description || "Personnalisez cette section"}
        </p>
      </div>

      {/* Tabs : Contenu vs Style */}
      <div className="flex border-b border-gray-100 px-4 shrink-0 bg-white">
        <button
          onClick={() => setActiveTab("content")}
          className={`flex-1 py-2.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === "content"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-gray-400 hover:text-gray-700"
          }`}
        >
          Contenu
        </button>
        <button
          onClick={() => setActiveTab("style")}
          className={`flex-1 py-2.5 text-xs font-bold border-b-2 transition-all ${
            activeTab === "style"
              ? "border-emerald-600 text-emerald-600"
              : "border-transparent text-gray-400 hover:text-gray-700"
          }`}
        >
          Design & Marges
        </button>
      </div>

      {/* Body scroll area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
        {activeTab === "content" && (
          <>
            {/* Primary content fields */}
            <div className="space-y-4">
              {contentSettings.map((s) => {
                const isHighlighted =
                  (activeFieldKey === s.key && !activeBlockId) ||
                  (hoveredField?.sectionId === section.id &&
                    hoveredField?.fieldKey === s.key &&
                    !hoveredField?.blockId);

                return (
                  <div
                    key={s.key}
                    onMouseEnter={() => setHoveredField({ sectionId: section.id, fieldKey: s.key })}
                    onMouseLeave={() => setHoveredField(null)}
                    className={`space-y-1.5 p-2 rounded-xl transition-all ${
                      isHighlighted
                        ? "bg-emerald-50/70 ring-1 ring-emerald-300 shadow-xs"
                        : "hover:bg-gray-50/60"
                    }`}
                  >
                    {s.type !== "boolean" && (
                      <label
                        htmlFor={`field-input-${section.id}-${s.key}`}
                        className="block text-xs font-bold text-gray-700 flex items-center justify-between cursor-pointer"
                      >
                        <span>{s.label}</span>
                        {isHighlighted && (
                          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Sur le preview
                          </span>
                        )}
                      </label>
                    )}
                    {renderField(s, section.settings[s.key], (val) => updateSetting(s.key, val))}
                  </div>
                );
              })}
            </div>

            {/* Blocks / Elements (Slides, FAQ items, etc.) */}
            {definition?.blocks && definition.blocks.length > 0 && (
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Éléments ({section.blocks?.length || 0})
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      Ajoutez, réorganisez ou modifiez chaque élément
                    </p>
                  </div>
                  <button
                    onClick={addBlock}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60 rounded-xl text-xs font-bold transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Ajouter
                  </button>
                </div>

                <div className="space-y-2">
                  {(section.blocks || []).map((block, idx) => {
                    const isExpanded = expandedBlockIndex === idx;
                    const blockDef = definition.blocks?.find((b) => b.type === block.type) || definition.blocks?.[0];

                    return (
                      <div
                        key={block.id || idx}
                        className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-xs"
                      >
                        <div
                          className="flex items-center justify-between p-3 bg-gray-50/70 hover:bg-gray-100/70 cursor-pointer transition-colors"
                          onClick={() => setExpandedBlockIndex(isExpanded ? null : idx)}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded-md bg-white border border-gray-200 text-gray-600 flex items-center justify-center text-[10px] font-bold">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-semibold text-gray-800 truncate">
                              {block.settings?.title || block.settings?.heading || `${blockDef?.name || "Élément"} ${idx + 1}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => moveBlock(idx, "up")}
                              disabled={idx === 0}
                              className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 rounded"
                              title="Monter"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => moveBlock(idx, "down")}
                              disabled={idx === (section.blocks?.length || 0) - 1}
                              className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30 rounded"
                              title="Descendre"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteBlock(idx)}
                              className="p-1 text-red-400 hover:text-red-600 rounded ml-1"
                              title="Supprimer l'élément"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {isExpanded && blockDef && (
                          <div className="p-3.5 space-y-3 border-t border-gray-100 bg-white">
                            {blockDef.settings.map((bs) => {
                              const isBlockFieldHighlighted =
                                (activeFieldKey === bs.key && activeBlockId === block.id) ||
                                (hoveredField?.sectionId === section.id &&
                                  hoveredField?.fieldKey === bs.key &&
                                  hoveredField?.blockId === block.id);

                              return (
                                <div
                                  key={bs.key}
                                  onMouseEnter={() =>
                                    setHoveredField({
                                      sectionId: section.id,
                                      fieldKey: bs.key,
                                      blockId: block.id,
                                    })
                                  }
                                  onMouseLeave={() => setHoveredField(null)}
                                  className={`space-y-1 p-2 rounded-xl transition-all ${
                                    isBlockFieldHighlighted
                                      ? "bg-emerald-50/70 ring-1 ring-emerald-300 shadow-xs"
                                      : "hover:bg-gray-50/60"
                                  }`}
                                >
                                  <label
                                    htmlFor={`field-input-${section.id}-${bs.key}-${block.id}`}
                                    className="block text-xs font-medium text-gray-700 flex items-center justify-between cursor-pointer"
                                  >
                                    <span>{bs.label}</span>
                                    {isBlockFieldHighlighted && (
                                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Sur le preview
                                      </span>
                                    )}
                                  </label>
                                  {renderField(
                                    bs,
                                    block.settings[bs.key],
                                    (val) => updateBlockSetting(idx, bs.key, val),
                                    block.id
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {(!section.blocks || section.blocks.length === 0) && (
                    <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                      <p className="text-xs text-gray-400">Aucun élément dans cette section</p>
                      <button
                        onClick={addBlock}
                        className="mt-2 text-xs font-bold text-emerald-600 hover:underline"
                      >
                        + Ajouter un premier élément
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "style" && (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800">
              <Sliders className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Ajustez l'espacement et l'arrière-plan de cette section uniquement.</span>
            </div>

            {styleSettings.map((s) => {
              const isHighlighted =
                hoveredField?.sectionId === section.id && hoveredField?.fieldKey === s.key;

              return (
                <div
                  key={s.key}
                  onMouseEnter={() => setHoveredField({ sectionId: section.id, fieldKey: s.key })}
                  onMouseLeave={() => setHoveredField(null)}
                  className={`space-y-1.5 p-2 rounded-xl transition-all ${
                    isHighlighted
                      ? "bg-emerald-50/70 ring-1 ring-emerald-300 shadow-xs"
                      : "hover:bg-gray-50/60"
                  }`}
                >
                  {s.type !== "boolean" && (
                    <label
                      htmlFor={`field-input-${section.id}-${s.key}`}
                      className="block text-xs font-bold text-gray-700 cursor-pointer"
                    >
                      {s.label}
                    </label>
                  )}
                  {renderField(s, section.settings[s.key], (val) => updateSetting(s.key, val))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/80 flex items-center justify-between gap-2 shrink-0">
        <button
          onClick={onDuplicateSection}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-bold transition-all shadow-xs"
        >
          <Copy className="w-3.5 h-3.5" />
          Dupliquer
        </button>
        <button
          onClick={() => {
            if (window.confirm("Êtes-vous sûr de vouloir supprimer cette section ?")) {
              onDeleteSection();
            }
          }}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/80 rounded-xl text-xs font-bold transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Supprimer
        </button>
      </div>
    </div>
  );
}
