"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Store, ShoppingCart, Package, TrendingUp, Search } from "lucide-react";

export default function SuperAdminShops() {
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [topShop, setTopShop] = useState<{ shop_slug: string; revenue: number } | null>(null);
  const [topProduct, setTopProduct] = useState<{ name: string; shop_slug: string; count: number } | null>(null);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        console.log("[Shops] Fetching all data...");

        const { data: allOrders } = await supabase
          .from("orders")
          .select("total_price, shop_slug, product_id");

        const { data: allProducts } = await supabase
          .from("products")
          .select("id, name, shop_slug");

        // Compute top product from raw orders
        const productOrders = new Map<string, { count: number; name: string; shop_slug: string }>();
        (allOrders || []).forEach(o => {
          if (o.product_id) {
            const p = productOrders.get(o.product_id) || { count: 0, name: "", shop_slug: "" };
            p.count++;
            productOrders.set(o.product_id, p);
          }
        });
        (allProducts || []).forEach(p => {
          const existing = productOrders.get(p.id);
          if (existing) {
            existing.name = p.name;
            existing.shop_slug = p.shop_slug;
          }
        });
        let topProductData = { name: "", shop_slug: "", count: 0 };
        productOrders.forEach((v) => {
          if (v.count > topProductData.count) topProductData = v;
        });
        setTopProduct(topProductData.name ? topProductData : null);

        // Try RPC for shops + topShop
        const { data, error } = await supabase.rpc("get_admin_shops");
        if (error) {
          console.error("[Shops] RPC error, falling back to direct query:", error);
        }

        if (data) {
          console.log("[Shops] RPC returned", data.length, "shops");
          // Compute topShop from RPC result
          let top = { shop_slug: "", revenue: 0 };
          (data as any[]).forEach((s: any) => {
            if ((s.revenue || 0) > top.revenue) top = { shop_slug: s.shop_slug, revenue: s.revenue || 0 };
          });
          setTopShop(top.shop_slug ? top : null);
          setShops(data as any[]);
          setLoading(false);
          return;
        }

        const { data: settingsData, error: settingsError } = await supabase
          .from("settings")
          .select("*");

        console.log("[Shops] Settings:", settingsData?.length, "rows", settingsError);
        if (settingsError) console.error("[Shops] Settings error:", settingsError);

        if (!settingsData || settingsData.length === 0) { setLoading(false); return; }

        const ordersByShop = new Map<string, { count: number; revenue: number }>();

        (allOrders || []).forEach(o => {
          const s = ordersByShop.get(o.shop_slug) || { count: 0, revenue: 0 };
          s.count++;
          s.revenue += o.total_price || 0;
          ordersByShop.set(o.shop_slug, s);
        });

        let topShopData = { shop_slug: "", revenue: 0 };
        ordersByShop.forEach((v, k) => {
          if (v.revenue > topShopData.revenue) topShopData = { shop_slug: k, revenue: v.revenue };
        });
        setTopShop(topShopData.shop_slug ? topShopData : null);

        const productsByShop = new Map<string, number>();
        (allProducts || []).forEach(p => {
          productsByShop.set(p.shop_slug, (productsByShop.get(p.shop_slug) || 0) + 1);
        });

        setShops(settingsData.map(shop => ({
          ...shop,
          orders_count: ordersByShop.get(shop.shop_slug)?.count || 0,
          revenue: ordersByShop.get(shop.shop_slug)?.revenue || 0,
          products_count: productsByShop.get(shop.shop_slug) || 0,
        })));
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
      <div className="w-8 h-8 border-2 border-zinc-800 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Boutiques</h1>
        <p className="text-sm text-zinc-500 mt-1">{shops.length} boutique{shops.length > 1 ? "s" : ""}</p>
      </div>

      {/* Comparaison */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 admin-stagger">
        <div className="admin-card admin-glow p-6 relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Boutique avec le plus de ventes</span>
            </div>
            {topShop ? (
              <>
                <p className="text-xl font-bold text-zinc-100 tracking-tight">{topShop.shop_slug}</p>
                <p className="text-sm text-emerald-400 font-semibold mt-1 tabular-nums">{formatPrice(topShop.revenue)}</p>
              </>
            ) : (
              <p className="text-sm text-zinc-600 mt-2">Aucune vente</p>
            )}
          </div>
        </div>
        <div className="admin-card admin-glow p-6 relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Produit le plus commandé</span>
            </div>
            {topProduct ? (
              <>
                <p className="text-xl font-bold text-zinc-100 tracking-tight truncate">{topProduct.name}</p>
                <p className="text-sm text-zinc-500 mt-1">
                  <span className="text-zinc-300 font-medium">{topProduct.count}</span> commande{topProduct.count > 1 ? "s" : ""} · {topProduct.shop_slug}
                </p>
              </>
            ) : (
              <p className="text-sm text-zinc-600 mt-2">Aucune commande</p>
            )}
          </div>
        </div>
      </div>

      {/* Recherche */}
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
          placeholder="Rechercher une boutique..."
        />
      </div>

      {/* Tableau */}
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800/60">
                <th className="text-left px-5 py-3.5 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Boutique</th>
                <th className="text-left px-5 py-3.5 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Propriétaire</th>
                <th className="text-center px-5 py-3.5 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Produits</th>
                <th className="text-center px-5 py-3.5 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Commandes</th>
                <th className="text-right px-5 py-3.5 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">Revenu</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((shop) => (
                <tr key={shop.id} className="border-b border-zinc-800/30 last:border-0 hover:bg-zinc-800/40 transition-colors duration-150">
                  <td className="px-5 py-3.5">
                    <p className="text-sm font-medium text-zinc-200">{shop.shop_name || shop.shop_slug}</p>
                    <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{shop.shop_slug}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-sm text-zinc-400">{shop.owner_name || "—"}</p>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="text-sm font-medium text-zinc-300">{shop.products_count}</span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="text-sm font-medium text-zinc-300">{shop.orders_count}</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="text-sm font-semibold text-zinc-100 tabular-nums">{formatPrice(shop.revenue)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="text-sm text-zinc-600 text-center py-14">Aucune boutique trouvée</p>
        )}
      </div>
    </div>
  );
}
