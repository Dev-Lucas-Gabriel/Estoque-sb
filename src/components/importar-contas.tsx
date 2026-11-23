import { useMemo, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Categoria, Conta } from "@/lib/estoque";
import {
  analisarImportacao,
  MAX_LINHAS_IMPORTACAO,
  MAX_PERFIS_POR_CONTA,
  MAX_SENHA,
  nomesDosPerfis,
  type MotivoErroSenha,
  type MotivoIgnorada,
} from "@/lib/importacao";

const MOTIVOS: Record<MotivoIgnorada, string> = {
  formato: "formato inválido",
  "email-longo": "e-mail muito longo",
  "senha-longa": "senha muito longa",
  "sem-senha": "sem senha",
  repetida: "repetida na lista",
  existente: "já existe nesta categoria",
};

const MOTIVOS_SENHA: Record<MotivoErroSenha, string> = {
  formato: "use email:senha",
  "senha-longa": "senha muito longa",
  repetida: "e-mail repetido",
  "fora-da-lista": "e-mail não está na lista acima",
};

const camposDeTexto = {
  autoComplete: "off",
  autoCorrect: "off",
  autoCapitalize: "off",
  spellCheck: false,
} as const;

interface Props {
  categoria: Categoria;
  emailsExistentes: string[];
  onImportar: (contas: Omit<Conta, "id" | "criadoEm">[]) => Promise<unknown>;
}

export function ImportarContas({ categoria, emailsExistentes, onImportar }: Props) {
  const [aberto, setAberto] = useState(false);
  const [emails, setEmails] = useState("");
  const [senha, setSenha] = useState("");
  const [temDiferentes, setTemDiferentes] = useState(false);
  const [senhasDiferentes, setSenhasDiferentes] = useState("");
  const [qtd, setQtd] = useState("1");
  const [salvando, setSalvando] = useState(false);

  const { validas, ignoradas, errosSenhas } = useMemo(
    () =>
      analisarImportacao(
        {
          emails,
          senhaPadrao: senha,
          senhasDiferentes: temDiferentes ? senhasDiferentes : "",
        },
        emailsExistentes,
      ),
    [emails, senha, temDiferentes, senhasDiferentes, emailsExistentes],
  );
  const perfis = Math.min(Math.max(parseInt(qtd || "1", 10) || 1, 1), MAX_PERFIS_POR_CONTA);
  const total = validas.length * perfis;
  const excedeu = total > MAX_LINHAS_IMPORTACAO;
  const bloqueado = !validas.length || excedeu || errosSenhas.length > 0;

  function limpar() {
    setEmails("");
    setSenha("");
    setTemDiferentes(false);
    setSenhasDiferentes("");
    setQtd("1");
  }

  function alternar(proximo: boolean) {
    if (salvando) return;
    setAberto(proximo);
    if (!proximo) limpar();
  }

  async function importar() {
    if (bloqueado) return;
    const nomes = nomesDosPerfis(perfis);
    setSalvando(true);
    try {
      await onImportar(
        validas.flatMap((conta) =>
          nomes.map((perfil) => ({
            categoriaId: categoria.id,
            email: conta.email,
            senha: conta.senha,
            perfil,
            pin: "",
            obs: "",
            status: "DISPONIVEL" as const,
          })),
        ),
      );
    } catch {
      toast.error("Não foi possível importar. Nenhuma conta foi salva.");
      setSalvando(false);
      return;
    }
    setSalvando(false);
    setAberto(false);
    limpar();
    toast.success(`${validas.length} conta(s) importada(s)`);
  }

  return (
    <Dialog open={aberto} onOpenChange={alternar}>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <Upload className="size-4" /> Importar em massa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar contas em {categoria.nome}</DialogTitle>
          <DialogDescription>
            Cole os e-mails, um por linha, e informe a senha usada por eles.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lista-emails">E-mails</Label>
            <Textarea
              id="lista-emails"
              rows={7}
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              placeholder={"conta1@email.com\nconta2@email.com"}
              className="linha-mono"
              {...camposDeTexto}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <Label htmlFor="senha-todas">Senha de todas</Label>
              <Input
                id="senha-todas"
                value={senha}
                maxLength={MAX_SENHA}
                onChange={(e) => setSenha(e.target.value)}
                {...camposDeTexto}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="perfis-conta">Perfis por conta</Label>
              <Input
                id="perfis-conta"
                type="number"
                min={1}
                max={MAX_PERFIS_POR_CONTA}
                value={qtd}
                onChange={(e) => setQtd(e.target.value)}
                className="sm:w-32"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Switch
                id="tem-diferentes"
                checked={temDiferentes}
                onCheckedChange={setTemDiferentes}
              />
              <Label htmlFor="tem-diferentes">Alguma conta tem senha diferente</Label>
            </div>
            {temDiferentes && (
              <>
                <Textarea
                  id="senhas-diferentes"
                  aria-label="Contas com senha diferente"
                  rows={3}
                  value={senhasDiferentes}
                  onChange={(e) => setSenhasDiferentes(e.target.value)}
                  placeholder="conta2@email.com:outrasenha"
                  className="linha-mono"
                  {...camposDeTexto}
                />
                <p className="text-xs text-muted-foreground">
                  Coloque só as exceções, uma por linha. As demais usam a senha acima.
                </p>
              </>
            )}
          </div>

          {(emails.trim() || errosSenhas.length > 0) && (
            <div className="rounded-md border border-border p-3 text-sm" aria-live="polite">
              <p className="font-medium">
                {validas.length} conta(s) prontas · {total} perfil(is) · {ignoradas.length}{" "}
                ignorada(s)
              </p>
              {excedeu && (
                <p className="mt-1 text-destructive">
                  O limite é de {MAX_LINHAS_IMPORTACAO} perfis por importação.
                </p>
              )}
              {errosSenhas.length > 0 && (
                <ul className="mt-2 max-h-24 space-y-1 overflow-y-auto text-xs text-destructive">
                  {errosSenhas.map(({ numero, motivo }) => (
                    <li key={numero}>
                      Senhas diferentes, linha {numero}: {MOTIVOS_SENHA[motivo]}
                    </li>
                  ))}
                </ul>
              )}
              {ignoradas.length > 0 && (
                <ul className="mt-2 max-h-28 space-y-1 overflow-y-auto text-xs text-muted-foreground">
                  {ignoradas.map(({ numero, motivo }) => (
                    <li key={numero}>
                      Linha {numero}: {MOTIVOS[motivo]}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={importar} disabled={bloqueado || salvando}>
            {salvando
              ? "Importando..."
              : `Importar ${validas.length || ""} conta${validas.length === 1 ? "" : "s"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
