"use client";

import { useState, useEffect, useRef } from "react";
import { X, Mail } from "lucide-react";
import type { NewsletterPopupSettings } from "@/lib/theme-config";

const POPUP_SEEN_KEY = "newsletter-popup-seen";

export default function NewsletterPopup({ settings }: { settings: NewsletterPopupSettings }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const shown = useRef(false);

  useEffect(() => {
    if (!settings.enabled || shown.current) return;
    const seen = sessionStorage.getItem(POPUP_SEEN_KEY);
    if (seen) return;

    const trigger = () => {
      shown.current = true;
      setOpen(true);
      sessionStorage.setItem(POPUP_SEEN_KEY, "1");
    };

    if (settings.exitIntent) {
      const handler = (e: MouseEvent) => {
        if (e.clientY <= 5) trigger();
      };
      document.addEventListener("mouseleave", handler);
      return () => document.removeEventListener("mouseleave", handler);
    } else {
      const timer = setTimeout(trigger, settings.delay * 1000);
      return () => clearTimeout(timer);
    }
  }, [settings.enabled, settings.delay, settings.exitIntent]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => setOpen(false), 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div
        className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: settings.backgroundColor }}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 z-10 p-1 rounded-full hover:bg-black/5"
        >
          <X className="w-5 h-5" style={{ color: settings.textColor }} />
        </button>

        {settings.image && (
          <div className="w-full h-40 relative">
            <img src={settings.image} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="p-6 sm:p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: "var(--theme-primary, #059669)" }}>
            <Mail className="w-6 h-6 text-white" />
          </div>
          <h3
            className="text-lg sm:text-xl font-bold mb-2"
            style={{ color: settings.textColor, fontFamily: "var(--theme-font-heading)" }}
          >
            {settings.title}
          </h3>
          {settings.content && (
            <p className="text-sm mb-6" style={{ color: settings.textColor, opacity: 0.8 }}>
              {settings.content}
            </p>
          )}

          {subscribed ? (
            <p className="text-sm font-semibold" style={{ color: settings.buttonBg }}>
              Merci de votre inscription ! 🎉
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Votre adresse email"
                className="flex-1 text-sm px-4 py-2.5 rounded-xl border"
                style={{
                  background: settings.backgroundColor,
                  borderColor: "var(--theme-border, #e5e7eb)",
                  color: settings.textColor,
                }}
              />
              <button
                type="submit"
                className="px-5 py-2.5 text-sm font-semibold rounded-xl"
                style={{
                  background: settings.buttonBg,
                  color: settings.buttonText,
                }}
              >
                OK
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
