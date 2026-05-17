"use client";

import { useEffect, Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import * as XLSX from "xlsx";
import * as metaPixel from "@/lib/metaPixel";
import { formatPrice } from "@/lib/currency";

function Confetti() {
  const colors = ['#22c55e', '#16a34a', '#86efac', '#f59e0b', '#3b82f6', '#ec4899'];
  return (
    <div className="confetti-wrap">
      {Array.from({ length: 24 }).map((_, i) => (
        <div key={i} className="confetti-dot" style={{
          left: `${Math.random() * 100}%`,
          backgroundColor: colors[Math.floor(Math.random() * colors.length)],
          borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          width: `${6 + Math.random() * 6}px`,
          height: `${6 + Math.random() * 6}px`,
          animationDelay: `${Math.random() * 2}s`,
          animationDuration: `${2.5 + Math.random() * 2}s`,
        }} />
      ))}
    </div>
  );
}

function ThankYouContent() {
  const searchParams = useSearchParams();
  const price = searchParams.get("price");
  const currency = searchParams.get("currency") || "EUR";
  const productName = searchParams.get("product") || "Produit inconnu";
  const qty = searchParams.get("qty") || "1";
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    if (price && currency) {
      metaPixel.trackPurchase({
        value: Number(price),
        currency: currency,
        content_name: productName,
        num_items: Number(qty),
      });
    }
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, [price, currency, productName, qty]);

  const handleExport = () => {
    const data = [{
      "Produit": productName, "Quantité": qty, "Prix Total": price,
      "Devise": currency, "Date de commande": new Date().toLocaleString(), "Statut": "En attente (COD)",
    }];
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Commande");
    XLSX.writeFile(workbook, "reçu_commande.xlsx");
  };

  return (
    <>
      {showConfetti && <Confetti />}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12 max-w-lg mx-auto w-full text-center animate-slide-up">
        {/* Check icon */}
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-check">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Merci pour votre commande !</h1>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          Votre commande de <span className="font-semibold text-gray-800">{qty}x {productName}</span> a bien été enregistrée. Nous vous contacterons pour la livraison.
        </p>

        {price && (
          <div className="bg-green-50 border border-green-100 rounded-xl p-5 mb-8 text-left">
            <p className="text-xs font-semibold text-green-800 uppercase tracking-wider mb-2">Récapitulatif</p>
            <div className="flex justify-between items-baseline">
              <span className="text-sm text-gray-600">Total à payer</span>
              <span className="text-xl font-bold text-green-700">{formatPrice(Number(price), currency)}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={handleExport} className="flex-1 flex items-center justify-center gap-2 px-5 py-3 border border-gray-200 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            Télécharger le reçu
          </button>
          <Link href="/" className="flex-1 flex items-center justify-center px-5 py-3 text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors">
            Retour à la boutique
          </Link>
        </div>
      </div>
    </>
  );
}

export default function ThankYouPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <Suspense fallback={<div className="text-gray-400 text-sm">Chargement...</div>}>
        <ThankYouContent />
      </Suspense>
    </main>
  );
}
