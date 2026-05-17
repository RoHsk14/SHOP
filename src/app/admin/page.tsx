"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/currency";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { Package, ShoppingCart, Euro, TrendingUp, TrendingDown, Download, RefreshCw, Eye, ShoppingBag, Settings } from "lucide-react";

interface Order { id: string; product_id: string; customer_name: string; total_price: number; currency: string; created_at: string; status: string; }
interface Product { id: string; name: string; prices: any; stock: number; }

const statusConfig: any = {
  pending: { label: "En attente", color: "#eab308" },
  confirmed: { label: "Confirmées", color: "#3b82f6" },
  delivered: { label: "Livrées", color: "#22c55e" },
  cancelled: { label: "Annulées", color: "#ef4444" },
};

const dateFilterOptions = [
  { value: 'today', label: "Aujourd'hui" },
  { value: '7days', label: '7 jours' },
  { value: '30days', label: '30 jours' },
  { value: '90days', label: '90 jours' },
  { value: 'year', label: 'Année' },
];

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | '30days' | '90days' | 'year' | 'custom'>('7days');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [refreshing, setRefreshing] = useState(false);
  const [defaultCurrency, setDefaultCurrency] = useState("EUR");
  const [onlineVisitors, setOnlineVisitors] = useState(0);
  const [todayVisits, setTodayVisits] = useState(0);

  useEffect(() => { fetchData(); }, [dateFilter, customDateRange]);

  useEffect(() => {
    const fetchVisitorStats = async () => {
      try {
        const [onlineRes, todayRes] = await Promise.all([
          fetch("/api/visitors?type=online"),
          fetch("/api/visitors?type=today")
        ]);
        const onlineData = await onlineRes.json();
        const todayData = await todayRes.json();
        setOnlineVisitors(onlineData.online || 0);
        setTodayVisits(todayData.visits || 0);
      } catch (error) {
        console.error("Error fetching visitor stats:", error);
      }
    };
    fetchVisitorStats();
    const interval = setInterval(fetchVisitorStats, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from("settings").select("default_currency").single();
      if (data?.default_currency) setDefaultCurrency(data.default_currency);
    };
    fetchSettings();
  }, []);

  const getDateRange = () => {
    const now = new Date(); let end = new Date(now); let start = new Date(now);
    switch (dateFilter) {
      case 'today': start = new Date(now.setHours(0,0,0,0)); break;
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
    const [ordersRes, productsRes] = await Promise.all([
      supabase.from("orders").select("*").gte("created_at", start).lte("created_at", end).order("created_at", { ascending: false }),
      supabase.from("products").select("*")
    ]);
    setOrders(ordersRes.data || []); setProducts(productsRes.data || []);
    setLoading(false); setRefreshing(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-gray-200 border-t-green-600 rounded-full animate-spin"></div>
    </div>
  );

  const filteredOrders = orders;
  const totalOrders = filteredOrders.length;
  const revenueByCurrency = filteredOrders.reduce((acc: Record<string, number>, o) => {
    const c = o.currency || "EUR"; acc[c] = (acc[c] || 0) + (o.total_price || 0); return acc;
  }, {});
  const totalRevenue = Object.values(revenueByCurrency).reduce((a: number, b: number) => a + b, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const salesTrend = (() => {
    const days = dateFilter === 'today' ? 1 : dateFilter === '7days' ? 7 : dateFilter === '30days' ? 30 : 90;
    const result: any[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const dayOrders = filteredOrders.filter(o => o.created_at?.startsWith(ds));
      result.push({ date: d.toLocaleDateString("fr-FR", { day:'numeric', month:'short' }), commandes: dayOrders.length, revenus: dayOrders.reduce((s:number,o:any) => s + (o.total_price||0), 0) });
    }
    return result;
  })();

  const statusDistribution = Object.entries(
    filteredOrders.reduce((acc: Record<string, number>, o) => { const s = o.status || "pending"; acc[s] = (acc[s]||0) + 1; return acc; }, {})
  ).map(([name, value]) => ({ name, value, ...statusConfig[name] }));

  const productSales = filteredOrders.reduce((acc: Record<string, any>, o) => {
    if (!acc[o.product_id]) { const p = products.find(p => p.id === o.product_id); acc[o.product_id] = { name: p?.name || "Inconnu", orders: 0, revenue: 0 }; }
    acc[o.product_id].orders += 1; acc[o.product_id].revenue += o.total_price || 0; return acc;
  }, {});
  const topProducts = Object.values(productSales).sort((a: any, b: any) => b.revenue - a.revenue).slice(0, 5);

  const stats = [
    { label: "Chiffre d'affaires", value: formatPrice(totalRevenue, defaultCurrency), change: "+12.5%", up: true, icon: Euro, bg: "bg-green-50", ic: "text-green-600" },
    { label: "Commandes", value: totalOrders.toString(), change: "+8.2%", up: true, icon: ShoppingCart, bg: "bg-blue-50", ic: "text-blue-600" },
    { label: "Visiteurs en ligne", value: onlineVisitors.toString(), change: `${todayVisits} auj.`, up: true, icon: Eye, bg: "bg-purple-50", ic: "text-purple-600" },
    { label: "Visites aujourd'hui", value: todayVisits.toString(), change: "+5.3%", up: true, icon: TrendingUp, bg: "bg-amber-50", ic: "text-amber-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-sm text-gray-500 mt-0.5">Vue d&apos;ensemble de votre boutique</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white rounded-lg border border-gray-200 p-0.5">
            {dateFilterOptions.map((opt) => (
              <button key={opt.value} onClick={() => setDateFilter(opt.value as any)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${dateFilter === opt.value ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-900"}`}>
                {opt.label}
              </button>
            ))}
          </div>
          <button onClick={fetchData} className="p-2 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <RefreshCw className={`w-4 h-4 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 hover:shadow-sm transition-shadow animate-fade-in" style={{ animationDelay: `${i*0.05}s` }}>
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 ${s.bg} rounded-lg flex items-center justify-center`}>
                <s.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${s.ic}`} />
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-0.5 ${s.up ? 'text-green-700 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                {s.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />} {s.change}
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-0.5">{s.label}</p>
            <p className="text-lg sm:text-xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Sales Trend */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Tendance des ventes</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={salesTrend}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="revenus" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Répartition des commandes</h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {statusDistribution.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }}></div>
                <span className="text-xs text-gray-600">{s.label} ({s.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
