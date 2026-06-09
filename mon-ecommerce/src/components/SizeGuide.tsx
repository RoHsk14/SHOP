"use client";

import { X, Ruler } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const SIZE_DATA = [
  { size: "XS", poitrine: "81-86", taille: "61-66", hanches: "86-91" },
  { size: "S", poitrine: "86-91", taille: "66-71", hanches: "91-96" },
  { size: "M", poitrine: "91-96", taille: "71-76", hanches: "96-101" },
  { size: "L", poitrine: "96-101", taille: "76-81", hanches: "101-106" },
  { size: "XL", poitrine: "101-106", taille: "81-86", hanches: "106-111" },
  { size: "XXL", poitrine: "106-112", taille: "86-92", hanches: "111-117" },
];

export default function SizeGuide({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "var(--theme-surface, #fff)" }}
      >
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--theme-border)" }}>
          <div className="flex items-center gap-2">
            <Ruler className="w-4 h-4" style={{ color: "var(--theme-text)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--theme-text)" }}>
              Guide des tailles
            </span>
          </div>
          <button onClick={onClose} className="p-1 hover:opacity-70">
            <X className="w-5 h-5" style={{ color: "var(--theme-text-muted)" }} />
          </button>
        </div>
        <div className="p-4 sm:p-6">
          <p className="text-xs mb-4" style={{ color: "var(--theme-text-muted)" }}>
            Mesures en centimètres. Si vous hésitez entre deux tailles, choisissez la plus grande.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--theme-border)" }}>
                  <th className="text-left py-2 pr-4 font-semibold" style={{ color: "var(--theme-text)" }}>Taille</th>
                  <th className="text-left py-2 pr-4 font-semibold" style={{ color: "var(--theme-text)" }}>Poitrine (cm)</th>
                  <th className="text-left py-2 pr-4 font-semibold" style={{ color: "var(--theme-text)" }}>Taille (cm)</th>
                  <th className="text-left py-2 font-semibold" style={{ color: "var(--theme-text)" }}>Hanches (cm)</th>
                </tr>
              </thead>
              <tbody>
                {SIZE_DATA.map((row) => (
                  <tr key={row.size} className="border-b" style={{ borderColor: "var(--theme-border)" }}>
                    <td className="py-2 pr-4 font-medium" style={{ color: "var(--theme-text)" }}>{row.size}</td>
                    <td className="py-2 pr-4" style={{ color: "var(--theme-text-muted)" }}>{row.poitrine}</td>
                    <td className="py-2 pr-4" style={{ color: "var(--theme-text-muted)" }}>{row.taille}</td>
                    <td className="py-2" style={{ color: "var(--theme-text-muted)" }}>{row.hanches}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
