import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useSessao, sairDaConta } from "@/lib/auth";

export function LoginGate({ children }: { children: React.ReactNode }) {
  const { sessao, pronto, usuario } = useSessao();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (pronto && !sessao) {
      navigate({ to: "/auth", search: { redirect: pathname }, replace: true });
    }
  }, [pronto, sessao, navigate, pathname]);

  if (!pronto || !sessao) return null;

  return (
    <>
      <div className="fixed bottom-4 right-4 z-30 flex items-center gap-2 rounded-full border border-border bg-background/90 px-3 py-2 text-xs text-muted-foreground shadow-lg backdrop-blur">
        <span className="max-w-[160px] truncate">{usuario?.email}</span>
        <button
          onClick={async () => {
            await sairDaConta();
            navigate({ to: "/auth", search: { redirect: "/" }, replace: true });
          }}
          className="inline-flex items-center gap-1 rounded-full px-2 py-1 transition-colors hover:text-foreground"
        >
          <LogOut className="size-3.5" /> Sair
        </button>
      </div>
      {children}
    </>
  );
}
