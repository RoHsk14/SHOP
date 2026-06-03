import type { SettingDefinition, SectionSetting, BlockSetting } from "./theme-config";

export interface SectionDefinition {
  type: string;
  name: string;
  description: string;
  icon: string;
  category: "header" | "content" | "footer" | "social";
  settings: SettingDefinition[];
  blocks?: {
    type: string;
    name: string;
    settings: SettingDefinition[];
    max?: number;
  }[];
  defaultSettings: Record<string, any>;
  defaultBlocks?: Record<string, any>[];
}

export const sectionRegistry: SectionDefinition[] = [
  {
    type: "announcement-bar",
    name: "Barre d'annonce",
    description: "Bandeau promotionnel en haut de page",
    icon: "Megaphone",
    category: "header",
    settings: [
      { key: "text", label: "Texte", type: "text", default: "🚚 Livraison gratuite pour toute commande — Profitez-en !" },
      { key: "background", label: "Couleur de fond", type: "color", default: "#059669" },
      { key: "text_color", label: "Couleur du texte", type: "color", default: "#ffffff" },
    ],
    defaultSettings: {
      text: "🚚 Livraison gratuite pour toute commande — Profitez-en !",
      background: "#059669",
      text_color: "#ffffff",
    },
  },
  {
    type: "header",
    name: "En-tête",
    description: "Logo, navigation et icônes",
    icon: "Menu",
    category: "header",
    settings: [
      { key: "logo_url", label: "Logo (URL)", type: "image", default: "" },
      { key: "logo_max_width", label: "Largeur max du logo (px)", type: "number", default: 140 },
      {
        key: "navigation_style",
        label: "Style de navigation",
        type: "select",
        default: "inline",
        options: [
          { label: "En ligne", value: "inline" },
          { label: "Centré", value: "center" },
        ],
      },
      { key: "sticky", label: "En-tête fixe", type: "boolean", default: true },
    ],
    defaultSettings: {
      logo_url: "",
      logo_max_width: 140,
      navigation_style: "inline",
      sticky: true,
    },
  },
  {
    type: "slideshow",
    name: "Carrousel",
    description: "Images défilantes avec texte et bouton",
    icon: "Image",
    category: "content",
    settings: [
      { key: "autoplay", label: "Lecture automatique", type: "boolean", default: true },
      { key: "speed", label: "Intervalle (ms)", type: "number", default: 5000 },
      { key: "full_width", label: "Pleine largeur", type: "boolean", default: true },
      { key: "height", label: "Hauteur", type: "select", default: "medium", options: [
        { label: "Petite", value: "small" },
        { label: "Moyenne", value: "medium" },
        { label: "Grande", value: "large" },
      ]},
    ],
    blocks: [
      {
        type: "slide",
        name: "Slide",
        settings: [
          { key: "image", label: "Image", type: "image", default: "" },
          { key: "heading", label: "Titre", type: "text", default: "" },
          { key: "subheading", label: "Sous-titre", type: "text", default: "" },
          { key: "button_text", label: "Texte du bouton", type: "text", default: "" },
          { key: "button_url", label: "Lien du bouton", type: "url", default: "" },
          { key: "text_color", label: "Couleur du texte", type: "color", default: "#ffffff" },
          { key: "overlay_opacity", label: "Opacité du fond", type: "number", default: 0.3 },
        ],
      },
    ],
    defaultSettings: { autoplay: true, speed: 5000, full_width: true, height: "medium" },
    defaultBlocks: [
      {
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop",
        heading: "Nouvelle Collection",
        subheading: "Découvrez nos derniers produits",
        button_text: "Voir la collection",
        button_url: "/products",
        text_color: "#ffffff",
        overlay_opacity: 0.3,
      },
    ],
  },
  {
    type: "featured-products",
    name: "Produits vedettes",
    description: "Grille des produits de la boutique",
    icon: "Package",
    category: "content",
    settings: [
      { key: "title", label: "Titre", type: "text", default: "Nos Produits" },
      { key: "description", label: "Description", type: "textarea", default: "" },
    ],
    defaultSettings: { title: "Nos Produits", description: "" },
  },
  {
    type: "text-with-image",
    name: "Texte et image",
    description: "Texte avec image côte à côte",
    icon: "FileText",
    category: "content",
    settings: [
      { key: "image", label: "Image", type: "image", default: "" },
      { key: "title", label: "Titre", type: "text", default: "" },
      { key: "content", label: "Contenu", type: "textarea", default: "" },
      { key: "button_text", label: "Texte du bouton", type: "text", default: "" },
      { key: "button_url", label: "Lien du bouton", type: "url", default: "" },
      { key: "image_position", label: "Position de l'image", type: "select", default: "left", options: [
        { label: "Gauche", value: "left" },
        { label: "Droite", value: "right" },
      ]},
    ],
    defaultSettings: {
      image: "",
      title: "Notre Histoire",
      content: "Découvrez notre passion pour les produits de qualité.",
      button_text: "En savoir plus",
      button_url: "#",
      image_position: "left",
    },
  },
  {
    type: "video",
    name: "Vidéo",
    description: "Section vidéo (YouTube, Vimeo)",
    icon: "Video",
    category: "content",
    settings: [
      { key: "url", label: "URL de la vidéo", type: "url", default: "" },
      { key: "title", label: "Titre", type: "text", default: "" },
      { key: "full_width", label: "Pleine largeur", type: "boolean", default: false },
      { key: "autoplay", label: "Lecture automatique", type: "boolean", default: false },
    ],
    defaultSettings: { url: "", title: "", full_width: false, autoplay: false },
  },
  {
    type: "newsletter",
    name: "Newsletter",
    description: "Formulaire d'inscription à la newsletter",
    icon: "Mail",
    category: "content",
    settings: [
      { key: "title", label: "Titre", type: "text", default: "Restons connectés" },
      { key: "content", label: "Description", type: "textarea", default: "Recevez nos offres exclusives en avant-première" },
      { key: "background", label: "Couleur de fond", type: "color", default: "#f3f4f6" },
      { key: "button_text", label: "Texte du bouton", type: "text", default: "S'inscrire" },
    ],
    defaultSettings: {
      title: "Restons connectés",
      content: "Recevez nos offres exclusives en avant-première",
      background: "#f3f4f6",
      button_text: "S'inscrire",
    },
  },
  {
    type: "footer",
    name: "Pied de page",
    description: "Pied de page avec blocs de contenu",
    icon: "Layout",
    category: "footer",
    settings: [
      { key: "show_payment_methods", label: "Afficher les moyens de paiement", type: "boolean", default: true },
    ],
    blocks: [
      {
        type: "text",
        name: "Texte",
        settings: [
          { key: "title", label: "Titre", type: "text", default: "" },
          { key: "content", label: "Contenu", type: "textarea", default: "" },
          { key: "show_social_media", label: "Afficher les réseaux sociaux", type: "boolean", default: false },
        ],
      },
      {
        type: "links",
        name: "Liens",
        settings: [
          { key: "title", label: "Titre", type: "text", default: "Liens" },
        ],
      },
      {
        type: "newsletter",
        name: "Newsletter",
        max: 1,
        settings: [
          { key: "title", label: "Titre", type: "text", default: "Newsletter" },
          { key: "content", label: "Description", type: "textarea", default: "" },
        ],
      },
    ],
    defaultSettings: { show_payment_methods: true },
    defaultBlocks: [
      { type: "text", settings: { title: "À propos", content: "Boutique en ligne propulsée par ShopEazy", show_social_media: true } },
      { type: "links", settings: { title: "Liens" } },
      { type: "newsletter", settings: { title: "Newsletter", content: "Recevez nos offres exclusives" } },
    ],
  },
];

export function getSectionDefinition(type: string): SectionDefinition | undefined {
  return sectionRegistry.find((s) => s.type === type);
}

export function createDefaultSection(type: string): SectionSetting | null {
  const def = getSectionDefinition(type);
  if (!def) return null;
  return {
    id: `${type}-${Date.now()}`,
    type,
    settings: { ...def.defaultSettings },
    blocks: def.defaultBlocks?.map((b, i) => ({
      id: `${type}-block-${i}`,
      type: def.blocks?.[i]?.type || "text",
      settings: { ...b.settings },
    })),
  };
}
