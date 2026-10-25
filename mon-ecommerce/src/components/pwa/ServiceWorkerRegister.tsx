"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // Check for updates
          reg.update();
        })
        .catch((err) => {
          console.warn("[SW] Registration error:", err);
        });
    }
  }, []);

  return null;
}
