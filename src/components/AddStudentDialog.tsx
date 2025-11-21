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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus } from "lucide-react";

export const AddStudentDialog = ({ onStudentAdded }: { onStudentAdded: () => void }) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    level: "",
    progress: "0",
    nextClass: "",
    status: "active",
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
        next_class: formData.nextClass,
        status: formData.status,
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
        nextClass: "",
        status: "active",
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
      <DialogContent className="sm:max-w-[425px]">
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
              <Input
                id="level"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                placeholder="Ex: Iniciante, Intermediário"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="progress">Progresso (%)</Label>
              <Input
                id="progress"
                type="number"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) => setFormData({ ...formData, progress: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nextClass">Próxima Aula</Label>
              <Input
                id="nextClass"
                value={formData.nextClass}
                onChange={(e) => setFormData({ ...formData, nextClass: e.target.value })}
                placeholder="Ex: Segunda, 14:00"
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
