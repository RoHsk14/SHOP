"use client";

import { useEffect, useRef } from "react";
import type { CustomCss } from "@/lib/theme-config";

export default function CustomCssInjector({ customCss }: { customCss?: CustomCss }) {
  const styleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    const desktop = customCss?.desktop?.trim() || "";
    const mobile = customCss?.mobile?.trim() || "";

    if (!desktop && !mobile) {
      if (styleRef.current) {
        styleRef.current.remove();
        styleRef.current = null;
      }
      return;
    }

    const parts: string[] = [];
    if (desktop) parts.push(desktop);
    if (mobile) parts.push(`@media (max-width: 640px) {\n${mobile}\n}`);

    const css = parts.join("\n");

    if (!styleRef.current) {
      const style = document.createElement("style");
      style.id = "shop-custom-css";
      document.head.appendChild(style);
      styleRef.current = style;
    }

    styleRef.current.textContent = css;

    return () => {
      if (styleRef.current) {
        styleRef.current.remove();
        styleRef.current = null;
      }
    };
  }, [customCss?.desktop, customCss?.mobile]);

  return null;
}
