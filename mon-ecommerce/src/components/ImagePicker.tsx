"use client";

import { useState, useRef, useMemo } from "react";
import {
  Upload,
  Image as ImageIcon,
  Search,
  X,
  Sparkles,
  Link as LinkIcon,
  Check,
  FolderOpen,
} from "lucide-react";

export interface StockThemeImage {
  id: string;
  theme: string;
  themeLabel: string;
  label: string;
  url: string;
}

export const THEMES_IMAGE_LIBRARY: {
  id: string;
  label: string;
  icon: string;
  images: { label: string; url: string }[];
}[] = [
  {
    id: "fashion",
    label: "Mode & Vêtements",
    icon: "👗",
    images: [
      {
        label: "Femme style streetwear moderne",
        url: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop",
      },
      {
        label: "Homme costume chic & élégant",
        url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1200&auto=format&fit=crop",
      },
      {
        label: "Boutique de vêtements sur cintres",
        url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop",
      },
      {
        label: "Baskets & sneakers tendance",
        url: "https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=1200&auto=format&fit=crop",
      },
      {
        label: "Sacs à main maroquinerie de luxe",
        url: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=1200&auto=format&fit=crop",
      },
      {
        label: "Lunettes de soleil & accessoires",
        url: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=1200&auto=format&fit=crop",
      },
    ],
  },
  {
    id: "beauty",
    label: "Beauté & Cosmétiques",
    icon: "💄",
    images: [
      {
        label: "Flacon sérum avec pipette en verre",
        url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=1200&auto=format&fit=crop",
      },
      {
        label: "Produits de soin naturels spa",
        url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=1200&auto=format&fit=crop",
      },
      {
        label: "Crème visage texture veloutée",
        url: "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=1200&auto=format&fit=crop",
      },
      {
        label: "Rouge à lèvres & maquillage nude",
        url: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?q=80&w=1200&auto=format&fit=crop",
      },
      {
        label: "Savons artisanaux biologiques",
        url: "https://images.unsplash.com/photo-1607006314644-842271a0b36e?q=80&w=1200&auto=format&fit=crop",
      },
      {
        label: "Parfum de luxe flacon doré",
        url: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=1200&auto=format&fit=crop",
      },
    ],
  },
  {
    id: "tech",
    label: "High-Tech & Gadgets",
    icon: "📱",
    images: [
      {
        label: "Smartphone moderne écran haute définition",
        url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1200&auto=format&fit=crop",
      },
      {
        label: "Casque audio sans fil haute fidélité",
        url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1200&auto=format&fit=crop",
      },
      {
        label: "Montre connectée smartwatch élégante",
        url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1200&auto=format&fit=crop",
      },
      {
        label: "Setup télétravail bureau minimaliste",
        url: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=1200&auto=format&fit=crop",
      },
      {
        label: "Écouteurs sans fil bluetooth boîtier",
        url: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=1200&auto=format&fit=crop",
      },
      {
        label: "Drone caméra haute technologie",
        url: "https://images.unsplash.com/photo-1508614589041-895b88991e3e?q=80&w=1200&auto=format&fit=crop",
      },
    ],
  },
  {
    id: "afro",
    label: "Afrique & Wax / Afro-Chic",
    icon: "🌍",
    images: [
      {
        label: "Femme africaine élégante tissu wax",
        url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1200&auto=format&fit=crop",
      },
      {
        label: "Tissus africains wax imprimés colorés",
        url: "https://images.unsplash.com/photo-1544829099-b9a0c07fad1a?q=80&w=1200&auto=format&fit=crop",
      },
      {
        label: "Artisanat africain et paniers tressés",
        url: "https://images.unsplash.com/photo-1590736969955-71cc94801759?q=80&w=1200&auto=format&fit=crop",
      },
      {
        label: "Portrait beauté noire naturelle éclatante",
        url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=1200&auto=format&fit=crop",
      },
      {
        label: "Bijoux et perles artisanales",
        url: "https://images.unsplash.com/photo-1616035003073-2c1a32230b1b?q=80&w=1200&auto=format&fit=crop",
      },
    ],
  },
  {
    id: "luxury",
    label: "Bijoux, Montres & Luxe",
    icon: "💍",
    images: [
      {
        label: "Bague diamant en or précieux",
        url: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=1200&auto=format&fit=crop",
      },
      {
        label: "Montre de prestige cadran sombre",
        url: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1200&auto=format&fit=crop",
      },
      {
        label: "Collier et pendentif or délicat",
        url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=1200&auto=format&fit=crop",
      },
      {
        label: "Boucles d'oreilles perles et or",
        url: "https://images.unsplash.com/photo-1630019852942-f89202989a59?q=80&w=1200&auto=format&fit=crop",
      },
      {
        label: "Bracelets empilables or & argent",
        url: "https://images.unsplash.com/photo-1611591475870-b74a004eb7c7?q=80&w=1200&auto=format&fit=crop",
      },
    ],
  },
  {
    id: "home",
    label: "Maison & Décoration",
    icon: "🏠",
    images: [
      {
        label: "Salon moderne scandinave épuré",
        url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1200&auto=format&fit=crop",
      },
      {
        label: "Fauteuil design et espace lecture",
        url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=1200&auto=format&fit=crop",
      },
      {
        label: "Céramiques et vases décoratifs",
        url: "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?q=80&w=1200&auto=format&fit=crop",
      },
      {
        label: "Bougie parfumée ambiance chaleureuse",
        url: "https://images.unsplash.com/photo-1603006905003-be475563bc59?q=80&w=1200&auto=format&fit=crop",
      },
      {
        label: "Cuisine design bois et marbre",
        url: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?q=80&w=1200&auto=format&fit=crop",
      },
      {
        label: "Linge de maison en lin naturel",
        url: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?q=80&w=1200&auto=format&fit=crop",
      },
    ],
  },
  {
    id: "sports",
    label: "Sport, Fitness & Santé",
    icon: "🏋️",
    images: [
      {
        label: "Haltères et salle de sport",
        url: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1200&auto=format&fit=crop",
      },
      {
        label: "Tapis de yoga et bien-être",
        url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1200&auto=format&fit=crop",
      },
      {
        label: "Chaussures de running course à pied",
        url: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=1200&auto=format&fit=crop",
      },
      {
        label: "Compléments alimentaires et nutrition",
        url: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?q=80&w=1200&auto=format&fit=crop",
      },
      {
        label: "Tenue de sport fitness moderne",
        url: "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=1200&auto=format&fit=crop",
      },
    ],
  },
  {
    id: "food",
    label: "Food & Épicerie Fine",
    icon: "☕",
    images: [
      {
        label: "Tasse de café latte art crémeux",
        url: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1200&auto=format&fit=crop",
      },
      {
        label: "Fruits frais du marché biologique",
        url: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?q=80&w=1200&auto=format&fit=crop",
      },
      {
        label: "Pâtisseries et chocolats artisanaux",
        url: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=1200&auto=format&fit=crop",
      },
      {
        label: "Thé matcha et infusion détente",
        url: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?q=80&w=1200&auto=format&fit=crop",
      },
      {
        label: "Épices et condiments savoureux",
        url: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=1200&auto=format&fit=crop",
      },
    ],
  },
  {
    id: "abstract",
    label: "Fonds, Textures & Bannières",
    icon: "🎨",
    images: [
      {
        label: "Dégradé pastel doux et moderne",
        url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1200&auto=format&fit=crop",
      },
      {
        label: "Texture marbre blanc et veines subtiles",
        url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1200&auto=format&fit=crop",
      },
      {
        label: "Fond studio épuré neutre",
        url: "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1200&auto=format&fit=crop",
      },
      {
        label: "Ombre douce de plante sur mur beige",
        url: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=1200&auto=format&fit=crop",
      },
      {
        label: "Ondulations créatives et texture soie",
        url: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=1200&auto=format&fit=crop",
      },
    ],
  },
];

interface ImagePickerProps {
  value: string;
  onChange: (val: string) => void;
  compact?: boolean;
}

export default function ImagePicker({ value, onChange, compact }: ImagePickerProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"library" | "upload" | "url">("library");
  const [selectedThemeId, setSelectedThemeId] = useState<string>("fashion");
  const [searchQuery, setSearchQuery] = useState("");
  const [inputUrl, setInputUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2.5 * 1024 * 1024) {
      alert("L'image est trop lourde (max 2.5 Mo). Choisissez une image plus légère ou utilisez la bibliothèque gratuite.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      onChange(reader.result as string);
      setModalOpen(false);
    };
    reader.readAsDataURL(file);
  };

  const allImages = useMemo(() => {
    const list: StockThemeImage[] = [];
    THEMES_IMAGE_LIBRARY.forEach((th) => {
      th.images.forEach((img, i) => {
        list.push({
          id: `${th.id}-${i}`,
          theme: th.id,
          themeLabel: th.label,
          label: img.label,
          url: img.url,
        });
      });
    });
    return list;
  }, []);

  const displayedImages = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      return allImages.filter(
        (img) =>
          img.label.toLowerCase().includes(q) ||
          img.themeLabel.toLowerCase().includes(q)
      );
    }
    return allImages.filter((img) => img.theme === selectedThemeId);
  }, [allImages, searchQuery, selectedThemeId]);

  return (
    <div className="space-y-2">
      {/* ────────────────────────────────────────── */}
      {/*  Inline Preview & Action Buttons           */}
      {/* ────────────────────────────────────────── */}
      {value ? (
        <div className="relative w-full rounded-xl overflow-hidden border border-gray-200 bg-gray-50 group">
          <div className="h-32 w-full bg-gray-100 flex items-center justify-center overflow-hidden">
            <img src={value} alt="Aperçu" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300" />
          </div>
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="px-3 py-1.5 bg-white text-gray-900 rounded-lg text-xs font-bold hover:bg-gray-100 shadow-sm transition-all"
            >
              Changer
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="px-2.5 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 shadow-sm transition-all"
              title="Supprimer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="w-full h-24 border-2 border-dashed border-gray-200 hover:border-emerald-500 rounded-xl bg-gray-50/70 hover:bg-emerald-50/30 flex flex-col items-center justify-center gap-1.5 text-gray-500 hover:text-emerald-700 transition-all cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-full bg-white border border-gray-200 group-hover:border-emerald-300 flex items-center justify-center text-gray-400 group-hover:text-emerald-600 transition-colors shadow-2xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold">Sélectionner une image</span>
          <span className="text-[10px] text-gray-400">Bibliothèque par thèmes ou importation</span>
        </button>
      )}

      {/* Hidden file input for upload */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />

      {/* ────────────────────────────────────────── */}
      {/*  SHOPIFY-STYLE IMAGE LIBRARY MODAL         */}
      {/* ────────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Sélectionner une image
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Images gratuites haute qualité classées par thèmes (comme sur Shopify)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center border-b border-gray-100 px-6 gap-2 bg-gray-50/60 shrink-0">
              <button
                type="button"
                onClick={() => setModalTab("library")}
                className={`py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
                  modalTab === "library"
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Bibliothèque par thèmes
              </button>
              <button
                type="button"
                onClick={() => setModalTab("upload")}
                className={`py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
                  modalTab === "upload"
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Importer depuis mon appareil
              </button>
              <button
                type="button"
                onClick={() => setModalTab("url")}
                className={`py-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
                  modalTab === "url"
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                Lien URL
              </button>
            </div>

            {/* TAB 1: THEMATIC STOCK LIBRARY */}
            {modalTab === "library" && (
              <div className="flex-1 flex min-h-0 overflow-hidden">
                {/* Left Theme Categories */}
                <div className="w-56 border-r border-gray-100 bg-gray-50/40 p-3 space-y-1 overflow-y-auto shrink-0">
                  <span className="block px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Thématiques
                  </span>
                  {THEMES_IMAGE_LIBRARY.map((theme) => {
                    const isSelected = selectedThemeId === theme.id && !searchQuery;
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => {
                          setSelectedThemeId(theme.id);
                          setSearchQuery("");
                        }}
                        className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                          isSelected
                            ? "bg-white text-emerald-800 font-bold shadow-xs border border-emerald-100"
                            : "text-gray-600 hover:bg-gray-100/70"
                        }`}
                      >
                        <span className="text-sm shrink-0">{theme.icon}</span>
                        <span className="truncate">{theme.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Right Image Grid */}
                <div className="flex-1 flex flex-col min-w-0 bg-white">
                  {/* Search Bar */}
                  <div className="p-3 border-b border-gray-100 bg-white">
                    <div className="relative">
                      <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Rechercher une image (ex: robe, crème, montre, parfum, wax...)"
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Images Grid */}
                  <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {displayedImages.map((img) => {
                      const isCurrent = value === img.url;
                      return (
                        <button
                          key={img.id}
                          type="button"
                          onClick={() => {
                            onChange(img.url);
                            setModalOpen(false);
                          }}
                          className={`group relative aspect-[4/3] rounded-xl overflow-hidden border-2 text-left transition-all ${
                            isCurrent
                              ? "border-emerald-600 ring-2 ring-emerald-500 shadow-md"
                              : "border-gray-100 hover:border-emerald-400 hover:shadow-md"
                          }`}
                        >
                          <img
                            src={img.url}
                            alt={img.label}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2.5">
                            <span className="text-[11px] font-semibold text-white leading-tight line-clamp-2">
                              {img.label}
                            </span>
                            <span className="text-[9px] text-emerald-300 mt-0.5">
                              Cliquer pour appliquer
                            </span>
                          </div>

                          {isCurrent && (
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </button>
                      );
                    })}

                    {displayedImages.length === 0 && (
                      <div className="col-span-full py-16 text-center text-gray-400">
                        <FolderOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-xs font-semibold">Aucune image trouvée</p>
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          className="mt-2 text-xs text-emerald-600 hover:underline font-semibold"
                        >
                          Effacer la recherche
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: LOCAL UPLOAD */}
            {modalTab === "upload" && (
              <div className="flex-1 p-8 flex flex-col items-center justify-center bg-gray-50/50">
                <div
                  onClick={() => fileRef.current?.click()}
                  className="w-full max-w-md h-52 border-2 border-dashed border-gray-300 hover:border-emerald-500 rounded-2xl bg-white hover:bg-emerald-50/20 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all shadow-sm"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-bold text-gray-800">
                    Cliquez pour choisir un fichier
                  </span>
                  <span className="text-xs text-gray-400">
                    PNG, JPG, WEBP jusqu'à 2.5 Mo
                  </span>
                </div>
              </div>
            )}

            {/* TAB 3: URL LINK */}
            {modalTab === "url" && (
              <div className="flex-1 p-8 flex flex-col items-center justify-center bg-gray-50/50">
                <div className="w-full max-w-md bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Collez le lien direct vers votre image
                    </label>
                    <input
                      type="url"
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      placeholder="https://example.com/mon-image.jpg"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (inputUrl.trim()) {
                        onChange(inputUrl.trim());
                        setModalOpen(false);
                      }
                    }}
                    disabled={!inputUrl.trim()}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    Appliquer cette image
                  </button>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/70 flex items-center justify-between text-xs text-gray-500 shrink-0">
              <span>{allImages.length} images disponibles libres de droits</span>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-gray-900"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
