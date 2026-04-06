import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription, Plan } from '@/hooks/useSubscription';
import Toast from 'react-native-toast-message';

const formatCurrency = (cents: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);

export default function PlansScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { subscription, refetch } = useSubscription();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    const { data } = await supabase.from('plans').select('*').order('price_brl');
    setPlans(data ?? []);
    setLoadingPlans(false);
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleSubscribe = async (plan: Plan) => {
    if (!user) return;

    setLoadingPlan(plan.id);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { plan_id: plan.id, user_id: user.id, email: user.email },
      });

      if (error || !data?.url) {
        throw new Error(error?.message ?? 'Erro ao criar sessão de pagamento');
      }

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        'racketpro://payment-success',
      );

      if (result.type === 'success') {
        await refetch();
        router.replace('/(tabs)');
        Toast.show({ type: 'success', text1: 'Assinatura ativada!', text2: 'Bem-vindo ao RacketPro.' });
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Erro ao iniciar pagamento', text2: err.message });
    } finally {
      setLoadingPlan(null);
    }
  };

  if (loadingPlans) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.inner}>
        <Text style={styles.title}>Escolha seu plano</Text>
        <Text style={styles.subtitle}>
          14 dias grátis. Cancele quando quiser.
        </Text>

        {plans.map((plan) => {
          const isPro = plan.id === 'pro';
          const isCurrent = subscription?.plan_id === plan.id;
          const isCheckingOut = loadingPlan === plan.id;

          return (
            <View
              key={plan.id}
              style={[styles.card, isPro && styles.cardHighlight]}
            >
              {isPro && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>Mais popular</Text>
                </View>
              )}

              <View style={styles.cardHeader}>
                <Text style={[styles.planName, isPro && styles.planNameHighlight]}>
                  {plan.name}
                </Text>
                <View style={styles.priceRow}>
                  <Text style={[styles.price, isPro && styles.priceHighlight]}>
                    {formatCurrency(plan.price_brl)}
                  </Text>
                  <Text style={styles.pricePeriod}>/mês</Text>
                </View>
                {plan.max_students !== null && (
                  <Text style={styles.limit}>Até {plan.max_students} alunos</Text>
                )}
              </View>

              <View style={styles.featureList}>
                {(plan.features as string[]).map((feature, i) => (
                  <View key={i} style={styles.featureRow}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={isPro ? Colors.primary : Colors.success}
                    />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.subscribeBtn,
                  isPro && styles.subscribeBtnHighlight,
                  isCurrent && styles.subscribeBtnDisabled,
                ]}
                onPress={() => handleSubscribe(plan)}
                disabled={isCurrent || isCheckingOut}
              >
                {isCheckingOut ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.subscribeBtnText}>
                    {isCurrent ? 'Plano atual' : 'Começar grátis'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          );
        })}

        <Text style={styles.disclaimer}>
          Ao assinar, você concorda com os Termos de Serviço. O período de trial de 14 dias não exige cartão de crédito no início.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  inner: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '800', color: Colors.text, textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 14, color: Colors.textMuted, textAlign: 'center', marginBottom: 24 },

  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 20,
    marginBottom: 16,
  },
  cardHighlight: {
    borderColor: Colors.primary,
    borderWidth: 2,
    shadowColor: Colors.primary,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },

  popularBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryBg,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 12,
  },
  popularBadgeText: { fontSize: 12, fontWeight: '700', color: Colors.primary },

  cardHeader: { marginBottom: 16 },
  planName: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  planNameHighlight: { color: Colors.primaryDark },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  price: { fontSize: 32, fontWeight: '800', color: Colors.text },
  priceHighlight: { color: Colors.primary },
  pricePeriod: { fontSize: 14, color: Colors.textMuted },
  limit: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },

  featureList: { gap: 10, marginBottom: 20 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 14, color: Colors.text, flex: 1 },

  subscribeBtn: {
    backgroundColor: Colors.text,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  subscribeBtnHighlight: { backgroundColor: Colors.primary },
  subscribeBtnDisabled: { backgroundColor: Colors.border },
  subscribeBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },

  disclaimer: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
});
