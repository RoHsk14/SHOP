"use client";

import Script from "next/script";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function MetaPixel({ pixelId }: { pixelId?: string }) {
  const [dbPixelId, setDbPixelId] = useState<string | null>(null);
  const params = useParams();
  const subdomain = params?.subdomain as string | undefined;

  useEffect(() => {
    const fetchPixelId = async () => {
      if (!subdomain) return;
      const { data } = await supabase
        .from("settings")
        .select("pixel_id")
        .eq("shop_slug", subdomain)
        .single();
      
      if (data?.pixel_id) {
        setDbPixelId(data.pixel_id);
      }
    };

    if (!pixelId) {
      fetchPixelId();
    }
  }, [pixelId, subdomain]);

  const id = pixelId || dbPixelId;

  if (!id) return null;

  return (
    <>
      <Script
        id="fb-pixel-base"
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
