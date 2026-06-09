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
    };

    // 1) JSON-LD — most reliable structured data
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
            if (item.image) {
              const imgs = Array.isArray(item.image) ? item.image : [item.image];
              for (const img of imgs) {
                const src = typeof img === "string" ? img : img.url || "";
                if (src && !extracted.images.includes(src)) extracted.images.push(src);
              }
            }
          }
        }
      } catch {}
    }

    // 2) Open Graph tags
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
        if (!extracted.images.includes(content)) extracted.images.push(content);
      } else if (key && !extracted[key]) {
        (extracted[key] as string) = content;
      }
    });

    // 3) Twitter card fallback
    if (!extracted.images.length) {
      $('meta[name="twitter:image"], meta[property="twitter:image"]').each((_, el) => {
        const src = $(el).attr("content");
        if (src && !extracted.images.includes(src)) extracted.images.push(src);
      });
    }

    // 4) Basic HTML fallback
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
      const pricePattern = /(\d[\d\s.,]*)\s*(FCFA|XOF|€|\$|CFA)/i;
      const bodyText = $("body").text();
      const match = bodyText.match(pricePattern);
      if (match) extracted.price = match[1].replace(/\s/g, "");
    }

    // Clean up description: strip excessive whitespace, truncate
    extracted.description = extracted.description.replace(/\s+/g, " ").trim();
    if (extracted.description.length > 500) {
      extracted.description = extracted.description.slice(0, 500) + "...";
    }

    // Limit images to first 5
    extracted.images = extracted.images.slice(0, 5);

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
  const timeout = setTimeout(() => controller.abort(), 15_000);

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

    const text = await res.text();
    return text;
  } finally {
    clearTimeout(timeout);
  }
}
