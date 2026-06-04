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

      console.log("[SuperAdmin] Checking for user:", session.user.id);

      const { data: settings, error } = await supabase
        .from("settings")
        .select("is_super_admin")
        .eq("user_id", session.user.id)
        .eq("is_super_admin", true)
        .maybeSingle();

      console.log("[SuperAdmin] Query result:", settings, error);

      if (error) {
        console.error("[SuperAdmin] RLS error:", error);
      }

      if (!settings) {
        console.log("[SuperAdmin] No super admin row found, redirecting to login");
        window.location.replace(`${window.location.origin}/login`);
        return;
      }
      console.log("[SuperAdmin] Access granted");
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-emerald-600 rounded-full animate-spin"></div>
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
    <div className="min-h-screen bg-gray-50 flex">
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-3 left-3 z-50 lg:hidden w-9 h-9 bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-sm"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <aside className={`
        fixed inset-y-0 left-0 z-40
        w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-screen
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="p-5 border-b border-gray-800">
          <Link href="/admin" className="flex items-center gap-3"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="w-9 h-9 flex-shrink-0 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white">
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M3 10h18" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 5v14" stroke="currentColor" strokeWidth="2" opacity="0.5"/>
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-white">Super Admin</h1>
              <p className="text-[10px] text-gray-500">ShopEazy</p>
            </div>
          </Link>
        </div>

        {/* User */}
        <div className="mx-4 mt-4 p-3 rounded-xl bg-gray-800/50 border border-gray-700/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-200 truncate">{userEmail}</p>
              <p className="text-[10px] text-emerald-400 font-medium">Super Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
            Administration
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
                    ? "bg-emerald-600/20 text-emerald-400 shadow-sm"
                    : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                }`}
              >
                <div className={`p-1.5 rounded-lg transition-all ${
                  active
                    ? "bg-emerald-600/30 text-emerald-400"
                    : "bg-gray-800 text-gray-500 group-hover:bg-gray-700 group-hover:text-gray-300"
                }`}>
                  <item.icon className="w-4 h-4" />
                </div>
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-red-900/30 hover:text-red-400 transition-all group"
          >
            <div className="p-1.5 rounded-lg bg-gray-800 text-gray-500 group-hover:bg-red-900/50 group-hover:text-red-400 transition-all">
              <LogOut className="w-4 h-4" />
            </div>
            <span className="font-medium text-sm">Déconnexion</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="flex-1 min-h-screen lg:ml-64 flex flex-col">
        <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0">
          <div className="flex items-center gap-2 ml-12 lg:ml-0">
            <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Accueil</Link>
            <ChevronRight className="w-3 h-3 text-gray-300" />
            <span className="text-sm font-semibold text-gray-900">Super Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              {userEmail.charAt(0).toUpperCase()}
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
