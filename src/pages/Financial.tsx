import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, Users, TrendingUp, AlertCircle, Pencil, Trash2 } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { AddExpenseDialog } from "@/components/AddExpenseDialog";
import { EditExpenseDialog } from "@/components/EditExpenseDialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
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

const Financial = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
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

  const activeStudents = students.filter(s => s.status === "active");
  const totalRevenue = activeStudents.reduce((sum, student) => {
    const fee = typeof student.monthly_fee === 'number' ? student.monthly_fee : 0;
    return sum + fee;
  }, 0);
  const totalExpenses = filteredExpenses.reduce((sum, expense) => {
    const amount = typeof expense.amount === 'number' ? expense.amount : 0;
    return sum + amount;
  }, 0);
  const netProfit = totalRevenue - totalExpenses;
  const averageRevenue = activeStudents.length > 0 ? totalRevenue / activeStudents.length : 0;

  const selectedMonthLabel = format(new Date(selectedMonth + '-01'), 'MMMM yyyy', { locale: ptBR });

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
                  <CardTitle className="text-sm font-medium">Faturamento Mensal</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(totalRevenue)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    De {activeStudents.length} aluno{activeStudents.length !== 1 ? 's' : ''} ativo{activeStudents.length !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Alunos Ativos</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeStudents.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    De {students.length} total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(averageRevenue)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Por aluno ativo
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
            </div>

            <Card className="mb-8">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">Lucro Líquido</CardTitle>
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(netProfit)}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Faturamento - Despesas
                </p>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Detalhamento por Aluno</CardTitle>
                  <CardDescription>Valores mensais de cada aluno ativo</CardDescription>
                </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeStudents.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum aluno ativo encontrado
                    </p>
                  ) : (
                    <div className="divide-y">
                      {activeStudents.map((student) => {
                        const fee = typeof student.monthly_fee === 'number' ? student.monthly_fee : 0;
                        return (
                          <div key={student.id} className="flex items-center justify-between py-4">
                            <div>
                              <p className="font-medium">{student.name}</p>
                              <p className="text-sm text-muted-foreground">{student.level}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">
                                {new Intl.NumberFormat('pt-BR', {
                                  style: 'currency',
                                  currency: 'BRL'
                                }).format(fee)}
                              </p>
                              <p className="text-xs text-muted-foreground">por mês</p>
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
            </div>

            {editingExpense && (
              <EditExpenseDialog
                expense={editingExpense}
                open={!!editingExpense}
                onOpenChange={(open) => !open && setEditingExpense(null)}
                onExpenseUpdated={fetchData}
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
