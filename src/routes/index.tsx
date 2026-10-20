import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { StateBox } from "@/components/app/ui-bits";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gerenciador de Projeto" },
      { name: "description", content: "Gestão de demandas semanais da equipe e acompanhamento de coleções." },
      { property: "og:title", content: "Gerenciador de Projeto" },
      { property: "og:description", content: "Gestão de demandas semanais da equipe e acompanhamento de coleções." },
    ],
  }),
  component: Index,
});

function Index() {
  const { ready, session } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (ready) navigate({ to: session ? "/visao-geral" : "/auth", replace: true });
  }, [ready, session, navigate]);
  return <StateBox kind="loading" />;
}
