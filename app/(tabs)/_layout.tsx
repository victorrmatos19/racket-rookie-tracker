import { Tabs } from 'expo-router';
import { View, Image, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';

function TabBarIcon({
  name,
  color,
  focused,
}: {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  focused: boolean;
}) {
  return (
    <Ionicons
      name={focused ? name : (`${name}-outline` as keyof typeof Ionicons.glyphMap)}
      size={24}
      color={color}
    />
  );
}

export default function TabLayout() {
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRole();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data }) => setProfile(data));
    }
  }, [user]);

  const handleSignOut = () => {
    Alert.alert('Sair', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopColor: Colors.border,
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        header: () => (
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.logo}
                resizeMode="cover"
              />
              <View>
                <Text style={styles.headerTitle}>RacketPro</Text>
                <Text style={styles.headerSub}>
                  {profile?.full_name ?? user?.email ?? ''}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
            </TouchableOpacity>
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Alunos',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="people" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Cronograma',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="calendar" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="financial"
        options={{
          title: 'Financeiro',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="cash" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="sistema"
        options={{
          title: 'Sistema',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="settings" color={color} focused={focused} />
          ),
          tabBarButton: isAdmin ? undefined : () => null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 12,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
  },
  headerSub: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  signOutBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.dangerBg,
  },
});
