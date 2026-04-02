import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { useUserRole } from '@/hooks/useUserRole';
import { StatsCard } from '@/components/StatsCard';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Toast from 'react-native-toast-message';

const screenWidth = Dimensions.get('window').width - 32;

interface UserData {
  id: string;
  email: string;
  full_name: string | null;
  documento: string;
  role: string;
  created_at: string;
}

const roleConfig: Record<string, { label: string; color: string; bg: string }> = {
  administrador: { label: 'Admin', color: Colors.dangerDark, bg: Colors.dangerBg },
  professor: { label: 'Professor', color: Colors.primary, bg: Colors.primaryBg },
  aluno: { label: 'Aluno', color: Colors.textMuted, bg: Colors.muted },
};

export default function SistemaScreen() {
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chartLabels, setChartLabels] = useState<string[]>([]);
  const [chartData, setChartData] = useState<number[]>([]);

  const fetchData = async () => {
    try {
      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('user_roles').select('*'),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (rolesRes.error) throw rolesRes.error;

      const profiles = profilesRes.data ?? [];
      const roles = rolesRes.data ?? [];

      const combined: UserData[] = profiles.map((p) => {
        const userRole = roles.find((r) => r.user_id === p.id);
        return {
          id: p.id,
          email: p.email,
          full_name: p.full_name,
          documento: p.documento,
          role: userRole?.role ?? 'aluno',
          created_at: p.created_at,
        };
      });

      setUsers(combined);

      // Chart data
      const endDate = new Date();
      const startDate = subMonths(endDate, 5);
      const months = eachMonthOfInterval({ start: startDate, end: endDate });
      const labels = months.map((m) => format(m, 'MMM', { locale: ptBR }));
      const counts = months.map((month) => {
        const ms = startOfMonth(month);
        const me = endOfMonth(month);
        return combined.filter((u) => {
          const d = new Date(u.created_at);
          return d >= ms && d <= me;
        }).length;
      });

      setChartLabels(labels);
      setChartData(counts);
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Erro ao carregar dados', text2: err.message });
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!roleLoading && isAdmin) fetchData();
    else if (!roleLoading) setIsLoading(false);
  }, [roleLoading, isAdmin]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (roleLoading || isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={styles.centered}>
        <Ionicons name="lock-closed-outline" size={52} color={Colors.border} />
        <Text style={styles.noAccessTitle}>Acesso Restrito</Text>
        <Text style={styles.noAccessSub}>Apenas administradores podem acessar esta seção</Text>
      </View>
    );
  }

  const thisMonthCount = chartData.length > 0 ? chartData[chartData.length - 1] : 0;

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      <View style={styles.inner}>
        {/* Stats */}
        <View style={styles.statsRow}>
          <StatsCard title="Total Usuários" value={users.length} subtitle="Cadastrados" />
          <View style={{ width: 12 }} />
          <StatsCard
            title="Novos no Mês"
            value={thisMonthCount}
            subtitle="Este mês"
            valueColor={Colors.primary}
          />
        </View>

        {/* Chart */}
        {chartData.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Crescimento (últimos 6 meses)</Text>
            <LineChart
              data={{
                labels: chartLabels,
                datasets: [{ data: chartData.map((v) => Math.max(v, 0)), color: () => Colors.primary, strokeWidth: 2 }],
              }}
              width={screenWidth - 32}
              height={180}
              chartConfig={{
                backgroundColor: Colors.card,
                backgroundGradientFrom: Colors.card,
                backgroundGradientTo: Colors.card,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(22,163,74,${opacity})`,
                labelColor: () => Colors.textMuted,
                propsForDots: { r: '4', fill: Colors.primary },
              }}
              bezier
              style={{ borderRadius: 8 }}
            />
          </View>
        )}

        {/* Users list */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Usuários Ativos</Text>
          {users.map((user) => {
            const rc = roleConfig[user.role] ?? roleConfig.aluno;
            return (
              <View key={user.id} style={styles.userRow}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>
                    {(user.full_name ?? user.email)[0].toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName}>{user.full_name ?? 'Sem nome'}</Text>
                  <Text style={styles.userEmail}>{user.email}</Text>
                  <Text style={styles.userDate}>
                    Desde {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </Text>
                </View>
                <View style={[styles.roleBadge, { backgroundColor: rc.bg }]}>
                  <Text style={[styles.roleText, { color: rc.color }]}>{rc.label}</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ height: 20 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  noAccessTitle: { fontSize: 18, fontWeight: '700', color: Colors.textMuted, marginTop: 12 },
  noAccessSub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginTop: 4 },
  inner: { padding: 16 },
  statsRow: { flexDirection: 'row', marginBottom: 14 },
  chartCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chartTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  section: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.muted,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  userAvatarText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  userName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  userEmail: { fontSize: 12, color: Colors.textMuted },
  userDate: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: { fontSize: 12, fontWeight: '600' },
});
