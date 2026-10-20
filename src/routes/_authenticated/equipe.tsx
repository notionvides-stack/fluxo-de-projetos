import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StateBox } from "@/components/app/ui-bits";

export const Route = createFileRoute("/_authenticated/equipe")({
  head: () => ({ meta: [{ title: "Equipe — Gerenciador de Projeto" }] }),
  component: () => (
    <>
      <PageHeader title="Equipe" />
      <StateBox kind="empty">Em construção — próxima etapa.</StateBox>
    </>
  ),
});
