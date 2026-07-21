"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { generateUniqueShopSlug } from "@/lib/slug";
import { getSiteUrl } from "@/lib/site-url";

type Shop = { shop_slug: string; updated_at?: string };

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [shops, setShops] = useState<Shop[]>([]);
  const [showShopPicker, setShowShopPicker] = useState(false);

  const redirectToDashboard = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) { window.location.replace(`${window.location.origin}/login`); return; }

    const { data: settings } = await supabase
      .from("settings")
      .select("shop_slug, owner_name, shop_name")
      .eq("user_id", userId);

    if (settings && settings.length > 1) {
      setShops(settings);
      setShowShopPicker(true);
    } else if (settings && settings.length === 1) {
      const slug = settings[0].shop_slug;
      if (settings[0].owner_name && settings[0].shop_name) {
        window.location.replace(`${window.location.origin}/boutiques/${slug}/admin`);
      } else {
        window.location.replace(`${window.location.origin}/boutiques/${slug}/onboarding`);
      }
    } else {
      const newSlug = await generateUniqueShopSlug(supabase);
      const { data: existing } = await supabase
        .from("settings")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      if (existing?.id) {
        await supabase.from("settings").update({ shop_slug: newSlug, user_id: userId }).eq("id", existing.id);
      } else {
        await supabase.from("settings").insert([{ shop_slug: newSlug, user_id: userId }]);
      }
      window.location.replace(`${window.location.origin}/boutiques/${newSlug}/onboarding`);
    }
  };

  useEffect(() => {
    const err = new URLSearchParams(window.location.search).get("error");
    if (err === "auth_failed" || err === "session_not_found" || err === "callback_error") {
      setMessage("La connexion a échoué. Réessayez ou utilisez email / mot de passe. Vérifiez aussi que Google est activé dans Nhost.");
      window.history.replaceState({}, "", "/login");
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        await redirectToDashboard();
      }
    }).catch(() => {});
  }, []);

  const redirectToAdmin = (slug: string) => {
    window.location.replace(`${window.location.origin}/boutiques/${slug}/admin`);
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${getSiteUrl()}/auth/callback` },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message);
      setLoading(false);
    } else {
      await redirectToDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white">
                  <path d="M4 7l8-4 8 4M4 17l8 4 8-4M4 12l8-4 8 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-lg font-bold text-gray-900">ShopEazy</span>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Connexion</h1>
            <p className="text-sm text-gray-500 mt-1">
              {showShopPicker ? "Choisissez votre boutique" : "Accédez à votre tableau de bord"}
            </p>
          </div>

          {showShopPicker ? (
            <div className="space-y-2">
              {shops.map((shop) => (
                <button
                  key={shop.shop_slug}
                  onClick={() => redirectToAdmin(shop.shop_slug)}
                  className="w-full text-left border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 transition-all"
                >
                  <span className="block font-semibold text-gray-900">{shop.shop_slug}</span>
                  <span className="block text-xs text-gray-400 mt-0.5">
                    boutique créée le {shop.updated_at ? new Date(shop.updated_at).toLocaleDateString("fr-FR") : "—"}
                  </span>
                </button>
              ))}
            </div>
          ) : (
          <>
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-4"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continuer avec Google
          </button>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-white px-2 text-gray-400">ou</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors" placeholder="admin@boutique.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors" placeholder="••••••••" />
            </div>

            {message && (
              <div className="text-sm p-3 rounded-lg bg-red-50 text-red-700">{message}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 text-sm"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Pas encore de compte ?{" "}
            <Link href="/signup" className="text-emerald-600 hover:underline font-medium">S&apos;inscrire</Link>
          </p>
          </>
          )}
        </div>
      </div>
    </div>
  );
}
