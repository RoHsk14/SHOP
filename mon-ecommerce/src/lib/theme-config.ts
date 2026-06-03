import { themes } from "./themes";

export interface ColorSettings {
  primary: string;
  primaryHover: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  accent: string;
}

export interface FontSettings {
  heading: string;
  body: string;
  headingSize: "small" | "normal" | "large";
  baseSize: number;
}

export interface RadiiSettings {
  button: string;
  card: string;
  input: string;
}

export interface GlobalSettings {
  colors: ColorSettings;
  fonts: FontSettings;
  radii: RadiiSettings;
}

export interface LayoutSettings {
  productImageSize: "natural" | "square" | "tall" | "wide";
  productInfoAlignment: "left" | "center";
  cartType: "drawer" | "page";
}

export interface BlockSetting {
  id: string;
  type: string;
  settings: Record<string, any>;
}

export interface SectionSetting {
  id: string;
  type: string;
  settings: Record<string, any>;
  blocks?: BlockSetting[];
  disabled?: boolean;
}

export interface ThemeConfig {
  global: GlobalSettings;
  layout: LayoutSettings;
  sections: SectionSetting[];
}

export type ConfigValue = string | number | boolean | string[] | Record<string, any>;

export interface SettingDefinition {
  key: string;
  label: string;
  type: "text" | "textarea" | "color" | "number" | "boolean" | "select" | "image" | "url";
  default: ConfigValue;
  options?: { label: string; value: string }[];
  placeholder?: string;
}

export function colorsToCSS(colors: ColorSettings): Record<string, string> {
  return {
    "--theme-primary": colors.primary,
    "--theme-primary-hover": colors.primaryHover,
    "--theme-secondary": colors.secondary,
    "--theme-bg": colors.background,
    "--theme-surface": colors.surface,
    "--theme-text": colors.text,
    "--theme-text-muted": colors.textMuted,
    "--theme-border": colors.border,
    "--theme-accent": colors.accent,
  };
}

export function radiiToCSS(radii: RadiiSettings): Record<string, string> {
  return {
    "--theme-radius-button": radii.button,
    "--theme-radius-card": radii.card,
    "--theme-radius-input": radii.input,
  };
}

export function fontsToCSS(fonts: FontSettings): Record<string, string> {
  return {
    "--theme-font-heading": fonts.heading,
    "--theme-font-body": fonts.body,
  };
}

export function themeConfigToCSS(config: ThemeConfig): Record<string, string> {
  return {
    ...colorsToCSS(config.global.colors),
    ...radiiToCSS(config.global.radii),
    ...fontsToCSS(config.global.fonts),
  };
}

export function getDefaultSections(themeId?: string): SectionSetting[] {
  return [
    {
      id: "announcement",
      type: "announcement-bar",
      settings: {
        text: "🚚 Livraison gratuite pour toute commande — Profitez-en !",
        background: "#059669",
        text_color: "#ffffff",
      },
    },
    {
      id: "header",
      type: "header",
      settings: {
        logo_url: "",
        logo_max_width: 140,
        navigation_style: "inline",
        sticky: true,
        menu_items: [
          { label: "Accueil", url: "/" },
          { label: "Produits", url: "/products" },
        ],
      },
    },
    {
      id: "hero",
      type: "slideshow",
      settings: {
        autoplay: false,
        speed: 5000,
        full_width: true,
        height: "medium",
      },
      blocks: [
        {
          id: "hero-slide-1",
          type: "slide",
          settings: {
            image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?q=80&w=2070&auto=format&fit=crop",
            heading: "Bienvenue sur notre boutique",
            subheading: "Découvrez notre sélection de produits soigneusement choisis pour vous",
            button_text: "Voir nos produits",
            button_url: "/products",
            text_color: "#ffffff",
            overlay_opacity: 0.4,
          },
        },
      ],
    },
    {
      id: "featured-products",
      type: "featured-products",
      settings: {
        title: "Nos Produits",
        description: "",
      },
    },
    {
      id: "footer",
      type: "footer",
      settings: {
        show_payment_methods: true,
      },
      blocks: [
        {
          id: "footer_text",
          type: "text",
          settings: {
            title: "À propos",
            content: "Boutique en ligne propulsée par ShopEazy",
            show_social_media: true,
          },
        },
        {
          id: "footer_links",
          type: "links",
          settings: {
            title: "Liens",
            links: [
              { label: "Accueil", url: "/" },
              { label: "Contact", url: "/contact" },
            ],
          },
        },
        {
          id: "footer_newsletter",
          type: "newsletter",
          settings: {
            title: "Newsletter",
            content: "Recevez nos offres exclusives en avant-première",
          },
        },
      ],
    },
  ];
}

export function buildDefaultConfig(themeId?: string): ThemeConfig {
  const theme = themes.find((t) => t.id === themeId) || themes[0];
  return {
    global: {
      colors: {
        primary: theme.colors.primary,
        primaryHover: theme.colors.primaryHover,
        secondary: theme.colors.secondary,
        background: theme.colors.background,
        surface: theme.colors.surface,
        text: theme.colors.text,
        textMuted: theme.colors.textMuted,
        border: theme.colors.border,
        accent: theme.colors.accent,
      },
      fonts: {
        heading: "Inter, system-ui, sans-serif",
        body: "Inter, system-ui, sans-serif",
        headingSize: "small",
        baseSize: 15,
      },
      radii: {
        button: "12px",
        card: "16px",
        input: "10px",
      },
    },
    layout: {
      productImageSize: "natural",
      productInfoAlignment: "center",
      cartType: "drawer",
    },
    sections: getDefaultSections(themeId),
  };
}
