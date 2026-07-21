"use client";

import type { BackToTopSettings } from "@/lib/theme-config";

export default function TabBackToTop({
  settings,
  onChange,
}: {
  settings: BackToTopSettings;
  onChange: (s: BackToTopSettings) => void;
}) {
  return (
    <div className="space-y-5">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={(e) => onChange({ ...settings, enabled: e.target.checked })}
          className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
        />
        <span className="text-sm font-medium text-gray-700">Afficher le bouton Retour en haut</span>
      </label>

      {settings.enabled && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Position</label>
            <select
              value={settings.position}
              onChange={(e) => onChange({ ...settings, position: e.target.value as "left" | "right" })}
              className="w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900"
            >
              <option value="right">Droite</option>
              <option value="left">Gauche</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Forme (border-radius)</label>
            <select
              value={settings.borderRadius}
              onChange={(e) => onChange({ ...settings, borderRadius: e.target.value })}
              className="w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900"
            >
              <option value="9999px">Rond</option>
              <option value="12px">Légèrement arrondi</option>
              <option value="0">Carré</option>
              <option value="8px">Moyennement arrondi</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Couleur de fond</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.backgroundColor}
                onChange={(e) => onChange({ ...settings, backgroundColor: e.target.value })}
                className="w-9 h-9 p-0.5 border border-gray-200 rounded-lg cursor-pointer bg-white"
              />
              <input
                type="text"
                value={settings.backgroundColor}
                onChange={(e) => onChange({ ...settings, backgroundColor: e.target.value })}
                className="flex-1 text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Couleur de l'icône</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.iconColor}
                onChange={(e) => onChange({ ...settings, iconColor: e.target.value })}
                className="w-9 h-9 p-0.5 border border-gray-200 rounded-lg cursor-pointer bg-white"
              />
              <input
                type="text"
                value={settings.iconColor}
                onChange={(e) => onChange({ ...settings, iconColor: e.target.value })}
                className="flex-1 text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 font-mono"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
