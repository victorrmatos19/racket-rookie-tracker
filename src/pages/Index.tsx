import { StudentCard } from "@/components/StudentCard";
import { StatsCard } from "@/components/StatsCard";
import { AddStudentDialog } from "@/components/AddStudentDialog";
import { Users, TrendingUp, Calendar, Award, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar alunos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const avgProgress = students.length > 0
    ? Math.round(students.reduce((acc, s) => acc + s.progress, 0) / students.length)
    : 0;

  const activeStudents = students.filter((s) => s.status === "active").length;

  const stats = [
    {
      title: "Total de Alunos",
      value: students.length,
      icon: Users,
      trend: `${students.length} cadastrados`,
    },
    {
      title: "Progresso Médio",
      value: `${avgProgress}%`,
      icon: TrendingUp,
      trend: "Média geral",
    },
    {
      title: "Alunos Ativos",
      value: activeStudents,
      icon: Calendar,
      trend: `${students.length > 0 ? Math.round((activeStudents / students.length) * 100) : 0}% do total`,
    },
    {
      title: "Conclusão",
      value: `${students.filter((s) => s.progress >= 80).length}`,
      icon: Award,
      trend: "Acima de 80%",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                TennisCoach Pro
              </h1>
              <p className="text-muted-foreground">
                Gerencie seus alunos e acompanhe a evolução
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user?.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={signOut}
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <StatsCard
              key={index}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              trend={stat.trend}
            />
          ))}
        </div>

        {/* Students Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Meus Alunos</h2>
            <AddStudentDialog onStudentAdded={fetchStudents} />
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando alunos...
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg mb-2">Nenhum aluno cadastrado ainda</p>
              <p className="text-sm">Clique em "Adicionar Aluno" para começar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {students.map((student) => (
                <StudentCard
                  key={student.id}
                  name={student.name}
                  level={student.level}
                  progress={student.progress}
                  nextClass={student.next_class}
                  status={student.status}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
