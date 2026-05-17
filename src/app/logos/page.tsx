"use client";

import { useState } from "react";

const LOGOS = [
  {
    id: "emerald-bag",
    name: "Sac Emeraude",
    svg: `<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="120" rx="24" fill="url(#g1)"/>
      <defs><linearGradient id="g1" x1="0" y1="0" x2="120" y2="120"><stop stop-color="#059669"/><stop offset="1" stop-color="#0d9488"/></linearGradient></defs>
      <path d="M36 52L48 32H72L84 52v28a4 4 0 01-4 4H40a4 4 0 01-4-4V52z" stroke="white" stroke-width="3" fill="none" stroke-linejoin="round"/>
      <path d="M48 52V42a12 12 0 0124 0v10" stroke="white" stroke-width="3" fill="none" stroke-linecap="round"/>
      <circle cx="72" cy="50" r="3" fill="white"/>
    </svg>`,
  },
  {
    id: "leaf-shop",
    name: "Feuille Boutique",
    svg: `<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="120" rx="24" fill="#f0fdf4"/>
      <circle cx="60" cy="60" r="32" fill="#059669" opacity="0.1"/>
      <path d="M60 38c-6 0-12 4-14 12-2 8 2 16 8 20l6 8 6-8c6-4 10-12 8-20-2-8-8-12-14-12zM60 44v24M52 56h16" stroke="#059669" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    </svg>`,
  },
  {
    id: "diamond",
    name: "Diamant Vert",
    svg: `<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="120" rx="24" fill="url(#g3)"/>
      <defs><linearGradient id="g3" x1="0" y1="0" x2="120" y2="120"><stop stop-color="#10b981"/><stop offset="1" stop-color="#047857"/></linearGradient></defs>
      <path d="M60 28L34 52l26 38 26-38L60 28z" stroke="white" stroke-width="2.5" fill="none" stroke-linejoin="round"/>
      <path d="M60 28v62M34 52h52" stroke="white" stroke-width="2" opacity="0.5"/>
      <circle cx="60" cy="60" r="6" fill="white" opacity="0.3"/>
    </svg>`,
  },
  {
    id: "cart-modern",
    name: "Panier Moderne",
    svg: `<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="120" rx="24" fill="white" stroke="#059669" stroke-width="2"/>
      <path d="M32 42h56l-6 34a4 4 0 01-4 3H42a4 4 0 01-4-3l-6-34z" stroke="#059669" stroke-width="2.5" fill="none" stroke-linejoin="round"/>
      <circle cx="48" cy="82" r="5" fill="#059669"/>
      <circle cx="76" cy="82" r="5" fill="#059669"/>
      <path d="M44 42l6-14h20l6 14" stroke="#059669" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    </svg>`,
  },
  {
    id: "store-front",
    name: "Façade Boutique",
    svg: `<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="120" rx="24" fill="url(#g5)"/>
      <defs><linearGradient id="g5" x1="0" y1="0" x2="120" y2="120"><stop stop-color="#059669"/><stop offset="1" stop-color="#34d399"/></linearGradient></defs>
      <path d="M28 50v36a4 4 0 004 4h56a4 4 0 004-4V50" stroke="white" stroke-width="2.5" fill="none"/>
      <path d="M24 50h72l-10-16H34L24 50zM44 66h32v20H44z" stroke="white" stroke-width="2.5" fill="none" stroke-linejoin="round"/>
      <path d="M56 66v20M64 66v20" stroke="white" stroke-width="1.5" opacity="0.4"/>
      <circle cx="84" cy="40" r="4" fill="#fbbf24"/>
    </svg>`,
  },
  {
    id: "circle-s",
    name: "Cercle S",
    svg: `<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="120" rx="60" fill="url(#g6)"/>
      <defs><linearGradient id="g6" x1="0" y1="0" x2="120" y2="120"><stop stop-color="#059669"/><stop offset="1" stop-color="#0d9488"/></linearGradient></defs>
      <path d="M52 42c-4 2-8 6-8 12s3 10 8 12c6 2 14 2 18 0s6-6 6-10-3-8-8-10c-4-2-10-2-16 0s-10 6-12 12" stroke="white" stroke-width="4" stroke-linecap="round" fill="none"/>
    </svg>`,
  },
  {
    id: "shield-check",
    name: "Bouclier Sécurisé",
    svg: `<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="120" rx="24" fill="#f0fdf4"/>
      <path d="M60 26L32 36v14c0 24 12 38 28 44 16-6 28-20 28-44V36L60 26z" stroke="#059669" stroke-width="2.5" fill="#059669" fill-opacity="0.08" stroke-linejoin="round"/>
      <path d="M48 58l8 8 16-18" stroke="#059669" stroke-width="3" stroke-linecap="round" fill="none"/>
    </svg>`,
  },
  {
    id: "tag-price",
    name: "Étiquette Prix",
    svg: `<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="120" height="120" rx="24" fill="url(#g8)"/>
      <defs><linearGradient id="g8" x1="0" y1="0" x2="120" y2="120"><stop stop-color="#10b981"/><stop offset="1" stop-color="#047857"/></linearGradient></defs>
      <path d="M36 72l-4-6 24-28 28 28-24 28-4-6" stroke="white" stroke-width="2.5" fill="none" stroke-linejoin="round"/>
      <circle cx="44" cy="50" r="4" fill="white"/>
      <path d="M38 52l-6 14 16-6" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    </svg>`,
  },
];

export default function LogoSelector() {
  const [selected, setSelected] = useState<string | null>(null);

  const copySvg = (svg: string) => {
    navigator.clipboard.writeText(svg);
    setSelected(svg);
    setTimeout(() => setSelected(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Choisissez un logo</h1>
        <p className="text-sm text-gray-500 mb-8">Cliquez sur un logo pour copier le SVG. Collez-le ensuite dans votre code.</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {LOGOS.map((logo) => (
            <button
              key={logo.id}
              onClick={() => copySvg(logo.svg)}
              className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg hover:border-emerald-300 transition-all group text-center"
            >
              <div className="w-24 h-24 mx-auto mb-3" dangerouslySetInnerHTML={{ __html: logo.svg }} />
              <p className="text-sm font-medium text-gray-700 group-hover:text-emerald-600">{logo.name}</p>
            </button>
          ))}
        </div>

        {selected && (
          <div className="fixed bottom-6 right-6 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-slide-up">
            ✅ SVG copié dans le presse-papier
          </div>
        )}
      </div>
    </div>
  );
}
