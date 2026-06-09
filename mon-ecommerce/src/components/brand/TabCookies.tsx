"use client";

import type { CookieSettings } from "@/lib/theme-config";

export default function TabCookies({
  cookie,
  onChange,
}: {
  cookie: CookieSettings;
  onChange: (c: CookieSettings) => void;
}) {
  const enabled = cookie.enabled;

  return (
    <div className="space-y-5">
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onChange({ ...cookie, enabled: e.target.checked })}
          className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
        />
        <div>
          <span className="text-sm font-medium text-gray-900">Activer la bannière cookies</span>
          <p className="text-xs text-gray-500">Affiche une bannière de consentement RGPD</p>
        </div>
      </label>

      {enabled && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
            <textarea
              value={cookie.message || ""}
              onChange={(e) => onChange({ ...cookie, message: e.target.value })}
              rows={2}
              placeholder="Ce site utilise des cookies..."
              className="w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Texte du bouton Accepter</label>
              <input
                type="text"
                value={cookie.buttonText || "Accepter"}
                onChange={(e) => onChange({ ...cookie, buttonText: e.target.value })}
                className="w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Texte du bouton Refuser</label>
              <input
                type="text"
                value={cookie.declineText || "Refuser"}
                onChange={(e) => onChange({ ...cookie, declineText: e.target.value })}
                className="w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Position</label>
              <select
                value={cookie.position || "bottom"}
                onChange={(e) => onChange({ ...cookie, position: e.target.value as "bottom" | "top" })}
                className="w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900"
              >
                <option value="bottom">Bas de page</option>
                <option value="top">Haut de page</option>
              </select>
            </div>
          </div>

          <hr className="border-gray-100" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Fond de la bannière</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={cookie.background || "#1f2937"}
                  onChange={(e) => onChange({ ...cookie, background: e.target.value })}
                  className="w-10 h-10 p-0.5 border border-gray-200 rounded-lg cursor-pointer bg-white"
                />
                <input
                  type="text"
                  value={cookie.background || ""}
                  onChange={(e) => onChange({ ...cookie, background: e.target.value })}
                  className="flex-1 text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Couleur du texte</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={cookie.textColor || "#ffffff"}
                  onChange={(e) => onChange({ ...cookie, textColor: e.target.value })}
                  className="w-10 h-10 p-0.5 border border-gray-200 rounded-lg cursor-pointer bg-white"
                />
                <input
                  type="text"
                  value={cookie.textColor || ""}
                  onChange={(e) => onChange({ ...cookie, textColor: e.target.value })}
                  className="flex-1 text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Fond du bouton Accepter</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={cookie.buttonBg || "#059669"}
                  onChange={(e) => onChange({ ...cookie, buttonBg: e.target.value })}
                  className="w-10 h-10 p-0.5 border border-gray-200 rounded-lg cursor-pointer bg-white"
                />
                <input
                  type="text"
                  value={cookie.buttonBg || ""}
                  onChange={(e) => onChange({ ...cookie, buttonBg: e.target.value })}
                  className="flex-1 text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Texte du bouton Accepter</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={cookie.buttonTextColor || "#ffffff"}
                  onChange={(e) => onChange({ ...cookie, buttonTextColor: e.target.value })}
                  className="w-10 h-10 p-0.5 border border-gray-200 rounded-lg cursor-pointer bg-white"
                />
                <input
                  type="text"
                  value={cookie.buttonTextColor || ""}
                  onChange={(e) => onChange({ ...cookie, buttonTextColor: e.target.value })}
                  className="flex-1 text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
