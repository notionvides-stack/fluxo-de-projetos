import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, ListChecks, Shirt, Users, FileBarChart, History, Settings, LayoutGrid } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Visão geral", url: "/visao-geral", icon: LayoutDashboard },
  { title: "Demandas", url: "/demandas", icon: ListChecks },
  { title: "Acompanhamento de coleção", url: "/colecao", icon: Shirt },
  { title: "Equipe", url: "/equipe", icon: Users },
  { title: "Relatórios", url: "/relatorios", icon: FileBarChart },
  { title: "Histórico", url: "/historico", icon: History },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
] as const;

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const path = useRouterState({ select: (r) => r.location.pathname });
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 flex-row items-center gap-2 border-b px-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <LayoutGrid className="h-4 w-4" />
        </span>
        {!collapsed && <span className="truncate font-bold">Gerenciador de Projeto</span>}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((it) => (
                <SidebarMenuItem key={it.url}>
                  <SidebarMenuButton asChild isActive={path.startsWith(it.url)} tooltip={it.title}>
                    <Link to={it.url}>
                      <it.icon className="h-4 w-4" />
                      <span>{it.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
