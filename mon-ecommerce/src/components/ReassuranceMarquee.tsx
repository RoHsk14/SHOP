"use client";

import { Truck, ShieldCheck, RotateCcw } from "lucide-react";

interface Item {
  icon: typeof Truck;
  title: string;
  subtitle: string;
}

const ITEMS: Item[] = [
  {
    icon: Truck,
    title: "Livraison express",
    subtitle: "24h à 48h à domicile",
  },
  {
    icon: ShieldCheck,
    title: "Payer à la livraison",
    subtitle: "Vérifiez avant de payer",
  },
  {
    icon: RotateCcw,
    title: "Garantie 100%",
    subtitle: "Satisfait ou remboursé",
  },
];

interface Props {
  speed?: "slow" | "normal" | "fast";
  className?: string;
}

export default function ReassuranceMarquee({ speed = "normal", className = "" }: Props) {
  const duration = speed === "slow" ? "28s" : speed === "fast" ? "16s" : "22s";

  return (
    <div className={`relative w-full overflow-hidden py-2 ${className}`}>
      {/* Soft gradient edge fade masks */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-r from-white via-white/80 to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-l from-white via-white/80 to-transparent" />

      {/* Marquee flex track moving left to right */}
      <div
        className="flex w-max items-center gap-3.5 select-none hover:[animation-play-state:paused]"
        style={{
          animation: `marquee-ltr ${duration} linear infinite`,
        }}
      >
        {/* Render 3 repetitions for perfectly seamless infinite looping */}
        {[...ITEMS, ...ITEMS, ...ITEMS, ...ITEMS].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-gray-50/90 border border-gray-200/80 shadow-2xs shrink-0 transition-transform hover:scale-102"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100/60 shadow-2xs">
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-gray-900 leading-tight whitespace-nowrap">
                  {item.title}
                </p>
                <p className="text-[11px] text-gray-500 whitespace-nowrap">
                  {item.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
