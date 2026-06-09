"use client";

import { useState, useRef } from "react";
import type { NavMenu, NavMenuItem } from "@/lib/theme-config";
import { Plus, Trash2, GripVertical, ChevronDown, ChevronRight, ExternalLink, Link } from "lucide-react";

function generateId() {
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function MenuItemRow({
  item,
  depth,
  onUpdate,
  onDelete,
  onAddChild,
  onDragStart,
  onDragOver,
  onDrop,
  index,
}: {
  item: NavMenuItem;
  depth: number;
  onUpdate: (item: NavMenuItem) => void;
  onDelete: () => void;
  onAddChild: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  index: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="group"
    >
      <div
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200 cursor-grab active:cursor-grabbing"
        style={{ marginLeft: depth * 20 }}
      >
        <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />

        {hasChildren ? (
          <button onClick={() => setExpanded(!expanded)} className="p-0.5">
            {expanded ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
          </button>
        ) : (
          <div className="w-4" />
        )}

        <div className="flex-1 grid grid-cols-2 gap-2">
          <input
            type="text"
            value={item.label}
            onChange={(e) => onUpdate({ ...item, label: e.target.value })}
            placeholder="Nom du lien"
            className="text-sm px-2 py-1 bg-white border border-gray-200 rounded-md text-gray-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <div className="flex items-center gap-1">
            <Link className="w-3 h-3 text-gray-300 shrink-0" />
            <input
              type="text"
              value={item.url}
              onChange={(e) => onUpdate({ ...item, url: e.target.value })}
              placeholder="/lien"
              className="flex-1 text-sm px-2 py-1 bg-white border border-gray-200 rounded-md text-gray-900 font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>

        <label className="flex items-center gap-1 text-xs text-gray-400 shrink-0" title="Ouvrir dans un nouvel onglet">
          <input
            type="checkbox"
            checked={!!item.openInNewTab}
            onChange={(e) => onUpdate({ ...item, openInNewTab: e.target.checked })}
            className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          />
          <ExternalLink className="w-3 h-3" />
        </label>

        <button
          onClick={onAddChild}
          className="p-1 hover:bg-gray-100 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
          title="Ajouter un sous-menu"
        >
          <Plus className="w-3.5 h-3.5 text-gray-400" />
        </button>

        <button
          onClick={onDelete}
          className="p-1 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
          title="Supprimer"
        >
          <Trash2 className="w-3.5 h-3.5 text-red-400" />
        </button>
      </div>

      {expanded && hasChildren && (
        <div className="border-l-2 border-gray-100 ml-6 pl-1 mt-0.5">
          {item.children!.map((child, ci) => (
            <MenuItemRow
              key={child.id}
              item={child}
              depth={depth + 1}
              index={ci}
              onUpdate={(updated) => {
                const newChildren = [...(item.children || [])];
                newChildren[ci] = updated;
                onUpdate({ ...item, children: newChildren });
              }}
              onDelete={() => {
                const newChildren = item.children!.filter((_, i) => i !== ci);
                onUpdate({ ...item, children: newChildren });
              }}
              onAddChild={() => {
                const newChild: NavMenuItem = {
                  id: generateId(),
                  label: "",
                  url: "",
                };
                onUpdate({ ...item, children: [...(item.children || []), newChild] });
              }}
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", `child-${item.id}-${ci}`);
              }}
              onDragOver={(e) => {
                e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MenuBuilder({
  menus,
  onChange,
}: {
  menus: NavMenu[];
  onChange: (menus: NavMenu[]) => void;
}) {
  const [activeMenuId, setActiveMenuId] = useState(menus[0]?.id || "");

  const activeMenu = menus.find((m) => m.id === activeMenuId) || menus[0];
  const dragItem = useRef<{ menuId: string; itemIndex: number } | null>(null);

  const updateMenu = (menuId: string, updater: (menu: NavMenu) => NavMenu) => {
    onChange(menus.map((m) => (m.id === menuId ? updater(m) : m)));
  };

  const addItem = () => {
    if (!activeMenu) return;
    const newItem: NavMenuItem = {
      id: generateId(),
      label: "",
      url: "/",
    };
    updateMenu(activeMenu.id, (m) => ({ ...m, items: [...m.items, newItem] }));
  };

  const addMenu = () => {
    const newMenu: NavMenu = {
      id: `menu-${Date.now()}`,
      name: "Nouveau menu",
      items: [],
    };
    onChange([...menus, newMenu]);
    setActiveMenuId(newMenu.id);
  };

  const deleteMenu = (menuId: string) => {
    if (menus.length <= 1) return;
    const filtered = menus.filter((m) => m.id !== menuId);
    onChange(filtered);
    if (activeMenuId === menuId) setActiveMenuId(filtered[0]?.id || "");
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragItem.current = { menuId: activeMenu?.id || "", itemIndex: index };
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!dragItem.current || dragItem.current.menuId !== activeMenu?.id) return;
    const from = dragItem.current.itemIndex;
    if (from === targetIndex) return;
    updateMenu(activeMenu.id, (m) => {
      const items = [...m.items];
      const [moved] = items.splice(from, 1);
      items.splice(targetIndex, 0, moved);
      return { ...m, items };
    });
    dragItem.current = null;
  };

  if (!activeMenu) {
    return (
      <div className="text-center py-8 text-sm text-gray-400">
        <p>Aucun menu. Créez-en un.</p>
        <button onClick={addMenu} className="mt-2 text-emerald-600 hover:text-emerald-700 font-medium">
          + Ajouter un menu
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Menu tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {menus.map((menu) => (
          <button
            key={menu.id}
            onClick={() => setActiveMenuId(menu.id)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              activeMenuId === menu.id
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {menu.name}
          </button>
        ))}
        <button
          onClick={addMenu}
          className="px-2 py-1.5 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          title="Ajouter un menu"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Active menu name + delete */}
      <div className="flex items-center justify-between">
        <input
          type="text"
          value={activeMenu.name}
          onChange={(e) => updateMenu(activeMenu.id, (m) => ({ ...m, name: e.target.value }))}
          className="text-sm font-semibold text-gray-900 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-emerald-500 focus:outline-none px-1 py-0.5"
          placeholder="Nom du menu"
        />
        {menus.length > 1 && (
          <button
            onClick={() => deleteMenu(activeMenu.id)}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            Supprimer ce menu
          </button>
        )}
      </div>

      {/* Menu items */}
      <div className="space-y-1 min-h-[60px] bg-gray-50 rounded-xl border border-gray-200 p-3">
        {activeMenu.items.length === 0 ? (
          <div className="text-center py-6 text-sm text-gray-400">
            Aucun lien. Cliquez sur "Ajouter un lien".
          </div>
        ) : (
          activeMenu.items.map((item, i) => (
            <MenuItemRow
              key={item.id}
              item={item}
              depth={0}
              index={i}
              onUpdate={(updated) => {
                updateMenu(activeMenu.id, (m) => {
                  const items = [...m.items];
                  items[i] = updated;
                  return { ...m, items };
                });
              }}
              onDelete={() => {
                updateMenu(activeMenu.id, (m) => ({
                  ...m,
                  items: m.items.filter((_, idx) => idx !== i),
                }));
              }}
              onAddChild={() => {
                const child: NavMenuItem = {
                  id: generateId(),
                  label: "",
                  url: "/",
                };
                updateMenu(activeMenu.id, (m) => {
                  const items = [...m.items];
                  const updatedItem = { ...items[i] };
                  updatedItem.children = [...(updatedItem.children || []), child];
                  items[i] = updatedItem;
                  return { ...m, items };
                });
              }}
              onDragStart={(e) => handleDragStart(e, i)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, i)}
            />
          ))
        )}
      </div>

      <button
        onClick={addItem}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Ajouter un lien
      </button>
    </div>
  );
}
