import { useMemo, useState } from "react";
import { Copy, CopyCheck, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { montarLinha, useEstoque, type Conta, type TipoCategoria } from "@/lib/estoque";

interface Props {
  tipo: TipoCategoria;
  titulo: string;
  descricao: string;
}

export function BuscaContas({ tipo, titulo, descricao }: Props) {
  const { categorias, contas } = useEstoque();
  const [email, setEmail] = useState("");
  const [catId, setCatId] = useState("todas");
  const [somenteDisp, setSomenteDisp] = useState(true);

  const doTipo = useMemo(() => categorias.filter((c) => c.tipo === tipo), [categorias, tipo]);

  const grupos = useMemo(() => {
    const ids = new Set(doTipo.filter((c) => catId === "todas" || c.id === catId).map((c) => c.id));
    const termo = email.trim().toLowerCase();
    const encontradas = contas
      .filter((c) => ids.has(c.categoriaId))
      .filter((c) => (termo ? c.email.toLowerCase().includes(termo) : false))
      .filter((c) => (somenteDisp ? c.status === "DISPONIVEL" : true))
      .sort((a, b) => a.email.localeCompare(b.email) || a.perfil.localeCompare(b.perfil));

    const mapa = new Map<string, { email: string; itens: { conta: Conta; linha: string }[] }>();
    for (const conta of encontradas) {
      const cat = doTipo.find((c) => c.id === conta.categoriaId);
      if (!cat) continue;
      const chave = `${conta.categoriaId}|${conta.email}`;
      if (!mapa.has(chave)) mapa.set(chave, { email: `${cat.nome} · ${conta.email}`, itens: [] });
      mapa.get(chave)!.itens.push({ conta, linha: montarLinha(cat, conta) });
    }
    return [...mapa.values()];
  }, [contas, doTipo, catId, email, somenteDisp]);

  const total = grupos.reduce((n, g) => n + g.itens.length, 0);

  async function copiar(texto: string) {
    await navigator.clipboard.writeText(texto);
    toast.success("Copiado!");
  }

  return (
    <>
      <div className="panel hero-surface mb-6 p-6">
        <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{descricao}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <div className="relative min-w-[260px] flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={email}
              maxLength={255}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e-mail da conta"
              className="pl-9"
            />
          </div>
          <Select value={catId} onValueChange={setCatId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as categorias</SelectItem>
              {doTipo.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={somenteDisp ? "default" : "secondary"}
            onClick={() => setSomenteDisp((v) => !v)}
          >
            {somenteDisp ? "Só disponíveis" : "Todos os status"}
          </Button>
        </div>
      </div>

      {total > 0 && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{total} linhas encontradas</p>
          <Button
            variant="secondary"
            onClick={() =>
              copiar(grupos.flatMap((g) => g.itens.map((i) => i.linha)).join("\n"))
            }
          >
            <CopyCheck className="size-4" /> Copiar todos
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {grupos.length === 0 ? (
          <p className="panel p-10 text-center text-sm text-muted-foreground">
            {email.trim()
              ? "Nenhuma conta encontrada para esse e-mail."
              : "Digite um e-mail acima para ver as contas."}
          </p>
        ) : (
          grupos.map((g) => (
            <div key={g.email} className="panel overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
                <p className="truncate text-sm font-medium">
                  {g.email}
                  <span className="text-muted-foreground"> · {g.itens.length} linha(s)</span>
                </p>
                <Button
                  size="sm"
                  onClick={() => copiar(g.itens.map((i) => i.linha).join("\n"))}
                >
                  <CopyCheck className="size-4" /> Copiar tudo
                </Button>
              </div>
              <pre className="linha-mono overflow-x-auto bg-background/50 px-4 py-3 text-muted-foreground">
                {g.itens.map((i) => i.linha).join("\n")}
              </pre>
              <div className="divide-y divide-border">
                {g.itens.map(({ conta, linha }) => (
                  <div key={conta.id} className="flex items-center gap-3 px-4 py-2">
                    <p className="linha-mono min-w-0 flex-1 overflow-x-auto whitespace-nowrap">
                      {linha}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copiar(linha)}
                      aria-label="Copiar linha"
                    >
                      <Copy className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
