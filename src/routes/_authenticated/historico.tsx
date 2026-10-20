import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StateBox } from "@/components/app/ui-bits";

export const Route = createFileRoute("/_authenticated/historico")({
  head: () => ({ meta: [{ title: "Histórico — Gerenciador de Projeto" }] }),
  component: () => (
    <>
      <PageHeader title="Histórico" />
      <StateBox kind="empty">Em construção — próxima etapa.</StateBox>
    </>
  ),
});
