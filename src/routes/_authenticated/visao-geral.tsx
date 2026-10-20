import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useWeek } from "@/hooks/use-week";
import { useAuth } from "@/hooks/use-auth";
import { useProfiles, useTasks, useWeekPeriod } from "@/lib/queries";
import { computeMetrics, weekLabel } from "@/lib/domain";
import { DemoBadge, PageHeader, StatCard } from "@/components/app/ui-bits";
import { TaskFilterBar, TaskTable, applyTaskFilters, emptyFilters } from "@/components/app/task-table";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/visao-geral")({
  head: () => ({ meta: [{ title: "Visão geral — Gerenciador de Projeto" }, { name: "description", content: "Indicadores da semana da equipe." }] }),
  component: Overview,
});

function Overview() {
  const { week, search } = useWeek();
  const { isAdmin, profile } = useAuth();
  const tasks = useTasks(week);
  const profiles = useProfiles();
  const period = useWeekPeriod(week);
  const [f, setF] = useState(emptyFilters);
  const filtered = useMemo(() => applyTaskFilters(tasks.data ?? [], f, search), [tasks.data, f, search]);
  const m = computeMetrics(filtered);
  const hasDemo = filtered.some((t) => t.is_demo);

  return (
    <>
      <PageHeader
        title={`Olá, ${profile?.full_name?.split(" ")[0] ?? ""}`}
        subtitle={<>Semana {weekLabel(week)} · {isAdmin ? "visão de toda a equipe" : "suas demandas"}</>}
        actions={
          <>
            {hasDemo && <DemoBadge />}
            {period.data?.status === "fechada" && (
              <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-1 text-xs font-medium"><Lock className="h-3.5 w-3.5" /> Semana fechada</span>
            )}
          </>
        }
      />
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatCard label="Total" value={m.total} tone="bg-primary" />
        <StatCard label="Concluídas" value={m.concluidas} tone="bg-st-done" />
        <StatCard label="Em andamento" value={m.em_andamento} tone="bg-st-doing" />
        <StatCard label="Atrasadas" value={m.atrasadas} tone="bg-st-blocked" />
        <StatCard label="Progresso médio" value={m.progresso_medio} suffix="%" tone="bg-st-wait" />
      </div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Demandas da semana</h2>
        <TaskFilterBar value={f} onChange={setF} profiles={profiles.data ?? []} showAssignee={isAdmin} />
      </div>
      <TaskTable tasks={filtered} loading={tasks.isLoading} error={tasks.isError} />
    </>
  );
}
