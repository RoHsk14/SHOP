import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, AppState } from 'react-native';
import { Redirect } from 'expo-router';
import Svg, { Rect, Path, Circle } from 'react-native-svg';
import { supabase } from '@/lib/supabase';
import { registerForPushNotifications } from '@/lib/notifications';

export default function HomeScreen() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        registerForPushNotifications();
      }
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        registerForPushNotifications();
      }
    });
    return () => listener?.subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f9fafb', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/(tabs)/admin" />;
  }

  return <LoginScreen onLogin={() => {}} />;
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async () => {
    setLoading(true);
    setError('');
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError('Email ou mot de passe incorrect');
      setLoading(false);
      return;
    }
    onLogin();
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f9fafb', justifyContent: 'center', paddingHorizontal: 24 }}>
      <View style={{ width: '100%', maxWidth: 384, alignSelf: 'center', backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb', padding: 32 }}>
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <View style={{ width: 64, height: 64, marginBottom: 16 }}>
            <Svg viewBox="0 0 120 120" fill="none" width={64} height={64}>
              <Rect width="118" height="118" x="1" y="1" rx="24" fill="white" stroke="#059669" strokeWidth="2"/>
              <Path d="M32 42h56l-6 34a4 4 0 01-4 3H42a4 4 0 01-4-3l-6-34z" stroke="#059669" strokeWidth="2.5" fill="none" strokeLinejoin="round"/>
              <Circle cx="48" cy="82" r="5" fill="#059669"/>
              <Circle cx="76" cy="82" r="5" fill="#059669"/>
              <Path d="M44 42l6-14h20l6 14" stroke="#059669" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            </Svg>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#111827' }}>Administration</Text>
          <Text style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>Connectez-vous à votre boutique</Text>
        </View>

        <View>
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6 }}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="admin@boutique.com"
            keyboardType="email-address"
            autoCapitalize="none"
            style={{ width: '100%', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, color: '#111827' }}
            placeholderTextColor="#9ca3af"
          />

          <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6, marginTop: 16 }}>Mot de passe</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            style={{ width: '100%', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, color: '#111827' }}
            placeholderTextColor="#9ca3af"
          />

          {error ? (
            <View style={{ backgroundColor: '#fef2f2', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginTop: 12 }}>
              <Text style={{ fontSize: 14, color: '#b91c1c' }}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={handleAuth}
            disabled={loading}
            style={{ width: '100%', backgroundColor: '#059669', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 20 }}
            activeOpacity={0.9}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>Se connecter</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
