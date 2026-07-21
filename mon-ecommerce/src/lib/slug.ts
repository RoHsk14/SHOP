const CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

function randomSlug(length = 6): string {
  return Array.from({ length }, () =>
    CHARS[Math.floor(Math.random() * CHARS.length)]
  ).join("");
}

export async function generateUniqueShopSlug(
  supabase: { from: (table: string) => any },
  length = 6,
  maxAttempts = 20
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const slug = randomSlug(length);
    const { data } = await supabase
      .from("settings")
      .select("id")
      .eq("shop_slug", slug)
      .maybeSingle();
    if (!data) return slug;
  }
  return randomSlug(length + 4);
}

export function slugify(text?: string | null): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}
