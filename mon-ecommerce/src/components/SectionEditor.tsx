"use client";

import { useState, useRef } from "react";
import type { SectionSetting, BlockSetting, SettingDefinition, PageConfig } from "@/lib/theme-config";
import { sectionRegistry, getSectionDefinition, createDefaultSection } from "@/lib/sections";
import { Plus, Trash2, ChevronUp, ChevronDown, GripVertical, Eye, EyeOff, Settings2, Save, FilePlus, X, Copy } from "lucide-react";
import ImagePicker from "@/components/ImagePicker";

interface Props {
  sections: SectionSetting[];
  onChange: (sections: SectionSetting[]) => void;
  onSaveSection?: (index: number) => Promise<void>;
  savingSectionIndex?: number | null;
}

function SettingInput({ setting, value, onChange }: {
  setting: SettingDefinition;
  value: any;
  onChange: (val: any) => void;
}) {
  const id = `setting-${setting.key}`;
  const baseInput = "w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors";

  switch (setting.type) {
    case "color":
      return (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={value || setting.default as string}
            onChange={(e) => onChange(e.target.value)}
            className="w-9 h-9 p-0.5 border border-gray-200 rounded-lg cursor-pointer bg-white"
          />
          <input
            type="text"
            value={value || setting.default as string}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
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
          value={value || setting.default as string}
          onChange={(e) => onChange(e.target.value)}
          className={baseInput}
        >
          {setting.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
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
        <input
          type="number"
          value={value ?? setting.default as number}
          onChange={(e) => onChange(Number(e.target.value))}
          className={baseInput}
        />
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

function BlockEditor({ block, def, onChange }: {
  block: BlockSetting;
  def: NonNullable<ReturnType<typeof getSectionDefinition>>;
  onChange: (block: BlockSetting) => void;
}) {
  const blockDef = def.blocks?.find((b) => b.type === block.type);
  if (!blockDef) return null;

  return (
    <div className="ml-6 mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-2.5">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{blockDef.name}</p>
      {blockDef.settings.map((s) => (
        <div key={s.key}>
          <label className="block text-xs font-medium text-gray-600 mb-1">{s.label}</label>
          <SettingInput
            setting={s}
            value={block.settings[s.key]}
            onChange={(val) => onChange({ ...block, settings: { ...block.settings, [s.key]: val } })}
          />
        </div>
      ))}
    </div>
  );
}

function SectionEditorPanel({ section, def, onUpdate, onDelete, onSave, saving }: {
  section: SectionSetting;
  def: ReturnType<typeof getSectionDefinition>;
  onUpdate: (section: SectionSetting) => void;
  onDelete: () => void;
  onSave?: () => Promise<void>;
  saving?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  if (!def) {
    return (
      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-600">Section inconnue : {section.type}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Settings2 className="w-4 h-4 text-gray-400" />
          </button>
          <div>
            <p className="text-sm font-medium text-gray-900">{def.name}</p>
            <p className="text-xs text-gray-400">{section.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onSave && (
            <button
              onClick={onSave}
              disabled={saving}
              className="p-1.5 hover:bg-emerald-50 rounded-lg transition-colors"
              title="Enregistrer cette section"
            >
              {saving ? (
                <div className="w-4 h-4 border border-emerald-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4 text-emerald-500" />
              )}
            </button>
          )}
          <button
            onClick={() => onUpdate({ ...section, disabled: !section.disabled })}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            title={section.disabled ? "Afficher" : "Masquer"}
          >
            {section.disabled ? <EyeOff className="w-4 h-4 text-gray-300" /> : <Eye className="w-4 h-4 text-gray-400" />}
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 border-t border-gray-100 pt-3 space-y-3">
          {def.settings.map((s) => (
            <div key={s.key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{s.label}</label>
              <SettingInput
                setting={s}
                value={section.settings[s.key]}
                onChange={(val) => onUpdate({ ...section, settings: { ...section.settings, [s.key]: val } })}
              />
            </div>
          ))}

          {/* Block editor */}
          {def.blocks && def.blocks.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Blocs ({section.blocks?.length || 0})
              </p>
              {section.blocks?.map((block, bi) => (
                <BlockEditor
                  key={block.id}
                  block={block}
                  def={def}
                  onChange={(updated) => {
                    const newBlocks = [...(section.blocks || [])];
                    newBlocks[bi] = updated;
                    onUpdate({ ...section, blocks: newBlocks });
                  }}
                />
              ))}
              <button
                onClick={() => {
                  const blockDef = def.blocks?.[0];
                  if (!blockDef) return;
                  const newBlock: BlockSetting = {
                    id: `${section.id}-block-${Date.now()}`,
                    type: blockDef.type,
                    settings: Object.fromEntries(blockDef.settings.map((s) => [s.key, s.default])),
                  };
                  onUpdate({ ...section, blocks: [...(section.blocks || []), newBlock] });
                }}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Ajouter un bloc
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SectionEditor({ sections, onChange, onSaveSection, savingSectionIndex }: Props) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [pageFilter, setPageFilter] = useState<string>("all");

  const moveSection = (index: number, direction: "up" | "down") => {
    const newSections = [...sections];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= newSections.length) return;
    [newSections[index], newSections[target]] = [newSections[target], newSections[index]];
    onChange(newSections);
  };

  const addSection = (type: string) => {
    const newSection = createDefaultSection(type);
    if (newSection) {
      onChange([...sections, newSection]);
      setShowAddMenu(false);
    }
  };

  const updateSection = (index: number, updated: SectionSetting) => {
    const newSections = [...sections];
    newSections[index] = updated;
    onChange(newSections);
  };

  const deleteSection = (index: number) => {
    onChange(sections.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Sections de la page</h2>
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-colors"
            style={{ background: "var(--theme-primary, #059669)" }}
          >
            <Plus className="w-3.5 h-3.5" />
            Ajouter
          </button>
          {showAddMenu && (
            <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50 max-h-64 overflow-y-auto">
              {sectionRegistry
                .filter((s) => pageFilter === "all" || s.category === pageFilter)
                .map((s) => (
                  <button
                    key={s.type + '-' + Date.now()}
                    onClick={() => addSection(s.type)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium">{s.name}</span>
                    <p className="text-xs text-gray-400">{s.category}</p>
                  </button>
                ))}
              {sectionRegistry.length === 0 && (
                <p className="px-3 py-2 text-xs text-gray-400">Aucune section disponible</p>
              )}
            </div>
          )}
        </div>
      </div>

      {sections.map((section, i) => (
        <div key={section.id} className="flex items-start gap-2">
          <div className="flex flex-col gap-0.5 pt-2.5">
            <button
              onClick={() => moveSection(i, "up")}
              disabled={i === 0}
              className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-30 transition-colors"
            >
              <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
            </button>
            <button
              onClick={() => moveSection(i, "down")}
              disabled={i === sections.length - 1}
              className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-30 transition-colors"
            >
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
          <div className="flex-1">
            <SectionEditorPanel
              section={section}
              def={getSectionDefinition(section.type)}
              onUpdate={(updated) => updateSection(i, updated)}
              onDelete={() => deleteSection(i)}
              onSave={onSaveSection ? () => onSaveSection(i) : undefined}
              saving={savingSectionIndex === i}
            />
          </div>
        </div>
      ))}

      {sections.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <p className="text-sm text-gray-400">Aucune section. Cliquez sur "Ajouter" pour commencer.</p>
        </div>
      )}
    </div>
  );
}

/* PageSectionEditor — manages per-page section layouts */
interface PageEditorProps {
  pagesProp: PageConfig[];
  defaultSections: SectionSetting[];
  onChange: (pages: PageConfig[], defaultSections: SectionSetting[]) => void;
  onSaveSection?: (index: number) => Promise<void>;
  savingSectionIndex?: number | null;
}

export function PageSectionEditor({ pagesProp, defaultSections, onChange, onSaveSection, savingSectionIndex }: PageEditorProps) {
  const [activePageId, setActivePageId] = useState("__default__");
  const pages = pagesProp || [];

  const activePage = activePageId === "__default__"
    ? { id: "__default__", slug: "/", name: "Page d'accueil", sections: defaultSections }
    : pages.find((p) => p.id === activePageId);

  const setActiveSections = (sections: SectionSetting[]) => {
    if (activePageId === "__default__") {
      onChange(pages, sections);
    } else {
      onChange(
        pages.map((p) => (p.id === activePageId ? { ...p, sections } : p)),
        defaultSections
      );
    }
  };

  const addPage = () => {
    const name = `Page ${pages.length + 1}`;
    const slug = `/page-${pages.length + 1}`;
    const newPage: PageConfig = {
      id: `page-${Date.now()}`,
      slug,
      name,
      sections: [
        { id: "announcement", type: "announcement-bar", settings: { speed: 4000, background: "#059669", messages: [{ id: "a1", text: "🚚 Livraison gratuite !", url: "" }] } },
        { id: "header", type: "header", settings: { sticky: true, logo_url: "", logo_max_width: 140, navigation_style: "inline", menu_items: [{ label: "Accueil", url: "/" }, { label: "Produits", url: "/products" }] } },
        { id: "footer", type: "footer", settings: { show_payment_methods: true } },
      ],
    };
    onChange([...pages, newPage], defaultSections);
    setActivePageId(newPage.id);
  };

  const duplicatePage = () => {
    if (!activePage || activePageId === "__default__") return;
    const newPage: PageConfig = {
      ...activePage,
      id: `page-${Date.now()}`,
      name: `${activePage.name} (copie)`,
      slug: `${activePage.slug}-copy`,
      sections: activePage.sections.map((s) => ({
        ...s,
        id: `${s.type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        blocks: s.blocks?.map((b) => ({ ...b, id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` })),
      })),
    };
    onChange([...pages, newPage], defaultSections);
    setActivePageId(newPage.id);
  };

  const deletePage = (id: string) => {
    if (window.confirm("Supprimer cette page ?")) {
      onChange(pages.filter((p) => p.id !== id), defaultSections);
      setActivePageId("__default__");
    }
  };

  return (
    <div className="space-y-4">
      {/* Page selector */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-1 overflow-x-auto pb-1">
          <button
            onClick={() => setActivePageId("__default__")}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
              activePageId === "__default__"
                ? "bg-gray-900 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
            }`}
          >
            🏠 Accueil
          </button>
          {pages.map((p) => (
            <span key={p.id} className="flex items-center gap-0.5">
              <button
                onClick={() => setActivePageId(p.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                  activePageId === p.id
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                }`}
              >
                📄 {p.name}
              </button>
              {activePageId === p.id && (
                <button
                  onClick={() => deletePage(p.id)}
                  className="p-1 hover:bg-red-50 rounded-lg transition-colors"
                  title="Supprimer"
                >
                  <X className="w-3 h-3 text-red-400" />
                </button>
              )}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {activePageId !== "__default__" && (
            <button
              onClick={duplicatePage}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              title="Dupliquer la page"
            >
              <Copy className="w-4 h-4 text-gray-400" />
            </button>
          )}
          <button
            onClick={addPage}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            title="Nouvelle page"
          >
            <FilePlus className="w-3.5 h-3.5" />
            Page
          </button>
        </div>
      </div>

      {/* Active page editor */}
      {activePage ? (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {activePageId === "__default__"
                ? "Modifiez les sections de la page d'accueil"
                : `Modifiez les sections de : ${activePage.name} (/${activePage.slug})`}
            </p>
          </div>
          <SectionEditor
            key={activePage.id}
            sections={activePage.sections}
            onChange={setActiveSections}
            onSaveSection={onSaveSection}
            savingSectionIndex={savingSectionIndex}
          />
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <p className="text-sm text-gray-400">Sélectionnez ou créez une page</p>
        </div>
      )}
    </div>
  );
}
