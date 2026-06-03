"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu, Search, ShoppingCart } from "lucide-react";

interface MenuItem {
  label: string;
  url: string;
}

interface Props {
  settings: {
    logo_url?: string;
    logo_max_width?: number;
    navigation_style?: string;
    sticky?: boolean;
    menu_items?: MenuItem[];
  };
  shopName?: string;
}

export default function Header({ settings, shopName }: Props) {
  const menuItems = settings.menu_items || [
    { label: "Accueil", url: "/" },
    { label: "Produits", url: "/products" },
  ];

  return (
    <header
      className="w-full"
      style={{
        background: "var(--theme-surface)",
        borderBottom: "1px solid var(--theme-border)",
        position: settings.sticky ? "sticky" : "relative",
        top: 0,
        zIndex: 50,
      }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Mobile menu button */}
          <button className="sm:hidden p-2 -ml-2" style={{ color: "var(--theme-text)" }}>
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-6">
            {menuItems.map((item, i) => (
              <Link
                key={i}
                href={item.url}
                className="text-sm font-medium transition-colors hover:opacity-70"
                style={{ color: "var(--theme-text)" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Logo */}
          <div className="flex-shrink-0">
            {settings.logo_url ? (
              <Image
                src={settings.logo_url}
                alt="Logo"
                width={settings.logo_max_width || 140}
                height={40}
                className="object-contain"
                unoptimized
              />
            ) : (
              <span
                className="text-lg font-bold"
                style={{
                  color: "var(--theme-text)",
                  fontFamily: "var(--theme-font-heading)",
                }}
              >
                {shopName || "Ma Boutique"}
              </span>
            )}
          </div>

          {/* Icons */}
          <div className="flex items-center gap-3">
            <button className="p-2" style={{ color: "var(--theme-text)" }}>
              <Search className="w-5 h-5" />
            </button>
            <button className="p-2 relative" style={{ color: "var(--theme-text)" }}>
              <ShoppingCart className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
