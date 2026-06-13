"use client";

import { useState } from "react";
import { Save, Trash2, Eye, CheckCircle, Package, Clock, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import type { ThemeConfig, SavedTheme } from "@/lib/theme-config";

interface Props {
  themeConfig: ThemeConfig;
  savedThemes: SavedTheme[];
  onSaveTheme: (name: string) => void;
  onApplyTheme: (theme: SavedTheme) => void;
  onPublishTheme: (theme: SavedTheme) => void;
  onDeleteTheme: (id: string) => void;
  onExportTheme: (theme: SavedTheme) => void;
}

export default function TabThemes({
  themeConfig,
  savedThemes,
  onSaveTheme,
  onApplyTheme,
  onPublishTheme,
  onDeleteTheme,
  onExportTheme,
}: Props) {
  const [newName, setNewName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleSave = () => {
    const name = newName.trim();
    if (!name) {
      toast.error("Donnez un nom au thème");
      return;
    }
    onSaveTheme(name);
    setNewName("");
  };

  const themeCount = savedThemes.length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-1">Thèmes sauvegardés</h2>
        <p className="text-xs text-gray-500">
          {themeCount > 0
            ? `${themeCount} thème${themeCount > 1 ? "s" : ""} — cliquez pour appliquer, publier ou supprimer`
            : "Aucun thème sauvegardé pour l'instant"}
        </p>
      </div>

      {/* Save current theme */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <p className="text-xs font-semibold text-gray-700 mb-3">Sauvegarder le thème actuel</p>
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Ex: Thème été 2026"
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
          <button
            onClick={handleSave}
            disabled={!newName.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Sauvegarder
          </button>
        </div>
      </div>

      {/* Theme list */}
      {savedThemes.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-gray-400">Aucun thème sauvegardé</p>
          <p className="text-xs text-gray-400 mt-1">
            Personnalisez votre boutique puis sauvegardez-la comme thème
          </p>
        </div>
      )}

      <div className="space-y-2">
        {[...savedThemes].reverse().map((theme) => (
          <div
            key={theme.id}
            className="bg-white border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{theme.name}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(theme.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              <button
                onClick={() => onApplyTheme(theme)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                Appliquer
              </button>
              <button
                onClick={() => onPublishTheme(theme)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Publier
              </button>
              <button
                onClick={() => onExportTheme(theme)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Exporter
              </button>
              {confirmDelete === theme.id ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => { onDeleteTheme(theme.id); setConfirmDelete(null); }}
                    className="px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Confirmer
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(theme.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 text-red-600 text-xs font-medium rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Supprimer
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
