import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lwivyouaiizweukrnrtz.supabase.co';
const supabaseAnonKey = 'sb_publishable_hAUtcON82h3JAr3I_RcoPw_YU-tNZiM';

let storage: any = undefined;

if (Platform.OS !== 'web') {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  storage = AsyncStorage;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: Platform.OS !== 'web',
    detectSessionInUrl: false,
  },
});
