"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart, Settings, LogOut, Menu, X, Store, Palette, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { generateUniqueShopSlug } from "@/lib/slug";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [shopSlug, setShopSlug] = useState<string | null>(null);
  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [userShops, setUserShops] = useState<{ shop_slug: string; shop_name: string }[]>([]);
  const [fullUserEmail, setFullUserEmail] = useState("");
  const [creatingShop, setCreatingShop] = useState(false);

  // Normaliser le pathname : /boutiques/{slug}/admin → /admin
  const barePath = pathname.replace(/^\/boutiques\/[^\/]+/, "") || "/";
  const slug = pathname.match(/^\/boutiques\/([^\/]+)/)?.[1] || "";
  const base = `/boutiques/${slug}`;

  useEffect(() => {
    let cancelled = false;
    const safetyTimeout = setTimeout(() => {
      if (!cancelled) {
        window.location.replace("http://localhost:3000/login");
        setChecking(false);
      }
    }, 10000);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      clearTimeout(safetyTimeout);
      if (cancelled) return;
      if (!session) {
        window.location.replace("http://localhost:3000/login");
        setChecking(false);
        return;
      }
      setUserEmail(session.user.email?.split("@")[0] || "Admin");
      setFullUserEmail(session.user.email || "");
      setShopSlug(slug);
      try {
        const { data: settings } = await supabase
          .from("settings")
          .select("id, shop_slug, user_id, shop_name, owner_name")
          .eq("shop_slug", slug)
          .maybeSingle();
        
        let currentUserId = session.user.id;
        if (!settings?.id) {
          await supabase.from("settings").insert([{ shop_slug: slug, user_id: currentUserId }]);
        } else if (!settings.user_id) {
          await supabase.from("settings").update({ user_id: currentUserId }).eq("id", settings.id);
        } else {
          setShopName(settings.shop_name || slug);
          setOwnerName(settings.owner_name || "");
          currentUserId = settings.user_id;
        }

        // Fetch all shops for this user
        const { data: shopsData } = await supabase
          .from("settings")
          .select("shop_slug, shop_name")
          .eq("user_id", currentUserId);
        if (shopsData) {
          setUserShops(shopsData);
        }
      } catch (e) {
        console.error("[AdminLayout] Erreur settings:", e);
      }
      setChecking(false);
    }).catch(() => {
      clearTimeout(safetyTimeout);
      if (!cancelled) {
        window.location.replace("http://localhost:3000/login");
        setChecking(false);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        window.location.replace("http://localhost:3000/login");
      }
      if (session?.user?.email) {
        setUserEmail(session.user.email.split("@")[0]);
        setFullUserEmail(session.user.email);
      }
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    if (!confirm("Voulez-vous vraiment vous déconnecter ?")) return;
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleCreateShop = async () => {
    try {
      setCreatingShop(true);
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) {
        window.location.replace("http://localhost:3000/login");
        return;
      }
      
      const newSlug = await generateUniqueShopSlug(supabase);
      
      const { error } = await supabase
        .from("settings")
        .insert([{ shop_slug: newSlug, user_id: userId }]);
        
      if (error) throw error;
      
      // Redirect to onboarding of the new boutique
      window.location.replace(`http://localhost:3000/boutiques/${newSlug}/onboarding`);
    } catch (e: any) {
      console.error("Error creating new shop:", e);
      alert("Erreur lors de la création de la boutique : " + e.message);
    } finally {
      setCreatingShop(false);
    }
  };

  if (barePath === "/admin/login") return <>{children}</>;

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-emerald-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const menuItems = [
    { href: `${base}/admin`, label: "Vue d'ensemble", icon: LayoutDashboard },
    { href: `${base}/admin/orders`, label: "Commandes", icon: ShoppingCart },
    { href: `${base}/admin/products`, label: "Produits", icon: Package },
    { href: `${base}/admin/customize`, label: "Personnaliser", icon: Palette },
  ];

  const secondaryItems = [
    { href: `${base}/admin/settings`, label: "Paramètres", icon: Settings },
  ];

  const isActive = (href: string) => barePath === href;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-3 left-3 z-50 lg:hidden w-9 h-9 bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-sm"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40
        w-64 bg-white border-r border-gray-200 flex flex-col h-screen
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* Logo */}
        <div className="p-5 border-b border-gray-100">
          <Link href="/admin" className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="w-9 h-9 flex-shrink-0 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white">
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M3 10h18" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 5v14" stroke="currentColor" strokeWidth="2" opacity="0.5"/>
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-gray-900 truncate">
                {shopName || slug}
              </h1>
              <p className="text-[10px] text-gray-400">ShopEazy</p>
            </div>
          </Link>
        </div>

        {/* User profile summary */}
        <div className="mx-4 mt-4 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">{userEmail}</p>
              <p className="text-[10px] text-emerald-600 font-medium truncate">{ownerName || "Propriétaire"}</p>
            </div>
            <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
            Principal
          </p>
          {menuItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                  active
                    ? "bg-emerald-50 text-emerald-700 shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <div className={`p-1.5 rounded-lg transition-all ${
                  active
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-gray-700"
                }`}>
                  <item.icon className="w-4 h-4" />
                </div>
                <span className="font-medium text-sm">{item.label}</span>
                {active && (
                  <div className="ml-auto w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  </div>
                )}
              </Link>
            );
          })}

          {shopSlug && (
            <a
              href={`http://${shopSlug}.localhost:3000`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"
            >
              <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200 group-hover:text-emerald-700 transition-all">
                <Store className="w-4 h-4" />
              </div>
              <span className="font-medium text-sm">Voir ma boutique</span>
              <span className="ml-auto text-[10px] text-emerald-500 font-medium bg-emerald-50 group-hover:bg-emerald-100 px-2 py-0.5 rounded-full">↗</span>
            </a>
          )}

          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2 mt-4">
            Configuration
          </p>
          {secondaryItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                  active
                    ? "bg-emerald-50 text-emerald-700 shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <div className={`p-1.5 rounded-lg transition-all ${
                  active
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-gray-700"
                }`}>
                  <item.icon className="w-4 h-4" />
                </div>
                <span className="font-medium text-sm">{item.label}</span>
                {active && (
                  <div className="ml-auto w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  </div>
                )}
              </Link>
            );
          })}

        </nav>

        {/* Footer sidebar */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all group"
          >
            <div className="p-1.5 rounded-lg bg-gray-100 text-gray-400 group-hover:bg-red-100 group-hover:text-red-600 transition-all">
              <LogOut className="w-4 h-4" />
            </div>
            <span className="font-medium text-sm">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 min-h-screen lg:ml-64 flex flex-col">
        {/* Top Header */}
        <header className="h-16 border-b border-gray-100 bg-white flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 relative">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-500 ml-12 lg:ml-0">
              Boutique active : <span className="font-semibold text-gray-900">{shopName || slug}</span>
            </span>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            {/* Profile Avatar Button */}
            <div className="relative">
              <button
                onClick={() => setProfileModalOpen(!profileModalOpen)}
                className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-sm hover:scale-105 active:scale-95 transition-all focus:outline-none"
              >
                {userEmail.charAt(0).toUpperCase()}
              </button>

              {/* Profile Dropdown Modal */}
              {profileModalOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40 bg-transparent" 
                    onClick={() => setProfileModalOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-5 z-50 animate-fade-in origin-top-right">
                    {/* Owner details */}
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                        {userEmail.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{ownerName || "Propriétaire"}</p>
                        <p className="text-xs text-gray-500 truncate">{fullUserEmail}</p>
                      </div>
                    </div>

                    {/* Shops listing */}
                    <div className="pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Mes boutiques</span>
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                          {userShops.length}
                        </span>
                      </div>
                      
                      <div className="max-h-48 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                        {userShops.map((shop) => {
                          const isCurrent = shop.shop_slug === slug;
                          return (
                            <Link
                              key={shop.shop_slug}
                              href={`/boutiques/${shop.shop_slug}/admin`}
                              onClick={() => setProfileModalOpen(false)}
                              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                                isCurrent
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-100/50"
                                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                              }`}
                            >
                              <span className="truncate">{shop.shop_name || shop.shop_slug}</span>
                              {isCurrent ? (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              ) : (
                                <span className="text-[10px] text-gray-400">Accéder ↗</span>
                              )}
                            </Link>
                          );
                        })}
                      </div>

                      {/* Create store button */}
                      <button
                        onClick={handleCreateShop}
                        disabled={creatingShop}
                        className="w-full mt-3 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:scale-100 focus:outline-none"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {creatingShop ? "Création..." : "Créer une boutique"}
                      </button>
                    </div>

                    {/* Quick actions */}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
                      <Link 
                        href={`/boutiques/${slug}/admin/settings`} 
                        onClick={() => setProfileModalOpen(false)}
                        className="text-gray-500 hover:text-gray-900 transition-colors font-medium"
                      >
                        Paramètres
                      </Link>
                      <button 
                        onClick={() => {
                          setProfileModalOpen(false);
                          handleLogout();
                        }}
                        className="text-red-500 hover:text-red-700 font-semibold transition-colors"
                      >
                        Déconnexion
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto flex-1 w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
