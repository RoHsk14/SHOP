"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Store, ShoppingCart, Package, Settings, LogOut, Menu, X, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checking, setChecking] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [fullUserEmail, setFullUserEmail] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [firstShopSlug, setFirstShopSlug] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return;
      if (!session) {
        window.location.replace(`${window.location.origin}/login`);
        return;
      }
      setUserEmail(session.user.email?.split("@")[0] || "Admin");
      setFullUserEmail(session.user.email || "");

      const { data: settings, error } = await supabase
        .from("settings")
        .select("is_super_admin")
        .eq("user_id", session.user.id)
        .eq("is_super_admin", true)
        .maybeSingle();

      if (error) {
        console.error("[SuperAdmin] RLS error:", error);
      }

      if (!settings) {
        window.location.replace(`${window.location.origin}/login`);
        return;
      }

      // Fetch first shop to provide link back to normal admin
      const { data: allSettings } = await supabase
        .from("settings")
        .select("shop_slug")
        .eq("user_id", session.user.id)
        .not("shop_slug", "is", null)
        .limit(1);

      if (allSettings && allSettings.length > 0) {
        setFirstShopSlug(allSettings[0].shop_slug);
      }

      setIsSuperAdmin(true);
      setChecking(false);
    }).catch((err) => {
      console.error("[SuperAdmin] Unexpected error:", err);
      if (!cancelled) {
        window.location.replace(`${window.location.origin}/login`);
      }
    });

    return () => { cancelled = true; };
  }, []);

  const handleLogout = async () => {
    if (!confirm("Voulez-vous vraiment vous déconnecter ?")) return;
    await supabase.auth.signOut();
    router.push("/");
  };

  if (pathname === "/admin/login") return <>{children}</>;

  if (checking) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-800 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const menuItems = [
    { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
    { href: "/admin/shops", label: "Boutiques", icon: Store },
    { href: "/admin/orders", label: "Commandes", icon: ShoppingCart },
    { href: "/admin/products", label: "Produits", icon: Package },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div data-admin-theme="dark" className="min-h-screen bg-zinc-950 flex">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-3 left-3 z-50 lg:hidden w-9 h-9 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-all"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <aside className={`
        fixed inset-y-0 left-0 z-40
        w-[260px] bg-zinc-950 border-r border-zinc-800/60 flex flex-col h-screen
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="p-5 border-b border-zinc-800/60">
          <Link href="/admin" className="flex items-center gap-3"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="w-8 h-8 flex-shrink-0 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white">
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M3 10h18" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 5v14" stroke="currentColor" strokeWidth="2" opacity="0.5"/>
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-zinc-100 tracking-tight">Super Admin</h1>
              <p className="text-[10px] text-zinc-600 font-medium">ShopEazy</p>
            </div>
          </Link>
        </div>

        {/* User */}
        <div className="mx-3 mt-4 p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-semibold text-xs shadow-md shadow-emerald-500/20">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-300 truncate">{userEmail}</p>
              <p className="text-[10px] text-emerald-400/80 font-medium">Super Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest px-3 mb-3">
            Administration
          </p>
          {menuItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
                  active
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
                }`}
              >
                <div className={`p-1.5 rounded-md transition-all duration-200 ${
                  active
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-zinc-900 text-zinc-600 group-hover:bg-zinc-800 group-hover:text-zinc-400"
                }`}>
                  <item.icon className="w-3.5 h-3.5" />
                </div>
                <span className="font-medium text-[13px]">{item.label}</span>
                {active && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-zinc-800/60 space-y-1">
          {firstShopSlug && (
            <Link
              href={`/boutiques/${firstShopSlug}/admin`}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 transition-all duration-200 group border border-transparent hover:border-zinc-800/60"
            >
              <div className="p-1.5 rounded-md bg-zinc-900 text-zinc-500 group-hover:bg-zinc-800 group-hover:text-zinc-300 transition-all duration-200">
                <Store className="w-3.5 h-3.5" />
              </div>
              <span className="font-medium text-[13px]">Mode Admin</span>
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-600 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 group border border-transparent"
          >
            <div className="p-1.5 rounded-md bg-zinc-900 text-zinc-600 group-hover:bg-red-500/10 group-hover:text-red-400 transition-all duration-200">
              <LogOut className="w-3.5 h-3.5" />
            </div>
            <span className="font-medium text-[13px]">Déconnexion</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="flex-1 min-h-screen lg:ml-[260px] flex flex-col">
        <header className="h-14 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-2 ml-12 lg:ml-0">
            <Link href="/" className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">Accueil</Link>
            <ChevronRight className="w-3 h-3 text-zinc-700" />
            <span className="text-xs font-medium text-zinc-300">Super Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/50 border border-zinc-800/40">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-glow-pulse" />
              <span className="text-[11px] text-zinc-500 font-medium">{fullUserEmail || userEmail}</span>
            </div>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-semibold text-[10px] shadow-md shadow-emerald-500/20">
              {userEmail.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto flex-1 w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
