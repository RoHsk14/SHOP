import Papa from "papaparse";
import { slugify } from "./slug";

export interface ParsedImportProduct {
  id: string; // Temporary unique identifier for UI manipulation
  handle: string;
  name: string;
  slug: string;
  description: string;
  price: number | null;
  comparePrice: number | null;
  sku: string | null;
  track_stock: boolean;
  stock_quantity: number | null;
  images: string[];
  sizes: string[];
  status: "active" | "inactive";
  category: string | null;
  tags: string | null;
  vendor: string | null;
  rawRowsCount: number;
  selected?: boolean;
}

export type ProductImportFormat = "shopify_afrospy" | "standard" | "unknown";

export interface ProductImportAnalysis {
  format: ProductImportFormat;
  formatLabel: string;
  totalRows: number;
  totalProducts: number;
  products: ParsedImportProduct[];
  warnings: string[];
  errors: string[];
}

/**
 * Nettoie les emojis d'une chaîne de caractères (optionnel)
 */
export function removeEmojis(text: string): string {
  if (!text) return "";
  return text
    .replace(
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Nettoie et extrait un prix numérique valide à partir de n'importe quel format
 * (ex: "19900", "19 900", "19,900.00", "19.900,00", "19900 FCFA", etc.)
 */
export function parsePrice(val: any): number | null {
  if (val === undefined || val === null || val === "") return null;
  if (typeof val === "number") return isNaN(val) ? null : val;

  let s = String(val).trim();
  // Supprime les devises courantes et lettres
  s = s.replace(/(?:FCFA|XOF|CFA|EUR|USD|€|\$)/gi, "").trim();

  // Garde uniquement chiffres, virgules et points
  s = s.replace(/[^\d.,]/g, "");
  if (!s) return null;

  if (s.includes(",") && s.includes(".")) {
    if (s.lastIndexOf(".") > s.lastIndexOf(",")) {
      // Format américain 1,999.50 -> 1999.50
      s = s.replace(/,/g, "");
    } else {
      // Format européen 1.999,50 -> 1999.50
      s = s.replace(/\./g, "").replace(",", ".");
    }
  } else if (s.includes(",")) {
    const parts = s.split(",");
    // Si 3 chiffres après la virgule (ex: 19,900), c'est un séparateur de milliers
    if (parts.length === 2 && parts[1].length === 3) {
      s = parts[0] + parts[1];
    } else {
      s = s.replace(",", ".");
    }
  }

  const num = parseFloat(s);
  return isNaN(num) ? null : Math.round(num * 100) / 100;
}

/**
 * Extrait toutes les URLs d'images d'un contenu HTML (ex: <img src="...">)
 */
export function extractImagesFromHtml(html: string): string[] {
  if (!html) return [];
  const matches = html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi);
  const imgs: string[] = [];
  for (const m of matches) {
    const url = m[1]?.trim();
    if (url && (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("//"))) {
      const normalized = url.startsWith("//") ? "https:" + url : url;
      if (!imgs.includes(normalized)) {
        imgs.push(normalized);
      }
    }
  }
  return imgs;
}

/**
 * Fonction intermédiaire principale pour parser et normaliser les fichiers CSV de produits,
 * compatible avec Shopify et les exports Afro-Spy.
 */
export function parseShopifyOrStandardCsv(
  csvInput: string | Record<string, any>[]
): ProductImportAnalysis {
  let rows: Record<string, any>[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  if (typeof csvInput === "string") {
    if (!csvInput.trim()) {
      return {
        format: "unknown",
        formatLabel: "CSV vide",
        totalRows: 0,
        totalProducts: 0,
        products: [],
        warnings: [],
        errors: ["Le fichier CSV est vide."],
      };
    }
    const parseRes = Papa.parse(csvInput, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (h) => h.trim(),
    });
    rows = parseRes.data as Record<string, any>[];
    if (parseRes.errors && parseRes.errors.length > 0) {
      for (const err of parseRes.errors.slice(0, 5)) {
        warnings.push(`Ligne ${err.row}: ${err.message}`);
      }
    }
  } else if (Array.isArray(csvInput)) {
    rows = csvInput;
  }

  if (rows.length === 0) {
    return {
      format: "unknown",
      formatLabel: "Aucune ligne",
      totalRows: 0,
      totalProducts: 0,
      products: [],
      warnings,
      errors: ["Aucune donnée valide trouvée dans le CSV."],
    };
  }

  // Détection du format basé sur les en-têtes
  const firstRow = rows[0] || {};
  const headers = Object.keys(firstRow).map((k) => k.toLowerCase());

  const hasShopifyHeaders =
    headers.some((h) => h === "handle") ||
    headers.some((h) => h === "title") ||
    headers.some((h) => h.includes("body (html)")) ||
    headers.some((h) => h.includes("variant price")) ||
    headers.some((h) => h.includes("image src"));

  const isStandardFormat =
    !hasShopifyHeaders &&
    (headers.includes("name") || headers.includes("nom") || headers.includes("titre"));

  const format: ProductImportFormat = hasShopifyHeaders
    ? "shopify_afrospy"
    : isStandardFormat
    ? "standard"
    : "unknown";

  const formatLabel =
    format === "shopify_afrospy"
      ? "Export Afro-Spy / Shopify"
      : format === "standard"
      ? "Format ShopEazy standard"
      : "Format CSV générique";

  const productMap = new Map<string, ParsedImportProduct>();
  let currentGroupKey: string | null = null;
  let counter = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // Trouver les valeurs en ignorant la casse des clés
    const getVal = (...keys: string[]): string => {
      for (const k of keys) {
        if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== "") {
          return String(row[k]).trim();
        }
        // Recherche insensible à la casse
        const lowerK = k.toLowerCase();
        const found = Object.keys(row).find((rk) => rk.toLowerCase() === lowerK);
        if (found && row[found] !== undefined && row[found] !== null && String(row[found]).trim() !== "") {
          return String(row[found]).trim();
        }
      }
      return "";
    };

    const handle = getVal("Handle", "handle");
    const title = getVal("Title", "title", "name", "nom", "titre");
    const bodyHtml = getVal("Body (HTML)", "body_html", "Body", "description", "Description");
    const rawPrice = getVal("Variant Price", "price", "prix", "Price");
    const comparePriceRaw = getVal("Variant Compare At Price", "compare_at_price", "compare_price");
    const sku = getVal("Variant SKU", "sku", "SKU", "Code");
    const rawQty = getVal("Variant Inventory Qty", "stock_quantity", "stock", "quantite");
    const imgSrc = getVal("Image Src", "image_src", "images", "Image", "image");
    const variantImg = getVal("Variant Image", "variant_image");
    const statusVal = getVal("Status", "status", "statut").toLowerCase();
    const publishedVal = getVal("Published", "published").toLowerCase();
    const vendor = getVal("Vendor", "vendor", "fournisseur");
    const category = getVal("Type", "Product Category", "category", "categorie");
    const tags = getVal("Tags", "tags");

    // Clé de regroupement :
    // - Si format Shopify/Afro-Spy, grouper par "handle". Si pas de handle, utiliser title ou l'actuel.
    // - Si format standard, chaque ligne avec un nom est un nouveau produit.
    let groupKey = "";
    if (format === "shopify_afrospy") {
      if (handle) {
        groupKey = handle;
      } else if (title) {
        groupKey = "prod_" + slugify(title);
      } else if (currentGroupKey) {
        groupKey = currentGroupKey;
      } else {
        continue; // Ligne vide sans contexte
      }
    } else {
      if (title) {
        counter++;
        groupKey = `prod_${counter}_${slugify(title)}`;
      } else if (currentGroupKey) {
        groupKey = currentGroupKey;
      } else {
        continue;
      }
    }

    currentGroupKey = groupKey;

    if (!productMap.has(groupKey)) {
      counter++;
      const productName = title || handle || `Produit ${counter}`;
      const baseSlug = handle ? slugify(handle) : slugify(productName);

      const isActive =
        statusVal === "active" ||
        statusVal === "actif" ||
        publishedVal === "true" ||
        publishedVal === "1" ||
        (!statusVal && !publishedVal);

      productMap.set(groupKey, {
        id: `import_${counter}_${Date.now()}`,
        handle: handle || baseSlug,
        name: productName,
        slug: baseSlug || `produit-${counter}`,
        description: bodyHtml || "",
        price: parsePrice(rawPrice),
        comparePrice: parsePrice(comparePriceRaw),
        sku: sku || null,
        track_stock: true,
        stock_quantity: rawQty ? parseInt(rawQty, 10) : null,
        images: [],
        sizes: [],
        status: isActive ? "active" : "inactive",
        category: category || null,
        tags: tags || null,
        vendor: vendor || null,
        rawRowsCount: 0,
        selected: true,
      });
    }

    const prod = productMap.get(groupKey)!;
    prod.rawRowsCount++;

    // Mettre à jour titre ou description si absent initialement
    if (!prod.name && title) prod.name = title;
    if (!prod.description && bodyHtml) prod.description = bodyHtml;
    if (prod.price === null && rawPrice) prod.price = parsePrice(rawPrice);
    if (prod.comparePrice === null && comparePriceRaw) prod.comparePrice = parsePrice(comparePriceRaw);
    if (!prod.sku && sku) prod.sku = sku;
    if (prod.stock_quantity === null && rawQty) prod.stock_quantity = parseInt(rawQty, 10);
    if (!prod.category && category) prod.category = category;
    if (!prod.tags && tags) prod.tags = tags;
    if (!prod.vendor && vendor) prod.vendor = vendor;

    // Ajouter image depuis la colonne Image Src ou Variant Image
    const candidates = [imgSrc, variantImg];
    for (const rawCandidate of candidates) {
      if (!rawCandidate) continue;
      // Peut contenir des URLs séparées par virgule
      const parts = rawCandidate.includes(",") ? rawCandidate.split(",") : [rawCandidate];
      for (let p of parts) {
        p = p.trim();
        if (p.startsWith("//")) p = "https:" + p;
        if (p.startsWith("http://") || p.startsWith("https://")) {
          if (!prod.images.includes(p)) {
            prod.images.push(p);
          }
        }
      }
    }

    // Extraction des options / tailles de variantes
    for (let optIdx = 1; optIdx <= 3; optIdx++) {
      const optName = getVal(`Option${optIdx} Name`, `option${optIdx}_name`).toLowerCase();
      const optVal = getVal(`Option${optIdx} Value`, `option${optIdx}_value`);
      if (optVal && optVal !== "Default Title" && optVal !== "Titre par défaut") {
        if (!prod.sizes.includes(optVal)) {
          // Si c'est une taille, une option ou une couleur
          if (
            optName.includes("size") ||
            optName.includes("taille") ||
            optName.includes("couleur") ||
            optName.includes("color") ||
            optName.includes("title") ||
            !optName
          ) {
            prod.sizes.push(optVal);
          }
        }
      }
    }
  }

  // Étape complémentaire : extraire les images embarquées dans la description HTML si nécessaire
  for (const prod of productMap.values()) {
    if (prod.description) {
      const embeddedImages = extractImagesFromHtml(prod.description);
      for (const imgUrl of embeddedImages) {
        if (!prod.images.includes(imgUrl)) {
          prod.images.push(imgUrl);
        }
      }
    }
  }

  const products = Array.from(productMap.values());

  return {
    format,
    formatLabel,
    totalRows: rows.length,
    totalProducts: products.length,
    products,
    warnings,
    errors,
  };
}

/**
 * Prépare les produits importés pour l'insertion directe dans la base de données (Supabase / Hasura).
 * Assure des slugs uniques et ne conserve que les colonnes compatibles avec la table products.
 */
export function prepareProductsForDatabase(
  products: ParsedImportProduct[],
  shopSlug: string,
  existingSlugs: string[] = []
): Record<string, any>[] {
  const usedSlugs = new Set<string>(existingSlugs.map((s) => s.toLowerCase()));

  return products.map((p) => {
    let baseSlug = slugify(p.handle || p.name);
    if (!baseSlug) baseSlug = "produit";

    let uniqueSlug = baseSlug;
    let counter = 2;
    while (usedSlugs.has(uniqueSlug.toLowerCase())) {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }
    usedSlugs.add(uniqueSlug.toLowerCase());

    const record: Record<string, any> = {
      name: p.name.trim(),
      slug: uniqueSlug,
      shop_slug: shopSlug,
      description: p.description ? p.description.trim() : null,
      price: p.price ?? null,
      sku: p.sku ? p.sku.trim() : null,
      track_stock: p.track_stock,
      stock_quantity: p.track_stock && p.stock_quantity !== null ? p.stock_quantity : null,
      images: p.images && p.images.length > 0 ? p.images : null,
      status: p.status || "active",
      category: p.category || null,
      tags: p.tags || null,
    };

    return record;
  });
}
