"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { themes as officialPresets } from "@/lib/themes";
import {
  buildDefaultConfig,
  getPublishedConfig,
  publishDraft,
} from "@/lib/theme-config";
import type { ThemeConfig, SavedTheme } from "@/lib/theme-config";
import { toast } from "sonner";
import {
  Palette,
  Sparkles,
  ExternalLink,
  Eye,
  Copy,
  Download,
  Upload,
  Trash2,
  Edit3,
  Check,
  CheckCircle2,
  AlertCircle,
  Monitor,
  Smartphone,
  RefreshCw,
  Plus,
  X,
  Layers,
  FileText,
  Code,
  MoreVertical,
  Archive,
  ArrowRight,
  ShieldCheck,
  FileJson,
  Lock,
  Maximize2,
  MousePointerClick,
  Megaphone,
} from "lucide-react";

export default function ThemesHubPage() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const router = useRouter();

  // Shop & DB State
  const [loading, setLoading] = useState(true);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [shopName, setShopName] = useState("");
  const [currentThemeId, setCurrentThemeId] = useState("classic");
  const [currentThemeName, setCurrentThemeName] = useState("Thème Principal");
  const [currentThemeConfig, setCurrentThemeConfig] = useState<ThemeConfig | null>(null);
  const [savedThemes, setSavedThemes] = useState<SavedTheme[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  // Preview State
  const [previewViewport, setPreviewViewport] = useState<"desktop" | "mobile">("desktop");
  const [previewPath, setPreviewPath] = useState<string>("/");
  const [iframeKey, setIframeKey] = useState(0);
  const [iframeLoading, setIframeLoading] = useState(false);
  const [isInteractive, setIsInteractive] = useState(false);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [previewWidth, setPreviewWidth] = useState<number>(540);

  useEffect(() => {
    if (!previewContainerRef.current) return;
    const update = () => {
      if (previewContainerRef.current) {
        setPreviewWidth(previewContainerRef.current.clientWidth);
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(previewContainerRef.current);
    return () => ro.disconnect();
  }, [previewViewport]);

  // Modals & Action States
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeMenuThemeId, setActiveMenuThemeId] = useState<string | null>(null);

  // Import / Add Modal
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importTab, setImportTab] = useState<"presets" | "upload">("presets");
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Rename Modal
  const [renameModal, setRenameModal] = useState<{
    open: boolean;
    themeId: string | null; // null = active theme
    currentName: string;
    newName: string;
  }>({ open: false, themeId: null, currentName: "", newName: "" });

  // Delete Confirm Modal
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    theme: SavedTheme | null;
  }>({ open: false, theme: null });

  // Publish Confirm Modal
  const [publishModal, setPublishModal] = useState<{
    open: boolean;
    theme: SavedTheme | null;
  }>({ open: false, theme: null });

  // Preview Drawer/Modal
  const [previewModal, setPreviewModal] = useState<{
    open: boolean;
    theme: SavedTheme | null;
    viewport: "desktop" | "mobile";
  }>({ open: false, theme: null, viewport: "desktop" });

  // Import Success Dialog
  const [importSuccessModal, setImportSuccessModal] = useState<{
    open: boolean;
    theme: SavedTheme | null;
  }>({ open: false, theme: null });

  // Fetch shop settings & themes
  const fetchThemesData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/theme-config?shopSlug=${subdomain}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSettingsId(data.settingsId);
          setShopName(data.shopName || subdomain);
          setCurrentThemeId(data.themeId || "classic");
          setLastUpdated(
            data.updatedAt
              ? new Date(data.updatedAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Récemment"
          );
          if (data.publishedConfig) {
            setCurrentThemeConfig(data.publishedConfig);
          }
          setCurrentThemeName(data.themeName || `${data.shopName || subdomain} - Principal`);
          setSavedThemes(data.savedThemes || []);
          setLoading(false);
          return;
        }
      }

      // Fallback
      const { data, error } = await supabase
        .from("settings")
        .select("id, shop_name, shop_slug, theme_id, theme_config, updated_at")
        .eq("shop_slug", subdomain)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettingsId(data.id);
        setShopName(data.shop_name || subdomain);
        setCurrentThemeId(data.theme_id || "classic");
        setLastUpdated(
          data.updated_at
            ? new Date(data.updated_at).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Récemment"
        );

        const rawConfig = data.theme_config;
        if (rawConfig && typeof rawConfig === "object" && rawConfig.global?.colors) {
          const published = getPublishedConfig(rawConfig);
          setCurrentThemeConfig(published);
          setCurrentThemeName(rawConfig.themeName || `${data.shop_name || subdomain} - Principal`);
          setSavedThemes(rawConfig.savedThemes || []);
        } else {
          const fallback = buildDefaultConfig(data.theme_id || "classic");
          setCurrentThemeConfig(fallback);
          setCurrentThemeName(`Thème ${data.theme_id || "Classique"}`);
          setSavedThemes(rawConfig?.savedThemes || []);
        }
      }
    } catch (e: any) {
      console.error("[ThemesHub] Erreur chargement:", e);
      toast.error("Erreur lors du chargement des thèmes");
    } finally {
      setLoading(false);
    }
  }, [subdomain]);

  useEffect(() => {
    fetchThemesData();
  }, [fetchThemesData]);

  // Close open dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-menu-container]")) {
        setActiveMenuThemeId(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Save changes via API Route (with admin privileges)
  const updateDatabaseConfig = async (
    newPublishedConfig: ThemeConfig,
    newSavedThemes: SavedTheme[],
    newThemeName: string,
    newThemeId?: string
  ) => {
    try {
      const res = await fetch("/api/admin/theme-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopSlug: subdomain,
          themeConfig: newPublishedConfig,
          savedThemes: newSavedThemes,
          themeName: newThemeName,
          themeId: newThemeId,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Erreur de sauvegarde");
      }

      setLastUpdated("À l'instant");
      setIframeKey((prev) => prev + 1);
      return true;
    } catch (e: any) {
      console.error("[ThemesHub] updateDatabaseConfig error:", e);
      toast.error("Erreur de sauvegarde : " + e.message);
      return false;
    }
  };

  // 1. Action: Publier un thème de la bibliothèque
  const handlePublishTheme = async (themeToPublish: SavedTheme) => {
    setActionLoading(themeToPublish.id);

    try {
      const res = await fetch("/api/admin/theme-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopSlug: subdomain,
          publishThemeId: themeToPublish.id,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Erreur lors de la publication");
      }

      setCurrentThemeConfig(data.publishedConfig);
      setCurrentThemeName(data.themeName);
      setSavedThemes(data.savedThemes || []);
      setPublishModal({ open: false, theme: null });
      setImportSuccessModal({ open: false, theme: null });
      setPreviewModal({ open: false, theme: null, viewport: "desktop" });
      setIframeKey((prev) => prev + 1);

      toast.success(`Le thème « ${themeToPublish.name} » est maintenant en direct !`, {
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
      });
    } catch (e: any) {
      toast.error("Erreur de publication : " + e.message);
    } finally {
      setActionLoading(null);
    }
  };

  // 2. Action: Dupliquer un thème (actif ou de la bibliothèque)
  const handleDuplicateTheme = async (themeId?: string) => {
    const isCurrent = !themeId || themeId === "current";
    const sourceConfig = isCurrent ? currentThemeConfig : savedThemes.find((t) => t.id === themeId)?.config;
    const sourceName = isCurrent ? currentThemeName : savedThemes.find((t) => t.id === themeId)?.name;

    if (!sourceConfig || !currentThemeConfig) return;
    setActionLoading(themeId || "current");

    try {
      const copy: SavedTheme = {
        id: `theme_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: `Copie de ${sourceName} (${new Date().toLocaleDateString("fr-FR")})`,
        config: JSON.parse(JSON.stringify(sourceConfig)),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const newSavedThemes = [copy, ...savedThemes];
      const success = await updateDatabaseConfig(
        currentThemeConfig,
        newSavedThemes,
        currentThemeName
      );

      if (success) {
        setSavedThemes(newSavedThemes);
        toast.success(`Thème dupliqué dans votre bibliothèque !`);
      }
    } catch (e: any) {
      toast.error("Erreur lors de la duplication : " + e.message);
    } finally {
      setActionLoading(null);
      setActiveMenuThemeId(null);
    }
  };

  // 3. Action: Renommer un thème
  const handleSaveRename = async () => {
    const name = renameModal.newName.trim();
    if (!name || !currentThemeConfig) {
      toast.error("Le nom du thème ne peut pas être vide");
      return;
    }

    try {
      if (renameModal.themeId === null) {
        // Renommer thème actif
        const success = await updateDatabaseConfig(
          currentThemeConfig,
          savedThemes,
          name
        );
        if (success) {
          setCurrentThemeName(name);
          toast.success("Nom du thème mis à jour");
        }
      } else {
        // Renommer thème dans la bibliothèque
        const newSavedThemes = savedThemes.map((t) =>
          t.id === renameModal.themeId ? { ...t, name, updatedAt: new Date().toISOString() } : t
        );
        const success = await updateDatabaseConfig(
          currentThemeConfig,
          newSavedThemes,
          currentThemeName
        );
        if (success) {
          setSavedThemes(newSavedThemes);
          toast.success("Thème renommé");
        }
      }
      setRenameModal({ open: false, themeId: null, currentName: "", newName: "" });
    } catch (e: any) {
      toast.error("Erreur : " + e.message);
    }
  };

  // 4. Action: Supprimer un thème de la bibliothèque
  const handleDeleteTheme = async (themeId: string) => {
    if (!currentThemeConfig) return;
    setActionLoading(themeId);

    try {
      const newSavedThemes = savedThemes.filter((t) => t.id !== themeId);
      const success = await updateDatabaseConfig(
        currentThemeConfig,
        newSavedThemes,
        currentThemeName
      );

      if (success) {
        setSavedThemes(newSavedThemes);
        setDeleteModal({ open: false, theme: null });
        toast.success("Thème supprimé de votre bibliothèque");
      }
    } catch (e: any) {
      toast.error("Erreur lors de la suppression : " + e.message);
    } finally {
      setActionLoading(null);
    }
  };

  // 5. Action: Exporter un thème au format JSON
  const handleExportTheme = (config: ThemeConfig, name: string) => {
    try {
      const exportPayload = {
        themeName: name,
        exportedAt: new Date().toISOString(),
        version: "2.0",
        shopSlug: subdomain,
        config,
      };

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cleanSlug = (name || "theme").toLowerCase().replace(/[^a-z0-9]/g, "-");
      a.download = `shopeazy-${subdomain}-${cleanSlug}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Thème « ${name} » exporté avec succès !`);
      setActiveMenuThemeId(null);
    } catch (e: any) {
      toast.error("Erreur lors de l'export : " + e.message);
    }
  };

  // 6. Action: Ajouter un thème officiel ShopEazy
  const handleAddPresetTheme = async (presetId: string) => {
    if (!currentThemeConfig) return;
    const preset = officialPresets.find((p) => p.id === presetId);
    if (!preset) return;

    setActionLoading(`preset_${presetId}`);

    try {
      const newTheme: SavedTheme = {
        id: `theme_${Date.now()}_${preset.id}`,
        name: `ShopEazy ${preset.name}`,
        config: buildDefaultConfig(preset.id),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const newSavedThemes = [newTheme, ...savedThemes];
      const success = await updateDatabaseConfig(
        currentThemeConfig,
        newSavedThemes,
        currentThemeName
      );

      if (success) {
        setSavedThemes(newSavedThemes);
        setImportModalOpen(false);
        toast.success(`Thème « ShopEazy ${preset.name} » ajouté à votre bibliothèque !`);
      }
    } catch (e: any) {
      toast.error("Erreur : " + e.message);
    } finally {
      setActionLoading(null);
    }
  };

  // 7. Action: Importer un fichier (JSON ou ZIP Shopify)
  const handleProcessImportFile = async (file: File) => {
    if (!currentThemeConfig) return;
    setIsUploading(true);

    try {
      if (file.name.endsWith(".json")) {
        // Traitement fichier JSON ShopEazy
        const text = await file.text();
        const json = JSON.parse(text);
        const importedConfig: ThemeConfig = json.config || json;

        if (!importedConfig.global?.colors || !importedConfig.sections) {
          throw new Error("Le fichier JSON ne respecte pas le format de thème ShopEazy valide.");
        }

        const importedName = json.themeName || file.name.replace(/\.[^/.]+$/, "") || "Thème importé";
        const newTheme: SavedTheme = {
          id: `theme_${Date.now()}_imported`,
          name: importedName,
          config: importedConfig,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const newSavedThemes = [newTheme, ...savedThemes];
        const success = await updateDatabaseConfig(
          currentThemeConfig,
          newSavedThemes,
          currentThemeName
        );

        if (success) {
          setSavedThemes(newSavedThemes);
          setImportModalOpen(false);
          setImportSuccessModal({
            open: true,
            theme: newTheme,
          });
        }
      } else if (file.name.endsWith(".zip")) {
        // Traitement fichier ZIP Shopify via /api/shopify/import-upload
        const formData = new FormData();
        formData.append("file", file);
        formData.append("shopSlug", subdomain);

        toast.info("Analyse du thème Shopify en cours...");
        const res = await fetch("/api/shopify/import-upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || "Erreur lors du traitement du fichier ZIP.");
        }

        const importedName =
          data.themeName ||
          file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ") ||
          "Thème Shopify importé";

        const newTheme: SavedTheme = {
          id: `theme_${Date.now()}_shopify`,
          name: importedName,
          config: data.themeConfig,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const newSavedThemes = [newTheme, ...savedThemes];
        const success = await updateDatabaseConfig(
          currentThemeConfig,
          newSavedThemes,
          currentThemeName
        );

        if (success) {
          setSavedThemes(newSavedThemes);
          setImportModalOpen(false);
          setImportSuccessModal({
            open: true,
            theme: newTheme,
          });
        }
      } else {
        throw new Error("Format non pris en charge. Veuillez sélectionner un fichier .zip ou .json");
      }
    } catch (e: any) {
      console.error("[ThemesHub] Erreur import:", e);
      toast.error(e.message || "Erreur lors de l'import");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessImportFile(e.dataTransfer.files[0]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <div className="w-9 h-9 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-medium text-gray-500">Chargement de vos thèmes...</p>
      </div>
    );
  }

  const currentColors = currentThemeConfig?.global.colors;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* ── 1. Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shadow-sm">
              <Palette className="w-4 h-4" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              Thèmes & Personnalisation
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500">
            Gérez l'apparence de votre boutique. Personnalisez votre thème en direct ou préparez des thèmes en brouillon.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href={`/boutiques/${subdomain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
          >
            <span>Voir ma boutique</span>
            <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
          </a>

          <button
            onClick={() => {
              setImportTab("presets");
              setImportModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un thème</span>
          </button>
        </div>
      </div>

      {/* ── 2. Thème Actuel (En ligne) ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700">
              Thème actuel en ligne
            </h2>
          </div>
          <span className="text-xs text-gray-500">
            Dernière mise à jour : <strong className="text-gray-700">{lastUpdated}</strong>
          </span>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden hover:border-gray-300 transition-all">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
            {/* Visual Preview / Realistic Mockup Frame */}
            <div className="lg:col-span-7 xl:col-span-7 p-4 sm:p-5 bg-gradient-to-b from-gray-50/90 to-gray-100/50 flex flex-col justify-between space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                {/* Viewport switch */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-2xs">
                  <button
                    onClick={() => {
                      setPreviewViewport("desktop");
                      setIframeLoading(true);
                    }}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                      previewViewport === "desktop"
                        ? "bg-emerald-50 text-emerald-700 shadow-2xs"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Bureau (1200px)</span>
                  </button>
                  <button
                    onClick={() => {
                      setPreviewViewport("mobile");
                      setIframeLoading(true);
                    }}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                      previewViewport === "mobile"
                        ? "bg-emerald-50 text-emerald-700 shadow-2xs"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Mobile (iPhone)</span>
                  </button>
                </div>

                {/* Page Switcher */}
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-2xs text-[11px]">
                  <button
                    onClick={() => {
                      setPreviewPath("/");
                      setIframeLoading(true);
                    }}
                    className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                      previewPath === "/" ? "bg-gray-100 text-gray-900 font-bold" : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    Accueil
                  </button>
                  <button
                    onClick={() => {
                      setPreviewPath("/products");
                      setIframeLoading(true);
                    }}
                    className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                      previewPath === "/products" ? "bg-gray-100 text-gray-900 font-bold" : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    Produits
                  </button>
                  <button
                    onClick={() => {
                      setPreviewPath("/wishlist");
                      setIframeLoading(true);
                    }}
                    className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                      previewPath === "/wishlist" ? "bg-gray-100 text-gray-900 font-bold" : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    Favoris
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsInteractive(!isInteractive)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                      isInteractive
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-white text-gray-600 border border-gray-200 hover:text-gray-900"
                    }`}
                    title={isInteractive ? "Désactiver le mode interactif" : "Activer les clics et le défilement dans l'aperçu"}
                  >
                    <MousePointerClick className="w-3.5 h-3.5" />
                    <span>{isInteractive ? "Interactif (Activé)" : "Interagir"}</span>
                  </button>

                  <button
                    onClick={() => {
                      setIframeLoading(true);
                      setIframeKey((k) => k + 1);
                    }}
                    title="Rafraîchir l'aperçu"
                    className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${iframeLoading ? "animate-spin text-emerald-600" : ""}`} />
                  </button>

                  <button
                    onClick={() =>
                      setPreviewModal({
                        open: true,
                        theme: {
                          id: "current_live",
                          name: currentThemeName,
                          config: currentThemeConfig!,
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString(),
                        },
                        viewport: previewViewport,
                      })
                    }
                    title="Agrandir en plein écran"
                    className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Realistic Mockup Container */}
              <div
                ref={previewContainerRef}
                className="w-full rounded-2xl overflow-hidden border border-gray-300/80 shadow-sm bg-white flex flex-col"
              >
                {previewViewport === "desktop" ? (
                  <>
                    {/* Mac Browser Top Bar */}
                    <div className="bg-gray-100/90 border-b border-gray-200 px-3 py-2 flex items-center justify-between text-xs select-none">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-400 border border-rose-500/30" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-amber-500/30" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-emerald-500/30" />
                      </div>

                      <div className="flex items-center gap-1.5 px-3 py-0.5 bg-white border border-gray-200 rounded-lg text-[10px] text-gray-600 font-mono shadow-2xs max-w-[240px] truncate">
                        <Lock className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{subdomain}.shopeazy.com{previewPath !== "/" ? previewPath : ""}</span>
                      </div>

                      <div className="text-[10px] font-semibold text-gray-400">
                        1200px
                      </div>
                    </div>

                    {/* Scaled Desktop Viewport */}
                    <div
                      className="relative w-full overflow-hidden bg-gray-50"
                      style={{ height: Math.max(260, Math.round(760 * Math.min(1, Math.max(0.25, (previewWidth || 540) / 1200)))) }}
                    >
                      {iframeLoading && (
                        <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-xs flex items-center justify-center">
                          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                            <span>Chargement de la boutique...</span>
                          </div>
                        </div>
                      )}

                      <div
                        style={{
                          width: 1200,
                          height: 760,
                          transform: `scale(${Math.min(1, Math.max(0.25, (previewWidth || 540) / 1200))})`,
                          transformOrigin: "top left",
                        }}
                      >
                        <iframe
                          key={`${iframeKey}-${previewPath}-desktop`}
                          src={`/boutiques/${subdomain}${previewPath}?embed=1`}
                          title="Aperçu Bureau"
                          className={`w-full h-full border-0 select-none bg-white ${
                            isInteractive ? "pointer-events-auto" : "pointer-events-none"
                          }`}
                          loading="lazy"
                          onLoad={() => setIframeLoading(false)}
                        />
                      </div>

                      {/* Click overlay to expand (only when not in interactive mode) */}
                      {!isInteractive && (
                        <div
                          onClick={() =>
                            setPreviewModal({
                              open: true,
                              theme: {
                                id: "current_live",
                                name: currentThemeName,
                                config: currentThemeConfig!,
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString(),
                              },
                              viewport: "desktop",
                            })
                          }
                          className="absolute inset-0 bg-gray-900/0 hover:bg-gray-900/25 transition-all flex items-center justify-center opacity-0 hover:opacity-100 group cursor-pointer backdrop-blur-[1px]"
                        >
                          <span className="px-4 py-2 bg-white text-gray-900 font-bold text-xs rounded-xl shadow-xl flex items-center gap-2 transform group-hover:scale-105 transition-transform">
                            <Eye className="w-4 h-4 text-emerald-600" />
                            <span>Tester l'aperçu interactif ↗</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  /* Realistic iPhone Mockup Frame (Mobile View) */
                  <div className="py-4 px-2 flex items-center justify-center bg-gradient-to-b from-gray-100 to-gray-200/80 min-h-[360px]">
                    <div
                      className="relative rounded-[38px] p-2 bg-slate-900 border-[3.5px] border-slate-700 shadow-2xl flex flex-col items-center"
                      style={{ width: Math.round(375 * (340 / 720)) + 20, height: 340 + 20 }}
                    >
                      {/* Dynamic Island Pill */}
                      <div className="w-14 h-3 bg-black rounded-full mb-1 shrink-0 flex items-center justify-center shadow-inner">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-800 ml-auto mr-2" />
                      </div>

                      {/* Mobile Viewport Screen */}
                      <div
                        className="rounded-[26px] overflow-hidden bg-white shadow-inner relative"
                        style={{ width: Math.round(375 * (340 / 720)), height: 340 }}
                      >
                        {iframeLoading && (
                          <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-xs flex items-center justify-center">
                            <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                          </div>
                        )}

                        <div
                          style={{
                            width: 375,
                            height: 720,
                            transform: `scale(${340 / 720})`,
                            transformOrigin: "top left",
                          }}
                        >
                          <iframe
                            key={`${iframeKey}-${previewPath}-mobile`}
                            src={`/boutiques/${subdomain}${previewPath}?embed=1`}
                            title="Aperçu Mobile"
                            className={`w-full h-full border-0 select-none bg-white ${
                              isInteractive ? "pointer-events-auto" : "pointer-events-none"
                            }`}
                            loading="lazy"
                            onLoad={() => setIframeLoading(false)}
                          />
                        </div>

                        {/* Click overlay */}
                        {!isInteractive && (
                          <div
                            onClick={() =>
                              setPreviewModal({
                                open: true,
                                theme: {
                                  id: "current_live",
                                  name: currentThemeName,
                                  config: currentThemeConfig!,
                                  createdAt: new Date().toISOString(),
                                  updatedAt: new Date().toISOString(),
                                },
                                viewport: "mobile",
                              })
                            }
                            className="absolute inset-0 bg-gray-900/0 hover:bg-gray-900/25 transition-all flex items-center justify-center opacity-0 hover:opacity-100 group cursor-pointer backdrop-blur-[1px]"
                          >
                            <span className="px-3 py-1.5 bg-white text-gray-900 font-bold text-[11px] rounded-lg shadow-lg flex items-center gap-1.5 transform group-hover:scale-105 transition-transform">
                              <Eye className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Tester</span>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* iOS Home bar */}
                      <div className="w-16 h-1 bg-slate-400/50 rounded-full mt-1.5 shrink-0" />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-400 px-1">
                <span>Rendu haute résolution synchronisé</span>
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Boutique en ligne active
                </span>
              </div>
            </div>

            {/* Theme Info & Primary Actions */}
            <div className="lg:col-span-5 xl:col-span-5 p-5 sm:p-6 flex flex-col justify-between space-y-6">
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 mb-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Actif · Visible par vos clients
                    </div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                        {currentThemeName}
                      </h3>
                      <button
                        onClick={() =>
                          setRenameModal({
                            open: true,
                            themeId: null,
                            currentName: currentThemeName,
                            newName: currentThemeName,
                          })
                        }
                        className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Renommer ce thème"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Thème de base : <span className="capitalize font-semibold text-gray-700">{currentThemeId}</span>
                    </p>
                  </div>

                  {/* Actions Dropdown */}
                  <div className="relative" data-menu-container>
                    <button
                      onClick={() => setActiveMenuThemeId(activeMenuThemeId === "current" ? null : "current")}
                      className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200 shadow-2xs"
                      title="Plus d'actions"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {activeMenuThemeId === "current" && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl py-1.5 z-30 text-xs">
                        <button
                          onClick={() => handleDuplicateTheme("current")}
                          className="w-full px-3 py-2 text-left font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Copy className="w-3.5 h-3.5 text-gray-400" />
                          <span>Dupliquer ce thème</span>
                        </button>
                        <button
                          onClick={() => currentThemeConfig && handleExportTheme(currentThemeConfig, currentThemeName)}
                          className="w-full px-3 py-2 text-left font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Download className="w-3.5 h-3.5 text-gray-400" />
                          <span>Exporter (Télécharger JSON)</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveMenuThemeId(null);
                            setRenameModal({
                              open: true,
                              themeId: null,
                              currentName: currentThemeName,
                              newName: currentThemeName,
                            });
                          }}
                          className="w-full px-3 py-2 text-left font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-gray-400" />
                          <span>Renommer</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Color Swatches & Specs */}
                {currentColors && (
                  <div className="mt-5 p-3.5 bg-gray-50/80 rounded-xl border border-gray-100 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                        Palette du thème
                      </p>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-6 h-6 rounded-full border border-gray-200 shadow-xs"
                          style={{ backgroundColor: currentColors.primary }}
                          title={`Couleur Principale : ${currentColors.primary}`}
                        />
                        <span
                          className="w-6 h-6 rounded-full border border-gray-200 shadow-xs"
                          style={{ backgroundColor: currentColors.secondary }}
                          title={`Secondaire : ${currentColors.secondary}`}
                        />
                        <span
                          className="w-6 h-6 rounded-full border border-gray-200 shadow-xs"
                          style={{ backgroundColor: currentColors.background }}
                          title={`Arrière-plan : ${currentColors.background}`}
                        />
                        <span
                          className="w-6 h-6 rounded-full border border-gray-200 shadow-xs"
                          style={{ backgroundColor: currentColors.accent }}
                          title={`Accent : ${currentColors.accent}`}
                        />
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                        Typographies
                      </p>
                      <p className="text-xs font-semibold text-gray-700">
                        {currentThemeConfig.global.fonts.heading.split(",")[0]} / {currentThemeConfig.global.fonts.body.split(",")[0]}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center gap-3">
                <Link
                  href={`/boutiques/${subdomain}/admin/customize`}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-sm transition-all"
                >
                  <Palette className="w-4 h-4" />
                  <span>Personnaliser ce thème</span>
                </Link>

                <button
                  onClick={() => handleDuplicateTheme("current")}
                  disabled={actionLoading === "current"}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-semibold text-sm rounded-xl shadow-2xs transition-all"
                >
                  <Copy className="w-4 h-4 text-gray-400" />
                  <span>Dupliquer</span>
                </button>

                <button
                  onClick={() => currentThemeConfig && handleExportTheme(currentThemeConfig, currentThemeName)}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-semibold text-sm rounded-xl shadow-2xs transition-all"
                >
                  <Download className="w-4 h-4 text-gray-400" />
                  <span>Exporter</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Bibliothèque de Thèmes (Theme Library) ── */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900 tracking-tight">
                Bibliothèque de thèmes
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                {savedThemes.length}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Ces thèmes ne sont pas visibles par vos visiteurs. Testez de nouveaux styles ou gardez des sauvegardes de secours.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setImportTab("upload");
                setImportModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-all shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5 text-gray-400" />
              <span>Importer un thème (ZIP / JSON)</span>
            </button>
          </div>
        </div>

        {/* Empty State */}
        {savedThemes.length === 0 ? (
          <div className="p-8 text-center bg-gray-50/80 border-2 border-dashed border-gray-200 rounded-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center mx-auto text-gray-400 shadow-2xs">
              <Layers className="w-6 h-6" />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="text-sm font-bold text-gray-900">
                Aucun thème dans votre bibliothèque
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Dupliquez votre thème actuel pour travailler en toute sécurité, ou importez un thème Shopify pour renouveler votre design.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
              <button
                onClick={() => handleDuplicateTheme("current")}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-xl transition-all"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Dupliquer le thème actuel</span>
              </button>
              <button
                onClick={() => {
                  setImportTab("presets");
                  setImportModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-all shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Choisir un thème prédéfini</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedThemes.map((theme) => {
              const colors = theme.config?.global?.colors;
              const isBusy = actionLoading === theme.id;

              return (
                <div
                  key={theme.id}
                  className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md hover:border-gray-300 transition-all flex flex-col justify-between overflow-hidden group"
                >
                  {/* Card Header & Swatches */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-50 text-amber-700 border border-amber-200/60 mb-1">
                          Brouillon
                        </span>
                        <h4 className="text-sm font-bold text-gray-900 truncate" title={theme.name}>
                          {theme.name}
                        </h4>
                        <p className="text-[11px] text-gray-400">
                          Modifié le {new Date(theme.updatedAt || theme.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                        </p>
                      </div>

                      {/* Dropdown Options */}
                      <div className="relative" data-menu-container>
                        <button
                          onClick={() => setActiveMenuThemeId(activeMenuThemeId === theme.id ? null : theme.id)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {activeMenuThemeId === theme.id && (
                          <div className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-30 text-xs">
                            <button
                              onClick={() => handleDuplicateTheme(theme.id)}
                              className="w-full px-3 py-1.5 text-left font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Copy className="w-3.5 h-3.5 text-gray-400" />
                              <span>Dupliquer</span>
                            </button>
                            <button
                              onClick={() => handleExportTheme(theme.config, theme.name)}
                              className="w-full px-3 py-1.5 text-left font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Download className="w-3.5 h-3.5 text-gray-400" />
                              <span>Exporter (JSON)</span>
                            </button>
                            <button
                              onClick={() => {
                                setActiveMenuThemeId(null);
                                setRenameModal({
                                  open: true,
                                  themeId: theme.id,
                                  currentName: theme.name,
                                  newName: theme.name,
                                });
                              }}
                              className="w-full px-3 py-1.5 text-left font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-gray-400" />
                              <span>Renommer</span>
                            </button>
                            <div className="my-1 border-t border-gray-100" />
                            <button
                              onClick={() => {
                                setActiveMenuThemeId(null);
                                setDeleteModal({ open: true, theme });
                              }}
                              className="w-full px-3 py-1.5 text-left font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                              <span>Supprimer</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Color Preview Bar */}
                    {colors && (
                      <div className="flex items-center gap-1.5 p-2 bg-gray-50 rounded-xl border border-gray-100">
                        <span
                          className="w-4 h-4 rounded-full border border-gray-200 shadow-2xs"
                          style={{ backgroundColor: colors.primary }}
                          title={`Primaire: ${colors.primary}`}
                        />
                        <span
                          className="w-4 h-4 rounded-full border border-gray-200 shadow-2xs"
                          style={{ backgroundColor: colors.secondary }}
                          title={`Secondaire: ${colors.secondary}`}
                        />
                        <span
                          className="w-4 h-4 rounded-full border border-gray-200 shadow-2xs"
                          style={{ backgroundColor: colors.background }}
                          title={`Fond: ${colors.background}`}
                        />
                        <span className="text-[11px] text-gray-500 font-medium ml-auto">
                          {theme.config.sections?.length || 0} sections
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="p-3 bg-gray-50/60 border-t border-gray-100 flex items-center gap-2">
                    <button
                      onClick={() => setPublishModal({ open: true, theme })}
                      disabled={isBusy}
                      className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Publier</span>
                    </button>

                    <Link
                      href={`/boutiques/${subdomain}/admin/customize?themeId=${theme.id}`}
                      className="py-1.5 px-3 bg-white hover:bg-gray-100 text-gray-700 font-semibold text-xs border border-gray-200 rounded-xl transition-colors flex items-center gap-1"
                      title="Personnaliser ce thème en mode brouillon"
                    >
                      <Palette className="w-3.5 h-3.5 text-gray-500" />
                      <span>Modifier</span>
                    </Link>

                    <button
                      onClick={() =>
                        setPreviewModal({
                          open: true,
                          theme,
                          viewport: "desktop",
                        })
                      }
                      className="py-1.5 px-2.5 text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors font-semibold text-xs flex items-center gap-1 shadow-2xs"
                      title="Aperçu interactif du thème"
                    >
                      <Eye className="w-3.5 h-3.5 text-gray-500" />
                      <span>Aperçu</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── MODAL: Ajouter / Importer un thème ── */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Ajouter un thème à votre boutique
                </h3>
                <p className="text-xs text-gray-500">
                  Importez un thème externe ou piochez dans les collections créées pour ShopEazy.
                </p>
              </div>
              <button
                onClick={() => setImportModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="px-5 pt-3 border-b border-gray-100 flex gap-4">
              <button
                onClick={() => setImportTab("presets")}
                className={`pb-2.5 text-xs font-bold transition-all relative ${
                  importTab === "presets"
                    ? "text-emerald-700 border-b-2 border-emerald-600"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Thèmes prédéfinis ShopEazy
              </button>
              <button
                onClick={() => setImportTab("upload")}
                className={`pb-2.5 text-xs font-bold transition-all relative ${
                  importTab === "upload"
                    ? "text-emerald-700 border-b-2 border-emerald-600"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Importer un fichier (ZIP Shopify / JSON)
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1">
              {importTab === "presets" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {officialPresets.map((preset) => (
                    <div
                      key={preset.id}
                      className="border border-gray-200 rounded-xl p-4 flex flex-col justify-between hover:border-emerald-300 hover:shadow-xs transition-all space-y-3 bg-white"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-gray-900">{preset.name}</h4>
                          <div className="flex items-center gap-1">
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-gray-200"
                              style={{ backgroundColor: preset.colors.primary }}
                            />
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-gray-200"
                              style={{ backgroundColor: preset.colors.background }}
                            />
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {preset.description}
                        </p>
                      </div>

                      <button
                        onClick={() => handleAddPresetTheme(preset.id)}
                        disabled={actionLoading === `preset_${preset.id}`}
                        className="w-full py-2 px-3 bg-gray-50 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 font-semibold text-xs border border-gray-200 hover:border-emerald-200 rounded-xl transition-all flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Ajouter à la bibliothèque</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleFileDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                      dragOver
                        ? "border-emerald-500 bg-emerald-50/50"
                        : "border-gray-200 hover:border-gray-300 bg-gray-50/50"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".zip,.json"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleProcessImportFile(e.target.files[0]);
                        }
                      }}
                    />

                    <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 shadow-2xs flex items-center justify-center text-emerald-600">
                      <Upload className="w-6 h-6" />
                    </div>

                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        Glissez-déposez votre archive de thème ici
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Fichier <code className="text-emerald-700 font-semibold">.zip</code> de thème Shopify ou <code className="text-emerald-700 font-semibold">.json</code> ShopEazy
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isUploading}
                      className="px-4 py-2 bg-white text-gray-700 font-semibold text-xs border border-gray-200 rounded-xl shadow-2xs hover:bg-gray-50"
                    >
                      {isUploading ? "Importation en cours..." : "Parcourir les fichiers"}
                    </button>
                  </div>

                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-800 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      Compatibilité thèmes Shopify
                    </p>
                    <p className="text-[11px] text-amber-700">
                      ShopEazy extrait automatiquement vos couleurs, vos typographies, votre CSS personnalisé et vos ressources média pour les adapter directement à votre boutique.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Renommer un thème ── */}
      {renameModal.open && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <h3 className="text-base font-bold text-gray-900">Renommer le thème</h3>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Nouveau nom du thème
              </label>
              <input
                type="text"
                value={renameModal.newName}
                onChange={(e) => setRenameModal({ ...renameModal, newName: e.target.value })}
                placeholder="Ex : Boutique Vaplenou - Version Été"
                className="w-full px-3.5 py-2 text-sm border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRenameModal({ open: false, themeId: null, currentName: "", newName: "" })}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveRename}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Confirmer la publication ── */}
      {publishModal.open && publishModal.theme && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Publier le thème « {publishModal.theme.name} » ?
              </h3>
              <p className="text-xs text-gray-500 mt-1.5">
                Ce thème remplacera immédiatement votre thème actuel et sera visible par tous les clients de votre boutique en ligne. Votre thème actuel sera conservé en sécurité dans la bibliothèque.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setPublishModal({ open: false, theme: null })}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Annuler
              </button>
              <button
                onClick={() => publishModal.theme && handlePublishTheme(publishModal.theme)}
                disabled={actionLoading === publishModal.theme.id}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Confirmer et publier</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Confirmer la suppression ── */}
      {deleteModal.open && deleteModal.theme && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-700">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Supprimer le thème « {deleteModal.theme.name} » ?
              </h3>
              <p className="text-xs text-gray-500 mt-1.5">
                Cette action est irréversible. Le thème sera définitivement retiré de votre bibliothèque.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteModal({ open: false, theme: null })}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Annuler
              </button>
              <button
                onClick={() => deleteModal.theme && handleDeleteTheme(deleteModal.theme.id)}
                disabled={actionLoading === deleteModal.theme.id}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
              >
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Aperçu Interactif du Thème Brouillon ── */}
      {previewModal.open && previewModal.theme && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-2xl w-full max-w-6xl h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-gray-200">
            {/* Top Bar Preview */}
            <div className="px-5 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  Mode Aperçu
                </span>
                <h3 className="text-sm font-bold text-gray-900 truncate">
                  {previewModal.theme.name}
                </h3>
              </div>

              {/* Viewport switch */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200">
                <button
                  onClick={() => setPreviewModal((p) => ({ ...p, viewport: "desktop" }))}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                    previewModal.viewport === "desktop"
                      ? "bg-emerald-50 text-emerald-700 shadow-2xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Bureau</span>
                </button>
                <button
                  onClick={() => setPreviewModal((p) => ({ ...p, viewport: "mobile" }))}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                    previewModal.viewport === "mobile"
                      ? "bg-emerald-50 text-emerald-700 shadow-2xs"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile</span>
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const themeToPub = previewModal.theme;
                    setPreviewModal({ open: false, theme: null, viewport: "desktop" });
                    if (themeToPub) handlePublishTheme(themeToPub);
                  }}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Publier ce thème</span>
                </button>

                <button
                  onClick={() => setPreviewModal({ open: false, theme: null, viewport: "desktop" })}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Iframe View */}
            <div className="flex-1 bg-gray-100 flex items-center justify-center p-3 sm:p-5 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-xl overflow-hidden shadow-xl border border-gray-300 bg-white ${
                  previewModal.viewport === "mobile" ? "w-[390px]" : "w-full"
                }`}
              >
                <iframe
                  src={`/boutiques/${subdomain}?preview_theme_id=${previewModal.theme.id}&embed=1`}
                  className="w-full h-full border-0"
                  title="Aperçu Thème"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Succès d'importation avec actions directes ── */}
      {importSuccessModal.open && importSuccessModal.theme && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Importation réussie
                  </span>
                  <h3 className="text-base font-bold text-gray-900 mt-0.5">
                    {importSuccessModal.theme.name}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setImportSuccessModal({ open: false, theme: null })}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Aperçu rapide des réglages importés */}
            <div className="p-4 bg-gray-50/90 rounded-2xl border border-gray-100 space-y-2.5 text-xs">
              <p className="font-semibold text-gray-700">Styles et éléments extraits du thème :</p>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600">
                <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-gray-200/80">
                  <span
                    className="w-4 h-4 rounded-full border border-gray-300 shrink-0"
                    style={{ backgroundColor: importSuccessModal.theme.config.global?.colors?.primary }}
                  />
                  <div className="truncate">
                    <span className="text-gray-400 block text-[9px] uppercase font-bold">Couleur Principale</span>
                    <span className="font-bold text-gray-800">{importSuccessModal.theme.config.global?.colors?.primary}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-gray-200/80">
                  <span
                    className="w-4 h-4 rounded-full border border-gray-300 shrink-0"
                    style={{ backgroundColor: importSuccessModal.theme.config.global?.colors?.secondary }}
                  />
                  <div className="truncate">
                    <span className="text-gray-400 block text-[9px] uppercase font-bold">Accent / Solde</span>
                    <span className="font-bold text-gray-800">{importSuccessModal.theme.config.global?.colors?.secondary}</span>
                  </div>
                </div>
              </div>

              {importSuccessModal.theme.config.sections?.find((s) => s.type === "announcement-bar")?.settings?.messages?.[0]?.text && (
                <div className="p-2.5 bg-emerald-50/70 border border-emerald-100 rounded-xl text-emerald-900 font-medium text-[11px] flex items-center gap-2 truncate">
                  <Megaphone className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span className="truncate">
                    « {importSuccessModal.theme.config.sections.find((s) => s.type === "announcement-bar")?.settings?.messages?.[0]?.text} »
                  </span>
                </div>
              )}

              <p className="text-[11px] text-gray-500 pt-1">
                Le thème est sauvegardé dans votre bibliothèque. Vous pouvez l'activer directement sur la boutique en ligne ou le modifier.
              </p>
            </div>

            {/* Actions principales */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={() => {
                  const themeToPub = importSuccessModal.theme;
                  setImportSuccessModal({ open: false, theme: null });
                  if (themeToPub) handlePublishTheme(themeToPub);
                }}
                disabled={actionLoading === importSuccessModal.theme.id}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 group"
              >
                <Sparkles className="w-4 h-4 text-emerald-200 group-hover:scale-110 transition-transform" />
                <span>Publier immédiatement sur la boutique</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <Link
                  href={`/boutiques/${subdomain}/admin/customize?themeId=${importSuccessModal.theme.id}`}
                  className="py-2.5 px-3 bg-white hover:bg-gray-50 text-gray-800 font-bold text-xs border border-gray-200 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Palette className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Modifier</span>
                </Link>

                <button
                  onClick={() => {
                    const themeToPrev = importSuccessModal.theme;
                    setImportSuccessModal({ open: false, theme: null });
                    if (themeToPrev) {
                      setPreviewModal({
                        open: true,
                        theme: themeToPrev,
                        viewport: "desktop",
                      });
                    }
                  }}
                  className="py-2.5 px-3 bg-white hover:bg-gray-50 text-gray-800 font-bold text-xs border border-gray-200 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Eye className="w-3.5 h-3.5 text-gray-500" />
                  <span>Aperçu</span>
                </button>
              </div>

              <button
                onClick={() => {
                  setImportSuccessModal({ open: false, theme: null });
                  toast.success(`Le thème « ${importSuccessModal.theme?.name} » est enregistré dans votre bibliothèque.`);
                }}
                className="w-full py-2 text-center text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors"
              >
                Conserver dans la bibliothèque sans publier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
