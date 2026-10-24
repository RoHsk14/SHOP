import type { Metadata } from "next";
import Link from "next/link";
import { FileText, ArrowLeft, CheckCircle2, AlertTriangle, ShieldCheck, HelpCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Conditions d'Utilisation | ShopEazy",
  description: "Conditions générales d'utilisation du service de création et de gestion de boutiques en ligne ShopEazy.",
};

export default function TermsPage() {
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
            <FileText className="w-4 h-4 text-emerald-600" />
            Cadre légal et contractuel
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
            Conditions Générales d'Utilisation
          </h1>
          <p className="text-sm text-gray-500">
            Dernière mise à jour : {lastUpdated}
          </p>
        </div>

        {/* Content Box */}
        <div className="space-y-8 bg-white border border-gray-200 rounded-2xl p-6 sm:p-10 shadow-xs text-sm sm:text-base leading-relaxed text-gray-700">
          
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
              1. Objet du Service
            </h2>
            <p>
              <strong>ShopEazy</strong> est une plateforme logicielle hébergée en mode SaaS (Software as a Service) permettant aux créateurs, entrepreneurs et commerçants de concevoir, personnaliser et exploiter des boutiques en ligne optimisées pour le commerce électronique.
            </p>
            <p>
              Les présentes Conditions d'Utilisation régissent l'accès et l'utilisation de l'ensemble des services, fonctionnalités et outils proposés par ShopEazy.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              2. Création et Responsabilité du Compte
            </h2>
            <p>
              Pour utiliser ShopEazy, vous devez créer un compte marchand et fournir des informations exactes et à jour.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
              <li>Vous êtes responsable de la confidentialité de vos identifiants de connexion et de toute activité effectuée depuis votre compte.</li>
              <li>Vous devez nous notifier immédiatement de toute utilisation non autorisée ou faille de sécurité constatée.</li>
              <li>ShopEazy se réserve le droit de suspendre ou fermer tout compte dont les informations fournies s'avèrent mensongères ou frauduleuses.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              3. Règles d'Usage et Produits Interdits
            </h2>
            <p>
              Le marchand s'engage à respecter les lois en vigueur dans les pays où il exerce son commerce. Sont formellement interdits sur les boutiques ShopEazy :
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
              <li>La vente de produits contrefaits, volés ou violant la propriété intellectuelle de tiers.</li>
              <li>Les substances illicites, drogues, armes et explosifs.</li>
              <li>Les contenus diffamatoires, trompeurs, pornographiques ou incitant à la haine ou à la violence.</li>
              <li>Les pratiques commerciales trompeuses, faux avis ou escroqueries à la livraison.</li>
            </ul>
            <p className="text-xs text-gray-500 italic mt-2">
              Tout manquement grave peut entraîner la résiliation immédiate du compte sans préavis ni remboursement.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
              4. Intégrations Tierces (Google Sheets, Meta, WhatsApp)
            </h2>
            <p>
              ShopEazy propose des fonctionnalités d'interopérabilité avec des services tiers :
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>
                <strong>Google Sheets &amp; Google Drive :</strong> Lorsque vous activez l'intégration, vous autorisez ShopEazy à créer et mettre à jour votre feuille de suivi de commandes sur votre compte Google. Vous pouvez révoquer cette autorisation à tout moment sans incidence sur le reste de votre boutique.
              </li>
              <li>
                <strong>Meta Pixel &amp; API Conversions (CAPI) :</strong> Vous êtes seul responsable du respect des conditions d'utilisation de Meta et de l'information apportée à vos clients quant au suivi publicitaire.
              </li>
              <li>
                <strong>WhatsApp Bot :</strong> L'envoi automatique de notifications de commandes via WhatsApp nécessite le respect des politiques anti-spam de la messagerie.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              5. Relations Marchand - Acheteurs
            </h2>
            <p>
              ShopEazy fournit l'infrastructure logicielle et technologique, mais <strong>n'est pas partie prenante</strong> aux ventes conclues entre les marchands et leurs clients finaux.
            </p>
            <p>
              Le marchand demeure l'unique responsable du traitement des commandes, de la conformité des produits, de l'expédition physique, de la politique de retour ou d'échange, et du service après-vente auprès de ses clients.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
              6. Propriété Intellectuelle
            </h2>
            <p>
              Tous les droits de propriété intellectuelle afférents au logiciel, au code source, à l'interface, aux logos et aux composants de ShopEazy restent la propriété exclusive de ShopEazy.
            </p>
            <p>
              Le marchand conserve l'entière propriété des marques, images, textes et produits qu'il importe ou publie sur sa propre boutique.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
              7. Disponibilité du Service et Limitation de Responsabilité
            </h2>
            <p>
              Nous mettons en œuvre tous les efforts raisonnables pour garantir une disponibilité continue 24h/24 et 7j/7 du service. Toutefois, nous ne saurions être tenus responsables des interruptions momentanées pour maintenance ou des pannes imputables aux réseaux de télécommunications externes.
            </p>
            <p>
              En aucun cas ShopEazy ne pourra être tenu responsable des pertes de profits, d'opportunités commerciales ou de dommages indirects subis par le marchand ou ses clients.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2">
              <HelpCircle className="w-5 h-5 text-emerald-600" />
              8. Modification des Conditions et Droit Applicable
            </h2>
            <p>
              ShopEazy se réserve le droit de modifier les présentes Conditions d'Utilisation à tout moment pour refléter les évolutions légales ou techniques de la plateforme. Les marchands seront informés de toute mise à jour significative.
            </p>
            <p>
              Pour toute question ou réclamation concernant ces conditions, vous pouvez nous écrire à :{" "}
              <a href="mailto:rodriguehessou14@gmail.com" className="text-emerald-600 underline font-semibold">
                rodriguehessou14@gmail.com
              </a>.
            </p>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} ShopEazy. Tous droits réservés.</p>
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-gray-900 transition-colors">Accueil</Link>
            <Link href="/terms" className="text-emerald-600 font-semibold">Conditions d'utilisation</Link>
            <Link href="/privacy" className="hover:text-gray-900 transition-colors">Confidentialité</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
