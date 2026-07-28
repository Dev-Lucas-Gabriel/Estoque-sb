import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, ChevronDown, Copy, CopyCheck, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { montarLinha, useEstoque, type Conta, type StatusConta } from "@/lib/estoque";

export const Route = createFileRoute("/categoria/$id")({
  head: () => ({
    meta: [
      { title: "Categoria — Estoque de Contas" },
      {
        name: "description",
        content: "Cadastre e gerencie os logins e perfis das contas desta categoria do estoque.",
      },
      { property: "og:title", content: "Categoria — Estoque de Contas" },
      {
        property: "og:description",
        content: "Cadastre e gerencie os logins e perfis das contas desta categoria.",
      },
    ],
  }),
  component: CategoriaPage,
  errorComponent: () => (
    <AppShell>
      <p className="panel p-8 text-sm text-muted-foreground">Não foi possível abrir a categoria.</p>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell>
      <p className="panel p-8 text-sm text-muted-foreground">Categoria não encontrada.</p>
    </AppShell>
  ),
});

const vazio = { email: "", senha: "", perfil: "", pin: "", obs: "" };

function CategoriaPage() {
  const { id } = Route.useParams();
  const { categorias, contas, pronto, addConta, updateConta, removeConta } = useEstoque();
  const categoria = categorias.find((c) => c.id === id);
  const [form, setForm] = useState(vazio);
  const [qtd, setQtd] = useState("1");
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const [expandidos, setExpandidos] = useState<Record<string, boolean>>({});


  const lista = useMemo(
    () =>
      contas
        .filter((c) => c.categoriaId === id)
        .filter((c) =>
          busca.trim() ? c.email.toLowerCase().includes(busca.trim().toLowerCase()) : true,
        )
        .sort((a, b) => a.email.localeCompare(b.email) || a.perfil.localeCompare(b.perfil)),
    [contas, id, busca],
  );

  const grupos = useMemo(() => {
    if (!categoria) return [] as { email: string; itens: { conta: Conta; linha: string }[] }[];
    const mapa = new Map<string, { email: string; itens: { conta: Conta; linha: string }[] }>();
    for (const conta of lista) {
      if (!mapa.has(conta.email)) mapa.set(conta.email, { email: conta.email, itens: [] });
      mapa.get(conta.email)!.itens.push({ conta, linha: montarLinha(categoria, conta) });
    }
    return [...mapa.values()];
  }, [lista, categoria]);


  if (pronto && !categoria) throw notFound();
  if (!categoria) return <AppShell>{null}</AppShell>;

  async function salvar() {
    if (!categoria) return;
    if (!form.email.trim() || !form.senha.trim()) {
      toast.error("Preencha e-mail e senha");
      return;
    }
    const n = Math.min(Math.max(parseInt(qtd || "1", 10) || 1, 1), 20);
    try {
      for (let i = 0; i < n; i++) {
        const perfil =
          n > 1 ? `P${String(i + 1).padStart(2, "0")}` : form.perfil.trim() || "P01";
        await addConta({
          categoriaId: categoria.id,
          email: form.email.trim(),
          senha: form.senha.trim(),
          perfil,
          pin: form.pin.trim(),
          obs: form.obs.trim(),
          status: "DISPONIVEL",
        });
      }
    } catch {
      toast.error("Não foi possível salvar");
      return;
    }
    setForm(vazio);
    setQtd("1");
    setAberto(false);
    toast.success(n > 1 ? `${n} perfis adicionados` : "Conta adicionada");
  }


  async function copiar(texto: string) {
    await navigator.clipboard.writeText(texto);
    toast.success("Copiado!");
  }

  return (
    <AppShell>
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Voltar
      </Link>

      <div className="panel hero-surface mb-6 flex flex-wrap items-end justify-between gap-4 p-6">
        <div>
          <span className="text-xs font-medium tracking-widest text-accent">{categoria.tipo}</span>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{categoria.nome}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {lista.length} perfis listados
          </p>
        </div>
        <Dialog open={aberto} onOpenChange={setAberto}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" /> Adicionar conta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova conta em {categoria.nome}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="email">E-mail da conta</Label>
                <Input
                  id="email"
                  value={form.email}
                  maxLength={255}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="conta@gmail.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <Input
                  id="senha"
                  value={form.senha}
                  maxLength={120}
                  onChange={(e) => setForm({ ...form, senha: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pin">PIN (opcional)</Label>
                <Input
                  id="pin"
                  value={form.pin}
                  maxLength={20}
                  onChange={(e) => setForm({ ...form, pin: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="perfil">Perfil</Label>
                <Input
                  id="perfil"
                  value={form.perfil}
                  maxLength={30}
                  placeholder="P01"
                  onChange={(e) => setForm({ ...form, perfil: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qtd">Gerar perfis (P01...)</Label>
                <Input
                  id="qtd"
                  type="number"
                  min={1}
                  max={20}
                  value={qtd}
                  onChange={(e) => setQtd(e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="obs">Observações</Label>
                <Textarea
                  id="obs"
                  rows={2}
                  maxLength={300}
                  value={form.obs}
                  onChange={(e) => setForm({ ...form, obs: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={salvar}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Filtrar contas por e-mail nesta categoria"
        className="mb-4 max-w-md"
      />


      <div className="space-y-4">
        {lista.length === 0 && (
          <p className="panel p-8 text-center text-sm text-muted-foreground">
            Nenhuma conta cadastrada aqui ainda.
          </p>
        )}
        {grupos.map((grupo) => {
          const expandido = expandidos[grupo.email] ?? true;
          return (
          <div key={grupo.email} className="panel overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
              <button
                onClick={() => setExpandidos((s) => ({ ...s, [grupo.email]: !expandido }))}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <ChevronDown
                  className={`size-4 shrink-0 text-muted-foreground transition-transform ${
                    expandido ? "" : "-rotate-90"
                  }`}
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{grupo.email}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {grupo.itens.length} perfil(is) · Senha: {grupo.itens[0].conta.senha}
                    {grupo.itens[0].conta.pin ? ` · PIN: ${grupo.itens[0].conta.pin}` : ""}
                  </span>
                </span>
              </button>
              <Button size="sm" onClick={() => copiar(grupo.itens.map((i) => i.linha).join("\n"))}>
                <CopyCheck className="size-4" /> Copiar tudo
              </Button>
            </div>
            {expandido && (
            <>
            <pre className="linha-mono overflow-x-auto bg-background/50 px-4 py-3 text-muted-foreground">
              {grupo.itens.map((i) => i.linha).join("\n")}
            </pre>
            <div className="divide-y divide-border">

              {grupo.itens.map(({ conta, linha }) => (
                <div key={conta.id} className="flex flex-wrap items-center gap-3 px-4 py-2">
                  <p className="min-w-0 flex-1 truncate text-sm">
                    {conta.perfil || conta.email}
                    {conta.obs ? (
                      <span className="text-muted-foreground"> · {conta.obs}</span>
                    ) : null}
                  </p>
                  <button
                    onClick={() =>
                      updateConta(conta.id, {
                        status: (conta.status === "DISPONIVEL"
                          ? "VENDIDO"
                          : "DISPONIVEL") as StatusConta,
                      })
                    }
                    className={`rounded-full px-3 py-1 text-[11px] font-medium ${
                      conta.status === "DISPONIVEL"
                        ? "bg-success/20 text-success"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {conta.status}
                  </button>
                  <Button variant="secondary" size="sm" onClick={() => copiar(linha)}>
                    <Copy className="size-4" /> Copiar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      removeConta(conta.id);
                      toast.success("Conta removida");
                    }}
                    aria-label="Remover conta"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
            </>
            )}

          </div>
          );
        })}

      </div>

    </AppShell>
  );
}
