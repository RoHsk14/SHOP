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

function SubMenu({ items, parentHref, shopLink }: { items: { label: string; url: string; openInNewTab?: boolean }[]; parentHref: string; shopLink: (p: string) => string }) {
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
        href={shopLink(parentHref)}
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
              href={shopLink(child.url)}
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
  const { openSearch, openCart, mobileMenuOpen, setMobileMenuOpen, config, shopLink } = useShop();
  const cartCount = useCartCount();
  const showCart = config?.layout?.showCart !== false;
  const headerStyle = config?.layout?.headerStyle || "standard";
  const isSticky = config?.layout?.stickyHeader !== false;
  const mainMenu = menus?.find((m) => m.id === "main-menu")?.items;
  const menuItems: { label: string; url: string; openInNewTab?: boolean; children?: any[] }[] = (mainMenu as any) || settings.menu_items || [
    { label: "Accueil", url: "/" },
    { label: "Produits", url: "/products" },
  ];
  const logoUrl = brand?.logo || settings.logo_url;
  const logoMaxWidth = brand?.logoMaxWidth || settings.logo_max_width || 140;
  const isTransparent = headerStyle === "transparent";
  const isCentered = headerStyle === "centered";
  const isMinimal = headerStyle === "minimal";

  const hasChildren = (item: any) => item.children && item.children.length > 0;

  const renderNavItems = () => (
    menuItems.map((item: any) =>
      hasChildren(item) ? (
        <SubMenu key={item.label} items={item.children} parentHref={item.url} shopLink={shopLink} />
      ) : (
        <Link
          key={item.url}
          href={shopLink(item.url)}
          className="inline-flex items-center px-3 py-2 text-sm font-medium transition-colors hover:opacity-70"
          style={{ color: "var(--theme-header-text, var(--theme-text))" }}
          {...(item.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {item.label}
        </Link>
      )
    )
  );

  const renderLogo = () => (
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
  );

  const renderIcons = () => (
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
  );

  return (
    <header
      className="w-full"
      style={{
        background: isTransparent ? "transparent" : "var(--theme-header-bg, var(--theme-surface))",
        borderBottom: isTransparent ? "none" : "1px solid var(--theme-border)",
        position: isSticky ? "sticky" : (isTransparent ? "absolute" : "relative"),
        top: 0,
        zIndex: isTransparent ? 40 : 50,
      }}
    >
      <div className="mx-auto px-4 sm:px-6" style={{ maxWidth: "var(--theme-container-width, 1200px)" }}>
        {isCentered ? (
          /* Centered layout: logo centered, nav above, icons absolute */
          <div className="flex flex-col items-center py-3">
            <nav className="hidden sm:flex items-center gap-0 mb-2">
              {renderNavItems()}
            </nav>
            <div className="flex items-center justify-between w-full">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden p-2 -ml-2"
                aria-label="Menu"
                style={{ color: "var(--theme-header-text, var(--theme-text))" }}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div className="flex-1 flex justify-center">{renderLogo()}</div>
              <div className="sm:hidden">{renderIcons()}</div>
              <div className="hidden sm:flex absolute right-4 sm:right-6">{renderIcons()}</div>
            </div>
          </div>
        ) : isMinimal ? (
          /* Minimal layout: logo left, icons right, no nav text */
          <div className="flex items-center justify-between h-16">
            {renderLogo()}
            <div className="hidden sm:flex items-center gap-0">
              {renderNavItems()}
            </div>
            {renderIcons()}
          </div>
        ) : (
          /* Standard layout: nav left, logo center, icons right */
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden p-2 -ml-2"
              aria-label="Menu"
              style={{ color: "var(--theme-header-text, var(--theme-text))" }}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <nav className="hidden sm:flex items-center gap-0">
              {renderNavItems()}
            </nav>
            {renderLogo()}
            {renderIcons()}
          </div>
        )}
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t" style={{ borderColor: "var(--theme-border)", background: "var(--theme-surface, #fff)" }}>
          <nav className="px-4 py-3 space-y-1">
            {menuItems.map((item: any) =>
              hasChildren(item) ? (
                <div key={item.label} className="space-y-1">
                  <p className="text-sm font-semibold py-2" style={{ color: "var(--theme-text)" }}>{item.label}</p>
                  <div className="pl-3 space-y-1">
                    {item.children.map((child: any) => (
                      <Link
                        key={child.url}
                        href={shopLink(child.url)}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block py-1.5 text-sm transition-colors hover:opacity-70"
                        style={{ color: "var(--theme-text-muted)" }}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : (
                <Link
                  key={item.url}
                  href={shopLink(item.url)}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-sm font-medium transition-colors hover:opacity-70"
                  style={{ color: "var(--theme-text)" }}
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
