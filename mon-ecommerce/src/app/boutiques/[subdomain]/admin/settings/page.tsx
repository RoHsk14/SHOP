"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Save, Plus, X, TrendingUp, Settings, ShoppingCart } from "lucide-react";
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
  const [saEmail, setSaEmail] = useState("");
  const [emailCopied, setEmailCopied] = useState(false);
  const [formFields, setFormFields] = useState<FormField[]>([
    { name: "customer_name", label: "Nom complet", required: true },
    { name: "customer_phone", label: "Téléphone", required: true },
    { name: "customer_address", label: "Adresse", required: true },
  ]);

  useEffect(() => {
    fetchSettings();
    // Récupérer l'email du service account
    fetch("/api/google-service-email")
      .then(r => r.json())
      .then(d => { if (d.email) setSaEmail(d.email); })
      .catch(() => {});
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .eq("shop_slug", subdomain)
        .single();
      
      if (error) {
        console.error("Erreur chargement settings:", JSON.stringify(error, null, 2));
        if (error.code !== 'PGRST116') {
          toast.error("Erreur chargement paramètres");
        }
      }
      
      if (data) {
        console.log("✅ Settings chargés:", data);
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
          console.log("✅ URL trouvée:", data.google_sheet_url);
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
          console.log("❌ Pas d'URL Google Sheets en base");
        }
        
        if (data.custom_form_fields) setFormFields(data.custom_form_fields);
      } else {
        console.log("❌ Aucun paramètre en base");
      }
    } catch (error) {
      console.error("Erreur chargement paramètres:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleConnect = async () => {
    if (!googleSheetUrl) return;
    const match = googleSheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      toast.error("URL Google Sheet invalide");
      return;
    }

    if (!saEmail) {
      toast.error("Service account non configuré");
      return;
    }

    setGoogleConnected(true);
    toast.success("Google Sheet configuré !");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: existingSettings } = await supabase
        .from("settings")
        .select("id")
        .eq("shop_slug", subdomain)
        .maybeSingle();

      if (existingSettings?.id) {
        await supabase.from("settings").update({
          google_sheet_url: googleSheetUrl,
          updated_at: new Date().toISOString()
        }).eq("id", existingSettings.id);
      } else {
        await supabase.from("settings").insert([{
          google_sheet_url: googleSheetUrl,
          shop_slug: subdomain,
          updated_at: new Date().toISOString(),
          user_id: session?.user?.id
        }]);
      }

      fetchSheetColumns();
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
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
      const testData = {
        sheet_url: googleSheetUrl,
        shop_slug: subdomain,
        columns: ["Date", "Nom du client", "Téléphone", "Adresse", "Quartier", "Produit", "Quantité", "Total", "Devise", "Statut", "Pays"],
        row_data: {
          "Date": new Date().toLocaleString("fr-FR"),
          "Nom du client": "Test Client",
          "Téléphone": "+237600000000",
          "Adresse": "123 Test Street",
          "Quartier": "Test Area",
          "Produit": "Test Product",
          "Quantité": 1,
          "Total": 10000,
          "Devise": "XAF",
          "Statut": "pending",
          "Pays": ""
        }
      };
      
      const response = await fetch("/api/google-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testData)
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        toast.success("✅ Test réussi ! Vérifiez votre Sheet.");
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
        toast.success("✅ Colonnes initialisées !");
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
    const { data: { session } } = await supabase.auth.getSession();
    const settingsData = {
      owner_name: ownerName, shop_name: shopName, shop_description: shopDescription, shop_country: shopCountry,
      pixel_id: pixelId, capi_token: capiToken, default_currency: defaultCurrency,
      google_sheet_url: googleSheetUrl,
      custom_form_fields: formFields,
      updated_at: new Date().toISOString(),
    };
    if (settings?.id) { await supabase.from("settings").update(settingsData).eq("id", settings.id); }
    else { await supabase.from("settings").insert([{ ...settingsData, shop_slug: subdomain, user_id: session?.user?.id }]); }
    setSaving(false); toast.success("Paramètres enregistrés !"); fetchSettings();
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
    <div className="space-y-4 sm:space-y-5 max-w-3xl animate-fade-in">
      <div>
        <h1 className="text-lg sm:text-xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Configurez votre boutique</p>
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

      {/* Google Sheets - Service Account Guide */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
            <ShoppingCart className="w-4.5 h-4.5 text-green-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Google Sheets</h2>
            <p className="text-xs text-gray-500">Commandes automatiques dans votre Sheet</p>
          </div>
        </div>

        {/* Step-by-step guide (toujours visible) */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Configuration en 2 étapes</h3>

          {/* Étape 1 */}
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">Partagez votre Sheet avec le service account</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Ouvrez votre Google Sheet, cliquez sur <strong>Partager</strong> en haut à droite, et ajoutez l'email ci-dessous en tant qu'<strong>Éditeur</strong> :
              </p>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 font-mono truncate">
                  {saEmail || "Chargement..."}
                </code>
                <button
                  onClick={copyEmail}
                  disabled={!saEmail}
                  className="flex-shrink-0 px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-xs font-medium text-gray-700 transition-colors disabled:opacity-50"
                >
                  {emailCopied ? "Copié ✓" : "Copier"}
                </button>
              </div>
            </div>
          </div>

          {/* Étape 2 */}
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">Collez l'URL de votre Sheet</p>
              <p className="text-xs text-gray-500 mt-0.5">
              L'URL se trouve dans la barre d'adresse de votre navigateur quand vous ouvrez le Sheet
              </p>
              <div className="mt-2">
                <input
                  type="text"
                  value={googleSheetUrl}
                  onChange={(e) => setGoogleSheetUrl(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  placeholder="https://docs.google.com/spreadsheets/d/1Bxi5.../edit"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Statut connexion */}
        {googleConnected && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-800">Connecté</span>
              </div>
              <div className="flex items-center gap-3">
                {googleSheetUrl && (
                  <a href={googleSheetUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-green-600 hover:underline">
                    Ouvrir ↗
                  </a>
                )}
                <button onClick={handleDisconnect}
                  className="text-xs text-red-600 hover:text-red-800 font-medium">
                  Déconnecter
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Structure + actions */}
        {googleConnected && (
          <>
            {sheetColumns.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-medium text-gray-700">Colonnes du Sheet</h3>
                  <button onClick={fetchSheetColumns} className="text-xs text-blue-600 hover:text-blue-800">
                    ↻ Actualiser
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sheetColumns.map((col, i) => (
                    <span key={i}
                      className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium ${
                        i === 0 ? "bg-blue-100 text-blue-700" :
                        col.toLowerCase().includes("client") || col.toLowerCase().includes("nom") ? "bg-purple-100 text-purple-700" :
                        col.toLowerCase().includes("tél") || col.toLowerCase().includes("phone") ? "bg-green-100 text-green-700" :
                        col.toLowerCase().includes("produit") ? "bg-orange-100 text-orange-700" :
                        col.toLowerCase().includes("prix") || col.toLowerCase().includes("total") ? "bg-emerald-100 text-emerald-700" :
                        "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              {sheetColumns.length === 0 && (
                <button onClick={initializeSheetColumns}
                  className="flex-1 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 py-2.5 rounded-xl text-sm font-medium transition-colors">
                  + Initialiser les colonnes
                </button>
              )}
              <button onClick={testSheetConnection} disabled={testingSheet}
                className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 py-2.5 rounded-xl text-sm font-medium text-gray-700 transition-colors disabled:opacity-50">
                {testingSheet ? "Test..." : "🧪 Tester la connexion"}
              </button>
            </div>
          </>
        )}

        {/* Bouton connecter */}
        {!googleConnected && (
          <button onClick={handleGoogleConnect} disabled={!googleSheetUrl || !saEmail}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 shadow-md hover:shadow-lg flex items-center justify-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25l-9.19-4.24-6.54 8.56 9.19 4.24 6.54-8.56z" fill="currentColor" opacity="0.6"/>
              <path d="M12 14.25v-4.5l6.54 8.56-6.54 8.56v-8.48z" fill="currentColor" opacity="0.8"/>
              <path d="M12 5.75l9.19-4.24v8.48l-9.19 4.24v-8.48z" fill="currentColor" opacity="0.9"/>
              <path d="M12 14.25l-9.19-4.24v8.48l9.19 4.24v-8.48z" fill="currentColor"/>
            </svg>
            Connecter
          </button>
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
          <select value={defaultCurrency} onChange={(e) => setDefaultCurrency(e.target.value)} className={inputClass}>
            <optgroup label="🌍 Devises Africaines">
              {worldCurrencies.filter(c => c.region === "africa").map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.flag} {curr.name} ({curr.code})
                </option>
              ))}
            </optgroup>
            <optgroup label="🌐 Autres Devises Mondiales">
              {worldCurrencies.filter(c => c.region !== "africa").map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.flag} {curr.name} ({curr.code})
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
