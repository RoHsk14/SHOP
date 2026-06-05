"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart, Settings, LogOut, Menu, X, Store, Palette, Plus, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { generateUniqueShopSlug } from "@/lib/slug";
import { toast } from "sonner";
import { playNotificationSound } from "@/lib/notification-sound";

export default function AdminLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 const pathname = usePathname();
 const router = useRouter();
 const [sidebarOpen, setSidebarOpen] = useState(false);
 const [checking, setChecking] = useState(true);
 const [userEmail, setUserEmail] = useState("");
 const [shopSlug, setShopSlug] = useState<string | null>(null);
 const [shopName, setShopName] = useState("");
 const [ownerName, setOwnerName] = useState("");
 const [profileModalOpen, setProfileModalOpen] = useState(false);
 const [userShops, setUserShops] = useState<{ shop_slug: string; shop_name: string }[]>([]);
 const [fullUserEmail, setFullUserEmail] = useState("");
 const [creatingShop, setCreatingShop] = useState(false);
 const [isSuperAdmin, setIsSuperAdmin] = useState(false);
 const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("admin-dark");
    if (stored === "true") setDark(true);
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("admin-dark", next ? "true" : "false");
  };

 const getShopUrl = (slug: string) => {
 if (typeof window === "undefined") return "";
 const host = window.location.host;
 const protocol = window.location.protocol;
 if (host.includes("localhost") || host.includes("lvh.me")) {
 const port = host.split(":")[1] ? `:${host.split(":")[1]}` : "";
 return `${protocol}//${slug}.localhost${port}`;
 }
 const parts = host.split(".");
 const apex = parts.length > 2 ? parts.slice(-2).join(".") : host;
 return `${protocol}//${slug}.${apex}`;
 };

 // Normaliser le pathname : /boutiques/{slug}/admin → /admin
 const barePath = pathname.replace(/^\/boutiques\/[^\/]+/, "") || "/";
 const slug = pathname.match(/^\/boutiques\/([^\/]+)/)?.[1] || "";
 const base = `/boutiques/${slug}`;

 useEffect(() => {
 let cancelled = false;
 const safetyTimeout = setTimeout(() => {
 if (!cancelled) {
 window.location.replace(`${window.location.origin}/login`);
 setChecking(false);
 }
 }, 10000);

 supabase.auth.getSession().then(async ({ data: { session } }) => {
 clearTimeout(safetyTimeout);
 if (cancelled) return;
 if (!session) {
 window.location.replace(`${window.location.origin}/login`);
 setChecking(false);
 return;
 }
 setUserEmail(session.user.email?.split("@")[0] || "Admin");
 setFullUserEmail(session.user.email || "");
 setShopSlug(slug);
 try {
 const { data: settings } = await supabase
 .from("settings")
 .select("id, shop_slug, user_id, shop_name, owner_name")
 .eq("shop_slug", slug)
 .maybeSingle();

 let currentUserId = session.user.id;
 if (!settings?.id) {
 await supabase.from("settings").insert([{ shop_slug: slug, user_id: currentUserId }]);
 } else if (!settings.user_id) {
 await supabase.from("settings").update({ user_id: currentUserId }).eq("id", settings.id);
 } else {
 setShopName(settings.shop_name || slug);
 setOwnerName(settings.owner_name || "");
 currentUserId = settings.user_id;
 }

 // Fetch all shops for this user
 const { data: shopsData } = await supabase
 .from("settings")
 .select("shop_slug, shop_name")
 .eq("user_id", currentUserId);
 if (shopsData) {
 setUserShops(shopsData);
 }

 // Check if user is super admin
 const { data: adminCheck } = await supabase
 .from("settings")
 .select("is_super_admin")
 .eq("user_id", currentUserId)
 .eq("is_super_admin", true)
 .maybeSingle();
 if (adminCheck) {
 setIsSuperAdmin(true);
 }
 } catch (e) {
 console.error("[AdminLayout] Erreur settings:", e);
 }
 setChecking(false);
 }).catch(() => {
 clearTimeout(safetyTimeout);
 if (!cancelled) {
 window.location.replace(`${window.location.origin}/login`);
 setChecking(false);
 }
 });
 const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
 if (event === "SIGNED_OUT") {
 window.location.replace(`${window.location.origin}/login`);
 }
 if (session?.user?.email) {
 setUserEmail(session.user.email.split("@")[0]);
 setFullUserEmail(session.user.email);
 }
 });
 return () => {
 cancelled = true;
 subscription.unsubscribe();
 };
 }, []);

 const handleLogout = async () => {
 if (!confirm("Voulez-vous vraiment vous déconnecter ?")) return;
 await supabase.auth.signOut();
 router.push("/");
 };

 const handleCreateShop = async () => {
 try {
 setCreatingShop(true);
 const { data: { session } } = await supabase.auth.getSession();
 const userId = session?.user?.id;
 if (!userId) {
 window.location.replace(`${window.location.origin}/login`);
 return;
 }

 const newSlug = await generateUniqueShopSlug(supabase);

 const { error } = await supabase
 .from("settings")
 .insert([{ shop_slug: newSlug, user_id: userId }]);

 if (error) throw error;

 window.location.replace(`${window.location.origin}/boutiques/${newSlug}/onboarding`);
 } catch (e: any) {
 console.error("Error creating new shop:", e);
 alert("Erreur lors de la création de la boutique : " + e.message);
 } finally {
 setCreatingShop(false);
 }
 };

 // Realtime subscription pour les nouvelles commandes
 useEffect(() => {
 if (!slug) return;

 const channel = supabase
 .channel(`orders-${slug}`)
 .on(
 "postgres_changes",
 {
 event: "INSERT",
 schema: "public",
 table: "orders",
 filter: `shop_slug=eq.${slug}`,
 },
 (payload) => {
 const newOrder = payload.new as any;
 playNotificationSound();
 toast.success(
 `Nouvelle commande ! ${newOrder.customer_name} — ${newOrder.total_price?.toLocaleString()} XOF`,
 {
 action: {
 label: "Voir",
 onClick: () =>
 (window.location.href = `/boutiques/${slug}/admin/orders`),
 },
 duration: 6000,
 }
 );
 }
 )
 .subscribe();

 return () => {
 supabase.removeChannel(channel);
 };
 }, [slug]);

 if (barePath === "/admin/login") return <>{children}</>;

 if (checking) {
 return (
   <div className="min-h-screen bg-gray-50 flex items-center justify-center">
   <div className="w-8 h-8 border-2 border-gray-200 border-t-emerald-600 rounded-full animate-spin"></div>
 </div>
 );
 }

 const menuItems = [
 { href: `${base}/admin`, label: "Vue d'ensemble", icon: LayoutDashboard },
 { href: `${base}/admin/orders`, label: "Commandes", icon: ShoppingCart },
 { href: `${base}/admin/products`, label: "Produits", icon: Package },
 { href: `${base}/admin/customize`, label: "Personnaliser", icon: Palette },
 ];

 const secondaryItems = [
 { href: `${base}/admin/settings`, label: "Paramètres", icon: Settings },
 ];

 const isActive = (href: string) => barePath === href;

  return (
  <>
  <style>{dark ? `
.admin-sidebar{background:#030712;border-color:#1f2937}
.admin-sidebar a,.admin-sidebar button,.admin-sidebar span,.admin-sidebar h1,.admin-sidebar p{transition:color .15s}
.admin-sidebar .logo-text{color:#f9fafb}
.admin-sidebar .logo-sub{color:#6b7280}
.admin-sidebar .nav-item{color:#9ca3af}
.admin-sidebar .nav-item:hover{background:#1f2937;color:#e5e7eb}
.admin-sidebar .nav-active{background:rgba(6,78,59,.3);color:#34d399}
.admin-sidebar .nav-icon{background:#1f2937;color:#9ca3af}
.admin-sidebar .nav-icon-active{background:rgba(6,78,59,.5);color:#34d399}
.admin-sidebar .nav-icon:hover{background:#374151;color:#e5e7eb}
.admin-sidebar .section-label{color:#6b7280}
.admin-sidebar .profile-box{background:rgba(6,78,59,.2);border-color:rgba(6,78,59,.3)}
.admin-sidebar .profile-name{color:#f9fafb}
.admin-sidebar .profile-role{color:#34d399}
.admin-sidebar .store-link{color:#9ca3af}
.admin-sidebar .store-link:hover{background:rgba(6,78,59,.3);color:#34d399}
.admin-sidebar .store-icon{background:rgba(6,78,59,.5);color:#34d399}
.admin-sidebar .store-icon:hover{background:rgba(6,78,59,.7)}
.admin-sidebar .store-badge{background:rgba(6,78,59,.3)}
.admin-sidebar .store-badge:hover{background:rgba(6,78,59,.5)}
.admin-sidebar .active-dot{background:rgba(6,78,59,.5)}
.admin-header{background:#030712;border-color:#1f2937}
.admin-header .header-text{color:#9ca3af}
.admin-header .header-shop{color:#f9fafb}
.admin-main{background:#030712}
.admin-overlay{background:rgba(0,0,0,.6)}
.admin-profile-dropdown{background:#1f2937;border-color:#374151;box-shadow:0 25px 50px rgba(0,0,0,.5)}
.admin-profile-dropdown .profile-divider{border-color:#374151}
.admin-profile-dropdown .profile-name{color:#f9fafb}
.admin-profile-dropdown .profile-email{color:#9ca3af}
.admin-profile-dropdown .shop-link{color:#9ca3af}
.admin-profile-dropdown .shop-link:hover{background:#374151;color:#e5e7eb}
.admin-profile-dropdown .shop-active{background:rgba(6,78,59,.3);color:#34d399;border-color:rgba(6,78,59,.3)}
.admin-profile-dropdown .shop-count{background:rgba(6,78,59,.5);color:#34d399}
.admin-profile-dropdown .settings-link{color:#9ca3af}
.admin-profile-dropdown .settings-link:hover{color:#e5e7eb}
.admin-profile-dropdown .logout-btn{color:#f87171}
.admin-profile-dropdown .logout-btn:hover{color:#fca5a5}
.admin-profile-dropdown .super-admin-btn{background:#374151;color:#d1d5db}
.admin-profile-dropdown .super-admin-btn:hover{background:#4b5563;color:#f9fafb}
.admin-footer-btn{color:#9ca3af}
.admin-footer-btn:hover{background:#1f2937;color:#e5e7eb}
.admin-footer-icon{background:#1f2937;color:#9ca3af}
.admin-footer-icon:hover{background:#374151;color:#e5e7eb}
.admin-red-btn{color:#9ca3af}
.admin-red-btn:hover{background:rgba(127,29,29,.3);color:#f87171}
.admin-red-icon{background:#1f2937;color:#9ca3af}
.admin-red-icon:hover{background:rgba(127,29,29,.5);color:#f87171}
.admin-mobile-btn{background:#1f2937;border-color:#374151}
` : ''}</style>
  <div className="min-h-screen bg-gray-50 flex">
  {/* Mobile menu button */}
  <button
 onClick={() => setSidebarOpen(!sidebarOpen)}
 className="admin-mobile-btn fixed top-3 left-3 z-50 lg:hidden w-9 h-9 bg-white border border-gray-200 rounded-xl flex items-center justify-center shadow-sm"
 >
 {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
 </button>

 {/* Sidebar */}
   <aside className={`
    admin-sidebar fixed inset-y-0 left-0 z-40
    w-64 bg-white border-r border-gray-200 flex flex-col h-screen
    transform transition-transform duration-300 ease-in-out
    ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
   `}>
 {/* Logo */}
 <div className="p-5 border-b border-gray-100">
 <Link href="/admin" className="flex items-center gap-3 hover:opacity-80 transition-opacity"
 onClick={() => setSidebarOpen(false)}
 >
 <div className="w-9 h-9 flex-shrink-0 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-sm">
 <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white">
 <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
 <path d="M3 10h18" stroke="currentColor" strokeWidth="2"/>
 <path d="M8 5v14" stroke="currentColor" strokeWidth="2" opacity="0.5"/>
 </svg>
 </div>
 <div className="min-w-0">
  <h1 className="logo-text text-base font-bold text-gray-900 truncate">
  {shopName || slug}
  </h1>
  <p className="logo-sub text-[10px] text-gray-400">ShopEazy</p>
 </div>
 </Link>
 </div>

 {/* User profile summary */}
 <div className="profile-box mx-4 mt-4 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100/50">
  <div className="flex items-center gap-3">
  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
  {userEmail.charAt(0).toUpperCase()}
  </div>
  <div className="min-w-0">
  <p className="profile-name text-xs font-semibold text-gray-900 truncate">{userEmail}</p>
  <p className="profile-role text-[10px] text-emerald-600 font-medium truncate">{ownerName || "Propriétaire"}</p>
 </div>
 <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></div>
 </div>
 </div>

 {/* Navigation */}
 <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
 <p className="section-label text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">
 Principal
 </p>
 {menuItems.map((item) => {
 const active = isActive(item.href);
 return (
 <Link
 key={item.href}
 href={item.href}
 onClick={() => setSidebarOpen(false)}
  className={`nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
  active
  ? "nav-active bg-emerald-50 text-emerald-700 shadow-sm"
  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
  }`}
  >
  <div className={`nav-icon p-1.5 rounded-lg transition-all ${
  active
  ? "nav-icon-active bg-emerald-100 text-emerald-700"
  : "bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-gray-700"
  }`}>
 <item.icon className="w-4 h-4" />
 </div>
 <span className="font-medium text-sm">{item.label}</span>
 {active && (
 <div className="active-dot ml-auto w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
 </div>
 )}
 </Link>
 );
 })}

 {shopSlug && (
 <a
 href={getShopUrl(shopSlug)}
 target="_blank"
 rel="noopener noreferrer"
 onClick={() => setSidebarOpen(false)}
  className="store-link flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"
  >
  <div className="store-icon p-1.5 rounded-lg bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200 group-hover:text-emerald-700 transition-all">
 <Store className="w-4 h-4" />
 </div>
 <span className="font-medium text-sm">Voir ma boutique</span>
  <span className="store-badge ml-auto text-[10px] text-emerald-500 font-medium bg-emerald-50 group-hover:bg-emerald-100 px-2 py-0.5 rounded-full">↗</span>
 </a>
 )}

 <p className="section-label text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2 mt-4">
 Configuration
 </p>
 {secondaryItems.map((item) => {
 const active = isActive(item.href);
 return (
 <Link
 key={item.href}
 href={item.href}
 onClick={() => setSidebarOpen(false)}
  className={`nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
  active
  ? "nav-active bg-emerald-50 text-emerald-700 shadow-sm"
  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
  }`}
  >
  <div className={`nav-icon p-1.5 rounded-lg transition-all ${
  active
  ? "nav-icon-active bg-emerald-100 text-emerald-700"
  : "bg-gray-100 text-gray-500 group-hover:bg-gray-200 group-hover:text-gray-700"
  }`}>
 <item.icon className="w-4 h-4" />
 </div>
 <span className="font-medium text-sm">{item.label}</span>
 {active && (
 <div className="active-dot ml-auto w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
 </div>
 )}
 </Link>
 );
 })}

 </nav>

 {/* Footer sidebar */}
  <div className="p-3 border-t border-gray-100 space-y-1">
  <button
  onClick={toggleDark}
  className="admin-footer-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all group"
  >
  <div className="admin-footer-icon p-1.5 rounded-lg bg-gray-100 text-gray-400 group-hover:bg-gray-200 group-hover:text-gray-700 transition-all">
  {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
  </div>
  <span className="font-medium text-sm">{dark ? "Mode clair" : "Mode sombre"}</span>
  </button>
  <button
  onClick={handleLogout}
  className="admin-red-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all group"
  >
  <div className="admin-red-icon p-1.5 rounded-lg bg-gray-100 text-gray-400 group-hover:bg-red-100 group-hover:text-red-600 transition-all">
  <LogOut className="w-4 h-4" />
  </div>
  <span className="font-medium text-sm">Déconnexion</span>
  </button>
  </div>
 </aside>

 {/* Overlay for mobile */}
 {sidebarOpen && (
 <div
   className="admin-overlay fixed inset-0 bg-black/20 z-30 lg:hidden backdrop-blur-sm"
 onClick={() => setSidebarOpen(false)}
 />
 )}

  {/* Main content */}
   <main className="admin-main flex-1 min-h-screen lg:ml-64 flex flex-col">
  {/* Top Header */}
  <header className="admin-header h-16 border-b border-gray-100 bg-white flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 relative">
 <div className="flex items-center gap-3">
    <span className="header-text text-sm font-medium text-gray-500 ml-12 lg:ml-0">
    Boutique active : <span className="header-shop font-semibold text-gray-900">{shopName || slug}</span>
   </span>
 </div>

 <div className="flex items-center gap-4 ml-auto">
 {/* Profile Avatar Button */}
 <div className="relative">
 <button
 onClick={() => setProfileModalOpen(!profileModalOpen)}
 className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-sm hover:scale-105 active:scale-95 transition-all focus:outline-none"
 >
 {userEmail.charAt(0).toUpperCase()}
 </button>

 {/* Profile Dropdown Modal */}
 {profileModalOpen && (
 <>
 <div
 className="fixed inset-0 z-40 bg-transparent"
 onClick={() => setProfileModalOpen(false)}
 />
  <div className="admin-profile-dropdown absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 p-5 z-50 animate-fade-in origin-top-right">
  {/* Owner details */}
  <div className="profile-divider flex items-center gap-3 pb-4 border-b border-gray-100">
 <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-inner">
 {userEmail.charAt(0).toUpperCase()}
 </div>
 <div className="min-w-0">
 <p className="profile-name text-sm font-bold text-gray-900 truncate">{ownerName || "Propriétaire"}</p>
 <p className="profile-email text-xs text-gray-500 truncate">{fullUserEmail}</p>
 </div>
 </div>

 {/* Shops listing */}
 <div className="pt-4">
 <div className="flex items-center justify-between mb-2">
   <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Mes boutiques</span>
   <span className="shop-count text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
 {userShops.length}
 </span>
 </div>

 <div className="max-h-48 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
 {userShops.map((shop) => {
 const isCurrent = shop.shop_slug === slug;
 return (
 <Link
 key={shop.shop_slug}
 href={`/boutiques/${shop.shop_slug}/admin`}
 onClick={() => setProfileModalOpen(false)}
  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
  isCurrent
  ? "shop-active bg-emerald-50 text-emerald-800 border border-emerald-100/50"
  : "shop-link text-gray-600 hover:bg-gray-50 hover:text-gray-900"
  }`}
 >
 <span className="truncate">{shop.shop_name || shop.shop_slug}</span>
 {isCurrent ? (
 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
 ) : (
 <span className="text-[10px] text-gray-400">Accéder ↗</span>
 )}
 </Link>
 );
 })}
 </div>

 {/* Create store button */}
 <button
 onClick={handleCreateShop}
 disabled={creatingShop}
 className="w-full mt-3 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:scale-100 focus:outline-none"
 >
 <Plus className="w-3.5 h-3.5" />
 {creatingShop ? "Création..." : "Créer une boutique"}
 </button>
 </div>

  {/* Quick actions */}
  <div className="profile-divider mt-4 pt-3 border-t border-gray-100 flex flex-col gap-2 text-xs">
  <div className="flex justify-between items-center">
  <Link
  href={`/boutiques/${slug}/admin/settings`}
  onClick={() => setProfileModalOpen(false)}
  className="settings-link text-gray-500 hover:text-gray-900 transition-colors font-medium"
  >
  Paramètres
  </Link>
  <button
  onClick={() => {
  setProfileModalOpen(false);
  handleLogout();
  }}
  className="logout-btn text-red-500 hover:text-red-700 font-semibold transition-colors"
  >
  Déconnexion
  </button>
  </div>
  {isSuperAdmin && (
  <Link
  href="/admin"
  onClick={() => setProfileModalOpen(false)}
  className="super-admin-btn w-full text-center bg-gray-900 text-gray-200 hover:bg-gray-800 hover:text-white rounded-lg px-3 py-2 font-semibold transition-all"
  >
  Super Admin
  </Link>
  )}
  </div>
 </div>
 </>
 )}
 </div>
 </div>
 </header>

 <div className="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto flex-1 w-full">
 {children}
 </div>
 </main>
 </div>
 </>
 );
}
