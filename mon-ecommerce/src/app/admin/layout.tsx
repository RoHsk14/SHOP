"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Store,
  ShoppingCart,
  Package,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import AdminPwaHead from "@/components/pwa/AdminPwaHead";

const SUPER_ADMIN_EMAILS = ["rodriguehessou14@gmail.com"];

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

      const email = (session.user.email || "").toLowerCase();
      setUserEmail(session.user.email?.split("@")[0] || "Admin");
      setFullUserEmail(session.user.email || "");

      const isKnownSuperAdmin = SUPER_ADMIN_EMAILS.includes(email);

      const { data: settings, error } = await supabase
        .from("settings")
        .select("id, is_super_admin")
        .eq("user_id", session.user.id)
        .eq("is_super_admin", true)
        .maybeSingle();

      if (error) {
        console.warn("[SuperAdmin] RLS check warning:", error);
      }

      // If user is recognized super admin email or has is_super_admin: true
      if (!settings && !isKnownSuperAdmin) {
        window.location.replace(`${window.location.origin}/login`);
        return;
      }

      // Fetch first shop to provide link back to normal boutique admin
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
      console.error("[SuperAdmin] Session error:", err);
      if (!cancelled) {
        window.location.replace(`${window.location.origin}/login`);
      }
    });

    return () => { cancelled = true; };
  }, []);

  const handleLogout = async () => {
    if (!confirm("Voulez-vous vraiment vous déconnecter du Super Admin ?")) return;
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (pathname === "/admin/login") return <>{children}</>;

  if (checking) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-3">
        <div className="relative flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-zinc-800 border-t-emerald-500 rounded-full animate-spin" />
          <div className="absolute inset-0 rounded-full bg-emerald-500/10 blur-sm animate-pulse" />
        </div>
        <p className="text-xs text-zinc-500 font-medium">Chargement de la console administrateur...</p>
      </div>
    );
  }

  const menuItems = [
    { href: "/admin", label: "Tableau de bord", icon: LayoutDashboard, badge: null },
    { href: "/admin/users", label: "Utilisateurs", icon: Users, badge: "Nouveau" },
    { href: "/admin/shops", label: "Boutiques", icon: Store, badge: null },
    { href: "/admin/orders", label: "Commandes", icon: ShoppingCart, badge: null },
    { href: "/admin/products", label: "Produits", icon: Package, badge: null },
  ];

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <>
      <AdminPwaHead />
      <div data-admin-theme="dark" className="min-h-screen bg-zinc-950 text-zinc-100 flex selection:bg-emerald-500/30 selection:text-emerald-200">
        {/* Mobile toggle button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Menu"
          className="fixed top-3 left-3 z-50 lg:hidden w-10 h-10 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-300 hover:text-white shadow-xl hover:border-zinc-700 transition-all"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Sidebar */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-40
            w-[270px] bg-zinc-950/95 backdrop-blur-xl border-r border-zinc-800/70 flex flex-col h-screen
            transform transition-all duration-300 ease-in-out
            ${sidebarOpen ? "translate-x-0 shadow-2xl shadow-black/80" : "-translate-x-full lg:translate-x-0"}
          `}
        >
          {/* Brand header */}
          <div className="p-5 border-b border-zinc-800/60">
            <Link
              href="/admin"
              className="flex items-center gap-3 group"
              onClick={() => setSidebarOpen(false)}
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 p-[1px] shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/30 transition-shadow">
                <div className="w-full h-full bg-zinc-950 rounded-[11px] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 group-hover:scale-105 transition-transform" />
                </div>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold text-zinc-100 tracking-tight">ShopEazy</h1>
                  <span className="text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    SUPER ADMIN
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 font-medium truncate">Plateforme & Multi-boutiques</p>
              </div>
            </Link>
          </div>

          {/* User profile card */}
          <div className="mx-3 mt-4 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/60 hover:border-zinc-700/60 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-emerald-500/20 shrink-0">
                {userEmail.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-semibold text-zinc-200 truncate">{userEmail}</p>
                </div>
                <p className="text-[10px] text-emerald-400 font-medium truncate flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Accès Total Root
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-5 space-y-1.5 overflow-y-auto">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Menu Principal
              </span>
            </div>

            {menuItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 group relative ${
                    active
                      ? "bg-emerald-500/10 text-emerald-300 font-medium border border-emerald-500/20 shadow-sm shadow-emerald-500/5"
                      : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-1.5 rounded-lg transition-all duration-200 ${
                        active
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-zinc-900 text-zinc-500 group-hover:bg-zinc-800 group-hover:text-zinc-300"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[13px]">{item.label}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.badge && (
                      <span className="text-[9px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {item.badge}
                      </span>
                    )}
                    {active && (
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/80" />
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Footer Quick Links */}
          <div className="p-3 border-t border-zinc-800/60 space-y-1.5 bg-zinc-950/40">
            {firstShopSlug && (
              <Link
                href={`/boutiques/${firstShopSlug}/admin`}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 transition-all duration-200 group border border-zinc-800/40 hover:border-zinc-700/60"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1 rounded-md bg-zinc-900 text-zinc-400 group-hover:text-emerald-400 transition-colors">
                    <Store className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-medium">Boutique ({firstShopSlug})</span>
                </div>
                <ExternalLink className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300" />
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 group border border-transparent"
            >
              <div className="p-1 rounded-md bg-zinc-900 text-zinc-500 group-hover:bg-red-500/10 group-hover:text-red-400 transition-colors">
                <LogOut className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-medium">Déconnexion</span>
            </button>
          </div>
        </aside>

        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/70 z-30 lg:hidden backdrop-blur-sm animate-fade-in"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-h-screen lg:ml-[270px] flex flex-col bg-gradient-to-b from-zinc-950 via-zinc-950 to-black">
          {/* Sticky header */}
          <header className="h-14 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 sticky top-0 z-20">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 ml-12 lg:ml-0 text-xs text-zinc-500">
              <Link href="/" className="hover:text-zinc-300 transition-colors">
                ShopEazy
              </Link>
              <ChevronRight className="w-3 h-3 text-zinc-700" />
              <Link href="/admin" className="hover:text-zinc-300 transition-colors">
                Super Admin
              </Link>
              {pathname !== "/admin" && (
                <>
                  <ChevronRight className="w-3 h-3 text-zinc-700" />
                  <span className="text-zinc-200 font-medium capitalize">
                    {pathname.replace("/admin/", "").replace("-", " ")}
                  </span>
                </>
              )}
            </div>

            {/* Header Right Items */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Super Admin Actif</span>
              </div>

              <div className="flex items-center gap-2 pl-2 border-l border-zinc-800/80">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-[11px] shadow-sm shadow-emerald-500/20">
                  {userEmail.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs text-zinc-400 hidden md:inline-block max-w-[150px] truncate">
                  {fullUserEmail || userEmail}
                </span>
              </div>
            </div>
          </header>

          {/* Page View Container */}
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto flex-1 w-full space-y-6">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
