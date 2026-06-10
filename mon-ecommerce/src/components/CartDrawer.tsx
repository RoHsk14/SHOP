"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ShoppingCart, X, Trash2, Minus, Plus } from "lucide-react";
import { useShop } from "@/lib/shop-context";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  slug?: string;
}

const CART_KEY = "shop-cart";

function getCart(): CartItem[] {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  } catch {
    return [];
  }
}

function setCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart-updated"));
}

export function addToCart(item: Omit<CartItem, "quantity">) {
  const cart = getCart();
  const existing = cart.find((i) => i.id === item.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ ...item, quantity: 1 });
  }
  setCart(cart);
}

export function useCartCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const update = () => setCount(getCart().reduce((s, i) => s + i.quantity, 0));
    update();
    window.addEventListener("cart-updated", update);
    return () => window.removeEventListener("cart-updated", update);
  }, []);
  return count;
}

export default function CartDrawer() {
  const { cartOpen, closeCart, subdomain, config } = useShop();
  if (config?.layout?.showCart === false) return null;
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    if (cartOpen) setItems(getCart());
  }, [cartOpen]);

  const updateQuantity = (id: string, delta: number) => {
    const newItems = items
      .map((i) => (i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i))
      .filter((i) => i.quantity > 0);
    setItems(newItems);
    setCart(newItems);
  };

  const removeItem = (id: string) => {
    const newItems = items.filter((i) => i.id !== id);
    setItems(newItems);
    setCart(newItems);
  };

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  if (!cartOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex justify-end">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeCart} />
      <div
        className="relative w-full max-w-md h-full shadow-2xl flex flex-col"
        style={{ background: "var(--theme-surface, #fff)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--theme-border)" }}>
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" style={{ color: "var(--theme-text)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--theme-text)" }}>
              Panier ({items.length})
            </span>
          </div>
          <button onClick={closeCart} className="p-1 hover:opacity-70">
            <X className="w-5 h-5" style={{ color: "var(--theme-text-muted)" }} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 && (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--theme-text-muted)" }} />
              <p className="text-sm" style={{ color: "var(--theme-text-muted)" }}>
                Votre panier est vide
              </p>
            </div>
          )}

          {items.map((item) => {
            const slug = item.slug || item.name.toLowerCase().replace(/\s+/g, "-");
            return (
              <div
                key={item.id}
                className="flex gap-3 p-3 rounded-xl"
                style={{ background: "var(--theme-secondary, #f9fafb)" }}
              >
                <Link
                  href={`/boutiques/${subdomain}/products/${slug}`}
                  onClick={closeCart}
                  className="w-16 h-16 rounded-lg overflow-hidden shrink-0"
                  style={{ background: "var(--theme-border)" }}
                >
                  {item.image && <img src={item.image} alt="" className="w-full h-full object-cover" />}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/boutiques/${subdomain}/products/${slug}`}
                    onClick={closeCart}
                    className="text-sm font-medium block truncate"
                    style={{ color: "var(--theme-text)" }}
                  >
                    {item.name}
                  </Link>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: "var(--theme-primary)" }}>
                    {item.price.toLocaleString()} XOF
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-6 h-6 flex items-center justify-center rounded-md border"
                        style={{ borderColor: "var(--theme-border)" }}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-medium w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-6 h-6 flex items-center justify-center rounded-md border"
                        style={{ borderColor: "var(--theme-border)" }}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="ml-auto p-1 hover:opacity-70">
                      <Trash2 className="w-3.5 h-3.5" style={{ color: "var(--theme-text-muted)" }} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t p-4 space-y-3" style={{ borderColor: "var(--theme-border)" }}>
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: "var(--theme-text-muted)" }}>Total</span>
              <span className="font-bold text-base" style={{ color: "var(--theme-text)" }}>
                {total.toLocaleString()} XOF
              </span>
            </div>
            <button
              className="w-full py-3 text-sm font-semibold text-white rounded-xl transition-colors"
              style={{ background: "var(--theme-primary)" }}
              onClick={closeCart}
            >
              Commander
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
