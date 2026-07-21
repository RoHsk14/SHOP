"use client";

import Link from "next/link";
import type { SocialLinks } from "@/lib/theme-config";
import { useShop } from "@/lib/shop-context";
import EditableText, { hasTextValue } from "@/components/EditableText";

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
  social?: SocialLinks;
}

const SOCIAL_SVG: Record<string, { path: string; viewBox: string; label: string }> = {
  facebook: { viewBox: "0 0 24 24", label: "Facebook", path: "M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" },
  instagram: { viewBox: "0 0 24 24", label: "Instagram", path: "M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63z" },
  twitter: { viewBox: "0 0 24 24", label: "X", path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
  tiktok: { viewBox: "0 0 24 24", label: "TikTok", path: "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" },
  youtube: { viewBox: "0 0 24 24", label: "YouTube", path: "M23.5 6.19a3.02 3.02 0 00-2.12-2.14c-1.88-.5-9.38-.5-9.38-.5s-7.5 0-9.38.5A3.02 3.02 0 00.5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 002.12 2.14c1.87.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 002.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.54 15.57V8.43L15.82 12l-6.28 3.57z" },
  pinterest: { viewBox: "0 0 24 24", label: "Pinterest", path: "M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z" },
  linkedin: { viewBox: "0 0 24 24", label: "LinkedIn", path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" },
  whatsapp: { viewBox: "0 0 24 24", label: "WhatsApp", path: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" },
  snapchat: { viewBox: "0 0 24 24", label: "Snapchat", path: "M12.065 2a5.526 5.526 0 00-2.643.602A6.228 6.228 0 016.342 5.62c-1.082 1.832-1.268 4.52-.815 7.31-.284.247-.661.493-1.084.714l-.04.022c-.28.144-.586.28-.915.399-.797.289-1.563.484-1.563.76 0 .075.06.15.18.228.221.143.593.28 1.09.402.45.11.95.189 1.415.189.154 0 .302-.008.442-.026.06.013.127.027.203.04.444.084.806.152 1.1.152.276 0 .496-.059.676-.158.166.057.368.108.606.108.386 0 .84-.1 1.325-.243.717-.177 1.61-.451 2.578-.69 2.525-.117 4.017-.286 4.985-.548.888-.24 1.318-.509 1.318-.79 0-.117-.143-.228-.382-.329-.324-.137-.736-.226-1.159-.263a3.4 3.4 0 00-.318-.036l-.106-.012a5.92 5.92 0 01-.236-.04c-.343-.07-.568-.182-.568-.346 0-.651.548-1.22 1.492-1.417.943-.196 2.298-.197 3.084.308.153.098.232.208.232.329 0 .281-.43.55-1.318.79-.968.262-2.46.431-4.985.548-.968-.239-1.86-.513-2.578-.69-.484-.142-.938-.242-1.325-.242-.238 0-.44-.051-.606-.108-.18.099-.4.158-.676.158-.294 0-.656-.068-1.1-.152a2.906 2.906 0 01-.203-.04A3.91 3.91 0 018.23 16c-.466 0-.966-.078-1.416-.189-.497-.121-.869-.26-1.09-.402-.12-.077-.18-.153-.18-.228 0-.275.766-.47 1.562-.76.33-.12.636-.255.915-.399l.041-.022a6.223 6.223 0 01-.068-.103c.079.62.245 1.295.56 1.91.578 1.078 1.597 2.02 3.047 2.53C12.89 18.575 13.983 21 13.983 21h1.04s1.092-2.425 2.422-2.659c1.45-.51 2.469-1.452 3.047-2.53.309-.607.475-1.271.565-1.886l.004.004C21.492 14.285 22 14.603 22 14.859c0 .245-.247.488-.703.694-.667.301-1.56.488-2.6.529-.167 0-.31.01-.426.019a.889.889 0 01-.056.004c-.17.003-.25.041-.265.116 0 .163 0 .894-1.014 1.362-1.015.468-2.594.507-4.936.507-2.343 0-3.922-.039-4.937-.507C6.05 16.221 6.05 15.49 6.05 15.327c-.015-.075-.096-.113-.265-.116a.889.889 0 01-.056-.004 7.53 7.53 0 01-.43-.018c-1.043-.04-1.937-.227-2.605-.528-.458-.206-.706-.45-.706-.695 0-.255.504-.575 1.482-.843-.453-2.79-.267-5.476.814-7.308A6.227 6.227 0 017.58 2.61 5.525 5.525 0 0110.071 2h.028c.662 0 1.304-.012 1.97.002z" },
  telegram: { viewBox: "0 0 24 24", label: "Telegram", path: "M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" },
  messenger: { viewBox: "0 0 24 24", label: "Messenger", path: "M.001 11.639C.001 4.949 5.241 0 12.001 0S24 4.95 24 11.639c0 6.689-5.24 11.638-12 11.638-1.21 0-2.38-.16-3.47-.46a.96.96 0 00-.64.05l-2.39 1.16a.96.96 0 01-1.35-.93v-3.22a.957.957 0 00-.48-.84C1.51 17.458 0 14.742 0 11.639zm8.32-2.86l-3.52 5.6c-.35.53.32 1.14.82.75l3.79-2.87c.26-.2.61-.2.87 0l2.8 2.1c.84.63 2.04.4 2.6-.48l3.52-5.6c.35-.53-.32-1.13-.82-.75l-3.79 2.88c-.25.19-.6.19-.86 0l-2.8-2.1a1.8 1.8 0 00-2.61.48z" },
};

function SocialIcon({ platform }: { platform: string }) {
  const def = SOCIAL_SVG[platform];
  if (!def) return null;
  return (
    <svg viewBox={def.viewBox} className="w-5 h-5" fill="currentColor" aria-label={def.label}>
      <path d={def.path} />
    </svg>
  );
}

function TextBlock({ settings, social }: { settings: Record<string, any>; social?: SocialLinks }) {
  const activeSocials = social
    ? Object.entries(social).filter(([, url]) => url)
    : [];

  return (
    <div>
      {hasTextValue(settings.title) && (
        <EditableText
          as="h3"
          value={settings.title}
          className="text-sm font-bold mb-3"
          style={{ color: "var(--theme-text)", fontFamily: "var(--theme-font-heading)" }}
        />
      )}
      {hasTextValue(settings.content) && (
        <EditableText
          as="p"
          value={settings.content}
          className="text-xs leading-relaxed"
          style={{ color: "var(--theme-text-muted)" }}
        />
      )}
      {(settings.show_social_media && activeSocials.length > 0) && (
        <div className="flex gap-3 mt-4" style={{ color: "var(--theme-text-muted)" }}>
          {activeSocials.map(([platform, url]) => {
            if (!SOCIAL_SVG[platform]) return null;
            return (
              <a
                key={platform}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-70 transition-opacity"
                title={SOCIAL_SVG[platform].label}
              >
                <SocialIcon platform={platform} />
              </a>
            );
          })}
        </div>
      )}
      {(settings.show_social_media && activeSocials.length === 0) && (
        <div className="flex gap-3 mt-4" style={{ color: "var(--theme-text-muted)" }}>
          {Object.keys(SOCIAL_SVG).slice(0, 4).map((k) => (
            <span key={k} className="opacity-30">
              <SocialIcon platform={k} />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function LinksBlock({ settings }: { settings: Record<string, any> }) {
  const { shopLink } = useShop();
  const links = settings.links || [
    { label: "Accueil", url: "/" },
    { label: "Contact", url: "/contact" },
  ];
  return (
    <div>
      {hasTextValue(settings.title) && (
        <EditableText
          as="h3"
          value={settings.title}
          className="text-sm font-bold mb-3"
          style={{ color: "var(--theme-text)", fontFamily: "var(--theme-font-heading)" }}
        />
      )}
      <ul className="space-y-2">
        {links.map((link: any, i: number) => (
          <li key={link.url || link.label || i}>
            <Link
              href={shopLink(link.url)}
              className="text-xs transition-colors hover:opacity-70"
              style={{ color: "var(--theme-text-muted)" }}
              onClick={(e) => {
                if ((e.target as HTMLElement)?.isContentEditable) e.preventDefault();
              }}
            >
              <EditableText as="span" value={link.label} />
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
      {hasTextValue(settings.title) && (
        <EditableText
          as="h3"
          value={settings.title}
          className="text-sm font-bold mb-3"
          style={{ color: "var(--theme-text)", fontFamily: "var(--theme-font-heading)" }}
        />
      )}
      {hasTextValue(settings.content) && (
        <EditableText
          as="p"
          value={settings.content}
          className="text-xs mb-3"
          style={{ color: "var(--theme-text-muted)" }}
        />
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

const blockComponents: Record<string, React.ComponentType<{ settings: Record<string, any>; social?: SocialLinks }>> = {
  text: TextBlock,
  links: LinksBlock,
  newsletter: NewsletterBlock,
};

export default function Footer({ settings, blocks, social }: Props) {
  const { config } = useShop();
  const columns = config?.layout?.footerColumns || 3;
  const colClass = columns === 1 ? "grid-cols-1" : columns === 2 ? "grid-cols-1 sm:grid-cols-2" : columns === 4 ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <footer className="py-10 sm:py-12 mt-8" style={{
      background: "var(--theme-footer-bg, var(--theme-surface))",
      borderTop: "1px solid var(--theme-border)",
    }}>
      <div className="mx-auto px-4 sm:px-6" style={{ maxWidth: "var(--theme-container-width, 1200px)" }}>
        {blocks && blocks.length > 0 && (
          <div className={`grid ${colClass} gap-8 mb-8`}>
            {blocks.map((block) => {
              const Comp = blockComponents[block.type];
              if (!Comp) return null;
              return <Comp key={block.id} settings={block.settings} social={social} />;
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
