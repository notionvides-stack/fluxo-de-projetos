import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StateBox } from "@/components/app/ui-bits";

export const Route = createFileRoute("/_authenticated/colecao")({
  head: () => ({ meta: [{ title: "Acompanhamento de coleção — Gerenciador de Projeto" }] }),
  component: () => (
    <>
      <PageHeader title="Acompanhamento de coleção" />
      <StateBox kind="empty">Em construção — próxima etapa.</StateBox>
    </>
  ),
});
