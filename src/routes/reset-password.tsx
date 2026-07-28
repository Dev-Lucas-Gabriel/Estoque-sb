import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nova senha — Estoque de Contas" },
      {
        name: "description",
        content: "Defina uma nova senha de acesso ao seu painel de estoque de contas.",
      },
      { property: "og:title", content: "Nova senha — Estoque de Contas" },
      {
        property: "og:description",
        content: "Defina uma nova senha para voltar a acessar seu estoque.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (senha.length < 6) {
      toast.error("A senha precisa ter ao menos 6 caracteres");
      return;
    }
    if (senha !== confirma) {
      toast.error("As senhas não conferem");
      return;
    }
    setCarregando(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: senha });
      if (error) throw error;
      toast.success("Senha atualizada!");
      navigate({ to: "/", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível atualizar");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="panel hero-surface w-full max-w-md p-8">
        <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <KeyRound className="size-6" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">Definir nova senha</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Escolha uma nova senha para acessar seu estoque.
        </p>
        <form onSubmit={enviar} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nova">Nova senha</Label>
            <Input
              id="nova"
              type="password"
              value={senha}
              maxLength={72}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirma">Confirmar senha</Label>
            <Input
              id="confirma"
              type="password"
              value={confirma}
              maxLength={72}
              onChange={(e) => setConfirma(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={carregando}>
            Salvar nova senha
          </Button>
        </form>
      </div>
    </main>
  );
}
