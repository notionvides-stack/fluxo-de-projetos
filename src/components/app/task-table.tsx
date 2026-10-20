import { Pencil, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PRIORITY, STATUS, fmtDate, isOverdue, type TaskPriority, type TaskStatus, type Profile } from "@/lib/domain";
import { personName, type TaskWithPerson } from "@/lib/queries";
import { Person, Pill, ProgressBar, StateBox } from "./ui-bits";

export type TaskFilters = { assignee: string; status: string; priority: string };
export const emptyFilters: TaskFilters = { assignee: "all", status: "all", priority: "all" };

export function applyTaskFilters(tasks: TaskWithPerson[], f: TaskFilters, search: string) {
  const s = search.trim().toLowerCase();
  return tasks.filter(
    (t) =>
      (f.assignee === "all" || (f.assignee === "none" ? !t.assignee_id : t.assignee_id === f.assignee)) &&
      (f.status === "all" || (f.status === "atrasada" ? isOverdue(t) : t.status === f.status)) &&
      (f.priority === "all" || t.priority === f.priority) &&
      (!s || t.title.toLowerCase().includes(s) || (t.description ?? "").toLowerCase().includes(s) || (personName(t) ?? "").toLowerCase().includes(s)),
  );
}

export function TaskFilterBar({ value, onChange, profiles, showAssignee = true }: { value: TaskFilters; onChange: (f: TaskFilters) => void; profiles: Profile[]; showAssignee?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {showAssignee && (
        <Select value={value.assignee} onValueChange={(v) => onChange({ ...value, assignee: v })}>
          <SelectTrigger className="w-48" aria-label="Filtrar por responsável"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os responsáveis</SelectItem>
            <SelectItem value="none">Sem responsável</SelectItem>
            {profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
      <Select value={value.status} onValueChange={(v) => onChange({ ...value, status: v })}>
        <SelectTrigger className="w-44" aria-label="Filtrar por status"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os status</SelectItem>
          {(Object.keys(STATUS) as TaskStatus[]).map((k) => <SelectItem key={k} value={k}>{STATUS[k].label}</SelectItem>)}
          <SelectItem value="atrasada">Atrasadas</SelectItem>
        </SelectContent>
      </Select>
      <Select value={value.priority} onValueChange={(v) => onChange({ ...value, priority: v })}>
        <SelectTrigger className="w-44" aria-label="Filtrar por prioridade"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as prioridades</SelectItem>
          {(Object.keys(PRIORITY) as TaskPriority[]).map((k) => <SelectItem key={k} value={k}>{PRIORITY[k].label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

export function TaskTable({
  tasks,
  loading,
  error,
  onEdit,
  onDelete,
  canDelete,
}: {
  tasks: TaskWithPerson[];
  loading?: boolean;
  error?: boolean;
  onEdit?: (t: TaskWithPerson) => void;
  onDelete?: (t: TaskWithPerson) => void;
  canDelete?: boolean;
}) {
  if (loading) return <StateBox kind="loading" />;
  if (error) return <StateBox kind="error" />;
  if (!tasks.length) return <StateBox kind="empty">Nenhuma demanda encontrada para os filtros/semana selecionados.</StateBox>;
  return (
    <div className="max-h-[65vh] overflow-auto rounded-lg border bg-card">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10 bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-semibold">Tarefa</th>
            <th className="px-4 py-3 font-semibold">Responsável</th>
            <th className="px-4 py-3 text-center font-semibold">Prioridade</th>
            <th className="px-4 py-3 text-center font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Prazo</th>
            <th className="px-4 py-3 font-semibold">Progresso</th>
            {onEdit && <th className="px-4 py-3"><span className="sr-only">Ações</span></th>}
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => {
            const late = isOverdue(t);
            return (
              <tr key={t.id} className="border-t transition-colors hover:bg-accent/40">
                <td className="max-w-xs px-4 py-2.5">
                  <div className="truncate font-medium">{t.title}</div>
                  {t.notes && <div className="truncate text-xs text-muted-foreground">{t.notes}</div>}
                </td>
                <td className="px-4 py-2.5"><Person name={personName(t)} path={t.assignee?.avatar_url} demo={t.is_demo} /></td>
                <td className="px-4 py-2.5 text-center"><Pill cls={PRIORITY[t.priority].cls}>{PRIORITY[t.priority].label}</Pill></td>
                <td className="px-4 py-2.5 text-center"><Pill cls={STATUS[t.status].cls}>{STATUS[t.status].label}</Pill></td>
                <td className="whitespace-nowrap px-4 py-2.5">
                  <span className={late ? "inline-flex items-center gap-1 font-semibold text-destructive" : ""}>
                    {late && <AlertCircle className="h-3.5 w-3.5" aria-label="Atrasada" />}
                    {fmtDate(t.due_date)}
                  </span>
                </td>
                <td className="px-4 py-2.5"><ProgressBar value={t.progress} /></td>
                {onEdit && (
                  <td className="whitespace-nowrap px-2 py-2.5 text-right">
                    <Button variant="ghost" size="icon" aria-label={`Editar ${t.title}`} onClick={() => onEdit(t)}><Pencil className="h-4 w-4" /></Button>
                    {canDelete && onDelete && (
                      <Button variant="ghost" size="icon" aria-label={`Excluir ${t.title}`} onClick={() => onDelete(t)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
