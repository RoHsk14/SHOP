"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Store,
  ShoppingCart,
  TrendingUp,
  Search,
  ShieldCheck,
  ShieldAlert,
  Shield,
  CheckCircle2,
  XCircle,
  ExternalLink,
  RefreshCw,
  Download,
  Mail,
  Copy,
  Check,
  Eye,
  Calendar,
  Clock,
  Package,
  Layers,
  ArrowUpDown,
  Filter,
  X,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ShopInfo {
  id: string;
  shop_slug: string;
  shop_name: string;
  owner_name: string;
  shop_description: string;
  shop_country: string;
  default_currency: string;
  pixel_id: string | null;
  google_sheet_url: string | null;
  whatsapp_enabled: boolean;
  is_super_admin: boolean;
  created_at: string;
  orders_count: number;
  products_count: number;
  revenue: number;
}

interface AdminUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
  lastSeen: string | null;
  emailVerified: boolean;
  disabled: boolean;
  defaultRole: string;
  phoneNumber: string | null;
  is_super_admin: boolean;
  shops: ShopInfo[];
  total_shops: number;
  total_orders: number;
  total_revenue: number;
  total_products: number;
}

interface StatsSummary {
  totalUsers: number;
  verifiedUsers: number;
  merchantsCount: number;
  superAdminsCount: number;
  totalShops: number;
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
}

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<StatsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "merchants" | "admins" | "no-shop" | "verified">("all");
  const [sortBy, setSortBy] = useState<"recent" | "oldest" | "revenue" | "orders" | "shops">("recent");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const getAuthHeaders = async () => {
    let { data: { session } } = await supabase.auth.getSession();
    let token = session?.access_token || "";

    // Refresh if expired or soon expired (15m window in Nhost)
    if (token && typeof (supabase.auth as any).refreshSession === "function") {
      try {
        const parts = token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
          if (payload.exp && payload.exp - Math.floor(Date.now() / 1000) < 120) {
            const { data: refreshed } = await (supabase.auth as any).refreshSession();
            if (refreshed?.session?.access_token) {
              token = refreshed.session.access_token;
              session = refreshed.session;
            }
          }
        }
      } catch {}
    }

    return {
      Authorization: `Bearer ${token}`,
      "x-user-email": session?.user?.email || "",
      "x-user-id": session?.user?.id || "",
    };
  };

  const fetchUsers = async () => {
    try {
      const headers = await getAuthHeaders();

      const res = await fetch("/api/admin/users", {
        headers,
      });

      if (!res.ok) {
        throw new Error("Impossible de charger les utilisateurs");
      }

      const data = await res.json();
      setUsers(data.users || []);
      setStats(data.stats || null);
    } catch (err) {
      console.error("[UsersPage] Error fetching users:", err);
      showToast("Erreur lors de la récupération des données");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast("Copié dans le presse-papier !");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleSuperAdmin = async (user: AdminUser) => {
    const newStatus = !user.is_super_admin;
    const confirmMsg = newStatus
      ? `Promouvoir ${user.email} en Super Administrateur ? Il aura accès à toutes les données.`
      : `Retirer les droits Super Administrateur de ${user.email} ?`;

    if (!confirm(confirmMsg)) return;

    try {
      setActionLoading(user.id);
      const authHeaders = await getAuthHeaders();

      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          userId: user.id,
          action: "toggle_super_admin",
          value: newStatus,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Échec de l'action");
      }

      // Update state locally
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_super_admin: newStatus } : u))
      );
      if (selectedUser?.id === user.id) {
        setSelectedUser({ ...selectedUser, is_super_admin: newStatus });
      }

      showToast(newStatus ? "Droits Super Admin accordés !" : "Droits Super Admin retirés.");
    } catch (err: any) {
      console.error("Action error:", err);
      showToast(err.message || "Erreur lors de la mise à jour");
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleDisabled = async (user: AdminUser) => {
    const newDisabled = !user.disabled;
    const confirmMsg = newDisabled
      ? `Désactiver le compte de ${user.email} ? L'utilisateur ne pourra plus se connecter.`
      : `Réactiver le compte de ${user.email} ?`;

    if (!confirm(confirmMsg)) return;

    try {
      setActionLoading(user.id);
      const authHeaders = await getAuthHeaders();

      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          userId: user.id,
          action: "toggle_disabled",
          value: newDisabled,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Échec de la modification");
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, disabled: newDisabled } : u))
      );
      if (selectedUser?.id === user.id) {
        setSelectedUser({ ...selectedUser, disabled: newDisabled });
      }

      showToast(newDisabled ? "Compte désactivé." : "Compte réactivé.");
    } catch (err: any) {
      console.error("Action error:", err);
      showToast(err.message || "Erreur");
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportCSV = () => {
    if (users.length === 0) return;

    const headers = [
      "ID",
      "Email",
      "Nom",
      "Super Admin",
      "Vérifié",
      "Actif",
      "Nombre Boutiques",
      "Boutiques (slugs)",
      "Total Produits",
      "Total Commandes",
      "Chiffre d'Affaires (XOF)",
      "Date Inscription",
      "Dernière Connexion",
    ];

    const rows = users.map((u) => [
      `"${u.id}"`,
      `"${u.email}"`,
      `"${u.displayName || ""}"`,
      u.is_super_admin ? "OUI" : "NON",
      u.emailVerified ? "OUI" : "NON",
      u.disabled ? "DÉSACTIVÉ" : "ACTIF",
      u.total_shops,
      `"${u.shops.map((s) => s.shop_slug).join(", ")}"`,
      u.total_products,
      u.total_orders,
      u.total_revenue,
      `"${new Date(u.createdAt).toISOString()}"`,
      u.lastSeen ? `"${new Date(u.lastSeen).toISOString()}"` : '""',
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `utilisateurs_shopeazy_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Export CSV téléchargé !");
  };

  const formatPrice = (val: number) =>
    new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val) + " XOF";

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const formatRelativeTime = (dateStr?: string | null) => {
    if (!dateStr) return "Jamais";
    try {
      const now = new Date().getTime();
      const then = new Date(dateStr).getTime();
      const diffSec = Math.floor((now - then) / 1000);

      if (diffSec < 60) return "À l'instant";
      if (diffSec < 3600) return `Il y a ${Math.floor(diffSec / 60)} min`;
      if (diffSec < 86400) return `Il y a ${Math.floor(diffSec / 3600)} h`;
      if (diffSec < 2592000) return `Il y a ${Math.floor(diffSec / 86400)} j`;
      return formatDate(dateStr);
    } catch {
      return "—";
    }
  };

  // Filter and sort users
  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => {
        // Search filter
        const q = search.toLowerCase().trim();
        const matchesSearch =
          !q ||
          u.email.toLowerCase().includes(q) ||
          u.displayName.toLowerCase().includes(q) ||
          u.id.toLowerCase().includes(q) ||
          u.shops.some((s) => s.shop_slug.toLowerCase().includes(q) || s.shop_name.toLowerCase().includes(q));

        if (!matchesSearch) return false;

        // Category filter
        if (filter === "merchants") return u.total_shops > 0;
        if (filter === "admins") return u.is_super_admin;
        if (filter === "no-shop") return u.total_shops === 0;
        if (filter === "verified") return u.emailVerified;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "recent") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === "oldest") {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === "revenue") {
          return b.total_revenue - a.total_revenue;
        }
        if (sortBy === "orders") {
          return b.total_orders - a.total_orders;
        }
        if (sortBy === "shops") {
          return b.total_shops - a.total_shops;
        }
        return 0;
      });
  }, [users, search, filter, sortBy]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-3">
        <div className="w-9 h-9 border-2 border-zinc-800 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-xs text-zinc-500">Chargement des utilisateurs de la plateforme...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-500 text-zinc-950 font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xl shadow-emerald-500/20 flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800/60">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight flex items-center gap-2.5">
              Utilisateurs
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {users.length} au total
              </span>
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Visualisation globale de tous les comptes, marchands, boutiques associées et permissions.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-zinc-100 text-xs font-medium transition-all shadow-sm group"
            title="Exporter les utilisateurs au format CSV"
          >
            <Download className="w-3.5 h-3.5 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
            <span>Exporter CSV</span>
          </button>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
            title="Actualiser la liste"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Total Users */}
          <div className="admin-card p-5 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                Utilisateurs Inscrits
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <p className="text-2xl font-extrabold text-zinc-100 tracking-tight">{stats.totalUsers}</p>
              <span className="text-[11px] text-emerald-400 font-medium">
                {stats.verifiedUsers} vérifiés ({stats.totalUsers > 0 ? Math.round((stats.verifiedUsers / stats.totalUsers) * 100) : 0}%)
              </span>
            </div>
          </div>

          {/* Card 2: Merchants */}
          <div className="admin-card p-5 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                Marchands Actifs
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                <Store className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <p className="text-2xl font-extrabold text-zinc-100 tracking-tight">{stats.merchantsCount}</p>
              <span className="text-[11px] text-zinc-400 font-medium">
                {stats.totalShops} boutique{stats.totalShops > 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Card 3: Super Admins */}
          <div className="admin-card p-5 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                Super Admins
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <p className="text-2xl font-extrabold text-zinc-100 tracking-tight">{stats.superAdminsCount}</p>
              <span className="text-[11px] text-purple-400 font-medium">Accès Root</span>
            </div>
          </div>

          {/* Card 4: Total Revenue */}
          <div className="admin-card p-5 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                Volume Total Ventes
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <p className="text-xl font-extrabold text-zinc-100 tracking-tight truncate">
                {formatPrice(stats.totalRevenue)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="admin-card p-4 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par email, nom, boutique..."
            className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl pl-9 pr-8 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "all", label: "Tous", count: users.length },
            { id: "merchants", label: "Marchands", count: users.filter((u) => u.total_shops > 0).length },
            { id: "admins", label: "Super Admins", count: users.filter((u) => u.is_super_admin).length },
            { id: "no-shop", label: "Sans boutique", count: users.filter((u) => u.total_shops === 0).length },
            { id: "verified", label: "Vérifiés", count: users.filter((u) => u.emailVerified).length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                filter === tab.id
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border border-transparent"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  filter === tab.id ? "bg-emerald-500/30 text-emerald-200 font-bold" : "bg-zinc-800 text-zinc-500"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Sort dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="recent">Plus récents</option>
            <option value="oldest">Plus anciens</option>
            <option value="revenue">Revenu le plus élevé</option>
            <option value="orders">Plus de commandes</option>
            <option value="shops">Plus de boutiques</option>
          </select>
        </div>
      </div>

      {/* Main Users Table */}
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800/80 bg-zinc-950/40 text-zinc-500 uppercase tracking-wider text-[10px] font-semibold">
                <th className="py-3 px-4">Utilisateur</th>
                <th className="py-3 px-4">Boutiques Détenues</th>
                <th className="py-3 px-4 text-center">Produits</th>
                <th className="py-3 px-4 text-center">Commandes</th>
                <th className="py-3 px-4 text-right">Chiffre d&apos;Affaires</th>
                <th className="py-3 px-4 text-center">Dernière Activité</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40">
              {filteredUsers.map((user) => {
                const initials = (user.displayName || user.email || "U")
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <tr
                    key={user.id}
                    className="hover:bg-zinc-900/40 transition-colors group cursor-pointer"
                    onClick={() => setSelectedUser(user)}
                  >
                    {/* User Identity */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {user.avatarUrl ? (
                          <img
                            src={user.avatarUrl}
                            alt={user.displayName}
                            className="w-9 h-9 rounded-full object-cover border border-zinc-800 shadow-sm shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/60 flex items-center justify-center font-bold text-xs text-emerald-400 shrink-0">
                            {initials}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-zinc-100 truncate">{user.displayName}</span>
                            {user.is_super_admin && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                <ShieldCheck className="w-2.5 h-2.5" />
                                ROOT
                              </span>
                            )}
                            {user.disabled && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-500/15 text-red-400 border border-red-500/30">
                                DÉSACTIVÉ
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5 text-zinc-500">
                            <span className="truncate text-[11px] text-zinc-400">{user.email}</span>
                            {user.emailVerified ? (
                              <span title="Email vérifié" className="text-emerald-400 shrink-0">
                                <CheckCircle2 className="w-3 h-3" />
                              </span>
                            ) : (
                              <span title="Email non vérifié" className="text-amber-500 shrink-0">
                                <XCircle className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Shops */}
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      {user.shops.length === 0 ? (
                        <span className="text-zinc-600 italic text-[11px]">Aucune boutique</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                          {user.shops.slice(0, 3).map((shop) => (
                            <Link
                              key={shop.id}
                              href={`/boutiques/${shop.shop_slug}`}
                              target="_blank"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 text-[11px] text-zinc-300 hover:text-emerald-400 transition-colors"
                              title={`Ouvrir la vitrine ${shop.shop_name} (${shop.shop_slug})`}
                            >
                              <Store className="w-2.5 h-2.5 text-zinc-500" />
                              <span className="font-medium truncate max-w-[100px]">
                                {shop.shop_name || shop.shop_slug}
                              </span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                            </Link>
                          ))}
                          {user.shops.length > 3 && (
                            <span
                              onClick={() => setSelectedUser(user)}
                              className="text-[10px] text-zinc-500 hover:text-zinc-300 font-medium px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 cursor-pointer"
                            >
                              +{user.shops.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Products count */}
                    <td className="py-3 px-4 text-center font-medium text-zinc-300">
                      {user.total_products > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800">
                          {user.total_products}
                        </span>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>

                    {/* Orders count */}
                    <td className="py-3 px-4 text-center font-medium text-zinc-300">
                      {user.total_orders > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20 font-bold">
                          {user.total_orders}
                        </span>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>

                    {/* Total revenue */}
                    <td className="py-3 px-4 text-right font-semibold text-zinc-100 tabular-nums">
                      {user.total_revenue > 0 ? (
                        <span className="text-emerald-400">{formatPrice(user.total_revenue)}</span>
                      ) : (
                        <span className="text-zinc-600">0 XOF</span>
                      )}
                    </td>

                    {/* Last active / created */}
                    <td className="py-3 px-4 text-center">
                      <div className="text-[11px] text-zinc-400">{formatRelativeTime(user.lastSeen)}</div>
                      <div className="text-[10px] text-zinc-600">Inscrit {formatDate(user.createdAt)}</div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
                          title="Voir le dossier complet"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleToggleSuperAdmin(user)}
                          disabled={actionLoading === user.id}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            user.is_super_admin
                              ? "bg-purple-500/15 border-purple-500/30 text-purple-300 hover:bg-purple-500/25"
                              : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-purple-400 hover:border-purple-500/30"
                          }`}
                          title={user.is_super_admin ? "Rétrograder (retirer Super Admin)" : "Promouvoir Super Admin"}
                        >
                          <Shield className="w-3.5 h-3.5" />
                        </button>

                        <a
                          href={`mailto:${user.email}`}
                          className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-emerald-400 transition-colors"
                          title={`Contacter ${user.email}`}
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="py-16 text-center">
              <Users className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-zinc-400">Aucun utilisateur trouvé</p>
              <p className="text-xs text-zinc-600 mt-1">Modifiez vos critères de recherche ou de filtre.</p>
            </div>
          )}
        </div>
      </div>

      {/* User Details Slide-over Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/40">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-bold text-white text-base shadow-lg shadow-emerald-500/20">
                  {selectedUser.avatarUrl ? (
                    <img
                      src={selectedUser.avatarUrl}
                      alt={selectedUser.displayName}
                      className="w-full h-full rounded-xl object-cover"
                    />
                  ) : (
                    (selectedUser.displayName || selectedUser.email).charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-zinc-100">{selectedUser.displayName}</h2>
                    {selectedUser.is_super_admin && (
                      <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        SUPER ADMIN
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-zinc-400 font-mono">{selectedUser.email}</span>
                    <button
                      onClick={() => handleCopy(selectedUser.email, "email")}
                      className="text-zinc-500 hover:text-zinc-200 transition-colors"
                      title="Copier l'email"
                    >
                      {copiedId === "email" ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                className="w-8 h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Overview Metrics Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/60">
                  <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Boutiques</span>
                  <p className="text-xl font-bold text-zinc-100 mt-1">{selectedUser.total_shops}</p>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/60">
                  <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Commandes</span>
                  <p className="text-xl font-bold text-blue-400 mt-1">{selectedUser.total_orders}</p>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/60">
                  <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Chiffre d&apos;Affaires</span>
                  <p className="text-lg font-bold text-emerald-400 mt-1">{formatPrice(selectedUser.total_revenue)}</p>
                </div>
              </div>

              {/* Account Details Box */}
              <div className="p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/60 space-y-2.5">
                <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Informations Système</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-zinc-400">
                  <div>
                    <span className="text-zinc-600 block text-[10px]">Identifiant Unique (UUID)</span>
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-300">
                      <span className="truncate max-w-[200px]">{selectedUser.id}</span>
                      <button
                        onClick={() => handleCopy(selectedUser.id, "uuid")}
                        className="text-zinc-500 hover:text-zinc-200"
                        title="Copier l'UUID"
                      >
                        {copiedId === "uuid" ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <span className="text-zinc-600 block text-[10px]">Rôle Authentification</span>
                    <span className="font-medium text-zinc-300 capitalize">{selectedUser.defaultRole}</span>
                  </div>
                  <div>
                    <span className="text-zinc-600 block text-[10px]">Date d&apos;inscription</span>
                    <span className="font-medium text-zinc-300">
                      {new Date(selectedUser.createdAt).toLocaleString("fr-FR")}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-600 block text-[10px]">Dernière activité enregistrée</span>
                    <span className="font-medium text-zinc-300">
                      {selectedUser.lastSeen
                        ? new Date(selectedUser.lastSeen).toLocaleString("fr-FR")
                        : "Aucune trace récente"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Shops Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-emerald-400" />
                    Boutiques associées ({selectedUser.shops.length})
                  </h3>
                </div>

                {selectedUser.shops.length === 0 ? (
                  <p className="text-zinc-600 italic py-4 text-center">
                    Cet utilisateur n&apos;a pas encore créé de boutique.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {selectedUser.shops.map((shop) => (
                      <div
                        key={shop.id}
                        className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-zinc-200 text-sm">
                              {shop.shop_name || shop.shop_slug}
                            </span>
                            <span className="font-mono text-[10px] text-zinc-500 px-1.5 py-0.2 rounded bg-zinc-800">
                              /{shop.shop_slug}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-zinc-400">
                            <span>{shop.products_count} produit{shop.products_count > 1 ? "s" : ""}</span>
                            <span>·</span>
                            <span>{shop.orders_count} commande{shop.orders_count > 1 ? "s" : ""}</span>
                            <span>·</span>
                            <span className="font-semibold text-emerald-400">{formatPrice(shop.revenue)}</span>
                          </div>

                          {/* Integrations indicators */}
                          <div className="flex items-center gap-2 mt-2">
                            <span
                              className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                                shop.whatsapp_enabled
                                  ? "bg-emerald-500/15 text-emerald-300"
                                  : "bg-zinc-800 text-zinc-500"
                              }`}
                            >
                              WhatsApp: {shop.whatsapp_enabled ? "Actif" : "Inactif"}
                            </span>
                            <span
                              className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                                shop.pixel_id
                                  ? "bg-blue-500/15 text-blue-300"
                                  : "bg-zinc-800 text-zinc-500"
                              }`}
                            >
                              Pixel: {shop.pixel_id ? "Configuré" : "Non"}
                            </span>
                            <span
                              className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
                                shop.google_sheet_url
                                  ? "bg-purple-500/15 text-purple-300"
                                  : "bg-zinc-800 text-zinc-500"
                              }`}
                            >
                              Sheets: {shop.google_sheet_url ? "Lié" : "Non"}
                            </span>
                          </div>
                        </div>

                        {/* Shop Access Buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          <Link
                            href={`/boutiques/${shop.shop_slug}`}
                            target="_blank"
                            className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
                          >
                            <span>Vitrine</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                          <Link
                            href={`/boutiques/${shop.shop_slug}/admin`}
                            target="_blank"
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors"
                          >
                            <span>Admin Boutique</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer with Actions */}
            <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/60 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleSuperAdmin(selectedUser)}
                  disabled={actionLoading === selectedUser.id}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    selectedUser.is_super_admin
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30"
                      : "bg-zinc-800 text-zinc-300 hover:bg-purple-500/20 hover:text-purple-300 border border-zinc-700"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>
                    {selectedUser.is_super_admin ? "Retirer statut Super Admin" : "Accorder statut Super Admin"}
                  </span>
                </button>

                <button
                  onClick={() => handleToggleDisabled(selectedUser)}
                  disabled={actionLoading === selectedUser.id}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    selectedUser.disabled
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20"
                  }`}
                >
                  {selectedUser.disabled ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span>{selectedUser.disabled ? "Réactiver le compte" : "Suspendre le compte"}</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
