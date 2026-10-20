import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, ChevronLeft, ChevronRight, Search, LogOut, Settings } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useWeek } from "@/hooks/use-week";
import { useAuth } from "@/hooks/use-auth";
import { useTasks, personName } from "@/lib/queries";
import { isOverdue, mondayOf, shiftWeek, weekLabel, fmtDate } from "@/lib/domain";
import { UserAvatar } from "./ui-bits";
import { supabase } from "@/integrations/supabase/client";

export function Topbar() {
  const { week, setWeek, search, setSearch } = useWeek();
  const { profile, isAdmin, userId } = useAuth();
  const { data: tasks } = useTasks(week);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const alerts = (tasks ?? []).filter((t) => (isOverdue(t) || t.status === "bloqueado") && (isAdmin || t.assignee_id === userId));

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-card/95 px-4 backdrop-blur">
      <SidebarTrigger aria-label="Alternar menu" />
      <div className="relative max-w-sm flex-1">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input aria-label="Buscar" placeholder="Buscar demandas, produtos…" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="ml-auto flex items-center gap-1 rounded-md border bg-background p-0.5" role="group" aria-label="Seletor de semana">
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Semana anterior" onClick={() => setWeek(shiftWeek(week, -1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <button className="px-2 text-sm font-medium tabular-nums" onClick={() => setWeek(mondayOf(new Date()))} title="Ir para semana atual">
          Seg–Sex {weekLabel(week)}
        </button>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Próxima semana" onClick={() => setWeek(shiftWeek(week, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative" aria-label={`Notificações (${alerts.length})`}>
            <Bell className="h-5 w-5" />
            {alerts.length > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">{alerts.length}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
          <div className="border-b px-4 py-2 text-sm font-semibold">Alertas da semana</div>
          <div className="max-h-80 overflow-auto">
            {alerts.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Nenhuma demanda atrasada ou bloqueada.</p>
            ) : (
              alerts.map((t) => (
                <div key={t.id} className="border-b px-4 py-2 text-sm last:border-0">
                  <div className="font-medium">{t.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {t.status === "bloqueado" ? "Bloqueada" : `Atrasada — prazo ${fmtDate(t.due_date)}`} · {personName(t) ?? "Sem responsável"}
                  </div>
                </div>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
      <DropdownMenu>
        <DropdownMenuTrigger aria-label="Menu do usuário" className="rounded-full">
          <UserAvatar name={profile?.full_name} path={profile?.avatar_url} size={34} />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="font-semibold">{profile?.full_name}</div>
            <div className="text-xs font-normal text-muted-foreground">{isAdmin ? "Administrador" : "Colaborador"}</div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate({ to: "/configuracoes" })}><Settings className="mr-2 h-4 w-4" /> Configurações</DropdownMenuItem>
          <DropdownMenuItem onClick={signOut}><LogOut className="mr-2 h-4 w-4" /> Sair</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
