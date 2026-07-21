"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AuthInitializer() {
  useEffect(() => {
    // /auth/callback gère l'échange OAuth lui-même — ne pas interférer
    if (window.location.pathname.startsWith("/auth/callback")) return;

    const qs = new URLSearchParams(window.location.search);
    if (qs.has("refreshToken") || qs.has("refresh_token") || qs.has("code")) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          window.location.replace("/login");
        } else {
          window.location.replace("/login?error=auth_failed");
        }
      });
    }
  }, []);
  return null;
}
