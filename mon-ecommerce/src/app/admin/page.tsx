"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  Users,
  Store,
  ShoppingCart,
  Package,
  TrendingUp,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    verifiedUsers: 0,
    shops: 0,
    orders: 0,
    products: 0,
    revenue: 0,
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      let { data: { session } } = await supabase.auth.getSession();
      let token = session?.access_token || "";

      // Refresh if expiring
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

      // 1. Fetch users and stats from /api/admin/users
      const usersPromise = fetch("/api/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-user-email": session?.user?.email || "",
          "x-user-id": session?.user?.id || "",
        },
      })
        .then((r) => r.json())
        .catch(() => null);

      // 2. Fetch direct orders & products stats
      const [usersData, settingsRes, ordersRes, productsRes, recentOrdersRes] = await Promise.all([
        usersPromise,
        supabase.from("settings").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("total_price", { count: "exact" }),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase
          .from("orders")
          .select("id, total_price, customer_name, shop_slug, created_at")
          .order("created_at", { ascending: false })
          .limit(6),
      ]);

      const revenue = (ordersRes.data || []).reduce((sum: number, o: any) => sum + (o.total_price || 0), 0);

      const usersList = usersData?.users || [];
      const usersStats = usersData?.stats || {};

      setStats({
        users: usersStats.totalUsers ?? usersList.length,
        verifiedUsers: usersStats.verifiedUsers ?? usersList.filter((u: any) => u.emailVerified).length,
        shops: settingsRes.count || usersStats.totalShops || 0,
        orders: ordersRes.count || usersStats.totalOrders || 0,
        products: productsRes.count || usersStats.totalProducts || 0,
        revenue: usersStats.totalRevenue || revenue,
      });

      setRecentUsers(usersList.slice(0, 5));
      setRecentOrders(recentOrdersRes.data || []);
    } catch (e) {
      console.error("Error fetching admin stats:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const formatPrice = (val: number) =>
    new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val) + " XOF";

  const cards = [
    {
      label: "Utilisateurs",
      value: stats.users.toString(),
      subtext: `${stats.verifiedUsers} vérifiés`,
      icon: Users,
      href: "/admin/users",
      color: "bg-emerald-500",
      textColor: "text-emerald-400",
      borderColor: "hover:border-emerald-500/40",
    },
    {
      label: "Boutiques",
      value: stats.shops.toString(),
      subtext: "Boutiques créées",
      icon: Store,
      href: "/admin/shops",
      color: "bg-blue-500",
      textColor: "text-blue-400",
      borderColor: "hover:border-blue-500/40",
    },
    {
      label: "Commandes",
      value: stats.orders.toString(),
      subtext: "Toutes boutiques confondues",
      icon: ShoppingCart,
      href: "/admin/orders",
      color: "bg-purple-500",
      textColor: "text-purple-400",
      borderColor: "hover:border-purple-500/40",
    },
    {
      label: "Produits",
      value: stats.products.toString(),
      subtext: "Catalogues marchands",
      icon: Package,
      href: "/admin/products",
      color: "bg-teal-500",
      textColor: "text-teal-400",
      borderColor: "hover:border-teal-500/40",
    },
    {
      label: "Volume d'Affaires",
      value: formatPrice(stats.revenue),
      subtext: "Chiffre d'affaires total",
      icon: TrendingUp,
      href: "/admin/orders",
      color: "bg-amber-500",
      textColor: "text-amber-400",
      borderColor: "hover:border-amber-500/40",
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-3">
        <div className="w-9 h-9 border-2 border-zinc-800 border-t-emerald-500 rounded-full animate-spin" />
        <p className="text-xs text-zinc-500">Chargement de la console Super Admin...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Welcome & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-800/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Tableau de bord Super Admin</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              Live
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Supervision centrale : comptes marchands, boutiques, commandes et catalogue produit.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/users"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold transition-all shadow-md shadow-emerald-600/20"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Gérer les Utilisateurs</span>
          </Link>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-100 transition-all disabled:opacity-50"
            title="Rafraîchir les statistiques"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Stats KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={`admin-card p-5 relative overflow-hidden group transition-all ${card.borderColor}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider truncate">
                {card.label}
              </span>
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  card.color === "bg-emerald-500"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : card.color === "bg-blue-500"
                    ? "bg-blue-500/10 text-blue-400"
                    : card.color === "bg-purple-500"
                    ? "bg-purple-500/10 text-purple-400"
                    : card.color === "bg-teal-500"
                    ? "bg-teal-500/10 text-teal-400"
                    : "bg-amber-500/10 text-amber-400"
                }`}
              >
                <card.icon className="w-3.5 h-3.5" />
              </div>
            </div>

            <p className="text-xl sm:text-2xl font-extrabold text-zinc-100 tracking-tight truncate">
              {card.value}
            </p>

            <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-500">
              <span className="truncate">{card.subtext}</span>
              <ChevronRight className="w-3 h-3 text-zinc-600 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all" />
            </div>
          </Link>
        ))}
      </div>

      {/* Two-Column Split: Recent Users & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Recent Users */}
        <div className="admin-card p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800/60">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Users className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-zinc-200">Derniers Utilisateurs Inscrits</h2>
            </div>
            <Link
              href="/admin/users"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors"
            >
              Voir tout <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentUsers.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-12">Aucun utilisateur enregistré</p>
          ) : (
            <div className="space-y-2 flex-1">
              {recentUsers.map((u) => {
                const initials = (u.displayName || u.email || "U")
                  .split(" ")
                  .map((w: string) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <Link
                    key={u.id}
                    href="/admin/users"
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-900/60 transition-colors border border-transparent hover:border-zinc-800/80 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {u.avatarUrl ? (
                        <img
                          src={u.avatarUrl}
                          alt={u.displayName}
                          className="w-8 h-8 rounded-full object-cover border border-zinc-800 shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0">
                          {initials}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-zinc-200 truncate group-hover:text-emerald-300 transition-colors">
                            {u.displayName || u.email}
                          </p>
                          {u.is_super_admin && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                              ADMIN
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-500 truncate mt-0.5">{u.email}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-3">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800">
                        {u.total_shops} boutique{u.total_shops > 1 ? "s" : ""}
                      </span>
                      <p className="text-[10px] text-zinc-600 mt-1">
                        {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-zinc-800/60">
            <Link
              href="/admin/users"
              className="w-full py-2 px-3 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 hover:text-white font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <span>Accéder à l&apos;annuaire complet des utilisateurs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right Column: Recent Orders */}
        <div className="admin-card p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800/60">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-blue-500/10 text-blue-400">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-zinc-200">Dernières Commandes</h2>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors"
            >
              Voir tout <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-12">Aucune commande pour le moment</p>
          ) : (
            <div className="space-y-2 flex-1">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-zinc-900/60 transition-colors border border-transparent hover:border-zinc-800/80"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-200 truncate">{order.customer_name}</p>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Boutique :{" "}
                      <span className="text-zinc-400 font-medium font-mono">/{order.shop_slug}</span>
                      {" · "}
                      <span className="text-zinc-600">
                        {new Date(order.created_at).toLocaleDateString("fr-FR")}
                      </span>
                    </p>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 tabular-nums ml-3 shrink-0">
                    {formatPrice(order.total_price)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-zinc-800/60">
            <Link
              href="/admin/orders"
              className="w-full py-2 px-3 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 hover:text-white font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <span>Consulter toutes les commandes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
