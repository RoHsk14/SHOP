"use client";

interface Props {
  settings: {
    text?: string;
    background?: string;
    text_color?: string;
  };
}

export default function AnnouncementBar({ settings }: Props) {
  return (
    <div
      className="text-center text-xs sm:text-sm font-medium py-2.5 px-4"
      style={{
        background: settings.background || "var(--theme-primary)",
        color: settings.text_color || "#ffffff",
      }}
    >
      {settings.text || "🚚 Livraison gratuite pour toute commande — Profitez-en !"}
    </div>
  );
}
