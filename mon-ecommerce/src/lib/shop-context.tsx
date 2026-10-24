"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
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
  shopLink: (path?: string | null) => string;
  /** True when running inside customizer mobile simulator or when screen is mobile size (<640px) */
  isMobile: boolean;
  isMobilePreview: boolean;
}

const ShopContext = createContext<ShopContextValue | null>(null);

interface ShopProviderProps {
  config: ThemeConfig;
  shopName: string;
  subdomain: string;
  isMobilePreview?: boolean;
  children: React.ReactNode;
}

export function ShopProvider({ config, shopName, subdomain, isMobilePreview = false, children }: ShopProviderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isWindowMobile, setIsWindowMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsWindowMobile(typeof window !== "undefined" && window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const isMobile = isMobilePreview || isWindowMobile;

  const openSearch = useCallback(() => setSearchOpen(true), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);
  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  const shopLink = useCallback((path?: string | null) => {
    if (!path) return "#";
    // External links, anchors, tel/mailto pass through
    if (
      path.startsWith("http://") ||
      path.startsWith("https://") ||
      path.startsWith("#") ||
      path.startsWith("mailto:") ||
      path.startsWith("tel:")
    ) {
      return path;
    }
    // If no subdomain is set yet, return path as-is
    if (!subdomain) {
      return path.startsWith("/") ? path : `/${path}`;
    }
    // Already prefixed with this store's base path
    if (path.startsWith(`/boutiques/${subdomain}`)) return path;
    // Normalise: ensure leading slash
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    if (cleanPath === "/") {
      return `/boutiques/${subdomain}`;
    }
    return `/boutiques/${subdomain}${cleanPath}`;
  }, [subdomain]);

  const ctx: ShopContextValue = useMemo(() => ({
    config, shopName, subdomain,
    searchOpen, cartOpen,
    openSearch, closeSearch,
    openCart, closeCart,
    mobileMenuOpen, setMobileMenuOpen,
    shopLink,
    isMobile,
    isMobilePreview: !!isMobilePreview,
  }), [config, shopName, subdomain, searchOpen, cartOpen, openSearch, closeSearch, openCart, closeCart, mobileMenuOpen, setMobileMenuOpen, shopLink, isMobile, isMobilePreview]);

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
      shopLink: (p?: string | null) => p || "#",
      isMobile: false,
      isMobilePreview: false,
    };
  }
  return ctx;
}
