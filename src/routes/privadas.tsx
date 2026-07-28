import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { BuscaContas } from "@/components/busca-contas";

export const Route = createFileRoute("/privadas")({
  head: () => ({
    meta: [
      { title: "Contas Privadas — Buscar por e-mail" },
      {
        name: "description",
        content:
          "Busque pelo e-mail e copie rapidamente os dados das suas contas privadas em estoque.",
      },
      { property: "og:title", content: "Contas Privadas — Buscar por e-mail" },
      {
        property: "og:description",
        content: "Busque um e-mail e copie os dados das contas privadas do seu estoque.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Privadas,
});

function Privadas() {
  return (
    <AppShell>
      <BuscaContas
        tipo="PRIVADO"
        titulo="Contas privadas"
        descricao="Digite o e-mail da conta para localizar suas contas privadas e copiar a linha pronta para a sua loja."
      />
    </AppShell>
  );
}
