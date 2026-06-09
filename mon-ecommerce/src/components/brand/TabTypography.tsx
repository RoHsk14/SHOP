"use client";

import type { FontSettings } from "@/lib/theme-config";

const GOOGLE_FONTS = [
  { family: "Inter", weights: [300, 400, 500, 600, 700, 800, 900], category: "sans-serif" },
  { family: "Poppins", weights: [300, 400, 500, 600, 700, 800], category: "sans-serif" },
  { family: "Roboto", weights: [300, 400, 500, 700, 900], category: "sans-serif" },
  { family: "Open Sans", weights: [300, 400, 500, 600, 700, 800], category: "sans-serif" },
  { family: "Montserrat", weights: [300, 400, 500, 600, 700, 800, 900], category: "sans-serif" },
  { family: "Lato", weights: [300, 400, 700, 900], category: "sans-serif" },
  { family: "Playfair Display", weights: [400, 500, 600, 700, 800, 900], category: "serif" },
  { family: "Merriweather", weights: [300, 400, 700, 900], category: "serif" },
  { family: "Roboto Slab", weights: [300, 400, 500, 600, 700, 800, 900], category: "serif" },
  { family: "Nunito", weights: [300, 400, 500, 600, 700, 800, 900], category: "sans-serif" },
  { family: "Raleway", weights: [300, 400, 500, 600, 700, 800, 900], category: "sans-serif" },
  { family: "DM Sans", weights: [300, 400, 500, 600, 700, 800], category: "sans-serif" },
  { family: "Source Sans 3", weights: [300, 400, 500, 600, 700, 800, 900], category: "sans-serif" },
  { family: "Oswald", weights: [300, 400, 500, 600, 700], category: "sans-serif" },
  { family: "Quicksand", weights: [300, 400, 500, 600, 700], category: "sans-serif" },
  { family: "Josefin Sans", weights: [300, 400, 500, 600, 700], category: "sans-serif" },
  { family: "Cormorant Garamond", weights: [300, 400, 500, 600, 700], category: "serif" },
  { family: "Libre Franklin", weights: [300, 400, 500, 600, 700, 800], category: "sans-serif" },
  { family: "Rubik", weights: [300, 400, 500, 600, 700, 800, 900], category: "sans-serif" },
  { family: "Work Sans", weights: [300, 400, 500, 600, 700, 800, 900], category: "sans-serif" },
];

const FONT_WEIGHTS = [
  { label: "Light", value: 300 },
  { label: "Regular", value: 400 },
  { label: "Medium", value: 500 },
  { label: "Semibold", value: 600 },
  { label: "Bold", value: 700 },
  { label: "Extra bold", value: 800 },
  { label: "Black", value: 900 },
];

const TEXT_TRANSFORMS = [
  { label: "Normal", value: "none" },
  { label: "Majuscules", value: "uppercase" },
  { label: "Capitales", value: "capitalize" },
];

const HEADING_SIZES = [
  { label: "Petite", value: "small" },
  { label: "Normale", value: "normal" },
  { label: "Grande", value: "large" },
];

function FontFamilySelect({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const currentFamily = value.split(",")[0]?.trim() || "";
  return (
    <select
      value={currentFamily}
      onChange={(e) => onChange(`${e.target.value}, system-ui, sans-serif`)}
      className="w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
    >
      <option value="">Sélectionner une police</option>
      {GOOGLE_FONTS.map((f) => (
        <option key={f.family} value={f.family}>
          {f.family} ({f.category})
        </option>
      ))}
    </select>
  );
}

export default function TabTypography({
  fonts,
  onChange,
}: {
  fonts: FontSettings;
  onChange: (fonts: FontSettings) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Headings */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Titres (Headings)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Police</label>
            <FontFamilySelect value={fonts.heading} onChange={(v) => onChange({ ...fonts, heading: v })} label="Police des titres" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Poids</label>
            <select
              value={fonts.headingWeight || 700}
              onChange={(e) => onChange({ ...fonts, headingWeight: Number(e.target.value) })}
              className="w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900"
            >
              {FONT_WEIGHTS.map((w) => (
                <option key={w.value} value={w.value}>{w.label} ({w.value})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Interlettrage</label>
            <input
              type="text"
              value={fonts.headingLetterSpacing || "0"}
              onChange={(e) => onChange({ ...fonts, headingLetterSpacing: e.target.value })}
              placeholder="0.02em"
              className="w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Hauteur de ligne</label>
            <input
              type="text"
              value={fonts.headingLineHeight || "1.2"}
              onChange={(e) => onChange({ ...fonts, headingLineHeight: e.target.value })}
              placeholder="1.2"
              className="w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Transformation</label>
            <select
              value={fonts.headingTransform || "none"}
              onChange={(e) => onChange({ ...fonts, headingTransform: e.target.value as any })}
              className="w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900"
            >
              {TEXT_TRANSFORMS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Taille</label>
            <select
              value={fonts.headingSize}
              onChange={(e) => onChange({ ...fonts, headingSize: e.target.value as any })}
              className="w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900"
            >
              {HEADING_SIZES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* Body */}
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Texte (Body)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Police</label>
            <FontFamilySelect value={fonts.body} onChange={(v) => onChange({ ...fonts, body: v })} label="Police du texte" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Poids</label>
            <select
              value={fonts.bodyWeight || 400}
              onChange={(e) => onChange({ ...fonts, bodyWeight: Number(e.target.value) })}
              className="w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900"
            >
              {FONT_WEIGHTS.map((w) => (
                <option key={w.value} value={w.value}>{w.label} ({w.value})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Interlettrage</label>
            <input
              type="text"
              value={fonts.bodyLetterSpacing || "0"}
              onChange={(e) => onChange({ ...fonts, bodyLetterSpacing: e.target.value })}
              placeholder="0"
              className="w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Hauteur de ligne</label>
            <input
              type="text"
              value={fonts.bodyLineHeight || "1.6"}
              onChange={(e) => onChange({ ...fonts, bodyLineHeight: e.target.value })}
              placeholder="1.6"
              className="w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Taille de base (px)</label>
            <input
              type="number"
              value={fonts.baseSize}
              onChange={(e) => onChange({ ...fonts, baseSize: Number(e.target.value) })}
              min={12}
              max={20}
              className="w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
        <p className="text-xs font-medium text-gray-400 mb-2">Aperçu</p>
        <div style={{ fontFamily: fonts.heading, fontWeight: fonts.headingWeight, letterSpacing: fonts.headingLetterSpacing, lineHeight: fonts.headingLineHeight, textTransform: fonts.headingTransform }}>
          <h2 className="text-lg font-bold text-gray-900">
            {fonts.heading.split(",")[0]?.trim() || "Inter"} — Titre de la boutique
          </h2>
        </div>
        <div style={{ fontFamily: fonts.body, fontWeight: fonts.bodyWeight, letterSpacing: fonts.bodyLetterSpacing, lineHeight: fonts.bodyLineHeight }}>
          <p className="text-sm mt-2 text-gray-600">
            {fonts.body.split(",")[0]?.trim() || "Inter"} — Ceci est un exemple de texte de body. Découvrez nos produits exceptionnels et profitez de la livraison gratuite.
          </p>
        </div>
      </div>
    </div>
  );
}
