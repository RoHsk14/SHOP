"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Search } from "lucide-react";

export default function SuperAdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await supabase
          .from("orders")
          .select("id, customer_name, customer_phone, total_price, currency, shop_slug, created_at, product_id")
          .order("created_at", { ascending: false })
          .limit(100);

        if (data) {
          const productIds = [...new Set(data.map(o => o.product_id).filter(Boolean))];
          const { data: products } = productIds.length > 0
            ? await supabase.from("products").select("id, name").in("id", productIds)
            : { data: [] };
          const productMap = new Map((products || []).map(p => [p.id, p.name]));

          setOrders(data.map(o => ({ ...o, product_name: productMap.get(o.product_id) || "—" })));
        }
      } catch (e) {
        console.error("Error fetching orders:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filtered = orders.filter(o =>
    o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    o.shop_slug?.toLowerCase().includes(search.toLowerCase()) ||
    o.customer_phone?.includes(search)
  );

  const formatPrice = (val: number) =>
    new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0 }).format(val) + " XOF";

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-zinc-800 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Commandes</h1>
          <p className="text-sm text-zinc-500 mt-1">{orders.length} commande{orders.length > 1 ? "s" : ""}</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
            placeholder="Rechercher..."
          />
        </div>
      </div>

      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800/60">
                <th className="text-left px-5 py-3.5 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Client</th>
                <th className="text-left px-5 py-3.5 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Boutique</th>
                <th className="text-left px-5 py-3.5 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Produit</th>
                <th className="text-right px-5 py-3.5 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Total</th>
                <th className="text-right px-5 py-3.5 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id} className="border-b border-zinc-800/30 last:border-0 hover:bg-zinc-800/40 transition-colors duration-150">
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-zinc-200">{order.customer_name}</p>
                    {order.customer_phone && (
                      <p className="text-[10px] text-zinc-600 mt-0.5">{order.customer_phone}</p>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm text-zinc-400">{order.shop_slug}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-sm text-zinc-500 truncate max-w-[200px] inline-block">{order.product_name}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="text-sm font-semibold text-zinc-100 tabular-nums">{formatPrice(order.total_price)}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="text-xs text-zinc-600">{new Date(order.created_at).toLocaleDateString("fr-FR")}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="text-sm text-zinc-600 text-center py-14">Aucune commande trouvée</p>
        )}
      </div>
    </div>
  );
}
