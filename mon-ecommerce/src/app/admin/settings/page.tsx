"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Save, Plus, X, TrendingUp, Settings, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { worldCurrencies } from "@/lib/currencies";

interface FormField { name: string; label: string; required: boolean; }
interface Settings { id: string; pixel_id: string; capi_token: string; default_currency: string; custom_form_fields: FormField[]; updated_at: string; }

export default function SettingsAdmin() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pixelId, setPixelId] = useState("");
  const [capiToken, setCapiToken] = useState("");
  const [defaultCurrency, setDefaultCurrency] = useState("EUR");
  const [googleSheetUrl, setGoogleSheetUrl] = useState("");
  const [googleConnected, setGoogleConnected] = useState(false);
  const [sheetColumns, setSheetColumns] = useState<string[]>([]);
  const [testingSheet, setTestingSheet] = useState(false);
  const [formFields, setFormFields] = useState<FormField[]>([
    { name: "customer_name", label: "Nom complet", required: true },
    { name: "customer_phone", label: "Téléphone", required: true },
    { name: "customer_address", label: "Adresse", required: true },
  ]);

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from("settings").select("*").single();
      
      if (error) {
        console.error("Erreur chargement settings:", error);
        if (error.code !== 'PGRST116') { // Pas "no rows returned"
          toast.error("Erreur chargement paramètres");
        }
      }
      
      if (data) {
        console.log("✅ Settings chargés:", data);
        setSettings(data); 
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
    // Extract Sheet ID from URL
    const match = googleSheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      toast.error("URL Google Sheet invalide");
      return;
    }
    
    setGoogleConnected(true);
    toast.success("Google Sheet configuré !");
    
    // Sauvegarder dans la base de données
    try {
      // Vérifier si un enregistrement existe déjà
      const { data: existingSettings, error: fetchError } = await supabase
        .from("settings")
        .select("id")
        .single();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error("Erreur récupération settings:", fetchError);
        return;
      }
      
      let saveError;
      if (existingSettings?.id) {
        // Mettre à jour l'enregistrement existant
        const { error } = await supabase
          .from("settings")
          .update({
            google_sheet_url: googleSheetUrl,
            updated_at: new Date().toISOString()
          })
          .eq("id", existingSettings.id);
        saveError = error;
      } else {
        // Créer un nouvel enregistrement
        const { error } = await supabase
          .from("settings")
          .insert([{
            google_sheet_url: googleSheetUrl,
            updated_at: new Date().toISOString()
          }]);
        saveError = error;
      }
      
      if (saveError) {
        console.error("Erreur sauvegarde:", saveError);
        toast.error("Erreur lors de la sauvegarde");
      } else {
        console.log("✅ URL sauvegardée en base:", googleSheetUrl);
        // Rafraîchir les colonnes après connexion
        fetchSheetColumns();
      }
    } catch (error) {
      console.error("Erreur sauvegarde:", error);
    }
  };

  const handleDisconnect = async () => {
    setGoogleConnected(false);
    setGoogleSheetUrl("");
    setSheetColumns([]);
    // Clear from settings
    try {
      const { data } = await supabase.from("settings").select("id").single();
      if (data?.id) {
        await supabase.from("settings").update({
          google_sheet_url: null,
          google_sheet_columns: null,
          updated_at: new Date().toISOString()
        }).eq("id", data.id);
      }
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
      // Send test data using frontend URL directly
      const testData = {
        sheet_url: googleSheetUrl,
        columns: ["Date", "Nom du client", "Téléphone", "Adresse", "Quartier", "Produit", "Quantité", "Total", "Devise", "Statut"],
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
          "Statut": "pending"
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
        body: JSON.stringify({ sheet_url: googleSheetUrl })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.columns && data.columns.length > 0) {
          setSheetColumns(data.columns);
          // Sauvegarder en base
          const { data: settingsData } = await supabase.from("settings").select("id").single();
          if (settingsData?.id) {
            await supabase.from("settings").update({
              google_sheet_columns: data.columns,
              updated_at: new Date().toISOString()
            }).eq("id", settingsData.id);
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
          columns: ["Date", "Nom du client", "Téléphone", "Adresse", "Quartier", "Produit", "Quantité", "Total", "Devise", "Statut"]
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success("✅ Colonnes initialisées !");
        setSheetColumns(data.columns || []);
        // Sauvegarder les colonnes dans la base
        const { data: settingsData } = await supabase.from("settings").select("id").single();
        if (settingsData?.id) {
          await supabase.from("settings").update({
            google_sheet_columns: data.columns,
            updated_at: new Date().toISOString()
          }).eq("id", settingsData.id);
        }
        fetchSheetColumns(); // Refresh columns display
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
    const settingsData = {
      pixel_id: pixelId, capi_token: capiToken, default_currency: defaultCurrency,
      google_sheet_url: googleSheetUrl,
      custom_form_fields: formFields,
      updated_at: new Date().toISOString(),
    };
    if (settings?.id) { await supabase.from("settings").update(settingsData).eq("id", settings.id); }
    else { await supabase.from("settings").insert([settingsData]); }
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

      {/* Google Sheets - Style Shopify/Easy Sell */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
            <ShoppingCart className="w-4.5 h-4.5 text-green-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Google Sheets</h2>
            <p className="text-xs text-gray-500">Synchronisation automatique des commandes</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Statut connexion (si connecté) */}
          {googleConnected && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-green-800">Connecté à Google Sheets</span>
                </div>
                <button 
                  onClick={handleDisconnect}
                  className="text-xs text-green-700 hover:text-green-900 font-medium"
                >
                  Déconnecter
                </button>
              </div>
              {googleSheetUrl && (
                <a 
                  href={googleSheetUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-green-600 hover:underline"
                >
                  Ouvrir le Sheet ↗
                </a>
              )}
            </div>
          )}

          {/* Structure du Sheet */}
          {googleConnected && sheetColumns.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium text-gray-700">📊 Structure du Sheet</h3>
                <button
                  onClick={fetchSheetColumns}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  ↻ Actualiser
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {sheetColumns.map((col, i) => (
                  <span 
                    key={i}
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
              <p className="text-xs text-gray-400 mt-2">Colonnes automatiquement configurées selon votre formulaire</p>
            </div>
          )}

          {/* Bouton Initialiser les colonnes (si pas encore de colonnes) */}
          {googleConnected && sheetColumns.length === 0 && (
            <button
              onClick={initializeSheetColumns}
              className="w-full bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 py-3 rounded-xl text-sm font-medium transition-colors"
            >
              + Initialiser les colonnes automatiquement
            </button>
          )}

          {/* URL Input (toujours visible) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL du Google Sheet</label>
            <input
              type="text" 
              value={googleSheetUrl} 
              onChange={(e) => setGoogleSheetUrl(e.target.value)}
              className={inputClass} 
              placeholder="https://docs.google.com/spreadsheets/d/1Bxi5LRaN3hGOF_0/edit#gid=0" 
            />
            <p className="text-xs text-gray-400 mt-1.5">Collez l'URL complète de votre Google Sheet</p>
          </div>

          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleGoogleConnect}
              disabled={!googleSheetUrl || saving}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-md hover:shadow-lg"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25l-9.19-4.24-6.54 8.56 9.19 4.24 6.54-8.56z" fill="#4285F4"/>
                <path d="M12 14.25v-4.5l6.54 8.56-6.54 8.56v-8.48z" fill="#34A853"/>
                <path d="M12 5.75l9.19-4.24v8.48l-9.19 4.24v-8.48z" fill="#FBBC04"/>
                <path d="M12 14.25l-9.19-4.24v8.48l9.19 4.24v-8.48z" fill="#EA4335"/>
              </svg>
              {googleConnected ? "Reconnecter" : "Connecter avec Google Sheets"}
            </button>
            
            <button
              onClick={testSheetConnection}
              disabled={!googleSheetUrl || testingSheet}
              className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 py-3 rounded-xl text-sm font-medium text-gray-700 transition-colors disabled:opacity-50"
            >
              {testingSheet ? "Test..." : "🧪 Tester"}
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-700">
              💡 <strong>Shopify-like :</strong> Une fois connecté, les colonnes du Sheet seront automatiquement créées selon votre formulaire de commande.
            </p>
          </div>
        </div>
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
