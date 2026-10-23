"use client";

import { useState, useMemo } from "react";
import {
  X,
  Search,
  ShoppingBag,
  Sparkles,
  Layers,
  Star,
  Zap,
  HelpCircle,
  Megaphone,
  Image as ImageIcon,
  Clock,
  ShieldCheck,
  Mail,
  Film,
  MessageSquare,
  FileText,
  Percent,
} from "lucide-react";
import { sectionRegistry, createDefaultSection, SectionDefinition } from "@/lib/sections";
import type { SectionSetting } from "@/lib/theme-config";

interface AddSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSection: (section: SectionSetting) => void;
}

const SECTION_CATEGORIES = [
  { id: "all", label: "Toutes les sections" },
  { id: "products", label: "🛍️ Produits & Vente" },
  { id: "banners", label: "🖼️ Bannières & Médias" },
  { id: "trust", label: "⭐ Confiance & Avis" },
  { id: "conversion", label: "⚡ Conversion & Urgence" },
  { id: "structure", label: "🛠️ Structure & Avancé" },
];

const SECTION_METADATA: Record<
  string,
  {
    category: "products" | "banners" | "trust" | "conversion" | "structure";
    icon: any;
    color: string;
    description: string;
    badge?: string;
  }
> = {
  "featured-products": {
    category: "products",
    icon: ShoppingBag,
    color: "bg-emerald-50 text-emerald-600",
    description: "Mettez en avant vos produits phares avec prix, remises et bouton d'achat direct.",
    badge: "Populaire",
  },
  "featured-collection": {
    category: "products",
    icon: Layers,
    color: "bg-emerald-50 text-emerald-600",
    description: "Présentez une sélection groupée de produits sous un thème spécifique.",
  },
  "product-grid": {
    category: "products",
    icon: ShoppingBag,
    color: "bg-emerald-50 text-emerald-600",
    description: "Grille complète de produits avec pagination, filtres et badges de stock.",
  },
  "bundle-offer": {
    category: "products",
    icon: Percent,
    color: "bg-amber-50 text-amber-600",
    description: "Augmentez le panier moyen avec des réductions par lot (1 acheté, 2 achetés -10%, etc.).",
    badge: "Boost Panier",
  },
  "product-search": {
    category: "products",
    icon: Search,
    color: "bg-emerald-50 text-emerald-600",
    description: "Barre de recherche interactive pour trouver instantanément un article.",
  },
  slideshow: {
    category: "banners",
    icon: ImageIcon,
    color: "bg-blue-50 text-blue-600",
    description: "Grand carrousel d'images plein écran avec textes dynamiques et boutons d'action.",
    badge: "Recommandé",
  },
  "cta-banner": {
    category: "banners",
    icon: Sparkles,
    color: "bg-blue-50 text-blue-600",
    description: "Bannière visuelle percutante pour annoncer un lancement ou une offre irrésistible.",
  },
  "text-with-image": {
    category: "banners",
    icon: FileText,
    color: "bg-blue-50 text-blue-600",
    description: "Mettez en valeur votre histoire, les ingrédients ou les avantages uniques de votre marque.",
  },
  video: {
    category: "banners",
    icon: Film,
    color: "bg-blue-50 text-blue-600",
    description: "Intégrez une vidéo de démonstration produit depuis YouTube ou fichier direct.",
  },
  testimonials: {
    category: "trust",
    icon: Star,
    color: "bg-amber-50 text-amber-600",
    description: "Affichez les témoignages avec notes 5 étoiles, photos et retours clients réels.",
    badge: "Essentiel",
  },
  "features-grid": {
    category: "trust",
    icon: ShieldCheck,
    color: "bg-emerald-50 text-emerald-600",
    description: "Rassurez vos visiteurs : Livraison rapide, Paiement à la livraison, Service client 7j/7.",
  },
  "stats-bar": {
    category: "trust",
    icon: Zap,
    color: "bg-purple-50 text-purple-600",
    description: "Chiffres marquants pour prouver votre sérieux (+10 000 colis livrés, 99% satisfaits).",
  },
  faq: {
    category: "trust",
    icon: HelpCircle,
    color: "bg-indigo-50 text-indigo-600",
    description: "Foire aux questions en accordéon pour lever tous les doutes avant commande.",
  },
  "countdown-timer": {
    category: "conversion",
    icon: Clock,
    color: "bg-red-50 text-red-600",
    description: "Créez une urgence d'achat immédiate avec un compte à rebours pour vente flash.",
    badge: "Urgence",
  },
  "announcement-bar": {
    category: "conversion",
    icon: Megaphone,
    color: "bg-emerald-50 text-emerald-600",
    description: "Bandeau d'alerte en haut de page pour annoncer la livraison gratuite ou un code promo.",
  },
  newsletter: {
    category: "conversion",
    icon: Mail,
    color: "bg-teal-50 text-teal-600",
    description: "Capturez les numéros WhatsApp et emails des prospects pour relances marketing.",
  },
  "contact-form": {
    category: "structure",
    icon: MessageSquare,
    color: "bg-gray-100 text-gray-700",
    description: "Formulaire simple pour recevoir directement les demandes de vos clients.",
  },
  spacer: {
    category: "structure",
    icon: Layers,
    color: "bg-gray-100 text-gray-700",
    description: "Espace vide configurable en hauteur pour aérer et équilibrer votre page.",
  },
  "custom-html": {
    category: "structure",
    icon: FileText,
    color: "bg-gray-100 text-gray-700",
    description: "Intégrez du code HTML personnalisé ou un widget externe.",
  },
};

export default function AddSectionModal({
  isOpen,
  onClose,
  onAddSection,
}: AddSectionModalProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const availableSections = useMemo(() => {
    // Only content/standalone sections are offered in add modal (header/footer are in template slots)
    const exclude = ["header", "footer", "product-breadcrumbs", "product-gallery", "product-info", "product-accordion", "product-messaging", "product-sharing", "thank-you", "wishlist-page", "product-filters"];
    return sectionRegistry.filter((s) => !exclude.includes(s.type));
  }, []);

  const filteredSections = useMemo(() => {
    return availableSections.filter((def) => {
      const meta = SECTION_METADATA[def.type] || {
        category: "structure",
        description: def.description,
      };
      const matchesCategory =
        selectedCategory === "all" || meta.category === selectedCategory;
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        def.name.toLowerCase().includes(q) ||
        meta.description.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [availableSections, selectedCategory, search]);

  if (!isOpen) return null;

  const handleSelect = (def: SectionDefinition) => {
    const newSection = createDefaultSection(def.type);
    if (newSection) {
      onAddSection(newSection);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Ajouter une section
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Choisissez parmi des sections prêtes à l'emploi inspirées des meilleures boutiques Shopify
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Categories */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une section (ex: Carrousel, Avis, Promo, FAQ...)"
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-sm"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {SECTION_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? "bg-gray-900 text-white shadow-sm"
                    : "bg-white text-gray-600 border border-gray-200/80 hover:bg-gray-100"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Section Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredSections.map((def) => {
            const meta = SECTION_METADATA[def.type] || {
              category: "structure",
              icon: Layers,
              color: "bg-gray-100 text-gray-700",
              description: def.description,
            };
            const Icon = meta.icon;

            return (
              <button
                key={def.type}
                onClick={() => handleSelect(def)}
                className="group relative flex items-start gap-3.5 p-4 rounded-xl border border-gray-200 bg-white hover:border-emerald-500 hover:shadow-md transition-all text-left"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${meta.color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-900 group-hover:text-emerald-600 transition-colors truncate">
                      {def.name}
                    </h3>
                    {meta.badge && (
                      <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded-md uppercase tracking-wider shrink-0">
                        {meta.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                    {meta.description}
                  </p>
                </div>
                <div className="absolute right-3.5 top-4 w-6 h-6 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all text-xs font-bold">
                  +
                </div>
              </button>
            );
          })}

          {filteredSections.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-400">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm font-medium">Aucune section ne correspond à votre recherche</p>
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("all");
                }}
                className="mt-2 text-xs text-emerald-600 hover:underline font-semibold"
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/70 flex items-center justify-between text-xs text-gray-500">
          <span>{filteredSections.length} section(s) disponible(s)</span>
          <span className="text-gray-400">Cliquez sur une section pour l'insérer sur votre page</span>
        </div>
      </div>
    </div>
  );
}
