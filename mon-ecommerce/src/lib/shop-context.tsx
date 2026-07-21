"use client";

import { createContext, useContext, useState, useCallback, useMemo } from "react";
import type { ThemeConfig } from "./theme-config";
import { buildDefaultConfig } from "./theme-config";

interface ShopContextValue {
  config: ThemeConfig;
  shopName: string;
  subdomain: string;
  searchOpen: boolean;
  cartOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  openCart: () => void;
  closeCart: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (v: boolean) => void;
  /** Build a shop-relative link: ensures correct routing for both subdomain and path-based access */
  shopLink: (path: string) => string;
}

const ShopContext = createContext<ShopContextValue | null>(null);

interface ShopProviderProps {
  config: ThemeConfig;
  shopName: string;
  subdomain: string;
  children: React.ReactNode;
}

export function ShopProvider({ config, shopName, subdomain, children }: ShopProviderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  const shopLink = useCallback((path: string) => {
    // External links and anchors pass through
    if (path.startsWith("http") || path.startsWith("#") || path.startsWith("mailto:")) return path;
    // Already prefixed — pass through
    if (path.startsWith(`/boutiques/${subdomain}`)) return path;
    // Normalise: ensure leading slash
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `/boutiques/${subdomain}${cleanPath}`;
  }, [subdomain]);

  const ctx: ShopContextValue = useMemo(() => ({
    config, shopName, subdomain,
    searchOpen, cartOpen,
    openSearch, closeSearch,
    openCart, closeCart,
    mobileMenuOpen, setMobileMenuOpen,
    shopLink,
  }), [config, shopName, subdomain, searchOpen, cartOpen, openSearch, closeSearch, openCart, closeCart, mobileMenuOpen, setMobileMenuOpen, shopLink]);

  return <ShopContext.Provider value={ctx}>{children}</ShopContext.Provider>;
}

export function useShop(): ShopContextValue {
  const ctx = useContext(ShopContext);
  if (!ctx) {
    const fallbackConfig = buildDefaultConfig("classic");
    return {
      config: fallbackConfig,
      shopName: "",
      subdomain: "",
      searchOpen: false,
      cartOpen: false,
      openSearch: () => {},
      closeSearch: () => {},
      openCart: () => {},
      closeCart: () => {},
      mobileMenuOpen: false,
      setMobileMenuOpen: () => {},
      shopLink: (p: string) => p,
    };
  }
  return ctx;
}
