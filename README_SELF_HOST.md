# Estoque de Contas — Self-Hosting Guide

Este guia explica como rodar o projeto **independentemente do Lovable**, usando seu próprio backend Supabase.

---

## 1. Requisitos

- Node.js 20+ (ou Bun)
- Conta no [Supabase](https://supabase.com) (plano gratuito já serve)
- Git (opcional, para versionamento)

---

## 2. Criar o backend no Supabase

1. Acesse https://supabase.com e crie um novo projeto.
2. Anote:
   - **Project URL** (ex: `https://xxxx.supabase.co`)
   - **Project API keys** → `anon public` (começa com `eyJ...`)
   - **Project ID** (última parte da URL)
3. No SQL Editor do Supabase, execute o conteúdo do arquivo `supabase/migrations/20260727190835_a1a9caf2-04c2-4d93-92d9-de2efb2c2883.sql`.

Isso criará as tabelas `categorias` e `contas` com RLS ativado para isolar os dados de cada usuário.

---

## 3. Configurar autenticação por e-mail

No painel do Supabase:

1. Vá em **Authentication → Providers → Email**.
2. Desative **Confirm email** se quiser que o login funcione imediatamente após o cadastro.
3. (Opcional) Configure **Site URL** e **Redirect URLs** para `http://localhost:8080` e o domínio final do deploy.

---

## 4. Configurar variáveis de ambiente

Renomeie `.env.example` para `.env` e preencha com os dados do seu Supabase:

```env
SUPABASE_PROJECT_ID="seu-project-id"
SUPABASE_PUBLISHABLE_KEY="sua-anon-key"
SUPABASE_URL="https://seu-projeto.supabase.co"
VITE_SUPABASE_PROJECT_ID="seu-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="sua-anon-key"
VITE_SUPABASE_URL="https://seu-projeto.supabase.co"
```

> A `anon key` é uma chave pública e pode ficar no frontend. Nunca coloque a `service_role` no `.env` de frontend.

---

## 5. Instalar e rodar localmente

```bash
# Usando Bun (recomendado)
bun install
bun run dev

# Ou usando npm
npm install
npm run dev
```

O app estará disponível em `http://localhost:8080`.

---

## 6. Fazer deploy (opcional)

Você pode fazer deploy do frontend em qualquer serviço estático (Vercel, Netlify, Cloudflare Pages, etc.).

Basta:

1. Fazer upload do código.
2. Configurar as mesmas variáveis de ambiente `VITE_*` no painel do serviço.
3. Rodar `npm run build` (ou `bun run build`).

O backend continuará sendo o seu projeto Supabase.

---

## 7. Estrutura do projeto

- `src/routes/auth.tsx` — tela de login/cadastro
- `src/routes/reset-password.tsx` — recuperação de senha
- `src/routes/index.tsx` — listagem de categorias
- `src/routes/categoria.$id.tsx` — gerenciamento de contas dentro de uma categoria
- `src/routes/compartilhadas.tsx` — busca de contas compartilhadas
- `src/routes/privadas.tsx` — busca de contas privadas
- `src/lib/estoque.ts` — lógica de CRUD com Supabase
- `supabase/migrations/` — schema do banco de dados

---

## Observações importantes

- Cada usuário vê apenas seus próprios dados graças às políticas RLS.
- O app usa **Supabase Auth** para login com e-mail e senha.
- A confirmação de e-mail está desativada por padrão neste projeto; ative no painel do Supabase se desejar.
