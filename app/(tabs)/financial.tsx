import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { Student, Expense, Payment } from '@/types/database';
import { AddExpenseModal } from '@/components/AddExpenseModal';
import { EditExpenseModal } from '@/components/EditExpenseModal';
import { ConfirmPaymentModal } from '@/components/ConfirmPaymentModal';
import { PaymentStatusBadge } from '@/components/PaymentStatusBadge';
import Toast from 'react-native-toast-message';
import { format, parse, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width - 32;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const getMonthOptions = () => {
  const months = [];
  const today = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push({
      value: format(d, 'yyyy-MM'),
      label: format(d, 'MMMM yyyy', { locale: ptBR }),
    });
  }
  return months;
};

export default function FinancialScreen() {
  const [students, setStudents] = useState<Student[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const [addExpenseVisible, setAddExpenseVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [confirmingPayment, setConfirmingPayment] = useState<any>(null);

  const fetchData = useCallback(async () => {
    try {
      const [studentsRes, expensesRes] = await Promise.all([
        supabase.from('students').select('*').order('name'),
        supabase.from('expenses').select('*').order('expense_date', { ascending: false }),
      ]);
      if (studentsRes.error) throw studentsRes.error;
      if (expensesRes.error) throw expensesRes.error;
      setStudents(studentsRes.data ?? []);
      setExpenses(expensesRes.data ?? []);
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Erro ao carregar dados', text2: err.message });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchPayments = useCallback(async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data: existing } = await supabase
        .from('student_payments')
        .select('*')
        .eq('reference_month', selectedMonth);

      const selectedDate = parse(selectedMonth + '-01', 'yyyy-MM-dd', new Date());
      const activeStudents = students.filter((s) => {
        if (s.status !== 'active') return false;
        return new Date(s.class_start_date) <= selectedDate;
      });

      const withPayment = new Set((existing ?? []).map((p) => p.student_id));
      const toCreate = activeStudents
        .filter((s) => !withPayment.has(s.id))
        .map((s) => ({
          student_id: s.id,
          user_id: user.user!.id,
          reference_month: selectedMonth,
          payment_status: 'pending',
          amount_expected: s.monthly_fee,
          amount_paid: 0,
        }));

      if (toCreate.length > 0) {
        await supabase.from('student_payments').insert(toCreate);
      }

      const { data: allPayments } = await supabase
        .from('student_payments')
        .select('*')
        .eq('reference_month', selectedMonth);

      setPayments(allPayments ?? []);
    } catch (err) {
      console.error('Error fetching payments:', err);
    }
  }, [selectedMonth, students]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (students.length > 0) fetchPayments();
  }, [fetchPayments, students]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Filtered expenses for selected month
  const filteredExpenses = expenses.filter(
    (e) => format(new Date(e.expense_date), 'yyyy-MM') === selectedMonth
  );

  const paidPayments = payments.filter((p) => p.payment_status === 'paid');
  const pendingPayments = payments.filter((p) => p.payment_status === 'pending');

  const totalPaid = paidPayments.reduce((sum, p) => sum + (p.amount_paid ?? 0), 0);
  const totalPending = pendingPayments.reduce((sum, p) => sum + (p.amount_expected ?? 0), 0);
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalPaid - totalExpenses;

  const selectedMonthLabel = format(parse(selectedMonth, 'yyyy-MM', new Date()), 'MMMM yyyy', { locale: ptBR });

  // Chart data — last 12 months
  const monthlyData = (() => {
    const today = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = subMonths(today, 11 - i);
      const key = format(d, 'yyyy-MM');
      const label = format(d, 'MMM', { locale: ptBR });
      const monthExpenses = expenses
        .filter((e) => format(new Date(e.expense_date), 'yyyy-MM') === key)
        .reduce((sum, e) => sum + e.amount, 0);
      const monthRevenue = students
        .filter((s) => s.status === 'active' && new Date(s.class_start_date) <= d)
        .reduce((sum, s) => sum + s.monthly_fee, 0);
      return { label, revenue: monthRevenue, expenses: monthExpenses, profit: monthRevenue - monthExpenses };
    });
  })();

  const handleDeleteExpense = (id: string) => {
    Alert.alert('Excluir despesa?', 'Esta ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('expenses').delete().eq('id', id);
          if (error) {
            Toast.show({ type: 'error', text1: 'Erro ao excluir despesa' });
          } else {
            Toast.show({ type: 'success', text1: 'Despesa excluída!' });
            fetchData();
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const monthOptions = getMonthOptions();

  return (
    <>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <View style={styles.inner}>
          {/* Month selector */}
          <TouchableOpacity
            style={styles.monthSelector}
            onPress={() => setShowMonthPicker(!showMonthPicker)}
          >
            <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
            <Text style={styles.monthSelectorText}>
              {selectedMonthLabel.charAt(0).toUpperCase() + selectedMonthLabel.slice(1)}
            </Text>
            <Ionicons
              name={showMonthPicker ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={Colors.primary}
            />
          </TouchableOpacity>

          {showMonthPicker && (
            <View style={styles.monthList}>
              {monthOptions.map((m) => (
                <TouchableOpacity
                  key={m.value}
                  style={[styles.monthOption, m.value === selectedMonth && styles.monthOptionActive]}
                  onPress={() => {
                    setSelectedMonth(m.value);
                    setShowMonthPicker(false);
                  }}
                >
                  <Text style={[styles.monthOptionText, m.value === selectedMonth && styles.monthOptionTextActive]}>
                    {m.label.charAt(0).toUpperCase() + m.label.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Stats cards */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, styles.statCardGreen]}>
              <Text style={styles.statLabel}>Recebido</Text>
              <Text style={[styles.statValue, { color: Colors.primary }]}>{formatCurrency(totalPaid)}</Text>
              <Text style={styles.statSub}>{paidPayments.length} pagamento(s)</Text>
            </View>
            <View style={[styles.statCard, styles.statCardYellow]}>
              <Text style={styles.statLabel}>Pendente</Text>
              <Text style={[styles.statValue, { color: Colors.warningDark }]}>{formatCurrency(totalPending)}</Text>
              <Text style={styles.statSub}>{pendingPayments.length} pendente(s)</Text>
            </View>
            <View style={[styles.statCard, styles.statCardRed]}>
              <Text style={styles.statLabel}>Despesas</Text>
              <Text style={[styles.statValue, { color: Colors.danger }]}>{formatCurrency(totalExpenses)}</Text>
              <Text style={styles.statSub}>No período</Text>
            </View>
            <View style={[styles.statCard, netProfit >= 0 ? styles.statCardGreen : styles.statCardRed]}>
              <Text style={styles.statLabel}>Lucro Líquido</Text>
              <Text style={[styles.statValue, { color: netProfit >= 0 ? Colors.primary : Colors.danger }]}>
                {formatCurrency(netProfit)}
              </Text>
              <Text style={styles.statSub}>Recebido - Despesas</Text>
            </View>
          </View>

          {/* Expenses Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Despesas</Text>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => setAddExpenseVisible(true)}
              >
                <Ionicons name="add" size={16} color={Colors.white} />
                <Text style={styles.addBtnText}>Adicionar</Text>
              </TouchableOpacity>
            </View>

            {filteredExpenses.length === 0 ? (
              <Text style={styles.emptyText}>Nenhuma despesa cadastrada neste mês</Text>
            ) : (
              filteredExpenses.map((expense) => (
                <View key={expense.id} style={styles.expenseRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.expenseName}>{expense.description}</Text>
                    <Text style={styles.expenseMeta}>
                      {expense.category ? `${expense.category} • ` : ''}
                      {new Date(expense.expense_date).toLocaleDateString('pt-BR')}
                    </Text>
                  </View>
                  <Text style={styles.expenseAmount}>{formatCurrency(expense.amount)}</Text>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => setEditingExpense(expense)}
                  >
                    <Ionicons name="pencil-outline" size={14} color={Colors.textMuted} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => handleDeleteExpense(expense.id)}
                  >
                    <Ionicons name="trash-outline" size={14} color={Colors.danger} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          {/* Chart */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Evolução Anual</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <LineChart
                data={{
                  labels: monthlyData.map((d) => d.label),
                  datasets: [
                    {
                      data: monthlyData.map((d) => d.revenue),
                      color: () => Colors.primary,
                      strokeWidth: 2,
                    },
                    {
                      data: monthlyData.map((d) => d.expenses),
                      color: () => Colors.danger,
                      strokeWidth: 2,
                    },
                    {
                      data: monthlyData.map((d) => d.profit),
                      color: () => Colors.info,
                      strokeWidth: 2,
                    },
                  ],
                  legend: ['Faturamento', 'Despesas', 'Lucro'],
                }}
                width={Math.max(screenWidth, 400)}
                height={220}
                chartConfig={{
                  backgroundColor: Colors.card,
                  backgroundGradientFrom: Colors.card,
                  backgroundGradientTo: Colors.card,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0,0,0,${opacity})`,
                  labelColor: () => Colors.textMuted,
                  propsForDots: { r: '3' },
                }}
                bezier
                style={{ borderRadius: 8 }}
              />
            </ScrollView>
          </View>

          {/* Payments section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Controle de Mensalidades</Text>
            {payments.length === 0 ? (
              <Text style={styles.emptyText}>Nenhum aluno ativo neste mês</Text>
            ) : (
              payments.map((payment) => {
                const student = students.find((s) => s.id === payment.student_id);
                if (!student) return null;
                const amount =
                  payment.payment_status === 'paid'
                    ? (payment.amount_paid ?? 0)
                    : (payment.amount_expected ?? 0);

                return (
                  <View key={payment.id} style={styles.paymentRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.paymentName}>{student.name}</Text>
                      <Text style={styles.paymentMeta}>
                        {student.level}
                        {payment.payment_date
                          ? ` • Pago em ${new Date(payment.payment_date).toLocaleDateString('pt-BR')}`
                          : ''}
                        {payment.payment_method ? ` • ${payment.payment_method}` : ''}
                      </Text>
                    </View>
                    <View style={styles.paymentRight}>
                      <Text style={styles.paymentAmount}>{formatCurrency(amount)}</Text>
                      <PaymentStatusBadge status={payment.payment_status as any} />
                      {payment.payment_status === 'pending' && (
                        <TouchableOpacity
                          style={styles.confirmBtn}
                          onPress={() =>
                            setConfirmingPayment({
                              id: payment.id,
                              student_name: student.name,
                              amount_expected: payment.amount_expected,
                              reference_month: payment.reference_month,
                            })
                          }
                        >
                          <Ionicons name="checkmark-circle-outline" size={14} color={Colors.white} />
                          <Text style={styles.confirmBtnText}>Confirmar</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>

          <View style={{ height: 20 }} />
        </View>
      </ScrollView>

      <AddExpenseModal
        visible={addExpenseVisible}
        onClose={() => setAddExpenseVisible(false)}
        onAdded={fetchData}
      />
      {editingExpense && (
        <EditExpenseModal
          visible={!!editingExpense}
          onClose={() => setEditingExpense(null)}
          expense={editingExpense}
          onUpdated={() => {
            setEditingExpense(null);
            fetchData();
          }}
        />
      )}
      <ConfirmPaymentModal
        visible={!!confirmingPayment}
        onClose={() => setConfirmingPayment(null)}
        payment={confirmingPayment}
        onSuccess={() => {
          setConfirmingPayment(null);
          fetchPayments();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  inner: { padding: 16 },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primaryBg,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  monthSelectorText: { flex: 1, fontSize: 15, color: Colors.primary, fontWeight: '600' },
  monthList: {
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
    maxHeight: 200,
    overflow: 'scroll',
  },
  monthOption: {
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: Colors.muted,
  },
  monthOptionActive: { backgroundColor: Colors.primaryBg },
  monthOptionText: { fontSize: 14, color: Colors.text },
  monthOptionTextActive: { color: Colors.primary, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16, marginTop: 8 },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  statCardGreen: { backgroundColor: Colors.primaryBg, borderColor: Colors.primary + '30' },
  statCardYellow: { backgroundColor: Colors.warningBg, borderColor: Colors.warning + '40' },
  statCardRed: { backgroundColor: Colors.dangerBg, borderColor: Colors.danger + '30' },
  statLabel: { fontSize: 11, color: Colors.textMuted, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: '700', marginBottom: 2 },
  statSub: { fontSize: 11, color: Colors.textMuted },
  section: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
  emptyText: { color: Colors.textMuted, fontSize: 14, textAlign: 'center', paddingVertical: 16 },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.muted,
  },
  expenseName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  expenseMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  expenseAmount: { fontSize: 14, fontWeight: '700', color: Colors.danger },
  iconBtn: { padding: 6, borderRadius: 6, backgroundColor: Colors.muted },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.muted,
  },
  paymentName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  paymentMeta: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  paymentRight: { alignItems: 'flex-end', gap: 6 },
  paymentAmount: { fontSize: 14, fontWeight: '700', color: Colors.text },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  confirmBtnText: { color: Colors.white, fontSize: 12, fontWeight: '600' },
});
