"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { ChevronDown, Menu, X, Star, Play, TrendingUp, Palette, BarChart4, Store, Upload, ShoppingBag, Flame, ArrowUpRight, Sparkles } from "lucide-react";

const testimonials = [
  {
    name: "Amadou Diallo",
    role: "Fondateur, Dakar Mode",
    quote: "J'ai lancé ma boutique en moins d'une heure. Mes clients commandent depuis SHopEaszy et paient à la livraison. Un vrai game changer pour mon business.",
    rating: 5,
  },
  {
    name: "Fatou Ndiaye",
    role: "Créatrice, Accessoires Fatou",
    quote: "Enfin une solution adaptée au marché sénégalais. Le paiement à la livraison a fait décoller mes ventes. L'export Google Sheets me fait gagner des heures.",
    rating: 5,
  },
  {
    name: "Mamadou Touré",
    role: "CEO, Trendy Abidjan",
    quote: "Je cherchais une plateforme simple pour vendre en ligne sans frais bancaires. ShopEazy m'a permis de passer commande avec Orange Money directement.",
    rating: 5,
  },
  {
    name: "Aïssatou Ba",
    role: "Fondatrice, Ba Cosmetics",
    quote: "L'import Shopify m'a permis de migrer mon ancienne boutique en 5 minutes. Le suivi des stocks et des commandes est juste parfait.",
    rating: 5,
  },
  {
    name: "Oumar Sy",
    role: "E-commerçant, Guinée Market",
    quote: "Avec ShopEazy, j'ai multiplié mes ventes par 3. Mes clients adorent la simplicité : ils commandent en ligne, paient à la livraison.",
    rating: 5,
  },
  {
    name: "Rokhaya Diop",
    role: "Créatrice de bijoux",
    quote: "La possibilité d'importer des produits depuis n'importe quelle URL m'a fait gagner un temps fou. Je recommande à 100%.",
    rating: 5,
  },
];

const faqs = [
  {
    q: "Comment fonctionne le paiement à la livraison ?",
    a: "Simple : le client commande sur votre boutique, vous recevez la commande dans votre dashboard, et le client paie en espèces ou via mobile money à la réception. Pas besoin de passerelle de paiement internationale.",
  },
  {
    q: "Puis-je importer des produits depuis AliExpress ou Shopify ?",
    a: "Oui ! Notre importateur par URL extrait automatiquement les images, le prix, la description et les tailles depuis n'importe quelle boutique en ligne. Vous pouvez aussi importer des thèmes Shopify entiers.",
  },
  {
    q: "Combien de temps faut-il pour lancer ma boutique ?",
    a: "Moins de 30 minutes. Créez votre compte, ajoutez vos produits et votre boutique est en ligne. Le tout sans compétences techniques.",
  },
  {
    q: "Puis-je personnaliser l'apparence de ma boutique ?",
    a: "Absolument. Choisissez parmi nos thèmes, personnalisez les couleurs et polices, réorganisez les sections par glisser-déposer. Vous pouvez même importer vos propres thèmes Shopify.",
  },
  {
    q: "Quels moyens de paiement puis-je proposer ?",
    a: "Le paiement à la livraison est le mode principal. Vous pouvez aussi configurer Orange Money, MTN Mobile Money, Wave et d'autres services mobile money. Idéal pour l'Afrique.",
  },
  {
    q: "Y a-t-il un engagement ou un contrat ?",
    a: "Aucun engagement. Vous pouvez annuler à tout moment. Le plan gratuit vous permet de commencer sans carte bancaire. Pas de surprise, pas de frais cachés.",
  },
];

const stats = [
  { value: 500, label: "Boutiques créées", suffix: "+" },
  { value: 10000, label: "Commandes traitées", suffix: "+" },
  { value: 50000, label: "Produits en ligne", suffix: "+" },
  { value: 4.8, label: "Satisfaction client", suffix: "/5", decimals: 1 },
];

const brands = [
  { name: "Dakar Mode", initials: "DM" },
  { name: "Ba Cosmetics", initials: "BC" },
  { name: "Trendy Abidjan", initials: "TA" },
  { name: "Accessoires Fatou", initials: "AF" },
  { name: "Guinée Market", initials: "GM" },
  { name: "Boutique Ami", initials: "BA" },
];

const journeySteps = [
  {
    icon: Store,
    title: "Boutique en 5 minutes",
    text: "Nom, adresse et devise : votre vitrine est prête à recevoir ses premières commandes.",
  },
  {
    icon: Upload,
    title: "Catalogue importé",
    text: "Photos, prix et descriptions récupérés automatiquement depuis votre ancienne boutique.",
  },
  {
    icon: ShoppingBag,
    title: "Première vente",
    text: "Notification instantanée, commande centralisée et encaissement à la livraison.",
  },
];

function MotionPlayer({
  src,
  poster,
  label,
  className = "",
}: {
  src: string;
  poster: string;
  label: string;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.25 }
    );

    observer.observe(video);
    return () => {
      observer.disconnect();
      video.pause();
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-gradient-to-r from-emerald-400/10 via-teal-400/10 to-blue-400/10 blur-2xl" />
      <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-2xl shadow-emerald-900/10 sm:rounded-3xl">
        <div className="flex h-8 items-center gap-1.5 border-b border-gray-100 bg-gray-50 px-3 sm:h-9 sm:gap-2 sm:px-4">
          <span className="h-2 w-2 rounded-full bg-red-400 sm:h-2.5 sm:w-2.5" />
          <span className="h-2 w-2 rounded-full bg-amber-400 sm:h-2.5 sm:w-2.5" />
          <span className="h-2 w-2 rounded-full bg-emerald-400 sm:h-2.5 sm:w-2.5" />
          <div className="ml-2 flex min-w-0 flex-1 items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[10px] text-gray-400 ring-1 ring-gray-100 sm:ml-3 sm:text-[11px]">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
            <span className="truncate">shopeazy.com/apercu</span>
          </div>
          <span className="hidden shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-gray-500 ring-1 ring-gray-100 sm:inline-flex">
            30 s
          </span>
        </div>
        <div className="relative aspect-video overflow-hidden bg-gray-900">
          <video
            ref={videoRef}
            src={src}
            poster={poster}
            muted
            loop
            playsInline
            preload="metadata"
            aria-label={label}
            className="h-full w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
          <div className="pointer-events-none absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-gray-700 shadow-sm backdrop-blur sm:bottom-4 sm:left-4">
            <Play className="h-3 w-3 fill-emerald-600 text-emerald-600" />
            Démo · 30 s
          </div>
        </div>
      </div>
    </div>
  );
}

function AnimatedCounter({ value, suffix = "", decimals = 0 }: { value: number; suffix?: string; decimals?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const done = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !done.current) {
          done.current = true;
          const duration = 1500;
          const steps = 30;
          let step = 0;
          const interval = setInterval(() => {
            step++;
            const progress = Math.min(step / steps, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * value * Math.pow(10, decimals)) / Math.pow(10, decimals));
            if (step >= steps) clearInterval(interval);
          }, duration / steps);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, decimals]);

  const display = decimals > 0 ? count.toFixed(decimals) : count.toLocaleString();
  return <span ref={ref}>{display}{suffix}</span>;
}

export default function LandingPage() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [scrolled, setScrolled] = useState(false);
  const [showFloating, setShowFloating] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 60);
      setShowFloating(y > 800);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const navLinks = [
    { label: "Fonctionnalités", href: "#fonctionnalités" },
    { label: "Témoignages", href: "#témoignages" },
    { label: "FAQ", href: "#faq" },
    { label: "Tarifs", href: "#tarifs" },
  ];

  return (
    <div className="min-h-screen bg-white scroll-smooth">
      {/* ── Navbar ── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white/95 backdrop-blur-xl shadow-sm border-b border-gray-100" : "bg-transparent"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white">
                <path d="M4 7l8-4 8 4M4 17l8 4 8-4M4 12l8-4 8 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-900 font-heading">ShopEazy</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => (
              <a key={item.label} href={item.href} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-all">
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden sm:inline-flex text-sm font-medium text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all">
              Se connecter
            </Link>
            <Link href="/signup" className="text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 px-5 py-2.5 rounded-xl transition-all shadow-sm">
              Créer ma boutique
            </Link>
            <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2 text-gray-600 relative z-50">
              {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile slide-in drawer */}
        <div className={`md:hidden fixed inset-0 z-40 transition-all duration-300 ${
          mobileMenu ? "visible" : "invisible"
        }`}>
          <div
            className={`absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${
              mobileMenu ? "opacity-100" : "opacity-0"
            }`}
            onClick={() => setMobileMenu(false)}
          />
          <div className={`absolute top-0 right-0 h-full w-72 bg-white shadow-2xl transition-transform duration-300 ${
            mobileMenu ? "translate-x-0" : "translate-x-full"
          }`}>
            <div className="pt-20 px-6 space-y-1">
              {navLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenu(false)}
                  className="block px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-xl hover:bg-gray-50 transition-all"
                >
                  {item.label}
                </a>
              ))}
              <hr className="my-3 border-gray-100" />
              <Link
                href="/login"
                onClick={() => setMobileMenu(false)}
                className="block px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-50 transition-all"
              >
                Se connecter
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileMenu(false)}
                className="block px-4 py-3 mt-2 text-sm font-semibold text-center text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all"
              >
                Créer ma boutique
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-0" />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-teal-50" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28 lg:py-36">
          <div className="text-center max-w-4xl mx-auto">
            <div className="animate-fade-up inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 border border-emerald-200/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Lancez votre boutique en ligne en 5 minutes
            </div>
            <h1 className="animate-fade-up-lg delay-2 text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 tracking-tight leading-[1.1]">
              Créez votre boutique e-commerce
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500"> en Afrique</span>
            </h1>
            <p className="animate-fade-up delay-4 mt-6 text-lg sm:text-xl text-gray-500 leading-relaxed max-w-2xl mx-auto">
              Lancez votre activité avec une boutique professionnelle. Paiement à la livraison,
              catalogue produits, tracking des commandes et export Google Sheets &mdash; tout inclus.
            </p>
            <div className="animate-fade-up delay-6 mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link
                href="/signup"
                className="w-full sm:w-auto text-center bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
              >
                Créer ma boutique gratuitement
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto text-center text-gray-600 hover:text-gray-900 font-medium px-8 py-3.5 rounded-xl text-base border border-gray-200 hover:border-gray-300 transition-all hover:scale-105 active:scale-95"
              >
                Se connecter
              </Link>
            </div>
            <p className="animate-fade-up delay-8 mt-6 text-xs text-gray-400">Aucune carte bancaire requise &middot; Annulation à tout moment</p>
          </div>
        </div>
      </section>

      {/* ── Dashboard Preview ── */}
      <section className="py-16 sm:py-20 lg:py-24 overflow-hidden bg-gradient-to-b from-white to-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="animate-fade-up inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-4 border border-emerald-200/50">
              Dashboard
            </div>
            <h2 className="animate-fade-up delay-2 text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight font-heading">
              Un tableau de bord clair et puissant
            </h2>
            <p className="animate-fade-up delay-3 text-gray-500 mt-4 text-lg max-w-2xl mx-auto">
              Toutes vos données en temps réel : ventes, commandes, produits et statistiques
            </p>
          </div>

          <div className="animate-fade-up delay-4 mx-auto max-w-5xl">
            <MotionPlayer
              src="/motion/mot3.mp4"
              poster="/motion/mot3-poster.jpg"
              label="Démonstration ShopEazy : création de boutique, personnalisation, import du catalogue et première vente"
            />
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
              {["Commandes en temps réel", "Suivi des statuts", "Paiement à la livraison"].map((item) => (
                <span key={item} className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-600 shadow-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Logos Bar ── */}
      <section className="border-y border-gray-100 bg-gradient-to-r from-gray-50 via-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <p className="text-center text-xs font-medium text-gray-400 uppercase tracking-widest mb-5">Ils nous font confiance</p>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 sm:gap-x-12">
            {brands.map((b) => (
              <div key={b.name} className="flex items-center gap-2.5 text-gray-400 hover:text-gray-600 transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors flex items-center justify-center text-[11px] font-bold text-gray-500">
                  {b.initials}
                </div>
                <span className="text-sm font-medium">{b.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats Bar (animated) ── */}
      <section className="border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {stats.map((stat, i) => (
              <div key={stat.label} className={`animate-fade-up text-center delay-${i * 2 + 1}`}>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tabular-nums">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} decimals={stat.decimals ?? 0} />
                </p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Alternating Feature Sections ── */}
      <section id="fonctionnalités" className="py-16 sm:py-24">

        {/* ─── Section 1: Catalogue Produits (text left, image right) ─── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-20 sm:mb-28">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="animate-fade-up">
              <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-[11px] font-semibold px-3 py-1 rounded-full mb-4 border border-emerald-200/50">
                <TrendingUp className="w-3 h-3" />
                Catalogue produits
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight font-heading leading-[1.15] mb-4">
                Gérez votre catalogue en un clin d&apos;œil
              </h2>
              <p className="text-gray-500 text-base sm:text-lg leading-relaxed mb-6">
                Ajoutez vos produits avec photos, prix, descriptions et variantes en quelques clics.
                Importez en masse par CSV ou depuis n&apos;importe quelle URL &mdash; images, prix et tailles
                sont extraits automatiquement.
              </p>
              <ul className="space-y-2.5">
                {["Import CSV & URL", "Photos illimitées", "Tailles et variantes", "Stock & statut actif/inactif"].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-gray-600">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                      <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="animate-fade-up delay-3 relative flex justify-center lg:justify-end">
              <div className="hidden sm:block absolute -top-4 -left-4 w-40 h-40 bg-emerald-200/20 rounded-full blur-[60px] pointer-events-none" />
              <div className="relative w-full max-w-lg rounded-2xl border border-gray-200/80 shadow-2xl shadow-emerald-900/8 bg-white overflow-hidden hover:scale-[1.01] transition-transform duration-500">
                <div className="h-6 sm:h-7 bg-gray-50 border-b border-gray-100 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4">
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-400 shadow-sm" />
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-400 shadow-sm" />
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-400 shadow-sm" />
                  <div className="ml-2 sm:ml-3 h-2 sm:h-2.5 w-28 sm:w-36 bg-gray-200/60 rounded-full" />
                </div>
                <Image src="/motion/mot3-catalogue.jpg" alt="Catalogue de produits importé dans ShopEazy" width={1200} height={900} sizes="(min-width: 1024px) 512px, 100vw" className="w-full h-auto" />
              </div>
            </div>
          </div>
        </div>

        {/* ─── Section 2: Dashboard & Commandes (image left, text right) ─── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-20 sm:mb-28">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="animate-fade-up order-2 lg:order-1 relative flex justify-center lg:justify-start">
              <div className="hidden sm:block absolute -bottom-4 -right-4 w-40 h-40 bg-blue-200/20 rounded-full blur-[60px] pointer-events-none" />
              <div className="relative w-full max-w-lg rounded-2xl border border-gray-200/80 shadow-2xl shadow-blue-900/8 bg-white overflow-hidden hover:scale-[1.01] transition-transform duration-500">
                <div className="h-6 sm:h-7 bg-gray-50 border-b border-gray-100 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4">
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-400 shadow-sm" />
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-400 shadow-sm" />
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-400 shadow-sm" />
                  <div className="ml-2 sm:ml-3 h-2 sm:h-2.5 w-28 sm:w-36 bg-gray-200/60 rounded-full" />
                </div>
                <Image src="/motion/mot4-dashboard.jpg" alt="Commandes et indicateurs de ventes dans le dashboard ShopEazy" width={1200} height={900} sizes="(min-width: 1024px) 512px, 100vw" className="w-full h-auto" />
              </div>
            </div>
            <div className="animate-fade-up delay-3 order-1 lg:order-2">
              <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-[11px] font-semibold px-3 py-1 rounded-full mb-4 border border-blue-200/50">
                <BarChart4 className="w-3 h-3" />
                Dashboard &amp; commandes
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight font-heading leading-[1.15] mb-4">
                Suivez vos ventes en temps réel
              </h2>
              <p className="text-gray-500 text-base sm:text-lg leading-relaxed mb-6">
                Un tableau de bord clair avec vos indicateurs clés : visites, ventes, commandes et taux
                de conversion. Toutes vos commandes sont centralisées avec suivi du statut et historique.
              </p>
              <ul className="space-y-2.5">
                {["KPIs en temps réel", "Graphiques d'évolution", "Gestion des commandes", "Notifications instantanées"].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-gray-600">
                    <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                      <svg className="w-3 h-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ─── Section 3: Personnalisation (text left, image right) ─── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="animate-fade-up">
              <div className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 text-[11px] font-semibold px-3 py-1 rounded-full mb-4 border border-purple-200/50">
                <Palette className="w-3 h-3" />
                Personnalisation
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight font-heading leading-[1.15] mb-4">
                Une boutique à votre image
              </h2>
              <p className="text-gray-500 text-base sm:text-lg leading-relaxed mb-6">
                Importez des thèmes Shopify, personnalisez couleurs et polices, réorganisez les sections
                par glisser-déposer. Votre boutique reflète votre marque, sans coder.
              </p>
              <ul className="space-y-2.5">
                {["Thèmes personnalisables", "Import Shopify", "Sections modulables", "Multi-devices"].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-gray-600">
                    <div className="w-5 h-5 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                      <svg className="w-3 h-3 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="animate-fade-up delay-3 relative flex justify-center lg:justify-end">
              <div className="hidden sm:block absolute -top-4 -left-4 w-40 h-40 bg-purple-200/20 rounded-full blur-[60px] pointer-events-none" />
              <div className="relative w-full max-w-lg rounded-2xl border border-gray-200/80 shadow-2xl shadow-purple-900/8 bg-white overflow-hidden hover:scale-[1.01] transition-transform duration-500">
                <div className="h-6 sm:h-7 bg-gray-50 border-b border-gray-100 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4">
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-400 shadow-sm" />
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-400 shadow-sm" />
                  <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-400 shadow-sm" />
                  <div className="ml-2 sm:ml-3 h-2 sm:h-2.5 w-28 sm:w-36 bg-gray-200/60 rounded-full" />
                </div>
                <Image src="/motion/mot3-personnalisation.jpg" alt="Aperçu d'une boutique personnalisée avec ShopEazy" width={1200} height={900} sizes="(min-width: 1024px) 512px, 100vw" className="w-full h-auto" />
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* ── Full Journey Showcase ── */}
      <section className="py-16 sm:py-24 bg-gray-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="animate-fade-up inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-4 border border-emerald-200/50">
              Parcours ShopEazy
            </div>
            <h2 className="animate-fade-up delay-2 text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight font-heading">
              De l&apos;idée à la première vente
            </h2>
            <p className="animate-fade-up delay-3 text-gray-500 mt-4 text-lg max-w-2xl mx-auto">
              Créez votre vitrine, importez votre catalogue et encaissez votre première commande &mdash; sans friction
            </p>
          </div>

          <div className="animate-fade-up delay-4 mx-auto max-w-5xl">
            <MotionPlayer
              src="/motion/mot4.mp4"
              poster="/motion/mot4-poster.jpg"
              label="Démonstration ShopEazy : commandes, dashboard et suivi des livraisons"
            />
          </div>

          <div className="mx-auto mt-8 grid max-w-5xl gap-4 sm:grid-cols-3">
            {journeySteps.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="rounded-2xl border border-gray-200/70 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                  <Icon className="h-[18px] w-[18px]" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{text}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── Complete Ecosystem Showcase (ShopEazy + Afro-Spy) ── */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative">
          <div className="text-center mb-14">
            <div className="animate-fade-up inline-flex items-center gap-2 bg-white/10 text-amber-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-4 border border-white/15 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              L&apos;Écosystème E-commerce d&apos;Afrique
            </div>
            <h2 className="animate-fade-up delay-2 text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight font-heading">
              Trouvez vos produits gagnants, vendez sans friction
            </h2>
            <p className="animate-fade-up delay-3 text-gray-300 mt-4 text-base sm:text-lg max-w-2xl mx-auto">
              Deux plateformes complémentaires créées spécifiquement pour les e-commerçants et dropshippers en Afrique.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Step 1: Afro-Spy */}
            <div className="rounded-3xl border border-indigo-400/30 bg-gradient-to-br from-indigo-950/80 to-purple-950/60 p-6 sm:p-8 relative overflow-hidden flex flex-col justify-between hover:border-indigo-400/50 transition-all shadow-xl">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-amber-500 flex items-center justify-center text-white shadow-lg">
                    <Flame className="w-6 h-6 text-amber-200" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
                    Étape 1 &bull; Recherche
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white font-heading mb-2">
                  Afro-Spy
                </h3>
                <p className="text-sm font-semibold text-amber-300 mb-4">
                  Outil d&apos;Ad Spy &amp; Détection de Winners
                </p>
                <p className="text-sm text-gray-300 leading-relaxed mb-6">
                  Analysez les publicités actives sur Facebook &amp; TikTok, repérez les boutiques qui scalent en Afrique (Shopify, YouCan) et téléchargez les meilleures créatives pour vos campagnes.
                </p>
                <ul className="space-y-2.5 text-xs text-gray-300 mb-8">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    <span>Espionnage publicitaire ciblé Afrique (CI, SN, CM, etc.)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    <span>Indicateurs de scaling et winning products</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    <span>Téléchargement direct des vidéos et visuels pubs</span>
                  </li>
                </ul>
              </div>
              <a
                href="https://afro-spy.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-bold text-sm shadow-md transition-all active:scale-[0.98] group"
              >
                <span>Découvrir Afro-Spy</span>
                <ArrowUpRight className="w-4 h-4 text-slate-950 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </div>

            {/* Step 2: ShopEazy */}
            <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/60 to-slate-950/80 p-6 sm:p-8 relative overflow-hidden flex flex-col justify-between hover:border-emerald-500/50 transition-all shadow-xl">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg">
                    <Store className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-400/10 border border-emerald-400/20 px-3 py-1 rounded-full">
                    Étape 2 &bull; Conversion
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-white font-heading mb-2">
                  ShopEazy
                </h3>
                <p className="text-sm font-semibold text-emerald-400 mb-4">
                  Boutiques Ultra-Rapides &amp; Cash On Delivery
                </p>
                <p className="text-sm text-gray-300 leading-relaxed mb-6">
                  Créez des pages de vente à fort taux de conversion, encaissez vos commandes en paiement à la livraison (COD) et automatisez le suivi WhatsApp et Google Sheets.
                </p>
                <ul className="space-y-2.5 text-xs text-gray-300 mb-8">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>Tunnels de vente sans friction adaptés aux téléphones</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>Notifications automatiques WhatsApp instantanées</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>Export et synchronisation temps réel Google Sheets</span>
                  </li>
                </ul>
              </div>
              <Link
                href="/signup"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md transition-all active:scale-[0.98]"
              >
                <span>Créer ma boutique sur ShopEazy</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Payment Methods ── */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-gray-50/50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <div className="animate-fade-up inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-4 border border-emerald-200/50">
              Paiements acceptés
            </div>
            <h2 className="animate-fade-up delay-2 text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight font-heading">
              Vos clients paient comme ils veulent
            </h2>
            <p className="animate-fade-up delay-3 text-gray-500 mt-4 text-lg max-w-2xl mx-auto">
              Paiement à la livraison, mobile money &mdash; zéro commission cachée
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 max-w-4xl mx-auto">
            {[
              { name: "Paiement à la livraison", initials: "COD", color: "from-emerald-500 to-emerald-600", coming: false },
              { name: "Orange Money", initials: "OM", color: "from-orange-500 to-orange-600", coming: true },
              { name: "Wave", initials: "WV", color: "from-blue-500 to-blue-600", coming: true },
              { name: "MTN Money", initials: "MTN", color: "from-yellow-500 to-yellow-600", coming: true },
              { name: "Moov Money", initials: "MV", color: "from-red-500 to-red-600", coming: true },
              { name: "Free Money", initials: "FM", color: "from-purple-500 to-purple-600", coming: true },
              { name: "Airtel Money", initials: "AM", color: "from-pink-500 to-pink-600", coming: true },
              { name: "Carte bancaire", initials: "CB", color: "from-indigo-500 to-indigo-600", coming: true },
            ].map((p, i) => (
              <div key={p.name} className={`animate-fade-up delay-${i + 1} group relative bg-white rounded-2xl border p-5 transition-all duration-300 ${
                p.coming ? "border-gray-100 opacity-60 grayscale hover:opacity-80" : "border-emerald-200 shadow-sm shadow-emerald-100 hover:shadow-xl hover:-translate-y-0.5"
              }`}>
                {p.coming && (
                  <div className="absolute top-2 right-2 bg-gray-100 text-gray-500 text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Bientôt
                  </div>
                )}
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${p.color} text-white flex items-center justify-center text-xs font-bold shadow-sm mb-3`}>
                  {p.initials}
                </div>
                <p className="text-sm font-semibold text-gray-900">{p.name}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-6">Les autres moyens de paiement arrivent très bientôt</p>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="tarifs" className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="animate-fade-up inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-4 border border-emerald-200/50">
              Tarifs
            </div>
            <h2 className="animate-fade-up delay-2 text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight font-heading">
              Un tarif pensé pour vous
            </h2>
            <p className="animate-fade-up delay-3 text-gray-500 mt-4 text-lg">
              Commencez gratuitement, évoluez quand vous voulez
            </p>
          </div>
          <div className="max-w-md mx-auto">
            <div className="animate-fade-up delay-3 relative bg-white rounded-2xl border-2 border-emerald-400 shadow-xl shadow-emerald-900/10 p-6 sm:p-8 flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
              <div className="mb-6 text-center">
                <h3 className="text-xl font-bold text-gray-900">Gratuit</h3>
                <p className="text-sm text-gray-500 mt-1">Tout ce dont vous avez besoin pour démarrer</p>
              </div>
              <div className="mb-6 text-center">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold text-gray-900">0</span>
                  <span className="text-gray-400 text-sm">FCFA / mois</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {["Boutique en ligne illimitée", "Produits et commandes illimités", "Paiement à la livraison", "Export Google Sheets", "Import produits par URL", "Thèmes personnalisables", "Support email"].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="w-full text-center font-semibold py-3 rounded-xl transition-all active:scale-95 bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-md"
              >
                Créer ma boutique gratuitement
              </Link>
            </div>
            <p className="text-center text-xs text-gray-400 mt-4">Offre 100% gratuite — pas de carte bancaire requise</p>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="bg-gradient-to-r from-emerald-600 to-teal-600 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
          <h2 className="animate-fade-up text-3xl sm:text-4xl font-bold text-white mb-3 font-heading">
            Prêt à lancer votre boutique ?
          </h2>
          <p className="animate-fade-up delay-2 text-lg text-emerald-50 mb-8 max-w-2xl mx-auto opacity-90">
            Rejoignez des centaines de commerçants qui vendent déjà avec ShopEazy
          </p>
          <Link
            href="/signup"
            className="animate-fade-up delay-3 inline-flex items-center px-8 py-3.5 bg-white text-emerald-700 font-semibold rounded-xl hover:bg-emerald-50 hover:scale-105 active:scale-95 transition-all shadow-lg"
          >
            Créer ma boutique gratuitement
          </Link>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="témoignages" className="py-16 sm:py-24 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="animate-fade-up inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-4 border border-emerald-200/50">
              Témoignages
            </div>
            <h2 className="animate-fade-up delay-2 text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight font-heading">
              Ils adorent, pourquoi pas vous ?
            </h2>
            <p className="animate-fade-up delay-3 text-gray-500 mt-4 text-lg">
              Rejoignez la communauté ShopEazy
            </p>
          </div>

          {/* Featured video testimonial */}
          <div className="animate-fade-up delay-3 mb-10">
            <div className="relative group rounded-2xl overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600">
              <div className="absolute inset-0 bg-black/20" />
              <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 p-6 sm:p-8 lg:p-10">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 flex items-center justify-center shrink-0 border-2 border-white/30 group-hover:scale-110 transition-transform duration-500">
                  <Play className="w-7 h-7 sm:w-8 sm:h-8 text-white fill-white ml-0.5" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-white/90 text-sm sm:text-base leading-relaxed font-medium max-w-2xl">
                    &ldquo;J&apos;ai lancé ma boutique en moins d&apos;une heure. Mes clients commandent
                    depuis Ma boutique ShopEazy et paient à la livraison. Un vrai game changer.&rdquo;
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-3">
                    <span className="text-white font-semibold text-sm">Amadou Diallo</span>
                    <span className="hidden sm:inline text-white/40 text-xs">|</span>
                    <span className="text-white/60 text-xs">Fondateur, Dakar Mode</span>
                    <span className="hidden sm:inline text-white/40 text-xs">|</span>
                    <span className="inline-flex items-center gap-0.5 text-emerald-200 text-xs font-medium">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                      5.0
                    </span>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-4 shrink-0">
                  <div className="text-center">
                    <p className="text-white text-xl font-bold">+150</p>
                    <p className="text-emerald-200 text-[10px] uppercase tracking-wider">Commandes</p>
                  </div>
                  <div className="w-px h-10 bg-white/20" />
                  <div className="text-center">
                    <p className="text-white text-xl font-bold">3x</p>
                    <p className="text-emerald-200 text-[10px] uppercase tracking-wider">Ventes</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Testimonial cards grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={t.name} className={`animate-fade-up delay-${i + 4} bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300`}>
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="animate-fade-up inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-4 border border-emerald-200/50">
              FAQ
            </div>
            <h2 className="animate-fade-up delay-2 text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight font-heading">
              Questions fréquentes
            </h2>
            <p className="animate-fade-up delay-3 text-gray-500 mt-4 text-lg">
              Vous ne trouvez pas votre réponse ? <Link href="/contact" className="text-emerald-600 hover:underline">Contactez-nous</Link>
            </p>
          </div>
          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={i} className={`animate-fade-up delay-${i + 3} bg-white rounded-2xl border border-gray-200 overflow-hidden transition-all duration-300`}>
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left text-sm font-semibold text-gray-900 hover:bg-gray-50 transition-colors"
                  >
                    {faq.q}
                    <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
                    <div className="px-6 pb-4 text-sm text-gray-500 leading-relaxed">
                      {faq.a}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-gradient-to-r from-emerald-600 to-teal-600 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
          <h2 className="animate-fade-up text-3xl sm:text-4xl font-bold text-white mb-3 font-heading">
            Prêt à développer votre business ?
          </h2>
          <p className="animate-fade-up delay-2 text-lg text-emerald-50 mb-8 max-w-2xl mx-auto opacity-90">
            Rejoignez les centaines de commerçants qui ont déjà choisi ShopEazy
          </p>
          <div className="animate-fade-up delay-3 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="w-full sm:w-auto text-center bg-white text-emerald-700 font-semibold px-8 py-3.5 rounded-xl hover:bg-emerald-50 hover:scale-105 active:scale-95 transition-all shadow-lg"
            >
              Créer ma boutique gratuitement
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto text-center text-white font-medium px-8 py-3.5 rounded-xl border border-white/30 hover:bg-white/10 hover:scale-105 active:scale-95 transition-all"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-900 border-t border-gray-800 animate-fade-up">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid sm:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white">
                    <path d="M4 7l8-4 8 4M4 17l8 4 8-4M4 12l8-4 8 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-lg font-bold text-white font-heading">ShopEazy</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                La plateforme e-commerce qui simplifie la vente en ligne en Afrique.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Écosystème &amp; Outils</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://afro-spy.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-amber-400 transition-colors"
                  >
                    <span>Afro-Spy (Ad Spy &amp; Winners)</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-amber-500" />
                  </a>
                </li>
                <li>
                  <a href="#fonctionnalités" className="text-sm text-gray-400 hover:text-white transition-colors">
                    Fonctionnalités ShopEazy
                  </a>
                </li>
                <li>
                  <a href="#tarifs" className="text-sm text-gray-400 hover:text-white transition-colors">
                    Tarifs
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Légal</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/terms" className="text-sm text-gray-400 hover:text-white transition-colors">
                    Conditions d'utilisation
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-sm text-gray-400 hover:text-white transition-colors">
                    Politique de confidentialité
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-8 border-t border-gray-800 text-center text-xs text-gray-500">
            &copy; {new Date().getFullYear()} ShopEazy. Tous droits réservés.
          </div>
        </div>
      </footer>

      {/* ── Floating CTA ── */}
      <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-500 ${
        showFloating ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      }`}>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold px-6 py-3 rounded-full shadow-xl hover:shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Créer ma boutique gratuitement
        </Link>
      </div>

      {/* ── Back to Top ── */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full bg-white border border-gray-200 shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${
          showFloating ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
        aria-label="Retour en haut"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>
    </div>
  );
}
