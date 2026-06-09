"use client";

import type { CustomCss } from "@/lib/theme-config";

export default function TabCustomCss({
  customCss,
  onChange,
}: {
  customCss: CustomCss;
  onChange: (css: CustomCss) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-medium text-gray-700">CSS personnalisé — Desktop</label>
          <span className="text-xs text-gray-400">S&#39;applique à tous les écrans</span>
        </div>
        <textarea
          value={customCss.desktop || ""}
          onChange={(e) => onChange({ ...customCss, desktop: e.target.value })}
          rows={10}
          placeholder="/* Ajoutez votre CSS ici */
.shop-title {
  font-size: 2rem;
}"
          className="w-full text-sm px-4 py-3 bg-gray-900 text-green-400 font-mono border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          spellCheck={false}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-medium text-gray-700">CSS personnalisé — Mobile</label>
          <span className="text-xs text-gray-400">S&#39;applique uniquement sur téléphone</span>
        </div>
        <textarea
          value={customCss.mobile || ""}
          onChange={(e) => onChange({ ...customCss, mobile: e.target.value })}
          rows={6}
          placeholder="/* CSS pour mobile uniquement */
@media (max-width: 640px) {
  .shop-title {
    font-size: 1.5rem;
  }
}"
          className="w-full text-sm px-4 py-3 bg-gray-900 text-green-400 font-mono border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          spellCheck={false}
        />
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs text-amber-700 font-medium">⚠️ CSS avancé</p>
        <p className="text-xs text-amber-600 mt-1">Utilisez cette option avec précaution. Une erreur dans le CSS peut casser l&apos;affichage de votre boutique. Les variables CSS disponibles : <code className="bg-amber-100 px-1 rounded">--theme-primary</code>, <code className="bg-amber-100 px-1 rounded">--theme-text</code>, etc.</p>
      </div>
    </div>
  );
}
