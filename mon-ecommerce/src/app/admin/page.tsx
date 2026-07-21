"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Store, ShoppingCart, Package, TrendingUp, ChevronRight } from "lucide-react";

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({
    shops: 0,
    orders: 0,
    products: 0,
    revenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsRes, ordersRes, productsRes] = await Promise.all([
          supabase.from("settings").select("id", { count: "exact", head: true }),
          supabase.from("orders").select("total_price", { count: "exact" }),
          supabase.from("products").select("id", { count: "exact", head: true }),
        ]);

        const revenue = (ordersRes.data || []).reduce((sum: number, o: any) => sum + (o.total_price || 0), 0);

        setStats({
          shops: settingsRes.count || 0,
          orders: ordersRes.count || 0,
          products: productsRes.count || 0,
          revenue,
        });

        const { data: recent } = await supabase
          .from("orders")
          .select("id, total_price, customer_name, shop_slug, created_at")
          .order("created_at", { ascending: false })
          .limit(5);

        setRecentOrders(recent || []);
      } catch (e) {
        console.error("Error fetching admin stats:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatPrice = (val: number) =>
    new Intl.NumberFormat("fr-FR", { style: "decimal", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val) + " XOF";

  const cards = [
    { label: "Boutiques", value: stats.shops.toString(), icon: Store, color: "bg-emerald-500" },
    { label: "Commandes", value: stats.orders.toString(), icon: ShoppingCart, color: "bg-blue-500" },
    { label: "Produits", value: stats.products.toString(), icon: Package, color: "bg-purple-500" },
    { label: "Revenu total", value: formatPrice(stats.revenue), icon: TrendingUp, color: "bg-amber-500" },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-zinc-800 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Tableau de bord</h1>
        <p className="text-sm text-zinc-500 mt-1">Vue d&apos;ensemble de toutes les boutiques</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 admin-stagger">
        {cards.map((card) => (
          <div key={card.label} className="admin-card admin-glow p-6 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">{card.label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  card.color === "bg-emerald-500" ? "bg-emerald-500/10 text-emerald-400" :
                  card.color === "bg-blue-500" ? "bg-blue-500/10 text-blue-400" :
                  card.color === "bg-purple-500" ? "bg-purple-500/10 text-purple-400" :
                  "bg-amber-500/10 text-amber-400"
                }`}>
                  <card.icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-zinc-100 tracking-tight">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="admin-card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-zinc-200">Dernières commandes</h2>
          <Link href="/admin/orders" className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 transition-colors">
            Voir tout <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-zinc-600 text-center py-10">Aucune commande pour le moment</p>
        ) : (
          <div className="space-y-1">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between py-3 px-3 -mx-3 rounded-lg hover:bg-zinc-800/50 transition-colors duration-200">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-200 truncate">{order.customer_name}</p>
                  <p className="text-xs text-zinc-600 mt-0.5">
                    Boutique: <span className="text-zinc-500 font-medium">{order.shop_slug}</span>
                    {" · "}{new Date(order.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <span className="text-sm font-semibold text-zinc-100 tabular-nums">{formatPrice(order.total_price)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
