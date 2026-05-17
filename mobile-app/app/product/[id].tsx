import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Image, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/currency';
import { trackPurchase } from '@/lib/metaPixel';
import { WEB_APP_URL } from '@/lib/config';

interface Product {
  id: string;
  name: string;
  description: string | null;
  prices: Record<string, number> | null;
  images: string[] | null;
}

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ customer_name: '', customer_phone: '', customer_address: '' });

  useEffect(() => {
    supabase.from('products').select('*').eq('id', id).single().then(({ data }) => {
      setProduct(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  if (!product) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <Text className="text-gray-500">Produit introuvable</Text>
      </View>
    );
  }

  const currency = product.prices ? Object.keys(product.prices)[0] : 'EUR';
  const unitPrice = product.prices ? Object.values(product.prices)[0] as number : 0;
  const totalPrice = unitPrice * quantity;

  const handleSubmit = async () => {
    if (!form.customer_name.trim() || !form.customer_phone.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.from('orders').insert({
      product_id: product.id,
      quantity,
      total_price: totalPrice,
      currency,
      customer_name: form.customer_name.trim(),
      customer_phone: form.customer_phone.trim(),
      customer_address: form.customer_address.trim(),
    });

    if (error) {
      Alert.alert('Erreur', 'Impossible de passer la commande. Veuillez réessayer.');
      setSubmitting(false);
      return;
    }

    // Notify admin via push
    try {
      await fetch(`${WEB_APP_URL}/api/notify-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: form.customer_name.trim(),
          total_price: totalPrice,
          currency,
        }),
      });
    } catch {}

    await trackPurchase({
      value: totalPrice,
      currency,
      num_items: quantity,
      content_ids: [product.id],
      content_name: product.name,
      content_type: 'product',
    });

    Alert.alert('Commande confirmée', 'Merci ! Nous vous contacterons bientôt.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
    setSubmitting(false);
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {product.images?.[0] ? (
        <Image source={{ uri: product.images[0] }} className="w-full h-72" resizeMode="cover" />
      ) : (
        <View className="w-full h-72 bg-gray-100 items-center justify-center">
          <Text className="text-gray-300 text-6xl">📦</Text>
        </View>
      )}

      <View className="p-5">
        <Text className="text-xl font-bold text-gray-900">{product.name}</Text>
        {product.description && (
          <Text className="text-sm text-gray-500 mt-2 leading-5">{product.description}</Text>
        )}
        <Text className="text-2xl font-extrabold text-emerald-700 mt-4">{formatPrice(totalPrice, currency)}</Text>

        <View className="flex-row items-center gap-4 mt-6">
          <Text className="text-sm font-medium text-gray-700">Quantité</Text>
          <View className="flex-row items-center bg-white rounded-xl border border-gray-200">
            <TouchableOpacity
              onPress={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-4 py-2"
            >
              <Text className="text-lg font-bold text-gray-600">−</Text>
            </TouchableOpacity>
            <Text className="px-4 py-2 text-base font-semibold text-gray-900 min-w-[40] text-center">{quantity}</Text>
            <TouchableOpacity
              onPress={() => setQuantity(quantity + 1)}
              className="px-4 py-2"
            >
              <Text className="text-lg font-bold text-gray-600">+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="mt-6 bg-white rounded-2xl border border-gray-200 p-5">
          <Text className="text-base font-bold text-gray-900 mb-4">Informations de livraison</Text>
          <View className="space-y-4">
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Nom complet *</Text>
              <TextInput
                value={form.customer_name}
                onChangeText={(v) => setForm({ ...form, customer_name: v })}
                placeholder="Votre nom"
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900"
                placeholderTextColor="#9ca3af"
              />
            </View>
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Téléphone *</Text>
              <TextInput
                value={form.customer_phone}
                onChangeText={(v) => setForm({ ...form, customer_phone: v })}
                placeholder="Votre numéro"
                keyboardType="phone-pad"
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900"
                placeholderTextColor="#9ca3af"
              />
            </View>
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-1">Adresse</Text>
              <TextInput
                value={form.customer_address}
                onChangeText={(v) => setForm({ ...form, customer_address: v })}
                placeholder="Votre adresse (optionnelle)"
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900"
                placeholderTextColor="#9ca3af"
              />
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting}
          className="mt-6 bg-emerald-600 rounded-2xl py-4 items-center"
          activeOpacity={0.9}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-base">
              Commander — {formatPrice(totalPrice, currency)}
            </Text>
          )}
        </TouchableOpacity>

        <Text className="text-center text-xs text-gray-400 mt-3">🔒 Paiement à la livraison</Text>
      </View>
    </ScrollView>
  );
}
