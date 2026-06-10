import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL requise" }, { status: 400 });
    }

    const html = await fetchUrl(url);
    const $ = cheerio.load(html);

    const extracted = {
      name: "",
      price: "",
      description: "",
      images: [] as string[],
      sizes: [] as string[],
    };

    // ── 1) JSON-LD ──
    const ldScripts: string[] = [];
    $('script[type="application/ld+json"]').each((_, el) => {
      ldScripts.push($(el).html() || "");
    });

    for (const raw of ldScripts) {
      try {
        const parsed = JSON.parse(raw);
        const items = parsed["@graph"] || [parsed];
        for (const item of items) {
          if (item["@type"] === "Product" || item["@type"] === "ProductGroup") {
            extracted.name ||= item.name || "";
            extracted.description ||= item.description || "";
            if (item.offers?.price) {
              extracted.price ||= String(item.offers.price);
            }
            collectImages(item, extracted.images);
          }
        }
      } catch {}
    }

    // ── 2) Open Graph tags ──
    const ogKeys: Record<string, keyof typeof extracted> = {
      "og:title": "name",
      "product:price:amount": "price",
      "og:description": "description",
      "og:image": "images",
    };

    $("meta[property], meta[name]").each((_, el) => {
      const property = $(el).attr("property") || $(el).attr("name") || "";
      const content = $(el).attr("content") || "";
      if (!content) return;

      const key = ogKeys[property];
      if (key === "images") {
        addImage(extracted.images, content);
      } else if (key && !extracted[key]) {
        (extracted[key] as string) = content;
      }
    });

    // ── 3) Shop-specific image gallery scraping ──

    // AliExpress: main image from the gallery div
    $('[class*="gallery"] img, [class*="Gallery"] img, [class*="image"] img, [class*="Image"] img').each((_, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src") || $(el).attr("data-zoom-src") || "";
      if (src && looksLikeRealImage(src)) addImage(extracted.images, normalizeUrl(src, url));
    });

    // All large images in the page (skip icons, logos, thumbnails)
    $("img").each((_, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src") || $(el).attr("data-lazy-src") || "";
      if (!src || !looksLikeRealImage(src)) return;
      const w = parseInt($(el).attr("width") || "0");
      const h = parseInt($(el).attr("height") || "0");
      if (w > 100 && h > 100) {
        addImage(extracted.images, normalizeUrl(src, url));
      }
    });

    // Shopify: product media in a script tag
    $("script").each((_, el) => {
      const text = $(el).html() || "";
      if (text.includes("product.media")) {
        const urls = text.match(/https?:\/\/[^"'\s]+(?:png|jpg|jpeg|gif|webp)[^"'\s]*/gi);
        if (urls) {
          for (const u of urls) {
            if (looksLikeRealImage(u)) addImage(extracted.images, u);
          }
        }
      }
    });

    // ── 4) Extract sizes ──
    // JSON-LD offers with size
    for (const raw of ldScripts) {
      try {
        const parsed = JSON.parse(raw);
        const items = parsed["@graph"] || [parsed];
        for (const item of items) {
          if (item["@type"] === "Product" || item["@type"] === "ProductGroup") {
            if (item.offers && Array.isArray(item.offers)) {
              for (const offer of item.offers) {
                if (offer.name && /^[a-z]+$/i.test(offer.name.replace(/\s/g, ""))) {
                  addSize(extracted.sizes, offer.name.trim());
                }
              }
            }
            // AliExpress / Shopify variant sizes
            if (item.sizes && Array.isArray(item.sizes)) {
              for (const s of item.sizes) addSize(extracted.sizes, typeof s === "string" ? s : s.name || "");
            }
            if (item.variation) {
              const varArr = Array.isArray(item.variation) ? item.variation : [item.variation];
              for (const v of varArr) {
                if (v.name?.toLowerCase().includes("size") && v.value) {
                  const vals = Array.isArray(v.value) ? v.value : [v.value];
                  for (const val of vals) addSize(extracted.sizes, val);
                }
              }
            }
          }
        }
      } catch {}
    }

    // HTML select elements with size options
    $('select[name*="size" i], select[id*="size" i], select[class*="size" i], select[data-type="size"]').each((_, el) => {
      $(el).find("option").each((__, opt) => {
        const raw = $(opt).val();
        const val = typeof raw === "string" ? raw : String(raw?.[0] || $(opt).text());
        if (val && !/^$|select|choose/i.test(val)) addSize(extracted.sizes, val.trim());
      });
    });

    // Button/label elements with size values
    $('[class*="size" i] button, [class*="size" i] label, [class*="Size" i] button, [class*="Size" i] label, [data-size]').each((_, el) => {
      const text = $(el).text().trim();
      if (text && /^[a-z]+\d*$/i.test(text.replace(/\s/g, "")) && text.length <= 5) {
        addSize(extracted.sizes, text.toUpperCase());
      }
    });

    // Pattern match in body text for common sizes
    if (extracted.sizes.length === 0) {
      const bodyText = $("body").text();
      const sizeMatch = bodyText.match(/(?:tailles?|sizes?|dimensions?)\s*[:\s]*([A-Za-z0-9,\s/]+?)(?:\.|$|\n)/i);
      if (sizeMatch) {
        const parts = sizeMatch[1].split(/[,/]/);
        for (const p of parts) {
          const t = p.trim().toUpperCase();
          if (/^(XS|S|M|L|XL|XXL|XXXL|\d+)$/.test(t)) addSize(extracted.sizes, t);
        }
      }
    }

    // ── 5) Twitter card fallback ──
    if (extracted.images.length === 0) {
      $('meta[name="twitter:image"], meta[property="twitter:image"]').each((_, el) => {
        const src = $(el).attr("content");
        if (src) addImage(extracted.images, src);
      });
    }

    // ── 5) Basic HTML fallback ──
    if (!extracted.name) {
      extracted.name = $("title").first().text().trim();
    }
    if (!extracted.description) {
      const metaDesc =
        $('meta[name="description"]').attr("content") ||
        $('meta[property="description"]').attr("content") ||
        "";
      extracted.description = metaDesc;
    }
    if (!extracted.price) {
      // Try multiple price patterns
      const patterns = [
        /(\d[\d\s.,]*)\s*(FCFA|XOF|€|\$|CFA|USD|EUR)/i,
        /(FCFA|XOF|€|\$|CFA|USD|EUR)\s*(\d[\d\s.,]*)/i,
      ];
      const bodyText = $("body").text();
      for (const pattern of patterns) {
        const match = bodyText.match(pattern);
        if (match) {
          extracted.price = match[1].replace(/\s/g, "");
          break;
        }
      }
    }

    // Clean description
    extracted.description = extracted.description.replace(/\s+/g, " ").trim();
    if (extracted.description.length > 5000) {
      extracted.description = extracted.description.slice(0, 5000);
    }

    // De-duplicate and filter images
    extracted.images = [...new Set(extracted.images)];

    return NextResponse.json({ product: extracted });
  } catch (error: any) {
    console.error("Import URL error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de l'analyse de l'URL" },
      { status: 500 }
    );
  }
}

async function fetchUrl(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
      },
      redirect: "follow",
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} — ${res.statusText}`);
    }

    return await res.text();
  } finally {
    clearTimeout(timeout);
  }
}

function looksLikeRealImage(src: string): boolean {
  const lower = src.toLowerCase();
  if (lower.startsWith("data:")) return false;
  if (lower.includes("icon") || lower.includes("logo") || lower.includes("favicon") || lower.includes("avatar") || lower.includes("spacer") || lower.includes("pixel") || lower.includes("transparent") || lower.includes("placeholder") || lower.includes("banner")) return false;
  if (!lower.match(/\.(png|jpg|jpeg|gif|webp|svg)/) && !lower.includes("?_")) return true;
  return true;
}

function addImage(images: string[], src: string) {
  const cleaned = src.split("?")[0];
  if (cleaned && !images.includes(cleaned)) images.push(cleaned);
}

function normalizeUrl(src: string, baseUrl: string): string {
  if (src.startsWith("http")) return src;
  if (src.startsWith("//")) return "https:" + src;
  try {
    return new URL(src, baseUrl).href;
  } catch {
    return src;
  }
}

function collectImages(item: any, images: string[]) {
  if (item.image) {
    const imgs = Array.isArray(item.image) ? item.image : [item.image];
    for (const img of imgs) {
      const src = typeof img === "string" ? img : img.url || "";
      if (src && !images.includes(src)) images.push(src);
    }
  }
}

function addSize(sizes: string[], size: string) {
  const clean = size.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean && !sizes.includes(clean)) sizes.push(clean);
}
