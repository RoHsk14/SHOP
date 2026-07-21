"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Pencil, Trash2, Package, Plus, Search, X, Tag, Percent, GripVertical } from "lucide-react";

type OfferProduct = {
  product_id: string;
  product_name: string;
  quantity: number;
  image?: string;
};

type Offer = {
  id: string;
  shop_slug: string;
  name: string;
  description: string;
  type: "bundle" | "quantity";
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_quantity: number;
  max_quantity: number | null;
  products: OfferProduct[];
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
};

const emptyForm = {
  name: "",
  description: "",
  type: "bundle" as "bundle" | "quantity",
  discount_type: "percentage" as "percentage" | "fixed",
  discount_value: 0,
  min_quantity: 1,
  max_quantity: null as number | null,
  products: [] as OfferProduct[],
  status: "active" as "active" | "inactive",
};

export default function OffersPage() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [allProducts, setAllProducts] = useState<{ id: string; name: string; images: string[] | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("offers")
      .select("*")
      .eq("shop_slug", subdomain)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Erreur offres:", error);
      toast.error("Erreur de chargement des offres: " + (error?.message || "Erreur inconnue"));
    } else {
      setOffers(data || []);
    }
    setLoading(false);
  }, [subdomain]);

  const fetchProducts = useCallback(async () => {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, images")
      .eq("shop_slug", subdomain)
      .order("name");
    if (!error) setAllProducts(data || []);
  }, [subdomain]);

  useEffect(() => {
    fetchOffers();
    fetchProducts();
  }, [fetchOffers, fetchProducts]);

  const openCreate = () => {
    setEditingOffer(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (offer: Offer) => {
    setEditingOffer(offer);
    setForm({
      name: offer.name,
      description: offer.description || "",
      type: offer.type,
      discount_type: offer.discount_type,
      discount_value: offer.discount_value,
      min_quantity: offer.min_quantity,
      max_quantity: offer.max_quantity,
      products: offer.products || [],
      status: offer.status,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Le nom de l'offre est requis");
      return;
    }
    if (form.products.length === 0) {
      toast.error("Sélectionnez au moins un produit");
      return;
    }
    if (form.discount_value <= 0) {
      toast.error("La réduction doit être supérieure à 0");
      return;
    }

    const payload = {
      shop_slug: subdomain,
      name: form.name,
      description: form.description,
      type: form.type,
      discount_type: form.discount_type,
      discount_value: form.discount_value,
      min_quantity: form.min_quantity,
      max_quantity: form.max_quantity,
      products: form.products,
      status: form.status,
    };

    if (editingOffer) {
      const { error } = await supabase
        .from("offers")
        .update(payload)
        .eq("id", editingOffer.id);
      if (error) {
        toast.error(error.message || "Erreur de mise à jour");
      } else {
        toast.success("Offre mise à jour");
        setModalOpen(false);
        fetchOffers();
      }
    } else {
      const { error } = await supabase.from("offers").insert([payload]);
      if (error) {
        toast.error(error.message || "Erreur de création");
      } else {
        toast.success("Offre créée");
        setModalOpen(false);
        fetchOffers();
      }
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("offers").delete().eq("id", id);
    if (error) {
      toast.error("Erreur de suppression");
    } else {
      toast.success("Offre supprimée");
      setDeleteConfirm(null);
      fetchOffers();
    }
  };

  const toggleStatus = async (offer: Offer) => {
    const newStatus = offer.status === "active" ? "inactive" : "active";
    await supabase.from("offers").update({ status: newStatus }).eq("id", offer.id);
    fetchOffers();
  };

  const addProduct = (product: { id: string; name: string; images: string[] | null }) => {
    if (form.products.some((p) => p.product_id === product.id)) {
      toast.info("Ce produit est déjà dans l'offre");
      return;
    }
    setForm({
      ...form,
      products: [...form.products, { product_id: product.id, product_name: product.name, quantity: 1, image: product.images?.[0] || undefined }],
    });
    setProductSearch("");
    setShowProductPicker(false);
  };

  const removeProduct = (productId: string) => {
    setForm({ ...form, products: form.products.filter((p) => p.product_id !== productId) });
  };

  const updateProductQty = (productId: string, quantity: number) => {
    setForm({
      ...form,
      products: form.products.map((p) => (p.product_id === productId ? { ...p, quantity: Math.max(1, quantity) } : p)),
    });
  };

  const productSearchResults = allProducts.filter(
    (p) => p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredOffers = offers.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase())
  );

  const formatDiscount = (offer: Offer) => {
    if (offer.discount_type === "percentage") return `${offer.discount_value}%`;
    return `${offer.discount_value.toLocaleString()} XOF`;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--theme-text, #111827)" }}>Offres groupées</h1>
          <p className="text-sm mt-1" style={{ color: "var(--theme-text-muted, #6b7280)" }}>
            Créez des offres de quantité et bundles pour vos produits
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-sm font-medium transition-all shadow-sm shadow-emerald-200"
        >
          <Plus className="w-4 h-4" /> Nouvelle offre
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--theme-text-muted, #9ca3af)" }} />
        <input
          type="text"
          placeholder="Rechercher une offre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm bg-white"
          style={{ borderColor: "var(--theme-border, #e5e7eb)" }}
        />
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-emerald-600 rounded-full animate-spin"></div>
        </div>
      ) : filteredOffers.length === 0 ? (
        <div className="text-center py-20">
          <Tag className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--theme-text-muted, #9ca3af)" }} />
          <p className="text-lg font-medium" style={{ color: "var(--theme-text, #111827)" }}>Aucune offre pour le moment</p>
          <p className="text-sm mt-1" style={{ color: "var(--theme-text-muted, #6b7280)" }}>Créez votre première offre groupée ou de quantité</p>
          <button
            onClick={openCreate}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-all"
          >
            <Plus className="w-4 h-4" /> Créer une offre
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredOffers.map((offer) => (
            <div
              key={offer.id}
              className="bg-white rounded-xl border p-5 transition-all hover:shadow-sm"
              style={{ borderColor: "var(--theme-border, #e5e7eb)" }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-base truncate" style={{ color: "var(--theme-text, #111827)" }}>{offer.name}</h3>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        offer.type === "bundle"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-purple-50 text-purple-700"
                      }`}
                    >
                      <Package className="w-3 h-3" />
                      {offer.type === "bundle" ? "Bundle" : "Quantité"}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        offer.status === "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {offer.status === "active" ? "Actif" : "Inactif"}
                    </span>
                  </div>

                  {offer.description && (
                    <p className="text-sm mb-2 line-clamp-1" style={{ color: "var(--theme-text-muted, #6b7280)" }}>{offer.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: "var(--theme-text-muted, #6b7280)" }}>
                    <span className="font-medium" style={{ color: "var(--theme-primary, #059669)" }}>
                      {formatDiscount(offer)} de réduction
                    </span>
                    {offer.type === "quantity" && (
                      <span>Min. {offer.min_quantity} produit(s)</span>
                    )}
                    <span>{offer.products.length} produit(s)</span>
                    <span>Créée le {new Date(offer.created_at).toLocaleDateString("fr-FR")}</span>
                  </div>

                  {/* Product chips */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {offer.products.map((p) => (
                      <div
                        key={p.product_id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-lg text-xs"
                        style={{ color: "var(--theme-text, #111827)" }}
                      >
                        {p.image && (
                          <img src={p.image} alt="" className="w-4 h-4 rounded object-cover" />
                        )}
                        <span className="max-w-[140px] truncate">{p.product_name}</span>
                        <span className="text-gray-400">x{p.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleStatus(offer)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      offer.status === "active"
                        ? "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                    }`}
                  >
                    {offer.status === "active" ? "Désactiver" : "Activer"}
                  </button>
                  <button
                    onClick={() => openEdit(offer)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-all text-gray-500"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(offer.id)}
                    className="p-2 rounded-lg hover:bg-red-50 transition-all text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 px-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-t-2xl px-6 py-5 flex items-center justify-between z-10">
              <h2 className="text-lg font-semibold text-white">
                {editingOffer ? "Modifier l'offre" : "Nouvelle offre"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-white/80 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--theme-text, #111827)" }}>
                  Nom de l'offre
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Pack découverte"
                  className="w-full px-4 py-2.5 border rounded-xl text-sm bg-white"
                  style={{ borderColor: "var(--theme-border, #e5e7eb)" }}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--theme-text, #111827)" }}>
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Description de l'offre..."
                  rows={2}
                  className="w-full px-4 py-2.5 border rounded-xl text-sm bg-white resize-none"
                  style={{ borderColor: "var(--theme-border, #e5e7eb)" }}
                />
              </div>

              {/* Type + Discount row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--theme-text, #111827)" }}>
                    Type d'offre
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as "bundle" | "quantity" })}
                    className="w-full px-4 py-2.5 border rounded-xl text-sm bg-white"
                    style={{ borderColor: "var(--theme-border, #e5e7eb)" }}
                  >
                    <option value="bundle">Bundle (plusieurs produits)</option>
                    <option value="quantity">Quantité (même produit)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--theme-text, #111827)" }}>
                    Type de réduction
                  </label>
                  <select
                    value={form.discount_type}
                    onChange={(e) => setForm({ ...form, discount_type: e.target.value as "percentage" | "fixed" })}
                    className="w-full px-4 py-2.5 border rounded-xl text-sm bg-white"
                    style={{ borderColor: "var(--theme-border, #e5e7eb)" }}
                  >
                    <option value="percentage">Pourcentage (%)</option>
                    <option value="fixed">Montant fixe (XOF)</option>
                  </select>
                </div>
              </div>

              {/* Discount value + Min quantity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--theme-text, #111827)" }}>
                    Valeur de la réduction
                  </label>
                  <input
                    type="number"
                    value={form.discount_value}
                    onChange={(e) => setForm({ ...form, discount_value: parseFloat(e.target.value) || 0 })}
                    min={0}
                    className="w-full px-4 py-2.5 border rounded-xl text-sm bg-white"
                    style={{ borderColor: "var(--theme-border, #e5e7eb)" }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--theme-text, #111827)" }}>
                    Quantité minimum
                  </label>
                  <input
                    type="number"
                    value={form.min_quantity}
                    onChange={(e) => setForm({ ...form, min_quantity: parseInt(e.target.value) || 1 })}
                    min={1}
                    className="w-full px-4 py-2.5 border rounded-xl text-sm bg-white"
                    style={{ borderColor: "var(--theme-border, #e5e7eb)" }}
                  />
                </div>
              </div>

              {/* Products picker */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium" style={{ color: "var(--theme-text, #111827)" }}>
                    Produits dans l'offre
                  </label>
                  <button
                    onClick={() => setShowProductPicker(!showProductPicker)}
                    className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    + Ajouter un produit
                  </button>
                </div>

                {showProductPicker && (
                  <div className="mb-3 p-3 border rounded-xl bg-gray-50" style={{ borderColor: "var(--theme-border, #e5e7eb)" }}>
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Rechercher un produit..."
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm bg-white"
                        style={{ borderColor: "var(--theme-border, #e5e7eb)" }}
                        autoFocus
                      />
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {productSearchResults.length === 0 ? (
                        <p className="text-xs text-gray-400 py-2 text-center">Aucun produit trouvé</p>
                      ) : (
                        productSearchResults.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => addProduct(p)}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white text-sm text-left transition-colors"
                          >
                            {p.images?.[0] ? (
                              <img src={p.images[0]} alt="" className="w-7 h-7 rounded object-cover bg-gray-100" />
                            ) : (
                              <div className="w-7 h-7 rounded bg-gray-200 flex items-center justify-center">
                                <Package className="w-3.5 h-3.5 text-gray-400" />
                              </div>
                            )}
                            <span className="truncate">{p.name}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {form.products.length === 0 ? (
                  <p className="text-sm text-gray-400 py-3 text-center border border-dashed rounded-xl" style={{ borderColor: "var(--theme-border, #e5e7eb)" }}>
                    Aucun produit sélectionné
                  </p>
                ) : (
                  <div className="space-y-2">
                    {form.products.map((p) => (
                      <div
                        key={p.product_id}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl border bg-white"
                        style={{ borderColor: "var(--theme-border, #e5e7eb)" }}
                      >
                        {p.image ? (
                          <img src={p.image} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Package className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{p.product_name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-500">Qté:</label>
                          <input
                            type="number"
                            value={p.quantity}
                            onChange={(e) => updateProductQty(p.product_id, parseInt(e.target.value) || 1)}
                            min={1}
                            className="w-16 px-2 py-1 border rounded-lg text-sm text-center"
                            style={{ borderColor: "var(--theme-border, #e5e7eb)" }}
                          />
                        </div>
                        <button
                          onClick={() => removeProduct(p.product_id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-300 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium" style={{ color: "var(--theme-text, #111827)" }}>
                  Actif
                </label>
                <button
                  onClick={() => setForm({ ...form, status: form.status === "active" ? "inactive" : "active" })}
                  className={`relative w-10 h-5 rounded-full transition-all ${
                    form.status === "active" ? "bg-emerald-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${
                      form.status === "active" ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t flex items-center justify-end gap-3" style={{ borderColor: "var(--theme-border, #e5e7eb)" }}>
              <button
                onClick={() => setModalOpen(false)}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 text-sm font-medium transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-sm font-medium transition-all shadow-sm shadow-emerald-200"
              >
                {editingOffer ? "Mettre à jour" : "Créer l'offre"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-red-50 rounded-2xl flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Supprimer l'offre ?</h3>
            <p className="text-sm mb-6" style={{ color: "var(--theme-text-muted, #6b7280)" }}>
              Cette action est irréversible.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 text-sm font-medium transition-all"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 text-sm font-medium transition-all"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
