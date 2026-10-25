"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone, X, Share2, PlusSquare, CheckCircle2, ArrowRight } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export default function PwaInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Detect standalone mode (already installed & running full screen)
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIos(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
      setShowModal(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  if (isStandalone || installed) {
    return null;
  }

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      {/* Sidebar Trigger Card */}
      <div className="relative group">
        <button
          type="button"
          onClick={handleInstallClick}
          className="w-full flex items-center gap-3 p-2.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent hover:from-emerald-500/15 hover:via-teal-500/10 border border-emerald-500/20 hover:border-emerald-500/30 transition-all text-left shadow-xs"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-xs text-gray-900 truncate">Application Vendeur</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded-full shrink-0">
                App
              </span>
            </div>
            <p className="text-[11px] text-gray-500 truncate mt-0.5">
              Installer sur l'écran d'accueil
            </p>
          </div>
          <Download className="w-4 h-4 text-emerald-600 shrink-0 opacity-70 group-hover:opacity-100 group-hover:translate-y-0.5 transition-all" />
        </button>
      </div>

      {/* Modal / Bottom Sheet */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity">
          {/* Backdrop dismiss */}
          <div
            className="absolute inset-0"
            onClick={() => setShowModal(false)}
          />

          {/* Modal Container: Bottom sheet on mobile, centered card on tablet/desktop */}
          <div className="relative z-10 w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-gray-100 p-6 sm:p-7 max-h-[92vh] overflow-y-auto">
            {/* Mobile Grab Handle */}
            <div className="sm:hidden w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4" />

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* App Branding Header */}
            <div className="flex items-center gap-4 mb-5">
              <img
                src="/icons/icon-192x192.png"
                alt="Shopeazy"
                className="w-14 h-14 rounded-2xl shadow-md border border-gray-100 object-cover shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-gray-900 truncate">
                    Shopeazy Vendeur
                  </h3>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full shrink-0">
                    Officiel
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Gestion des commandes et boutique
                </p>
                <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-1">
                  <span>Accès rapide</span>
                  <span>•</span>
                  <span>Plein écran</span>
                  <span>•</span>
                  <span>Gratuit</span>
                </div>
              </div>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="mb-6 rounded-2xl border border-gray-100 bg-gray-50/70 divide-y divide-gray-100 overflow-hidden">
              {/* Step 1 */}
              <div className="p-3.5 flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  <Share2 className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 leading-tight">
                    1. Appuyez sur Partager
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                    {isIos
                      ? "Dans la barre du bas de Safari (icône carré avec flèche vers le haut)."
                      : "Dans la barre du navigateur ou le menu ⋮ en haut à droite."}
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-3.5 flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  <PlusSquare className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 leading-tight">
                    2. Sélectionnez "Sur l'écran d'accueil"
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                    Faites défiler les options du menu vers le bas pour trouver la ligne.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-3.5 flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 leading-tight">
                    3. Touchez "Ajouter"
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                    L'application s'installe sur votre écran d'accueil avec son icône dédiée.
                  </p>
                </div>
              </div>
            </div>

            {/* Direct install prompt if available (e.g. Android) or Action button */}
            {deferredPrompt ? (
              <button
                type="button"
                onClick={handleInstallClick}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-semibold shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                <span>Installer l'application</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-full py-3.5 px-5 rounded-2xl bg-gray-900 hover:bg-black text-white text-xs font-semibold shadow-sm transition-all active:scale-[0.99]"
              >
                Fermer
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
