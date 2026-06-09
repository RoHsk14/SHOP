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
  link?: string;
  buttonText?: string;
  success?: string;
  warning?: string;
  error?: string;
  headerBg?: string;
  headerText?: string;
  footerBg?: string;
  footerText?: string;
}

export interface FontSettings {
  heading: string;
  body: string;
  headingWeight?: number;
  bodyWeight?: number;
  headingLetterSpacing?: string;
  bodyLetterSpacing?: string;
  headingLineHeight?: string;
  bodyLineHeight?: string;
  headingTransform?: "none" | "uppercase" | "capitalize" | "lowercase";
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

export interface BackgroundSettings {
  type: "color" | "gradient" | "image";
  color: string;
  gradient?: string;
  image?: string;
  repeat?: "no-repeat" | "repeat" | "repeat-x" | "repeat-y";
  size?: "cover" | "contain" | "auto";
  position?: string;
  opacity?: number;
}

export type SocialPlatform =
  | "facebook" | "instagram" | "twitter" | "tiktok"
  | "youtube" | "pinterest" | "linkedin" | "whatsapp"
  | "snapchat" | "telegram" | "messenger";

export type SocialLinks = Partial<Record<SocialPlatform, string>>;

export interface BrandAssets {
  logo?: string;
  logoMaxWidth?: number;
  favicon?: string;
  ogImage?: string;
  themeColor?: string;
}

export interface CookieSettings {
  enabled: boolean;
  message?: string;
  buttonText?: string;
  declineText?: string;
  position?: "bottom" | "top";
  background?: string;
  textColor?: string;
  buttonBg?: string;
  buttonTextColor?: string;
}

export interface CustomCss {
  desktop?: string;
  mobile?: string;
}

export interface NavMenuItem {
  id: string;
  label: string;
  url: string;
  openInNewTab?: boolean;
  children?: NavMenuItem[];
}

export interface NavMenu {
  id: string;
  name: string;
  items: NavMenuItem[];
}

export interface LayoutSettings {
  productImageSize: "natural" | "square" | "tall" | "wide";
  productInfoAlignment: "left" | "center";
  cartType: "drawer" | "page";
  containerWidth?: number;
  sectionSpacing?: "compact" | "normal" | "spacious";
  productsPerRow?: 2 | 3 | 4;
  showSearch?: boolean;
  showCart?: boolean;
  showBreadcrumbs?: boolean;
  showFilters?: boolean;
  showWishlist?: boolean;
  showBadges?: boolean;
  stickyAddToCart?: boolean;
}

export interface BackToTopSettings {
  enabled: boolean;
  position: "left" | "right";
  backgroundColor: string;
  iconColor: string;
  borderRadius: string;
}

export interface NewsletterPopupSettings {
  enabled: boolean;
  title: string;
  content: string;
  image: string;
  delay: number;
  exitIntent: boolean;
  backgroundColor: string;
  textColor: string;
  buttonBg: string;
  buttonText: string;
}

export interface AnnouncementMessage {
  id: string;
  text: string;
  url?: string;
  background?: string;
  text_color?: string;
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
  menus?: NavMenu[];
  social?: SocialLinks;
  brand?: BrandAssets;
  background?: BackgroundSettings;
  cookie?: CookieSettings;
  customCss?: CustomCss;
  backToTop?: BackToTopSettings;
  newsletterPopup?: NewsletterPopupSettings;
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
    "--theme-link": colors.link || colors.primary,
    "--theme-button-text": colors.buttonText || "#ffffff",
    "--theme-success": colors.success || "#059669",
    "--theme-warning": colors.warning || "#d97706",
    "--theme-error": colors.error || "#dc2626",
    "--theme-header-bg": colors.headerBg || colors.surface,
    "--theme-header-text": colors.headerText || colors.text,
    "--theme-footer-bg": colors.footerBg || colors.surface,
    "--theme-footer-text": colors.footerText || colors.textMuted,
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
  const vars: Record<string, string> = {
    "--theme-font-heading": fonts.heading,
    "--theme-font-body": fonts.body,
  };
  if (fonts.headingWeight) vars["--theme-font-heading-weight"] = String(fonts.headingWeight);
  if (fonts.bodyWeight) vars["--theme-font-body-weight"] = String(fonts.bodyWeight);
  if (fonts.headingLetterSpacing) vars["--theme-heading-letter-spacing"] = fonts.headingLetterSpacing;
  if (fonts.bodyLetterSpacing) vars["--theme-body-letter-spacing"] = fonts.bodyLetterSpacing;
  if (fonts.headingLineHeight) vars["--theme-heading-line-height"] = fonts.headingLineHeight;
  if (fonts.bodyLineHeight) vars["--theme-body-line-height"] = fonts.bodyLineHeight;
  if (fonts.headingTransform) vars["--theme-heading-transform"] = fonts.headingTransform;
  return vars;
}

export function backgroundToCSS(bg?: BackgroundSettings): Record<string, string> {
  if (!bg || bg.type === "color") return {};
  if (bg.type === "gradient" && bg.gradient) {
    return { "--theme-bg-image": bg.gradient };
  }
  if (bg.type === "image" && bg.image) {
    const parts = [
      `url(${bg.image})`,
      bg.repeat || "no-repeat",
      bg.size || "cover",
      bg.position || "center",
    ];
    return { "--theme-bg-image": parts.join(" ") };
  }
  return {};
}

export function themeConfigToCSS(config: ThemeConfig): Record<string, string> {
  return {
    ...colorsToCSS(config.global.colors),
    ...radiiToCSS(config.global.radii),
    ...fontsToCSS(config.global.fonts),
    ...backgroundToCSS(config.background),
    "--theme-container-width": config.layout?.containerWidth ? `${config.layout.containerWidth}px` : "1200px",
    "--theme-section-spacing": config.layout?.sectionSpacing === "compact" ? "2rem" : config.layout?.sectionSpacing === "spacious" ? "6rem" : "4rem",
  };
}

export function getDefaultSections(themeId?: string): SectionSetting[] {
  return [
    {
      id: "announcement",
      type: "announcement-bar",
      settings: {
        speed: 4000,
        background: "#059669",
        messages: [
          { id: "a1", text: "🚚 Livraison gratuite pour toute commande — Profitez-en !", url: "" },
          { id: "a2", text: "🎉 Nouveautés chaque semaine — Découvrez nos derniers produits", url: "/products" },
          { id: "a3", text: "💳 Paiement sécurisé — 100% satisfait ou remboursé", url: "" },
        ],
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
        link: theme.colors.primary,
        buttonText: "#ffffff",
        success: "#059669",
        warning: "#d97706",
        error: "#dc2626",
        headerBg: theme.colors.surface,
        headerText: theme.colors.text,
        footerBg: theme.colors.surface,
        footerText: theme.colors.textMuted,
      },
      fonts: {
        heading: "Inter, system-ui, sans-serif",
        body: "Inter, system-ui, sans-serif",
        headingWeight: 700,
        bodyWeight: 400,
        headingLetterSpacing: "0",
        bodyLetterSpacing: "0",
        headingLineHeight: "1.2",
        bodyLineHeight: "1.6",
        headingTransform: "none",
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
      containerWidth: 1200,
      sectionSpacing: "normal",
      productsPerRow: 3,
      showSearch: true,
      showCart: true,
      showBreadcrumbs: true,
      showFilters: true,
      showWishlist: true,
      showBadges: true,
      stickyAddToCart: true,
    },
    menus: [
      {
        id: "main-menu",
        name: "Menu principal",
        items: [
          { id: "m1", label: "Accueil", url: "/" },
          { id: "m2", label: "Produits", url: "/products" },
        ],
      },
    ],
    social: {
      facebook: "",
      instagram: "",
      twitter: "",
      tiktok: "",
      youtube: "",
      pinterest: "",
      linkedin: "",
      whatsapp: "",
    },
    brand: {
      logo: "",
      logoMaxWidth: 140,
      favicon: "",
      ogImage: "",
      themeColor: theme.colors.primary,
    },
    background: {
      type: "color",
      color: theme.colors.background,
    },
    cookie: {
      enabled: false,
      message: "Ce site utilise des cookies pour améliorer votre expérience.",
      buttonText: "Accepter",
      declineText: "Refuser",
      position: "bottom",
      background: "#1f2937",
      textColor: "#ffffff",
      buttonBg: theme.colors.primary,
      buttonTextColor: "#ffffff",
    },
    customCss: {
      desktop: "",
      mobile: "",
    },
    backToTop: {
      enabled: true,
      position: "right",
      backgroundColor: "#1f2937",
      iconColor: "#ffffff",
      borderRadius: "9999px",
    },
    newsletterPopup: {
      enabled: false,
      title: "Restez informé",
      content: "Inscrivez-vous pour recevoir nos offres exclusives et nouveautés.",
      image: "",
      delay: 10,
      exitIntent: true,
      backgroundColor: "#ffffff",
      textColor: "#111827",
      buttonBg: "#059669",
      buttonText: "#ffffff",
    },
    sections: getDefaultSections(themeId),
  };
}
