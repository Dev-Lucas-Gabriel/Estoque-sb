CREATE TABLE public.categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  nome text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('PRIVADO','COMPARTILHADO')),
  template text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.categorias TO authenticated;
GRANT ALL ON public.categorias TO service_role;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios gerenciam suas categorias" ON public.categorias FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.contas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  categoria_id uuid NOT NULL REFERENCES public.categorias(id) ON DELETE CASCADE,
  email text NOT NULL,
  senha text NOT NULL DEFAULT '',
  perfil text NOT NULL DEFAULT '',
  pin text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'DISPONIVEL' CHECK (status IN ('DISPONIVEL','VENDIDO')),
  obs text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contas TO authenticated;
GRANT ALL ON public.contas TO service_role;
ALTER TABLE public.contas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Usuarios gerenciam suas contas" ON public.contas FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_categorias_user ON public.categorias(user_id);
CREATE INDEX idx_contas_user ON public.contas(user_id);
CREATE INDEX idx_contas_categoria ON public.contas(categoria_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_categorias_updated_at BEFORE UPDATE ON public.categorias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contas_updated_at BEFORE UPDATE ON public.contas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();