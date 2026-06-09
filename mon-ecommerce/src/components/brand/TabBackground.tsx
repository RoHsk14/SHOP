"use client";

import type { BackgroundSettings } from "@/lib/theme-config";
import ImagePicker from "@/components/ImagePicker";

export default function TabBackground({
  background,
  onChange,
}: {
  background: BackgroundSettings;
  onChange: (bg: BackgroundSettings) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Type d'arrière-plan</label>
        <select
          value={background.type}
          onChange={(e) => onChange({ ...background, type: e.target.value as BackgroundSettings["type"] })}
          className="w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900"
        >
          <option value="color">Couleur unie</option>
          <option value="gradient">Dégradé</option>
          <option value="image">Image / Pattern</option>
        </select>
      </div>

      {background.type === "color" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Couleur de fond</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={background.color}
              onChange={(e) => onChange({ ...background, color: e.target.value })}
              className="w-10 h-10 p-0.5 border border-gray-200 rounded-lg cursor-pointer bg-white"
            />
            <input
              type="text"
              value={background.color}
              onChange={(e) => onChange({ ...background, color: e.target.value })}
              className="flex-1 text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      )}

      {background.type === "gradient" && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Dégradé CSS</label>
          <input
            type="text"
            value={background.gradient || ""}
            onChange={(e) => onChange({ ...background, gradient: e.target.value })}
            placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            className="w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <div
            className="mt-3 h-20 rounded-xl border border-gray-200"
            style={{ background: background.gradient || background.color }}
          />
          <p className="text-xs text-gray-400 mt-1">Ex: <code className="bg-gray-100 px-1 rounded">linear-gradient(135deg, #667eea, #764ba2)</code></p>
        </div>
      )}

      {background.type === "image" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Image de fond</label>
            <ImagePicker value={background.image || ""} onChange={(v) => onChange({ ...background, image: v })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Répétition</label>
              <select
                value={background.repeat || "no-repeat"}
                onChange={(e) => onChange({ ...background, repeat: e.target.value as any })}
                className="w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900"
              >
                <option value="no-repeat">Pas de répétition</option>
                <option value="repeat">Répéter</option>
                <option value="repeat-x">Répéter horizontal</option>
                <option value="repeat-y">Répéter vertical</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Taille</label>
              <select
                value={background.size || "cover"}
                onChange={(e) => onChange({ ...background, size: e.target.value as any })}
                className="w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900"
              >
                <option value="cover">Couvrir</option>
                <option value="contain">Contenir</option>
                <option value="auto">Auto</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Position</label>
              <select
                value={background.position || "center"}
                onChange={(e) => onChange({ ...background, position: e.target.value })}
                className="w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900"
              >
                <option value="center">Centre</option>
                <option value="top">Haut</option>
                <option value="bottom">Bas</option>
                <option value="left">Gauche</option>
                <option value="right">Droite</option>
                <option value="top left">Haut gauche</option>
                <option value="top right">Haut droite</option>
                <option value="bottom left">Bas gauche</option>
                <option value="bottom right">Bas droite</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Opacité</label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={background.opacity ?? 1}
                onChange={(e) => onChange({ ...background, opacity: Number(e.target.value) })}
                className="w-full accent-emerald-600"
              />
              <p className="text-xs text-gray-400 mt-0.5">{Math.round((background.opacity ?? 1) * 100)}%</p>
            </div>
          </div>
          {background.image && (
            <div
              className="h-32 rounded-xl border border-gray-200"
              style={{
                backgroundImage: `url(${background.image})`,
                backgroundRepeat: background.repeat || "no-repeat",
                backgroundSize: background.size || "cover",
                backgroundPosition: background.position || "center",
                opacity: background.opacity ?? 1,
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
