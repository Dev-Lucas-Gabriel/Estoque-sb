import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type TipoCategoria = "PRIVADO" | "COMPARTILHADO";

export interface Categoria {
  id: string;
  nome: string;
  tipo: TipoCategoria;
  template: string;
  criadoEm: number;
}

export type StatusConta = "DISPONIVEL" | "VENDIDO";

export interface Conta {
  id: string;
  categoriaId: string;
  email: string;
  senha: string;
  perfil: string;
  pin: string;
  status: StatusConta;
  obs: string;
  criadoEm: number;
}

export interface EstoqueData {
  categorias: Categoria[];
  contas: Conta[];
}

export const TEMPLATE_PADRAO =
  "{CATEGORIA} : {EMAIL} // Senha: {SENHA} - PERFIL: {PERFIL} // SUPORTE APENAS VIA WHATSAPP";

export const TEMPLATE_PADRAO_PRIVADO =
  "{CATEGORIA} : {EMAIL} // Senha: {SENHA} - PERFIL: {PERFIL} // SUPORTE APENAS VIA WHATSAPP";

const EMPTY: EstoqueData = { categorias: [], contas: [] };

const listeners = new Set<() => void>();
let cache: EstoqueData = EMPTY;
let carregado = false;
let carregando: Promise<void> | null = null;

function emit() {
  listeners.forEach((l) => l());
}

type LinhaCategoria = {
  id: string;
  nome: string;
  tipo: string;
  template: string | null;
  created_at: string;
};

type LinhaConta = {
  id: string;
  categoria_id: string;
  email: string;
  senha: string;
  perfil: string;
  pin: string;
  status: string;
  obs: string;
  created_at: string;
};

function mapCategoria(r: LinhaCategoria): Categoria {
  return {
    id: r.id,
    nome: r.nome,
    tipo: (r.tipo as TipoCategoria) ?? "COMPARTILHADO",
    template: r.template || TEMPLATE_PADRAO,
    criadoEm: new Date(r.created_at).getTime(),
  };
}

function mapConta(r: LinhaConta): Conta {
  return {
    id: r.id,
    categoriaId: r.categoria_id,
    email: r.email,
    senha: r.senha,
    perfil: r.perfil,
    pin: r.pin,
    status: (r.status as StatusConta) ?? "DISPONIVEL",
    obs: r.obs,
    criadoEm: new Date(r.created_at).getTime(),
  };
}

async function carregar(force = false) {
  if (carregando) return carregando;
  if (carregado && !force) return;
  carregando = (async () => {
    const { data: sessao } = await supabase.auth.getSession();
    if (!sessao.session) {
      cache = EMPTY;
      carregado = true;
      emit();
      return;
    }
    const [cats, cts] = await Promise.all([
      supabase.from("categorias").select("*").order("created_at", { ascending: true }),
      supabase.from("contas").select("*").order("created_at", { ascending: true }),
    ]);
    cache = {
      categorias: ((cats.data as LinhaCategoria[] | null) ?? []).map(mapCategoria),
      contas: ((cts.data as LinhaConta[] | null) ?? []).map(mapConta),
    };
    carregado = true;
    emit();
  })().finally(() => {
    carregando = null;
  });
  return carregando;
}

export function limparEstoqueLocal() {
  cache = EMPTY;
  carregado = false;
  emit();
}

export function montarLinha(categoria: Categoria, conta: Conta) {
  return (categoria.template || TEMPLATE_PADRAO)
    .replaceAll("{CATEGORIA}", categoria.nome.toUpperCase())
    .replaceAll("{EMAIL}", conta.email)
    .replaceAll("{SENHA}", conta.senha)
    .replaceAll("{PERFIL}", conta.perfil)
    .replaceAll("{PIN}", conta.pin);
}

export function useEstoque() {
  const [data, setData] = useState<EstoqueData>(cache);
  const [pronto, setPronto] = useState(carregado);

  useEffect(() => {
    const sync = () => {
      setData({ ...cache });
      setPronto(carregado);
    };
    listeners.add(sync);
    sync();
    void carregar().then(sync);
    const { data: sub } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === "SIGNED_IN" || evento === "SIGNED_OUT") {
        carregado = false;
        void carregar(true);
      }
    });
    return () => {
      listeners.delete(sync);
      sub.subscription.unsubscribe();
    };
  }, []);

  const addCategoria = useCallback(async (nome: string, tipo: TipoCategoria, template: string) => {
    const { data: user } = await supabase.auth.getUser();
    const { data: row, error } = await supabase
      .from("categorias")
      .insert({
        nome: nome.trim(),
        tipo,
        template: template.trim() || TEMPLATE_PADRAO,
        user_id: user.user?.id as string,
      })
      .select()
      .single();
    if (error || !row) throw error ?? new Error("Falha ao criar categoria");
    const cat = mapCategoria(row as LinhaCategoria);
    cache = { ...cache, categorias: [...cache.categorias, cat] };
    emit();
    return cat;
  }, []);

  const updateCategoria = useCallback(async (id: string, patch: Partial<Categoria>) => {
    cache = {
      ...cache,
      categorias: cache.categorias.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    };
    emit();
    await supabase
      .from("categorias")
      .update({
        ...(patch.nome !== undefined ? { nome: patch.nome } : {}),
        ...(patch.tipo !== undefined ? { tipo: patch.tipo } : {}),
        ...(patch.template !== undefined ? { template: patch.template } : {}),
      })
      .eq("id", id);
  }, []);

  const removeCategoria = useCallback(async (id: string) => {
    cache = {
      categorias: cache.categorias.filter((c) => c.id !== id),
      contas: cache.contas.filter((c) => c.categoriaId !== id),
    };
    emit();
    await supabase.from("categorias").delete().eq("id", id);
  }, []);

  const addContas = useCallback(async (contas: Omit<Conta, "id" | "criadoEm">[]) => {
    if (contas.length === 0) return [];
    const { data: user } = await supabase.auth.getUser();
    const userId = user.user?.id as string;
    const { data: rows, error } = await supabase
      .from("contas")
      .insert(
        contas.map((conta) => ({
          categoria_id: conta.categoriaId,
          email: conta.email,
          senha: conta.senha,
          perfil: conta.perfil,
          pin: conta.pin,
          status: conta.status,
          obs: conta.obs,
          user_id: userId,
        })),
      )
      .select();
    if (error || !rows) throw error ?? new Error("Falha ao salvar conta");
    const novas = (rows as LinhaConta[]).map(mapConta);
    cache = { ...cache, contas: [...cache.contas, ...novas] };
    emit();
    return novas;
  }, []);

  const addConta = useCallback(
    async (conta: Omit<Conta, "id" | "criadoEm">) => {
      const [nova] = await addContas([conta]);
      return nova;
    },
    [addContas],
  );

  const updateConta = useCallback(async (id: string, patch: Partial<Conta>) => {
    cache = {
      ...cache,
      contas: cache.contas.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    };
    emit();
    await supabase
      .from("contas")
      .update({
        ...(patch.email !== undefined ? { email: patch.email } : {}),
        ...(patch.senha !== undefined ? { senha: patch.senha } : {}),
        ...(patch.perfil !== undefined ? { perfil: patch.perfil } : {}),
        ...(patch.pin !== undefined ? { pin: patch.pin } : {}),
        ...(patch.status !== undefined ? { status: patch.status } : {}),
        ...(patch.obs !== undefined ? { obs: patch.obs } : {}),
      })
      .eq("id", id);
  }, []);

  const removeConta = useCallback(async (id: string) => {
    cache = { ...cache, contas: cache.contas.filter((c) => c.id !== id) };
    emit();
    await supabase.from("contas").delete().eq("id", id);
  }, []);

  return {
    ...data,
    pronto,
    addCategoria,
    updateCategoria,
    removeCategoria,
    addConta,
    addContas,
    updateConta,
    removeConta,
  };
}
