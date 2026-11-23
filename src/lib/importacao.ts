export const MAX_EMAIL = 255;
export const MAX_SENHA = 120;
export const MAX_PERFIS_POR_CONTA = 20;
export const MAX_LINHAS_IMPORTACAO = 1000;

export interface ContaImportada {
  email: string;
  senha: string;
}

export type MotivoIgnorada =
  "formato" | "email-longo" | "senha-longa" | "sem-senha" | "repetida" | "existente";

export type MotivoErroSenha = "formato" | "senha-longa" | "repetida" | "fora-da-lista";

export interface LinhaIgnorada {
  numero: number;
  motivo: MotivoIgnorada;
}

export interface ErroSenha {
  numero: number;
  motivo: MotivoErroSenha;
}

export interface EntradaImportacao {
  emails: string;
  senhaPadrao: string;
  senhasDiferentes?: string;
}

export interface ResultadoImportacao {
  validas: ContaImportada[];
  ignoradas: LinhaIgnorada[];
  errosSenhas: ErroSenha[];
}

const EMAIL = /^[^\s:;|,]+@[^\s:;|,]+\.[^\s:;|,]+$/;
// O separador é o primeiro após o e-mail, então a senha pode conter ":", ";", "|" etc.
const EMAIL_E_SENHA = /^([^\s:;|,]+@[^\s:;|,]+\.[^\s:;|,]+)\s*(?:[:;|,\t]|\s)\s*(\S(?:.*\S)?)$/;

function linhasPreenchidas(texto: string) {
  return texto
    .split(/\r?\n/)
    .map((bruta, indice) => ({ numero: indice + 1, linha: bruta.trim() }))
    .filter(({ linha }) => linha);
}

export function analisarImportacao(
  { emails, senhaPadrao, senhasDiferentes = "" }: EntradaImportacao,
  emailsExistentes: Iterable<string> = [],
): ResultadoImportacao {
  const existentes = new Set([...emailsExistentes].map((e) => e.trim().toLowerCase()));
  const padrao = senhaPadrao.trim();
  const errosSenhas: ErroSenha[] = [];
  const excecoes = new Map<string, { numero: number; senha: string }>();

  for (const { numero, linha } of linhasPreenchidas(senhasDiferentes)) {
    const achado = EMAIL_E_SENHA.exec(linha);
    if (!achado) {
      errosSenhas.push({ numero, motivo: "formato" });
      continue;
    }
    const [, email, senha] = achado;
    const chave = email.toLowerCase();
    if (senha.length > MAX_SENHA) errosSenhas.push({ numero, motivo: "senha-longa" });
    else if (excecoes.has(chave)) errosSenhas.push({ numero, motivo: "repetida" });
    else excecoes.set(chave, { numero, senha });
  }

  const informados = new Set<string>();
  const vistos = new Set<string>();
  const validas: ContaImportada[] = [];
  const ignoradas: LinhaIgnorada[] = [];

  for (const { numero, linha } of linhasPreenchidas(emails)) {
    const comSenha = EMAIL.test(linha) ? null : EMAIL_E_SENHA.exec(linha);
    if (!EMAIL.test(linha) && !comSenha) {
      ignoradas.push({ numero, motivo: "formato" });
      continue;
    }
    const email = comSenha ? comSenha[1] : linha;
    const chave = email.toLowerCase();
    informados.add(chave);
    const senha = excecoes.get(chave)?.senha ?? comSenha?.[2] ?? padrao;

    if (email.length > MAX_EMAIL) ignoradas.push({ numero, motivo: "email-longo" });
    else if (existentes.has(chave)) ignoradas.push({ numero, motivo: "existente" });
    else if (vistos.has(chave)) ignoradas.push({ numero, motivo: "repetida" });
    else if (!senha) ignoradas.push({ numero, motivo: "sem-senha" });
    else if (senha.length > MAX_SENHA) ignoradas.push({ numero, motivo: "senha-longa" });
    else {
      vistos.add(chave);
      validas.push({ email, senha });
    }
  }

  for (const [chave, { numero }] of excecoes) {
    if (!informados.has(chave)) errosSenhas.push({ numero, motivo: "fora-da-lista" });
  }
  errosSenhas.sort((a, b) => a.numero - b.numero);

  return { validas, ignoradas, errosSenhas };
}

export function nomesDosPerfis(quantidade: number) {
  return Array.from({ length: quantidade }, (_, i) => `P${String(i + 1).padStart(2, "0")}`);
}
