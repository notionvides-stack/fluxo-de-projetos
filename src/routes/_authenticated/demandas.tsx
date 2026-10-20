import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useWeek } from "@/hooks/use-week";
import { useAuth } from "@/hooks/use-auth";
import { useProfiles, useTasks, type TaskWithPerson } from "@/lib/queries";
import { weekLabel } from "@/lib/domain";
import { supabase } from "@/integrations/supabase/client";
import { DemoBadge, PageHeader } from "@/components/app/ui-bits";
import { TaskFilterBar, TaskTable, applyTaskFilters, emptyFilters } from "@/components/app/task-table";
import { TaskDialog } from "@/components/app/task-dialog";

export const Route = createFileRoute("/_authenticated/demandas")({
  head: () => ({ meta: [{ title: "Demandas — Gerenciador de Projeto" }, { name: "description", content: "Cadastro e acompanhamento de demandas semanais." }] }),
  component: Demandas,
});

function Demandas() {
  const { week, search } = useWeek();
  const { isAdmin } = useAuth();
  const tasks = useTasks(week);
  const profiles = useProfiles();
  const qc = useQueryClient();
  const [f, setF] = useState(emptyFilters);
  const [editing, setEditing] = useState<TaskWithPerson | null>(null);
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<TaskWithPerson | null>(null);
  const filtered = useMemo(() => applyTaskFilters(tasks.data ?? [], f, search), [tasks.data, f, search]);

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Demanda excluída.");
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <PageHeader
        title="Demandas"
        subtitle={`Semana ${weekLabel(week)} · ${filtered.length} demanda(s)`}
        actions={
          <>
            {filtered.some((t) => t.is_demo) && <DemoBadge />}
            {isAdmin && (
              <Button onClick={() => { setEditing(null); setOpen(true); }}>
                <Plus className="mr-1 h-4 w-4" /> Nova demanda
              </Button>
            )}
          </>
        }
      />
      <div className="mb-3"><TaskFilterBar value={f} onChange={setF} profiles={profiles.data ?? []} showAssignee={isAdmin} /></div>
      <TaskTable
        tasks={filtered}
        loading={tasks.isLoading}
        error={tasks.isError}
        onEdit={(t) => { setEditing(t); setOpen(true); }}
        onDelete={setToDelete}
        canDelete={isAdmin}
      />
      <TaskDialog open={open} onOpenChange={setOpen} task={editing} week={week} profiles={profiles.data ?? []} />
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir demanda?</AlertDialogTitle>
            <AlertDialogDescription>"{toDelete?.title}" será excluída permanentemente. A exclusão fica registrada no histórico.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => toDelete && del.mutate(toDelete.id)}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
