import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Storage adapter for Supabase auth session.
 *
 * - Native (iOS/Android): expo-secure-store → encrypted via device Keychain / Keystore.
 * - Web: localStorage (SecureStore not available on web).
 */
const storage =
  Platform.OS === 'web'
    ? {
        getItem: (key: string) =>
          Promise.resolve(
            typeof window !== 'undefined' ? window.localStorage.getItem(key) : null
          ),
        setItem: (key: string, value: string) =>
          Promise.resolve(
            typeof window !== 'undefined'
              ? window.localStorage.setItem(key, value)
              : undefined
          ),
        removeItem: (key: string) =>
          Promise.resolve(
            typeof window !== 'undefined'
              ? window.localStorage.removeItem(key)
              : undefined
          ),
      }
    : {
        getItem: (key: string) => SecureStore.getItemAsync(key),
        setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
        removeItem: (key: string) => SecureStore.deleteItemAsync(key),
      };

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
