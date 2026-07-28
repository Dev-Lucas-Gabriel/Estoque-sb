import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useSessao() {
  const [sessao, setSessao] = useState<Session | null>(null);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, s) => {
      setSessao(s);
      setPronto(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSessao(data.session);
      setPronto(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { sessao, pronto, usuario: sessao?.user ?? null };
}

export async function sairDaConta() {
  await supabase.auth.signOut();
}
