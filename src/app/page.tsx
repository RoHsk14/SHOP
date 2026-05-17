import ProductShowcase from "@/components/ProductShowcase";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

interface ProductPageProps {
  searchParams: Promise<{ product?: string }>
}

export default async function ProductPage({ searchParams }: ProductPageProps) {
  const params = await searchParams;
  const productId = params.product;

  const { data: products } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (!products || products.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Aucun produit disponible</h1>
          <p className="text-gray-500 text-sm">Veuillez ajouter un produit dans l&apos;admin.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-green-700 text-white text-center py-2.5 text-sm font-medium tracking-wide">
        🚚 Livraison rapide · Paiement à la livraison · Satisfaction garantie
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <ProductShowcase
          products={products}
          initialProductId={productId}
        />
      </div>
    </main>
  );
}
