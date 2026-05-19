"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Phone, Eye, Trash2, Package, ChevronRight, X, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, Circle, Truck, Ban } from "lucide-react";
import { formatPrice } from "@/lib/currency";

type Order = {
  id: string;
  product_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_neighborhood: string | null;
  quantity: number;
  total_price: number;
  currency: string;
  status: string;
  notes: string | null;
  created_at: string;
  products?: { name: string; images: string[] | null } | null;
};

type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-700 border-blue-200",
  shipped: "bg-purple-100 text-purple-700 border-purple-200",
  delivered: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

const STATUS_ICONS: Record<OrderStatus, any> = {
  pending: Clock,
  confirmed: CheckCircle2,
  shipped: Truck,
  delivered: CheckCircle2,
  cancelled: Ban,
};

const STATUSES: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

const STATUS_STEPS: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered"];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*, products(name, images)")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Erreur de chargement des commandes");
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId);
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);
    if (error) {
      toast.error("Erreur de mise à jour du statut");
    } else {
      toast.success(`Commande ${STATUS_LABELS[newStatus as OrderStatus].toLowerCase()}`);
      fetchOrders();
    }
    setUpdatingStatus(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette commande ?")) return;
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) {
      toast.error("Erreur de suppression");
    } else {
      toast.success("Commande supprimée");
      if (selectedOrder?.id === id) setSelectedOrder(null);
      fetchOrders();
    }
  };

  const filteredOrders = statusFilter === "all"
    ? orders
    : orders.filter(o => o.status === statusFilter);

  const pendingOrders = orders.filter(o => o.status === "pending").length;
  const confirmedOrders = orders.filter(o => o.status === "confirmed").length;
  const deliveredOrders = orders.filter(o => o.status === "delivered").length;
  const cancelledOrders = orders.filter(o => o.status === "cancelled").length;
  const shippedOrders = orders.filter(o => o.status === "shipped").length;
  const completedRate = orders.length > 0 ? Math.round((deliveredOrders / orders.length) * 100) : 0;

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getStatusBadge = (status: string) => {
    const s = status as OrderStatus;
    const Icon = STATUS_ICONS[s];
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[s] || STATUS_COLORS.pending}`}>
        {Icon && <Icon className="w-3 h-3" />}
        {STATUS_LABELS[s] || status}
      </span>
    );
  };

  const filterTabs = [
    { value: "all" as const, label: "Toutes", count: orders.length },
    { value: "pending" as const, label: "En attente", count: pendingOrders },
    { value: "confirmed" as const, label: "Confirmées", count: confirmedOrders },
    { value: "shipped" as const, label: "Expédiées", count: shippedOrders },
    { value: "delivered" as const, label: "Livrées", count: deliveredOrders },
    { value: "cancelled" as const, label: "Annulées", count: cancelledOrders },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">

      {/* Breadcrumb + Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
            <span>Accueil</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-600 font-medium">Commandes</span>
          </nav>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Commandes</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-medium border border-emerald-200">
            {orders.length} commande{orders.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {[
          { label: "Totales", value: orders.length.toString(), change: `${pendingOrders} en attente`, up: true },
          { label: "En attente", value: pendingOrders.toString(), change: `${Math.round((pendingOrders / Math.max(1, orders.length)) * 100)}% du total`, up: pendingOrders > 0 },
          { label: "Confirmées", value: confirmedOrders.toString(), change: `${Math.round((confirmedOrders / Math.max(1, orders.length)) * 100)}% du total`, up: true },
          { label: "Livrées", value: deliveredOrders.toString(), change: `${completedRate}% complétion`, up: true },
        ].map((s, i) => (
          <div key={i}
            className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 hover:shadow-lg hover:border-gray-300 transition-all duration-200 animate-slide-up"
            style={{ animationDelay: `${i * 0.06}s` }}>
            <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 font-medium truncate">{s.label}</p>
            <p className="text-base sm:text-lg font-bold text-gray-900">{s.value}</p>
            <p className={`text-[10px] mt-0.5 truncate flex items-center gap-0.5 ${s.up ? 'text-emerald-600' : 'text-red-500'}`}>
              {s.up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
              {s.change}
            </p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-200 p-1 overflow-x-auto shadow-sm">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
              statusFilter === tab.value
                ? "bg-gray-900 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            {tab.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              statusFilter === tab.value
                ? "bg-white/20 text-white"
                : "bg-gray-100 text-gray-500"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-emerald-600 rounded-full animate-spin"></div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucune commande trouvée</p>
          <p className="text-gray-400 text-sm mt-1">
            {statusFilter === "all" ? "Aucune commande pour le moment" : `Aucune commande avec le statut "${STATUS_LABELS[statusFilter as OrderStatus]}"`}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-4 py-3 text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">Commande</th>
                    <th className="text-left px-4 py-3 text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">Client</th>
                    <th className="text-left px-4 py-3 text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">Produit</th>
                    <th className="text-left px-4 py-3 text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">Qté</th>
                    <th className="text-left px-4 py-3 text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">Total</th>
                    <th className="text-left px-4 py-3 text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">Statut</th>
                    <th className="text-right px-4 py-3 text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredOrders.map((order) => {
                    const imgSrc = order.products?.images?.[0];
                    return (
                      <tr key={order.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-shrink-0">
                              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                                {getInitials(order.customer_name)}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-mono text-gray-400">
                                #{order.id.slice(0, 8)}
                              </p>
                              <p className="text-[10px] text-gray-400">
                                {new Date(order.created_at).toLocaleDateString("fr-FR", {
                                  day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                                })}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{order.customer_name}</p>
                            <p className="text-xs text-gray-400">{order.customer_phone}</p>
                            {order.customer_neighborhood && (
                              <p className="text-[10px] text-gray-400 truncate max-w-[120px]">{order.customer_neighborhood}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                              {imgSrc ? (
                                <img src={imgSrc} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                            <span className="text-sm text-gray-900 truncate max-w-[140px]">
                              {order.products?.name || "Produit supprimé"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{order.quantity}</td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-bold text-gray-900">
                            {formatPrice(order.total_price, order.currency)}
                          </p>
                        </td>
                        <td className="px-4 py-3">{getStatusBadge(order.status)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Détails"
                            >
                              <Eye className="w-4 h-4 text-gray-400 hover:text-gray-700" />
                            </button>
                            <a
                              href={`tel:${order.customer_phone}`}
                              className="p-2 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Appeler"
                            >
                              <Phone className="w-4 h-4 text-emerald-500 hover:text-emerald-700" />
                            </a>
                            <button
                              onClick={() => handleDelete(order.id)}
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4 text-red-400 hover:text-red-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="grid grid-cols-1 sm:hidden gap-3">
            {filteredOrders.map((order) => {
              const imgSrc = order.products?.images?.[0];
              return (
                <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-3 space-y-2 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                        {getInitials(order.customer_name)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{order.customer_name}</p>
                        <p className="text-xs text-gray-400">{order.customer_phone}</p>
                      </div>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="flex items-center gap-2 py-1">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                      {imgSrc ? (
                        <img src={imgSrc} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <span className="text-sm text-gray-700 truncate">{order.products?.name || "Produit supprimé"}</span>
                    <span className="text-xs text-gray-400 ml-auto">x{order.quantity}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-gray-50">
                    <div>
                      <p className="text-xs text-gray-400">
                        {new Date(order.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-900">{formatPrice(order.total_price, order.currency)}</p>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4 text-gray-400" />
                      </button>
                      <a href={`tel:${order.customer_phone}`} className="p-1.5 hover:bg-emerald-50 rounded-lg transition-colors">
                        <Phone className="w-4 h-4 text-emerald-500" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Order Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => setSelectedOrder(null)} />
          <div className="relative w-full max-w-4xl bg-gray-50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh] animate-slide-up">
            
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 sm:px-6 sm:py-5 bg-white border-b border-gray-100 sticky top-0 z-10">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 font-mono">#{selectedOrder.id.slice(0, 8)}</h2>
                <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                <p className="text-sm text-gray-500 font-medium">
                  {new Date(selectedOrder.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
                <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                {getStatusBadge(selectedOrder.status)}
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-gray-500 shrink-0 ml-2">
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                
                {/* Left Column: Details */}
                <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                  
                  {/* Product details */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Produit commandé
                    </h3>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gray-50 overflow-hidden shrink-0 flex items-center justify-center border border-gray-100">
                        {selectedOrder.products?.images?.[0] ? (
                          <img src={selectedOrder.products.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-6 h-6 text-gray-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base sm:text-lg font-bold text-gray-900 truncate">
                          {selectedOrder.products?.name || "Produit supprimé"}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">Quantité: <span className="font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md ml-1">{selectedOrder.quantity}</span></p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg sm:text-2xl font-bold text-emerald-600">
                          {formatPrice(selectedOrder.total_price, selectedOrder.currency)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1 font-medium">Total TTC</p>
                      </div>
                    </div>
                  </div>

                  {/* Customer info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Client</h3>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                          {getInitials(selectedOrder.customer_name)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{selectedOrder.customer_name}</p>
                          <p className="text-sm text-gray-500">Client</p>
                        </div>
                      </div>
                      <a href={`tel:${selectedOrder.customer_phone}`} className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-lg transition-colors font-medium w-max mt-2">
                        <Phone className="w-4 h-4" />
                        {selectedOrder.customer_phone}
                      </a>
                    </div>
                    
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Livraison</h3>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-900 leading-relaxed">{selectedOrder.customer_address}</p>
                        {selectedOrder.customer_neighborhood && (
                          <div className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md font-medium mt-1">
                            {selectedOrder.customer_neighborhood}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedOrder.notes && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm">
                      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Notes du client</h3>
                      <div className="bg-yellow-50 text-yellow-800 p-3 rounded-xl text-sm leading-relaxed border border-yellow-100">
                        {selectedOrder.notes}
                      </div>
                    </div>
                  )}

                </div>

                {/* Right Column: Actions & Timeline */}
                <div className="space-y-4 sm:space-y-6">
                  
                  {/* Status update widget */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      Statut et Suivi
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Timeline interactive */}
                      <div className="relative pl-2">
                        <div className="absolute left-5 top-4 bottom-4 w-0.5 bg-gray-100"></div>
                        {STATUS_STEPS.map((step, i) => {
                          const currentIdx = STATUS_STEPS.indexOf(selectedOrder.status as OrderStatus);
                          const isDone = i <= currentIdx;
                          const isCurrent = i === currentIdx;
                          const Icon = STATUS_ICONS[step];
                          
                          return (
                            <button 
                              key={step}
                              onClick={() => !isCurrent && handleStatusUpdate(selectedOrder.id, step)}
                              disabled={updatingStatus === selectedOrder.id}
                              className={`relative z-10 flex items-center gap-4 w-full p-2 rounded-xl transition-all ${
                                isCurrent ? "bg-emerald-50 ring-1 ring-emerald-200" : "hover:bg-gray-50"
                              } ${updatingStatus === selectedOrder.id ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                            >
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                isDone ? "bg-emerald-500 text-white shadow-sm" : "bg-white border-2 border-gray-200 text-gray-300"
                              }`}>
                                {isDone ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />}
                              </div>
                              <div className="flex-1 text-left">
                                <p className={`text-sm font-semibold ${isDone ? "text-gray-900" : "text-gray-400"}`}>
                                  {STATUS_LABELS[step]}
                                </p>
                              </div>
                              {updatingStatus === selectedOrder.id && step === selectedOrder.status && (
                                <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Cancel Order Action */}
                      <div className="pt-4 mt-2 border-t border-gray-100">
                        {selectedOrder.status !== "cancelled" ? (
                          <button
                            onClick={() => handleStatusUpdate(selectedOrder.id, "cancelled")}
                            disabled={updatingStatus === selectedOrder.id}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                          >
                            <Ban className="w-4 h-4" />
                            Annuler la commande
                          </button>
                        ) : (
                          <div className="flex items-center justify-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl border border-red-100">
                            <Ban className="w-4 h-4" />
                            <p className="text-sm font-medium">Commande annulée</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm">
                    <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">Zone de danger</h3>
                    <p className="text-xs text-gray-500 mb-4 leading-relaxed">La suppression d'une commande est irréversible. Toutes les données associées seront perdues.</p>
                    <button
                      onClick={() => handleDelete(selectedOrder.id)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-500 border border-red-200 hover:bg-red-50 hover:text-red-600 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer définitivement
                    </button>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
