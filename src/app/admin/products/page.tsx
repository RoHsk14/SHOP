"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import Papa from "papaparse";
import { worldCurrencies } from "@/lib/currencies";
import { Pencil, Trash2, Package, ExternalLink } from "lucide-react";
import { formatPrice } from "@/lib/currency";

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
      const productData = {
        name: form.name,
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

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Produits</h1>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleDownloadTemplate}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 text-sm"
          >
            Télécharger modèle
          </button>
          <label className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 cursor-pointer text-sm">
            Importer CSV
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
            />
          </label>
          {csvFile && (
            <button
              onClick={handleCsvImport}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-sm"
            >
              Importer {csvFile.name}
            </button>
          )}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedProducts.length === products.length && products.length > 0}
              onChange={toggleSelectAll}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-600">
              {selectedProducts.length > 0 ? `${selectedProducts.length} sélectionné(s)` : "Tout sélectionner"}
            </span>
          </div>
          <button
            onClick={handleCsvExport}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 text-sm"
            disabled={products.length === 0}
          >
            Exporter CSV {selectedProducts.length > 0 ? `(${selectedProducts.length})` : ""}
          </button>
          <button
            onClick={() => {
              setEditingProduct(null);
              setForm({
                ...initialForm,
                selectedCurrency: defaultCurrency,
                prices: { [defaultCurrency]: 0 },
              });
              setModalOpen(true);
            }}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-sm"
          >
            Ajouter un produit
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Aucun produit trouvé</div>
      ) : (
        <>
          {/* Vue tableau pour desktop */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase"><input type="checkbox" checked={selectedProducts.length === products.length} onChange={toggleSelectAll} className="w-4 h-4 text-emerald-600 rounded" /></th>
                    <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Produit</th>
                    <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Prix</th>
                    <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Stock</th>
                    <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">SKU</th>
                    <th className="text-right p-4 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4"><input type="checkbox" checked={selectedProducts.includes(product.id)} onChange={() => toggleSelectProduct(product.id)} className="w-4 h-4 text-emerald-600 rounded" /></td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {product.images && product.images.length > 0 ? (
                            <img src={product.images[0]} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Package className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-500">{product.description?.slice(0, 50)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-900">
                        {product.prices ? formatPrice(Object.values(product.prices)[0] || 0, Object.keys(product.prices)[0]) : "N/A"}
                      </td>
                      <td className="p-4">
                        {product.track_stock ? (
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${product.stock_quantity && product.stock_quantity > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {product.stock_quantity || 0} en stock
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Non suivi</span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-gray-500">{product.sku || "-"}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a href={`/?product=${product.id}`} target="_blank" rel="noopener" className="p-2 hover:bg-emerald-50 rounded-lg transition-colors" title="Voir sur la boutique"><ExternalLink className="w-4 h-4 text-emerald-600" /></a>
                          <button onClick={() => handleEdit(product)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><Pencil className="w-4 h-4 text-gray-500" /></button>
                          <button onClick={() => handleDelete(product.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4 text-red-500" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Vue cartes pour mobile */}
          <div className="grid grid-cols-1 sm:hidden gap-4">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <input type="checkbox" checked={selectedProducts.includes(product.id)} onChange={() => toggleSelectProduct(product.id)} className="w-4 h-4 text-emerald-600 rounded mt-1" />
                    {product.images && product.images.length > 0 ? (
                      <img src={product.images[0]} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.sku || "Pas de SKU"}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <a href={`/?product=${product.id}`} target="_blank" rel="noopener" className="p-2 hover:bg-emerald-50 rounded-lg" title="Voir sur la boutique"><ExternalLink className="w-4 h-4 text-emerald-600" /></a>
                    <button onClick={() => handleEdit(product)} className="p-2 hover:bg-gray-100 rounded-lg"><Pencil className="w-4 h-4 text-gray-500" /></button>
                    <button onClick={() => handleDelete(product.id)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-500" /></button>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-sm font-bold text-gray-900">
                    {product.prices ? formatPrice(Object.values(product.prices)[0] || 0, Object.keys(product.prices)[0]) : "N/A"}
                  </span>
                  {product.track_stock ? (
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${product.stock_quantity && product.stock_quantity > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {product.stock_quantity || 0} en stock
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">Non suivi</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                {editingProduct ? "Modifier le produit" : "Ajouter un produit"}
              </h2>
              <button
                onClick={() => { setModalOpen(false); setEditingProduct(null); }}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Form fields - same as before but with responsive classes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du produit *</label>
                <input
                  type="text" required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              {/* Price section */}
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
                  />
                </div>
              </div>

              {/* SKU and Barcode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <input
                    type="text"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code-barres</label>
                  <input
                    type="text"
                    value={form.barcode}
                    onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Stock section */}
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
                  />
                </div>
              )}

              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Images</label>
                <input
                  type="file" multiple
                  onChange={handleImageUpload}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
                {uploading && <p className="text-sm text-gray-500 mt-1">Téléchargement...</p>}
                {form.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.images.map((url, index) => (
                      <div key={index} className="relative w-20 h-20">
                        <img
                          src={url}
                          alt={`Image ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form actions */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => { setModalOpen(false); setEditingProduct(null); }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading || uploading}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50"
                >
                  {loading ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
