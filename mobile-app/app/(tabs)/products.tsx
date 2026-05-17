import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Image, Modal, ScrollView, Linking } from 'react-native';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/currency';

interface Product {
  id: string;
  name: string;
  description: string | null;
  prices: Record<string, number> | null;
  images: string[] | null;
  stock_quantity: number | null;
  created_at: string;
}

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const fetchProducts = useCallback(async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const onRefresh = () => { setRefreshing(true); fetchProducts(); };

  const getPrice = (product: Product) => {
    if (!product.prices) return 'N/A';
    const currency = Object.keys(product.prices)[0];
    const price = Object.values(product.prices)[0] as number;
    return formatPrice(price, currency);
  };

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
        data={products}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}
        contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>📦</Text>
            <Text style={{ color: '#9ca3af', fontSize: 16 }}>Aucun produit</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => setSelectedProduct(item)} activeOpacity={0.95}
            style={{ backgroundColor: 'white', borderRadius: 16, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#f3f4f6' }}
          >
            {item.images?.[0] ? (
              <Image source={{ uri: item.images[0] }} style={{ width: '100%', height: 160 }} resizeMode="cover" />
            ) : (
              <View style={{ height: 100, backgroundColor: '#f9fafb', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 36 }}>📦</Text>
              </View>
            )}
            <View style={{ padding: 14 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827' }}>{item.name}</Text>
              {item.description && (
                <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 4, lineHeight: 16 }} numberOfLines={2}>{item.description}</Text>
              )}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#059669' }}>{getPrice(item)}</Text>
                {item.stock_quantity !== null && (
                  <Text style={{ fontSize: 11, color: item.stock_quantity > 0 ? '#047857' : '#b91c1c', fontWeight: '500' }}>
                    {item.stock_quantity > 0 ? `Stock: ${item.stock_quantity}` : 'Rupture'}
                  </Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Product Detail Modal */}
      <Modal visible={!!selectedProduct} transparent animationType="slide" onRequestClose={() => setSelectedProduct(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 8, paddingHorizontal: 20, paddingBottom: 40, maxHeight: '85%' }}>
            <View style={{ width: 40, height: 4, backgroundColor: '#d1d5db', borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
            <ScrollView>
              {selectedProduct && (
                <>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 20, fontWeight: '800', color: '#111827' }}>{selectedProduct.name}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setSelectedProduct(null)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 16, color: '#6b7280' }}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  {selectedProduct.images?.[0] ? (
                    <Image source={{ uri: selectedProduct.images[0] }} style={{ width: '100%', height: 200, borderRadius: 12, marginBottom: 16 }} resizeMode="cover" />
                  ) : null}

                  <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
                    <View style={{ flex: 1, backgroundColor: '#f9fafb', borderRadius: 12, padding: 14, alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, color: '#6b7280', fontWeight: '500' }}>Prix</Text>
                      <Text style={{ fontSize: 18, fontWeight: '800', color: '#059669', marginTop: 4 }}>{getPrice(selectedProduct)}</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: '#f9fafb', borderRadius: 12, padding: 14, alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, color: '#6b7280', fontWeight: '500' }}>Stock</Text>
                      <Text style={{ fontSize: 18, fontWeight: '800', color: selectedProduct.stock_quantity !== null && selectedProduct.stock_quantity > 0 ? '#111827' : '#b91c1c', marginTop: 4 }}>
                        {selectedProduct.stock_quantity !== null ? selectedProduct.stock_quantity : 'N/A'}
                      </Text>
                    </View>
                  </View>

                  {selectedProduct.description ? (
                    <View style={{ backgroundColor: '#f9fafb', borderRadius: 12, padding: 14, marginBottom: 16 }}>
                      <Text style={{ fontSize: 11, color: '#6b7280', fontWeight: '500', marginBottom: 4 }}>Description</Text>
                      <Text style={{ fontSize: 14, color: '#111827', lineHeight: 20 }}>{selectedProduct.description}</Text>
                    </View>
                  ) : null}

                  <View style={{ backgroundColor: '#f9fafb', borderRadius: 12, padding: 14, marginBottom: 16 }}>
                    <Text style={{ fontSize: 11, color: '#6b7280', fontWeight: '500', marginBottom: 4 }}>Date d'ajout</Text>
                    <Text style={{ fontSize: 14, color: '#111827' }}>
                      {new Date(selectedProduct.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
