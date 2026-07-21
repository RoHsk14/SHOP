"use client";

import type { LayoutSettings, BackToTopSettings, NewsletterPopupSettings, CookieSettings } from "@/lib/theme-config";

interface Props {
  layout: LayoutSettings;
  backToTop: BackToTopSettings;
  newsletterPopup: NewsletterPopupSettings;
  cookie: CookieSettings;
  onLayoutChange: (layout: LayoutSettings) => void;
  onBackToTopChange: (s: BackToTopSettings) => void;
  onNewsletterChange: (s: NewsletterPopupSettings) => void;
  onCookieChange: (s: CookieSettings) => void;
}

const toggleClass =
  "relative inline-flex h-5 w-9 items-center rounded-full cursor-pointer transition-colors";

export default function TabSettings({
  layout, backToTop, newsletterPopup, cookie,
  onLayoutChange, onBackToTopChange, onNewsletterChange, onCookieChange,
}: Props) {
  return (
    <div className="space-y-6 max-w-xl">
      {/* Layout */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Mise en page</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">Afficher la recherche</p>
              <p className="text-xs text-gray-400">Barre de recherche dans l'en-tête</p>
            </div>
            <button
              onClick={() => onLayoutChange({ ...layout, showSearch: !layout.showSearch })}
              className={`${toggleClass} ${layout.showSearch ? "bg-emerald-500" : "bg-gray-200"}`}
            >
              <span className={`inline-block w-4 h-4 rounded-full bg-white shadow transform transition-transform ${layout.showSearch ? "translate-x-4.5" : "translate-x-0.5"}`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">Afficher le panier</p>
              <p className="text-xs text-gray-400">Icône panier dans l'en-tête</p>
            </div>
            <button
              onClick={() => onLayoutChange({ ...layout, showCart: !layout.showCart })}
              className={`${toggleClass} ${layout.showCart ? "bg-emerald-500" : "bg-gray-200"}`}
            >
              <span className={`inline-block w-4 h-4 rounded-full bg-white shadow transform transition-transform ${layout.showCart ? "translate-x-4.5" : "translate-x-0.5"}`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">Afficher les favoris</p>
              <p className="text-xs text-gray-400">Icône wishlist dans l'en-tête</p>
            </div>
            <button
              onClick={() => onLayoutChange({ ...layout, showWishlist: !layout.showWishlist })}
              className={`${toggleClass} ${layout.showWishlist ? "bg-emerald-500" : "bg-gray-200"}`}
            >
              <span className={`inline-block w-4 h-4 rounded-full bg-white shadow transform transition-transform ${layout.showWishlist ? "translate-x-4.5" : "translate-x-0.5"}`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">Type de panier</p>
              <p className="text-xs text-gray-400">Tiroir latéral ou page dédiée</p>
            </div>
            <select
              value={layout.cartType || "drawer"}
              onChange={(e) => onLayoutChange({ ...layout, cartType: e.target.value as any })}
              className="text-sm px-3 py-1.5 border border-gray-200 rounded-lg bg-white text-gray-700"
            >
              <option value="drawer">Tiroir</option>
              <option value="page">Page</option>
            </select>
          </div>
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* Back to top */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Retour en haut</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-700">Bouton retour en haut</p>
            <p className="text-xs text-gray-400">Afficher un bouton pour remonter la page</p>
          </div>
          <button
            onClick={() => onBackToTopChange({ ...backToTop, enabled: !backToTop.enabled })}
            className={`${toggleClass} ${backToTop.enabled ? "bg-emerald-500" : "bg-gray-200"}`}
          >
            <span className={`inline-block w-4 h-4 rounded-full bg-white shadow transform transition-transform ${backToTop.enabled ? "translate-x-4.5" : "translate-x-0.5"}`} />
          </button>
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* Newsletter popup */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Popup Newsletter</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700">Activer la popup</p>
              <p className="text-xs text-gray-400">Proposition d'inscription à la newsletter</p>
            </div>
            <button
              onClick={() => onNewsletterChange({ ...newsletterPopup, enabled: !newsletterPopup.enabled })}
              className={`${toggleClass} ${newsletterPopup.enabled ? "bg-emerald-500" : "bg-gray-200"}`}
            >
              <span className={`inline-block w-4 h-4 rounded-full bg-white shadow transform transition-transform ${newsletterPopup.enabled ? "translate-x-4.5" : "translate-x-0.5"}`} />
            </button>
          </div>
          {newsletterPopup.enabled && (
            <div className="ml-4 p-3 bg-gray-50 rounded-lg space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Titre</label>
                <input
                  type="text"
                  value={newsletterPopup.title}
                  onChange={(e) => onNewsletterChange({ ...newsletterPopup, title: e.target.value })}
                  className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Message</label>
                <input
                  type="text"
                  value={newsletterPopup.content}
                  onChange={(e) => onNewsletterChange({ ...newsletterPopup, content: e.target.value })}
                  className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-lg"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-600">Délai (secondes):</label>
                <input
                  type="number"
                  value={newsletterPopup.delay}
                  onChange={(e) => onNewsletterChange({ ...newsletterPopup, delay: Number(e.target.value) })}
                  className="w-20 text-sm px-2 py-1 border border-gray-200 rounded-lg"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* Cookie banner */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Bannière cookies</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-700">Afficher la bannière</p>
            <p className="text-xs text-gray-400">Message d'information sur les cookies</p>
          </div>
          <button
            onClick={() => onCookieChange({ ...cookie, enabled: !cookie.enabled })}
            className={`${toggleClass} ${cookie.enabled ? "bg-emerald-500" : "bg-gray-200"}`}
          >
            <span className={`inline-block w-4 h-4 rounded-full bg-white shadow transform transition-transform ${cookie.enabled ? "translate-x-4.5" : "translate-x-0.5"}`} />
          </button>
        </div>
        {cookie.enabled && (
          <div className="mt-2 ml-4 p-3 bg-gray-50 rounded-lg space-y-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Message</label>
              <input
                type="text"
                value={cookie.message || ""}
                onChange={(e) => onCookieChange({ ...cookie, message: e.target.value })}
                className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-lg"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Texte accepter</label>
                <input
                  type="text"
                  value={cookie.buttonText || ""}
                  onChange={(e) => onCookieChange({ ...cookie, buttonText: e.target.value })}
                  className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-lg"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">Texte refuser</label>
                <input
                  type="text"
                  value={cookie.declineText || ""}
                  onChange={(e) => onCookieChange({ ...cookie, declineText: e.target.value })}
                  className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-lg"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
