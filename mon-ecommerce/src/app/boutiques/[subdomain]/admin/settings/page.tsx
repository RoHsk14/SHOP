"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Save, Plus, X, TrendingUp, Settings, ShoppingCart, FileSpreadsheet, ExternalLink, Check, Copy, RefreshCw, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { worldCurrencies } from "@/lib/currencies";

interface FormField { name: string; label: string; required: boolean; }
interface Settings { id: string; owner_name: string; shop_name: string; shop_description: string; shop_country: string; pixel_id: string; capi_token: string; default_currency: string; custom_form_fields: FormField[]; updated_at: string; }

export default function SettingsAdmin() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pixelId, setPixelId] = useState("");
  const [capiToken, setCapiToken] = useState("");
  const [defaultCurrency, setDefaultCurrency] = useState("EUR");
  const [ownerName, setOwnerName] = useState("");
  const [shopName, setShopName] = useState("");
  const [shopDescription, setShopDescription] = useState("");
  const [shopCountry, setShopCountry] = useState("");
  const [googleSheetUrl, setGoogleSheetUrl] = useState("");
  const [googleConnected, setGoogleConnected] = useState(false);
  const [sheetColumns, setSheetColumns] = useState<string[]>([]);
  const [testingSheet, setTestingSheet] = useState(false);
  const [connectingSheet, setConnectingSheet] = useState(false);
  const [connectingOAuth, setConnectingOAuth] = useState(false);
  const [saEmail, setSaEmail] = useState("");
  const [saEmailError, setSaEmailError] = useState("");
  const [saEmailLoading, setSaEmailLoading] = useState(true);
  const [emailCopied, setEmailCopied] = useState(false);
  const [formFields, setFormFields] = useState<FormField[]>([
    { name: "customer_name", label: "Nom complet", required: true },
    { name: "customer_phone", label: "Téléphone", required: true },
    { name: "customer_address", label: "Adresse", required: true },
  ]);

  useEffect(() => {
    fetchSettings();
    setSaEmailLoading(true);
    fetch("/api/google-service-email")
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (d.email) {
          setSaEmail(d.email);
          setSaEmailError("");
        } else {
          setSaEmail("");
          setSaEmailError(d.hint || d.error || "Service account non configuré");
        }
      })
      .catch(() => {
        setSaEmailError("Impossible de charger l'email du service account");
      })
      .finally(() => setSaEmailLoading(false));
  }, []);

  // Écouter le message envoyé par le popup Google OAuth
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === "google-oauth") {
        setConnectingOAuth(false);
        if (event.data.success) {
          if (event.data.sheetUrl) {
            setGoogleSheetUrl(event.data.sheetUrl);
          }
          if (event.data.columns && event.data.columns.length > 0) {
            setSheetColumns(event.data.columns);
          }
          setGoogleConnected(true);
          toast.success("Google Sheets connecté avec succès !");
          fetchSettings();
        } else {
          toast.error(event.data.error || "Échec de l'autorisation Google");
        }
      }
    };

    window.addEventListener("message", handleOAuthMessage);
    return () => window.removeEventListener("message", handleOAuthMessage);
  }, []);

  const handleOAuthConnect = () => {
    setConnectingOAuth(true);
    const width = 560;
    const height = 680;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2.5;

    const popup = window.open(
      `/api/google-sheets-connect?shop_slug=${encodeURIComponent(subdomain)}&mode=popup`,
      "google_oauth_popup",
      `width=${width},height=${height},left=${left},top=${top},status=no,menubar=no,toolbar=no`
    );

    if (!popup || popup.closed || typeof popup.closed === "undefined") {
      setConnectingOAuth(false);
      toast.error("Veuillez autoriser les fenêtres pop-up dans votre navigateur pour vous connecter avec Google.");
      return;
    }

    const timer = setInterval(() => {
      if (popup.closed) {
        clearInterval(timer);
        setConnectingOAuth(false);
      }
    }, 1000);
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("id, owner_name, shop_name, shop_description, shop_country, pixel_id, capi_token, default_currency, google_sheet_url, google_sheet_columns, google_access_token, custom_form_fields, updated_at")
        .eq("shop_slug", subdomain)
        .single();
      
      if (error) {
        console.error("Erreur chargement settings:", JSON.stringify(error, null, 2));
        if (error.code !== 'PGRST116') {
          toast.error("Erreur chargement paramètres");
        }
      }
      
      if (data) {

        setSettings(data); 
        setOwnerName(data.owner_name || "");
        setShopName(data.shop_name || "");
        setShopDescription(data.shop_description || "");
        setShopCountry(data.shop_country || "");
        setPixelId(data.pixel_id || ""); 
        setCapiToken(data.capi_token || "");
        setDefaultCurrency(data.default_currency || "EUR");
        
        // Restaurer l'URL Google Sheets et le statut de connexion
        if (data.google_sheet_url) {

          setGoogleSheetUrl(data.google_sheet_url);
          setGoogleConnected(true);
          // Récupérer les colonnes si elles existent
          if (data.google_sheet_columns && data.google_sheet_columns.length > 0) {
            setSheetColumns(data.google_sheet_columns);
          } else {
            // Sinon, essayer de les récupérer depuis le Sheet
            fetchSheetColumns();
          }
        } else {

        }
        
        if (data.custom_form_fields) setFormFields(data.custom_form_fields);
      } else {

      }
    } catch (error) {
      console.error("Erreur chargement paramètres:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleConnect = async () => {
    const trimmed = googleSheetUrl.trim();
    if (!trimmed) {
      toast.error("Veuillez entrer l'URL de votre Google Sheet");
      return;
    }
    const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match || match[1].length < 20) {
      toast.error("URL Google Sheet invalide. Assurez-vous de copier l'URL complète du navigateur.");
      return;
    }

    if (!saEmail) {
      toast.error("Le service de synchronisation n'est pas encore prêt. Veuillez patienter un instant.");
      return;
    }

    setConnectingSheet(true);

    try {
      // 1. Tenter de lire les colonnes du Sheet pour vérifier les droits d'accès
      const colRes = await fetch("/api/google-sheets/columns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheet_url: trimmed, shop_slug: subdomain })
      });
      const colData = await colRes.json();

      if (!colRes.ok) {
        const errMsg = colData.error || "";
        if (errMsg.includes("permission") || errMsg.includes("403") || errMsg.includes("caller does not have permission")) {
          toast.error("Accès refusé par Google : veuillez vérifier que vous avez partagé le Sheet avec l'email du bot en tant qu'Éditeur.");
        } else if (errMsg.includes("404") || errMsg.includes("not found")) {
          toast.error("Google Sheet introuvable. Vérifiez que l'URL est correcte.");
        } else {
          toast.error(errMsg || "Impossible d'accéder au Google Sheet.");
        }
        setConnectingSheet(false);
        return;
      }

      let detectedCols: string[] = colData.columns || [];

      // 2. Si la feuille est vierge (aucune colonne), initialiser automatiquement les en-têtes
      if (detectedCols.length === 0) {
        const defaultHeaders = [
          "Date", "Nom du client", "Téléphone", "Adresse", "Quartier",
          "Produit", "Quantité", "Total", "Devise", "Statut", "Pays"
        ];
        const initRes = await fetch("/api/google-sheets/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sheet_url: trimmed,
            shop_slug: subdomain,
            columns: defaultHeaders
          })
        });
        const initData = await initRes.json();
        if (initRes.ok && initData.columns) {
          detectedCols = initData.columns;
        }
      }

      // 3. Sauvegarder dans la table settings
      const { data: { session } } = await supabase.auth.getSession();
      const { data: existingSettings } = await supabase
        .from("settings")
        .select("id")
        .eq("shop_slug", subdomain)
        .maybeSingle();

      const payload = {
        google_sheet_url: trimmed,
        google_sheet_columns: detectedCols,
        updated_at: new Date().toISOString()
      };

      if (existingSettings?.id) {
        await supabase.from("settings").update(payload).eq("id", existingSettings.id);
      } else {
        await supabase.from("settings").insert([{
          ...payload,
          shop_slug: subdomain,
          user_id: session?.user?.id
        }]);
      }

      setGoogleSheetUrl(trimmed);
      setSheetColumns(detectedCols);
      setGoogleConnected(true);
      toast.success("Google Sheet connecté et initialisé avec succès !");
    } catch (error: any) {
      console.error("Erreur connexion Google Sheet:", error);
      toast.error("Erreur de connexion à Google Sheets");
    } finally {
      setConnectingSheet(false);
    }
  };

  const copyEmail = () => {
    navigator.clipboard.writeText(saEmail);
    setEmailCopied(true);
    setTimeout(() => setEmailCopied(false), 2000);
  };

  const handleDisconnect = async () => {
    setGoogleConnected(false);
    setGoogleSheetUrl("");
    setSheetColumns([]);
    if (!settings?.id) return;
    try {
      await supabase.from("settings").update({
        google_sheet_url: null,
        google_sheet_columns: null,
        google_access_token: null,
        google_refresh_token: null,
        updated_at: new Date().toISOString()
      }).eq("id", settings.id);
      toast.success("Déconnecté de Google Sheets");
    } catch (error) {
      console.error("Erreur déconnexion:", error);
    }
  };

  const testSheetConnection = async () => {
    if (!googleSheetUrl) {
      toast.error("Entrez d'abord l'URL du Google Sheet");
      return;
    }
    
    setTestingSheet(true);
    try {
      const activeCurrency = defaultCurrency || settings?.default_currency || "XOF";
      const activeCountry = shopCountry || settings?.shop_country || "";
      const testPhone = activeCurrency === "NGN" ? "+2348000000000" : activeCurrency === "XAF" ? "+237600000000" : "+22990000000";

      const testData = {
        sheet_url: googleSheetUrl,
        shop_slug: subdomain,
        columns: ["Date", "Nom du client", "Téléphone", "Adresse", "Quartier", "Produit", "Quantité", "Total", "Devise", "Statut", "Pays"],
        row_data: {
          "Date": new Date().toLocaleString("fr-FR"),
          "Nom du client": "Test Client",
          "Téléphone": testPhone,
          "Adresse": "123 Test Street",
          "Quartier": "Test Area",
          "Produit": "Test Product",
          "Quantité": 1,
          "Total": 10000,
          "Devise": activeCurrency,
          "Statut": "À traiter",
          "Pays": activeCountry || "Localhost"
        }
      };
      
      const response = await fetch("/api/google-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testData)
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        toast.success("Test réussi ! Vérifiez votre feuille Google Sheets.");
        // Auto-connect if test succeeds
        setGoogleConnected(true);
        // Fetch columns after successful test
        fetchSheetColumns();
      } else {
        toast.error(result.error || "Erreur lors du test");
      }
    } catch (error: any) {
      console.error("Test error:", error);
      toast.error("Erreur de connexion à Google Sheets");
    } finally {
      setTestingSheet(false);
    }
  };

  const fetchSheetColumns = async () => {
    if (!googleSheetUrl) return;
    
    try {
      const response = await fetch("/api/google-sheets/columns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheet_url: googleSheetUrl, shop_slug: subdomain })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.columns && data.columns.length > 0) {
          setSheetColumns(data.columns);
          if (settings?.id) {
            await supabase.from("settings").update({
              google_sheet_columns: data.columns,
              updated_at: new Date().toISOString()
            }).eq("id", settings.id);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching columns:", error);
    }
  };

  const initializeSheetColumns = async () => {
    if (!googleSheetUrl) {
      toast.error("Entrez d'abord l'URL du Google Sheet");
      return;
    }
    
    try {
      const response = await fetch("/api/google-sheets/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          sheet_url: googleSheetUrl,
          shop_slug: subdomain,
          columns: ["Date", "Nom du client", "Téléphone", "Adresse", "Quartier", "Produit", "Quantité", "Total", "Devise", "Statut", "Pays"]
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success("Colonnes initialisées avec succès !");
        setSheetColumns(data.columns || []);
        if (settings?.id) {
          await supabase.from("settings").update({
            google_sheet_columns: data.columns,
            updated_at: new Date().toISOString()
          }).eq("id", settings.id);
        }
        fetchSheetColumns();
      } else {
        const error = await response.json();
        toast.error(error.error || "Erreur lors de l'initialisation");
      }
    } catch (error: any) {
      console.error("Init error:", error);
      toast.error("Erreur de connexion");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const settingsData = {
        owner_name: ownerName, shop_name: shopName, shop_description: shopDescription, shop_country: shopCountry,
        pixel_id: pixelId.trim(), capi_token: capiToken.trim(), default_currency: defaultCurrency,
        google_sheet_url: googleSheetUrl,
        custom_form_fields: formFields,
        updated_at: new Date().toISOString(),
      };

      let settingsId = settings?.id;
      if (!settingsId) {
        const { data: existing } = await supabase
          .from("settings")
          .select("id")
          .eq("shop_slug", subdomain)
          .maybeSingle();
        settingsId = existing?.id;
      }

      let error;
      if (settingsId) {
        ({ error } = await supabase.from("settings").update(settingsData).eq("id", settingsId));
      } else {
        ({ error } = await supabase.from("settings").insert([{
          ...settingsData,
          shop_slug: subdomain,
          user_id: session?.user?.id,
        }]));
      }

      if (error) {
        console.error("Erreur sauvegarde settings:", error);
        toast.error(error.message || "Erreur lors de la sauvegarde");
        return;
      }

      toast.success("Paramètres enregistrés !");
      await fetchSettings();
    } catch (err: any) {
      console.error("Erreur sauvegarde settings:", err);
      toast.error(err?.message || "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const toggleFieldRequired = (index: number) => {
    const f = [...formFields]; f[index].required = !f[index].required; setFormFields(f);
  };

  const addCustomField = () => {
    const fieldName = prompt("Nom du champ (ex: neighborhood):");
    const fieldLabel = prompt("Label du champ (ex: Quartier):");
    if (fieldName && fieldLabel) setFormFields([...formFields, { name: fieldName, label: fieldLabel, required: false }]);
  };

  const removeField = (index: number) => setFormFields(formFields.filter((_, i) => i !== index));

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-gray-200 border-t-green-600 rounded-full animate-spin"></div>
    </div>
  );

  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors";

  return (
    <div className="space-y-5 sm:space-y-6 max-w-4xl mx-auto w-full animate-fade-in pb-12">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">Configurez votre boutique</p>
      </div>

      {/* Informations boutique */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
            <ShoppingCart className="w-4.5 h-4.5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Informations boutique</h2>
            <p className="text-xs text-gray-500">Nom, propriétaire et localisation</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nom du propriétaire</label>
            <input type="text" value={ownerName} onChange={e => setOwnerName(e.target.value)} className={inputClass} placeholder="Ex: Jean Dupont" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nom de la boutique</label>
            <input type="text" value={shopName} onChange={e => setShopName(e.target.value)} className={inputClass} placeholder="Ex: Ma Boutique" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea value={shopDescription} onChange={e => setShopDescription(e.target.value)} className={inputClass} rows={2} placeholder="Ex: Vêtements et accessoires pour hommes" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Pays</label>
            <input type="text" value={shopCountry} onChange={e => setShopCountry(e.target.value)} className={inputClass} placeholder="Ex: France" />
          </div>
        </div>
      </div>

      {/* Meta Pixel */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-4.5 h-4.5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Meta Pixel & CAPI</h2>
            <p className="text-xs text-gray-500">Tracking Facebook</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meta Pixel ID</label>
            <input type="text" value={pixelId} onChange={(e) => setPixelId(e.target.value)} className={inputClass} placeholder="Ex: 123456789012345" />
            <p className="text-xs text-gray-400 mt-1.5">Trouvez votre Pixel ID dans Meta Events Manager</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CAPI Token (Optionnel)</label>
            <input type="password" value={capiToken} onChange={(e) => {
              const val = e.target.value;
              const match = val.match(/access_token=([^&\s]+)/);
              setCapiToken(match ? match[1] : val);
            }} className={inputClass} placeholder="Token ou URL complète" />
            <p className="text-xs text-gray-400 mt-1.5">Collez le token ou l'URL complète du testeur Events Manager</p>
          </div>
          </div>
        </div>

      {/* Google Sheets Integration */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Google Sheets</h2>
              <p className="text-xs text-gray-500">
                Synchronisation automatique et instantanée de vos commandes
              </p>
            </div>
          </div>
          {googleConnected && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Connecté & Actif
            </span>
          )}
        </div>

        {/* Vue quand Connecté */}
        {googleConnected ? (
          <div className="space-y-4">
            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-mono text-emerald-900 truncate max-w-xs sm:max-w-md">
                  {googleSheetUrl}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {googleSheetUrl && (
                  <a
                    href={googleSheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-50 rounded-lg text-xs font-semibold text-emerald-800 transition-colors shadow-2xs"
                  >
                    <span>Ouvrir le Sheet</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  onClick={handleDisconnect}
                  className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-red-50 hover:border-red-200 hover:text-red-700 rounded-lg text-xs font-medium text-gray-600 transition-colors"
                >
                  Déconnecter
                </button>
              </div>
            </div>

            {/* Structure des colonnes */}
            {sheetColumns.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Colonnes synchronisées ({sheetColumns.length})
                  </h3>
                  <button
                    onClick={fetchSheetColumns}
                    className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 font-medium"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Actualiser
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {sheetColumns.map((col, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-white border border-gray-200 text-gray-700 shadow-2xs"
                    >
                      {col}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-gray-400 mt-2.5">
                  Chaque nouvelle commande validée sur votre boutique sera automatiquement ajoutée comme nouvelle ligne sous ces colonnes.
                </p>
              </div>
            )}

            {/* Bouton de test */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                onClick={testSheetConnection}
                disabled={testingSheet}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                {testingSheet ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-gray-400 border-t-emerald-600 rounded-full animate-spin" />
                    Envoi du test en cours...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    Envoyer une commande fictive de test
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Vue Configuration quand Déconnecté */
          <div className="space-y-4">
            {/* Méthode active et recommandée : Configuration directe via Service Account */}
            <div className="border border-emerald-200 bg-white rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 mb-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Méthode recommandée et active</span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900">
                  Lier votre feuille Google Sheet
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Vos commandes seront automatiquement insérées dans votre feuille en temps réel.
                </p>
              </div>

              <div className="space-y-4 pt-1">
                {/* Étape 1 */}
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-2xs">
                    1
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-gray-900">
                      Partagez votre feuille Google Sheet
                    </p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Ouvrez votre feuille, cliquez sur <strong>Partager</strong> en haut à droite, puis ajoutez l'email du bot avec le rôle <strong>Éditeur</strong> :
                    </p>

                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 font-mono text-xs text-gray-900 overflow-hidden shadow-2xs">
                        <span className="truncate">
                          {saEmail || "shopeazy-sheets@afro-circle-487702.iam.gserviceaccount.com"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={copyEmail}
                        className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${
                          emailCopied
                            ? "bg-emerald-600 text-white border-emerald-600"
                            : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 shadow-2xs"
                        }`}
                      >
                        {emailCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copié !</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copier</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="mt-2.5">
                      <a
                        href="https://sheets.new"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-500 font-semibold hover:underline"
                      >
                        <span>+ Créer un nouveau Google Sheet vierge</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Étape 2 */}
                <div className="flex items-start gap-3 pt-4 border-t border-gray-200">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 shadow-2xs">
                    2
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-gray-900">
                      Collez l'URL de votre Google Sheet
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Copiez l'adresse depuis votre navigateur et collez-la ici :
                    </p>
                    <div className="mt-2.5">
                      <input
                        type="text"
                        value={googleSheetUrl}
                        onChange={(e) => setGoogleSheetUrl(e.target.value)}
                        className={inputClass}
                        placeholder="https://docs.google.com/spreadsheets/d/1Bxi5.../edit"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleConnect}
                  disabled={!googleSheetUrl.trim() || connectingSheet}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs hover:shadow flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {connectingSheet ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Vérification et synchronisation...</span>
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Lier cette feuille Google Sheet</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Option Grisée : Connexion automatique en 1 clic (En cours de développement) */}
            <div className="relative overflow-hidden bg-gray-50/90 border border-gray-200 rounded-xl p-5 sm:p-6 opacity-65 select-none">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div className="space-y-1.5 max-w-xl">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-200 text-gray-700 border border-gray-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>En cours de développement</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-gray-700">
                    Connexion automatique en 1 clic avec votre compte Google
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    La création et synchronisation automatique de feuille dans votre Google Drive sans partage manuel est actuellement en cours de développement et de validation finale.
                  </p>
                </div>

                <div className="w-full sm:w-auto shrink-0">
                  <button
                    type="button"
                    disabled
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-5 py-3 bg-gray-100 text-gray-400 border border-gray-300 rounded-xl font-bold text-xs sm:text-sm shadow-none cursor-not-allowed opacity-75"
                  >
                    <svg className="w-4 h-4 shrink-0 grayscale opacity-60" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Bientôt disponible</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Paramètres Généraux */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
            <ShoppingCart className="w-4.5 h-4.5 text-green-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Paramètres Généraux</h2>
            <p className="text-xs text-gray-500">Configuration de la boutique</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Devise par défaut</label>
          <p className="text-xs text-gray-400 mb-3">Sélectionnez une seule devise par défaut (Afrique prioritaire)</p>
          <select
            value={defaultCurrency}
            onChange={async (e) => {
              const newCurr = e.target.value;
              setDefaultCurrency(newCurr);
              try {
                const { data: { session } } = await supabase.auth.getSession();
                let settingsId = settings?.id;
                if (!settingsId) {
                  const { data: existing } = await supabase
                    .from("settings")
                    .select("id")
                    .eq("shop_slug", subdomain)
                    .maybeSingle();
                  settingsId = existing?.id;
                }
                if (settingsId) {
                  await supabase
                    .from("settings")
                    .update({ default_currency: newCurr, updated_at: new Date().toISOString() })
                    .eq("id", settingsId);
                } else {
                  await supabase
                    .from("settings")
                    .insert([{ shop_slug: subdomain, default_currency: newCurr, user_id: session?.user?.id }]);
                }
                toast.success(`Devise mise à jour : ${newCurr}`);
              } catch (err) {
                console.error("Auto-save currency error:", err);
              }
            }}
            className={inputClass}
          >
            <optgroup label="Devises Africaines">
              {worldCurrencies.filter(c => c.region === "africa").map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.code} — {curr.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Autres Devises Mondiales">
              {worldCurrencies.filter(c => c.region !== "africa").map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.code} — {curr.name}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>

      {/* Form Fields */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center">
              <Settings className="w-4.5 h-4.5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Champs du formulaire</h2>
              <p className="text-xs text-gray-500">Personnalisez la commande</p>
            </div>
          </div>
          <button onClick={addCustomField} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700 transition-colors">
            <Plus size={13} /> Ajouter
          </button>
        </div>

        <div className="space-y-2">
          {formFields.map((field, index) => (
            <div key={field.name} className="flex items-center justify-between bg-gray-50 p-3.5 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={field.required} onChange={() => toggleFieldRequired(index)}
                  className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{field.label}</p>
                  <p className="text-xs text-gray-400">{field.name}</p>
                </div>
              </div>
              {!["customer_name", "customer_phone", "customer_address"].includes(field.name) && (
                <button onClick={() => removeField(index)} className="p-1.5 hover:bg-red-50 rounded-md transition-colors">
                  <X size={14} className="text-red-400" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Save */}
      <button onClick={handleSave} disabled={saving}
        className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-sm">
        <Save size={16} />
        {saving ? "Enregistrement..." : "Enregistrer les paramètres"}
      </button>
    </div>
  );
}
