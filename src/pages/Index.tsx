import { StudentCard } from "@/components/StudentCard";
import { StatsCard } from "@/components/StatsCard";
import { AddStudentDialog } from "@/components/AddStudentDialog";
import { Header } from "@/components/Header";
import { Users, TrendingUp, Calendar, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
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
      <Header />

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
                  id={student.id}
                  name={student.name}
                  level={student.level}
                  progress={student.progress}
                  classDays={student.class_days || []}
                  classTime={student.class_time || ""}
                  status={student.status}
                  onDelete={fetchStudents}
                  forehandProgress={student.forehand_progress}
                  backhandProgress={student.backhand_progress}
                  serveProgress={student.serve_progress}
                  volleyProgress={student.volley_progress}
                  sliceProgress={student.slice_progress}
                  physicalProgress={student.physical_progress}
                  tacticalProgress={student.tactical_progress}
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
