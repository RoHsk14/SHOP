"use client";

import { useShop } from "@/lib/shop-context";
import { CheckCircle, Package, Mail } from "lucide-react";

export default function SectionThankYou() {
  const { subdomain } = useShop();

  return (
    <div className="mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center" style={{ maxWidth: "var(--theme-container-width, 1200px)" }}>
      <div className="max-w-lg mx-auto">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>

        <h1
          className="text-3xl sm:text-4xl font-bold mb-4"
          style={{ color: "var(--theme-text)", fontFamily: "var(--theme-font-heading)" }}
        >
          Merci pour votre commande !
        </h1>

        <p className="text-base mb-8" style={{ color: "var(--theme-text-muted)" }}>
          Votre commande a bien été enregistrée. Vous recevrez un email de confirmation sous peu.
        </p>

        <div className="rounded-2xl border p-6 mb-8 text-left space-y-4" style={{ borderColor: "var(--theme-border, #e5e7eb)" }}>
          <div className="flex items-start gap-3">
            <Package className="w-5 h-5 mt-0.5" style={{ color: "var(--theme-primary)" }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--theme-text)" }}>Suivi de commande</p>
              <p className="text-xs" style={{ color: "var(--theme-text-muted)" }}>Vous recevrez un numéro de suivi dès que votre commande sera expédiée.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 mt-0.5" style={{ color: "var(--theme-primary)" }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--theme-text)" }}>Confirmation par email</p>
              <p className="text-xs" style={{ color: "var(--theme-text-muted)" }}>Un email récapitulatif vous a été envoyé avec les détails de votre commande.</p>
            </div>
          </div>
        </div>

        <a
          href={`/boutiques/${subdomain}/products`}
          className="inline-flex items-center gap-2 px-8 py-3 text-sm font-semibold rounded-xl transition-all hover:opacity-90"
          style={{
            background: "var(--theme-primary)",
            color: "#ffffff",
            borderRadius: "var(--theme-radius-button)",
          }}
        >
          Continuer mes achats
        </a>
      </div>
    </div>
  );
}
