"use client";

import type { SocialLinks, SocialPlatform } from "@/lib/theme-config";

const PLATFORMS: { key: SocialPlatform; label: string; icon: string; placeholder: string }[] = [
  { key: "facebook", label: "Facebook", icon: "facebook", placeholder: "https://facebook.com/mapage" },
  { key: "instagram", label: "Instagram", icon: "instagram", placeholder: "https://instagram.com/moncompte" },
  { key: "twitter", label: "X (Twitter)", icon: "twitter", placeholder: "https://x.com/moncompte" },
  { key: "tiktok", label: "TikTok", icon: "tiktok", placeholder: "https://tiktok.com/@moncompte" },
  { key: "youtube", label: "YouTube", icon: "youtube", placeholder: "https://youtube.com/@machaine" },
  { key: "pinterest", label: "Pinterest", icon: "pinterest", placeholder: "https://pinterest.com/moncompte" },
  { key: "linkedin", label: "LinkedIn", icon: "linkedin", placeholder: "https://linkedin.com/in/monprofil" },
  { key: "whatsapp", label: "WhatsApp", icon: "whatsapp", placeholder: "https://wa.me/22500000000" },
  { key: "snapchat", label: "Snapchat", icon: "snapchat", placeholder: "https://snapchat.com/add/moncompte" },
  { key: "telegram", label: "Telegram", icon: "telegram", placeholder: "https://t.me/moncompte" },
  { key: "messenger", label: "Messenger", icon: "messenger", placeholder: "https://m.me/mapage" },
];

const ICONS: Record<string, string> = {
  facebook: "📘",
  instagram: "📷",
  twitter: "𝕏",
  tiktok: "🎵",
  youtube: "▶️",
  pinterest: "📌",
  linkedin: "💼",
  whatsapp: "💬",
  snapchat: "👻",
  telegram: "✈️",
  messenger: "💭",
};

export default function TabSocial({
  social,
  onChange,
}: {
  social: SocialLinks;
  onChange: (s: SocialLinks) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">Ajoutez les liens vers vos réseaux sociaux. Ils apparaîtront dans le pied de page et les sections qui les utilisent.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PLATFORMS.map(({ key, label, placeholder }) => (
          <div key={key} className="flex items-center gap-3">
            <span className="text-lg w-8 text-center shrink-0">{ICONS[key]}</span>
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-medium text-gray-500 mb-0.5">{label}</label>
              <input
                type="url"
                value={social[key] || ""}
                onChange={(e) => onChange({ ...social, [key]: e.target.value })}
                placeholder={placeholder}
                className="w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
