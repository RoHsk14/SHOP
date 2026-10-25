"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing, Check, Volume2, X } from "lucide-react";
import { playNotificationSound } from "@/lib/notification-sound";
import { toast } from "sonner";

export default function NotificationBell({ shopSlug }: { shopSlug?: string }) {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    } else {
      setPermission("unsupported");
    }
  }, []);

  const requestPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("Votre navigateur ne supporte pas les notifications.");
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        playNotificationSound();
        toast.success("Notifications activées !");

        // Send a test notification
        if ("serviceWorker" in navigator) {
          const reg = await navigator.serviceWorker.ready;
          reg.showNotification("Notifications Shopeazy actives", {
            body: "Vous recevrez une alerte en temps réel pour chaque commande reçue.",
            icon: "/icons/icon-192x192.png",
            badge: "/icons/icon-192x192.png",
            vibrate: [200, 100, 200],
          } as any);
        } else {
          new Notification("Notifications Shopeazy actives", {
            body: "Vous recevrez une alerte en temps réel pour chaque commande reçue.",
            icon: "/icons/icon-192x192.png",
          });
        }
      } else if (result === "denied") {
        toast.error("Autorisation refusée. Veuillez activer les notifications dans les réglages de votre navigateur.");
      }
    } catch (e) {
      console.error("Error requesting notification permission:", e);
    }
  };

  const testNotification = async () => {
    playNotificationSound();
    const title = "Nouvelle commande #1042";
    const body = "Moussa Diop vient de commander pour 24 500 XOF";

    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      if ("serviceWorker" in navigator) {
        try {
          const reg = await navigator.serviceWorker.ready;
          reg.showNotification(title, {
            body,
            icon: "/icons/icon-192x192.png",
            badge: "/icons/icon-192x192.png",
            tag: "test-order",
            vibrate: [200, 100, 200],
            data: { url: shopSlug ? `/boutiques/${shopSlug}/admin/orders` : "/admin/orders" },
          } as any);
        } catch {
          new Notification(title, { body, icon: "/icons/icon-192x192.png" });
        }
      } else {
        new Notification(title, { body, icon: "/icons/icon-192x192.png" });
      }
    }
    toast.success("Alerte de test envoyée !");
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-8 h-8 bg-white border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-all text-gray-600 hover:text-gray-900 relative"
        title="Notifications de commandes"
      >
        {permission === "granted" ? (
          <>
            <BellRing className="w-4 h-4 text-emerald-600" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
          </>
        ) : permission === "denied" ? (
          <BellOff className="w-4 h-4 text-red-500" />
        ) : (
          <>
            <Bell className="w-4 h-4 text-gray-500" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-amber-500 rounded-full" />
          </>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50 text-gray-900 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  permission === "granted" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-600"
                }`}>
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900">Alertes commandes</h4>
                  <p className="text-[10px] text-gray-400">Notifications sonores et push</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-3 text-xs">
              {permission === "granted" ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50/70 border border-emerald-200/50 p-2.5 rounded-xl">
                    <Check className="w-4 h-4 shrink-0" />
                    <span className="text-[11px] font-medium leading-tight">
                      Notifications actives : vous recevez un son et une alerte à chaque commande.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={testNotification}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-[11px] font-semibold transition-all"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    Tester une alerte commande
                  </button>
                </div>
              ) : permission === "denied" ? (
                <div className="space-y-2">
                  <p className="text-[11px] text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100">
                    Les notifications sont bloquées dans votre navigateur. Cliquez sur l'icône de cadenas ou de réglages à gauche de la barre d'adresse pour les autoriser.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[11px] text-gray-600 leading-normal">
                    Ne ratez aucune vente : recevez une notification visuelle et sonore dès qu'un client passe commande, même écran verrouillé.
                  </p>

                  <button
                    type="button"
                    onClick={requestPermission}
                    className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all"
                  >
                    Activer les alertes de commandes
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
