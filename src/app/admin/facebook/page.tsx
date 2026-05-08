"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Share2, RefreshCw, CheckCircle, XCircle, AlertCircle, BarChart3, Package, Link, TrendingUp, Eye, MousePointerClick, ShoppingCart, DollarSign } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

type MetaSettings = {
  meta_app_id: string;
  meta_app_secret: string;
  meta_business_account_id: string;
  meta_access_token: string;
  meta_catalog_id: string;
  meta_page_id: string;
  meta_instagram_account_id: string;
};

type CatalogProduct = {
  id: string;
  name: string;
  description: string;
  price: string;
  currency: string;
  image_url: string;
  status: string;
};

type SyncLog = {
  id: string;
  product_name: string;
  status: "success" | "error";
  message: string;
  created_at: string;
};

type Insight = {
  date: string;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  spend: number;
  sales: number;
  roas: number;
};

const MOCK_INSIGHTS: Insight[] = [
  { date: "Lun", impressions: 1200, reach: 980, clicks: 45, ctr: 3.75, spend: 24.50, sales: 3, roas: 4.2 },
  { date: "Mar", impressions: 1850, reach: 1450, clicks: 72, ctr: 3.89, spend: 32.00, sales: 5, roas: 5.1 },
  { date: "Mer", impressions: 2100, reach: 1680, clicks: 88, ctr: 4.19, spend: 38.50, sales: 7, roas: 6.8 },
  { date: "Jeu", impressions: 1600, reach: 1320, clicks: 61, ctr: 3.81, spend: 28.00, sales: 4, roas: 4.5 },
  { date: "Ven", impressions: 2400, reach: 1950, clicks: 105, ctr: 4.38, spend: 45.00, sales: 8, roas: 7.2 },
  { date: "Sam", impressions: 2800, reach: 2200, clicks: 130, ctr: 4.64, spend: 52.00, sales: 10, roas: 8.1 },
  { date: "Dim", impressions: 1950, reach: 1580, clicks: 78, ctr: 4.00, spend: 35.00, sales: 6, roas: 5.5 },
];

const TABS = [
  { id: "connection", label: "Connexion", icon: Link },
  { id: "catalog", label: "Catalogue", icon: Package },
  { id: "performance", label: "Performances", icon: BarChart3 },
] as const;

type TabId = typeof TABS[number]["id"];

export default function FacebookChannelPage() {
  const [activeTab, setActiveTab] = useState<TabId>("connection");
  const [metaSettings, setMetaSettings] = useState<MetaSettings>({
    meta_app_id: "", meta_app_secret: "", meta_business_account_id: "",
    meta_access_token: "", meta_catalog_id: "", meta_page_id: "", meta_instagram_account_id: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState<CatalogProduct[]>([]);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [connected, setConnected] = useState(false);
  const [catalogCreated, setCatalogCreated] = useState(false);

  const fetchSettings = useCallback(async () => {
    const { data } = await supabase.from("settings").select("*").single();
    if (data) {
      const s: MetaSettings = {
        meta_app_id: data.meta_app_id || "",
        meta_app_secret: data.meta_app_secret || "",
        meta_business_account_id: data.meta_business_account_id || "",
        meta_access_token: data.meta_access_token || "",
        meta_catalog_id: data.meta_catalog_id || "",
        meta_page_id: data.meta_page_id || "",
        meta_instagram_account_id: data.meta_instagram_account_id || "",
      };
      setMetaSettings(s);
      setConnected(!!(data.meta_access_token && data.meta_business_account_id));
      setCatalogCreated(!!data.meta_catalog_id);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    const { data: existing } = await supabase.from("settings").select("id").single();
    if (existing?.id) {
      await supabase.from("settings").update({
        ...metaSettings,
        updated_at: new Date().toISOString(),
      }).eq("id", existing.id);
    } else {
      await supabase.from("settings").insert([metaSettings]);
    }
    setConnected(!!(metaSettings.meta_access_token && metaSettings.meta_business_account_id));
    setCatalogCreated(!!metaSettings.meta_catalog_id);
    setSaving(false);
    toast.success("Paramètres Meta enregistrés");
  };

  const handleSyncCatalog = async () => {
    if (!metaSettings.meta_access_token || !metaSettings.meta_business_account_id) {
      toast.error("Connectez d'abord votre compte Meta Business");
      return;
    }
    setSyncing(true);
    try {
      const res = await fetch("/api/meta/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: metaSettings.meta_access_token,
          business_id: metaSettings.meta_business_account_id,
          catalog_id: metaSettings.meta_catalog_id,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Catalogue synchronisé : ${data.synced} produits`);
        if (data.catalog_id && !metaSettings.meta_catalog_id) {
          setMetaSettings(prev => ({ ...prev, meta_catalog_id: data.catalog_id }));
          setCatalogCreated(true);
          const { data: existing } = await supabase.from("settings").select("id").single();
          if (existing?.id) {
            await supabase.from("settings").update({
              meta_catalog_id: data.catalog_id,
              updated_at: new Date().toISOString(),
            }).eq("id", existing.id);
          }
        }
        if (data.results) setSyncLogs(data.results);
      } else {
        toast.error(data.error || "Erreur de synchronisation");
      }
    } catch {
      toast.error("Erreur de connexion à l'API Meta");
    } finally {
      setSyncing(false);
    }
  };

  const handleTestConnection = async () => {
    if (!metaSettings.meta_access_token) {
      toast.error("Entrez d'abord un Access Token");
      return;
    }
    try {
      const res = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${metaSettings.meta_access_token}`);
      const data = await res.json();
      if (data.id) {
        toast.success(`✅ Connecté à Facebook (ID: ${data.id})`);
      } else {
        toast.error(data.error?.message || "Token invalide");
      }
    } catch {
      toast.error("Erreur de connexion");
    }
  };

  const inputClass = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-emerald-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
          <Share2 className="w-7 h-7 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Facebook & Instagram</h1>
          <p className="text-sm text-gray-500">Vendez sur Facebook et Instagram</p>
        </div>
      </div>

      {/* Connection Status */}
      {connected && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <span className="text-sm font-medium text-emerald-800">
            Connecté à Meta Business {metaSettings.meta_business_account_id}
          </span>
          {catalogCreated && (
            <span className="ml-auto text-xs text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full">
              Catalogue #{metaSettings.meta_catalog_id?.slice(0, 8)}...
            </span>
          )}
        </div>
      )}

      {!connected && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <span className="text-sm font-medium text-amber-800">
            Non connecté — Ajoutez vos identifiants Meta Business pour commencer
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${
                isActive ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab: Connection */}
      {activeTab === "connection" && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Identifiants Meta Business</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Créez une App Meta Developer, puis collez vos identifiants ici
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">App ID</label>
              <input type="text" value={metaSettings.meta_app_id} onChange={e => setMetaSettings(p => ({ ...p, meta_app_id: e.target.value }))} className={inputClass} placeholder="123456789012345" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">App Secret</label>
              <input type="password" value={metaSettings.meta_app_secret} onChange={e => setMetaSettings(p => ({ ...p, meta_app_secret: e.target.value }))} className={inputClass} placeholder="•••••••••••••••" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Account ID</label>
              <input type="text" value={metaSettings.meta_business_account_id} onChange={e => setMetaSettings(p => ({ ...p, meta_business_account_id: e.target.value }))} className={inputClass} placeholder="123456789012345" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Access Token (long-lived)</label>
              <input type="password" value={metaSettings.meta_access_token} onChange={e => setMetaSettings(p => ({ ...p, meta_access_token: e.target.value }))} className={inputClass} placeholder="EAAx..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Page ID (optionnel)</label>
              <input type="text" value={metaSettings.meta_page_id} onChange={e => setMetaSettings(p => ({ ...p, meta_page_id: e.target.value }))} className={inputClass} placeholder="Page Facebook" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instagram Account ID (optionnel)</label>
              <input type="text" value={metaSettings.meta_instagram_account_id} onChange={e => setMetaSettings(p => ({ ...p, meta_instagram_account_id: e.target.value }))} className={inputClass} placeholder="Compte Instagram Business" />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-sm font-medium disabled:opacity-50"
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
            <button
              onClick={handleTestConnection}
              disabled={!metaSettings.meta_access_token}
              className="px-5 py-2.5 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 text-sm font-medium disabled:opacity-50"
            >
              Tester la connexion
            </button>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-gray-700 mb-2">Comment obtenir ces identifiants ?</h3>
            <ol className="text-xs text-gray-500 space-y-1.5 list-decimal list-inside">
              <li>Allez sur <a href="https://developers.facebook.com" target="_blank" rel="noopener" className="text-blue-600 hover:underline">developers.facebook.com</a></li>
              <li>Créez une App de type "Business" ou "Authentification"</li>
              <li>Ajoutez les produits "Marketing API" et "Conversions API"</li>
              <li>Copiez l'App ID et l'App Secret depuis les paramètres de l'app</li>
              <li>Générez un Token depuis votre Business Manager (System User)</li>
              <li>Le Business Account ID se trouve dans votre Business Manager &gt; Infos</li>
            </ol>
          </div>
        </div>
      )}

      {/* Tab: Catalog */}
      {activeTab === "catalog" && (
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-gray-600" />
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Catalogue Produits</h2>
                  <p className="text-xs text-gray-500">Synchronisez vos produits vers Facebook Catalog</p>
                </div>
              </div>
              <button
                onClick={handleSyncCatalog}
                disabled={syncing || !connected}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Synchronisation..." : "Sync Now"}
              </button>
            </div>

            {!connected ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                Connectez votre compte Meta Business d'abord
              </div>
            ) : catalogCreated ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-emerald-800">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Catalogue actif :</span>
                  <code className="text-xs bg-emerald-100 px-2 py-0.5 rounded">{metaSettings.meta_catalog_id}</code>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-amber-800">
                  <AlertCircle className="w-4 h-4" />
                  <span>Aucun catalogue créé. Cliquez sur "Sync Now" pour en créer un automatiquement.</span>
                </div>
              </div>
            )}

            {/* Sync Logs */}
            {syncLogs.length > 0 && (
              <div className="mt-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Dernière synchronisation</h3>
                <div className="space-y-2">
                  {syncLogs.map((log, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      {log.status === "success" ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-red-500" />
                      )}
                      <span className="text-gray-700">{log.product_name}</span>
                      <span className="text-gray-400">{log.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Synced Products Preview */}
          {catalogProducts.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Produits synchronisés ({catalogProducts.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {catalogProducts.map(p => (
                  <div key={p.id} className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      {p.image_url && <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.price} {p.currency}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      p.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Performance */}
      {activeTab === "performance" && (
        <div className="space-y-5">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: "Impressions", value: "14 900", icon: Eye, change: "+12%" },
              { label: "Reach", value: "11 160", icon: TrendingUp, change: "+8%" },
              { label: "Clics", value: "579", icon: MousePointerClick, change: "+15%" },
              { label: "CTR", value: "3,9%", icon: BarChart3, change: "+0.3%" },
              { label: "Ventes", value: "43", icon: ShoppingCart, change: "+22%" },
              { label: "ROAS", value: "5,9x", icon: DollarSign, change: "+1.2x" },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-emerald-600 font-medium">{stat.change}</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Chart: Impressions & Reach */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Impressions & Reach (7 jours)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_INSIGHTS}>
                  <defs>
                    <linearGradient id="impressionsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="reachGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} tickLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="impressions" stroke="#3b82f6" fill="url(#impressionsGradient)" strokeWidth={2} name="Impressions" />
                  <Area type="monotone" dataKey="reach" stroke="#10b981" fill="url(#reachGradient)" strokeWidth={2} name="Reach" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart: Clicks & Sales */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Clics & Ventes</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MOCK_INSIGHTS}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} />
                    <YAxis tick={{ fontSize: 12 }} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="clicks" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Clics" />
                    <Bar dataKey="sales" fill="#10b981" radius={[4, 4, 0, 0]} name="Ventes" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4">ROAS (Return on Ad Spend)</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={MOCK_INSIGHTS}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} />
                    <YAxis tick={{ fontSize: 12 }} tickLine={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="roas" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} name="ROAS" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-xs text-amber-700">
              💡 Les données d&apos;insights sont actuellement en mode <strong>démonstration</strong>.
              Connectez un catalogue Facebook actif pour voir vos vraies performances.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
