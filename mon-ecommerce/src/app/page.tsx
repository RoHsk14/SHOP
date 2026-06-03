import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white">
                <path d="M4 7l8-4 8 4M4 17l8 4 8-4M4 12l8-4 8 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-900">ShopEazy</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all">
              Se connecter
            </Link>
            <Link href="/signup" className="text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 rounded-xl transition-all shadow-sm">
              S&apos;inscrire
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-32">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Lancez votre boutique en ligne
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight leading-tight">
            Créez votre boutique e-commerce
            <span className="text-emerald-600"> en quelques minutes</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-500 leading-relaxed max-w-2xl mx-auto">
            Lancez votre activité avec une boutique professionnelle. Paiement à la livraison,
            gestion des commandes, catalogue produits &mdash; tout est inclus.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-all shadow-md hover:shadow-lg"
            >
              Commencer gratuitement
            </Link>
            <Link
              href="/login"
              className="text-gray-600 hover:text-gray-900 font-medium px-8 py-3.5 rounded-xl text-base border border-gray-200 hover:border-gray-300 transition-all"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Tout ce qu&apos;il vous faut pour vendre
            </h2>
            <p className="text-gray-500 mt-3">Une solution complète, simple et puissante</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: "Catalogue produits", desc: "Ajoutez vos produits avec photos, prix et descriptions en quelques clics." },
              { title: "Paiement à la livraison", desc: "Sans passerelle de paiement. Le client paie à la réception." },
              { title: "Dashboard admin", desc: "Suivez vos commandes, gérez votre stock et vos clients." },
              { title: "Pages produits", desc: "Chaque produit a sa propre page, facile à partager." },
              { title: "Multi-boutiques", desc: "Gérez plusieurs boutiques avec un seul compte." },
              { title: "Export commandes", desc: "Exportez vos commandes vers Google Sheets." },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-xs text-gray-400">
        &copy; {new Date().getFullYear()} ShopEazy. Tous droits réservés.
      </footer>
    </div>
  );
}
