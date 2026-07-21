"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { generateUniqueShopSlug } from "@/lib/slug";
import { getSiteUrl } from "@/lib/site-url";
import { getNhostAuthUrl } from "@/lib/nhost";

const AUTH_URL = getNhostAuthUrl();

export default function AuthCallbackPage() {
  const [diag, setDiag] = useState<string>("");

  const redirectTo = (slug: string, path: string) => {
    window.location.replace(`${getSiteUrl()}/boutiques/${slug}${path}`);
  };

  async function exchangeRefreshToken(token: string, log: (s: string) => void): Promise<any | null> {
    for (let attempt = 1; attempt <= 4; attempt++) {
      log(`[${attempt}] POST ${AUTH_URL}/token ...`);
      try {
        const res = await fetch(`${AUTH_URL}/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: token }),
        });
        const data = await res.json().catch(() => null);
        log(`[${attempt}] status=${res.status} session=${!!data?.session}${data && !data.session ? " body=" + JSON.stringify(data).slice(0, 200) : ""}`);
        if (data?.session) {
          localStorage.setItem("nhost-auth-session", JSON.stringify(data.session));
          return data.session;
        }
        if (res.status === 429 && attempt < 4) {
          const wait = attempt * 2000;
          log(`[${attempt}] 429 — retry dans ${wait}ms`);
          await new Promise((r) => setTimeout(r, wait));
          continue;
        }
        // token invalide/consommé, pas la peine de retry
        return null;
      } catch (e: any) {
        log(`[${attempt}] network error: ${e?.message || e}`);
        if (attempt < 4) await new Promise((r) => setTimeout(r, 2000));
      }
    }
    return null;
  }

  async function handleCallback() {
    const log = (s: string) => setDiag((d) => d + s + "\n");
    const qs = new URLSearchParams(window.location.search);
    const hashRaw = window.location.hash.replace(/^#/, "");
    const hash = hashRaw ? new URLSearchParams(hashRaw) : new URLSearchParams();

    const allKeys = [
      ...Array.from(qs.keys()),
      ...Array.from(hash.keys()),
    ].filter((k, i, a) => a.indexOf(k) === i);
    log("params: " + (allKeys.join(", ") || "(vide)"));

    const urlError =
      qs.get("error") || hash.get("error") || qs.get("errorCode") || hash.get("errorCode");
    if (urlError) {
      const desc =
        qs.get("errorDescription") ||
        hash.get("errorDescription") ||
        qs.get("error_description") ||
        hash.get("error_description") ||
        "";
      log("Nhost error: " + urlError + " " + desc);
      window.location.replace(`${getSiteUrl()}/login?error=callback_error`);
      return;
    }

    const refreshToken =
      qs.get("refreshToken") || qs.get("refresh_token") || hash.get("refreshToken") || hash.get("refresh_token");
    const code = qs.get("code") || hash.get("code");

    let stored: any = null;
    if (refreshToken) {
      stored = await exchangeRefreshToken(refreshToken, log);
    } else if (code) {
      log("PKCE code détecté (non géré ici)");
    } else {
      log("Aucun refreshToken/code reçu");
    }

    // nettoyer l'URL
    window.history.replaceState({}, "", window.location.pathname);

    if (!stored) {
      window.location.replace(`${getSiteUrl()}/login?error=session_not_found`);
      return;
    }

    // s'assurer que l'adapter voit la session stockée
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      log("getSession null après stockage — adapter?");
      window.location.replace(`${getSiteUrl()}/login?error=session_not_found`);
      return;
    }

    const { data: settings, error: sErr } = await supabase
      .from("settings")
      .select("shop_slug, owner_name, shop_name")
      .eq("user_id", session.user.id);
    log("settings: " + (settings?.length ?? 0) + (sErr ? " err=" + sErr.message : ""));

    if (settings && settings.length === 1) {
      if (settings[0].owner_name && settings[0].shop_name) {
        redirectTo(settings[0].shop_slug, "/admin");
      } else {
        redirectTo(settings[0].shop_slug, "/onboarding");
      }
      return;
    }

    if (settings && settings.length > 1) {
      window.location.replace(`${getSiteUrl()}/login`);
      return;
    }

    const newSlug = await generateUniqueShopSlug(supabase);
    await supabase.from("settings").insert([{ shop_slug: newSlug, user_id: session.user.id }]);
    redirectTo(newSlug, "/onboarding");
  }

  useEffect(() => {
    handleCallback().catch((e) => {
      setDiag((d) => d + "EXCEPTION: " + String(e) + "\n");
      setTimeout(() => {
        window.location.replace(`${getSiteUrl()}/login?error=callback_error`);
      }, 8000);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md w-full">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-500 mb-3">Connexion en cours...</p>
        {diag && (
          <pre className="text-left text-xs bg-gray-100 rounded p-3 overflow-auto max-h-72 whitespace-pre-wrap">
            {diag}
          </pre>
        )}
      </div>
    </div>
  );
}