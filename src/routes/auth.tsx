import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Boxes, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : "/",
  }),
  head: () => ({
    meta: [
      { title: "Entrar — Estoque de Contas" },
      {
        name: "description",
        content:
          "Acesse com e-mail e senha, crie uma nova conta ou recupere o acesso ao seu estoque.",
      },
      { property: "og:title", content: "Entrar — Estoque de Contas" },
      {
        property: "og:description",
        content: "Login, cadastro e recuperação de senha do seu painel de estoque.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("E-mail inválido").max(255),
  senha: z.string().min(6, "A senha precisa ter ao menos 6 caracteres").max(72),
});

type Modo = "entrar" | "criar" | "recuperar";

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const { sessao, pronto } = useSessao();
  const [modo, setModo] = useState<Modo>("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (pronto && sessao) {
      const destino =
        redirect?.startsWith("/") && !redirect.startsWith("/auth") ? redirect : "/";
      navigate({ to: destino, replace: true });
    }
  }, [pronto, sessao, navigate, redirect]);


  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const alvo = modo === "recuperar" ? { email, senha: "000000" } : { email, senha };
    const check = schema.safeParse(alvo);
    if (!check.success) {
      toast.error(check.error.issues[0].message);
      return;
    }
    setCarregando(true);
    try {
      if (modo === "criar") {
        const { error } = await supabase.auth.signUp({
          email: check.data.email,
          password: senha,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Conta criada! Confirme pelo e-mail se for solicitado.");
      } else if (modo === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({
          email: check.data.email,
          password: senha,
        });
        if (error) throw error;
        toast.success("Bem-vindo de volta!");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(check.data.email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Enviamos um link de recuperação para o seu e-mail.");
        setModo("entrar");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível concluir");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="panel hero-surface w-full max-w-md p-8">
        <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Boxes className="size-6" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight">Estoque de Contas</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {modo === "entrar" && "Entre com seu e-mail e senha para acessar o painel."}
          {modo === "criar" && "Crie sua conta para começar a organizar seu estoque."}
          {modo === "recuperar" && "Informe seu e-mail para receber o link de nova senha."}
        </p>

        <form onSubmit={enviar} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoFocus
              value={email}
              maxLength={255}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
            />
          </div>
          {modo !== "recuperar" && (
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                value={senha}
                maxLength={72}
                onChange={(e) => setSenha(e.target.value)}
              />
            </div>
          )}
          <Button type="submit" className="w-full" size="lg" disabled={carregando}>
            <ShieldCheck className="size-4" />
            {modo === "entrar" && "Entrar"}
            {modo === "criar" && "Criar conta"}
            {modo === "recuperar" && "Enviar link de recuperação"}
          </Button>
        </form>

        <div className="mt-5 space-y-2 text-sm">
          {modo !== "entrar" && (
            <button
              className="text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setModo("entrar")}
            >
              Já tenho conta — entrar
            </button>
          )}
          {modo !== "criar" && (
            <button
              className="block text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setModo("criar")}
            >
              Criar uma nova conta
            </button>
          )}
          {modo !== "recuperar" && (
            <button
              className="block text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setModo("recuperar")}
            >
              Esqueci minha senha
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
