import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, Users, TrendingUp, AlertCircle, Pencil, Trash2, CheckCircle } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { AddExpenseDialog } from "@/components/AddExpenseDialog";
import { EditExpenseDialog } from "@/components/EditExpenseDialog";
import { ConfirmPaymentDialog } from "@/components/ConfirmPaymentDialog";
import { PaymentStatusBadge } from "@/components/PaymentStatusBadge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, parse, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Student = Database["public"]["Tables"]["students"]["Row"];
type Expense = Database["public"]["Tables"]["expenses"]["Row"];
type Payment = Database["public"]["Tables"]["student_payments"]["Row"];

const Financial = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [confirmingPayment, setConfirmingPayment] = useState<any>(null);
  const { toast } = useToast();

  // Gerar lista dos últimos 12 meses
  const getMonthOptions = () => {
    const months = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push({
        value: format(date, 'yyyy-MM'),
        label: format(date, 'MMMM yyyy', { locale: ptBR }),
      });
    }
    return months;
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (students.length > 0) {
      fetchPaymentsAndGenerate();
    }
  }, [selectedMonth, students]);

  const fetchData = async () => {
    try {
      const [studentsResult, expensesResult] = await Promise.all([
        supabase.from("students").select("*").order("name"),
        supabase.from("expenses").select("*").order("expense_date", { ascending: false }),
      ]);

      if (studentsResult.error) throw studentsResult.error;
      if (expensesResult.error) throw expensesResult.error;

      setStudents(studentsResult.data || []);
      setExpenses(expensesResult.data || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentsAndGenerate = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      // Buscar pagamentos do mês
      const { data: existingPayments, error: fetchError } = await supabase
        .from("student_payments")
        .select("*")
        .eq("reference_month", selectedMonth);

      if (fetchError) throw fetchError;

      // Alunos ativos no mês selecionado
      const selectedDate = parse(selectedMonth + '-01', 'yyyy-MM-dd', new Date());
      const activeStudentsInMonth = students.filter(s => {
        if (s.status !== "active") return false;
        const startDate = new Date(s.class_start_date);
        return startDate <= selectedDate;
      });

      // Criar pagamentos pendentes para alunos sem registro
      const studentsWithPayment = new Set(existingPayments?.map(p => p.student_id) || []);
      const paymentsToCreate = activeStudentsInMonth
        .filter(student => !studentsWithPayment.has(student.id))
        .map(student => ({
          student_id: student.id,
          user_id: user.user.id,
          reference_month: selectedMonth,
          payment_status: 'pending',
          amount_expected: student.monthly_fee,
          amount_paid: 0,
        }));

      if (paymentsToCreate.length > 0) {
        const { error: insertError } = await supabase
          .from("student_payments")
          .insert(paymentsToCreate);

        if (insertError) throw insertError;
      }

      // Buscar todos os pagamentos novamente
      const { data: allPayments, error: refetchError } = await supabase
        .from("student_payments")
        .select("*")
        .eq("reference_month", selectedMonth);

      if (refetchError) throw refetchError;

      setPayments(allPayments || []);
    } catch (error) {
      console.error("Erro ao carregar pagamentos:", error);
    }
  };

  const handleDeleteExpense = async () => {
    if (!deletingExpenseId) return;

    try {
      const { error } = await supabase
        .from("expenses")
        .delete()
        .eq("id", deletingExpenseId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Despesa excluída com sucesso!",
      });

      fetchData();
    } catch (error) {
      console.error("Erro ao excluir despesa:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir despesa",
        variant: "destructive",
      });
    } finally {
      setDeletingExpenseId(null);
    }
  };

  // Filtrar despesas pelo mês selecionado
  const filteredExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.expense_date);
    const expenseMonth = format(expenseDate, 'yyyy-MM');
    return expenseMonth === selectedMonth;
  });

  // Filtrar alunos ativos que já começaram no mês selecionado ou antes
  const activeStudentsInMonth = students.filter(s => {
    if (s.status !== "active") return false;
    
    const startDate = new Date(s.class_start_date);
    const selectedDate = parse(selectedMonth + '-01', 'yyyy-MM-dd', new Date());
    
    // Aluno deve ter começado no mês selecionado ou antes
    return startDate <= selectedDate;
  });

  const activeStudents = students.filter(s => s.status === "active");
  
  // Calcular faturamento baseado apenas em pagamentos confirmados
  const paidPayments = payments.filter(p => p.payment_status === 'paid');
  const pendingPayments = payments.filter(p => p.payment_status === 'pending');
  
  const totalRevenuePaid = paidPayments.reduce((sum, payment) => {
    const amount = typeof payment.amount_paid === 'number' ? payment.amount_paid : 0;
    return sum + amount;
  }, 0);
  
  const totalRevenuePending = pendingPayments.reduce((sum, payment) => {
    const amount = typeof payment.amount_expected === 'number' ? payment.amount_expected : 0;
    return sum + amount;
  }, 0);
  
  const totalRevenueExpected = totalRevenuePaid + totalRevenuePending;
  
  const totalExpenses = filteredExpenses.reduce((sum, expense) => {
    const amount = typeof expense.amount === 'number' ? expense.amount : 0;
    return sum + amount;
  }, 0);
  const netProfit = totalRevenuePaid - totalExpenses;
  const averageRevenue = paidPayments.length > 0 ? totalRevenuePaid / paidPayments.length : 0;

  const selectedMonthLabel = format(parse(selectedMonth, 'yyyy-MM', new Date()), 'MMMM yyyy', { locale: ptBR });

  // Calcular dados mensais para o gráfico (últimos 12 meses)
  const getMonthlyData = () => {
    const data = [];
    const today = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const monthDate = subMonths(today, i);
      const monthKey = format(monthDate, 'yyyy-MM');
      const monthLabel = format(monthDate, 'MMM/yy', { locale: ptBR });
      
      // Filtrar despesas do mês
      const monthExpenses = expenses.filter(expense => {
        const expenseMonth = format(new Date(expense.expense_date), 'yyyy-MM');
        return expenseMonth === monthKey;
      });
      
      const totalExpensesMonth = monthExpenses.reduce((sum, expense) => {
        return sum + (typeof expense.amount === 'number' ? expense.amount : 0);
      }, 0);
      
      // Filtrar alunos que já começaram neste mês
      const monthActiveStudents = students.filter(s => {
        if (s.status !== "active") return false;
        const startDate = new Date(s.class_start_date);
        return startDate <= monthDate;
      });
      
      // Faturamento é a soma das mensalidades dos alunos ativos no mês
      const revenue = monthActiveStudents.reduce((sum, student) => {
        const fee = typeof student.monthly_fee === 'number' ? student.monthly_fee : 0;
        return sum + fee;
      }, 0);
      const profit = revenue - totalExpensesMonth;
      
      data.push({
        month: monthLabel,
        faturamento: revenue,
        despesas: totalExpensesMonth,
        lucro: profit,
      });
    }
    
    return data;
  };

  const monthlyData = getMonthlyData();

  // Calcular totais anuais
  const totalAnualFaturamento = monthlyData.reduce((sum, month) => sum + month.faturamento, 0);
  const totalAnualDespesas = monthlyData.reduce((sum, month) => sum + month.despesas, 0);
  const totalAnualLucro = monthlyData.reduce((sum, month) => sum + month.lucro, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Financeiro - {selectedMonthLabel.charAt(0).toUpperCase() + selectedMonthLabel.slice(1)}
              </h1>
              <p className="text-muted-foreground">Visualização do faturamento mensal</p>
            </div>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecione o mês" />
              </SelectTrigger>
              <SelectContent>
                {getMonthOptions().map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label.charAt(0).toUpperCase() + month.label.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Carregando...</div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Faturamento Recebido</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(totalRevenuePaid)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {paidPayments.length} pagamento{paidPayments.length !== 1 ? 's' : ''} confirmado{paidPayments.length !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Faturamento Pendente</CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(totalRevenuePending)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {pendingPayments.length} pagamento{pendingPayments.length !== 1 ? 's' : ''} pendente{pendingPayments.length !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Esperado</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(totalRevenueExpected)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    De {payments.length} aluno{payments.length !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Despesas Totais</CardTitle>
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(totalExpenses)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    No período
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(netProfit)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Recebido - Despesas
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Controle de Mensalidades</CardTitle>
                <CardDescription>Status de pagamento dos alunos no mês selecionado</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {payments.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum aluno ativo neste mês
                    </p>
                  ) : (
                    <div className="divide-y">
                      {payments.map((payment) => {
                        const student = students.find(s => s.id === payment.student_id);
                        if (!student) return null;

                        const expectedAmount = typeof payment.amount_expected === 'number' ? payment.amount_expected : 0;
                        const paidAmount = typeof payment.amount_paid === 'number' ? payment.amount_paid : 0;

                        return (
                          <div key={payment.id} className="flex items-center justify-between py-4">
                            <div className="flex-1">
                              <p className="font-medium">{student.name}</p>
                              <div className="flex gap-2 items-center text-sm text-muted-foreground mt-1">
                                <span>{student.level}</span>
                                {payment.payment_date && (
                                  <>
                                    <span>•</span>
                                    <span>Pago em {new Date(payment.payment_date).toLocaleDateString('pt-BR')}</span>
                                  </>
                                )}
                                {payment.payment_method && (
                                  <>
                                    <span>•</span>
                                    <span className="capitalize">{payment.payment_method}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="font-semibold">
                                  {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL'
                                  }).format(payment.payment_status === 'paid' ? paidAmount : expectedAmount)}
                                </p>
                              </div>
                              <PaymentStatusBadge status={payment.payment_status as any} />
                              {payment.payment_status === 'pending' && (
                                <Button
                                  size="sm"
                                  onClick={() => setConfirmingPayment({
                                    id: payment.id,
                                    student_name: student.name,
                                    amount_expected: expectedAmount,
                                    reference_month: payment.reference_month,
                                  })}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Confirmar
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Despesas</CardTitle>
                  <CardDescription>Controle de despesas mensais</CardDescription>
                </div>
                <AddExpenseDialog onExpenseAdded={fetchData} />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredExpenses.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma despesa cadastrada neste mês
                    </p>
                  ) : (
                    <div className="divide-y">
                      {filteredExpenses.map((expense) => {
                        const amount = typeof expense.amount === 'number' ? expense.amount : 0;
                        return (
                          <div key={expense.id} className="flex items-center justify-between py-4">
                            <div className="flex-1">
                              <p className="font-medium">{expense.description}</p>
                              <div className="flex gap-2 text-sm text-muted-foreground">
                                {expense.category && <span>{expense.category}</span>}
                                <span>•</span>
                                <span>{new Date(expense.expense_date).toLocaleDateString('pt-BR')}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <p className="font-semibold text-destructive">
                                {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL'
                                }).format(amount)}
                              </p>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setEditingExpense(expense)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeletingExpenseId(expense.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Evolução Anual</CardTitle>
                <CardDescription>Comparativo mensal de faturamento, despesas e lucro líquido</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      style={{ fontSize: '12px' }}
                      tickFormatter={(value) => 
                        new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        }).format(value)
                      }
                    />
                    <Tooltip 
                      formatter={(value: number) =>
                        new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(value)
                      }
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="faturamento" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Faturamento"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="despesas" 
                      stroke="hsl(var(--destructive))" 
                      strokeWidth={2}
                      name="Despesas"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="lucro" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Lucro Líquido"
                    />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-6 pt-4 border-t grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Faturamento</p>
                    <p className="text-lg font-semibold text-primary">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(totalAnualFaturamento)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Despesas</p>
                    <p className="text-lg font-semibold text-destructive">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(totalAnualDespesas)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Lucro Líquido</p>
                    <p className={`text-lg font-semibold ${totalAnualLucro >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(totalAnualLucro)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {editingExpense && (
              <EditExpenseDialog
                expense={editingExpense}
                open={!!editingExpense}
                onOpenChange={(open) => !open && setEditingExpense(null)}
                onExpenseUpdated={fetchData}
              />
            )}

            {confirmingPayment && (
              <ConfirmPaymentDialog
                open={!!confirmingPayment}
                onOpenChange={(open) => !open && setConfirmingPayment(null)}
                payment={confirmingPayment}
                onSuccess={fetchPaymentsAndGenerate}
              />
            )}

            <AlertDialog open={!!deletingExpenseId} onOpenChange={(open) => !open && setDeletingExpenseId(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir despesa?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. A despesa será permanentemente removida.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteExpense}>
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </main>
    </div>
  );
};

export default Financial;
