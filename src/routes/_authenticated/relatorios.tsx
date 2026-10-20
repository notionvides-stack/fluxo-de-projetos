import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StateBox } from "@/components/app/ui-bits";

export const Route = createFileRoute("/_authenticated/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios — Gerenciador de Projeto" }] }),
  component: () => (
    <>
      <PageHeader title="Relatórios" />
      <StateBox kind="empty">Em construção — próxima etapa.</StateBox>
    </>
  ),
});
