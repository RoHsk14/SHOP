"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { generateUniqueShopSlug } from "@/lib/slug";

export default function AuthCallbackPage() {
  const redirectTo = (slug: string, path: string) => {
    window.location.replace(`http://localhost:3000/boutiques/${slug}${path}`);
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        window.location.replace("http://localhost:3000/login?error=session_not_found");
        return;
      }

      const { data: settings } = await supabase
        .from("settings")
        .select("shop_slug, owner_name, shop_name")
        .eq("user_id", session.user.id);

      if (settings && settings.length === 1) {
        if (settings[0].owner_name && settings[0].shop_name) {
          redirectTo(settings[0].shop_slug, "/admin");
        } else {
          redirectTo(settings[0].shop_slug, "/onboarding");
        }
        return;
      }

      if (settings && settings.length > 1) {
        window.location.replace("http://localhost:3000/login");
        return;
      }

      const newSlug = await generateUniqueShopSlug(supabase);
      await supabase.from("settings").insert([{ shop_slug: newSlug, user_id: session.user.id }]);
      redirectTo(newSlug, "/onboarding");
    }).catch(() => {
      window.location.replace("http://localhost:3000/login?error=callback_error");
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-500">Connexion en cours...</p>
      </div>
    </div>
  );
}
