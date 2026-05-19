"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart, Settings, LogOut, Menu, X, Share2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

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

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (!session) {
        router.replace("/admin/login");
      } else {
        setUserEmail(session.user.email?.split("@")[0] || "Admin");
      }
      setChecking(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        router.replace("/admin/login");
      }
      if (session?.user?.email) {
        setUserEmail(session.user.email.split("@")[0]);
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

  if (pathname === "/admin/login") return <>{children}</>;

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-emerald-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const menuItems = [
    { href: "/admin", label: "Vue d'ensemble", icon: LayoutDashboard },
    { href: "/admin/orders", label: "Commandes", icon: ShoppingCart },
    { href: "/admin/products", label: "Produits", icon: Package },
    { href: "/admin/facebook", label: "Facebook & Instagram", icon: Share2 },
  ];

  const secondaryItems = [
    { href: "/admin/settings", label: "Paramètres", icon: Settings },
  ];

  const isActive = (href: string) => pathname === href;

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
                <path d="M4 7l8-4 8 4M4 17l8 4 8-4M4 12l8-4 8 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Admin
              </h1>
              <p className="text-[10px] text-gray-400">Boutique E-commerce</p>
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
              <p className="text-[10px] text-emerald-600 font-medium">Propriétaire</p>
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
      <main className="flex-1 min-h-screen lg:ml-64">
        <div className="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
