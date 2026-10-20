import { addDays, format, parseISO, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Database } from "@/integrations/supabase/types";

export type TaskStatus = Database["public"]["Enums"]["task_status"];
export type TaskPriority = Database["public"]["Enums"]["task_priority"];
export type FinalStatus = Database["public"]["Enums"]["final_status"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Product = Database["public"]["Tables"]["collection_products"]["Row"];

export const APP_NAME = "Gerenciador de Projeto";

export const STATUS: Record<TaskStatus, { label: string; cls: string }> = {
  nao_iniciado: { label: "Não iniciado", cls: "bg-st-todo" },
  em_andamento: { label: "Em andamento", cls: "bg-st-doing" },
  aguardando: { label: "Aguardando", cls: "bg-st-wait" },
  bloqueado: { label: "Bloqueado", cls: "bg-st-blocked" },
  concluido: { label: "Concluído", cls: "bg-st-done" },
};
export const PRIORITY: Record<TaskPriority, { label: string; cls: string }> = {
  baixa: { label: "Baixa", cls: "bg-st-todo" },
  media: { label: "Média", cls: "bg-primary" },
  alta: { label: "Alta", cls: "bg-st-doing" },
  urgente: { label: "Urgente", cls: "bg-st-blocked" },
};
export const FINAL: Record<FinalStatus, { label: string; cls: string }> = {
  pendente: { label: "Pendente", cls: "bg-st-todo" },
  aprovado: { label: "Aprovado", cls: "bg-st-done" },
  reprovado: { label: "Reprovado", cls: "bg-st-blocked" },
  ajustes: { label: "Ajustes solicitados", cls: "bg-st-doing" },
};

/** Monday (ISO yyyy-MM-dd) of the week that contains `d`. */
export function mondayOf(d: Date): string {
  return format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd");
}
export function fridayOf(weekStart: string): string {
  return format(addDays(parseISO(weekStart), 4), "yyyy-MM-dd");
}
export function shiftWeek(weekStart: string, n: number): string {
  return format(addDays(parseISO(weekStart), 7 * n), "yyyy-MM-dd");
}
export function weekLabel(weekStart: string): string {
  const s = parseISO(weekStart);
  return `${format(s, "dd/MM", { locale: ptBR })} – ${format(addDays(s, 4), "dd/MM/yyyy", { locale: ptBR })}`;
}
export function fmtDate(d?: string | null): string {
  return d ? format(parseISO(d), "dd/MM/yyyy") : "—";
}
export function fmtDateTime(d?: string | null): string {
  return d ? format(new Date(d), "dd/MM/yyyy HH:mm") : "—";
}
export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}
export function isOverdue(t: { due_date: string | null; status: TaskStatus }, today = todayISO()): boolean {
  return !!t.due_date && t.due_date < today && t.status !== "concluido";
}
export function initials(name?: string | null): string {
  if (!name) return "?";
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p.length > 1 ? p[p.length - 1][0] : "")).toUpperCase() || "?";
}

export type Metrics = {
  total: number;
  concluidas: number;
  em_andamento: number;
  bloqueadas: number;
  atrasadas: number;
  progresso_medio: number;
};
export function computeMetrics(tasks: Pick<Task, "status" | "progress" | "due_date">[], today = todayISO()): Metrics {
  const total = tasks.length;
  return {
    total,
    concluidas: tasks.filter((t) => t.status === "concluido").length,
    em_andamento: tasks.filter((t) => t.status === "em_andamento").length,
    bloqueadas: tasks.filter((t) => t.status === "bloqueado").length,
    atrasadas: tasks.filter((t) => isOverdue(t, today)).length,
    progresso_medio: total ? Math.round(tasks.reduce((s, t) => s + t.progress, 0) / total) : 0,
  };
}

/** Validates task form values; returns error message or null. */
export function validateTask(v: { title: string; progress: number; start_date?: string | null; due_date?: string | null }): string | null {
  if (!v.title.trim()) return "Informe o título.";
  if (v.title.length > 200) return "Título muito longo (máx. 200).";
  if (!Number.isInteger(v.progress) || v.progress < 0 || v.progress > 100) return "Progresso deve ser um número inteiro entre 0 e 100.";
  if (v.start_date && v.due_date && v.due_date < v.start_date) return "O prazo não pode ser anterior à data de início.";
  return null;
}
