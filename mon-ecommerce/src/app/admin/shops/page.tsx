"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Store, ShoppingCart, Package, ExternalLink, Search, ChevronRight } from "lucide-react";

export default function SuperAdminShops() {
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const { data } = await supabase
          .from("settings")
          .select("id, shop_slug, shop_name, owner_name, shop_country, user_id, created_at")
          .order("created_at", { ascending: false });

        if (data) {
          const shopsWithStats = await Promise.all(
            data.map(async (shop) => {
              const [ordersRes, productsRes] = await Promise.all([
                supabase.from("orders").select("total_price").eq("shop_slug", shop.shop_slug),
                supabase.from("products").select("id", { count: "exact", head: true }).eq("shop_slug", shop.shop_slug),
              ]);
              return {
                ...shop,
                orders_count: ordersRes.data?.length || 0,
                revenue: (ordersRes.data || []).reduce((s, o) => s + (o.total_price || 0), 0),
                products_count: productsRes.count || 0,
              };
            })
          );
          setShops(shopsWithStats);
        }
      } catch (e) {
        console.error("Error fetching shops:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchShops();
  }, []);

  const filtered = shops.filter(s =>
    s.shop_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.shop_slug?.toLowerCase().includes(search.toLowerCase()) ||
    s.owner_name?.toLowerCase().includes(search.toLowerCase())
  );

  const formatPrice = (val: number) =>
    new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0 }).format(val) + " XOF";

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-gray-200 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Boutiques</h1>
          <p className="text-sm text-gray-500 mt-1">{shops.length} boutique{shops.length > 1 ? "s" : ""}</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Rechercher une boutique..."
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Boutique</th>
                <th className="text-left px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Propriétaire</th>
                <th className="text-center px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Produits</th>
                <th className="text-center px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Commandes</th>
                <th className="text-right px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Revenu</th>
                <th className="text-right px-4 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((shop) => (
                <tr key={shop.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{shop.shop_name || shop.shop_slug}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{shop.shop_slug}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-700">{shop.owner_name || "—"}</p>
                    <p className="text-[10px] text-gray-400">{shop.shop_country || ""}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-semibold text-gray-900">{shop.products_count}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm font-semibold text-gray-900">{shop.orders_count}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-bold text-gray-900">{formatPrice(shop.revenue)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/boutiques/${shop.shop_slug}/admin`}
                        className="p-1.5 hover:bg-emerald-50 rounded-lg text-gray-400 hover:text-emerald-600 transition-all"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-12">Aucune boutique trouvée</p>
        )}
      </div>
    </div>
  );
}
