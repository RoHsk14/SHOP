export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    primaryHover: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
    accent: string;
  };
  fonts: {
    heading: string;
    body: string;
  };
  radii: {
    button: string;
    card: string;
    input: string;
  };
  buttonStyle: "pill" | "rounded" | "square";
  cardStyle: "shadow" | "bordered" | "minimal";
  productImageShape: "square" | "portrait" | "landscape";
}

export const themes: Theme[] = [
  {
    id: "classic",
    name: "Classique",
    description: "Propre, professionnel. Idéal pour toutes les boutiques.",
    colors: {
      primary: "#059669",
      primaryHover: "#047857",
      secondary: "#f3f4f6",
      background: "#f9fafb",
      surface: "#ffffff",
      text: "#111827",
      textMuted: "#6b7280",
      border: "#e5e7eb",
      accent: "#dbeafe",
    },
    fonts: { heading: "Inter, sans-serif", body: "Inter, sans-serif" },
    radii: { button: "12px", card: "16px", input: "10px" },
    buttonStyle: "rounded",
    cardStyle: "shadow",
    productImageShape: "square",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Épuré, aéré. Parfait pour les marques modernes.",
    colors: {
      primary: "#111827",
      primaryHover: "#1f2937",
      secondary: "#f9fafb",
      background: "#ffffff",
      surface: "#ffffff",
      text: "#111827",
      textMuted: "#9ca3af",
      border: "#f3f4f6",
      accent: "#f3f4f6",
    },
    fonts: { heading: "Inter, sans-serif", body: "Inter, sans-serif" },
    radii: { button: "4px", card: "4px", input: "4px" },
    buttonStyle: "square",
    cardStyle: "minimal",
    productImageShape: "square",
  },
  {
    id: "bold",
    name: "Audacieux",
    description: "Couleurs vives, typographie large. Pour se démarquer.",
    colors: {
      primary: "#dc2626",
      primaryHover: "#b91c1c",
      secondary: "#fef2f2",
      background: "#fafafa",
      surface: "#ffffff",
      text: "#171717",
      textMuted: "#737373",
      border: "#e5e5e5",
      accent: "#fecaca",
    },
    fonts: { heading: "Inter, sans-serif", body: "Inter, sans-serif" },
    radii: { button: "8px", card: "12px", input: "8px" },
    buttonStyle: "rounded",
    cardStyle: "bordered",
    productImageShape: "portrait",
  },
  {
    id: "nature",
    name: "Nature",
    description: "Tons terreux, ambiance chaleureuse et naturelle.",
    colors: {
      primary: "#65a30d",
      primaryHover: "#4d7c0f",
      secondary: "#f7fee7",
      background: "#fafaf5",
      surface: "#ffffff",
      text: "#292524",
      textMuted: "#78716c",
      border: "#e7e5e4",
      accent: "#d9f99d",
    },
    fonts: { heading: "Georgia, serif", body: "Inter, sans-serif" },
    radii: { button: "9999px", card: "24px", input: "12px" },
    buttonStyle: "pill",
    cardStyle: "shadow",
    productImageShape: "landscape",
  },
  {
    id: "luxury",
    name: "Luxe",
    description: "Élégant, doré. Pour les marques premium.",
    colors: {
      primary: "#b8860b",
      primaryHover: "#a0760a",
      secondary: "#fefce8",
      background: "#fefefe",
      surface: "#ffffff",
      text: "#1c1917",
      textMuted: "#a8a29e",
      border: "#e7e5e4",
      accent: "#fef3c7",
    },
    fonts: { heading: "Playfair Display, Georgia, serif", body: "Inter, sans-serif" },
    radii: { button: "4px", card: "8px", input: "4px" },
    buttonStyle: "square",
    cardStyle: "bordered",
    productImageShape: "portrait",
  },
  {
    id: "playful",
    name: "Fun",
    description: "Couleurs pop, coins arrondis. Pour les marques créatives.",
    colors: {
      primary: "#8b5cf6",
      primaryHover: "#7c3aed",
      secondary: "#f5f3ff",
      background: "#faf5ff",
      surface: "#ffffff",
      text: "#1f2937",
      textMuted: "#9ca3af",
      border: "#e5e7eb",
      accent: "#ede9fe",
    },
    fonts: { heading: "Inter, sans-serif", body: "Inter, sans-serif" },
    radii: { button: "9999px", card: "20px", input: "9999px" },
    buttonStyle: "pill",
    cardStyle: "shadow",
    productImageShape: "square",
  },
];
