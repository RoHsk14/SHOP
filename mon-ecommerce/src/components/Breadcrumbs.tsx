"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { useShop } from "@/lib/shop-context";
import { useEditor } from "@/lib/editor-context";

interface Crumb {
  label: string;
  href?: string;
}

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  const { shopLink } = useShop();
  const { isEditor } = useEditor();

  return (
    <nav className="flex items-center gap-1.5 text-xs py-3" style={{ color: "var(--theme-text-muted)" }}>
      <Link
        href={shopLink("/")}
        className="hover:opacity-70 transition-opacity"
        onClick={(e) => {
          if (isEditor) e.preventDefault();
        }}
      >
        <Home className="w-3.5 h-3.5" />
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRight className="w-3 h-3" />
          {item.href ? (
            <Link
              href={shopLink(item.href)}
              className="hover:opacity-70 transition-opacity"
              onClick={(e) => {
                if (isEditor) e.preventDefault();
              }}
            >
              {item.label}
            </Link>
          ) : (
            <span className="font-medium truncate max-w-[200px] sm:max-w-md inline-block align-bottom" style={{ color: "var(--theme-text)" }}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
