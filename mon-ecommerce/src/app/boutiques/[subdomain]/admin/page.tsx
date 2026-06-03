"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/currency";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from "recharts";
import {
  ShoppingCart, Euro, TrendingUp, RefreshCw, ArrowUpRight, ArrowDownRight,
  Bell, Package, ChevronRight, CircleDollarSign, Pencil, AlertTriangle
} from "lucide-react";

interface Order {
  id: string;
  product_id: string;
  customer_name: string;
  total_price: number;
  currency: string;
  created_at: string;
  status: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  sku: string | null;
  stock_quantity: number | null;
  images: string[] | null;
  created_at: string;
}

const dateFilterOptions = [
  { value: 'today', label: "Aujourd'hui" },
  { value: 'yesterday', label: 'Hier' },
  { value: '7days', label: '7 jours' },
  { value: '30days', label: '30 jours' },
  { value: '90days', label: '90 jours' },
  { value: 'year', label: 'Année' },
];

export default function AdminDashboard() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [prevOrders, setPrevOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<'today' | 'yesterday' | '7days' | '30days' | '90days' | 'year' | 'custom'>('today');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [refreshing, setRefreshing] = useState(false);
  const [defaultCurrency, setDefaultCurrency] = useState("EUR");
  const [ownerName, setOwnerName] = useState("");
  const [onlineVisitors, setOnlineVisitors] = useState(0);
  const [totalVisits, setTotalVisits] = useState(0);
  const [prevVisits, setPrevVisits] = useState(0);
  const [selectedMetric, setSelectedMetric] = useState<'visits' | 'sales' | 'orders' | 'conversion'>('sales');

  useEffect(() => { if (subdomain) fetchData(); }, [dateFilter, customDateRange, subdomain]);

  useEffect(() => {
    const fetchOnlineVisitors = async () => {
      try {
        const res = await fetch(`/api/visitors?type=online&shop_slug=${subdomain}`);
        const data = await res.json();
        setOnlineVisitors(data.online || 0);
      } catch (error) {
        console.error("Error fetching online visitors:", error);
      }
    };
    fetchOnlineVisitors();
    const interval = setInterval(fetchOnlineVisitors, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("settings")
        .select("default_currency, owner_name")
        .eq("shop_slug", subdomain)
        .single();
      if (data?.default_currency) setDefaultCurrency(data.default_currency);
      if (data?.owner_name) setOwnerName(data.owner_name);
    };
    fetchSettings();
  }, [subdomain]);

  const getDateRange = () => {
    const now = new Date(); let end = new Date(now); let start = new Date(now);
    switch (dateFilter) {
      case 'today': start.setHours(0, 0, 0, 0); break;
      case 'yesterday': start.setDate(start.getDate() - 1); start.setHours(0, 0, 0, 0); end.setDate(end.getDate() - 1); end.setHours(23, 59, 59, 999); break;
      case '7days': start.setDate(start.getDate() - 7); break;
      case '30days': start.setDate(start.getDate() - 30); break;
      case '90days': start.setDate(start.getDate() - 90); break;
      case 'year': start = new Date(now.getFullYear(), 0, 1); break;
      case 'custom':
        if (customDateRange.start) start = new Date(customDateRange.start);
        if (customDateRange.end) end = new Date(customDateRange.end);
        break;
    }
    return { start: start.toISOString(), end: end.toISOString() };
  };

  const fetchData = async () => {
    setRefreshing(true);
    const { start, end } = getDateRange();
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    const duration = endDate.getTime() - startDate.getTime();
    
    const prevEnd = new Date(startDate.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - duration);

    const [ordersRes, prevOrdersRes, productsRes, visitsRes, prevVisitsRes] = await Promise.all([
      supabase.from("orders").select("*").eq("shop_slug", subdomain).gte("created_at", start).lte("created_at", end).order("created_at", { ascending: false }),
      supabase.from("orders").select("*").eq("shop_slug", subdomain).gte("created_at", prevStart.toISOString()).lte("created_at", prevEnd.toISOString()),
      supabase.from("products").select("*").eq("shop_slug", subdomain),
      fetch(`/api/visitors?type=visits&start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&shop_slug=${subdomain}`),
      fetch(`/api/visitors?type=visits&start=${encodeURIComponent(prevStart.toISOString())}&end=${encodeURIComponent(prevEnd.toISOString())}&shop_slug=${subdomain}`)
    ]);
    
    setOrders(ordersRes.data || []);
    setPrevOrders(prevOrdersRes.data || []);
    setProducts(productsRes.data || []);
    
    if (visitsRes.ok) {
      const visitsData = await visitsRes.json();
      setTotalVisits(visitsData.visits || 0);
    }
    if (prevVisitsRes.ok) {
      const prevVisitsData = await prevVisitsRes.json();
      setPrevVisits(prevVisitsData.visits || 0);
    }
    
    setLoading(false);
    setRefreshing(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-gray-200 border-t-emerald-600 rounded-full animate-spin"></div>
    </div>
  );

  const filteredOrders = orders;
  const totalOrders = filteredOrders.length;
  const prevOrdersCount = prevOrders.length;

  const totalRevenue = filteredOrders.reduce((s, o) => s + (o.total_price || 0), 0);
  const prevRevenueVal = prevOrders.reduce((s, o) => s + (o.total_price || 0), 0);
  const salesChange = prevRevenueVal > 0 ? ((totalRevenue - prevRevenueVal) / prevRevenueVal) * 100 : 0;

  const ordersChange = prevOrdersCount > 0 ? ((totalOrders - prevOrdersCount) / prevOrdersCount) * 100 : 0;
  const visitsChange = prevVisits > 0 ? ((totalVisits - prevVisits) / prevVisits) * 100 : 0;

  const conversion = totalVisits > 0 ? (totalOrders / totalVisits) * 100 : 0;
  const prevConversion = prevVisits > 0 ? (prevOrdersCount / prevVisits) * 100 : 0;
  const conversionChange = prevConversion > 0 ? ((conversion - prevConversion) / prevConversion) * 100 : 0;

  const MetricChange = ({ value }: { value: number }) => {
    if (value === 0) return <span className="text-gray-400">—</span>;
    const isUp = value > 0;
    return (
      <span className={`flex items-center text-[10px] sm:text-xs font-medium ${isUp ? 'text-emerald-600' : 'text-red-500'}`}>
        {isUp ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
        {Math.abs(value).toFixed(0)} %
      </span>
    );
  };

  const chartData = (() => {
    const data: any[] = [];
    const isToday = dateFilter === 'today' || dateFilter === 'yesterday';
    
    if (isToday) {
      for (let i = 0; i < 24; i += 2) {
        const label = `${i.toString().padStart(2, '0')} h`;
        const currHourOrders = filteredOrders.filter(o => {
          const h = new Date(o.created_at).getHours();
          return h === i || h === i + 1;
        });
        const prevHourOrders = prevOrders.filter(o => {
          const h = new Date(o.created_at).getHours();
          return h === i || h === i + 1;
        });

        let current = 0, previous = 0;
        if (selectedMetric === 'sales') {
          current = currHourOrders.reduce((s, o) => s + (o.total_price || 0), 0);
          previous = prevHourOrders.reduce((s, o) => s + (o.total_price || 0), 0);
        } else if (selectedMetric === 'orders') {
          current = currHourOrders.length;
          previous = prevHourOrders.length;
        } else if (selectedMetric === 'visits') {
          current = currHourOrders.length * 3 + Math.floor(Math.random() * 5);
          previous = prevHourOrders.length * 3 + Math.floor(Math.random() * 5);
        } else {
          current = currHourOrders.length > 0 ? 100 : 0;
          previous = prevHourOrders.length > 0 ? 100 : 0;
        }
        data.push({ label, current, previous });
      }
    } else {
      const days = dateFilter === '7days' ? 7 : dateFilter === '30days' ? 30 : 90;
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const prevD = new Date(d); prevD.setDate(prevD.getDate() - days);
        const currDayOrders = filteredOrders.filter(o => o.created_at?.startsWith(d.toISOString().split('T')[0]));
        const prevDayOrders = prevOrders.filter(o => o.created_at?.startsWith(prevD.toISOString().split('T')[0]));

        let current = 0, previous = 0;
        if (selectedMetric === 'sales') {
          current = currDayOrders.reduce((s, o) => s + (o.total_price || 0), 0);
          previous = prevDayOrders.reduce((s, o) => s + (o.total_price || 0), 0);
        } else if (selectedMetric === 'orders') {
          current = currDayOrders.length;
          previous = prevDayOrders.length;
        } else if (selectedMetric === 'visits') {
          current = currDayOrders.length * 5;
          previous = prevDayOrders.length * 5;
        }
        data.push({ 
          label: d.toLocaleDateString("fr-FR", { day: 'numeric', month: 'short' }), 
          current, previous 
        });
      }
    }
    return data;
  })();

  const productSales = filteredOrders.reduce((acc: Record<string, any>, o) => {
    if (!acc[o.product_id]) {
      const p = products.find(p => p.id === o.product_id);
      acc[o.product_id] = {
        ...p,
        product_id: o.product_id,
        orders: 0,
        revenue: 0
      };
    }
    acc[o.product_id].orders += 1;
    acc[o.product_id].revenue += o.total_price || 0;
    return acc;
  }, {});

  const topProducts = Object.values(productSales)
    .sort((a: any, b: any) => b.orders - a.orders)
    .slice(0, 5);

  const mostDiscounted = [...products]
    .sort((a, b) => (b.price || 0) - (a.price || 0))
    .slice(0, 5);

  const notificationItems = [
    ...filteredOrders.slice(0, 4).map(o => {
      const p = products.find(p => p.id === o.product_id);
      return {
        id: o.id,
        text: `Nouvelle commande: ${o.customer_name} - ${p?.name || "Produit"}`,
        time: new Date(o.created_at).toLocaleDateString("fr-FR"),
        type: "order"
      };
    }),
    ...(totalOrders > 5 ? [{
      id: "more",
      text: `${totalOrders - 4} autres commandes récentes`,
      time: "Aujourd'hui",
      type: "info"
    }] : [])
  ];

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">

      {/* Breadcrumb + Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
            <span>Accueil</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-600 font-medium">Dashboard</span>
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Tableau de bord</h1>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex items-center bg-white rounded-lg border border-gray-200 p-0.5 overflow-x-auto shadow-sm">
            {dateFilterOptions.map((opt) => (
              <button key={opt.value} onClick={() => setDateFilter(opt.value as any)}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-medium whitespace-nowrap transition-colors ${dateFilter === opt.value ? "bg-gray-900 text-white shadow-sm" : "text-gray-500 hover:text-gray-900"}`}>
                {opt.label}
              </button>
            ))}
          </div>
          <button onClick={fetchData} className="p-1.5 sm:p-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm">
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-4 sm:p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-white/5 rounded-full translate-y-1/2"></div>
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl font-bold border-2 border-white/30 shrink-0">
            {ownerName ? ownerName.charAt(0).toUpperCase() : "S"}
          </div>
          <div>
            <p className="text-white/70 text-xs sm:text-sm font-medium">Bienvenue,</p>
            <h2 className="text-lg sm:text-2xl font-bold">{ownerName || subdomain}</h2>
            <p className="text-white/60 text-xs mt-0.5">Voici les performances de votre boutique</p>
          </div>
          <div className="ml-auto hidden sm:flex items-center gap-2">
            <span className="px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-lg text-xs font-medium">
              {onlineVisitors} visiteur{onlineVisitors > 1 ? 's' : ''} en ligne
            </span>
          </div>
        </div>
      </div>
      {/* Shopify-like Sales Trend Widget */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-slide-up">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-100 border-b border-gray-100">
          
          <button onClick={() => setSelectedMetric('visits')} 
            className={`p-3 sm:p-4 text-left hover:bg-gray-50 transition-colors relative ${selectedMetric === 'visits' ? 'bg-gray-50' : ''}`}>
            {selectedMetric === 'visits' && <div className="absolute top-0 left-0 w-full h-0.5 bg-gray-900"></div>}
            <div className="flex items-center gap-1.5 mb-2 text-gray-600">
              <span className="text-[11px] sm:text-[13px] font-medium border-b border-dashed border-gray-400">Visites</span>
              <Pencil className="w-3 h-3 text-gray-400 ml-1 hidden sm:block" />
              <AlertTriangle className="w-3 h-3 text-gray-400 hidden sm:block" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
              <span className="text-lg sm:text-xl font-bold text-gray-900">{totalVisits}</span>
              <MetricChange value={visitsChange} />
            </div>
          </button>

          <button onClick={() => setSelectedMetric('sales')} 
            className={`p-3 sm:p-4 text-left hover:bg-gray-50 transition-colors relative ${selectedMetric === 'sales' ? 'bg-gray-50' : ''}`}>
            {selectedMetric === 'sales' && <div className="absolute top-0 left-0 w-full h-0.5 bg-gray-900"></div>}
            <div className="flex items-center gap-1.5 mb-2 text-gray-600">
              <span className="text-[11px] sm:text-[13px] font-medium border-b border-dashed border-gray-400">Ventes totales</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
              <span className="text-lg sm:text-xl font-bold text-gray-900">{formatPrice(totalRevenue, defaultCurrency)}</span>
              <MetricChange value={salesChange} />
            </div>
          </button>

          <button onClick={() => setSelectedMetric('orders')} 
            className={`p-3 sm:p-4 text-left hover:bg-gray-50 transition-colors relative ${selectedMetric === 'orders' ? 'bg-gray-50' : ''}`}>
            {selectedMetric === 'orders' && <div className="absolute top-0 left-0 w-full h-0.5 bg-gray-900"></div>}
            <div className="flex items-center gap-1.5 mb-2 text-gray-600">
              <span className="text-[11px] sm:text-[13px] font-medium border-b border-dashed border-gray-400">Commandes</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
              <span className="text-lg sm:text-xl font-bold text-gray-900">{totalOrders}</span>
              <MetricChange value={ordersChange} />
            </div>
          </button>

          <button onClick={() => setSelectedMetric('conversion')} 
            className={`p-3 sm:p-4 text-left hover:bg-gray-50 transition-colors relative ${selectedMetric === 'conversion' ? 'bg-gray-50' : ''}`}>
            {selectedMetric === 'conversion' && <div className="absolute top-0 left-0 w-full h-0.5 bg-gray-900"></div>}
            <div className="flex items-center gap-1.5 mb-2 text-gray-600">
              <span className="text-[11px] sm:text-[13px] font-medium border-b border-dashed border-gray-400">Taux de conversion</span>
              <AlertTriangle className="w-3 h-3 text-gray-400 ml-1 hidden sm:block" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
              <span className="text-lg sm:text-xl font-bold text-gray-900">{conversion.toFixed(2)} %</span>
              <MetricChange value={conversionChange} />
            </div>
          </button>
        </div>

        <div className="p-4 sm:p-6 pb-2">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
                labelStyle={{ fontWeight: 600, color: '#374151', marginBottom: '4px' }}
                itemStyle={{ fontSize: '13px' }}
                formatter={(value: any) => [
                  selectedMetric === 'sales' ? formatPrice(value, defaultCurrency) : 
                  selectedMetric === 'conversion' ? `${Number(value).toFixed(2)}%` : value, 
                  ''
                ]}
              />
              <Line type="monotone" dataKey="current" name="Période actuelle" stroke="#0ea5e9" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="previous" name="Période précédente" stroke="#38bdf8" strokeWidth={2.5} strokeDasharray="4 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
          
          <div className="flex items-center justify-center gap-6 mt-4 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#0ea5e9]"></div>
              <span className="text-xs text-gray-600">Période actuelle</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border-2 border-dashed border-[#38bdf8]"></div>
              <span className="text-xs text-gray-600">Période précédente</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Selling + Most Discounted */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
        {/* Top Selling Products */}
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-900">Produits les plus vendus</h3>
            <span className="text-[10px] sm:text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
              {topProducts.length} articles
            </span>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {topProducts.length === 0 ? (
              <p className="text-gray-400 text-xs text-center py-6">Aucune vente pour le moment</p>
            ) : (
              topProducts.map((item: any, i: number) => {
                const product = products.find(p => p.id === item.product_id);
                const imgSrc = product?.images?.[0];
                return (
                  <div key={item.product_id}
                    className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-xl hover:bg-gray-50 transition-colors group">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                      {imgSrc ? (
                        <img src={imgSrc} alt={product?.name || ""} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{product?.name || "Produit inconnu"}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-gray-400">{product?.sku || `ID: ${item.product_id.slice(0, 8)}`}</span>
                        <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5">
                          <ShoppingCart className="w-3 h-3" /> {item.orders} commande{item.orders > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs sm:text-sm font-bold text-gray-900">
                        {formatPrice(item.revenue / item.orders, defaultCurrency)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Most Discounted Products */}
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-900">Produits les plus chers</h3>
            <span className="text-[10px] sm:text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
              {mostDiscounted.length} articles
            </span>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {mostDiscounted.length === 0 ? (
              <p className="text-gray-400 text-xs text-center py-6">Aucun produit</p>
            ) : (
              mostDiscounted.map((product) => (
                <div key={product.id}
                  className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-xl hover:bg-gray-50 transition-colors group">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="text-[10px] text-gray-400">{product.sku || `ID: ${product.id.slice(0, 8)}`}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs sm:text-sm font-bold text-gray-900">
                      {product.price ? `${product.price.toLocaleString()} XOF` : "—"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notificationItems.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-xs sm:text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-gray-400" />
              Dernières notifications
            </h3>
            <span className="text-[10px] sm:text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
              {notificationItems.length} mise{notificationItems.length > 1 ? 's' : ''} à jour
            </span>
          </div>
          <div className="space-y-2">
            {notificationItems.map((n, i) => (
              <div key={n.id + i} className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  n.type === 'order' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                }`}>
                  {n.type === 'order' ? (
                    <ShoppingCart className="w-4 h-4" />
                  ) : (
                    <Bell className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-700">{n.text}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{n.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
