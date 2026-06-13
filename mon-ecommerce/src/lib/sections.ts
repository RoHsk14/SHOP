import type { SettingDefinition, SectionSetting, BlockSetting } from "./theme-config";

export interface SectionDefinition {
  type: string;
  name: string;
  description: string;
  icon: string;
  category: "header" | "content" | "footer" | "social" | "advanced";
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
        { label: "Petite (300px)", value: "small" },
        { label: "Moyenne (500px)", value: "medium" },
        { label: "Grande (700px)", value: "large" },
        { label: "Plein écran", value: "fullscreen" },
      ]},
      { key: "text_position", label: "Position du texte", type: "select", default: "center", options: [
        { label: "Centré", value: "center" },
        { label: "Gauche", value: "left" },
        { label: "Droite", value: "right" },
        { label: "Bas gauche", value: "bottom-left" },
        { label: "Bas droite", value: "bottom-right" },
      ]},
      { key: "text_max_width", label: "Largeur max du texte (px)", type: "number", default: 600 },
      { key: "arrow_style", label: "Style des flèches", type: "select", default: "outline", options: [
        { label: "Contour", value: "outline" },
        { label: "Plein", value: "filled" },
        { label: "Aucune", value: "none" },
      ]},
      { key: "show_dots", label: "Indicateurs (dots)", type: "boolean", default: true },
    ],
    blocks: [
      {
        type: "slide",
        name: "Slide",
        settings: [
          { key: "image", label: "Image", type: "image", default: "" },
          { key: "image_mobile", label: "Image mobile (optionnelle)", type: "image", default: "" },
          { key: "heading", label: "Titre", type: "text", default: "" },
          { key: "heading_size", label: "Taille du titre", type: "select", default: "large", options: [
            { label: "Petit", value: "small" },
            { label: "Moyen", value: "medium" },
            { label: "Grand", value: "large" },
            { label: "Très grand", value: "xlarge" },
          ]},
          { key: "subheading", label: "Sous-titre", type: "text", default: "" },
          { key: "button_text", label: "Texte du bouton", type: "text", default: "" },
          { key: "button_url", label: "Lien du bouton", type: "url", default: "" },
          { key: "button_style", label: "Style du bouton", type: "select", default: "solid", options: [
            { label: "Plein", value: "solid" },
            { label: "Contour", value: "outline" },
            { label: "Sans fond", value: "ghost" },
          ]},
          { key: "button_color", label: "Couleur du bouton", type: "color", default: "#ffffff" },
          { key: "text_color", label: "Couleur du texte", type: "color", default: "#ffffff" },
          { key: "text_align", label: "Alignement du texte", type: "select", default: "center", options: [
            { label: "Gauche", value: "left" },
            { label: "Centré", value: "center" },
            { label: "Droite", value: "right" },
          ]},
          { key: "overlay_color", label: "Couleur du fond overlay", type: "color", default: "#000000" },
          { key: "overlay_opacity", label: "Opacité du fond overlay", type: "number", default: 0.3 },
        ],
      },
    ],
    defaultSettings: {
      autoplay: true,
      speed: 5000,
      full_width: true,
      height: "medium",
      text_position: "center",
      text_max_width: 600,
      arrow_style: "outline",
      show_dots: true,
    },
    defaultBlocks: [
      {
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop",
        heading: "Nouvelle Collection",
        heading_size: "large",
        subheading: "Découvrez nos derniers produits",
        button_text: "Voir la collection",
        button_url: "/products",
        button_style: "solid",
        button_color: "#ffffff",
        text_color: "#ffffff",
        text_align: "center",
        overlay_color: "#000000",
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
  {
    type: "spacer",
    name: "Espacement",
    description: "Espacement vertical personnalisable",
    icon: "Minus",
    category: "advanced",
    settings: [
      { key: "height", label: "Hauteur (px)", type: "number", default: 60 },
      { key: "mobile_height", label: "Hauteur mobile (px)", type: "number", default: 40 },
    ],
    defaultSettings: { height: 60, mobile_height: 40 },
  },
  {
    type: "custom-html",
    name: "HTML personnalisé",
    description: "Code HTML/CSS/JS libre",
    icon: "Code",
    category: "advanced",
    settings: [
      { key: "html", label: "Contenu HTML", type: "textarea", default: "" },
      { key: "full_width", label: "Pleine largeur", type: "boolean", default: false },
    ],
    defaultSettings: { html: "", full_width: false },
  },
  /* — Produits (grid) — */
  {
    type: "product-search",
    name: "Recherche produits",
    description: "Barre de recherche dans les produits",
    icon: "Search",
    category: "content",
    settings: [
      { key: "placeholder", label: "Texte indicatif", type: "text", default: "Rechercher un produit..." },
    ],
    defaultSettings: { placeholder: "Rechercher un produit..." },
  },
  {
    type: "product-filters",
    name: "Filtres produits",
    description: "Filtres par prix et tri",
    icon: "SlidersHorizontal",
    category: "content",
    settings: [
      { key: "show_sort", label: "Afficher le tri", type: "boolean", default: true },
      { key: "show_price_range", label: "Afficher filtre prix", type: "boolean", default: true },
    ],
    defaultSettings: { show_sort: true, show_price_range: true },
  },
  {
    type: "product-grid",
    name: "Grille produits",
    description: "Grille des produits filtrés",
    icon: "Package",
    category: "content",
    settings: [],
    defaultSettings: {},
  },
  /* — Produit (détail) — */
  {
    type: "product-breadcrumbs",
    name: "Fil d'Ariane produit",
    description: "Fil d'Ariane pour la page produit",
    icon: "ArrowLeft",
    category: "content",
    settings: [],
    defaultSettings: {},
  },
  {
    type: "product-gallery",
    name: "Galerie images",
    description: "Images du produit avec lightbox",
    icon: "Image",
    category: "content",
    settings: [
      { key: "lightbox", label: "Lightbox au clic", type: "boolean", default: true },
      { key: "layout", label: "Disposition", type: "select", default: "sidebar", options: [
        { label: "Colonne latérale", value: "sidebar" },
        { label: "Grille 2×2", value: "grid" },
        { label: "Pleine largeur", value: "fullwidth" },
        { label: "Stacked", value: "stacked" },
      ]},
      { key: "thumbnails_position", label: "Position des miniatures", type: "select", default: "bottom", options: [
        { label: "En bas", value: "bottom" },
        { label: "À gauche", value: "left" },
        { label: "Masquées", value: "hidden" },
      ]},
      { key: "sticky", label: "Galerie fixe au scroll", type: "boolean", default: false },
      { key: "zoom", label: "Zoom au survol", type: "boolean", default: true },
    ],
    defaultSettings: { lightbox: true, layout: "sidebar", thumbnails_position: "bottom", sticky: false, zoom: true },
  },
  {
    type: "product-info",
    name: "Infos produit",
    description: "Nom, prix, description, variantes, ajout au panier",
    icon: "FileText",
    category: "content",
    settings: [
      { key: "show_title", label: "Afficher le titre", type: "boolean", default: true },
      { key: "show_price", label: "Afficher le prix", type: "boolean", default: true },
      { key: "show_description", label: "Afficher la description", type: "boolean", default: true },
      { key: "show_variants", label: "Afficher les variantes (couleurs/taille)", type: "boolean", default: true },
      { key: "show_quantity", label: "Afficher le sélecteur de quantité", type: "boolean", default: true },
      { key: "show_badges", label: "Afficher les badges (promo, nouveau)", type: "boolean", default: true },
      { key: "show_wishlist", label: "Afficher le bouton favori", type: "boolean", default: true },
      { key: "description_mode", label: "Mode description", type: "select", default: "inline", options: [
        { label: "En ligne", value: "inline" },
        { label: "Accordéon", value: "accordion" },
        { label: "Onglets", value: "tabs" },
      ]},
      { key: "description_placement", label: "Placement description", type: "select", default: "inline", options: [
        { label: "Dans la carte info", value: "inline" },
        { label: "En dessous (pleine largeur)", value: "below" },
      ]},
      { key: "description_title", label: "Titre de la description", type: "text", default: "Description" },
      { key: "description_bg", label: "Fond de la description", type: "color", default: "" },
      { key: "button_style", label: "Style bouton ajout panier", type: "select", default: "full", options: [
        { label: "Pleine largeur", value: "full" },
        { label: "Compact", value: "compact" },
        { label: "Sans bordure", value: "ghost" },
      ]},
      { key: "image_position", label: "Position de l'image", type: "select", default: "left", options: [
        { label: "À gauche", value: "left" },
        { label: "À droite", value: "right" },
      ]},
    ],
    defaultSettings: {
      show_title: true, show_price: true, show_description: true, show_variants: true,
      show_quantity: true, show_badges: true, show_wishlist: true,
      description_mode: "inline", description_placement: "inline",
      description_title: "Description", description_bg: "",
      button_style: "full", image_position: "left",
    },
  },
  {
    type: "product-accordion",
    name: "Accordéon produit",
    description: "Blocs repliables (description, livraison, retours, ...)",
    icon: "AlignJustify",
    category: "content",
    settings: [],
    blocks: [
      {
        type: "panel",
        name: "Panneau",
        settings: [
          { key: "title", label: "Titre", type: "text", default: "" },
          { key: "content", label: "Contenu", type: "textarea", default: "" },
          { key: "icon", label: "Icône", type: "select", default: "none", options: [
            { label: "Aucune", value: "none" },
            { label: "Informations", value: "info" },
            { label: "Livraison", value: "truck" },
            { label: "Retour", value: "refresh" },
            { label: "Paiement", value: "credit-card" },
          ]},
          { key: "open_by_default", label: "Ouvert par défaut", type: "boolean", default: false },
        ],
      },
    ],
    defaultSettings: {},
    defaultBlocks: [
      { settings: { title: "Description", content: "", icon: "info", open_by_default: true } },
      { settings: { title: "Livraison", content: "Livraison sous 3-5 jours ouvrés.", icon: "truck", open_by_default: false } },
      { settings: { title: "Retours", content: "Retour gratuit sous 30 jours.", icon: "refresh", open_by_default: false } },
    ],
  },
  {
    type: "product-messaging",
    name: "Message de confiance",
    description: "Badges de livraison, paiement sécurisé, garantie",
    icon: "Shield",
    category: "content",
    settings: [
      { key: "show_delivery", label: "Livraison offerte", type: "boolean", default: false },
      { key: "delivery_text", label: "Texte livraison", type: "text", default: "" },
      { key: "show_payment", label: "Paiement sécurisé", type: "boolean", default: false },
      { key: "payment_text", label: "Texte paiement", type: "text", default: "" },
      { key: "show_returns", label: "Retour gratuit", type: "boolean", default: false },
      { key: "returns_text", label: "Texte retour", type: "text", default: "" },
      { key: "show_guarantee", label: "Garantie", type: "boolean", default: false },
      { key: "guarantee_text", label: "Texte garantie", type: "text", default: "Garantie 1 an incluse" },
      { key: "layout", label: "Disposition", type: "select", default: "row", options: [
        { label: "Ligne", value: "row" },
        { label: "Colonne", value: "column" },
        { label: "Grille", value: "grid" },
      ]},
    ],
    defaultSettings: {
      show_delivery: false, delivery_text: "",
      show_payment: false, payment_text: "",
      show_returns: false, returns_text: "",
      show_guarantee: false, guarantee_text: "Garantie 1 an incluse",
      layout: "row",
    },
  },
  {
    type: "product-sharing",
    name: "Partage social",
    description: "Boutons de partage (Facebook, X, LinkedIn, ...)",
    icon: "Share2",
    category: "content",
    settings: [
      { key: "show_facebook", label: "Facebook", type: "boolean", default: true },
      { key: "show_twitter", label: "X (Twitter)", type: "boolean", default: true },
      { key: "show_linkedin", label: "LinkedIn", type: "boolean", default: true },
      { key: "show_share", label: "Bouton partage natif", type: "boolean", default: true },
      { key: "label", label: "Étiquette", type: "text", default: "Partager" },
    ],
    defaultSettings: { show_facebook: true, show_twitter: true, show_linkedin: true, show_share: true, label: "Partager" },
  },
  {
    type: "bundle-offer",
    name: "Offre groupée",
    description: "Affiche les offres groupées et promotions",
    icon: "Tag",
    category: "content",
    settings: [
      { key: "title", label: "Titre", type: "text", default: "Offres groupées" },
      { key: "subtitle", label: "Sous-titre", type: "text", default: "Profitez de nos offres spéciales" },
      { key: "layout", label: "Disposition", type: "select", default: "list", options: [
        { label: "Liste", value: "list" },
        { label: "Grille", value: "grid" },
      ]},
    ],
    defaultSettings: {
      title: "Offres groupées",
      subtitle: "Profitez de nos offres spéciales",
      layout: "list",
    },
  },
  {
    type: "product-sticky-cart",
    name: "Panier fixe",
    description: "Barre d'achat fixe en bas de l'écran",
    icon: "ShoppingCart",
    category: "content",
    settings: [
      { key: "show_image", label: "Afficher l'image", type: "boolean", default: true },
      { key: "show_price", label: "Afficher le prix", type: "boolean", default: true },
      { key: "button_text", label: "Texte du bouton", type: "text", default: "Ajouter au panier" },
    ],
    defaultSettings: { show_image: true, show_price: true, button_text: "Ajouter au panier" },
  },
  {
    type: "thank-you",
    name: "Merci",
    description: "Page de remerciement après commande (page système)",
    icon: "CheckCircle",
    category: "content",
    settings: [],
    defaultSettings: {},
  },
  {
    type: "wishlist-page",
    name: "Wishlist",
    description: "Affiche la liste des favoris (page système)",
    icon: "Heart",
    category: "content",
    settings: [],
    defaultSettings: {},
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
