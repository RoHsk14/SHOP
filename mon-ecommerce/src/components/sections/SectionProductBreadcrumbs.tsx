"use client";

import { useShop } from "@/lib/shop-context";
import { useProduct } from "@/lib/product-context";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function SectionProductBreadcrumbs() {
  const { subdomain } = useShop();
  const { product, loading } = useProduct();

  if (loading || !product) return null;

  return (
    <div className="mx-auto px-4 sm:px-6 pt-4 sm:pt-6" style={{ maxWidth: "var(--theme-container-width, 1200px)" }}>
      <Breadcrumbs items={[
        { label: "Produits", href: `/boutiques/${subdomain}/products` },
        { label: product.name },
      ]} />
    </div>
  );
}
