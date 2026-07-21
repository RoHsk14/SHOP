"use client";

import EditableText, { hasTextValue, plainText } from "@/components/EditableText";

interface Props {
  settings: {
    url?: string;
    title?: any;
    full_width?: boolean;
    autoplay?: boolean;
  };
}

export default function Video({ settings }: Props) {
  if (!settings.url) return null;

  const getEmbedUrl = (url: string) => {
    const match = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/
    );
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}${settings.autoplay ? "?autoplay=1" : ""}`;
    }
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}${settings.autoplay ? "?autoplay=1" : ""}`;
    }
    return url;
  };

  return (
    <section className="py-10 sm:py-16">
      <div className={settings.full_width ? "w-full" : "max-w-3xl mx-auto px-4 sm:px-6"}>
        {hasTextValue(settings.title) && (
          <EditableText
            as="h2"
            value={settings.title}
            className="text-2xl sm:text-3xl font-bold text-center mb-8"
            style={{
              color: "var(--theme-text)",
              fontFamily: "var(--theme-font-heading)",
            }}
          />
        )}
        <div className="relative aspect-video rounded-xl overflow-hidden" style={{ border: "1px solid var(--theme-border)" }}>
          <iframe
            src={getEmbedUrl(settings.url)}
            title={plainText(settings.title) || "Vidéo"}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  );
}
