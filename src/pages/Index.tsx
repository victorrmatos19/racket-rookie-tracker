import { StudentCard } from "@/components/StudentCard";
import { StatsCard } from "@/components/StatsCard";
import { Users, TrendingUp, Calendar, Award, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { signOut, user } = useAuth();
  
  const students = [
    {
      name: "João Silva",
      level: "Intermediário",
      progress: 75,
      nextClass: "15 Jan, 14:00",
      status: "improving" as const,
    },
    {
      name: "Maria Santos",
      level: "Avançado",
      progress: 90,
      nextClass: "16 Jan, 10:00",
      status: "active" as const,
    },
    {
      name: "Pedro Costa",
      level: "Iniciante",
      progress: 45,
      nextClass: "17 Jan, 16:00",
      status: "active" as const,
    },
    {
      name: "Ana Oliveira",
      level: "Intermediário",
      progress: 60,
      nextClass: "18 Jan, 09:00",
      status: "improving" as const,
    },
    {
      name: "Carlos Ferreira",
      level: "Iniciante",
      progress: 30,
      nextClass: "19 Jan, 15:00",
      status: "inactive" as const,
    },
    {
      name: "Juliana Lima",
      level: "Avançado",
      progress: 85,
      nextClass: "20 Jan, 11:00",
      status: "active" as const,
    },
  ];

  const stats = [
    {
      title: "Total de Alunos",
      value: students.length,
      icon: Users,
      trend: "+2 este mês",
    },
    {
      title: "Progresso Médio",
      value: "64%",
      icon: TrendingUp,
      trend: "+8% vs mês anterior",
    },
    {
      title: "Aulas Agendadas",
      value: "12",
      icon: Calendar,
      trend: "Esta semana",
    },
    {
      title: "Alunos Evoluindo",
      value: "4",
      icon: Award,
      trend: "67% do total",
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
            <span className="text-sm text-muted-foreground">
              {students.length} alunos cadastrados
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {students.map((student, index) => (
              <StudentCard
                key={index}
                name={student.name}
                level={student.level}
                progress={student.progress}
                nextClass={student.nextClass}
                status={student.status}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
