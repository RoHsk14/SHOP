"use client";

interface Props {
  settings: {
    html?: string;
    full_width?: boolean;
  };
}

export default function CustomHtml({ settings }: Props) {
  if (!settings.html) return null;

  return (
    <div
      className={settings.full_width ? "w-full" : "mx-auto"}
      style={!settings.full_width ? { maxWidth: "var(--theme-container-width, 1200px)" } : undefined}
    >
      <div
        dangerouslySetInnerHTML={{ __html: settings.html }}
        className="prose prose-sm max-w-none"
      />
    </div>
  );
}
