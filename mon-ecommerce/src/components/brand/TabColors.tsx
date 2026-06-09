"use client";

import type { ColorSettings } from "@/lib/theme-config";

const COLOR_GROUPS: {
  label: string;
  keys: (keyof ColorSettings)[];
  labels: Record<string, string>;
}[] = [
  {
    label: "Marque",
    keys: ["primary", "primaryHover", "accent", "link"],
    labels: { primary: "Couleur principale", primaryHover: "Survol principal", accent: "Accent", link: "Liens" },
  },
  {
    label: "Fond & Surface",
    keys: ["background", "surface", "secondary", "border"],
    labels: { background: "Fond de page", surface: "Fond des cartes", secondary: "Fond secondaire", border: "Bordures" },
  },
  {
    label: "Texte",
    keys: ["text", "textMuted", "buttonText"],
    labels: { text: "Texte principal", textMuted: "Texte secondaire", buttonText: "Texte des boutons" },
  },
  {
    label: "Boutique",
    keys: ["headerBg", "headerText", "footerBg", "footerText"],
    labels: { headerBg: "Fond en-tête", headerText: "Texte en-tête", footerBg: "Fond pied de page", footerText: "Texte pied de page" },
  },
  {
    label: "État",
    keys: ["success", "warning", "error"],
    labels: { success: "Succès", warning: "Avertissement", error: "Erreur" },
  },
];

export default function TabColors({
  colors,
  onChange,
}: {
  colors: ColorSettings;
  onChange: (colors: ColorSettings) => void;
}) {
  return (
    <div className="space-y-6">
      {COLOR_GROUPS.map((group) => (
        <div key={group.label}>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{group.label}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {group.keys.map((key) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {group.labels[key] || key}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={colors[key] || "#000000"}
                    onChange={(e) => onChange({ ...colors, [key]: e.target.value })}
                    className="w-9 h-9 p-0.5 border border-gray-200 rounded-lg cursor-pointer bg-white shrink-0"
                  />
                  <input
                    type="text"
                    value={colors[key] || ""}
                    onChange={(e) => onChange({ ...colors, [key]: e.target.value })}
                    className="flex-1 text-sm px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
