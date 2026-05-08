"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart, Settings, Store, LogOut, Menu, X, Share2 } from "lucide-react";
import { useState } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const menuItems = [
    { href: "/admin", label: "Vue d'ensemble", icon: LayoutDashboard },
    { href: "/admin/products", label: "Produits", icon: Package },
    { href: "/admin/orders", label: "Commandes", icon: ShoppingCart },
    { href: "/admin/facebook", label: "Facebook & Instagram", icon: Share2 },
    { href: "/admin/settings", label: "Paramètres", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-sm"
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
        <div className="p-6 border-b border-gray-100">
          <Link href="/admin" className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-sm">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Admin
              </h1>
              <p className="text-xs text-gray-500">Boutique E-commerce</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
            Menu principal
          </p>
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <div className={`p-2 rounded-lg transition-all ${
                  isActive
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-gray-700"
                }`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="font-medium text-sm">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-2 h-2 bg-emerald-500 rounded-full"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer sidebar */}
        <div className="p-4 border-t border-gray-100 space-y-2">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 transition-all group"
          >
            <div className="p-2 rounded-lg bg-gray-100 text-gray-500 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-all">
              <Store className="w-5 h-5" />
            </div>
            <span className="font-medium text-sm">Voir la boutique ↗</span>
          </a>
          
          <button
            onClick={() => {
              if (confirm("Voulez-vous vraiment vous déconnecter ?")) {
                console.log("Déconnexion...");
              }
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all group"
          >
            <div className="p-2 rounded-lg bg-gray-100 text-gray-500 group-hover:bg-red-100 group-hover:text-red-600 transition-all">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="font-medium text-sm">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 min-h-screen lg:ml-64">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
