"use client";

import { useState } from "react";
import EditableText, { hasTextValue } from "@/components/EditableText";

interface Props {
  settings: {
    title?: any;
    content?: any;
    background?: string;
    button_text?: any;
    text_align?: string;
    text_size?: string;
    font_family?: string;
  };
}

export default function NewsletterSection({ settings }: Props) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const textAlign = settings.text_align || "center";
  const fontFamily = settings.font_family === "heading" ? "var(--theme-font-heading)" : "var(--theme-font-body)";

  const titleSize = settings.text_size === "small" ? "text-xl sm:text-2xl" : settings.text_size === "large" ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl";
  const bodySize = settings.text_size === "small" ? "text-xs sm:text-sm" : settings.text_size === "large" ? "text-base sm:text-lg" : "text-sm sm:text-base";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <section className="py-10 sm:py-16" style={{ background: settings.background || "var(--theme-secondary)" }}>
      <div className="max-w-xl mx-auto px-4 sm:px-6" style={{ textAlign: textAlign as any }}>
        {hasTextValue(settings.title) && (
          <EditableText
            as="h2"
            value={settings.title}
            className={`${titleSize} font-bold mb-3`}
            style={{ color: "var(--theme-text)", fontFamily }}
          />
        )}
        {hasTextValue(settings.content) && (
          <EditableText
            as="p"
            value={settings.content}
            className={`${bodySize} mb-6`}
            style={{ color: "var(--theme-text-muted)" }}
          />
        )}
        {subscribed ? (
          <p className="text-sm font-medium" style={{ color: "var(--theme-primary)" }}>
            Merci pour votre inscription !
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Votre email"
              required
              className="flex-1 text-sm px-4 py-2.5"
              style={{
                background: "var(--theme-surface)",
                border: "1px solid var(--theme-border)",
                borderRadius: "var(--theme-radius-input)",
                color: "var(--theme-text)",
              }}
            />
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{
                background: "var(--theme-primary)",
                borderRadius: "var(--theme-radius-button)",
              }}
            >
              <EditableText as="span" value={settings.button_text} fallback="S'inscrire" />
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
