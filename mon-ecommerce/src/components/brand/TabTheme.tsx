"use client";

import { themes, type Theme } from "@/lib/themes";
import { Check } from "lucide-react";

function ThemeCard({ theme, active, onSelect }: { theme: Theme; active: boolean; onSelect: () => void }) {
  const c = theme.colors;
  return (
    <button
      onClick={onSelect}
      className={`relative text-left w-full rounded-2xl border-2 overflow-hidden transition-all hover:shadow-lg ${
        active ? "border-emerald-500 shadow-md" : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="p-4 space-y-3" style={{ background: c.background }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white" style={{ background: c.primary }}>
            S
          </div>
          <div className="h-2 w-16 rounded-full" style={{ background: c.text, opacity: 0.3 }} />
          <div className="ml-auto flex gap-1">
            <div className="w-4 h-2 rounded-full" style={{ background: c.textMuted, opacity: 0.3 }} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[1, 2].map(i => (
            <div key={i} className="rounded-xl p-2 space-y-1.5" style={{
              background: c.surface,
              boxShadow: theme.cardStyle === "shadow" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              border: theme.cardStyle === "bordered" ? `1px solid ${c.border}` : "none",
            }}>
              <div className={`w-full rounded-lg ${theme.productImageShape === "square" ? "aspect-square" : theme.productImageShape === "portrait" ? "aspect-[3/4]" : "aspect-[4/3]"} flex items-center justify-center`} style={{ background: c.secondary }}>
                <div className="w-6 h-6 rounded" style={{ background: c.border }} />
              </div>
              <div className="h-2 w-3/4 rounded-full" style={{ background: c.text, opacity: 0.2 }} />
              <div className="h-2 w-1/2 rounded-full" style={{ background: c.primary, opacity: 0.6 }} />
            </div>
          ))}
        </div>
      </div>
      <div className="p-3 flex items-center justify-between" style={{ background: c.surface }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: c.text }}>{theme.name}</p>
          <p className="text-xs mt-0.5" style={{ color: c.textMuted }}>{theme.description}</p>
        </div>
        {active && (
          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
            <Check className="w-3.5 h-3.5 text-white" />
          </div>
        )}
      </div>
    </button>
  );
}

export default function TabTheme({
  selectedThemeId,
  onThemeChange,
}: {
  selectedThemeId: string;
  onThemeChange: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
      {themes.map(theme => (
        <ThemeCard
          key={theme.id}
          theme={theme}
          active={selectedThemeId === theme.id}
          onSelect={() => onThemeChange(theme.id)}
        />
      ))}
    </div>
  );
}
