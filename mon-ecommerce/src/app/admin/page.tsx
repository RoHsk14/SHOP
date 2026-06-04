"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Store, ShoppingCart, Package, TrendingUp, DollarSign, ChevronRight } from "lucide-react";

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
        const [shopsRes, ordersRes, productsRes] = await Promise.all([
          supabase.from("settings").select("id", { count: "exact", head: true }),
          supabase.from("orders").select("id, total_price, customer_name, product_id, created_at, shop_slug", { count: "exact" }).order("created_at", { ascending: false }).limit(10),
          supabase.from("products").select("id", { count: "exact", head: true }).eq("shop_slug", ""),
        ]);

        const { data: allProducts, count: productCount } = await supabase
          .from("products")
          .select("id", { count: "exact", head: true });

        const { data: ordersData, count: orderCount } = await supabase
          .from("orders")
          .select("total_price")
          .order("created_at", { ascending: false });

        const revenue = (ordersData || []).reduce((sum, o) => sum + (o.total_price || 0), 0);

        setStats({
          shops: shopsRes.count || 0,
          orders: orderCount || 0,
          products: productCount || 0,
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
      <div className="w-8 h-8 border-2 border-gray-200 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-sm text-gray-500 mt-1">Vue d'ensemble de toutes les boutiques</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{card.label}</span>
              <div className={`w-9 h-9 rounded-lg ${card.color} bg-opacity-10 flex items-center justify-center`}>
                <card.icon className={`w-4.5 h-4.5 text-white`} style={{ opacity: 0.8 }} />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-900">Dernières commandes</h2>
          <Link href="/admin/orders" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1">
            Voir tout <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Aucune commande pour le moment</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{order.customer_name}</p>
                  <p className="text-xs text-gray-400">
                    Boutique: <span className="font-medium">{order.shop_slug}</span>
                    {" · "}{new Date(order.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <span className="text-sm font-bold text-gray-900">{formatPrice(order.total_price)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
