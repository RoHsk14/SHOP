"use client";

import Script from "next/script";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
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
        setDbPixelId(data.pixel_id.trim().replace(/\s+/g, ""));
      }
    };

    if (!pixelId) {
      fetchPixelId();
    }
  }, [pixelId, pathname]);

  const rawId = pixelId || dbPixelId;
  const id = rawId ? rawId.trim().replace(/\s+/g, "") : null;

  // 2. Écouter les changements de page pour renvoyer PageView
  useEffect(() => {
    if (!id || typeof window === "undefined") return;

    const win = window as any;
    if (typeof win.fbq === "function") {
      win.fbq("track", "PageView");
    }

    // Conversions API (CAPI)
    const shopSlug = getEffectiveShopSlug();
    if (shopSlug) {
      const eventId = `pv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      fetch("/api/meta/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_name: "PageView",
          event_id: eventId,
          shop_slug: shopSlug,
        }),
        keepalive: true,
      }).catch(() => {});
    }
  }, [id, pathname]);

  if (!id) return null;

  return (
    <>
      <Script
        id={`fb-pixel-${id}`}
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${id}');
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
