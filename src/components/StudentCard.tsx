import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, TrendingUp, Trophy } from "lucide-react";

interface StudentCardProps {
  name: string;
  level: string;
  progress: number;
  nextClass: string;
  status: "active" | "inactive" | "improving";
}

const statusConfig = {
  active: { label: "Ativo", variant: "default" as const },
  inactive: { label: "Inativo", variant: "secondary" as const },
  improving: { label: "Evoluindo", variant: "default" as const },
};

export const StudentCard = ({ name, level, progress, nextClass, status }: StudentCardProps) => {
  const statusInfo = statusConfig[status];

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-semibold text-card-foreground group-hover:text-primary transition-colors">
              {name}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Trophy className="w-4 h-4" />
              <span>{level}</span>
            </div>
          </div>
          <Badge variant={statusInfo.variant} className="font-medium">
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              Progresso
            </span>
            <span className="font-semibold text-primary">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border/50">
          <Calendar className="w-4 h-4" />
          <span>Próxima aula: {nextClass}</span>
        </div>
      </CardContent>
    </Card>
  );
};
