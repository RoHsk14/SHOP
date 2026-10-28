"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import Papa from "papaparse";
import {
  Pencil,
  Trash2,
  Package,
  ExternalLink,
  ChevronRight,
  Search,
  Download,
  Upload,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Globe,
  Flame,
  Check,
  CheckSquare,
  Square,
  Eye,
  EyeOff,
  Sparkles,
  Layers,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { slugify } from "@/lib/slug";
import RichTextEditor from "@/components/RichTextEditor";
import {
  parseShopifyOrStandardCsv,
  prepareProductsForDatabase,
  removeEmojis,
  ParsedImportProduct,
  ProductImportAnalysis,
} from "@/lib/shopify-product-import";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  sku: string | null;
  track_stock: boolean;
  stock_quantity: number | null;
  images: string[] | null;
  sizes: string[] | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type ProductForm = {
  name: string;
  description: string;
  price: string;
  sku: string;
  track_stock: boolean;
  stock_quantity: string;
  images: string[];
  sizes: string[];
};

const initialForm: ProductForm = {
  name: "",
  description: "",
  price: "",
  sku: "",
  track_stock: true,
  stock_quantity: "",
  images: [],
  sizes: [],
};

export default function ProductsPage() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(initialForm);
  const [uploading, setUploading] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ name: string; price: string; description: string; images: string[]; sizes: string[] } | null>(null);

  // États d'import CSV (fonction intermédiaire compatible Afro-Spy & Shopify)
  const [csvPreviewModalOpen, setCsvPreviewModalOpen] = useState(false);
  const [csvAnalysis, setCsvAnalysis] = useState<ProductImportAnalysis | null>(null);
  const [csvParsedProducts, setCsvParsedProducts] = useState<ParsedImportProduct[]>([]);
  const [cleanEmojisInImport, setCleanEmojisInImport] = useState(false);
  const [csvImporting, setCsvImporting] = useState(false);
  const [expandedDescId, setExpandedDescId] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("id, name, description, price, sku, track_stock, stock_quantity, images, status, created_at, updated_at")
      .eq("shop_slug", subdomain)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Erreur produits:", error);
      toast.error("Erreur de chargement des produits: " + (error?.message || "Erreur inconnue"));
    } else {
      setProducts((data || []).map((p: any) => ({ ...p, sizes: [] })));
    }
    setLoading(false);
  }, [subdomain]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setUploading(true);
    const newImages: string[] = [...form.images];
    try {
      const { data: bucket } = await supabase.storage.getBucket("products");
      if (!bucket) {
        await supabase.storage.createBucket("products", { public: true });
      }
      for (const file of Array.from(files)) {
        const fileName = `${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
          .from("products")
          .upload(fileName, file);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage
          .from("products")
          .getPublicUrl(data.path);
        newImages.push(publicUrl);
      }
      setForm(prev => ({ ...prev, images: newImages }));
      toast.success("Images téléchargées");
    } catch (error) {
      toast.error("Erreur de téléchargement d'image");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let slug = slugify(form.name);
      const editingId = editingProduct?.id;
      const { data: existing } = await supabase
        .from("products")
        .select("id, slug")
        .eq("slug", slug)
        .eq("shop_slug", subdomain);
      if (existing && existing.length > 0 && existing.some((p: any) => p.id !== editingId)) {
        let i = 2;
        while (true) {
          const testSlug = `${slug}-${i}`;
          const { data: dupes } = await supabase
            .from("products")
            .select("id")
            .eq("slug", testSlug)
            .eq("shop_slug", subdomain);
          if (!dupes || dupes.length === 0 || dupes.every((p: any) => p.id === editingId)) {
            slug = testSlug;
            break;
          }
          i++;
        }
      }
      const productData: Record<string, any> = {
        name: form.name,
        slug,
        shop_slug: subdomain,
        description: form.description || null,
        price: form.price ? parseFloat(form.price) : null,
        sku: form.sku || null,
        track_stock: form.track_stock,
        stock_quantity: form.track_stock && form.stock_quantity ? parseInt(form.stock_quantity) : null,
        images: form.images.length > 0 ? form.images : null,
      };
      if (!editingProduct) {
        productData.status = "active";
      }
      if (editingProduct) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("shop_slug", subdomain)
          .eq("id", editingProduct.id);
        if (error) throw error;
        toast.success("Produit mis à jour");
      } else {
        const { error } = await supabase
          .from("products")
          .insert([productData]);
        if (error) throw error;
        toast.success("Produit créé");
      }
      setModalOpen(false);
      setEditingProduct(null);
      setForm(initialForm);
      fetchProducts();
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error?.message || "Erreur de sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description || "",
      price: product.price ? product.price.toString() : "",
      sku: product.sku || "",
      track_stock: product.track_stock,
      stock_quantity: product.stock_quantity ? product.stock_quantity.toString() : "",
      images: product.images || [],
      sizes: product.sizes || [],
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce produit ?")) return;
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("shop_slug", subdomain)
      .eq("id", id);
    if (error) {
      console.error("Delete error:", error);
      toast.error(error.message || "Erreur de suppression");
    } else {
      toast.success("Produit supprimé");
      fetchProducts();
    }
  };

  const handleToggleStatus = async (product: Product) => {
    const newStatus = product.status === "active" ? "inactive" : "active";
    const { error } = await supabase
      .from("products")
      .update({ status: newStatus })
      .eq("shop_slug", subdomain)
      .eq("id", product.id);
    if (error) {
      toast.error("Erreur de mise à jour du statut");
    } else {
      toast.success(newStatus === "active" ? "Produit activé" : "Produit désactivé");
      fetchProducts();
    }
  };

  // Fonction intermédiaire d'analyse et d'import CSV (Shopify / Afro-Spy / Standard)
  const handleCsvFileSelect = async (file: File) => {
    try {
      const text = await file.text();
      const analysis = parseShopifyOrStandardCsv(text);

      if (analysis.errors && analysis.errors.length > 0) {
        toast.error(analysis.errors[0]);
        return;
      }

      if (analysis.products.length === 0) {
        toast.error("Aucun produit détecté dans le fichier CSV");
        return;
      }

      setCsvAnalysis(analysis);
      setCsvParsedProducts(analysis.products);
      setCsvPreviewModalOpen(true);
      toast.success(
        `${analysis.products.length} produit(s) analysé(s) (${analysis.formatLabel})`
      );
    } catch (err: any) {
      console.error("Erreur lecture CSV:", err);
      toast.error(err?.message || "Impossible de lire le fichier CSV");
    }
  };

  const handleToggleProductSelection = (id: string) => {
    setCsvParsedProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p))
    );
  };

  const handleToggleSelectAllCsv = (selectAll: boolean) => {
    setCsvParsedProducts((prev) =>
      prev.map((p) => ({ ...p, selected: selectAll }))
    );
  };

  const handleUpdateParsedProduct = (
    id: string,
    updates: Partial<ParsedImportProduct>
  ) => {
    setCsvParsedProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const handleOpenInFullEditor = (product: ParsedImportProduct) => {
    const finalName = cleanEmojisInImport ? removeEmojis(product.name) : product.name;
    setForm({
      name: finalName,
      description: product.description || "",
      price: product.price !== null ? String(product.price) : "",
      sku: product.sku || "",
      track_stock: product.track_stock,
      stock_quantity: product.stock_quantity !== null ? String(product.stock_quantity) : "",
      images: product.images || [],
      sizes: product.sizes || [],
    });
    setEditingProduct(null);
    setCsvPreviewModalOpen(false);
    setModalOpen(true);
  };

  const handleConfirmCsvImport = async () => {
    const selected = csvParsedProducts.filter((p) => p.selected !== false);
    if (selected.length === 0) {
      toast.error("Veuillez sélectionner au moins un produit à importer");
      return;
    }

    setCsvImporting(true);
    try {
      // Slugs existants pour la boutique afin d'éviter les collisions
      const { data: existing } = await supabase
        .from("products")
        .select("slug")
        .eq("shop_slug", subdomain);

      const existingSlugs = (existing || [])
        .map((p: any) => p.slug)
        .filter(Boolean);

      const productsToPrepare = selected.map((p) => ({
        ...p,
        name: cleanEmojisInImport ? removeEmojis(p.name) : p.name,
      }));

      const dbRecords = prepareProductsForDatabase(
        productsToPrepare,
        subdomain,
        existingSlugs
      );

      const { error } = await supabase.from("products").insert(dbRecords);
      if (error) throw error;

      toast.success(`${dbRecords.length} produit(s) importé(s) avec succès !`);
      setCsvPreviewModalOpen(false);
      setCsvParsedProducts([]);
      setCsvAnalysis(null);
      setCsvFile(null);
      fetchProducts();
    } catch (err: any) {
      console.error("Erreur insertion produits CSV:", err);
      toast.error(err?.message || "Erreur lors de l'enregistrement des produits");
    } finally {
      setCsvImporting(false);
    }
  };

  const toggleSelectProduct = (id: string) => {
    setSelectedProducts(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedProducts(prev =>
      prev.length === products.length ? [] : products.map(p => p.id)
    );
  };

  const handleCsvExport = () => {
    const productsToExport = selectedProducts.length > 0
      ? products.filter(p => selectedProducts.includes(p.id))
      : products;
    const rows = productsToExport.map(product => ({
      name: product.name,
      description: product.description || "",
      price: product.price || "",
      sku: product.sku || "",
      track_stock: product.track_stock,
      stock_quantity: product.stock_quantity || "",
      images: product.images ? product.images.join(", ") : ""
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `produits_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success(`${productsToExport.length} produit(s) exporté(s)`);
  };

  const handleDownloadTemplate = () => {
    const sampleRow: any = {
      name: "Exemple Produit",
      description: "Description exemple",
      price: "5000",
      sku: "SKU123",
      track_stock: "true",
      stock_quantity: "100",
      images: "https://example.com/image1.jpg, https://example.com/image2.jpg"
    };
    const csv = Papa.unparse([sampleRow]);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "modele_produits.csv";
    link.click();
    toast.success("Modèle téléchargé");
  };

  const isActive = (p: Product) => p.status === "active";

  const filteredProducts = products.filter(p => {
    if (statusFilter === "active") return isActive(p);
    if (statusFilter === "inactive") return !isActive(p) || p.stock_quantity === null;
    return true;
  });

  const activeCount = products.filter(p => isActive(p)).length;
  const inactiveCount = products.length - activeCount;
  const lowStockCount = products.filter(p => p.stock_quantity !== null && p.stock_quantity > 0 && p.stock_quantity <= 5).length;

  return (
    <>
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        {/* Breadcrumb + Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
              <span>Accueil</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-gray-600 font-medium">Produits</span>
            </nav>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Produits</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={handleDownloadTemplate} className="px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all">
              <Download className="w-3.5 h-3.5" /> Modèle
            </button>
            <label className="px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 cursor-pointer text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all">
              <Upload className="w-3.5 h-3.5" /> Importer CSV
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setCsvFile(file);
                    await handleCsvFileSelect(file);
                    e.target.value = "";
                  }
                }}
              />
            </label>
            {csvParsedProducts.length > 0 && (
              <button
                type="button"
                onClick={() => setCsvPreviewModalOpen(true)}
                className="px-3 py-2 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 text-amber-800 rounded-xl hover:from-amber-100 hover:to-orange-100 text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Aperçu import ({csvParsedProducts.length})</span>
              </button>
            )}
            <a
              href="https://afro-spy.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-300 text-amber-900 rounded-xl hover:from-amber-500/20 hover:to-orange-500/20 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all shadow-xs group"
              title="Trouvez des produits gagnants & espionnez les publicités qui cartonnent en Afrique sur Afro-Spy"
            >
              <Flame className="w-3.5 h-3.5 text-amber-600 group-hover:scale-110 transition-transform" />
              <span>Produits gagnants (Afro-Spy)</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-amber-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
            <button
              onClick={() => {
                setImportUrl("");
                setImportResult(null);
                setImportModalOpen(true);
              }}
              className="px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all"
            >
              <Globe className="w-3.5 h-3.5" /> Importer d'un site
            </button>
            <button
              onClick={() => {
                setEditingProduct(null);
                setForm(initialForm);
                setModalOpen(true);
              }}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-all shadow-sm shadow-emerald-200"
            >
              <Plus className="w-3.5 h-3.5" /> Ajouter
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          {[
            { label: "Total produits", value: products.length.toString(), change: `${products.length} enregistré${products.length > 1 ? 's' : ''}`, up: true },
            { label: "Actifs", value: activeCount.toString(), change: `${Math.round((activeCount / Math.max(1, products.length)) * 100)}% du total`, up: true },
            { label: "Stock faible", value: lowStockCount.toString(), change: `≤ 5 unités`, up: lowStockCount === 0 },
          ].map((s, i) => (
            <div key={i}
              className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 hover:shadow-lg hover:border-gray-300 transition-all duration-200 animate-slide-up"
              style={{ animationDelay: `${i * 0.06}s` }}>
              <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 font-medium truncate">{s.label}</p>
              <p className="text-base sm:text-lg font-bold text-gray-900">{s.value}</p>
              <p className={`text-[10px] mt-0.5 truncate flex items-center gap-0.5 ${s.up ? 'text-emerald-600' : 'text-red-500'}`}>
                {s.up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                {s.change}
              </p>
            </div>
          ))}
        </div>

        {/* Filter Tabs + CSV Export */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-200 p-1 overflow-x-auto shadow-sm">
            {[
              { value: "all" as const, label: "Tous", count: products.length },
              { value: "active" as const, label: "Actifs", count: activeCount },
              { value: "inactive" as const, label: "Inactifs", count: inactiveCount },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${statusFilter === tab.value
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                  }`}
              >
                {tab.label}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusFilter === tab.value ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                  }`}>{tab.count}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={selectedProducts.length === products.length && products.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
              {selectedProducts.length > 0 ? `${selectedProducts.length} sélectionné(s)` : "Tout sélectionner"}
            </label>
            <button
              onClick={handleCsvExport}
              disabled={products.length === 0}
              className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-xs font-medium transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              <Download className="w-3 h-3" /> Exporter {selectedProducts.length > 0 ? `(${selectedProducts.length})` : ""}
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-emerald-600 rounded-full animate-spin"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          products.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-10 text-center max-w-2xl mx-auto shadow-xs animate-fade-in">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center mx-auto mb-4 shadow-md shadow-emerald-500/20">
                <Package className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">Votre catalogue est encore vide</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                Commencez par ajouter vos premiers articles ou explorez les produits gagnants du moment en Afrique.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-3 max-w-lg mx-auto text-left">
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setForm(initialForm);
                    setModalOpen(true);
                  }}
                  className="p-4 rounded-xl border-2 border-emerald-500/30 bg-emerald-50/40 hover:bg-emerald-50/70 hover:border-emerald-500/50 transition-all group"
                >
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-800 mb-1">
                    <Plus className="w-4 h-4 text-emerald-600" />
                    <span>Créer un produit</span>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Ajoutez manuellement ou importez un lien e-commerce / CSV.
                  </p>
                </button>

                <a
                  href="https://afro-spy.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-xl border border-amber-300 bg-gradient-to-br from-amber-50/80 to-orange-50/40 hover:border-amber-400 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 font-bold text-sm text-amber-900">
                      <Flame className="w-4 h-4 text-amber-600" />
                      <span>Idées sur Afro-Spy</span>
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-amber-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Découvrez les pubs Facebook et produits qui cartonnent en Afrique.
                  </p>
                </a>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Aucun produit trouvé</p>
              <p className="text-gray-400 text-sm mt-1">
                Aucun produit {statusFilter}
              </p>
            </div>
          )
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden sm:block bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="px-4 py-3 w-10">
                        <input type="checkbox" checked={selectedProducts.length === filteredProducts.length} onChange={toggleSelectAll} className="w-4 h-4 text-emerald-600 rounded" />
                      </th>
                      <th className="text-left px-4 py-3 text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">Produit</th>
                      <th className="text-left px-4 py-3 text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">Prix</th>
                      <th className="text-left px-4 py-3 text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">Stock</th>
                      <th className="text-left px-4 py-3 text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">Statut</th>
                      <th className="text-right px-4 py-3 text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredProducts.map((product) => {
                      const active = isActive(product);
                      return (
                        <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-4 py-3">
                            <input type="checkbox" checked={selectedProducts.includes(product.id)} onChange={() => toggleSelectProduct(product.id)} className="w-4 h-4 text-emerald-600 rounded" />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gray-50 overflow-hidden shrink-0 flex items-center justify-center border border-gray-100">
                                {product.images?.[0] ? (
                                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="w-5 h-5 text-gray-300" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate max-w-[160px]">{product.name}</p>
                                <p className="text-[10px] text-gray-400 font-mono">{product.sku || `ID: ${product.id.slice(0, 8)}`}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div>
                              <p className="text-sm font-bold text-gray-900">
                                {product.price ? `${product.price.toLocaleString()} XOF` : "—"}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {product.track_stock ? (
                              <div className="flex items-center gap-2">
                                <div className="flex-1 max-w-[60px]">
                                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all ${(product.stock_quantity || 0) > 10
                                        ? 'bg-emerald-400'
                                        : (product.stock_quantity || 0) > 0
                                          ? 'bg-amber-400'
                                          : 'bg-red-400'
                                      }`} style={{ width: `${Math.min(100, ((product.stock_quantity || 0) / 50) * 100)}%` }} />
                                  </div>
                                </div>
                                <span className={`text-xs font-medium ${(product.stock_quantity || 0) <= 0 ? 'text-red-600' : (product.stock_quantity || 0) <= 5 ? 'text-amber-600' : 'text-gray-900'}`}>
                                  {product.stock_quantity || 0}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">Non suivi</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-medium border ${active
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-gray-100 text-gray-500 border-gray-200'
                              }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                              {active ? 'Actif' : 'Inactif'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* ancien lien : /products/${(product as any).slug || slugify(product.name)} */}
                              <a
                                href={`/boutiques/${subdomain}/products/${(product as any).slug || slugify(product.name)}`}
                                target="_blank" rel="noopener"
                                className="p-2 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Voir sur la boutique"
                              >
                                <ExternalLink className="w-4 h-4 text-emerald-500" />
                              </a>
                              <button onClick={() => handleToggleStatus(product)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title={product.status === "active" ? "Désactiver" : "Activer"}>
                                <span className={`w-4 h-4 block rounded-full ${product.status === "active" ? "bg-emerald-500" : "bg-gray-300"}`} />
                              </button>
                              <button onClick={() => handleEdit(product)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Modifier">
                                <Pencil className="w-4 h-4 text-gray-400 hover:text-gray-700" />
                              </button>
                              <button onClick={() => handleDelete(product.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Supprimer">
                                <Trash2 className="w-4 h-4 text-red-400 hover:text-red-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards - full vertical stack, no overflow */}
            <div className="grid grid-cols-1 gap-3 sm:hidden">
              {filteredProducts.map((product) => {
                const active = isActive(product);
                return (
                  <div key={product.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                    {/* Image + Name + Status */}
                    <div className="p-3 pb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl bg-gray-50 overflow-hidden shrink-0 flex items-center justify-center border border-gray-100">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-6 h-6 text-gray-300" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                          <p className="text-[10px] text-gray-400 font-mono truncate">{product.sku || `ID: ${product.id.slice(0, 8)}`}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                              }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                              {active ? 'Actif' : 'Inactif'}
                            </span>
                            {product.track_stock && (
                              <span className={`text-[10px] font-medium ${(product.stock_quantity || 0) <= 0 ? 'text-red-600' : (product.stock_quantity || 0) <= 5 ? 'text-amber-600' : 'text-gray-500'}`}>
                                {product.stock_quantity || 0} en stock
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Price + Actions */}
                    <div className="px-3 py-2 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900">
                          {product.price ? `${product.price.toLocaleString()} XOF` : "N/A"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* ancien lien : /products/${(product as any).slug || slugify(product.name)} */}
                        <a href={`/boutiques/${subdomain}/products/${(product as any).slug || slugify(product.name)}`} target="_blank" rel="noopener" className="p-2 hover:bg-white rounded-lg">
                          <ExternalLink className="w-4 h-4 text-emerald-500" />
                        </a>
                        <button onClick={() => handleToggleStatus(product)} className="p-2 hover:bg-white rounded-lg" title={product.status === "active" ? "Désactiver" : "Activer"}>
                          <span className={`w-4 h-4 block rounded-full ${product.status === "active" ? "bg-emerald-500" : "bg-gray-300"}`} />
                        </button>
                        <button onClick={() => handleEdit(product)} className="p-2 hover:bg-white rounded-lg">
                          <Pencil className="w-4 h-4 text-gray-400" />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="p-2 hover:bg-white rounded-lg">
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => toggleSelectProduct(product.id)}
                          className="w-4 h-4 text-emerald-600 rounded ml-1"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
            <div className="shrink-0 bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between z-20 rounded-t-2xl">
              <h2 className="text-lg font-bold text-white">
                {editingProduct ? "Modifier le produit" : "Ajouter un produit"}
              </h2>
              <button
                type="button"
                onClick={() => { setModalOpen(false); setEditingProduct(null); }}
                className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden min-h-0">
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom du produit *</label>
                  <input
                    type="text" required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Nom du produit"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <RichTextEditor
                    content={form.description}
                    onChange={(html) => setForm({ ...form, description: html })}
                    placeholder="Description détaillée du produit (texte, images, listes...)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix du produit</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tailles disponibles</label>
                  <input
                    type="text"
                    value={form.sizes.join(", ")}
                    onChange={(e) => setForm({ ...form, sizes: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="XS, S, M, L, XL (séparées par des virgules)"
                  />
                  {form.sizes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {form.sizes.map((s, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                          {s}
                          <button type="button" onClick={() => setForm({ ...form, sizes: form.sizes.filter((_, j) => j !== i) })} className="text-gray-400 hover:text-red-500">✕</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.track_stock}
                    onChange={(e) => setForm({ ...form, track_stock: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <label className="text-sm text-gray-700">Suivre le stock</label>
                </div>

                {form.track_stock && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantité en stock</label>
                    <input
                      type="number"
                      value={form.stock_quantity}
                      onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="0"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Images</label>
                  <input
                    type="file" multiple
                    onChange={handleImageUpload}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  />
                  {uploading && <p className="text-sm text-emerald-600 mt-1 flex items-center gap-1"><span className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span> Téléchargement...</p>}
                  {form.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {form.images.map((url, index) => (
                        <div key={index} className="relative w-20 h-20">
                          <img src={url} alt={`Image ${index + 1}`} className="w-full h-full object-cover rounded-lg border border-gray-100" />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-sm"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="shrink-0 flex justify-end gap-3 p-4 border-t border-gray-100 bg-gray-50/80 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => { setModalOpen(false); setEditingProduct(null); }}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 text-sm font-medium transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading || uploading}
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 text-sm font-medium transition-all shadow-sm shadow-emerald-200"
                >
                  {loading ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import URL Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-up">
            <div className="shrink-0 bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between z-20 rounded-t-2xl">
              <h2 className="text-lg font-bold text-white">Importer depuis une URL</h2>
              <button
                type="button"
                onClick={() => { setImportModalOpen(false); setImportResult(null); }}
                className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors text-white"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL du produit</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={importUrl}
                    onChange={(e) => setImportUrl(e.target.value)}
                    placeholder="https://example.com/produit"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={async () => {
                      if (!importUrl) return;
                      setImportLoading(true);
                      setImportResult(null);
                      try {
                        const res = await fetch("/api/products/import-url", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ url: importUrl }),
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error);
                        setImportResult(data.product);
                      } catch (e: any) {
                        toast.error(e.message || "Erreur d'analyse");
                      } finally {
                        setImportLoading(false);
                      }
                    }}
                    disabled={importLoading || !importUrl}
                    className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm font-medium transition-all"
                  >
                    {importLoading ? "Analyse..." : "Analyser"}
                  </button>
                </div>
              </div>

              {importResult && (
                <div className="space-y-4 border-t border-gray-100 pt-4">
                  <h3 className="text-sm font-semibold text-gray-700">Aperçu</h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                    <input
                      type="text"
                      value={importResult.name}
                      onChange={(e) => setImportResult({ ...importResult, name: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prix</label>
                    <input
                      type="text"
                      value={importResult.price}
                      onChange={(e) => setImportResult({ ...importResult, price: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <button
                        type="button"
                        onClick={() => {
                          const cleaned = importResult.description
                            .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
                            .trim();
                          setImportResult({ ...importResult, description: cleaned });
                        }}
                        className="text-[11px] text-emerald-600 font-semibold hover:underline"
                      >
                        Nettoyer le texte
                      </button>
                    </div>
                    <textarea
                      value={importResult.description}
                      onChange={(e) => setImportResult({ ...importResult, description: e.target.value })}
                      rows={3}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    />
                  </div>

                  {importResult.sizes.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tailles</label>
                      <div className="flex flex-wrap gap-1.5">
                        {importResult.sizes.map((s, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                            {s}
                            <button type="button" onClick={() => setImportResult({ ...importResult, sizes: importResult.sizes.filter((_, j) => j !== i) })} className="text-gray-400 hover:text-red-500">✕</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {importResult.images.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Images</label>
                      <div className="flex flex-wrap gap-2">
                        {importResult.images.map((img, i) => (
                          <div key={i} className="relative w-20 h-20">
                            <img
                              src={img}
                              alt=""
                              className="w-full h-full object-cover rounded-lg border border-gray-100"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                            />
                            <button
                              type="button"
                              onClick={() => setImportResult({
                                ...importResult,
                                images: importResult.images.filter((_, j) => j !== i)
                              })}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-sm"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => { setImportModalOpen(false); setImportResult(null); }}
                      className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 text-sm font-medium transition-all"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => {
                        setForm({
                          name: importResult.name.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "").trim(),
                          description: importResult.description,
                          price: importResult.price,
                          sku: "",
                          track_stock: true,
                          stock_quantity: "",
                          images: importResult.images,
                          sizes: importResult.sizes,
                        });
                        setImportModalOpen(false);
                        setImportResult(null);
                        setEditingProduct(null);
                        setModalOpen(true);
                      }}
                      className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-sm font-medium transition-all shadow-sm shadow-emerald-200"
                    >
                      Utiliser et modifier
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modale intermédiaire d'import CSV (Compatible Shopify & Afro-Spy) */}
      {csvPreviewModalOpen && csvAnalysis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-slide-up border border-gray-100">
            {/* Header avec gradient stylé */}
            <div
              className={`shrink-0 px-6 py-4 flex items-center justify-between text-white ${
                csvAnalysis.format === "shopify_afrospy"
                  ? "bg-gradient-to-r from-amber-600 via-orange-600 to-emerald-700"
                  : "bg-gradient-to-r from-emerald-600 to-teal-700"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-xs">
                  {csvAnalysis.format === "shopify_afrospy" ? (
                    <Flame className="w-5 h-5 text-amber-200 animate-pulse" />
                  ) : (
                    <FileSpreadsheet className="w-5 h-5 text-emerald-200" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold">
                      Import de produits &bull; Étape intermédiaire
                    </h2>
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-xs">
                      {csvAnalysis.formatLabel}
                    </span>
                  </div>
                  <p className="text-xs text-white/80 mt-0.5">
                    {csvAnalysis.totalRows} ligne(s) CSV analysée(s) &bull;{" "}
                    {csvParsedProducts.length} produit(s) prêt(s) à être importé(s)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCsvPreviewModalOpen(false)}
                className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors text-white text-sm"
                title="Fermer"
              >
                ✕
              </button>
            </div>

            {/* Barre de synthèse & options globales */}
            <div className="bg-gray-50/80 border-b border-gray-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 font-medium text-gray-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={
                      csvParsedProducts.length > 0 &&
                      csvParsedProducts.every((p) => p.selected !== false)
                    }
                    onChange={(e) => handleToggleSelectAllCsv(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                  <span>Tout sélectionner</span>
                </label>
                <span className="text-gray-400">|</span>
                <span className="text-gray-600 font-medium">
                  {csvParsedProducts.filter((p) => p.selected !== false).length} sur{" "}
                  {csvParsedProducts.length} sélectionné(s)
                </span>
                <span className="text-gray-400">|</span>
                <span className="text-gray-600 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-gray-400" />
                  {csvParsedProducts.reduce(
                    (acc, p) => acc + (p.images?.length || 0),
                    0
                  )}{" "}
                  images extraites
                </span>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-gray-700 cursor-pointer select-none font-medium">
                  <input
                    type="checkbox"
                    checked={cleanEmojisInImport}
                    onChange={(e) => setCleanEmojisInImport(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500 cursor-pointer"
                  />
                  <span>Nettoyer les émojis des titres</span>
                </label>
              </div>
            </div>

            {/* Avertissements éventuels */}
            {csvAnalysis.warnings && csvAnalysis.warnings.length > 0 && (
              <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 text-xs text-amber-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Remarque: Certaines lignes secondaires ont été regroupées avec leur
                  produit parent.
                </span>
              </div>
            )}

            {/* Liste des produits détectés */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {csvParsedProducts.map((prod, index) => {
                const isSelected = prod.selected !== false;
                const displayName = cleanEmojisInImport
                  ? removeEmojis(prod.name)
                  : prod.name;
                const isDescExpanded = expandedDescId === prod.id;

                return (
                  <div
                    key={prod.id || index}
                    className={`rounded-xl border transition-all duration-200 ${
                      isSelected
                        ? "border-emerald-300 bg-white shadow-sm ring-1 ring-emerald-500/20"
                        : "border-gray-200 bg-gray-50/60 opacity-60"
                    }`}
                  >
                    <div className="p-4 flex flex-col sm:flex-row items-start gap-4">
                      {/* Checkbox sélection */}
                      <div className="pt-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleProductSelection(prod.id)}
                          className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                        />
                      </div>

                      {/* Image principale & galerie */}
                      <div className="relative shrink-0 w-24 h-24 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
                        {prod.images && prod.images.length > 0 ? (
                          <img
                            src={prod.images[0]}
                            alt={displayName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://placehold.co/100x100?text=Image";
                            }}
                          />
                        ) : (
                          <Package className="w-8 h-8 text-gray-400" />
                        )}
                        {prod.images && prod.images.length > 1 && (
                          <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-xs">
                            +{prod.images.length - 1} photos
                          </span>
                        )}
                      </div>

                      {/* Détails éditables */}
                      <div className="flex-1 min-w-0 space-y-2 w-full">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          {/* Titre éditable */}
                          <div className="flex-1 min-w-0">
                            <label className="text-[11px] text-gray-500 font-medium block mb-0.5">
                              Nom du produit ({prod.handle || "handle"})
                            </label>
                            <input
                              type="text"
                              value={displayName}
                              onChange={(e) =>
                                handleUpdateParsedProduct(prod.id, {
                                  name: e.target.value,
                                })
                              }
                              className="w-full text-sm font-semibold text-gray-900 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>

                          {/* Prix éditable */}
                          <div className="w-full sm:w-44 shrink-0">
                            <label className="text-[11px] text-gray-500 font-medium block mb-0.5">
                              Prix (XOF / CFA)
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                value={prod.price !== null ? prod.price : ""}
                                onChange={(e) =>
                                  handleUpdateParsedProduct(prod.id, {
                                    price: e.target.value
                                      ? parseFloat(e.target.value)
                                      : null,
                                  })
                                }
                                placeholder="0"
                                className="w-full text-sm font-bold text-emerald-700 border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-12"
                              />
                              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium pointer-events-none">
                                XOF
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Badges métadonnées & comparaison de prix */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              prod.status === "active"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {prod.status === "active" ? "Actif" : "Inactif"}
                          </span>

                          {prod.comparePrice && prod.price && prod.comparePrice > prod.price && (
                            <span className="text-[11px] text-gray-400 line-through">
                              Prix barré : {prod.comparePrice.toLocaleString()} XOF
                            </span>
                          )}

                          {prod.vendor && (
                            <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md font-medium border border-purple-200/60">
                              Vendeur: {prod.vendor}
                            </span>
                          )}

                          {prod.category && (
                            <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium border border-blue-200/60">
                              {prod.category}
                            </span>
                          )}

                          {prod.sizes && prod.sizes.length > 0 && (
                            <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md font-medium border border-amber-200/60">
                              Variantes : {prod.sizes.join(", ")}
                            </span>
                          )}

                          <span className="text-[10px] text-gray-400">
                            {prod.rawRowsCount} ligne(s) groupée(s)
                          </span>
                        </div>

                        {/* Bouton pour voir/masquer la description et bouton éditeur complet */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-100 mt-2">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedDescId(isDescExpanded ? null : prod.id)
                            }
                            className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 font-medium transition-colors"
                          >
                            {isDescExpanded ? (
                              <>
                                <ChevronUp className="w-3.5 h-3.5" /> Masquer la
                                description
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3.5 h-3.5" /> Voir la
                                description ({prod.description.length} car.)
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenInFullEditor(prod)}
                            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Modifier dans l'éditeur complet</span>
                          </button>
                        </div>

                        {/* Accordéon Description Preview */}
                        {isDescExpanded && (
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-700 max-h-60 overflow-y-auto space-y-2">
                            <div className="font-semibold text-gray-900 flex items-center justify-between">
                              <span>Aperçu de la page produit (HTML) :</span>
                              <span className="text-[10px] text-gray-400 font-normal">
                                Rendu visuel
                              </span>
                            </div>
                            <div
                              className="prose prose-sm max-w-none bg-white p-3 rounded border border-gray-200 text-xs overflow-x-auto"
                              dangerouslySetInnerHTML={{
                                __html: prod.description || "<em>Aucune description</em>",
                              }}
                            />
                            {prod.images && prod.images.length > 0 && (
                              <div>
                                <div className="font-semibold text-gray-900 mb-1">
                                  Galerie d'images ({prod.images.length}) :
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {prod.images.map((img, i) => (
                                    <img
                                      key={i}
                                      src={img}
                                      alt=""
                                      className="w-12 h-12 object-cover rounded border border-gray-200"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).style.display =
                                          "none";
                                      }}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer de la modale intermédiaire */}
            <div className="shrink-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-gray-500">
                Les produits sélectionnés seront automatiquement ajoutés à votre boutique{" "}
                <span className="font-semibold text-gray-800">{subdomain}</span>.
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setCsvPreviewModalOpen(false)}
                  disabled={csvImporting}
                  className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 text-sm font-medium transition-all"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCsvImport}
                  disabled={
                    csvImporting ||
                    csvParsedProducts.filter((p) => p.selected !== false).length === 0
                  }
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 text-sm font-medium transition-all shadow-sm shadow-emerald-200 flex items-center gap-2"
                >
                  {csvImporting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Importation en cours...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>
                        Importer{" "}
                        {
                          csvParsedProducts.filter((p) => p.selected !== false).length
                        }{" "}
                        produit(s)
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
