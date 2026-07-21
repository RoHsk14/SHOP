"use client";

import { useState, useEffect } from "react";
import type { CookieSettings } from "@/lib/theme-config";
import { X } from "lucide-react";

const COOKIE_CONSENT_KEY = "shop-cookie-consent";

export default function CookieBanner({ settings }: { settings?: CookieSettings }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!settings?.enabled) return;
    try {
      const consented = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!consented) setVisible(true);
    } catch { /* localStorage unavailable (private browsing, quota exceeded, etc.) */ }
  }, [settings?.enabled]);

  if (!settings?.enabled || !visible) return null;

  const accept = () => {
    try { localStorage.setItem(COOKIE_CONSENT_KEY, "accepted"); } catch {}
    setVisible(false);
  };

  const decline = () => {
    try { localStorage.setItem(COOKIE_CONSENT_KEY, "declined"); } catch {}
    setVisible(false);
  };

  const isTop = settings.position === "top";

  return (
    <div
      className={`fixed inset-x-0 z-[100] transition-all ${
        isTop ? "top-0" : "bottom-0"
      }`}
      style={{
        background: settings.background || "#1f2937",
        color: settings.textColor || "#ffffff",
      }}
    >
      <div className="max-w-5xl mx-auto px-4 py-3 sm:py-4 flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
        <p className="text-xs sm:text-sm flex-1 text-center sm:text-left">
          {settings.message || "Ce site utilise des cookies pour améliorer votre expérience."}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={decline}
            className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
            style={{
              background: "rgba(255,255,255,0.1)",
              color: settings.textColor || "#ffffff",
            }}
          >
            {settings.declineText || "Refuser"}
          </button>
          <button
            onClick={accept}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors"
            style={{
              background: settings.buttonBg || "#059669",
              color: settings.buttonTextColor || "#ffffff",
            }}
          >
            {settings.buttonText || "Accepter"}
          </button>
          <button
            onClick={decline}
            className="p-1 opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
