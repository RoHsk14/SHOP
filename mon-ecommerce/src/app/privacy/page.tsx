import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, Lock, Database, UserCheck, RefreshCw, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Politique de Confidentialité | ShopEazy",
  description: "Règles de confidentialité et politique de traitement des données personnelles de la plateforme ShopEazy, incluant l'utilisation des API Google.",
};

export default function PrivacyPage() {
  const lastUpdated = "24 Octobre 2026";

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans">
      {/* Navigation Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-xs">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white">
                <path d="M4 7l8-4 8 4M4 17l8 4 8-4M4 12l8-4 8 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-900 font-heading">ShopEazy</span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-600 hover:text-emerald-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* Title Header */}
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-4">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Protection de vos données et conformité
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
            Politique de Confidentialité
          </h1>
          <p className="text-sm text-gray-500">
            Dernière mise à jour : {lastUpdated}
          </p>
        </div>

        {/* Highlight Card Google API Compliance */}
        <div className="bg-emerald-900 text-white rounded-2xl p-6 sm:p-8 mb-10 shadow-lg border border-emerald-800">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 mt-1">
              <Lock className="w-5 h-5 text-emerald-300" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Engagement de conformité avec les API Google
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
                L'utilisation et le transfert par <strong>ShopEazy</strong> à toute autre application des informations reçues des API Google respecteront la{" "}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-semibold text-white hover:text-emerald-200"
                >
                  politique relative aux données utilisateur des services d'API Google
                </a>
                , y compris les exigences d'utilisation limitée (*Limited Use requirements*).
              </p>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 bg-white border border-gray-200 rounded-2xl p-6 sm:p-10 shadow-xs text-sm sm:text-base leading-relaxed text-gray-700">
          
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
              1. Introduction et Responsable du traitement
            </h2>
            <p>
              La présente Politique de Confidentialité décrit la manière dont <strong>ShopEazy</strong> (« nous », « notre » ou « la Plateforme ») recueille, utilise, conserve et protège vos informations personnelles lorsque vous utilisez notre service d'hébergement et de gestion de boutiques de commerce électronique.
            </p>
            <p>
              En accédant ou en utilisant ShopEazy, vous acceptez les pratiques décrites dans la présente politique.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
              <Database className="w-5 h-5 text-emerald-600" />
              2. Informations que nous recueillons
            </h2>
            <p>Nous pouvons recueillir et traiter les catégories de données suivantes :</p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>
                <strong>Données relatives au compte marchand :</strong> Nom, prénom, adresse email, mot de passe chiffré, nom de la boutique, numéro de téléphone, pays et devise de référence.
              </li>
              <li>
                <strong>Données des commandes clients :</strong> Nom complet du client acheteur, numéro de téléphone, adresse de livraison, quartier, produit acheté, quantité, montant total et date de passage de la commande.
              </li>
              <li>
                <strong>Données de connexion Google (OAuth 2.0) :</strong> Lorsque vous choisissez d'activer la synchronisation automatique de vos commandes avec Google Sheets, nous recevons votre adresse email Google et des jetons d'accès OAuth sécurisés nécessaires pour interagir avec votre Google Drive et Google Sheets.
              </li>
              <li>
                <strong>Données techniques de navigation :</strong> Adresse IP, type de navigateur, horodatage des visites et pages consultées à des fins de sécurité et de détection des abus.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
              <UserCheck className="w-5 h-5 text-emerald-600" />
              3. Utilisation des données recueillies
            </h2>
            <p>Vos données sont exclusivement utilisées pour :</p>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
              <li>Assurer le fonctionnement technique de votre boutique en ligne et son tableau de bord d'administration.</li>
              <li>Enregistrer et transmettre en temps réel les commandes passées par vos acheteurs.</li>
              <li>Créer automatiquement dans votre Google Drive la feuille Google Sheets dédiée à vos commandes et y insérer les nouvelles lignes lors de chaque commande.</li>
              <li>Envoyer des notifications de commande via nos intégrations (WhatsApp bot, email).</li>
              <li>Assurer le support client et prévenir toute activité frauduleuse ou abusive.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
              4. Traitement et Protection spécifique des données Google (Google API)
            </h2>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 sm:p-5 space-y-3">
              <p className="font-semibold text-gray-900">
                Pourquoi demandons-nous l'accès à Google Sheets et Google Drive ?
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Les autorisations demandées (<code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono text-gray-800">https://www.googleapis.com/auth/spreadsheets</code> et <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono text-gray-800">https://www.googleapis.com/auth/drive.file</code>) servent <strong>exclusivement</strong> à :
              </p>
              <ul className="list-disc pl-5 text-sm space-y-1 text-gray-600">
                <li>Créer une nouvelle feuille de calcul intitulée « Commandes ShopEazy - [NomDeVotreBoutique] » dans votre compte Google Drive.</li>
                <li>Écrire les données des nouvelles commandes reçues sur votre boutique (date, client, téléphone, adresse, montant).</li>
              </ul>
              <p className="text-sm font-semibold text-emerald-800 mt-2">
                Garanties strictes :
              </p>
              <ul className="list-disc pl-5 text-sm space-y-1 text-gray-600">
                <li>Nous ne consultons, ne modifions et ne supprimons <strong>aucun</strong> autre fichier présent sur votre Google Drive.</li>
                <li>Nous ne vendons, ne louons et ne transférons <strong>jamais</strong> vos données Google à des tiers ou à des courtiers de données.</li>
                <li>Vos données Google ne sont <strong>en aucun cas</strong> utilisées pour l'affichage de publicités ciblées ou pour l'entraînement de modèles d'intelligence artificielle généraux.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
              <Lock className="w-5 h-5 text-emerald-600" />
              5. Sécurité et Conservation des données
            </h2>
            <p>
              Nous mettons en œuvre des mesures techniques et organisationnelles conformes aux standards de l'industrie pour protéger vos informations contre tout accès, altération ou divulgation non autorisés.
            </p>
            <p>
              Les jetons d'accès et d'actualisation OAuth sont chiffrés et stockés dans des bases de données sécurisées dotées de contrôles d'accès stricts.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
              <RefreshCw className="w-5 h-5 text-emerald-600" />
              6. Déconnexion et Révocation des accès Google
            </h2>
            <p>
              Vous conservez le contrôle total sur votre compte à tout moment :
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
              <li>
                <strong>Depuis ShopEazy :</strong> Vous pouvez déconnecter votre compte Google en un clic depuis le tableau de bord de votre boutique (<span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded">Paramètres &gt; Google Sheets</span>). Tous les jetons d'accès associés seront instantanément supprimés de nos serveurs.
              </li>
              <li>
                <strong>Depuis Google :</strong> Vous pouvez révoquer les accès accordés à ShopEazy directement depuis la page des permissions de votre compte Google :{" "}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 underline hover:text-emerald-700 font-semibold"
                >
                  Gestion des autorisations de compte Google
                </a>.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
              7. Vos droits (RGPD et lois applicables)
            </h2>
            <p>
              Conformément à la réglementation applicable, vous disposez d'un droit d'accès, de rectification, de portabilité et de suppression de vos données personnelles, ainsi que d'un droit d'opposition ou de limitation de leur traitement.
            </p>
            <p>
              Pour exercer l'un de ces droits, vous pouvez nous contacter à tout moment à l'adresse indiquée ci-dessous.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
              <Mail className="w-5 h-5 text-emerald-600" />
              8. Contact
            </h2>
            <p>
              Pour toute question ou demande relative à cette Politique de Confidentialité ou à la gestion de vos données, vous pouvez nous contacter :
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm space-y-1 text-gray-700">
              <p><strong>Plateforme :</strong> ShopEazy</p>
              <p><strong>Email :</strong> <a href="mailto:rodriguehessou14@gmail.com" className="text-emerald-600 underline font-semibold">rodriguehessou14@gmail.com</a></p>
              <p><strong>Support :</strong> Disponible 7j/7 depuis votre espace d'administration ShopEazy</p>
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} ShopEazy. Tous droits réservés.</p>
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-gray-900 transition-colors">Accueil</Link>
            <Link href="/terms" className="hover:text-gray-900 transition-colors">Conditions d'utilisation</Link>
            <Link href="/privacy" className="text-emerald-600 font-semibold">Confidentialité</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
