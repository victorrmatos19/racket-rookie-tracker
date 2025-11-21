import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, Users, TrendingUp } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

type Student = Database["public"]["Tables"]["students"]["Row"];

const Financial = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .order("name");

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error("Erro ao carregar alunos:", error);
    } finally {
      setLoading(false);
    }
  };

  const activeStudents = students.filter(s => s.status === "active");
  const totalRevenue = activeStudents.reduce((sum, student) => {
    const fee = typeof student.monthly_fee === 'number' ? student.monthly_fee : 0;
    return sum + fee;
  }, 0);
  const averageRevenue = activeStudents.length > 0 ? totalRevenue / activeStudents.length : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Financeiro</h1>
          <p className="text-muted-foreground">Visualização do faturamento mensal</p>
        </div>

        {loading ? (
          <div className="text-center py-8">Carregando...</div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-3 mb-8">
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
            </div>

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
          </>
        )}
      </main>
    </div>
  );
};

export default Financial;
