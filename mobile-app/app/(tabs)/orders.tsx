import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Linking, Modal, ScrollView } from 'react-native';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/currency';

interface Order {
  id: string;
  product_id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  total_price: number;
  currency: string;
  status: string;
  quantity: number;
  created_at: string;
}

const STATUS_FLOW = ['pending', 'confirmed', 'shipped', 'delivered'];

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [productNames, setProductNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = useCallback(async () => {
    const [ordersRes, productsRes] = await Promise.all([
      supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('products').select('id, name'),
    ]);
    if (productsRes.data) {
      const map: Record<string, string> = {};
      productsRes.data.forEach(p => { map[p.id] = p.name; });
      setProductNames(map);
    }
    if (ordersRes.data) {
      setOrders(ordersRes.data);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (!error) fetchOrders();
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const confirmStatus = (order: Order, nextStatus: string) => {
    Alert.alert(
      'Changer le statut',
      `Passer de "${STATUS_LABELS[order.status]}" à "${STATUS_LABELS[nextStatus]}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Confirmer', onPress: () => handleStatusUpdate(order.id, nextStatus) },
      ]
    );
  };

  const onRefresh = () => { setRefreshing(true); fetchOrders(); };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f9fafb', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}
        contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>📋</Text>
            <Text style={{ color: '#9ca3af', fontSize: 16 }}>Aucune commande</Text>
          </View>
        }
        renderItem={({ item }) => {
          const statusIndex = STATUS_FLOW.indexOf(item.status);
          const canAdvance = statusIndex >= 0 && statusIndex < STATUS_FLOW.length - 1;
          const nextStatus = canAdvance ? STATUS_FLOW[statusIndex + 1] : null;
          const statusBg = item.status === 'pending' ? '#fef3c7' : item.status === 'confirmed' ? '#dbeafe' : item.status === 'shipped' ? '#f3e8ff' : item.status === 'delivered' ? '#d1fae5' : '#fee2e2';
          const statusText = item.status === 'pending' ? '#a16207' : item.status === 'confirmed' ? '#1d4ed8' : item.status === 'shipped' ? '#7c3aed' : item.status === 'delivered' ? '#15803d' : '#b91c1c';

          return (
            <TouchableOpacity onPress={() => setSelectedOrder(item)} activeOpacity={0.95}
              style={{ backgroundColor: 'white', borderRadius: 16, marginBottom: 12, padding: 16, borderWidth: 1, borderColor: '#f3f4f6' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>{item.customer_name}</Text>
                  <Text style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{productNames[item.product_id] || 'Produit'}</Text>
                  <TouchableOpacity onPress={() => handleCall(item.customer_phone)} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <Text style={{ color: '#059669', fontSize: 14, fontWeight: '500' }}>📞 {item.customer_phone}</Text>
                  </TouchableOpacity>
                  {item.customer_address ? (
                    <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>📍 {item.customer_address}</Text>
                  ) : null}
                </View>
                <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 100, backgroundColor: statusBg }}>
                  <Text style={{ fontSize: 12, fontWeight: '500', color: statusText }}>{STATUS_LABELS[item.status] || item.status}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6' }}>
                <Text style={{ fontSize: 14, color: '#6b7280' }}>Qté: <Text style={{ fontWeight: '600', color: '#111827' }}>{item.quantity}</Text></Text>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#059669' }}>{formatPrice(item.total_price, item.currency)}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                {canAdvance && nextStatus && (
                  <TouchableOpacity onPress={() => confirmStatus(item, nextStatus)} style={{ flex: 1, backgroundColor: '#d1fae5', borderRadius: 12, paddingVertical: 10, alignItems: 'center' }} activeOpacity={0.8}>
                    <Text style={{ color: '#047857', fontWeight: '600', fontSize: 12 }}>✓ {STATUS_LABELS[nextStatus]}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => handleCall(item.customer_phone)} style={{ backgroundColor: '#eff6ff', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center' }} activeOpacity={0.8}>
                  <Text style={{ color: '#2563eb', fontWeight: '600', fontSize: 12 }}>📞 Appeler</Text>
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 10, color: '#9ca3af', marginTop: 8 }}>
                {new Date(item.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Order Detail Modal */}
      <Modal visible={!!selectedOrder} transparent animationType="slide" onRequestClose={() => setSelectedOrder(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 8, paddingHorizontal: 20, paddingBottom: 40, maxHeight: '85%' }}>
            <View style={{ width: 40, height: 4, backgroundColor: '#d1d5db', borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />
            <ScrollView>
              {selectedOrder && (
                <>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 20, fontWeight: '800', color: '#111827' }}>{selectedOrder.customer_name}</Text>
                      <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>{productNames[selectedOrder.product_id] || 'Produit'}</Text>
                      <TouchableOpacity onPress={() => handleCall(selectedOrder.customer_phone)} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                        <Text style={{ color: '#059669', fontSize: 16, fontWeight: '600' }}>📞 {selectedOrder.customer_phone}</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={() => setSelectedOrder(null)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 16, color: '#6b7280' }}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  {selectedOrder.customer_address ? (
                    <View style={{ backgroundColor: '#f9fafb', borderRadius: 12, padding: 14, marginBottom: 16 }}>
                      <Text style={{ fontSize: 11, color: '#6b7280', fontWeight: '500', marginBottom: 4 }}>Adresse de livraison</Text>
                      <Text style={{ fontSize: 14, color: '#111827' }}>📍 {selectedOrder.customer_address}</Text>
                    </View>
                  ) : null}

                  <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                    <View style={{ flex: 1, backgroundColor: '#f9fafb', borderRadius: 12, padding: 14, alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, color: '#6b7280', fontWeight: '500' }}>Quantité</Text>
                      <Text style={{ fontSize: 20, fontWeight: '800', color: '#111827', marginTop: 4 }}>{selectedOrder.quantity}</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: '#f9fafb', borderRadius: 12, padding: 14, alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, color: '#6b7280', fontWeight: '500' }}>Total</Text>
                      <Text style={{ fontSize: 18, fontWeight: '800', color: '#059669', marginTop: 4 }}>{formatPrice(selectedOrder.total_price, selectedOrder.currency)}</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: '#f9fafb', borderRadius: 12, padding: 14, alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, color: '#6b7280', fontWeight: '500' }}>Statut</Text>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100, backgroundColor: selectedOrder.status === 'pending' ? '#fef3c7' : selectedOrder.status === 'confirmed' ? '#dbeafe' : selectedOrder.status === 'delivered' ? '#d1fae5' : '#fee2e2', marginTop: 4 }}>
                        <Text style={{ fontSize: 11, fontWeight: '600', color: selectedOrder.status === 'pending' ? '#a16207' : selectedOrder.status === 'confirmed' ? '#1d4ed8' : selectedOrder.status === 'delivered' ? '#15803d' : '#b91c1c' }}>
                          {STATUS_LABELS[selectedOrder.status]}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={{ backgroundColor: '#f9fafb', borderRadius: 12, padding: 14, marginBottom: 16 }}>
                    <Text style={{ fontSize: 11, color: '#6b7280', fontWeight: '500', marginBottom: 4 }}>Date de commande</Text>
                    <Text style={{ fontSize: 14, color: '#111827' }}>
                      {new Date(selectedOrder.created_at).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>

                  {(() => {
                    const idx = STATUS_FLOW.indexOf(selectedOrder.status);
                    const nxt = idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
                    return nxt ? (
                      <TouchableOpacity
                        onPress={() => { confirmStatus(selectedOrder, nxt); setSelectedOrder(null); }}
                        style={{ backgroundColor: '#059669', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 10 }}
                        activeOpacity={0.9}
                      >
                        <Text style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>✓ Passer à {STATUS_LABELS[nxt]}</Text>
                      </TouchableOpacity>
                    ) : null;
                  })()}

                  <TouchableOpacity
                    onPress={() => handleCall(selectedOrder.customer_phone)}
                    style={{ backgroundColor: '#eff6ff', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: '#dbeafe' }}
                    activeOpacity={0.9}
                  >
                    <Text style={{ color: '#2563eb', fontWeight: '700', fontSize: 15 }}>📞 Appeler le client</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
