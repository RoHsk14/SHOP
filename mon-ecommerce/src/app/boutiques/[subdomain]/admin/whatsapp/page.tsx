"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Save, Smartphone, RefreshCw, CheckCircle, XCircle, Loader } from "lucide-react";
import { toast } from "sonner";
// Public URL of the WhatsApp bot (set in env)
const BOT_URL = process.env.NEXT_PUBLIC_WHATSAPP_BOT_URL;
if (!BOT_URL) {
  console.error("NEXT_PUBLIC_WHATSAPP_BOT_URL is not defined");
}

interface Settings {
  id: string;
  google_sheet_url: string;
  google_sheet_columns: string[];
  whatsapp_group_id: string;
  whatsapp_enabled: boolean;
  shop_name: string;
}

interface Group {
  id: string;
  name: string;
}

interface BotStatus {
  status: string;
  hasQr: boolean;
  hasPairing: boolean;
  sheetConfigured?: boolean;
}

export default function WhatsAppAdmin() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [groupId, setGroupId] = useState("");
  const [googleSheetUrl, setGoogleSheetUrl] = useState("");

  const [botStatus, setBotStatus] = useState<BotStatus | null>(null);
  const [botError, setBotError] = useState(false);
  const [qrImage, setQrImage] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [phone, setPhone] = useState("");

  useEffect(() => {
    fetchSettings();
    fetchBotStatus();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from("settings")
        .select("id, google_sheet_url, google_sheet_columns, whatsapp_group_id, whatsapp_enabled, shop_name")
        .eq("shop_slug", subdomain)
        .single();

      if (data) {
        setSettings(data);
        setGoogleSheetUrl(data.google_sheet_url || "");
        setGroupId(data.whatsapp_group_id || "");
        setEnabled(data.whatsapp_enabled || false);
      }
    } catch (err) {
      console.error("Erreur chargement:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBotStatus = async () => {
    try {
      console.log("[WhatsApp] fetching status from:", `${BOT_URL}/status`);
const res = await fetch(`${BOT_URL}/status`);
      if (!res.ok) throw new Error("Bot indisponible");
      const data: BotStatus = await res.json();
      setBotStatus(data);
      setBotError(false);

      if (data.hasQr) {
        setQrImage(`${BOT_URL}/qr-image?${Date.now()}`);
      } else {
        setQrImage("");
      }

      if (data.status === "connected") {
        fetchGroups();
      }
    } catch {
      setBotStatus(null);
      setBotError(true);
    }
  };

  const fetchGroups = async () => {
    try {
      console.log("[WhatsApp] fetching groups from:", `${BOT_URL}/groups`);
const res = await fetch(`${BOT_URL}/groups`);
      if (res.ok) {
        const data: Group[] = await res.json();
        setGroups(data);
      }
    } catch {
      // Silently fail, groups not critical
    }
  };

  const handlePairing = async () => {
    if (!phone) { toast.error("Entrez un numéro"); return; }
    try {
      console.log("[WhatsApp] sending pairing request to:", `${BOT_URL}/pairing`);
const res = await fetch(`${BOT_URL}/pairing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      if (res.ok) {
        toast.success("Code de couplage envoyé !");
        setTimeout(fetchBotStatus, 5000);
      } else {
        const err = await res.json();
        toast.error(err.error || "Erreur");
      }
    } catch {
      toast.error("Erreur de connexion au bot");
    }
  };

  useEffect(() => {
    if (!botStatus || botStatus.status === "connected") return;
    const interval = setInterval(fetchBotStatus, 4000);
    return () => clearInterval(interval);
  }, [botStatus]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (settings?.id) {
        await supabase.from("settings").update({
          whatsapp_group_id: groupId || null,
          whatsapp_enabled: enabled,
          updated_at: new Date().toISOString(),
        }).eq("id", settings.id);
      } else {
        await supabase.from("settings").insert([{
          shop_slug: subdomain,
          whatsapp_group_id: groupId || null,
          whatsapp_enabled: enabled,
          updated_at: new Date().toISOString(),
          user_id: session?.user?.id,
        }]);
      }

      toast.success("Configuration WhatsApp enregistrée !");
    } catch (err) {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-gray-200 border-t-green-600 rounded-full animate-spin"></div>
    </div>
  );

  const statusLabel = (s: string) => {
    switch (s) {
      case "connected": return { text: "Connecté", color: "text-green-600", dot: "bg-green-500" };
      case "awaiting_scan": return { text: "En attente de scan", color: "text-yellow-600", dot: "bg-yellow-500" };
      case "disconnected": return { text: "Déconnecté", color: "text-red-600", dot: "bg-red-500" };
      default: return { text: "Initialisation...", color: "text-gray-500", dot: "bg-gray-400" };
    }
  };

  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors";

  return (
    <div className="space-y-4 sm:space-y-5 max-w-3xl animate-fade-in">
      <div>
        <h1 className="text-lg sm:text-xl font-bold text-gray-900">WhatsApp</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          Notifications automatiques des commandes par WhatsApp
        </p>
      </div>

      {/* Statut connexion WhatsApp */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
            <Smartphone className="w-4.5 h-4.5 text-green-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Connexion WhatsApp</h2>
            <p className="text-xs text-gray-500">Statut de la connexion WhatsApp</p>
          </div>
        </div>

        {botError ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-red-800">Service WhatsApp indisponible</p>
            <p className="text-xs text-red-600 mt-1">
              Vérifiez que le service WhatsApp Bot est démarré (port 3000)
            </p>
          </div>
        ) : botStatus ? (
          <div>
            {/* Status badge */}
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-2.5 h-2.5 rounded-full ${statusLabel(botStatus.status).dot}`}></div>
              <span className={`text-sm font-medium ${statusLabel(botStatus.status).color}`}>
                {statusLabel(botStatus.status).text}
              </span>
              <button onClick={fetchBotStatus} className="ml-auto p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* QR Code */}
            {botStatus.status === "awaiting_scan" && botStatus.hasQr && (
              <div className="text-center mb-4">
                <img src={qrImage} alt="QR Code" className="w-48 h-48 mx-auto rounded-lg border p-2" />
                <p className="text-xs text-gray-500 mt-2">
                  Scannez ce QR avec WhatsApp &gt; Appareils connectés
                </p>
              </div>
            )}

            {/* Pairing code form */}
            {botStatus.status !== "connected" && (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-medium text-gray-700 mb-2">Code de couplage (alternative)</p>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="229XXXXXXXX"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <button
                    onClick={handlePairing}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Envoyer
                  </button>
                </div>
              </div>
            )}

            {/* Group selector (only when connected) */}
            {botStatus.status === "connected" && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Groupe WhatsApp de notification
                </label>
                <select
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Sélectionner un groupe...</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={fetchGroups}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Actualiser la liste des groupes
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader className="w-4 h-4 animate-spin" />
            Connexion au service...
          </div>
        )}
      </div>

      {/* Configuration du flux */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center">
            <Smartphone className="w-4.5 h-4.5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Configuration</h2>
            <p className="text-xs text-gray-500">Source des commandes et activation</p>
          </div>
        </div>

        {/* Google Sheet URL / read-only */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">Google Sheet connecté</label>
          {googleSheetUrl ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={googleSheetUrl}
                readOnly
                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 font-mono"
              />
              <a
                href={googleSheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-xs font-medium text-gray-700 transition-colors"
              >
                Ouvrir ↗
              </a>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-800">
                Aucun Google Sheet connecté. Allez dans{" "}
                <a href={`/boutiques/${subdomain}/admin/settings`} className="font-semibold underline">
                  Paramètres
                </a>{" "}
                pour en configurer un.
              </p>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-1.5">
            Le bot surveille ce Sheet et envoie les nouvelles commandes dans le groupe WhatsApp.
          </p>
        </div>

        {/* Activation toggle */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
          <div>
            <p className="text-sm font-medium text-gray-900">Notifications WhatsApp</p>
            <p className="text-xs text-gray-500">
              {enabled
                ? "Les nouvelles commandes seront envoyées dans le groupe"
                : "Activez pour envoyer les commandes dans le groupe WhatsApp"}
            </p>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? "bg-green-500" : "bg-gray-300"
              }`}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? "translate-x-5.5" : "translate-x-0.5"
                }`}
            />
          </button>
        </div>

        {/* Info flux */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800 space-y-1">
          <p className="font-medium">Comment ça marche :</p>
          <p>1. Les commandes sont enregistrées dans votre Google Sheet</p>
          <p>2. Le bot vérifie les nouvelles lignes toutes les 30 secondes</p>
          <p>3. Les nouvelles commandes sont envoyées dans le groupe WhatsApp</p>
          <p>4. La colonne "Statut" est marquée "Envoyé" automatiquement</p>
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving || botStatus?.status !== "connected"}
        className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-sm"
      >
        <Save size={16} />
        {saving ? "Enregistrement..." : "Enregistrer"}
      </button>

      {botStatus?.status !== "connected" && (
        <p className="text-xs text-center text-gray-400">
          Connectez WhatsApp d&apos;abord pour pouvoir enregistrer
        </p>
      )}
    </div>
  );
}
