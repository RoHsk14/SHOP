"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, Search, ShoppingCart, X, ChevronDown } from "lucide-react";
import { useShop } from "@/lib/shop-context";
import { useCartCount } from "@/components/CartDrawer";
import type { NavMenu, SocialLinks, BrandAssets } from "@/lib/theme-config";

interface Props {
  settings: {
    logo_url?: string;
    logo_max_width?: number;
    navigation_style?: string;
    sticky?: boolean;
    menu_items?: { label: string; url: string; openInNewTab?: boolean }[];
  };
  shopName?: string;
  menus?: NavMenu[];
  brand?: BrandAssets;
  social?: SocialLinks;
}

function SubMenu({ items, parentHref }: { items: { label: string; url: string; openInNewTab?: boolean }[]; parentHref: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <Link
        href={parentHref}
        className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors hover:opacity-70"
        style={{ color: "var(--theme-header-text, var(--theme-text))" }}
      >
        {items[0]?.label || "Menu"} <ChevronDown className="w-3 h-3" />
      </Link>
      {open && (
        <div
          className="absolute top-full left-0 min-w-[200px] rounded-xl shadow-lg border py-1 z-50"
          style={{ background: "var(--theme-surface, #fff)", borderColor: "var(--theme-border, #e5e7eb)" }}
        >
          {items.map((child) => (
            <Link
              key={child.url}
              href={child.url}
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm transition-colors hover:bg-gray-50"
              style={{ color: "var(--theme-text, #111827)" }}
              {...(child.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Header({ settings, shopName, menus, brand }: Props) {
  const { openSearch, openCart, mobileMenuOpen, setMobileMenuOpen, config } = useShop();
  const cartCount = useCartCount();
  const showCart = config?.layout?.showCart !== false;
  const mainMenu = menus?.find((m) => m.id === "main-menu")?.items;
  const menuItems: { label: string; url: string; openInNewTab?: boolean; children?: any[] }[] = (mainMenu as any) || settings.menu_items || [
    { label: "Accueil", url: "/" },
    { label: "Produits", url: "/products" },
  ];
  const logoUrl = brand?.logo || settings.logo_url;
  const logoMaxWidth = brand?.logoMaxWidth || settings.logo_max_width || 140;

  const hasChildren = (item: any) => item.children && item.children.length > 0;

  return (
    <header
      className="w-full"
      style={{
        background: "var(--theme-header-bg, var(--theme-surface))",
        borderBottom: "1px solid var(--theme-border)",
        position: settings.sticky ? "sticky" : "relative",
        top: 0,
        zIndex: 50,
      }}
    >
      <div className="mx-auto px-4 sm:px-6" style={{ maxWidth: "var(--theme-container-width, 1200px)" }}>
        <div className="flex items-center justify-between h-16">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 -ml-2"
            aria-label="Menu"
            style={{ color: "var(--theme-header-text, var(--theme-text))" }}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-0">
            {menuItems.map((item: any) =>
              hasChildren(item) ? (
                <SubMenu key={item.label} items={item.children} parentHref={item.url} />
              ) : (
                <Link
                  key={item.url}
                  href={item.url}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium transition-colors hover:opacity-70"
                  style={{ color: "var(--theme-header-text, var(--theme-text))" }}
                  {...(item.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>

          {/* Logo */}
          <div className="flex-shrink-0">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt="Logo"
                width={logoMaxWidth}
                height={40}
                className="object-contain"
                unoptimized
              />
            ) : (
              <span
                className="text-lg font-bold"
                style={{
                  color: "var(--theme-header-text, var(--theme-text))",
                  fontFamily: "var(--theme-font-heading)",
                }}
              >
                {shopName || "Ma Boutique"}
              </span>
            )}
          </div>

          {/* Icons */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={openSearch}
              className="p-2 hover:opacity-70 transition-opacity"
              aria-label="Rechercher"
              style={{ color: "var(--theme-header-text, var(--theme-text))" }}
            >
              <Search className="w-5 h-5" />
            </button>
            {showCart && (
              <button
                onClick={openCart}
                className="p-2 relative hover:opacity-70 transition-opacity"
                aria-label="Panier"
                style={{ color: "var(--theme-header-text, var(--theme-text))" }}
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 flex items-center justify-center text-[10px] font-bold text-white rounded-full"
                    style={{ background: "var(--theme-primary, #059669)" }}
                  >
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[60] sm:hidden"
          style={{ background: "var(--theme-surface, #fff)" }}
        >
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--theme-border)" }}>
            <span className="text-sm font-bold" style={{ color: "var(--theme-header-text, var(--theme-text))" }}>
              Menu
            </span>
            <button onClick={() => setMobileMenuOpen(false)} className="p-1">
              <X className="w-5 h-5" style={{ color: "var(--theme-text)" }} />
            </button>
          </div>
          <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-60px)]">
            {menuItems.map((item: any) => (
              <div key={item.url}>
                <Link
                  href={item.url}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2.5 text-base font-medium border-b"
                  style={{ color: "var(--theme-text)", borderColor: "var(--theme-border)" }}
                  {...(item.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  {item.label}
                </Link>
                {item.children?.map((child: any) => (
                  <Link
                    key={child.url}
                    href={child.url}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 pl-4 text-sm"
                    style={{ color: "var(--theme-text-muted)" }}
                    {...(child.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
