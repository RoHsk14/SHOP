"use client";

import Link from "next/link";

interface FooterBlock {
  id: string;
  type: string;
  settings: Record<string, any>;
}

interface Props {
  settings: {
    show_payment_methods?: boolean;
  };
  blocks?: FooterBlock[];
}

function TextBlock({ settings }: { settings: Record<string, any> }) {
  return (
    <div>
      {settings.title && (
        <h3 className="text-sm font-bold mb-3" style={{ color: "var(--theme-text)", fontFamily: "var(--theme-font-heading)" }}>
          {settings.title}
        </h3>
      )}
      {settings.content && (
        <p className="text-xs leading-relaxed" style={{ color: "var(--theme-text-muted)" }}>
          {settings.content}
        </p>
      )}
      {settings.show_social_media && (
        <div className="flex gap-3 mt-4">
          {/* Placeholder social icons — à remplacer par vrais liens */}
          <span className="text-xs" style={{ color: "var(--theme-text-muted)" }}>📘</span>
          <span className="text-xs" style={{ color: "var(--theme-text-muted)" }}>📷</span>
          <span className="text-xs" style={{ color: "var(--theme-text-muted)" }}>🐦</span>
        </div>
      )}
    </div>
  );
}

function LinksBlock({ settings }: { settings: Record<string, any> }) {
  const links = settings.links || [
    { label: "Accueil", url: "/" },
    { label: "Contact", url: "/contact" },
  ];
  return (
    <div>
      {settings.title && (
        <h3 className="text-sm font-bold mb-3" style={{ color: "var(--theme-text)", fontFamily: "var(--theme-font-heading)" }}>
          {settings.title}
        </h3>
      )}
      <ul className="space-y-2">
        {links.map((link: any, i: number) => (
          <li key={i}>
            <Link
              href={link.url}
              className="text-xs transition-colors hover:opacity-70"
              style={{ color: "var(--theme-text-muted)" }}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function NewsletterBlock({ settings }: { settings: Record<string, any> }) {
  return (
    <div>
      {settings.title && (
        <h3 className="text-sm font-bold mb-3" style={{ color: "var(--theme-text)", fontFamily: "var(--theme-font-heading)" }}>
          {settings.title}
        </h3>
      )}
      {settings.content && (
        <p className="text-xs mb-3" style={{ color: "var(--theme-text-muted)" }}>
          {settings.content}
        </p>
      )}
      <form className="flex gap-2">
        <input
          type="email"
          placeholder="Votre email"
          className="flex-1 text-xs px-3 py-2"
          style={{
            background: "var(--theme-surface)",
            border: "1px solid var(--theme-border)",
            borderRadius: "var(--theme-radius-input)",
            color: "var(--theme-text)",
          }}
        />
        <button
          type="submit"
          className="px-3 py-2 text-xs font-semibold text-white"
          style={{
            background: "var(--theme-primary)",
            borderRadius: "var(--theme-radius-button)",
          }}
        >
          OK
        </button>
      </form>
    </div>
  );
}

const blockComponents: Record<string, React.ComponentType<{ settings: Record<string, any> }>> = {
  text: TextBlock,
  links: LinksBlock,
  newsletter: NewsletterBlock,
};

export default function Footer({ settings, blocks }: Props) {
  return (
    <footer className="py-10 sm:py-12 mt-8" style={{
      background: "var(--theme-surface)",
      borderTop: "1px solid var(--theme-border)",
    }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        {blocks && blocks.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
            {blocks.map((block) => {
              const Comp = blockComponents[block.type];
              if (!Comp) return null;
              return <Comp key={block.id} settings={block.settings} />;
            })}
          </div>
        )}
        <div className="text-center text-xs" style={{ color: "var(--theme-text-muted)" }}>
          &copy; {new Date().getFullYear()} ShopEazy. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
