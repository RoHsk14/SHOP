"use client";

import type { NewsletterPopupSettings } from "@/lib/theme-config";

export default function TabNewsletter({
  settings,
  onChange,
}: {
  settings: NewsletterPopupSettings;
  onChange: (s: NewsletterPopupSettings) => void;
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
        <span className="text-sm font-medium text-gray-700">Activer la popup d'inscription</span>
      </label>

      {settings.enabled && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Image (optionnelle)</label>
            <input
              type="text"
              value={settings.image}
              onChange={(e) => onChange({ ...settings, image: e.target.value })}
              placeholder="https://... (optionnelle)"
              className="w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Titre</label>
            <input
              type="text"
              value={settings.title}
              onChange={(e) => onChange({ ...settings, title: e.target.value })}
              className="w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Texte d&apos;accroche</label>
            <input
              type="text"
              value={settings.content}
              onChange={(e) => onChange({ ...settings, content: e.target.value })}
              className="w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Délai d&apos;apparition (secondes)</label>
            <input
              type="number"
              value={settings.delay}
              onChange={(e) => onChange({ ...settings, delay: Number(e.target.value) })}
              min={1}
              max={120}
              className="w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer pt-6">
              <input
                type="checkbox"
                checked={settings.exitIntent}
                onChange={(e) => onChange({ ...settings, exitIntent: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-gray-700">Déclencher à la sortie (mouse leave)</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Fond de la popup</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Couleur du texte</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.textColor}
                onChange={(e) => onChange({ ...settings, textColor: e.target.value })}
                className="w-9 h-9 p-0.5 border border-gray-200 rounded-lg cursor-pointer bg-white"
              />
              <input
                type="text"
                value={settings.textColor}
                onChange={(e) => onChange({ ...settings, textColor: e.target.value })}
                className="flex-1 text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Couleur bouton</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.buttonBg}
                onChange={(e) => onChange({ ...settings, buttonBg: e.target.value })}
                className="w-9 h-9 p-0.5 border border-gray-200 rounded-lg cursor-pointer bg-white"
              />
              <input
                type="text"
                value={settings.buttonBg}
                onChange={(e) => onChange({ ...settings, buttonBg: e.target.value })}
                className="flex-1 text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Texte bouton</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.buttonText}
                onChange={(e) => onChange({ ...settings, buttonText: e.target.value })}
                className="w-9 h-9 p-0.5 border border-gray-200 rounded-lg cursor-pointer bg-white"
              />
              <input
                type="text"
                value={settings.buttonText}
                onChange={(e) => onChange({ ...settings, buttonText: e.target.value })}
                className="flex-1 text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 font-mono"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
