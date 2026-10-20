import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Loader2, Inbox, AlertTriangle, FlaskConical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/domain";

export function useSignedUrl(bucket: string, path?: string | null) {
  return useQuery({
    queryKey: ["signed", bucket, path],
    enabled: !!path,
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      if (path!.startsWith("http")) return path!;
      const { data } = await supabase.storage.from(bucket).createSignedUrl(path!, 3600);
      return data?.signedUrl ?? null;
    },
  }).data;
}

export function UserAvatar({ name, path, size = 28, className }: { name?: string | null; path?: string | null; size?: number; className?: string }) {
  const url = useSignedUrl("avatars", path);
  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-accent text-accent-foreground font-semibold ring-2 ring-card", className)}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      title={name ?? undefined}
    >
      {url ? <img src={url} alt={name ?? "Avatar"} className="h-full w-full object-cover" /> : initials(name)}
    </span>
  );
}

export function Person({ name, path, demo }: { name?: string | null; path?: string | null; demo?: boolean }) {
  if (!name) return <span className="text-muted-foreground">Sem responsável</span>;
  return (
    <span className="inline-flex items-center gap-2">
      <UserAvatar name={name} path={path} />
      <span className="truncate">{name}</span>
      {demo && <DemoBadge small />}
    </span>
  );
}

export function Pill({ cls, children }: { cls: string; children: ReactNode }) {
  return (
    <span className={cn("inline-flex min-w-28 items-center justify-center rounded-md px-2.5 py-1 text-xs font-semibold text-st-fg", cls)}>
      {children}
    </span>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const cls = value >= 100 ? "bg-st-done" : value >= 50 ? "bg-primary" : value > 0 ? "bg-st-doing" : "bg-st-todo";
  return (
    <div className="flex items-center gap-2" aria-label={`Progresso ${value}%`}>
      <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all", cls)} style={{ width: `${value}%` }} />
      </div>
      <span className="w-9 text-xs tabular-nums text-muted-foreground">{value}%</span>
    </div>
  );
}

export function DemoBadge({ small }: { small?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded bg-demo font-medium text-demo-foreground", small ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs")}>
      <FlaskConical className={small ? "h-3 w-3" : "h-3.5 w-3.5"} /> Dados de exemplo
    </span>
  );
}

export function StateBox({ kind, children }: { kind: "loading" | "empty" | "error"; children?: ReactNode }) {
  const Icon = kind === "loading" ? Loader2 : kind === "empty" ? Inbox : AlertTriangle;
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-14 text-sm text-muted-foreground" role={kind === "error" ? "alert" : "status"}>
      <Icon className={cn("h-6 w-6", kind === "loading" && "animate-spin", kind === "error" && "text-destructive")} />
      {children ?? (kind === "loading" ? "Carregando…" : kind === "empty" ? "Nada por aqui ainda." : "Erro ao carregar.")}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, tone, suffix }: { label: string; value: number | string; tone: string; suffix?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <span className={cn("h-2.5 w-2.5 rounded-full", tone)} /> {label}
      </div>
      <div className="mt-2 text-3xl font-bold tabular-nums">
        {value}
        {suffix && <span className="text-lg text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}
