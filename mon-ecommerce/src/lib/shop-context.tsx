"use client";

import { createContext, useContext, useState, useCallback } from "react";
import type { ThemeConfig } from "./theme-config";

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

  const ctx: ShopContextValue = {
    config, shopName, subdomain,
    searchOpen, cartOpen,
    openSearch, closeSearch,
    openCart, closeCart,
    mobileMenuOpen, setMobileMenuOpen,
  };

  return <ShopContext.Provider value={ctx}>{children}</ShopContext.Provider>;
}

export function useShop(): ShopContextValue {
  const ctx = useContext(ShopContext);
  if (!ctx) {
    return {
      config: null as any,
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
    };
  }
  return ctx;
}
