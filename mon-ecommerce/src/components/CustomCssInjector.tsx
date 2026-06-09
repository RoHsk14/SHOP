"use client";

import { useEffect, useRef } from "react";
import type { CustomCss } from "@/lib/theme-config";

export default function CustomCssInjector({ customCss }: { customCss?: CustomCss }) {
  const styleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    if (!customCss?.desktop && !customCss?.mobile) {
      if (styleRef.current) {
        styleRef.current.remove();
        styleRef.current = null;
      }
      return;
    }

    const css = [
      customCss.desktop || "",
      customCss.mobile || "",
    ].filter(Boolean).join("\n");

    if (!css) {
      if (styleRef.current) {
        styleRef.current.remove();
        styleRef.current = null;
      }
      return;
    }

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
