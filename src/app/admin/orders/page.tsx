"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Phone, Eye, Trash2, Package } from "lucide-react";
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
  products?: { name: string } | null;
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
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const STATUSES: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*, products(name)")
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
    const { error } = await supabase
      .from("orders")
      .delete()
      .eq("id", id);
    if (error) {
      toast.error("Erreur de suppression");
    } else {
      toast.success("Commande supprimée");
      fetchOrders();
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status as OrderStatus;
    return (
      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[s] || STATUS_COLORS.pending}`}>
        {STATUS_LABELS[s] || status}
      </span>
    );
  };

  const viewDetails = (order: Order) => {
    setSelectedOrder(order);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Commandes</h1>
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-xl text-sm font-medium">
            {orders.length} commande{orders.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Chargement...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Aucune commande trouvée</div>
      ) : (
        <>
          {/* Vue tableau pour desktop */}
          <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Client</th>
                    <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Produit</th>
                    <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Qté</th>
                    <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="text-left p-4 text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="text-right p-4 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{order.customer_name}</p>
                          <p className="text-xs text-gray-500">{order.customer_phone}</p>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-900">
                        {order.products?.name || "Produit supprimé"}
                      </td>
                      <td className="p-4 text-sm text-gray-900">{order.quantity}</td>
                      <td className="p-4 text-sm font-medium text-gray-900">
                        {formatPrice(order.total_price, order.currency)}
                      </td>
                      <td className="p-4">{getStatusBadge(order.status)}</td>
                      <td className="p-4 text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString("fr-FR", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => viewDetails(order)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Détails"
                          >
                            <Eye className="w-4 h-4 text-gray-500" />
                          </button>
                          <a
                            href={`tel:${order.customer_phone}`}
                            className="p-2 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Appeler"
                          >
                            <Phone className="w-4 h-4 text-emerald-600" />
                          </a>
                          <button
                            onClick={() => handleDelete(order.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Vue cartes pour mobile */}
          <div className="grid grid-cols-1 sm:hidden gap-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{order.customer_name}</p>
                    <p className="text-xs text-gray-500">{order.customer_phone}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => viewDetails(order)} className="p-2 hover:bg-gray-100 rounded-lg" title="Détails">
                      <Eye className="w-4 h-4 text-gray-500" />
                    </button>
                    <a href={`tel:${order.customer_phone}`} className="p-2 hover:bg-emerald-50 rounded-lg" title="Appeler">
                      <Phone className="w-4 h-4 text-emerald-600" />
                    </a>
                    <button onClick={() => handleDelete(order.id)} className="p-2 hover:bg-red-50 rounded-lg" title="Supprimer">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Produit:</span>
                    <span className="text-gray-900">{order.products?.name || "Produit supprimé"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Quantité:</span>
                    <span className="text-gray-900">{order.quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total:</span>
                    <span className="font-bold text-gray-900">
                      {formatPrice(order.total_price, order.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Statut:</span>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date:</span>
                    <span className="text-gray-500">
                      {new Date(order.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric", month: "short",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal détails commande */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm">Commande</p>
                  <h2 className="text-white font-bold text-lg">
                    {selectedOrder.customer_name}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              <div className="flex items-center justify-center">
                {getStatusBadge(selectedOrder.status)}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Client</span>
                  <span className="text-sm font-medium text-gray-900">{selectedOrder.customer_name}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Téléphone</span>
                  <a href={`tel:${selectedOrder.customer_phone}`} className="text-sm font-medium text-emerald-600 hover:underline">
                    {selectedOrder.customer_phone}
                  </a>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Adresse</span>
                  <span className="text-sm font-medium text-gray-900 text-right max-w-[200px]">
                    {selectedOrder.customer_address}
                  </span>
                </div>
                {selectedOrder.customer_neighborhood && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Quartier</span>
                    <span className="text-sm font-medium text-gray-900">{selectedOrder.customer_neighborhood}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Produit</span>
                  <span className="text-sm font-medium text-gray-900">
                    {selectedOrder.products?.name || "Produit supprimé"}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Quantité</span>
                  <span className="text-sm font-medium text-gray-900">{selectedOrder.quantity}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Total</span>
                  <span className="text-lg font-bold text-emerald-600">
                    {formatPrice(selectedOrder.total_price, selectedOrder.currency)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">Date</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(selectedOrder.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                </div>
                {selectedOrder.notes && (
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-gray-500">Notes</span>
                    <span className="text-sm text-gray-900 text-right max-w-[200px]">{selectedOrder.notes}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusUpdate(selectedOrder.id, status)}
                      disabled={updatingStatus === selectedOrder.id}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        selectedOrder.status === status
                          ? `${STATUS_COLORS[status]} ring-2 ring-offset-1 ring-gray-300`
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      } disabled:opacity-50`}
                    >
                      {STATUS_LABELS[status]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <a
                  href={`tel:${selectedOrder.customer_phone}`}
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-sm font-medium"
                >
                  <Phone className="w-4 h-4" />
                  Appeler
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
