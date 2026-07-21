import type { PageConfig, BrandAssets } from "@/lib/theme-config";

interface Props {
  page?: PageConfig;
  brand?: BrandAssets;
  shopName?: string;
  currentPath?: string;
}

export default function SeoHead({ page, brand, shopName, currentPath }: Props) {
  const seo = page?.seo;
  const pageTitle = seo?.title || page?.name
    ? `${seo?.title || page?.name} - ${shopName || "Boutique"}`
    : shopName || "Boutique";
  const pageDescription = seo?.description || "";
  const ogImage = seo?.ogImage || brand?.ogImage || "";
  const canonical = seo?.canonical;
  const noindex = seo?.noindex;

  return (
    <>
      <title>{pageTitle}</title>
      {pageDescription && <meta name="description" content={pageDescription} />}
      {ogImage && <meta property="og:image" content={ogImage} />}
      {pageTitle && <meta property="og:title" content={pageTitle} />}
      {pageDescription && <meta property="og:description" content={pageDescription} />}
      {canonical && <link rel="canonical" href={canonical} />}
      {noindex && <meta name="robots" content="noindex" />}
      {brand?.themeColor && <meta name="theme-color" content={brand.themeColor} />}
    </>
  );
}
