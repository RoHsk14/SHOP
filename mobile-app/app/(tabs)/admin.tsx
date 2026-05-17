import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Linking, StyleSheet, Dimensions, Platform, Modal, ScrollView, AppState } from 'react-native';
import { useRouter } from 'expo-router';
import { showOrderNotification } from '@/lib/notifications';
import { formatPrice } from '@/lib/currency';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import Svg, { Path, Circle, Line, G, Text as SvgText } from 'react-native-svg';
import { supabase } from '@/lib/supabase';

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

const STATUS_COLORS: Record<string, string> = {
  pending: '#eab308',
  confirmed: '#3b82f6',
  shipped: '#8b5cf6',
  delivered: '#22c55e',
  cancelled: '#ef4444',
};

const DATE_FILTERS = [
  { value: 'today', label: "Auj." },
  { value: '7days', label: '7j' },
  { value: '30days', label: '30j' },
  { value: '90days', label: '90j' },
  { value: 'year', label: 'Année' },
  { value: 'custom', label: 'Perso.' },
];

const screenWidth = Dimensions.get('window').width;
const CHART_WIDTH = screenWidth - 64;
const CHART_HEIGHT = 180;
const DONUT_SIZE = 160;

function AreaChart({ data }: { data: { date: string; value: number }[] }) {
  if (data.length === 0) return null;
  const values = data.map(d => d.value);
  const maxVal = Math.max(...values, 1);
  const padding = { top: 20, bottom: 30, left: 40, right: 10 };
  const w = CHART_WIDTH;
  const h = CHART_HEIGHT;
  const plotW = w - padding.left - padding.right;
  const plotH = h - padding.top - padding.bottom;

  const xScale = (i: number) => padding.left + (i / Math.max(data.length - 1, 1)) * plotW;
  const yScale = (v: number) => padding.top + plotH - (v / maxVal) * plotH;

  const linePoints = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(d.value)}`).join(' ');
  const areaPoints = `${linePoints} L${xScale(data.length - 1)},${padding.top + plotH} L${xScale(0)},${padding.top + plotH} Z`;

  const yTicks = [0, Math.round(maxVal / 2), maxVal];

  return (
    <Svg width={w} height={h}>
      <G>
        {yTicks.map((tick, i) => (
          <G key={i}>
            <Line x1={padding.left} y1={yScale(tick)} x2={w - padding.right} y2={yScale(tick)} stroke="#f3f4f6" strokeWidth={1} />
            <SvgText x={padding.left - 8} y={yScale(tick) + 4} fontSize={10} fill="#9ca3af" textAnchor="end">{tick}</SvgText>
          </G>
        ))}
      </G>
      <Path d={areaPoints} fill="rgba(5, 150, 105, 0.12)" />
      <Path d={linePoints} fill="none" stroke="#059669" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {data.length <= 14 && data.map((d, i) => (
        <Circle key={i} cx={xScale(i)} cy={yScale(d.value)} r={3} fill="#059669" />
      ))}
      {data.filter((_, i) => i % Math.max(1, Math.floor(data.length / 5)) === 0).map((d, i) => {
        const idx = data.indexOf(d);
        return (
          <SvgText key={i} x={xScale(idx)} y={h - 6} fontSize={9} fill="#9ca3af" textAnchor="middle">{d.date}</SvgText>
        );
      })}
    </Svg>
  );
}

function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;
  const radius = 55;
  const circumference = 2 * Math.PI * radius;
  const strokeWidth = 25;
  const center = DONUT_SIZE / 2;

  let cumulative = 0;

  return (
    <Svg width={DONUT_SIZE} height={DONUT_SIZE}>
      <Circle cx={center} cy={center} r={radius} fill="none" stroke="#f3f4f6" strokeWidth={strokeWidth} />
      {data.filter(d => d.value > 0).map((d, i) => {
        const segmentLength = (d.value / total) * circumference;
        const dashArray = `${segmentLength} ${circumference - segmentLength}`;
        const dashOffset = -cumulative;
        cumulative += segmentLength;
        return (
          <Circle
            key={i} cx={center} cy={center} r={radius} fill="none" stroke={d.color} strokeWidth={strokeWidth}
            strokeDasharray={dashArray} strokeDashoffset={dashOffset} rotation="-90" origin={`${center}, ${center}`} strokeLinecap="round"
          />
        );
      })}
      <SvgText x={center} y={center - 4} fontSize={22} fontWeight="800" fill="#111827" textAnchor="middle">{total}</SvgText>
      <SvgText x={center} y={center + 14} fontSize={10} fill="#6b7280" textAnchor="middle">Total</SvgText>
    </Svg>
  );
}

export default function AdminScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateFilter, setDateFilter] = useState('7days');
  const [customStart, setCustomStart] = useState(new Date());
  const [customEnd, setCustomEnd] = useState(new Date());
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'start' | 'end' | null>(null);
  const router = useRouter();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [stats, setStats] = useState({ pending: 0, confirmed: 0, delivered: 0, cancelled: 0, total: 0, revenue: 0 });

  const getDateRange = () => {
    if (dateFilter === 'custom') {
      return new Date(customStart.getFullYear(), customStart.getMonth(), customStart.getDate()).toISOString();
    }
    const now = new Date();
    let start = new Date(now);
    switch (dateFilter) {
      case 'today': start = new Date(now.setHours(0, 0, 0, 0)); break;
      case '7days': start.setDate(start.getDate() - 7); break;
      case '30days': start.setDate(start.getDate() - 30); break;
      case '90days': start.setDate(start.getDate() - 90); break;
      case 'year': start = new Date(now.getFullYear(), 0, 1); break;
    }
    return start.toISOString();
  };

  const fetchOrders = useCallback(async () => {
    const startDate = getDateRange();
    let query = supabase.from('orders').select('*').gte('created_at', startDate);
    if (dateFilter === 'custom') {
      const endOfDay = new Date(customEnd);
      endOfDay.setHours(23, 59, 59, 999);
      query = query.lte('created_at', endOfDay.toISOString());
    }
    const { data } = await query.order('created_at', { ascending: false }).limit(50);
    if (data) {
      setOrders(data);
      setStats({
        pending: data.filter((o) => o.status === 'pending').length,
        confirmed: data.filter((o) => o.status === 'confirmed').length,
        delivered: data.filter((o) => o.status === 'delivered').length,
        cancelled: data.filter((o) => o.status === 'cancelled').length,
        total: data.length,
        revenue: data.reduce((acc, o) => acc + (o.total_price || 0), 0),
      });
    }
    setLoading(false);
    setRefreshing(false);
  }, [dateFilter, customStart, customEnd]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const channelName = `admin-orders-${Date.now()}`;
    const channel = supabase.channel(channelName);

    try {
      channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, async (payload: { new: Order }) => {
        const newOrder = payload.new;
        const currency = newOrder.currency || 'EUR';
        const total = formatPrice(newOrder.total_price, currency);
        console.log('📦 New order received via Realtime:', newOrder.customer_name, total);
        await showOrderNotification(newOrder.customer_name, total);
        fetchOrders();
      });
      channel.subscribe((status) => {
        console.log('🔌 Realtime channel status:', status);
      });
    } catch (e) {
      console.warn('Realtime subscription error:', e);
    }

    return () => { supabase.removeChannel(channel); };
  }, []);

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

  const salesTrend = (() => {
    if (dateFilter === 'today') {
      const result: { date: string; value: number }[] = [];
      const todayStr = new Date().toISOString().split('T')[0];
      for (let h = 0; h < 24; h++) {
        const hourStart = `${todayStr}T${String(h).padStart(2, '0')}:00:00`;
        const hourEnd = `${todayStr}T${String(h).padStart(2, '0')}:59:59`;
        const hourOrders = orders.filter(o => o.created_at >= hourStart && o.created_at <= hourEnd);
        result.push({ date: `${h}h`, value: hourOrders.reduce((s, o) => s + (o.total_price || 0), 0) });
      }
      return result;
    }
    if (dateFilter === 'custom') {
      const diffDays = Math.max(1, Math.ceil((customEnd.getTime() - customStart.getTime()) / (1000 * 60 * 60 * 24)));
      const result: { date: string; value: number }[] = [];
      for (let i = 0; i <= diffDays; i++) {
        const d = new Date(customStart);
        d.setDate(d.getDate() + i);
        const ds = d.toISOString().split('T')[0];
        const dayOrders = orders.filter(o => o.created_at?.startsWith(ds));
        result.push({ date: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }), value: dayOrders.reduce((s, o) => s + (o.total_price || 0), 0) });
      }
      return result;
    }
    const days = dateFilter === '7days' ? 7 : dateFilter === '30days' ? 30 : dateFilter === '90days' ? 90 : 365;
    const result: { date: string; value: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const dayOrders = orders.filter(o => o.created_at?.startsWith(ds));
      result.push({ date: d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }), value: dayOrders.reduce((s, o) => s + (o.total_price || 0), 0) });
    }
    return result;
  })();

  const statusData = [
    { label: 'En attente', value: stats.pending, color: STATUS_COLORS.pending },
    { label: 'Confirmées', value: stats.confirmed, color: STATUS_COLORS.confirmed },
    { label: 'Expédiées', value: orders.filter(o => o.status === 'shipped').length, color: STATUS_COLORS.shipped },
    { label: 'Livrées', value: stats.delivered, color: STATUS_COLORS.delivered },
    { label: 'Annulées', value: stats.cancelled, color: STATUS_COLORS.cancelled },
  ].filter(d => d.value > 0);

  const renderHeader = () => (
    <View>
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 }}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#111827' }}>Tableau de bord</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 16, paddingVertical: 12 }} contentContainerStyle={{ gap: 6 }}>
        {DATE_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value} onPress={() => { if (f.value === 'custom') setShowCustomPicker(true); else setDateFilter(f.value); }}
            style={[styles.filterChip, dateFilter === f.value && styles.filterChipActive]} activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, dateFilter === f.value && styles.filterChipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {showCustomPicker && (
        <View style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 12 }}>Période personnalisée</Text>
          <TouchableOpacity onPress={() => setPickerTarget('start')} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 10 }} activeOpacity={0.7}>
            <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: '500' }}>Début</Text>
            <Text style={{ fontSize: 14, color: '#111827', fontWeight: '600' }}>{customStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setPickerTarget('end')} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 16 }} activeOpacity={0.7}>
            <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: '500' }}>Fin</Text>
            <Text style={{ fontSize: 14, color: '#111827', fontWeight: '600' }}>{customEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
          </TouchableOpacity>
          {pickerTarget && Platform.OS === 'ios' && (
            <DateTimePicker value={pickerTarget === 'start' ? customStart : customEnd} mode="date" display="spinner" locale="fr-FR" onChange={(_event: DateTimePickerEvent, date?: Date) => { if (date) { if (pickerTarget === 'start') setCustomStart(date); else setCustomEnd(date); } }} />
          )}
          {pickerTarget && Platform.OS === 'android' && (
            <DateTimePicker value={pickerTarget === 'start' ? customStart : customEnd} mode="date" display="default" locale="fr-FR" onChange={(_event: DateTimePickerEvent, date?: Date) => { if (date) { if (pickerTarget === 'start') setCustomStart(date); else setCustomEnd(date); } setPickerTarget(null); }} />
          )}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            <TouchableOpacity onPress={() => { setShowCustomPicker(false); setPickerTarget(null); }} style={{ flex: 1, backgroundColor: '#f3f4f6', borderRadius: 10, paddingVertical: 10, alignItems: 'center' }} activeOpacity={0.7}>
              <Text style={{ color: '#6b7280', fontWeight: '600', fontSize: 13 }}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setDateFilter('custom'); setShowCustomPicker(false); setPickerTarget(null); }} style={{ flex: 1, backgroundColor: '#059669', borderRadius: 10, paddingVertical: 10, alignItems: 'center' }} activeOpacity={0.9}>
              <Text style={{ color: 'white', fontWeight: '600', fontSize: 13 }}>Appliquer</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={{ paddingHorizontal: 16, gap: 10, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={[styles.statCard, { flex: 1.4 }]}>
            <Text style={{ fontSize: 11, color: '#6b7280', fontWeight: '500' }}>Revenu</Text>
            <Text style={{ fontSize: 22, fontWeight: '900', color: '#111827', marginTop: 2 }}>{stats.revenue.toLocaleString()} F</Text>
            <View style={{ backgroundColor: '#d1fae5', borderRadius: 100, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginTop: 6 }}>
              <Text style={{ fontSize: 10, color: '#047857', fontWeight: '600' }}>+{stats.total} commandes</Text>
            </View>
          </View>
          <View style={[styles.statCard, { flex: 1 }]}>
            <Text style={{ fontSize: 11, color: '#6b7280', fontWeight: '500' }}>{stats.pending > 0 ? 'En attente' : 'Total'}</Text>
            <Text style={{ fontSize: 22, fontWeight: '900', color: stats.pending > 0 ? '#eab308' : '#111827', marginTop: 2 }}>{stats.pending > 0 ? stats.pending : stats.total}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={[styles.statCard, { flex: 1 }]}>
            <Text style={{ fontSize: 11, color: '#6b7280', fontWeight: '500' }}>Confirmées</Text>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#3b82f6', marginTop: 2 }}>{stats.confirmed}</Text>
          </View>
          <View style={[styles.statCard, { flex: 1 }]}>
            <Text style={{ fontSize: 11, color: '#6b7280', fontWeight: '500' }}>Livrées</Text>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#22c55e', marginTop: 2 }}>{stats.delivered}</Text>
          </View>
          <View style={[styles.statCard, { flex: 1 }]}>
            <Text style={{ fontSize: 11, color: '#6b7280', fontWeight: '500' }}>Annulées</Text>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#ef4444', marginTop: 2 }}>{stats.cancelled}</Text>
          </View>
        </View>
      </View>

      <View style={styles.chartCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827' }}>Tendance des ventes</Text>
          <TouchableOpacity onPress={onRefresh} style={{ padding: 4 }}>
            <Text style={{ fontSize: 16 }}>🔄</Text>
          </TouchableOpacity>
        </View>
        <AreaChart data={salesTrend} />
      </View>

      <View style={styles.chartCard}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 12 }}>Répartition des commandes</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
          <DonutChart data={statusData} />
          <View style={{ gap: 8 }}>
            {statusData.map((d, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: d.color }} />
                <Text style={{ fontSize: 12, color: '#6b7280' }}>{d.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, marginTop: 8, marginBottom: 24 }}>
        <TouchableOpacity
          onPress={() => router.push('/orders')}
          style={{ backgroundColor: '#059669', borderRadius: 16, paddingVertical: 16, alignItems: 'center' }}
          activeOpacity={0.9}
        >
          <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
            Voir les commandes ({orders.length})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f9fafb', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  return (
    <>
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }} contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}
    >
      {renderHeader()}
    </ScrollView>

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

    </>
  );
}

const styles = StyleSheet.create({
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterChipActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  filterChipTextActive: {
    color: 'white',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  chartCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
});
