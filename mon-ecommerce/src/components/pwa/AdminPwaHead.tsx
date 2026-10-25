"use client";

import { useEffect } from "react";

/**
 * AdminPwaHead - Strictly injects PWA manifest and registers Service Worker
 * ONLY for merchant dashboard and login pages.
 * Customer storefronts will NEVER load or see this.
 */
export default function AdminPwaHead() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Register Service Worker for merchant notifications & caching
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          reg.update();
        })
        .catch((err) => {
          console.warn("[SW] Registration error:", err);
        });
    }

    // 2. Inject admin manifest into head
    let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
    if (!manifestLink) {
      manifestLink = document.createElement("link");
      manifestLink.rel = "manifest";
      manifestLink.href = "/admin-manifest.json";
      document.head.appendChild(manifestLink);
    } else {
      manifestLink.href = "/admin-manifest.json";
    }

    // 3. Apple Touch Icon & iOS PWA meta
    let appleIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement | null;
    if (!appleIcon) {
      appleIcon = document.createElement("link");
      appleIcon.rel = "apple-touch-icon";
      appleIcon.href = "/apple-touch-icon.png";
      document.head.appendChild(appleIcon);
    }

    let appleCapable = document.querySelector('meta[name="apple-mobile-web-app-capable"]') as HTMLMetaElement | null;
    if (!appleCapable) {
      appleCapable = document.createElement("meta");
      appleCapable.name = "apple-mobile-web-app-capable";
      appleCapable.content = "yes";
      document.head.appendChild(appleCapable);
    }

    let appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]') as HTMLMetaElement | null;
    if (!appleTitle) {
      appleTitle = document.createElement("meta");
      appleTitle.name = "apple-mobile-web-app-title";
      appleTitle.content = "Shopeazy Admin";
      document.head.appendChild(appleTitle);
    }

    return () => {
      // Cleanup if navigating out of admin
      const m = document.querySelector('link[rel="manifest"][href*="admin-manifest"]');
      if (m) m.remove();
    };
  }, []);

  return null;
}
