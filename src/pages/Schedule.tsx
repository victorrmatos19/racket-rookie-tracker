import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Student {
  id: string;
  name: string;
  level: string;
  class_days: string[];
  class_time: string;
  status: string;
}

interface ClassSchedule {
  day: string;
  dayLabel: string;
  classes: {
    time: string;
    students: Student[];
  }[];
}

const WEEK_DAYS = [
  { id: "segunda", label: "Segunda-feira" },
  { id: "terca", label: "Terça-feira" },
  { id: "quarta", label: "Quarta-feira" },
  { id: "quinta", label: "Quinta-feira" },
  { id: "sexta", label: "Sexta-feira" },
  { id: "sabado", label: "Sábado" },
  { id: "domingo", label: "Domingo" },
];

const Schedule = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("status", "active")
        .not("class_days", "is", null)
        .not("class_time", "is", null);

      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar cronograma",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const organizeSchedule = (): ClassSchedule[] => {
    const schedule: ClassSchedule[] = WEEK_DAYS.map((day) => ({
      day: day.id,
      dayLabel: day.label,
      classes: [],
    }));

    students.forEach((student) => {
      if (!student.class_days || !student.class_time) return;

      student.class_days.forEach((day) => {
        const daySchedule = schedule.find((s) => s.day === day);
        if (!daySchedule) return;

        let timeSlot = daySchedule.classes.find(
          (c) => c.time === student.class_time
        );

        if (!timeSlot) {
          timeSlot = { time: student.class_time, students: [] };
          daySchedule.classes.push(timeSlot);
        }

        timeSlot.students.push(student);
      });
    });

    // Ordenar horários dentro de cada dia
    schedule.forEach((day) => {
      day.classes.sort((a, b) => a.time.localeCompare(b.time));
    });

    return schedule;
  };

  const weekSchedule = organizeSchedule();
  const totalClasses = weekSchedule.reduce(
    (acc, day) => acc + day.classes.length,
    0
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Carregando cronograma...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            Cronograma Semanal
          </h1>
          <p className="text-muted-foreground">
            Visualize todas as aulas agendadas na semana
          </p>
          <div className="flex gap-4 mt-4">
            <Badge variant="outline" className="gap-2">
              <Calendar className="w-4 h-4" />
              {totalClasses} aulas por semana
            </Badge>
            <Badge variant="outline" className="gap-2">
              <User className="w-4 h-4" />
              {students.length} alunos ativos
            </Badge>
          </div>
        </div>

        {students.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">Nenhuma aula agendada</p>
              <p className="text-sm text-muted-foreground">
                Cadastre alunos com horários para ver o cronograma
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {weekSchedule.map((day) => (
              <Card key={day.day} className="overflow-hidden">
                <CardHeader className="bg-muted/50">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {day.dayLabel}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {day.classes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Sem aulas agendadas
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {day.classes.map((classSlot, idx) => (
                        <div
                          key={idx}
                          className="border border-border/50 rounded-lg p-3 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                            <Clock className="w-4 h-4 text-primary" />
                            {classSlot.time}
                          </div>
                          <div className="space-y-2">
                            {classSlot.students.map((student) => (
                              <div
                                key={student.id}
                                className="flex items-center justify-between text-sm bg-muted/30 rounded px-2 py-1.5 hover:bg-muted/50 transition-colors cursor-pointer"
                                onClick={() => navigate(`/?studentId=${student.id}`)}
                              >
                                <span className="font-medium">
                                  {student.name}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  {student.level}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Schedule;
