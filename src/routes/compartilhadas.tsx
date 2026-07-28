import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { BuscaContas } from "@/components/busca-contas";

export const Route = createFileRoute("/compartilhadas")({
  head: () => ({
    meta: [
      { title: "Contas Compartilhadas — Buscar perfis por e-mail" },
      {
        name: "description",
        content:
          "Filtre pelo e-mail da conta e veja todos os perfis compartilhados prontos para copiar e colar na sua loja.",
      },
      { property: "og:title", content: "Contas Compartilhadas — Buscar perfis por e-mail" },
      {
        property: "og:description",
        content: "Busque um e-mail e copie todos os perfis compartilhados de uma vez.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Compartilhadas,
});

function Compartilhadas() {
  return (
    <AppShell>
      <BuscaContas
        tipo="COMPARTILHADO"
        titulo="Contas compartilhadas"
        descricao="Digite o e-mail da conta para listar todos os perfis compartilhados prontos para copiar e colar na sua loja."
      />
    </AppShell>
  );
}
