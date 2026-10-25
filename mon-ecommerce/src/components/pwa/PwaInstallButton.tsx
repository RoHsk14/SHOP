"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone, X, Share, PlusSquare } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export default function PwaInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    const checkStandalone = () => {
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Do not display if already installed and running standalone
  if (isStandalone || installed) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosModal(true);
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback instructions for desktop or unsupported browsers
      setShowIosModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60"
        title="Installer l'application commerçant"
      >
        <div className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-sm transition-all">
          <Smartphone className="w-4 h-4" />
        </div>
        <div className="text-left min-w-0">
          <p className="font-semibold text-xs text-emerald-900 leading-tight">Installer l'app</p>
          <p className="text-[10px] text-emerald-700 leading-tight">Accès direct écran d'accueil</p>
        </div>
        <Download className="w-3.5 h-3.5 text-emerald-600 ml-auto shrink-0 group-hover:translate-y-0.5 transition-transform" />
      </button>

      {/* Guide modal for iOS or manual install */}
      {showIosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-gray-100 text-gray-900 relative">
            <button
              type="button"
              onClick={() => setShowIosModal(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white mb-4 shadow-md">
              <Smartphone className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-gray-900 mb-1">
              Installer Shopeazy Vendeur
            </h3>
            <p className="text-xs text-gray-500 mb-5">
              Ajoutez l'espace commerçant sur l'écran d'accueil de votre smartphone pour y accéder en un clic comme une application.
            </p>

            <div className="space-y-3 mb-6 text-xs text-gray-700">
              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-800 shrink-0">
                  1
                </div>
                <div className="pt-0.5">
                  <p className="font-medium text-gray-900">
                    Appuyez sur le bouton Partager
                  </p>
                  <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                    Icône <Share className="w-3 h-3 inline text-blue-600" /> dans Safari ou le menu en haut à droite sur Chrome.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-800 shrink-0">
                  2
                </div>
                <div className="pt-0.5">
                  <p className="font-medium text-gray-900">
                    Sélectionnez "Sur l'écran d'accueil"
                  </p>
                  <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                    Option avec l'icône <PlusSquare className="w-3 h-3 inline text-gray-700" />.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center font-bold text-gray-800 shrink-0">
                  3
                </div>
                <div className="pt-0.5">
                  <p className="font-medium text-gray-900">
                    Confirmez en cliquant sur "Ajouter"
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    L'icône Shopeazy Vendeur apparaîtra sur votre écran d'accueil.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosModal(false)}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
            >
              Compris
            </button>
          </div>
        </div>
      )}
    </>
  );
}
