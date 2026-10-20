import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PRIORITY, STATUS, fmtDateTime, mondayOf, validateTask, type Profile, type TaskPriority, type TaskStatus } from "@/lib/domain";
import type { TaskWithPerson } from "@/lib/queries";
import { parseISO } from "date-fns";
import { UserAvatar, DemoBadge } from "./ui-bits";

type Form = {
  title: string;
  description: string;
  assignee_id: string;
  priority: TaskPriority;
  status: TaskStatus;
  progress: number;
  start_date: string;
  due_date: string;
  week_start: string;
  notes: string;
};

export function TaskDialog({ open, onOpenChange, task, week, profiles }: { open: boolean; onOpenChange: (o: boolean) => void; task: TaskWithPerson | null; week: string; profiles: Profile[] }) {
  const { isAdmin, userId } = useAuth();
  const qc = useQueryClient();
  const [f, setF] = useState<Form>(blank(week));
  const [comment, setComment] = useState("");
  const restricted = !isAdmin;

  useEffect(() => {
    if (!open) return;
    setF(
      task
        ? {
            title: task.title,
            description: task.description ?? "",
            assignee_id: task.assignee_id ?? "none",
            priority: task.priority,
            status: task.status,
            progress: task.progress,
            start_date: task.start_date ?? "",
            due_date: task.due_date ?? "",
            week_start: task.week_start,
            notes: task.notes ?? "",
          }
        : blank(week),
    );
    setComment("");
  }, [open, task, week]);

  const comments = useQuery({
    queryKey: ["comments", task?.id],
    enabled: !!task && open,
    queryFn: async () => {
      const { data, error } = await supabase.from("task_comments").select("*, author:profiles(full_name, avatar_url)").eq("task_id", task!.id).order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const err = validateTask({ ...f, start_date: f.start_date || null, due_date: f.due_date || null });
      if (err) throw new Error(err);
      if (restricted && task) {
        const { error } = await supabase.from("tasks").update({ progress: f.progress, status: f.status, notes: f.notes || null }).eq("id", task.id);
        if (error) throw error;
        return;
      }
      const payload = {
        title: f.title.trim(),
        description: f.description || null,
        assignee_id: f.assignee_id === "none" ? null : f.assignee_id,
        priority: f.priority,
        status: f.status,
        progress: f.progress,
        start_date: f.start_date || null,
        due_date: f.due_date || null,
        week_start: mondayOf(parseISO(f.week_start)),
        notes: f.notes || null,
      };
      const { error } = task
        ? await supabase.from("tasks").update(payload).eq("id", task.id)
        : await supabase.from("tasks").insert({ ...payload, created_by: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(task ? "Demanda atualizada." : "Demanda criada.");
      qc.invalidateQueries({ queryKey: ["tasks"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addComment = useMutation({
    mutationFn: async () => {
      if (!comment.trim()) return;
      const { error } = await supabase.from("task_comments").insert({ task_id: task!.id, author_id: userId!, body: comment.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      setComment("");
      comments.refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    save.mutate();
  }
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">{task ? "Editar demanda" : "Nova demanda"} {task?.is_demo && <DemoBadge small />}</DialogTitle>
        </DialogHeader>
        {restricted && <p className="rounded-md bg-accent px-3 py-2 text-xs text-accent-foreground">Como colaborador, você pode alterar apenas progresso, status e observações.</p>}
        <form onSubmit={submit} className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="t-title">Título *</Label>
            <Input id="t-title" required maxLength={200} disabled={restricted} value={f.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="t-desc">Descrição</Label>
            <Textarea id="t-desc" disabled={restricted} value={f.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Responsável</Label>
            <Select disabled={restricted} value={f.assignee_id} onValueChange={(v) => set("assignee_id", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem responsável</SelectItem>
                {profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Prioridade</Label>
            <Select disabled={restricted} value={f.priority} onValueChange={(v) => set("priority", v as TaskPriority)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{(Object.keys(PRIORITY) as TaskPriority[]).map((k) => <SelectItem key={k} value={k}>{PRIORITY[k].label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={f.status} onValueChange={(v) => set("status", v as TaskStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{(Object.keys(STATUS) as TaskStatus[]).map((k) => <SelectItem key={k} value={k}>{STATUS[k].label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-prog">Progresso (0–100)</Label>
            <div className="flex items-center gap-3">
              <Slider value={[f.progress]} min={0} max={100} step={5} onValueChange={([v]) => set("progress", v)} className="flex-1" aria-label="Progresso" />
              <Input id="t-prog" type="number" min={0} max={100} className="w-20" value={f.progress} onChange={(e) => set("progress", Math.round(Number(e.target.value)))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-start">Data de início</Label>
            <Input id="t-start" type="date" disabled={restricted} value={f.start_date} onChange={(e) => set("start_date", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-due">Prazo</Label>
            <Input id="t-due" type="date" disabled={restricted} value={f.due_date} onChange={(e) => set("due_date", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-week">Semana (qualquer dia — será ajustada para segunda)</Label>
            <Input id="t-week" type="date" required disabled={restricted} value={f.week_start} onChange={(e) => set("week_start", e.target.value)} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="t-notes">Observações</Label>
            <Textarea id="t-notes" value={f.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>
          <DialogFooter className="col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={save.isPending}>{save.isPending ? "Salvando…" : "Salvar"}</Button>
          </DialogFooter>
        </form>
        {task && (
          <div className="mt-2 border-t pt-4">
            <h3 className="mb-2 text-sm font-semibold">Comentários</h3>
            <div className="space-y-3">
              {(comments.data ?? []).map((c) => (
                <div key={c.id} className="flex gap-2 text-sm">
                  <UserAvatar name={c.author?.full_name} path={c.author?.avatar_url} />
                  <div>
                    <div className="text-xs text-muted-foreground"><b className="text-foreground">{c.author?.full_name}</b> · {fmtDateTime(c.created_at)}</div>
                    <div>{c.body}</div>
                  </div>
                </div>
              ))}
              {comments.data?.length === 0 && <p className="text-xs text-muted-foreground">Sem comentários.</p>}
            </div>
            <div className="mt-3 flex gap-2">
              <Input aria-label="Novo comentário" placeholder="Escreva um comentário…" value={comment} maxLength={2000} onChange={(e) => setComment(e.target.value)} />
              <Button type="button" variant="secondary" onClick={() => addComment.mutate()} disabled={!comment.trim()}>Enviar</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function blank(week: string): Form {
  return { title: "", description: "", assignee_id: "none", priority: "media", status: "nao_iniciado", progress: 0, start_date: week, due_date: "", week_start: week, notes: "" };
}
