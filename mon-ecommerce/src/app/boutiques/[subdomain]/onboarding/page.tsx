"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { worldCurrencies } from "@/lib/currencies";
import { slugify } from "@/lib/slug";

export default function OnboardingPage() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ownerName, setOwnerName] = useState("");
  const [shopName, setShopName] = useState("");
  const [shopSlug, setShopSlug] = useState(subdomain || "");
  const [userChangedSlug, setUserChangedSlug] = useState(false);
  const [slugError, setSlugError] = useState("");
  const [shopDescription, setShopDescription] = useState("");
  const [shopCountry, setShopCountry] = useState("");
  const [defaultCurrency, setDefaultCurrency] = useState("XOF");

  useEffect(() => {
    const checkOnboarding = async () => {
      const { data } = await supabase
        .from("settings")
        .select("owner_name, shop_name")
        .eq("shop_slug", subdomain)
        .single();
      if (data?.owner_name && data?.shop_name) {
        router.replace(`/boutiques/${subdomain}/admin`);
      }
    };
    checkOnboarding();
  }, [subdomain, router]);

  const handleFinish = async () => {
    if (!ownerName.trim() || !shopName.trim()) return;
    const finalSlug = slugify(shopSlug) || subdomain;
    if (!finalSlug) {
      setSlugError("Veuillez renseigner un identifiant pour votre boutique");
      setStep(2);
      return;
    }

    setSaving(true);
    setSlugError("");

    // Vérifier si le slug est déjà pris
    if (finalSlug !== subdomain) {
      const { data: existingSlug } = await supabase
        .from("settings")
        .select("id")
        .eq("shop_slug", finalSlug)
        .maybeSingle();

      if (existingSlug?.id) {
        setSlugError("Ce slug est déjà utilisé par une autre boutique. Choisissez-en un autre.");
        setSaving(false);
        setStep(2);
        return;
      }
    }

    const { data: existing } = await supabase
      .from("settings")
      .select("id")
      .eq("shop_slug", subdomain)
      .single();

    const payload = {
      owner_name: ownerName.trim(),
      shop_name: shopName.trim(),
      shop_slug: finalSlug,
      shop_description: shopDescription.trim(),
      shop_country: shopCountry,
      default_currency: defaultCurrency,
      updated_at: new Date().toISOString(),
    };

    if (existing?.id) {
      await supabase.from("settings").update(payload).eq("id", existing.id);
    }
    setSaving(false);
    window.location.replace(`/boutiques/${finalSlug}/admin`);
  };

  const inputClass = "w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors bg-white";

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white">
              <path d="M4 7l8-4 8 4M4 17l8 4 8-4M4 12l8-4 8 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Bienvenue sur ShopEazy</h1>
          <p className="text-sm text-gray-500 mt-1">Configurons votre boutique en quelques secondes</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
          {/* Steps indicator */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step >= s ? "bg-emerald-600 text-white shadow-md shadow-emerald-200" : "bg-gray-100 text-gray-400"
                }`}>
                  {step > s ? "✓" : s}
                </div>
                {s < 3 && <div className={`flex-1 h-0.5 rounded transition-all ${step > s ? "bg-emerald-500" : "bg-gray-200"}`} />}
              </div>
            ))}
          </div>

          {/* Step 1: Owner */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Qui gére cette boutique ?</label>
                <input type="text" value={ownerName} onChange={(e) => setOwnerName(e.target.value)}
                  className={inputClass} placeholder="Votre nom ou prénom" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Dans quel pays ?</label>
                <select value={shopCountry} onChange={(e) => setShopCountry(e.target.value)} className={inputClass}>
                  <option value="">Sélectionnez un pays</option>
                  <option value="CM">Cameroun</option>
                  <option value="CI">Côte d'Ivoire</option>
                  <option value="SN">Sénégal</option>
                  <option value="ML">Mali</option>
                  <option value="BF">Burkina Faso</option>
                  <option value="NE">Niger</option>
                  <option value="TG">Togo</option>
                  <option value="BJ">Bénin</option>
                  <option value="GN">Guinée</option>
                  <option value="CD">RDC</option>
                  <option value="CG">Congo</option>
                  <option value="GA">Gabon</option>
                  <option value="NG">Nigeria</option>
                  <option value="GH">Ghana</option>
                  <option value="KE">Kenya</option>
                  <option value="ZA">Afrique du Sud</option>
                  <option value="MA">Maroc</option>
                  <option value="TN">Tunisie</option>
                  <option value="DZ">Algérie</option>
                  <option value="EG">Égypte</option>
                  <option value="FR">France</option>
                  <option value="BE">Belgique</option>
                  <option value="CH">Suisse</option>
                  <option value="CA">Canada</option>
                  <option value="US">États-Unis</option>
                  <option value="GB">Royaume-Uni</option>
                  <option value="other">Autre</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Shop */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom de votre boutique</label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => {
                    const name = e.target.value;
                    setShopName(name);
                    if (!userChangedSlug) {
                      setShopSlug(slugify(name));
                    }
                  }}
                  className={inputClass}
                  placeholder="Ex: Vaplenou"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Identifiant unique de votre boutique (Slug URL)</label>
                <div className="flex rounded-lg border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500">
                  <span className="bg-gray-50 text-gray-500 text-xs px-3 py-3 border-r border-gray-200 select-none flex items-center">
                    /boutiques/
                  </span>
                  <input
                    type="text"
                    value={shopSlug}
                    onChange={(e) => {
                      setUserChangedSlug(true);
                      setShopSlug(slugify(e.target.value));
                    }}
                    className="flex-1 px-3 py-2.5 text-sm text-gray-900 font-mono focus:outline-none bg-white"
                    placeholder="vaplenou"
                  />
                </div>
                {slugError && <p className="text-xs text-red-500 mt-1">{slugError}</p>}
                <p className="text-xs text-gray-400 mt-1">
                  Adresse de votre vitrine : <strong>/boutiques/{shopSlug || "nom-de-boutique"}</strong>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (optionnelle)</label>
                <textarea value={shopDescription} onChange={(e) => setShopDescription(e.target.value)}
                  className={`${inputClass} resize-none`} rows={3} placeholder="Décrivez vos produits en quelques mots..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Devise par défaut</label>
                <select value={defaultCurrency} onChange={(e) => setDefaultCurrency(e.target.value)} className={inputClass}>
                  <optgroup label="Devises Africaines">
                    {worldCurrencies.filter(c => c.region === "africa").map((curr) => (
                      <option key={curr.code} value={curr.code}>{curr.code} — {curr.name}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Autres Devises">
                    {worldCurrencies.filter(c => c.region !== "africa").map((curr) => (
                      <option key={curr.code} value={curr.code}>{curr.code} — {curr.name}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Welcome */}
          {step === 3 && (
            <div className="text-center py-6 animate-fade-in">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900">Tout est prêt !</h2>
              <p className="text-sm text-gray-500 mt-2">
                Votre boutique <strong className="text-gray-800">{shopName || "..."}</strong> est configurée.
              </p>
              <p className="text-xs text-emerald-600 font-mono mt-1">
                Adresse : /boutiques/{shopSlug || subdomain}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Vous pourrez modifier ces informations dans les paramètres plus tard.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button onClick={() => setStep(step - 1)}
                className="px-6 py-2.5 border border-gray-200 hover:bg-gray-50 rounded-xl text-sm font-medium text-gray-700 transition-colors">
                Retour
              </button>
            )}
            <div className="flex-1" />
            {step < 3 ? (
              <button onClick={() => setStep(step + 1)}
                disabled={(step === 1 && !ownerName.trim()) || (step === 2 && !shopName.trim())}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 shadow-md hover:shadow-lg">
                Continuer
              </button>
            ) : (
              <button onClick={handleFinish} disabled={saving}
                className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 shadow-md hover:shadow-lg">
                {saving ? "Finalisation..." : "Accéder au tableau de bord"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
