"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import Papa from "papaparse";
import { worldCurrencies } from "@/lib/currencies";
import { Pencil, Trash2, Package, ExternalLink, ChevronRight, Search, Download, Upload, Plus, ArrowUpRight, ArrowDownRight, AlertCircle } from "lucide-react";
import { formatPrice } from "@/lib/currency";
import { slugify } from "@/lib/slug";
import RichTextEditor from "@/components/RichTextEditor";

type Product = {
  id: string;
  name: string;
  description: string | null;
  prices: Record<string, number> | null;
  sku: string | null;
  barcode: string | null;
  cost_per_item: number | null;
  regular_price: number | null;
  sale_price: number | null;
  track_stock: boolean;
  stock_quantity: number | null;
  images: string[] | null;
  created_at: string;
  updated_at: string;
};

type ProductForm = {
  name: string;
  description: string;
  prices: Record<string, number>;
  sku: string;
  barcode: string;
  cost_per_item: string;
  regular_price: string;
  sale_price: string;
  track_stock: boolean;
  stock_quantity: string;
  images: string[];
  selectedCurrency: string;
};

const initialForm: ProductForm = {
  name: "",
  description: "",
  prices: { EUR: 0 },
  sku: "",
  barcode: "",
  cost_per_item: "",
  regular_price: "",
  sale_price: "",
  track_stock: true,
  stock_quantity: "",
  images: [],
  selectedCurrency: "EUR"
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(initialForm);
  const [uploading, setUploading] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [currencies, setCurrencies] = useState<string[]>(["EUR"]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [defaultCurrency, setDefaultCurrency] = useState("EUR");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Erreur de chargement des produits");
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  }, []);

  const fetchSettings = useCallback(async () => {
    const { data } = await supabase
      .from("settings")
      .select("default_currency")
      .single();
    if (data?.default_currency) {
      setDefaultCurrency(data.default_currency);
      setCurrencies(prev => prev.includes(data.default_currency) ? prev : [...prev, data.default_currency]);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchSettings();
  }, [fetchProducts, fetchSettings]);

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
        const { error } = await supabase.storage
          .from("products")
          .upload(fileName, file);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage
          .from("products")
          .getPublicUrl(fileName);
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
        .eq("slug", slug);
      if (existing && existing.length > 0 && existing.some((p: any) => p.id !== editingId)) {
        let i = 2;
        while (true) {
          const testSlug = `${slug}-${i}`;
          const { data: dupes } = await supabase
            .from("products")
            .select("id")
            .eq("slug", testSlug);
          if (!dupes || dupes.length === 0 || dupes.every((p: any) => p.id === editingId)) {
            slug = testSlug;
            break;
          }
          i++;
        }
      }
      const productData = {
        name: form.name,
        slug,
        description: form.description || null,
        prices: { [form.selectedCurrency]: form.prices[form.selectedCurrency] || 0 },
        sku: form.sku || null,
        barcode: form.barcode || null,
        cost_per_item: form.cost_per_item ? parseFloat(form.cost_per_item) : null,
        regular_price: form.regular_price ? parseFloat(form.regular_price) : null,
        sale_price: form.sale_price ? parseFloat(form.sale_price) : null,
        track_stock: form.track_stock,
        stock_quantity: form.track_stock && form.stock_quantity ? parseInt(form.stock_quantity) : null,
        images: form.images.length > 0 ? form.images : null
      };
      if (editingProduct) {
        const { error } = await supabase
          .from("products")
          .update(productData)
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
    const firstCurrency = product.prices ? Object.keys(product.prices)[0] || defaultCurrency : defaultCurrency;
    setForm({
      name: product.name,
      description: product.description || "",
      prices: product.prices || { [defaultCurrency]: 0 },
      sku: product.sku || "",
      barcode: product.barcode || "",
      cost_per_item: product.cost_per_item ? product.cost_per_item.toString() : "",
      regular_price: product.regular_price ? product.regular_price.toString() : "",
      sale_price: product.sale_price ? product.sale_price.toString() : "",
      track_stock: product.track_stock,
      stock_quantity: product.stock_quantity ? product.stock_quantity.toString() : "",
      images: product.images || [],
      selectedCurrency: firstCurrency
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce produit ?")) return;
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);
    if (error) {
      console.error("Delete error:", error);
      toast.error(error.message || "Erreur de suppression");
    } else {
      toast.success("Produit supprimé");
      fetchProducts();
    }
  };

  const handleCsvImport = () => {
    if (!csvFile) return;
    Papa.parse(csvFile, {
      header: true,
      complete: async (results) => {
        const productsToInsert = results.data
          .filter((row: any) => row.name)
          .map((row: any) => {
            const prices: Record<string, number> = {};
            currencies.forEach(c => {
              prices[c] = parseFloat(row[`price_${c.toLowerCase()}`]) || 0;
            });
            return {
              name: row.name,
              description: row.description || null,
              prices,
              sku: row.sku || null,
              barcode: row.barcode || null,
              cost_per_item: row.cost_per_item ? parseFloat(row.cost_per_item) : null,
              regular_price: row.regular_price ? parseFloat(row.regular_price) : null,
              sale_price: row.sale_price ? parseFloat(row.sale_price) : null,
              track_stock: row.track_stock !== "false",
              stock_quantity: row.stock_quantity ? parseInt(row.stock_quantity) : null,
              images: row.images ? row.images.split(",").map((i: string) => i.trim()) : null
            };
          });
        const { error } = await supabase
          .from("products")
          .insert(productsToInsert);
        if (error) {
          console.error("CSV import error:", error);
          toast.error(error.message || "Erreur d'import CSV");
        } else {
          toast.success(`${productsToInsert.length} produits importés`);
          setCsvFile(null);
          fetchProducts();
        }
      }
    });
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
    const rows = productsToExport.map(product => {
      const row: any = {
        name: product.name,
        description: product.description || "",
        sku: product.sku || "",
        barcode: product.barcode || "",
        cost_per_item: product.cost_per_item || "",
        regular_price: product.regular_price || "",
        sale_price: product.sale_price || "",
        track_stock: product.track_stock,
        stock_quantity: product.stock_quantity || "",
        images: product.images ? product.images.join(", ") : ""
      };
      currencies.forEach(c => {
        row[`price_${c.toLowerCase()}`] = product.prices?.[c] || 0;
      });
      return row;
    });
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
      sku: "SKU123",
      barcode: "123456789",
      cost_per_item: "10.00",
      regular_price: "25.00",
      sale_price: "20.00",
      track_stock: "true",
      stock_quantity: "100",
      images: "https://example.com/image1.jpg, https://example.com/image2.jpg"
    };
    currencies.forEach(c => {
      sampleRow[`price_${c.toLowerCase()}`] = c === "EUR" ? "25.00" : c === "XAF" ? "16400" : "27.00";
    });
    const csv = Papa.unparse([sampleRow]);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "modele_produits.csv";
    link.click();
    toast.success("Modèle téléchargé");
  };

  const isActive = (p: Product) => p.stock_quantity !== null && p.stock_quantity > 0;

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
            <input type="file" accept=".csv" className="hidden" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} />
          </label>
          {csvFile && (
            <button onClick={handleCsvImport} className="px-3 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-xs sm:text-sm font-medium transition-all">
              Importer {csvFile.name}
            </button>
          )}
          <button
            onClick={() => {
              setEditingProduct(null);
              setForm({ ...initialForm, selectedCurrency: defaultCurrency, prices: { [defaultCurrency]: 0 } });
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
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                statusFilter === tab.value
                  ? "bg-gray-900 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {tab.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                statusFilter === tab.value ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
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
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucun produit trouvé</p>
          <p className="text-gray-400 text-sm mt-1">
            {statusFilter === "all" ? "Ajoutez votre premier produit" : `Aucun produit ${statusFilter}`}
          </p>
        </div>
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
                    const discount = product.regular_price && product.sale_price && product.sale_price < product.regular_price;
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
                              {product.sale_price
                                ? formatPrice(product.sale_price, defaultCurrency)
                                : product.regular_price
                                  ? formatPrice(product.regular_price, defaultCurrency)
                                  : product.prices
                                    ? formatPrice(Object.values(product.prices)[0] || 0, defaultCurrency)
                                    : "—"}
                            </p>
                            {discount && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[10px] text-gray-400 line-through">
                                  {formatPrice(product.regular_price!, defaultCurrency)}
                                </span>
                                <span className="text-[10px] text-red-500 font-medium bg-red-50 px-1 py-0.5 rounded">
                                  -{Math.round((1 - product.sale_price! / product.regular_price!) * 100)}%
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {product.track_stock ? (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 max-w-[60px]">
                                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full transition-all ${
                                    (product.stock_quantity || 0) > 10
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
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-medium border ${
                            active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-gray-100 text-gray-500 border-gray-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                            {active ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <a
                              href={`/products/${(product as any).slug || slugify(product.name)}`}
                              target="_blank" rel="noopener"
                              className="p-2 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Voir sur la boutique"
                            >
                              <ExternalLink className="w-4 h-4 text-emerald-500" />
                            </a>
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
              const discount = product.regular_price && product.sale_price && product.sale_price < product.regular_price;
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
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                            active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'
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
                        {product.sale_price
                          ? formatPrice(product.sale_price, defaultCurrency)
                          : product.regular_price
                            ? formatPrice(product.regular_price, defaultCurrency)
                            : product.prices
                              ? formatPrice(Object.values(product.prices)[0] || 0, defaultCurrency)
                              : "N/A"}
                      </p>
                      {discount && (
                        <span className="text-[10px] text-red-500 font-medium">
                          -{Math.round((1 - product.sale_price! / product.regular_price!) * 100)}%
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={`/products/${(product as any).slug || slugify(product.name)}`} target="_blank" rel="noopener" className="p-2 hover:bg-white rounded-lg">
                        <ExternalLink className="w-4 h-4 text-emerald-500" />
                      </a>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {editingProduct ? "Modifier le produit" : "Ajouter un produit"}
              </h2>
              <button
                onClick={() => { setModalOpen(false); setEditingProduct(null); }}
                className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Devise</label>
                  <select
                    value={form.selectedCurrency}
                    onChange={(e) => setForm({ ...form, selectedCurrency: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {currencies.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix ({form.selectedCurrency})</label>
                  <input
                    type="number" step="0.01"
                    value={form.prices[form.selectedCurrency] || ""}
                    onChange={(e) => setForm({
                      ...form,
                      prices: { ...form.prices, [form.selectedCurrency]: parseFloat(e.target.value) || 0 }
                    })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix régulier</label>
                  <input
                    type="number" step="0.01"
                    value={form.regular_price}
                    onChange={(e) => setForm({ ...form, regular_price: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix soldé</label>
                  <input
                    type="number" step="0.01"
                    value={form.sale_price}
                    onChange={(e) => setForm({ ...form, sale_price: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <input
                    type="text"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="SKU-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code-barres</label>
                  <input
                    type="text"
                    value={form.barcode}
                    onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="123456789"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coût unitaire</label>
                  <input
                    type="number" step="0.01"
                    value={form.cost_per_item}
                    onChange={(e) => setForm({ ...form, cost_per_item: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0.00"
                  />
                </div>
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

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
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
    </>
  );
}
