import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  TextInput,
  TouchableOpacity,
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

interface PlanStat {
  id: string;
  name: string;
  price_brl: number;
  activeCount: number;
  trialingCount: number;
}

interface SubscriberRow {
  id: string;
  user_id: string;
  plan_id: string;
  plan_name: string;
  status: string;
  trial_ends_at: string | null;
  current_period_end: string | null;
  email: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  trialing:  { label: 'Trial',     color: Colors.warningDark, bg: Colors.warningBg },
  active:    { label: 'Ativo',     color: Colors.primary,     bg: Colors.primaryBg },
  past_due:  { label: 'Atrasado',  color: Colors.dangerDark,  bg: Colors.dangerBg  },
  canceled:  { label: 'Cancelado', color: Colors.textMuted,   bg: Colors.muted     },
  incomplete:{ label: 'Incompleto',color: Colors.textMuted,   bg: Colors.muted     },
};

const PAGE_SIZE_SUBS = 20;

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

  // Subscription analytics state
  const [planStats, setPlanStats] = useState<PlanStat[]>([]);
  const [subscribers, setSubscribers] = useState<SubscriberRow[]>([]);
  const [subSearch, setSubSearch] = useState('');
  const [subPage, setSubPage] = useState(1);

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

      // Subscription analytics
      const [plansRes, subsRes] = await Promise.all([
        supabase.from('plans').select('*').order('price_brl'),
        supabase.from('subscriptions').select('*, profiles(email)'),
      ]);

      if (!plansRes.error && !subsRes.error) {
        const subs = subsRes.data ?? [];
        const plans = plansRes.data ?? [];

        const stats: PlanStat[] = plans.map((p) => ({
          id: p.id,
          name: p.name,
          price_brl: p.price_brl,
          activeCount: subs.filter((s) => s.plan_id === p.id && s.status === 'active').length,
          trialingCount: subs.filter((s) => s.plan_id === p.id && s.status === 'trialing').length,
        }));

        const rows: SubscriberRow[] = subs.map((s) => ({
          id: s.id,
          user_id: s.user_id,
          plan_id: s.plan_id,
          plan_name: plans.find((p) => p.id === s.plan_id)?.name ?? s.plan_id,
          status: s.status,
          trial_ends_at: s.trial_ends_at,
          current_period_end: s.current_period_end,
          email: (s.profiles as any)?.email ?? '—',
        }));

        setPlanStats(stats);
        setSubscribers(rows);
      }

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

        {/* ── Subscription Analytics ── */}
        {planStats.length > 0 && (() => {
          const totalActive = planStats.reduce((s, p) => s + p.activeCount, 0);
          const totalTrialing = planStats.reduce((s, p) => s + p.trialingCount, 0);
          const mrr = planStats.reduce((s, p) => s + (p.activeCount + p.trialingCount) * p.price_brl, 0);
          const formatBRL = (cents: number) =>
            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

          const filteredSubs = subscribers.filter((s) =>
            s.email.toLowerCase().includes(subSearch.toLowerCase())
          );
          const pagedSubs = filteredSubs.slice(0, subPage * PAGE_SIZE_SUBS);
          const hasMoreSubs = pagedSubs.length < filteredSubs.length;

          return (
            <>
              {/* MRR Summary */}
              <View style={styles.subSection}>
                <Text style={styles.sectionTitle}>Assinaturas</Text>
                <View style={styles.mrrRow}>
                  <View style={[styles.mrrCard, { borderColor: Colors.primary }]}>
                    <Text style={styles.mrrLabel}>MRR Total</Text>
                    <Text style={[styles.mrrValue, { color: Colors.primary }]}>{formatBRL(mrr)}</Text>
                  </View>
                  <View style={styles.mrrCard}>
                    <Text style={styles.mrrLabel}>Ativos</Text>
                    <Text style={styles.mrrValue}>{totalActive}</Text>
                  </View>
                  <View style={styles.mrrCard}>
                    <Text style={styles.mrrLabel}>Em Trial</Text>
                    <Text style={[styles.mrrValue, { color: Colors.warningDark }]}>{totalTrialing}</Text>
                  </View>
                </View>

                {/* Per-plan cards */}
                {planStats.map((p) => (
                  <View key={p.id} style={styles.planCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.planCardName}>{p.name}</Text>
                      <Text style={styles.planCardSub}>
                        {p.activeCount} ativo(s) · {p.trialingCount} trial
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.planCardMrr}>
                        {formatBRL((p.activeCount + p.trialingCount) * p.price_brl)}
                      </Text>
                      <Text style={styles.planCardMrrLabel}>MRR</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Subscribers table */}
              <View style={styles.subSection}>
                <Text style={styles.sectionTitle}>Assinantes</Text>
                <View style={styles.searchBar}>
                  <Ionicons name="search-outline" size={16} color={Colors.textMuted} />
                  <TextInput
                    style={styles.searchInput}
                    value={subSearch}
                    onChangeText={(v) => { setSubSearch(v); setSubPage(1); }}
                    placeholder="Buscar por email..."
                    placeholderTextColor={Colors.textMuted}
                  />
                </View>

                {pagedSubs.length === 0 ? (
                  <Text style={styles.emptyText}>Nenhum assinante encontrado</Text>
                ) : (
                  pagedSubs.map((sub) => {
                    const sc = STATUS_CONFIG[sub.status] ?? STATUS_CONFIG.canceled;
                    return (
                      <View key={sub.id} style={styles.subRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.subEmail} numberOfLines={1}>{sub.email}</Text>
                          <Text style={styles.subMeta}>
                            {sub.plan_name}
                            {sub.trial_ends_at
                              ? ` · Trial até ${new Date(sub.trial_ends_at).toLocaleDateString('pt-BR')}`
                              : sub.current_period_end
                              ? ` · Renova ${new Date(sub.current_period_end).toLocaleDateString('pt-BR')}`
                              : ''}
                          </Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                          <Text style={[styles.statusText, { color: sc.color }]}>{sc.label}</Text>
                        </View>
                      </View>
                    );
                  })
                )}

                {hasMoreSubs && (
                  <TouchableOpacity
                    style={styles.loadMoreBtn}
                    onPress={() => setSubPage((p) => p + 1)}
                  >
                    <Text style={styles.loadMoreText}>
                      Carregar mais ({filteredSubs.length - pagedSubs.length} restantes)
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          );
        })()}

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

  // Subscription analytics
  subSection: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 14,
  },
  mrrRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  mrrCard: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    alignItems: 'center',
  },
  mrrLabel: { fontSize: 11, color: Colors.textMuted, marginBottom: 4 },
  mrrValue: { fontSize: 18, fontWeight: '800', color: Colors.text },

  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.muted,
  },
  planCardName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  planCardSub: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  planCardMrr: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  planCardMrrLabel: { fontSize: 11, color: Colors.textMuted },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text },
  emptyText: { color: Colors.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: 12 },

  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.muted,
    gap: 10,
  },
  subEmail: { fontSize: 13, fontWeight: '600', color: Colors.text },
  subMeta: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '700' },
  loadMoreBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  loadMoreText: { color: Colors.primary, fontWeight: '600', fontSize: 13 },
});
