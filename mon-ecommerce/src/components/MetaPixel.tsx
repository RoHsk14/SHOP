"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { extractSubdomain } from "@/lib/host";

function getEffectiveShopSlug(): string | null {
  if (typeof window === "undefined") return null;
  const sub = extractSubdomain(window.location.host);
  if (sub) return sub;
  const match = window.location.pathname.match(/^\/boutiques\/([^\/]+)/);
  return match ? match[1] : null;
}

export default function MetaPixel({ pixelId }: { pixelId?: string }) {
  const [dbPixelId, setDbPixelId] = useState<string | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initializedPixels = useRef<Set<string>>(new Set());

  // 1. Récupérer le Pixel ID de la boutique
  useEffect(() => {
    const fetchPixelId = async () => {
      const shopSlug = getEffectiveShopSlug();
      if (!shopSlug) return;

      const { data, error } = await supabase
        .from("settings")
        .select("pixel_id")
        .eq("shop_slug", shopSlug)
        .maybeSingle();

      if (error) {
        console.error("MetaPixel: Supabase error", error);
      }

      if (data?.pixel_id) {
        setDbPixelId(data.pixel_id.trim());
      }
    };

    if (!pixelId) {
      fetchPixelId();
    }
  }, [pixelId, pathname]);

  const id = (pixelId || dbPixelId)?.trim();

  // 2. Initialiser le script fbevents.js et tracker les événements
  useEffect(() => {
    if (!id || typeof window === "undefined") return;

    const win = window as any;

    // Charger le SDK Meta Pixel si pas encore chargé
    if (!win.fbq) {
      win.fbq = function () {
        win.fbq.callMethod
          ? win.fbq.callMethod.apply(win.fbq, arguments)
          : win.fbq.queue.push(arguments);
      };
      if (!win._fbq) win._fbq = win.fbq;
      win.fbq.push = win.fbq;
      win.fbq.loaded = true;
      win.fbq.version = "2.0";
      win.fbq.queue = [];

      const script = document.createElement("script");
      script.async = true;
      script.src = "https://connect.facebook.net/en_US/fbevents.js";
      document.head.appendChild(script);
    }

    // Initialiser le pixel s'il ne l'est pas déjà pour cet ID
    if (!initializedPixels.current.has(id)) {
      win.fbq("init", id);
      initializedPixels.current.add(id);
    }

    // Envoyer l'événement PageView dans le navigateur
    const eventId = `pv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    win.fbq("track", "PageView", {}, { eventID: eventId });

    // Envoyer l'événement PageView via l'API de conversion (CAPI)
    const shopSlug = getEffectiveShopSlug();
    if (shopSlug) {
      fetch("/api/meta/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_name: "PageView",
          event_id: eventId,
          shop_slug: shopSlug,
        }),
        keepalive: true,
      }).catch((err) => {
        console.error("MetaPixel CAPI PageView error:", err);
      });
    }
  }, [id, pathname, searchParams]);

  if (!id) return null;

  return (
    <noscript>
      <img
        height="1"
        width="1"
        style={{ display: "none" }}
        src={`https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1`}
        alt=""
      />
    </noscript>
  );
}
