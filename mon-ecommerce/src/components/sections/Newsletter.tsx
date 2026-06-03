"use client";

import { useState } from "react";

interface Props {
  settings: {
    title?: string;
    content?: string;
    background?: string;
    button_text?: string;
  };
}

export default function NewsletterSection({ settings }: Props) {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <section className="py-10 sm:py-16" style={{ background: settings.background || "var(--theme-secondary)" }}>
      <div className="max-w-xl mx-auto px-4 sm:px-6 text-center">
        {settings.title && (
          <h2
            className="text-2xl sm:text-3xl font-bold mb-3"
            style={{
              color: "var(--theme-text)",
              fontFamily: "var(--theme-font-heading)",
            }}
          >
            {settings.title}
          </h2>
        )}
        {settings.content && (
          <p className="text-sm mb-6" style={{ color: "var(--theme-text-muted)" }}>
            {settings.content}
          </p>
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
              {settings.button_text || "S'inscrire"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
