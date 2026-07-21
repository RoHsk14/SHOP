"use client";

import { Code } from "lucide-react";
import type { AnalyticsSettings, CustomScripts } from "@/lib/theme-config";

export default function TabAnalytics({
  analytics,
  scripts,
  onAnalyticsChange,
  onScriptsChange,
}: {
  analytics: AnalyticsSettings;
  scripts: CustomScripts;
  onAnalyticsChange: (a: AnalyticsSettings) => void;
  onScriptsChange: (s: CustomScripts) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Suivi &amp; Analytics</h3>
        <p className="text-xs text-gray-400 mb-4">Configurez vos identifiants de suivi pour Google Analytics, Google Tag Manager et Facebook Pixel.</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Google Analytics (GA4)
            </label>
            <input
              type="text"
              value={analytics.googleAnalytics || ""}
              onChange={(e) =>
                onAnalyticsChange({ ...analytics, googleAnalytics: e.target.value })
              }
              placeholder="G-XXXXXXXXXX"
              className="w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-xs text-gray-400 mt-1">ID de mesure GA4 (ex: G-XXXXXXXXXX)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Google Tag Manager
            </label>
            <input
              type="text"
              value={analytics.googleTagManager || ""}
              onChange={(e) =>
                onAnalyticsChange({ ...analytics, googleTagManager: e.target.value })
              }
              placeholder="GTM-XXXXXXX"
              className="w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-xs text-gray-400 mt-1">ID du conteneur GTM (ex: GTM-XXXXXXX)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Facebook Pixel
            </label>
            <input
              type="text"
              value={analytics.facebookPixel || ""}
              onChange={(e) =>
                onAnalyticsChange({ ...analytics, facebookPixel: e.target.value })
              }
              placeholder="123456789012345"
              className="w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-xs text-gray-400 mt-1">ID du pixel Meta (ex: 123456789012345)</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Code className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900">Scripts personnalisés</h3>
        </div>
        <p className="text-xs text-gray-400 mb-4">Ajoutez des scripts personnalisés dans l&apos;en-tête et le corps de votre boutique.</p>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700">
                Scripts dans le &lt;head&gt;
              </label>
              <span className="text-xs text-gray-400">Méta, styles, scripts externes</span>
            </div>
            <textarea
              value={scripts.head || ""}
              onChange={(e) => onScriptsChange({ ...scripts, head: e.target.value })}
              rows={6}
              placeholder={`<meta name="..." />
            <style>...</style>`}
              className="w-full text-sm px-4 py-3 bg-gray-900 text-green-400 font-mono border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              spellCheck={false}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700">
                Scripts début du &lt;body&gt;
              </label>
              <span className="text-xs text-gray-400">Juste après l&apos;ouverture de body</span>
            </div>
            <textarea
              value={scripts.bodyStart || ""}
              onChange={(e) =>
                onScriptsChange({ ...scripts, bodyStart: e.target.value })
              }
              rows={6}
              placeholder="<script>...</script>"
              className="w-full text-sm px-4 py-3 bg-gray-900 text-green-400 font-mono border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              spellCheck={false}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-700">
                Scripts fin du &lt;body&gt;
              </label>
              <span className="text-xs text-gray-400">Juste avant la fermeture de body</span>
            </div>
            <textarea
              value={scripts.bodyEnd || ""}
              onChange={(e) => onScriptsChange({ ...scripts, bodyEnd: e.target.value })}
              rows={6}
              placeholder="<script>...</script>"
              className="w-full text-sm px-4 py-3 bg-gray-900 text-green-400 font-mono border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              spellCheck={false}
            />
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-xs text-amber-700 font-medium">Important</p>
        <p className="text-xs text-amber-600 mt-1">
          Les scripts personnalisés ne sont visibles qu&apos;après publication de votre boutique. Vérifiez votre code avant de publier.
        </p>
      </div>
    </div>
  );
}
