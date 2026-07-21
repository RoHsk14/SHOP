"use client";

import { useEffect } from "react";
import type { AnalyticsSettings } from "@/lib/theme-config";

interface Props {
  analytics?: AnalyticsSettings;
}

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

export default function AnalyticsTracker({ analytics }: Props) {
  useEffect(() => {
    if (!analytics) return;

    if (analytics.googleTagManager) {
      const gtmId = analytics.googleTagManager.trim();
      if (gtmId) {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
        const script = document.createElement("script");
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
        document.head.appendChild(script);
        return () => {
          document.head.querySelector(`script[src*="${gtmId}"]`)?.remove();
        };
      }
    }

    if (analytics.googleAnalytics) {
      const gaId = analytics.googleAnalytics.trim();
      if (gaId) {
        window.dataLayer = window.dataLayer || [];
        if (!window.gtag) {
          window.gtag = function () { window.dataLayer.push(arguments); };
        }
        window.gtag("js", new Date());
        window.gtag("config", gaId);

        const script = document.createElement("script");
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
        document.head.appendChild(script);
        return () => {
          document.head.querySelector(`script[src*="${gaId}"]`)?.remove();
        };
      }
    }

    if (analytics.facebookPixel) {
      const pixelId = analytics.facebookPixel.trim();
      if (pixelId) {
        const win = window as any;
        win.fbq = win.fbq || function () { win.fbq.callMethod ? win.fbq.callMethod.apply(win.fbq, arguments) : win.fbq.queue.push(arguments); };
        if (!win.fbq.queue) win.fbq.queue = [];
        win.fbq("init", pixelId);
        win.fbq("track", "PageView");

        const script = document.createElement("script");
        script.async = true;
        script.src = "https://connect.facebook.net/en_US/fbevents.js";
        document.head.appendChild(script);

        const noscript = document.createElement("noscript");
        const img = document.createElement("img");
        img.height = 1;
        img.width = 1;
        img.style.display = "none";
        img.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`;
        noscript.appendChild(img);
        document.body.appendChild(noscript);

        return () => {
          noscript.remove();
          document.head.querySelector('script[src*="fbevents.js"]')?.remove();
        };
      }
    }
  }, [analytics?.googleAnalytics, analytics?.googleTagManager, analytics?.facebookPixel]);

  return null;
}
