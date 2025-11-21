import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";
import { Edit, CalendarIcon } from "lucide-react";
import { format, parse } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Student = Database["public"]["Tables"]["students"]["Row"];

const WEEK_DAYS = [
  { id: "segunda", label: "Seg" },
  { id: "terça", label: "Ter" },
  { id: "quarta", label: "Qua" },
  { id: "quinta", label: "Qui" },
  { id: "sexta", label: "Sex" },
  { id: "sábado", label: "Sáb" },
  { id: "domingo", label: "Dom" },
];

const TENNIS_SKILLS = [
  { key: "forehand_progress", label: "Forehand", icon: "🎾" },
  { key: "backhand_progress", label: "Backhand", icon: "🎾" },
  { key: "serve_progress", label: "Saque", icon: "🏐" },
  { key: "volley_progress", label: "Vôlei", icon: "🏐" },
  { key: "slice_progress", label: "Slice", icon: "🎾" },
  { key: "physical_progress", label: "Físico", icon: "💪" },
  { key: "tactical_progress", label: "Tático", icon: "🧠" },
];

interface EditStudentDialogProps {
  student: Student;
  onStudentUpdated: () => void;
}

export function EditStudentDialog({ student, onStudentUpdated }: EditStudentDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: student.name,
    level: student.level,
    status: student.status,
    class_days: student.class_days || [],
    class_time: student.class_time || "",
    class_start_date: student.class_start_date ? parse(student.class_start_date, 'yyyy-MM-dd', new Date()) : new Date(),
    monthly_fee: student.monthly_fee?.toString() || "",
    forehand_progress: student.forehand_progress,
    backhand_progress: student.backhand_progress,
    serve_progress: student.serve_progress,
    volley_progress: student.volley_progress,
    slice_progress: student.slice_progress,
    physical_progress: student.physical_progress,
    tactical_progress: student.tactical_progress,
  });

  useEffect(() => {
    if (open) {
      setFormData({
        name: student.name,
        level: student.level,
        status: student.status,
        class_days: student.class_days || [],
        class_time: student.class_time || "",
        class_start_date: student.class_start_date ? parse(student.class_start_date, 'yyyy-MM-dd', new Date()) : new Date(),
        monthly_fee: student.monthly_fee?.toString() || "",
        forehand_progress: student.forehand_progress,
        backhand_progress: student.backhand_progress,
        serve_progress: student.serve_progress,
        volley_progress: student.volley_progress,
        slice_progress: student.slice_progress,
        physical_progress: student.physical_progress,
        tactical_progress: student.tactical_progress,
      });
    }
  }, [open, student]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from("students")
        .update({
          name: formData.name,
          level: formData.level,
          status: formData.status,
          class_days: formData.class_days,
          class_time: formData.class_time,
          class_start_date: format(formData.class_start_date, 'yyyy-MM-dd'),
          monthly_fee: parseFloat(formData.monthly_fee) || 0,
          forehand_progress: formData.forehand_progress,
          backhand_progress: formData.backhand_progress,
          serve_progress: formData.serve_progress,
          volley_progress: formData.volley_progress,
          slice_progress: formData.slice_progress,
          physical_progress: formData.physical_progress,
          tactical_progress: formData.tactical_progress,
        })
        .eq("id", student.id);

      if (error) throw error;

      toast({
        title: "Aluno atualizado",
        description: "Os dados do aluno foram atualizados com sucesso!",
      });

      setOpen(false);
      onStudentUpdated();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o aluno. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleDayToggle = (dayId: string) => {
    setFormData((prev) => ({
      ...prev,
      class_days: prev.class_days.includes(dayId)
        ? prev.class_days.filter((d) => d !== dayId)
        : [...prev.class_days, dayId],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Aluno</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nome do Aluno</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-level">Nível</Label>
                <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
                  <SelectTrigger id="edit-level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Iniciante">Iniciante</SelectItem>
                    <SelectItem value="Intermediário">Intermediário</SelectItem>
                    <SelectItem value="Avançado">Avançado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger id="edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Dias da Aula</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {WEEK_DAYS.map((day) => (
                  <div key={day.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-${day.id}`}
                      checked={formData.class_days.includes(day.id)}
                      onCheckedChange={() => handleDayToggle(day.id)}
                    />
                    <Label htmlFor={`edit-${day.id}`} className="cursor-pointer">
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="edit-time">Horário da Aula</Label>
              <Input
                id="edit-time"
                type="time"
                value={formData.class_time}
                onChange={(e) => setFormData({ ...formData, class_time: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit-monthly-fee">Valor Mensal (R$)</Label>
              <Input
                id="edit-monthly-fee"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.monthly_fee}
                onChange={(e) => setFormData({ ...formData, monthly_fee: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Início na Aula</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.class_start_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.class_start_date ? format(formData.class_start_date, "dd/MM/yyyy") : <span>Selecione a data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.class_start_date}
                    onSelect={(date) => date && setFormData({ ...formData, class_start_date: date })}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-4">
              <Label>Progresso dos Golpes</Label>
              {TENNIS_SKILLS.map((skill) => {
                const progressValue = formData[skill.key as keyof typeof formData] as number;
                return (
                  <div key={skill.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">
                        {skill.icon} {skill.label}
                      </Label>
                      <span className="text-sm text-muted-foreground">
                        {progressValue}%
                      </span>
                    </div>
                    <Slider
                      value={[progressValue]}
                      onValueChange={(value) => setFormData({ ...formData, [skill.key]: value[0] })}
                      max={100}
                      step={1}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              Salvar Alterações
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
