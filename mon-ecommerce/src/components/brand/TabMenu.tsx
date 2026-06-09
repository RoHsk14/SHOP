"use client";

import type { NavMenu } from "@/lib/theme-config";
import MenuBuilder from "@/components/MenuBuilder";

export default function TabMenu({
  menus,
  onChange,
}: {
  menus: NavMenu[];
  onChange: (menus: NavMenu[]) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500">
        Créez et gérez les menus de navigation de votre boutique. Les menus sont réutilisables dans l&apos;en-tête et le pied de page.
      </p>
      <MenuBuilder menus={menus} onChange={onChange} />
    </div>
  );
}
