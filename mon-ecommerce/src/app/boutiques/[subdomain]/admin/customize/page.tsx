"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { themes } from "@/lib/themes";
import {
  buildDefaultConfig,
  getPageSections,
  getPublishedConfig,
  getDraftConfig,
  publishDraft,
  SYSTEM_PAGES,
  getSystemPageId,
} from "@/lib/theme-config";
import type { ThemeConfig, SavedTheme, SectionSetting } from "@/lib/theme-config";
import { getSectionDefinition } from "@/lib/sections";
import { toast } from "sonner";
import {
  ArrowLeft,
  Monitor,
  Smartphone,
  Maximize2,
  Minimize2,
  Undo2,
  Redo2,
  Eye,
  EyeOff,
  Save,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Layers,
  Palette,
  ExternalLink,
  ChevronRight,
  GripVertical,
  Sparkles,
} from "lucide-react";

import SectionInspector from "@/components/customizer/SectionInspector";
import AddSectionModal from "@/components/customizer/AddSectionModal";
import ThemeSettingsPanel from "@/components/customizer/ThemeSettingsPanel";
import CustomizerCanvas from "@/components/customizer/CustomizerCanvas";
import { EditorContext } from "@/lib/editor-context";

export default function CustomizePage() {
  const { subdomain } = useParams<{ subdomain: string }>();

  // Database settings state
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [shopName, setShopName] = useState("");
  const [shopDescription, setShopDescription] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [shopCountry, setShopCountry] = useState("");
  const [defaultCurrency, setDefaultCurrency] = useState("EUR");
  const [selectedThemeId, setSelectedThemeId] = useState("classic");
  const [savedThemes, setSavedThemes] = useState<SavedTheme[]>([]);

  // Config & State
  const [themeConfig, setThemeConfig] = useState<ThemeConfig | null>(null);
  const [lastPublished, setLastPublished] = useState<ThemeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "unsaved" | "saving">("saved");

  // Undo / Redo history
  const [history, setHistory] = useState<ThemeConfig[]>([]);
  const [future, setFuture] = useState<ThemeConfig[]>([]);

  // Navigation / UI state
  const [activeTab, setActiveTab] = useState<"sections" | "theme">("sections");
  const [activePageSlug, setActivePageSlug] = useState<string>("/");
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [activeFieldKey, setActiveFieldKey] = useState<string | null>(null);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [hoveredField, setHoveredField] = useState<{
    sectionId: string;
    fieldKey: string;
    blockId?: string;
  } | null>(null);
  const [viewport, setViewport] = useState<"desktop" | "mobile" | "fullscreen">("desktop");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Auto-save refs
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveToDbRef = useRef<
    (savedConfig: ThemeConfig, isPublish: boolean, themes?: SavedTheme[]) => Promise<boolean>
  >(async () => false);
  const lastSaveRef = useRef<number>(0);

  // Load store settings & theme config
  const fetchSettings = useCallback(async () => {
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("shop_slug", subdomain)
      .maybeSingle();

    if (!error && data) {
      setSettingsId(data.id);
      setShopName(data.shop_name || "");
      setShopDescription(data.shop_description || "");
      setOwnerName(data.owner_name || "");
      setShopCountry(data.shop_country || "");
      setDefaultCurrency(data.default_currency || "EUR");
      setSelectedThemeId(data.theme_id || "classic");

      if (data.theme_config && typeof data.theme_config === "object" && data.theme_config.global?.colors) {
        const published = getPublishedConfig(data.theme_config);
        const draft = getDraftConfig(data.theme_config, published);
        setLastPublished(published);
        setThemeConfig(draft);
        if (data.theme_config.savedThemes) {
          setSavedThemes(data.theme_config.savedThemes);
        }
      } else if (data.theme_config?.__draft) {
        setLastPublished(buildDefaultConfig(data.theme_id || "classic"));
        setThemeConfig(data.theme_config.__draft as ThemeConfig);
        if (data.theme_config.savedThemes) {
          setSavedThemes(data.theme_config.savedThemes);
        }
      } else {
        const fallback = buildDefaultConfig(data.theme_id || "classic");
        setLastPublished(fallback);
        setThemeConfig(fallback);
      }
    }
    setLoading(false);
  }, [subdomain]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Save to database handler
  const saveToDb = async (savedConfig: ThemeConfig, isPublish: boolean, themesList?: SavedTheme[]) => {
    setSaving(true);
    const st = themesList ?? savedThemes;
    let configToSave: any;

    if (isPublish) {
      configToSave = { ...publishDraft(savedConfig) };
      setLastPublished(savedConfig);
    } else {
      const published = lastPublished || savedConfig;
      configToSave = { ...published, __draft: { ...savedConfig } };
    }

    if (st.length > 0) {
      configToSave.savedThemes = st;
    }

    const updateData: Record<string, any> = {
      shop_name: shopName,
      shop_description: shopDescription,
      owner_name: ownerName,
      shop_country: shopCountry,
      default_currency: defaultCurrency,
      theme_id: selectedThemeId,
      theme_config: configToSave,
      updated_at: new Date().toISOString(),
    };

    const brand = savedConfig.brand;
    if (brand?.logo && brand.logo.startsWith("data:")) {
      updateData.logo_url = brand.logo;
    }

    if (settingsId) {
      const { error } = await supabase.from("settings").update(updateData).eq("id", settingsId);
      if (error) {
        toast.error("Erreur de sauvegarde: " + error.message);
        setSaving(false);
        return false;
      }
    } else {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const { error } = await supabase
        .from("settings")
        .insert([{ ...updateData, shop_slug: subdomain, user_id: session?.user?.id }]);
      if (error) {
        toast.error("Erreur: " + error.message);
        setSaving(false);
        return false;
      }
    }

    setSaving(false);
    return true;
  };

  saveToDbRef.current = saveToDb;

  // Auto-save debounce (silent background draft save)
  useEffect(() => {
    if (!themeConfig || !settingsId) return;
    setSaveStatus("unsaved");

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);

    autoSaveTimer.current = setTimeout(async () => {
      const now = Date.now();
      if (now - lastSaveRef.current < 2500) return;
      lastSaveRef.current = now;
      setSaveStatus("saving");

      try {
        const ok = await saveToDbRef.current(themeConfig, false);
        if (ok) setSaveStatus("saved");
        else setSaveStatus("unsaved");
      } catch {
        setSaveStatus("unsaved");
      }
    }, 2500);

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [themeConfig, settingsId]);

  // Update config with Undo/Redo tracking
  const updateConfig = useCallback(
    (updater: (prev: ThemeConfig) => ThemeConfig) => {
      setThemeConfig((prev) => {
        const current = prev || buildDefaultConfig(selectedThemeId);
        // Record undo state
        setHistory((h) => [...h.slice(-20), current]);
        setFuture([]); // clear redo branch
        return updater(current);
      });
    },
    [selectedThemeId]
  );

  const handleUndo = useCallback(() => {
    if (history.length === 0 || !themeConfig) return;
    const previous = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setFuture((f) => [themeConfig, ...f]);
    setThemeConfig(previous);
  }, [history, themeConfig]);

  const handleRedo = useCallback(() => {
    if (future.length === 0 || !themeConfig) return;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setHistory((h) => [...h, themeConfig]);
    setThemeConfig(next);
  }, [future, themeConfig]);

  // Keyboard shortcuts (Cmd+Z, Cmd+Shift+Z, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      }
      if (e.key === "Escape") {
        if (isAddModalOpen) setIsAddModalOpen(false);
        else if (selectedSectionId) setSelectedSectionId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo, isAddModalOpen, selectedSectionId]);

  // Current config & sections for active page
  const config = useMemo(
    () => themeConfig || buildDefaultConfig(selectedThemeId),
    [themeConfig, selectedThemeId]
  );

  const currentSections = useMemo(() => {
    return getPageSections(config, activePageSlug);
  }, [config, activePageSlug]);

  // Set sections for active page
  const setSectionsForActivePage = useCallback(
    (newSections: SectionSetting[]) => {
      if (activePageSlug === "/") {
        updateConfig((prev) => ({ ...prev, sections: newSections }));
      } else {
        updateConfig((prev) => {
          const pages = [...(prev.pages || [])];
          const pageIndex = pages.findIndex((p) => p.slug === activePageSlug);
          if (pageIndex >= 0) {
            pages[pageIndex] = { ...pages[pageIndex], sections: newSections };
          } else {
            const sysPage = SYSTEM_PAGES.find((p) => p.slug === activePageSlug);
            pages.push({
              id: getSystemPageId(activePageSlug),
              slug: activePageSlug,
              name: sysPage?.name || activePageSlug,
              sections: newSections,
            });
          }
          return { ...prev, pages };
        });
      }
    },
    [activePageSlug, updateConfig]
  );

  // Reorder sections
  const handleMoveSection = (index: number, direction: "up" | "down") => {
    const list = [...currentSections];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= list.length) return;
    const temp = list[index];
    list[index] = list[target];
    list[target] = temp;
    setSectionsForActivePage(list);
  };

  // Toggle section visibility
  const handleToggleVisibility = (sectionId: string) => {
    const updated = currentSections.map((s) =>
      s.id === sectionId ? { ...s, disabled: !s.disabled } : s
    );
    setSectionsForActivePage(updated);
  };

  // Delete section
  const handleDeleteSection = (sectionId: string) => {
    const updated = currentSections.filter((s) => s.id !== sectionId);
    setSectionsForActivePage(updated);
    if (selectedSectionId === sectionId) setSelectedSectionId(null);
    toast.success("Section supprimée");
  };

  // Duplicate section
  const handleDuplicateSection = (sectionId: string) => {
    const target = currentSections.find((s) => s.id === sectionId);
    if (!target) return;
    const index = currentSections.findIndex((s) => s.id === sectionId);
    const newSection: SectionSetting = {
      ...target,
      id: `${target.type}-${Date.now()}`,
      settings: { ...target.settings },
      blocks: target.blocks?.map((b) => ({
        ...b,
        id: `${b.type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      })),
    };
    const updated = [...currentSections];
    updated.splice(index + 1, 0, newSection);
    setSectionsForActivePage(updated);
    setSelectedSectionId(newSection.id);
    toast.success("Section dupliquée !");
  };

  // Add new section from modal
  const handleAddSection = (newSection: SectionSetting) => {
    // Insert before footer if footer exists, else append
    const footerIndex = currentSections.findIndex((s) => s.type === "footer");
    const updated = [...currentSections];
    if (footerIndex >= 0) {
      updated.splice(footerIndex, 0, newSection);
    } else {
      updated.push(newSection);
    }
    setSectionsForActivePage(updated);
    setSelectedSectionId(newSection.id);
    toast.success(`Section "${getSectionDefinition(newSection.type)?.name || newSection.type}" ajoutée !`);
  };

  // Update selected section
  const handleUpdateSection = (updated: SectionSetting) => {
    const list = currentSections.map((s) => (s.id === updated.id ? updated : s));
    setSectionsForActivePage(list);
  };

  // Update specific text field (inline on preview or sidebar)
  const handleUpdateText = useCallback(
    (sectionId: string, fieldKey: string, newValue: string, blockId?: string) => {
      const list = currentSections.map((sec) => {
        if (sec.id !== sectionId) return sec;
        if (blockId && sec.blocks) {
          return {
            ...sec,
            blocks: sec.blocks.map((b) =>
              b.id === blockId
                ? { ...b, settings: { ...b.settings, [fieldKey]: newValue } }
                : b
            ),
          };
        }
        return {
          ...sec,
          settings: {
            ...sec.settings,
            [fieldKey]: newValue,
          },
        };
      });
      setSectionsForActivePage(list);
    },
    [currentSections, setSectionsForActivePage]
  );

  // Focus a specific field in the sidebar inspector
  const handleFocusField = useCallback((sectionId: string, fieldKey: string, blockId?: string) => {
    setSelectedSectionId(sectionId);
    setActiveTab("sections");
    setActiveFieldKey(fieldKey);
    setActiveBlockId(blockId || null);
  }, []);

  // Save draft manually
  const handleSaveDraft = async () => {
    const ok = await saveToDb(config, false);
    if (ok) toast.success("Brouillon enregistré !");
  };

  // Publish storefront
  const handlePublish = async () => {
    if (!window.confirm("Publier la boutique ? Cette version sera immédiatement visible par tous vos clients."))
      return;
    setPublishing(true);
    const ok = await saveToDb(config, true);
    if (ok) {
      toast.success("Félicitations ! Votre boutique est publiée et en direct !");
      setSaveStatus("saved");
    }
    setPublishing(false);
  };

  // Open live preview in new tab
  const openLivePreview = () => {
    const host = window.location.host;
    const protocol = window.location.protocol;
    let previewUrl = "";
    if (host.includes("localhost") || host.includes("lvh.me")) {
      const port = host.split(":")[1] ? `:${host.split(":")[1]}` : "";
      previewUrl = `${protocol}//${subdomain}.localhost${port}?preview=1`;
    } else {
      const parts = host.split(".");
      const apex = parts.length > 2 ? parts.slice(-2).join(".") : host;
      previewUrl = `${protocol}//${subdomain}.${apex}?preview=1`;
    }
    window.open(previewUrl, "_blank");
  };

  // Header & Footer sections vs Template sections
  const headerSection = currentSections.find((s) => s.type === "header");
  const announcementSection = currentSections.find((s) => s.type === "announcement-bar");
  const footerSection = currentSections.find((s) => s.type === "footer");
  const templateSections = currentSections.filter(
    (s) => !["header", "announcement-bar", "footer"].includes(s.type)
  );

  const selectedSection = useMemo(() => {
    if (!selectedSectionId) return null;
    return currentSections.find((s) => s.id === selectedSectionId) || null;
  }, [currentSections, selectedSectionId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center gap-3 z-50">
        <div className="w-10 h-10 border-3 border-gray-200 border-t-emerald-600 rounded-full animate-spin" />
        <p className="text-xs font-semibold text-gray-500">
          Chargement du studio de personnalisation...
        </p>
      </div>
    );
  }

  return (
    <EditorContext.Provider
      value={{
        isEditor: true,
        selectedSectionId,
        activeFieldKey,
        activeBlockId,
        onUpdateText: handleUpdateText,
        onFocusField: handleFocusField,
        hoveredField,
        setHoveredField,
      }}
    >
      <div className="fixed inset-0 bg-gray-100 flex flex-col overflow-hidden z-40 select-none">
      {/* ──────────────────────────────────────────────────────── */}
      {/*  TOP BAR — SHOPIFY DAWN STYLE                           */}
      {/* ──────────────────────────────────────────────────────── */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-3 sm:px-4 shrink-0 z-30 shadow-xs">
        {/* Left: Exit & Page selector */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href={`/boutiques/${subdomain}/admin`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
            title="Quitter et retourner au tableau de bord"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden md:inline">Tableau de bord</span>
          </Link>

          <div className="h-5 w-px bg-gray-200" />

          {/* Shop Name & Status Badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-gray-900 tracking-tight truncate max-w-[140px] sm:max-w-none">
              {shopName || subdomain}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              En direct
            </span>
          </div>

          <div className="h-5 w-px bg-gray-200 hidden sm:block" />

          {/* Page Dropdown Selector */}
          <div className="relative">
            <select
              value={activePageSlug}
              onChange={(e) => {
                setActivePageSlug(e.target.value);
                setSelectedSectionId(null);
              }}
              className="bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 text-xs font-bold py-1.5 px-3 rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
            >
              <option value="/">Page d&apos;accueil</option>
              <option value="/products/[slug]">Fiche Produit</option>
              <option value="/products">Catalogue / Produits</option>
              <option value="/wishlist">Favoris (Wishlist)</option>
              <option value="/thank-you">Page de remerciement</option>
            </select>
          </div>
        </div>

        {/* Center: Viewport Switcher & Undo / Redo */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setViewport("desktop")}
            className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewport === "desktop"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
            title="Aperçu Ordinateur (Desktop)"
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewport("mobile")}
            className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewport === "mobile"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
            title="Aperçu Mobile (iPhone / Smartphone)"
          >
            <Smartphone className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewport(viewport === "fullscreen" ? "desktop" : "fullscreen")}
            className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewport === "fullscreen"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
            title="Plein écran (Masquer les panneaux)"
          >
            {viewport === "fullscreen" ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <div className="h-4 w-px bg-gray-300 mx-1" />

          {/* Undo / Redo */}
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            className="p-1.5 text-gray-500 hover:text-gray-900 disabled:opacity-30 rounded-lg transition-colors"
            title="Annuler (Cmd+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRedo}
            disabled={future.length === 0}
            className="p-1.5 text-gray-500 hover:text-gray-900 disabled:opacity-30 rounded-lg transition-colors"
            title="Rétablir (Cmd+Shift+Z)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Save Status, Live Preview & Publish */}
        <div className="flex items-center gap-2">
          {/* Status Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs font-medium mr-1">
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1 text-emerald-600">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Enregistré
              </span>
            )}
            {saveStatus === "saving" && (
              <span className="flex items-center gap-1 text-blue-600">
                <span className="w-2 h-2 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                Sauvegarde...
              </span>
            )}
            {saveStatus === "unsaved" && (
              <span className="flex items-center gap-1 text-amber-500">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Modifié
              </span>
            )}
          </div>

          {/* External Live Preview */}
          <button
            onClick={openLivePreview}
            className="hidden sm:inline-flex items-center gap-1 px-3 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
            title="Voir la vraie boutique dans un nouvel onglet"
          >
            <Eye className="w-3.5 h-3.5" />
            Aperçu
            <ExternalLink className="w-3 h-3 text-gray-400 ml-0.5" />
          </button>

          {/* Save Draft */}
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors disabled:opacity-50 shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "..." : "Brouillon"}
          </button>

          {/* Publish Button (Shopify Green) */}
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-emerald-200 disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {publishing ? "Publication..." : "Publier"}
          </button>
        </div>
      </header>

      {/* ──────────────────────────────────────────────────────── */}
      {/*  STUDIO WORKSPACE: LEFT INSPECTOR + LIVE CANVAS         */}
      {/* ──────────────────────────────────────────────────────── */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* LEFT PANEL (SHOPIFY INSPECTOR) */}
        {viewport !== "fullscreen" && (
          <aside className="w-80 sm:w-96 bg-white border-r border-gray-200 flex flex-col shrink-0 z-20 shadow-sm">
            {/* If a section is selected, show its SectionInspector */}
            {selectedSection ? (
              <SectionInspector
                section={selectedSection}
                onUpdateSection={handleUpdateSection}
                onDuplicateSection={() => handleDuplicateSection(selectedSection.id)}
                onDeleteSection={() => handleDeleteSection(selectedSection.id)}
                onBack={() => setSelectedSectionId(null)}
              />
            ) : (
              <>
                {/* Mode Tabs : Sections vs Paramètres du thème */}
                <div className="flex border-b border-gray-200 bg-gray-50/70 p-1.5 gap-1 shrink-0">
                  <button
                    onClick={() => setActiveTab("sections")}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                      activeTab === "sections"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    Sections
                  </button>
                  <button
                    onClick={() => setActiveTab("theme")}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                      activeTab === "theme"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <Palette className="w-3.5 h-3.5 text-purple-600" />
                    Thème & Design
                  </button>
                </div>

                {/* TAB 1: SECTIONS TREE OUTLINE */}
                {activeTab === "sections" && (
                  <div className="flex-1 overflow-y-auto p-4 space-y-5">
                    {/* EN-TÊTE (HEADER GROUP) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                          En-tête
                        </span>
                      </div>

                      {/* Barre d'annonce */}
                      {announcementSection && (
                        <div
                          onClick={() => setSelectedSectionId(announcementSection.id)}
                          className="flex items-center justify-between p-2.5 bg-gray-50/80 hover:bg-emerald-50/50 hover:border-emerald-300 border border-gray-200/80 rounded-xl cursor-pointer transition-all group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                            <span className="text-xs font-bold text-gray-800 truncate">
                              Barre d&apos;annonce
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleVisibility(announcementSection.id);
                            }}
                            className="p-1 text-gray-400 hover:text-gray-700 rounded"
                            title={announcementSection.disabled ? "Afficher" : "Masquer"}
                          >
                            {announcementSection.disabled ? (
                              <EyeOff className="w-3.5 h-3.5 text-amber-500" />
                            ) : (
                              <Eye className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}

                      {/* En-tête principal */}
                      {headerSection && (
                        <div
                          onClick={() => setSelectedSectionId(headerSection.id)}
                          className="flex items-center justify-between p-2.5 bg-gray-50/80 hover:bg-emerald-50/50 hover:border-emerald-300 border border-gray-200/80 rounded-xl cursor-pointer transition-all group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                            <span className="text-xs font-bold text-gray-800 truncate">
                              En-tête (Logo, Menu, Panier)
                            </span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      )}
                    </div>

                    {/* CORPS DE PAGE (TEMPLATE SECTIONS) */}
                    <div className="space-y-2 pt-2 border-t border-gray-100">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                          Modèle de page ({templateSections.length})
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">
                          Glissez ou cliquez pour éditer
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {templateSections.map((sec, idx) => {
                          const def = getSectionDefinition(sec.type);
                          const overallIndex = currentSections.findIndex((s) => s.id === sec.id);

                          return (
                            <div
                              key={sec.id}
                              onClick={() => setSelectedSectionId(sec.id)}
                              className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                                sec.disabled
                                  ? "bg-gray-50/50 border-gray-200 text-gray-400"
                                  : "bg-white hover:bg-gray-50 border-gray-200 hover:border-emerald-400 text-gray-800 shadow-xs"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <GripVertical className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 shrink-0 cursor-grab" />
                                <span className="text-xs font-bold truncate">
                                  {def?.name || sec.type}
                                </span>
                              </div>

                              <div
                                className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={() => handleMoveSection(overallIndex, "up")}
                                  disabled={idx === 0}
                                  className="p-1 hover:bg-gray-200 rounded disabled:opacity-20 text-gray-500"
                                  title="Monter"
                                >
                                  <ChevronUp className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleMoveSection(overallIndex, "down")}
                                  disabled={idx === templateSections.length - 1}
                                  className="p-1 hover:bg-gray-200 rounded disabled:opacity-20 text-gray-500"
                                  title="Descendre"
                                >
                                  <ChevronDown className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => handleToggleVisibility(sec.id)}
                                  className="p-1 hover:bg-gray-200 rounded text-gray-500"
                                  title={sec.disabled ? "Afficher" : "Masquer"}
                                >
                                  {sec.disabled ? (
                                    <EyeOff className="w-3 h-3 text-amber-500" />
                                  ) : (
                                    <Eye className="w-3 h-3" />
                                  )}
                                </button>
                                <button
                                  onClick={() => handleDeleteSection(sec.id)}
                                  className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {templateSections.length === 0 && (
                          <div className="p-4 text-center border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                            <p className="text-xs text-gray-400">
                              Aucune section sur cette page pour le moment.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* + Ajouter une section */}
                      <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="w-full mt-3 py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 text-emerald-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        <Plus className="w-4 h-4" />
                        Ajouter une section
                      </button>
                    </div>

                    {/* PIED DE PAGE (FOOTER GROUP) */}
                    <div className="space-y-1.5 pt-2 border-t border-gray-100">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                          Pied de page
                        </span>
                      </div>

                      {footerSection && (
                        <div
                          onClick={() => setSelectedSectionId(footerSection.id)}
                          className="flex items-center justify-between p-2.5 bg-gray-50/80 hover:bg-emerald-50/50 hover:border-emerald-300 border border-gray-200/80 rounded-xl cursor-pointer transition-all group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-gray-500 shrink-0" />
                            <span className="text-xs font-bold text-gray-800 truncate">
                              Pied de page (Liens, Copyright)
                            </span>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: THEME SETTINGS (PRESETS, COLORS, FONTS, BRAND) */}
                {activeTab === "theme" && (
                  <ThemeSettingsPanel
                    config={config}
                    shopName={shopName}
                    onUpdateConfig={updateConfig}
                    onUpdateShopName={setShopName}
                  />
                )}
              </>
            )}
          </aside>
        )}

        {/* CENTER / RIGHT AREA: LIVE STOREFRONT CANVAS */}
        <CustomizerCanvas
          config={config}
          sections={currentSections}
          shopName={shopName}
          subdomain={subdomain}
          viewport={viewport}
          selectedSectionId={selectedSectionId}
          onSelectSection={(id) => setSelectedSectionId(id)}
          onMoveSection={handleMoveSection}
          onToggleVisibility={handleToggleVisibility}
          onDeleteSection={handleDeleteSection}
          onNavigatePage={(slug) => {
            setActivePageSlug(slug);
            setSelectedSectionId(null);
          }}
        />
      </div>

      {/* Add Section Modal / Drawer */}
      <AddSectionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddSection={handleAddSection}
      />
    </div>
  </EditorContext.Provider>
  );
}
