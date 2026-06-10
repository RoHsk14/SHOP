"use client";

import { useEffect, useState } from "react";
import { useProduct } from "@/lib/product-context";
import { Share2 } from "lucide-react";

export default function SectionProductSharing() {
  const { product, loading } = useProduct();
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  if (loading || !product) return null;

  const text = encodeURIComponent(product.name);
  const shareUrl = encodeURIComponent(url);

  return (
    <div className="mx-auto px-4 sm:px-6 pb-6 sm:pb-10" style={{ maxWidth: "var(--theme-container-width, 1200px)" }}>
      <div
        className="p-4 sm:p-6"
        style={{
          background: "var(--theme-surface, #ffffff)",
          borderRadius: "var(--theme-radius-card, 16px)",
          border: "1px solid var(--theme-border, #e5e7eb)",
        }}
      >
        <p className="text-xs font-semibold mb-3" style={{ color: "var(--theme-text-muted, #6b7280)" }}>
          Partager
        </p>
        <div className="flex items-center gap-2">
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 text-white text-xs font-bold"
            style={{ background: "#1877F2" }}
            title="Facebook"
          >
            f
          </a>
          <a
            href={`https://twitter.com/intent/tweet?text=${text}&url=${shareUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 text-white text-xs font-bold"
            style={{ background: "#000000" }}
            title="X (Twitter)"
          >
            X
          </a>
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110 text-white text-xs font-bold"
            style={{ background: "#0A66C2" }}
            title="LinkedIn"
          >
            in
          </a>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: product.name, url });
              }
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ background: "var(--theme-primary, #059669)" }}
            title="Partager"
          >
            <Share2 className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
