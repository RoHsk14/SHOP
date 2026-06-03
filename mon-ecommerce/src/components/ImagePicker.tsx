"use client";

import { useState, useRef } from "react";
import { Upload } from "lucide-react";

const STOCK_IMAGES = [
  { label: "Boutique", url: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070&auto=format&fit=crop" },
  { label: "Produits naturels", url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop" },
  { label: "Mode", url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop" },
  { label: "Accessoires", url: "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?q=80&w=2069&auto=format&fit=crop" },
  { label: "Artisanat", url: "https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?q=80&w=2070&auto=format&fit=crop" },
  { label: "Décoration", url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=2158&auto=format&fit=crop" },
  { label: "Alimentation", url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=2070&auto=format&fit=crop" },
  { label: "Fleurs", url: "https://images.unsplash.com/photo-1563241527-3004b7be0ffd?q=80&w=2070&auto=format&fit=crop" },
];

export default function ImagePicker({
  value,
  onChange,
  compact,
}: {
  value: string;
  onChange: (val: string) => void;
  compact?: boolean;
}) {
  const [showStock, setShowStock] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="URL de l'image"
          className="flex-1 text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          title="Importer"
        >
          <Upload className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowStock(!showStock)}
          className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-sm"
        >
          Stock
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        {showStock && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 grid grid-cols-4 gap-1 p-2 bg-white rounded-lg border border-gray-200 shadow-lg">
            {STOCK_IMAGES.map((img, i) => (
              <button
                key={i}
                onClick={() => { onChange(img.url); setShowStock(false); }}
                className="relative aspect-[4/3] rounded overflow-hidden border-2 hover:border-emerald-500 transition-all"
                title={img.label}
              >
                <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                <div className="absolute bottom-0 inset-x-0 bg-black/50 text-[9px] text-white text-center py-0.5 truncate px-1">
                  {img.label}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {value && (
        <div className="relative w-full h-28 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
          <img src={value} alt="" className="w-full h-full object-cover" />
          <button
            onClick={() => onChange("")}
            className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full text-xs flex items-center justify-center hover:bg-black/70"
          >
            ✕
          </button>
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="URL de l'image"
          className="flex-1 text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
          title="Importer"
        >
          <Upload className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowStock(!showStock)}
          className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-sm whitespace-nowrap"
        >
          {showStock ? "Fermer" : "Stock"}
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />

      {showStock && (
        <div className="grid grid-cols-4 gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
          {STOCK_IMAGES.map((img, i) => (
            <button
              key={i}
              onClick={() => { onChange(img.url); setShowStock(false); }}
              className="relative aspect-[4/3] rounded-md overflow-hidden border-2 transition-all hover:border-emerald-500"
              title={img.label}
            >
              <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
              <div className="absolute bottom-0 inset-x-0 bg-black/50 text-[9px] text-white text-center py-0.5 truncate px-1">
                {img.label}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
