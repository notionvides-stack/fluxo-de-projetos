import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StateBox } from "@/components/app/ui-bits";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — Gerenciador de Projeto" }] }),
  component: () => (
    <>
      <PageHeader title="Configurações" />
      <StateBox kind="empty">Em construção — próxima etapa.</StateBox>
    </>
  ),
});
