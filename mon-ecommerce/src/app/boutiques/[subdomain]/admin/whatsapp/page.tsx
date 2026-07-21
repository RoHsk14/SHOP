"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Save, Smartphone, RefreshCw, RotateCw, CheckCircle, XCircle, Loader } from "lucide-react";
import { toast } from "sonner";

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
  phoneNumber?: string | null;
  shopSlug?: string;
  sheetConfigured?: boolean;
  error?: string;
}

/** Lire exp du JWT (secondes unix) — source fiable côté Nhost */
function jwtExp(accessToken: string): number | null {
  try {
    const part = accessToken.split(".")[1];
    if (!part) return null;
    const json = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof json.exp === "number" ? json.exp : null;
  } catch {
    return null;
  }
}

function tokenExpiresSoon(accessToken: string, skewSec = 120): boolean {
  const exp = jwtExp(accessToken);
  if (exp == null) return false; // ne pas forcer un refresh si on ne sait pas
  return exp - Math.floor(Date.now() / 1000) < skewSec;
}

function tokenIsExpired(accessToken: string): boolean {
  const exp = jwtExp(accessToken);
  if (exp == null) return false;
  return exp <= Math.floor(Date.now() / 1000);
}

async function getAccessToken(forceRefresh = false): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return null;

  const current = session.access_token;
  const shouldRefresh = forceRefresh || tokenExpiresSoon(current);

  if (shouldRefresh && typeof (supabase.auth as any).refreshSession === "function") {
    const { data, error } = await (supabase.auth as any).refreshSession();
    if (!error && data?.session?.access_token) {
      return data.session.access_token;
    }
    // Refresh mort : garder l'access token s'il est encore valide
    if (forceRefresh && tokenIsExpired(current)) return null;
  }

  if (tokenIsExpired(current)) return null;
  return current;
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
  const [botErrorMsg, setBotErrorMsg] = useState("");
  const [qrImage, setQrImage] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [phone, setPhone] = useState("");
  const [resetting, setResetting] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState("");

  const apiBase = `/api/whatsapp/${subdomain}`;

  const authFetch = useCallback(async (path: string, init: RequestInit = {}) => {
    const doFetch = async (token: string) => {
      const headers = new Headers(init.headers || {});
      headers.set("Authorization", `Bearer ${token}`);
      if (init.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      return fetch(path, { ...init, headers });
    };

    let token = await getAccessToken();
    if (!token) throw new Error("Non authentifié — reconnectez-vous");

    let res = await doFetch(token);
    if (res.status === 401) {
      token = await getAccessToken(true);
      if (!token) throw new Error("Session expirée — reconnectez-vous");
      res = await doFetch(token);
    }
    return res;
  }, []);

  const fetchSettings = useCallback(async () => {
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
  }, [subdomain]);

  const fetchGroups = useCallback(async (opts?: { refresh?: boolean; silentRetry?: boolean }) => {
    setGroupsLoading(true);
    setGroupsError("");
    try {
      const q = opts?.refresh ? "?refresh=1" : "";
      const res = await authFetch(`${apiBase}/groups${q}`);
      if (!res.ok) {
        let msg = "Impossible de charger les groupes";
        try {
          const err = await res.json();
          msg = err.error || msg;
        } catch {}
        setGroupsError(msg);
        return;
      }
      const data = await res.json();
      const list: Group[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.groups)
          ? data.groups
          : [];
      setGroups(list);
      if (list.length === 0) {
        // 2e essai auto (sync WhatsApp souvent lente)
        if (!opts?.silentRetry) {
          setGroupsError("Synchronisation des groupes… nouvel essai dans 5 s");
          setTimeout(() => {
            fetchGroups({ refresh: true, silentRetry: true });
          }, 5000);
        } else {
          setGroupsError(
            "Aucun groupe trouvé pour l’instant. Attendez ~30 s après la connexion, ouvrez un groupe sur le téléphone, puis actualisez."
          );
        }
      } else {
        setGroupsError("");
      }
    } catch (e: any) {
      setGroupsError(e?.message || "Erreur réseau lors du chargement des groupes");
    } finally {
      setGroupsLoading(false);
    }
  }, [apiBase, authFetch]);

  const fetchBotStatus = useCallback(async () => {
    try {
      const res = await authFetch(`${apiBase}/status`);
      if (!res.ok) {
        let msg = "Bot indisponible";
        try {
          const err = await res.json();
          msg = err.error || msg;
        } catch {}
        throw new Error(msg);
      }
      const data: BotStatus = await res.json();
      setBotStatus(data);
      setBotError(false);
      setBotErrorMsg("");

      if (data.hasQr) {
        const token = await getAccessToken();
        if (token) {
          const qrRes = await fetch(`${apiBase}/qr-image?t=${Date.now()}`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          });
          if (qrRes.ok) {
            const blob = await qrRes.blob();
            setQrImage((prev) => {
              if (prev.startsWith("blob:")) URL.revokeObjectURL(prev);
              return URL.createObjectURL(blob);
            });
          }
        }
      } else {
        setQrImage((prev) => {
          if (prev.startsWith("blob:")) URL.revokeObjectURL(prev);
          return "";
        });
      }

      if (data.status === "connected") {
        // Délai: le cache groupes est rempli ~2.5s après ready
        setTimeout(() => fetchGroups(), 800);
      }
    } catch (e: any) {
      setBotStatus(null);
      setBotError(true);
      const msg = e?.message || "Service WhatsApp indisponible";
      setBotErrorMsg(
        /session|authentif|token|401/i.test(msg)
          ? "Session expirée — déconnectez-vous puis reconnectez-vous, puis réessayez."
          : msg
      );
    }
  }, [apiBase, authFetch, fetchGroups]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await authFetch(`${apiBase}/connect`, { method: "POST" });
      if (res.ok) {
        toast.success("Connexion démarrée — scannez le QR");
        setTimeout(fetchBotStatus, 1500);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Impossible de démarrer la session");
      }
    } catch {
      toast.error("Erreur de connexion au bot");
    } finally {
      setConnecting(false);
    }
  };

  const handlePairing = async () => {
    if (!phone) {
      toast.error("Entrez un numéro");
      return;
    }
    try {
      const res = await authFetch(`${apiBase}/pairing`, {
        method: "POST",
        body: JSON.stringify({ phone }),
      });
      if (res.ok) {
        toast.success("Code de couplage envoyé !");
        setTimeout(fetchBotStatus, 5000);
      } else {
        try {
          const err = await res.clone().json();
          toast.error(err.error || "Erreur");
        } catch {
          const text = await res.text();
          toast.error(text || "Erreur inconnue");
        }
      }
    } catch {
      toast.error("Erreur de connexion au bot");
    }
  };

  const handleReset = async () => {
    if (
      !confirm(
        "Voulez-vous vraiment réinitialiser la connexion WhatsApp de CETTE boutique ? Vous devrez scanner un nouveau QR code."
      )
    )
      return;
    setResetting(true);
    try {
      const res = await authFetch(`${apiBase}/reset`, { method: "POST" });
      if (res.ok) {
        toast.success("Connexion réinitialisée, scannez le nouveau QR");
        setPhone("");
        setGroups([]);
        fetchBotStatus();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || "Impossible de réinitialiser");
      }
    } catch {
      toast.error("Erreur de connexion au bot");
    } finally {
      setResetting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (settings?.id) {
        await supabase
          .from("settings")
          .update({
            whatsapp_group_id: groupId || null,
            whatsapp_enabled: enabled,
            updated_at: new Date().toISOString(),
          })
          .eq("id", settings.id);
      } else {
        await supabase.from("settings").insert([
          {
            shop_slug: subdomain,
            whatsapp_group_id: groupId || null,
            whatsapp_enabled: enabled,
            updated_at: new Date().toISOString(),
            user_id: session?.user?.id,
          },
        ]);
      }

      toast.success("Configuration WhatsApp enregistrée !");
      fetchSettings();
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchBotStatus();
  }, [fetchSettings, fetchBotStatus]);

  useEffect(() => {
    if (!botStatus || botStatus.status === "connected") return;
    const interval = setInterval(fetchBotStatus, 4000);
    return () => clearInterval(interval);
  }, [botStatus, fetchBotStatus]);

  useEffect(() => {
    return () => {
      if (qrImage.startsWith("blob:")) URL.revokeObjectURL(qrImage);
    };
  }, [qrImage]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-green-600 rounded-full animate-spin"></div>
      </div>
    );

  const statusLabel = (s: string) => {
    switch (s) {
      case "connected":
        return { text: "Connecté", color: "text-green-600", dot: "bg-green-500" };
      case "awaiting_scan":
        return { text: "En attente de scan", color: "text-yellow-600", dot: "bg-yellow-500" };
      case "disconnected":
        return { text: "Déconnecté", color: "text-red-600", dot: "bg-red-500" };
      case "error":
        return { text: "Erreur", color: "text-red-600", dot: "bg-red-500" };
      case "initializing":
        return { text: "Initialisation...", color: "text-gray-500", dot: "bg-gray-400" };
      default:
        return { text: s || "Inconnu", color: "text-gray-500", dot: "bg-gray-400" };
    }
  };

  const inputClass =
    "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors";

  const isConnected = botStatus?.status === "connected";
  const isIdle = !botStatus || botStatus.status === "disconnected" || botStatus.status === "error";

  return (
    <div className="relative space-y-4 sm:space-y-5 max-w-3xl animate-fade-in">
      <div>
        <h1 className="text-lg sm:text-xl font-bold text-gray-900">WhatsApp</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
          Espace privé de <span className="font-medium text-gray-700">{subdomain}</span> — votre propre QR et numéro
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center">
            <Smartphone className="w-4.5 h-4.5 text-green-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Connexion WhatsApp</h2>
            <p className="text-xs text-gray-500">Session isolée pour cette boutique uniquement</p>
          </div>
        </div>

        {botError ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-red-800">Service WhatsApp indisponible</p>
            <p className="text-xs text-red-600 mt-1">{botErrorMsg || "Vérifiez que le bot est démarré"}</p>
            <button
              onClick={fetchBotStatus}
              className="mt-3 text-xs text-red-700 underline hover:no-underline"
            >
              Réessayer
            </button>
          </div>
        ) : botStatus ? (
          <div>
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <div className={`w-2.5 h-2.5 rounded-full ${statusLabel(botStatus.status).dot}`}></div>
              <span className={`text-sm font-medium ${statusLabel(botStatus.status).color}`}>
                {statusLabel(botStatus.status).text}
              </span>
              {botStatus.phoneNumber && (
                <span className="text-xs text-gray-500 font-mono">+{botStatus.phoneNumber}</span>
              )}
              <button
                onClick={fetchBotStatus}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Rafraîchir"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {isIdle && (
              <div className="mb-4">
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {connecting ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Smartphone className="w-4 h-4" />
                  )}
                  {connecting ? "Démarrage..." : "Connecter mon WhatsApp"}
                </button>
                <p className="text-xs text-gray-400 text-center mt-2">
                  Un QR code unique sera généré pour votre boutique
                </p>
              </div>
            )}

            {botStatus.status === "awaiting_scan" && botStatus.hasQr && qrImage && (
              <div className="text-center mb-4">
                <img src={qrImage} alt="QR Code" className="w-48 h-48 mx-auto rounded-lg border p-2" />
                <p className="text-xs text-gray-500 mt-2">
                  Scannez ce QR avec WhatsApp &gt; Appareils connectés
                </p>
              </div>
            )}

            {botStatus.status === "initializing" && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 py-6">
                <Loader className="w-4 h-4 animate-spin" />
                Préparation de votre session...
              </div>
            )}

            {(botStatus.status === "awaiting_scan" || botStatus.status === "initializing") && (
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-xs font-medium text-gray-700 mb-2">Code de couplage (alternative au QR)</p>
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

            {isConnected && (
              <>
                <div className="mb-4 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  WhatsApp connecté pour cette boutique uniquement
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Groupe WhatsApp de notification
                  </label>

                  {groupsLoading && groups.length === 0 ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500 py-3 px-3 bg-gray-50 rounded-lg border border-gray-100">
                      <Loader className="w-4 h-4 animate-spin" />
                      Chargement des groupes WhatsApp...
                    </div>
                  ) : groups.length > 0 ? (
                    <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className={inputClass}>
                      <option value="">Sélectionner un groupe...</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={groupId}
                      onChange={(e) => setGroupId(e.target.value)}
                      placeholder="ID du groupe (ex: 120363...@g.us)"
                      className={inputClass}
                    />
                  )}

                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fetchGroups({ refresh: true })}
                      disabled={groupsLoading}
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${groupsLoading ? "animate-spin" : ""}`} />
                      {groupsLoading ? "Chargement..." : "Actualiser la liste des groupes"}
                    </button>
                    {groups.length > 0 && (
                      <span className="text-xs text-gray-400">{groups.length} groupe(s)</span>
                    )}
                  </div>

                  {groupsError && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-2 mt-2">
                      {groupsError}
                    </p>
                  )}
                  {!groupsLoading && groups.length === 0 && !groupsError && (
                    <p className="text-xs text-gray-400 mt-1">
                      Aucun groupe pour l&apos;instant — actualisez ou saisissez l&apos;ID manuellement.
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={handleReset}
                    disabled={resetting}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    <RotateCw className={`w-4 h-4 ${resetting ? "animate-spin" : ""}`} />
                    {resetting
                      ? "Réinitialisation..."
                      : "Changer de numéro — Réinitialiser ma session"}
                  </button>
                  <p className="text-xs text-gray-400 text-center mt-2">
                    N&apos;affecte que votre boutique, pas les autres marchands
                  </p>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader className="w-4 h-4 animate-spin" />
            Connexion au service...
          </div>
        )}
      </div>

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
            className={`relative w-11 h-6 rounded-full transition-colors ${
              enabled ? "bg-green-500" : "bg-gray-300"
            }`}
          >
            <div
              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                enabled ? "translate-x-5.5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800 space-y-1">
          <p className="font-medium">Comment ça marche :</p>
          <p>1. Connectez votre propre WhatsApp (QR unique à votre boutique)</p>
          <p>2. Choisissez le groupe de notification</p>
          <p>3. Les commandes du Google Sheet sont envoyées toutes les 30 s</p>
          <p>4. La colonne &quot;Statut&quot; est marquée &quot;Envoyé&quot; automatiquement</p>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving || !isConnected}
        className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-sm"
      >
        <Save size={16} />
        {saving ? "Enregistrement..." : "Enregistrer"}
      </button>

      {!isConnected && (
        <p className="text-xs text-center text-gray-400">
          Connectez WhatsApp d&apos;abord pour pouvoir enregistrer
        </p>
      )}
    </div>
  );
}
