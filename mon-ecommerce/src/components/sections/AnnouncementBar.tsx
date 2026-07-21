"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { AnnouncementMessage } from "@/lib/theme-config";
import EditableText, { hasTextValue } from "@/components/EditableText";

interface Props {
  settings: {
    text?: any;
    text_color?: string;
    messages?: AnnouncementMessage[];
    speed?: number;
    background?: string;
  };
}

export default function AnnouncementBar({ settings }: Props) {
  const messages = settings.messages?.length ? settings.messages : [
    { id: "a1", text: (settings.text as any) || "🚚 Livraison gratuite !", background: settings.background || "var(--theme-primary)" },
  ];
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((p) => (p + 1) % messages.length);
  }, [messages.length]);

  useEffect(() => {
    if (messages.length <= 1) return;
    const t = setInterval(next, settings.speed || 4000);
    return () => clearInterval(t);
  }, [messages.length, settings.speed, next]);

  const msg = messages[current] as any;
  if (!msg) return null;

  // Prefer live settings.text when no multi-messages configured
  const displayText = settings.messages?.length ? msg.text : (settings.text ?? msg.text);
  const textColor = msg?.text_color || settings.text_color || "#ffffff";

  return (
    <div className="text-center text-xs sm:text-sm font-medium py-2.5 px-4 relative overflow-hidden" style={{
      background: msg?.background || settings.background || "var(--theme-primary)",
    }}>
      {messages.length > 1 && (
        <div className="absolute inset-y-0 left-2 flex items-center">
          <span className="text-[10px] opacity-70 font-bold">{current + 1}/{messages.length}</span>
        </div>
      )}
      {msg?.url ? (
        <Link
          href={msg.url}
          className="transition-opacity hover:opacity-80"
          style={{ color: textColor }}
          onClick={(e) => {
            if ((e.target as HTMLElement)?.isContentEditable) e.preventDefault();
          }}
        >
          <EditableText as="span" value={displayText} />
        </Link>
      ) : (
        <EditableText as="span" value={displayText} style={{ color: textColor }} />
      )}
      {!hasTextValue(displayText) && (
        <span style={{ color: textColor, opacity: 0.5 }}>Texte d&apos;annonce</span>
      )}
    </div>
  );
}
