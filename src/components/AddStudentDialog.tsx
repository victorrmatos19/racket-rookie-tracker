import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus } from "lucide-react";

const WEEK_DAYS = [
  { id: "segunda", label: "Segunda" },
  { id: "terca", label: "Terça" },
  { id: "quarta", label: "Quarta" },
  { id: "quinta", label: "Quinta" },
  { id: "sexta", label: "Sexta" },
  { id: "sabado", label: "Sábado" },
  { id: "domingo", label: "Domingo" },
];

const TENNIS_SKILLS = [
  { id: "forehand", label: "Forehand", icon: "🎾" },
  { id: "backhand", label: "Backhand", icon: "🎾" },
  { id: "serve", label: "Saque", icon: "🏓" },
  { id: "volley", label: "Vôlei", icon: "🏐" },
  { id: "slice", label: "Slice", icon: "🎯" },
  { id: "physical", label: "Físico", icon: "💪" },
  { id: "tactical", label: "Tático", icon: "🧠" },
];

export const AddStudentDialog = ({ onStudentAdded }: { onStudentAdded: () => void }) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    level: "",
    progress: "0",
    classDays: [] as string[],
    classTime: "",
    status: "active",
    monthlyFee: "",
    forehandProgress: 0,
    backhandProgress: 0,
    serveProgress: 0,
    volleyProgress: 0,
    sliceProgress: 0,
    physicalProgress: 0,
    tacticalProgress: 0,
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erro",
          description: "Você precisa estar autenticado",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("students").insert({
        user_id: user.id,
        name: formData.name,
        level: formData.level,
        progress: parseInt(formData.progress),
        class_days: formData.classDays,
        class_time: formData.classTime,
        status: formData.status,
        monthly_fee: parseFloat(formData.monthlyFee) || 0,
        forehand_progress: formData.forehandProgress,
        backhand_progress: formData.backhandProgress,
        serve_progress: formData.serveProgress,
        volley_progress: formData.volleyProgress,
        slice_progress: formData.sliceProgress,
        physical_progress: formData.physicalProgress,
        tactical_progress: formData.tacticalProgress,
      });

      if (error) throw error;

      toast({
        title: "Aluno cadastrado",
        description: "O aluno foi adicionado com sucesso",
      });

      setFormData({
        name: "",
        level: "",
        progress: "0",
        classDays: [],
        classTime: "",
        status: "active",
        monthlyFee: "",
        forehandProgress: 0,
        backhandProgress: 0,
        serveProgress: 0,
        volleyProgress: 0,
        sliceProgress: 0,
        physicalProgress: 0,
        tacticalProgress: 0,
      });
      setOpen(false);
      onStudentAdded();
    } catch (error: any) {
      toast({
        title: "Erro ao cadastrar aluno",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Aluno
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Aluno</DialogTitle>
          <DialogDescription>
            Preencha os dados do novo aluno
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="level">Nível</Label>
              <Select
                value={formData.level}
                onValueChange={(value) => setFormData({ ...formData, level: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o nível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Iniciante">Iniciante</SelectItem>
                  <SelectItem value="Intermediário">Intermediário</SelectItem>
                  <SelectItem value="Avançado">Avançado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4">
              <Label className="text-base font-semibold">Progresso por Habilidade</Label>
              <div className="space-y-4 bg-muted/30 p-4 rounded-lg">
                {TENNIS_SKILLS.map((skill) => {
                  const progressKey = `${skill.id}Progress` as keyof typeof formData;
                  const progressValue = formData[progressKey] as number;
                  
                  return (
                    <div key={skill.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={skill.id} className="text-sm font-medium flex items-center gap-2">
                          <span>{skill.icon}</span>
                          {skill.label}
                        </Label>
                        <span className="text-sm font-semibold text-primary">{progressValue}%</span>
                      </div>
                      <Slider
                        id={skill.id}
                        value={[progressValue]}
                        onValueChange={(value) =>
                          setFormData({ ...formData, [progressKey]: value[0] })
                        }
                        max={100}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Dias das Aulas</Label>
              <div className="grid grid-cols-2 gap-3">
                {WEEK_DAYS.map((day) => (
                  <div key={day.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={day.id}
                      checked={formData.classDays.includes(day.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({
                            ...formData,
                            classDays: [...formData.classDays, day.id],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            classDays: formData.classDays.filter((d) => d !== day.id),
                          });
                        }
                      }}
                    />
                    <Label htmlFor={day.id} className="cursor-pointer font-normal">
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="classTime">Horário das Aulas</Label>
              <Input
                id="classTime"
                type="time"
                value={formData.classTime}
                onChange={(e) => setFormData({ ...formData, classTime: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="monthlyFee">Valor Mensal (R$)</Label>
              <Input
                id="monthlyFee"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.monthlyFee}
                onChange={(e) => setFormData({ ...formData, monthlyFee: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
