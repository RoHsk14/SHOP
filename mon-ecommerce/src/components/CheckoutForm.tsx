"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/currency";
import * as metaPixel from "@/lib/metaPixel";
import { toast } from "sonner";

interface FormField {
  name: string;
  label: string;
  required: boolean;
}

export default function CheckoutForm({ product }: { product: any }) {
  const productCurrency = product.prices ? Object.keys(product.prices)[0] : "EUR";
  const quantity = 1;
  const [formData, setFormData] = useState<Record<string, string>>({
    customer_name: "", customer_phone: "", customer_address: "", customer_neighborhood: "",
  });
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<{
    custom_form_fields?: FormField[];
    default_currency?: string;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from("settings").select("*").single();
      if (data) {
        setSettings(data);
        // Si on a l'URL du Sheet mais pas les colonnes, essayer de les récupérer
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
          // Sauvegarder les colonnes dans les settings
          const { data: settingsData } = await supabase.from("settings").select("id").single();
          if (settingsData?.id) {
            await supabase.from("settings").update({
              google_sheet_columns: data.columns,
              updated_at: new Date().toISOString()
            }).eq("id", settingsData.id);
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

  const currentPrice = product.prices?.[productCurrency] || 0;
  const totalPrice = currentPrice * quantity;

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
      product_id: product.id, quantity, total_price: totalPrice, currency: productCurrency,
    };
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
      // Send to Google Sheets
      const { data: settings } = await supabase.from("settings").select("google_sheet_url, google_sheet_columns").maybeSingle();
      
      if (settings?.google_sheet_url) {
        // Utiliser les colonnes de la DB ou celles par défaut
        const columns = settings.google_sheet_columns || [
          "Date", "Nom du client", "Téléphone", "Adresse", "Quartier", 
          "Produit", "Quantité", "Total", "Devise", "Statut"
        ];
        
        const rowData: any = {};
        
        // Mapper les données vers les colonnes
        columns.forEach((col: string) => {
          const colLower = col.toLowerCase();
          if (colLower.includes("date")) rowData[col] = new Date().toLocaleString("fr-FR");
          else if (colLower.includes("client") || colLower.includes("nom")) rowData[col] = formData.customer_name;
          else if (colLower.includes("tél") || colLower.includes("phone")) rowData[col] = formData.customer_phone;
          else if (colLower.includes("adresse")) rowData[col] = formData.customer_address;
          else if (colLower.includes("quartier") || colLower.includes("neighborhood")) rowData[col] = formData.customer_neighborhood;
          else if (colLower.includes("produit") || colLower.includes("product")) rowData[col] = product.name;
          else if (colLower.includes("quantité") || colLower.includes("quantity")) rowData[col] = quantity;
          else if (colLower.includes("total") || colLower.includes("price")) rowData[col] = totalPrice;
          else if (colLower.includes("devise") || colLower.includes("currency")) rowData[col] = productCurrency;
          else if (colLower.includes("statut") || colLower.includes("status")) rowData[col] = "pending";
          else rowData[col] = formData[colLower.replace(/\s/g, '_')] || "";
        });
        
        // Envoyer au Sheet
        fetch("/api/google-sheets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sheet_url: settings.google_sheet_url,
            columns: columns,
            row_data: rowData
          })
        }).then(async (res) => {
          if (res.ok) {
            console.log("✅ Données envoyées au Google Sheets");
            // Sauvegarder les colonnes en DB si pas encore fait
            if (!settings.google_sheet_columns) {
              const { data: settingsData } = await supabase.from("settings").select("id").single();
              if (settingsData?.id) {
                await supabase.from("settings").update({
                  google_sheet_columns: columns,
                  updated_at: new Date().toISOString()
                }).eq("id", settingsData.id);
              }
            }
          } else {
            console.error("Erreur envoi Sheets:", await res.json());
          }
        }).catch(err => console.error("Google Sheets error:", err));
      }
      
      router.push(`/thank-you?price=${totalPrice}&currency=${productCurrency}&product=${encodeURIComponent(product.name)}&qty=${quantity}`);
    }
  };

  const formFields = getFormFields();

  return (
    <div className="animate-fade-in">
      <div className="flex items-baseline justify-between mb-3 px-0.5">
        <span className="text-sm text-gray-500">Prix</span>
        <span className="text-2xl font-extrabold text-green-700">
          {currentPrice ? formatPrice(currentPrice, productCurrency) : "N/A"}
        </span>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-2.5">
        {formFields.map((field) => (
          <div key={field.name}>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">
              {field.label}
              {field.required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            <input
              type={field.name.includes("phone") ? "tel" : "text"}
              name={field.name}
              value={formData[field.name] || ""}
              onChange={handleChange}
              required={field.required}
              className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              placeholder={field.label}
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-semibold py-2.5 sm:py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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

        <p className="text-center text-xs text-gray-400">
          🔒 Vos données sont en sécurité
        </p>
      </form>
    </div>
  );
}
