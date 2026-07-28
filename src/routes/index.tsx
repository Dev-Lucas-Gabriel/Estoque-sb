import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, Pencil, Plus, Share2, Trash2, Users } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import {
  TEMPLATE_PADRAO,
  TEMPLATE_PADRAO_PRIVADO,
  useEstoque,
  type Categoria,
  type TipoCategoria,
} from "@/lib/estoque";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Estoque de Contas — Painel de Categorias" },
      {
        name: "description",
        content:
          "Organize seu estoque de contas de streaming por categorias privadas e compartilhadas, com perfis prontos para copiar e colar.",
      },
      { property: "og:title", content: "Estoque de Contas — Painel de Categorias" },
      {
        property: "og:description",
        content: "Controle categorias privadas e compartilhadas de contas em um só painel.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { categorias, contas, pronto, addCategoria, updateCategoria, removeCategoria } =
    useEstoque();
  const [editando, setEditando] = useState<Categoria | null>(null);

  const navigate = useNavigate();
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<TipoCategoria>("COMPARTILHADO");
  const [template, setTemplate] = useState(TEMPLATE_PADRAO);

  async function criar() {
    if (!nome.trim()) {
      toast.error("Informe o nome da categoria");
      return;
    }
    try {
      const cat = await addCategoria(nome, tipo, template);
      setNome("");
      setTemplate(TEMPLATE_PADRAO);
      setTipo("COMPARTILHADO");
      setAberto(false);
      toast.success("Categoria criada");
      navigate({ to: "/categoria/$id", params: { id: cat.id } });
    } catch {
      toast.error("Não foi possível criar a categoria");
    }
  }


  return (
    <AppShell>
      <section className="hero-surface panel mb-8 p-6 sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Suas categorias</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Crie categorias por serviço (Netflix, Prime, Spotify...), escolha entre PRIVADO ou
          COMPARTILHADO e cadastre as contas do seu estoque.
        </p>
        <Dialog open={aberto} onOpenChange={setAberto}>
          <DialogTrigger asChild>
            <Button className="mt-5" size="lg">
              <Plus className="size-4" /> Adicionar categoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova categoria</DialogTitle>
              <DialogDescription>Defina o nome e o tipo da categoria.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da categoria</Label>
                <Input
                  id="nome"
                  value={nome}
                  maxLength={60}
                  placeholder="Ex.: Netflix"
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <RadioGroup
                  value={tipo}
                  onValueChange={(v) => {
                    const novo = v as TipoCategoria;
                    setTipo(novo);
                    setTemplate(
                      novo === "PRIVADO" ? TEMPLATE_PADRAO_PRIVADO : TEMPLATE_PADRAO,
                    );
                  }}
                  className="grid grid-cols-2 gap-3"
                >
                  <Label
                    htmlFor="t-priv"
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-3 text-sm has-[:checked]:border-primary"
                  >
                    <RadioGroupItem value="PRIVADO" id="t-priv" />
                    <Lock className="size-4" /> Privado
                  </Label>
                  <Label
                    htmlFor="t-comp"
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-3 text-sm has-[:checked]:border-primary"
                  >
                    <RadioGroupItem value="COMPARTILHADO" id="t-comp" />
                    <Users className="size-4" /> Compartilhado
                  </Label>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tpl">Modelo da linha para copiar</Label>
                <Textarea
                  id="tpl"
                  rows={3}
                  className="linha-mono"
                  value={template}
                  maxLength={400}
                  onChange={(e) => setTemplate(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Variáveis: {"{CATEGORIA} {EMAIL} {SENHA} {PERFIL} {PIN}"}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={criar}>Criar categoria</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>

      {pronto && categorias.length === 0 && (
        <div className="panel p-10 text-center text-sm text-muted-foreground">
          Nenhuma categoria ainda. Clique em “Adicionar categoria” para começar.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categorias.map((cat) => {
          const doCat = contas.filter((c) => c.categoriaId === cat.id);
          const disponiveis = doCat.filter((c) => c.status === "DISPONIVEL").length;
          return (
            <div key={cat.id} className="panel group relative p-5">
              <Link
                to="/categoria/$id"
                params={{ id: cat.id }}
                className="block"
                aria-label={`Abrir ${cat.nome}`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${
                      cat.tipo === "COMPARTILHADO"
                        ? "bg-accent/20 text-accent"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {cat.tipo === "COMPARTILHADO" ? (
                      <Share2 className="size-3" />
                    ) : (
                      <Lock className="size-3" />
                    )}
                    {cat.tipo}
                  </span>
                </div>
                <h2 className="mt-3 text-lg font-semibold">{cat.nome}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {doCat.length} perfis · {disponiveis} disponíveis
                </p>
              </Link>
              <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => setEditando(cat)}
                  className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  aria-label={`Editar ${cat.nome}`}
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  onClick={() => {
                    removeCategoria(cat.id);
                    toast.success("Categoria removida");
                  }}
                  className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-destructive"
                  aria-label={`Excluir ${cat.nome}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!editando} onOpenChange={(v) => !v && setEditando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar categoria</DialogTitle>
            <DialogDescription>Altere o nome, o tipo ou o modelo da linha.</DialogDescription>
          </DialogHeader>
          {editando && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nome">Nome da categoria</Label>
                <Input
                  id="edit-nome"
                  value={editando.nome}
                  maxLength={60}
                  onChange={(e) => setEditando({ ...editando, nome: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <RadioGroup
                  value={editando.tipo}
                  onValueChange={(v) => {
                    const novo = v as TipoCategoria;
                    setEditando({
                      ...editando,
                      tipo: novo,
                      template:
                        novo === "PRIVADO" ? TEMPLATE_PADRAO_PRIVADO : TEMPLATE_PADRAO,
                    });
                  }}
                  className="grid grid-cols-2 gap-3"
                >
                  <Label
                    htmlFor="e-priv"
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-3 text-sm has-[:checked]:border-primary"
                  >
                    <RadioGroupItem value="PRIVADO" id="e-priv" />
                    <Lock className="size-4" /> Privado
                  </Label>
                  <Label
                    htmlFor="e-comp"
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-border p-3 text-sm has-[:checked]:border-primary"
                  >
                    <RadioGroupItem value="COMPARTILHADO" id="e-comp" />
                    <Users className="size-4" /> Compartilhado
                  </Label>
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-tpl">Modelo da linha para copiar</Label>
                <Textarea
                  id="edit-tpl"
                  rows={3}
                  className="linha-mono"
                  maxLength={400}
                  value={editando.template}
                  onChange={(e) => setEditando({ ...editando, template: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={() => {
                if (!editando) return;
                if (!editando.nome.trim()) {
                  toast.error("Informe o nome da categoria");
                  return;
                }
                updateCategoria(editando.id, {
                  nome: editando.nome.trim(),
                  tipo: editando.tipo,
                  template: editando.template.trim() || TEMPLATE_PADRAO,
                });
                setEditando(null);
                toast.success("Categoria atualizada");
              }}
            >
              Salvar alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </AppShell>
  );
}
