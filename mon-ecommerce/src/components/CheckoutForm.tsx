"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import * as metaPixel from "@/lib/metaPixel";
import { toast } from "sonner";

interface FormField {
  name: string;
  label: string;
  required: boolean;
}

export default function CheckoutForm({ product }: { product: any }) {
  const { subdomain } = useParams<{ subdomain: string }>();
  const productCurrency = "XOF";
  const offerInfo = product?.offer;
  const quantity = offerInfo?.quantity || 1;
  const selectedSize = product?.selectedSize;
  const productName = product.name + (selectedSize ? ` - ${selectedSize}` : "");
  const currentPrice = offerInfo ? (offerInfo.totalPrice / quantity) : (product.price ?? 0);
  const totalPrice = currentPrice * quantity;
  const [formData, setFormData] = useState<Record<string, string>>({
    customer_name: "", customer_phone: "", customer_address: "", customer_neighborhood: "",
  });
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<{
    id?: string;
    custom_form_fields?: FormField[];
    default_currency?: string;
    google_sheet_url?: string;
    google_sheet_columns?: string[];
    pixel_id?: string;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("settings")
        .select("*")
        .eq("shop_slug", subdomain)
        .single();
      if (data) {
        setSettings(data);
        if (data.google_sheet_url && !data.google_sheet_columns) {
          fetchSheetColumns(data.google_sheet_url);
        }
      }
    };
    fetchSettings();
  }, []);

  const fetchSheetColumns = async (sheetUrl: string) => {
    try {
      const response = await fetch("/api/google-sheets/columns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheet_url: sheetUrl })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.columns && data.columns.length > 0) {
          const s = settings as { id?: string } | null;
          if (s?.id) {
            await supabase.from("settings").update({
              google_sheet_columns: data.columns,
              updated_at: new Date().toISOString()
            }).eq("id", s.id);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching sheet columns:", error);
    }
  };

  const getFormFields = (): FormField[] =>
    settings?.custom_form_fields || [
      { name: "customer_name", label: "Nom complet", required: true },
      { name: "customer_phone", label: "Téléphone", required: true },
      { name: "customer_address", label: "Adresse", required: true },
    ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    metaPixel.trackInitiateCheckout({
      value: totalPrice, currency: productCurrency, num_items: quantity, content_ids: [product.id],
    });
    const orderData: any = {
      product_id: product.id, quantity, total_price: totalPrice, currency: productCurrency, product_name: productName,
    };
    if (offerInfo) {
      orderData.offer_id = offerInfo.id;
    }
    getFormFields().forEach((field) => {
      if (formData[field.name]) orderData[field.name] = formData[field.name];
    });
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });
    setLoading(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Erreur inconnue" }));
      toast.error(err.error || "Erreur lors de la commande");
    } else {
      if (settings?.google_sheet_url) {
        const columns = settings.google_sheet_columns || [
          "Date", "Nom du client", "Téléphone", "Adresse", "Quartier", 
          "Produit", "Quantité", "Total", "Devise", "Statut", "Pays"
        ];
        
        const rowData: any = {};
        
        columns.forEach((col: string) => {
          const colLower = col.toLowerCase();
          if (colLower.includes("date")) rowData[col] = new Date().toLocaleString("fr-FR");
          else if (colLower.includes("client") || colLower.includes("nom")) rowData[col] = formData.customer_name;
          else if (colLower.includes("tél") || colLower.includes("phone")) rowData[col] = formData.customer_phone;
          else if (colLower.includes("adresse")) rowData[col] = formData.customer_address;
          else if (colLower.includes("quartier") || colLower.includes("neighborhood")) rowData[col] = formData.customer_neighborhood;
          else if (colLower.includes("pays") || colLower.includes("country")) rowData[col] = ""; // will be populated on the server by IP
          else if (colLower.includes("produit") || colLower.includes("product")) rowData[col] = productName;
          else if (colLower.includes("quantité") || colLower.includes("quantity")) rowData[col] = quantity;
          else if (colLower.includes("total") || colLower.includes("price")) rowData[col] = totalPrice;
          else if (colLower.includes("devise") || colLower.includes("currency")) rowData[col] = productCurrency;
          else if (colLower.includes("statut") || colLower.includes("status")) rowData[col] = "pending";
          else rowData[col] = formData[colLower.replace(/\s/g, '_')] || "";
        });
        
        const res = await fetch("/api/google-sheets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sheet_url: settings.google_sheet_url,
            columns: columns,
            row_data: rowData,
            shop_slug: subdomain
          })
        });
        
        if (res.ok) {
          console.log("✅ Données envoyées au Google Sheets");
          if (!settings.google_sheet_columns && settings?.id) {
            await supabase.from("settings").update({
              google_sheet_columns: columns,
              updated_at: new Date().toISOString()
            }).eq("id", settings.id);
          }
        } else {
          const err = await res.json().catch(() => ({ error: "Erreur inconnue" }));
          console.error("Erreur envoi Sheets:", err);
          toast.error("Erreur envoi Google Sheets: " + (err.error || ""));
        }
      }
      
      router.push(`/boutiques/${subdomain}/thank-you?price=${totalPrice}&currency=${productCurrency}&product=${encodeURIComponent(product.name)}&qty=${quantity}`);
    }
  };

  const formFields = getFormFields();

  return (
    <div className="animate-fade-in">
      <div className="flex items-baseline justify-between mb-3 px-0.5">
        <span className="text-sm" style={{ color: "var(--theme-text-muted)" }}>Prix</span>
        <span className="text-2xl font-extrabold" style={{ color: "var(--theme-primary)" }}>
          {currentPrice ? `${currentPrice.toLocaleString()} XOF` : "N/A"}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2.5">
        {formFields.map((field) => (
          <div key={field.name}>
            <label className="block text-xs font-medium mb-0.5" style={{ color: "var(--theme-text)" }}>
              {field.label}
              <span className="text-red-500 ml-0.5">*</span>
            </label>
            <input
              type={field.name.includes("phone") ? "tel" : "text"}
              name={field.name}
              value={formData[field.name] || ""}
              onChange={handleChange}
              required={field.required}
              className="w-full text-sm transition-colors"
              style={{
                background: "var(--theme-surface)",
                border: "1px solid var(--theme-border)",
                borderRadius: "var(--theme-radius-input)",
                padding: "8px 12px",
                color: "var(--theme-text)",
                outline: "none",
              }}
              onFocus={(e) => { e.target.style.boxShadow = `0 0 0 2px var(--theme-primary)`; e.target.style.borderColor = "var(--theme-primary)"; }}
              onBlur={(e) => { e.target.style.boxShadow = "none"; e.target.style.borderColor = "var(--theme-border)"; }}
              placeholder={field.label}
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          className="w-full text-white font-semibold py-2.5 sm:py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          style={{
            background: "var(--theme-primary)",
            borderRadius: "var(--theme-radius-button)",
          }}
          onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "var(--theme-primary-hover)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "var(--theme-primary)"; }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Traitement...
            </span>
          ) : (
            "Commander — Payer à la livraison"
          )}
        </button>

        <p className="text-center text-xs" style={{ color: "var(--theme-text-muted)" }}>
          🔒 Vos données sont en sécurité
        </p>
      </form>
    </div>
  );
}