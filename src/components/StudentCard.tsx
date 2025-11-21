import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Calendar, TrendingUp, Trophy, Trash2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StudentCardProps {
  id: string;
  name: string;
  level: string;
  progress: number;
  classDays: string[];
  classTime: string;
  status: "active" | "inactive" | "improving" | "pending";
  onDelete?: () => void;
  forehandProgress?: number;
  backhandProgress?: number;
  serveProgress?: number;
  volleyProgress?: number;
  sliceProgress?: number;
  physicalProgress?: number;
  tacticalProgress?: number;
}

const DAYS_MAP: Record<string, string> = {
  segunda: "Seg",
  terca: "Ter",
  quarta: "Qua",
  quinta: "Qui",
  sexta: "Sex",
  sabado: "Sáb",
  domingo: "Dom",
};

const statusConfig = {
  active: { label: "Ativo", variant: "default" as const },
  inactive: { label: "Inativo", variant: "secondary" as const },
  improving: { label: "Evoluindo", variant: "default" as const },
  pending: { label: "Pendente", variant: "secondary" as const },
};

const TENNIS_SKILLS = [
  { id: "forehand", label: "Forehand", key: "forehandProgress" },
  { id: "backhand", label: "Backhand", key: "backhandProgress" },
  { id: "serve", label: "Saque", key: "serveProgress" },
  { id: "volley", label: "Vôlei", key: "volleyProgress" },
  { id: "slice", label: "Slice", key: "sliceProgress" },
  { id: "physical", label: "Físico", key: "physicalProgress" },
  { id: "tactical", label: "Tático", key: "tacticalProgress" },
];

export const StudentCard = ({ 
  id, 
  name, 
  level, 
  progress, 
  classDays, 
  classTime, 
  status, 
  onDelete,
  forehandProgress = 0,
  backhandProgress = 0,
  serveProgress = 0,
  volleyProgress = 0,
  sliceProgress = 0,
  physicalProgress = 0,
  tacticalProgress = 0,
}: StudentCardProps) => {
  const statusInfo = statusConfig[status];
  const daysLabel = classDays.map((day) => DAYS_MAP[day] || day).join(", ");
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const skillsProgress = {
    forehandProgress,
    backhandProgress,
    serveProgress,
    volleyProgress,
    sliceProgress,
    physicalProgress,
    tacticalProgress,
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.from("students").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Aluno excluído",
        description: "O aluno foi removido com sucesso",
      });

      onDelete?.();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir aluno",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-xl font-semibold text-card-foreground group-hover:text-primary transition-colors">
              {name}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Trophy className="w-4 h-4" />
              <span>{level}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={statusInfo.variant} className="font-medium">
              {statusInfo.label}
            </Badge>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir o aluno <strong>{name}</strong>? 
                    Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm pb-2 border-b border-border/50">
            <span className="text-muted-foreground flex items-center gap-1 font-medium">
              <TrendingUp className="w-4 h-4" />
              Habilidades
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {TENNIS_SKILLS.map((skill) => {
              const skillProgress = skillsProgress[skill.key as keyof typeof skillsProgress];
              return (
                <div key={skill.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{skill.label}</span>
                    <span className="font-semibold text-primary">{skillProgress}%</span>
                  </div>
                  <Progress value={skillProgress} className="h-1.5" />
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border/50">
          <Calendar className="w-4 h-4" />
          <div className="flex flex-col gap-1">
            {classDays.length > 0 ? (
              <>
                <span className="font-medium">{daysLabel}</span>
                <span>{classTime}</span>
              </>
            ) : (
              <span>Sem aulas agendadas</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
