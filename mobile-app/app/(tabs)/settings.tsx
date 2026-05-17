import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView, TextInput } from 'react-native';
import { supabase } from '@/lib/supabase';

export default function SettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pixelId, setPixelId] = useState('');
  const [capiToken, setCapiToken] = useState('');
  const [defaultCurrency, setDefaultCurrency] = useState('EUR');
  const [googleSheetUrl, setGoogleSheetUrl] = useState('');

  useEffect(() => {
    supabase.from('settings').select('*').single().then(({ data }) => {
      if (data) {
        setPixelId(data.pixel_id || '');
        setCapiToken(data.capi_token || '');
        setDefaultCurrency(data.default_currency || 'EUR');
        setGoogleSheetUrl(data.google_sheet_url || '');
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from('settings').upsert({
      pixel_id: pixelId,
      capi_token: capiToken,
      default_currency: defaultCurrency,
      google_sheet_url: googleSheetUrl,
    });
    if (error) {
      Alert.alert('Erreur', "Impossible d'enregistrer les paramètres");
    } else {
      Alert.alert('Succès', 'Paramètres enregistrés');
    }
    setSaving(false);
  };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Se déconnecter', style: 'destructive', onPress: async () => {
        await supabase.auth.signOut();
      }},
    ]);
  };

  const currencies = ['EUR', 'XOF', 'CDF', 'XAF', 'GNF', 'MGA', 'MAD', 'TND', 'DZD', 'NGN', 'GHS', 'KES', 'ZAR', 'USD', 'GBP'];

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f9fafb', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Text style={{ fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 20 }}>Paramètres</Text>

      <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f3f4f6', marginBottom: 16 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 12 }}>Meta Pixel & CAPI</Text>

        <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: '500', marginBottom: 4 }}>Pixel ID</Text>
        <TextInput
          value={pixelId}
          onChangeText={setPixelId}
          placeholder="1813789916680288"
          style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: '#111827', marginBottom: 12 }}
          placeholderTextColor="#9ca3af"
        />

        <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: '500', marginBottom: 4 }}>CAPI Token</Text>
        <TextInput
          value={capiToken}
          onChangeText={setCapiToken}
          placeholder="EAAB..."
          style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 12, color: '#111827', marginBottom: 4 }}
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={2}
        />
      </View>

      <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f3f4f6', marginBottom: 16 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 12 }}>Devise par défaut</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {currencies.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => setDefaultCurrency(c)}
              style={{
                paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100,
                backgroundColor: defaultCurrency === c ? '#059669' : 'white',
                borderWidth: 1, borderColor: defaultCurrency === c ? '#059669' : '#e5e7eb',
              }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: defaultCurrency === c ? 'white' : '#6b7280' }}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#f3f4f6', marginBottom: 16 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 12 }}>Google Sheets</Text>

        <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: '500', marginBottom: 4 }}>URL du Google Sheet</Text>
        <TextInput
          value={googleSheetUrl}
          onChangeText={setGoogleSheetUrl}
          placeholder="https://docs.google.com/spreadsheets/d/..."
          style={{ borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 12, color: '#111827' }}
          placeholderTextColor="#9ca3af"
          autoCapitalize="none"
        />
      </View>

      <TouchableOpacity
        onPress={handleSave}
        disabled={saving}
        style={{ backgroundColor: '#059669', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 16 }}
        activeOpacity={0.9}
      >
        {saving ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>Enregistrer</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleLogout}
        style={{ backgroundColor: 'white', borderRadius: 16, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: '#fee2e2' }}
        activeOpacity={0.9}
      >
        <Text style={{ color: '#b91c1c', fontWeight: '700', fontSize: 16 }}>Déconnexion</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
