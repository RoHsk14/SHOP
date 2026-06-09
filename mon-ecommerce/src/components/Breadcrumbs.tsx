"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface Crumb {
  label: string;
  href?: string;
}

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-xs py-3" style={{ color: "var(--theme-text-muted)" }}>
      <Link href="/" className="hover:opacity-70 transition-opacity">
        <Home className="w-3.5 h-3.5" />
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <ChevronRight className="w-3 h-3" />
          {item.href ? (
            <Link href={item.href} className="hover:opacity-70 transition-opacity">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium" style={{ color: "var(--theme-text)" }}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
