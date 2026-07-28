import { Link, useRouterState } from "@tanstack/react-router";
import { Boxes, Layers, Lock, Share2 } from "lucide-react";
import { LoginGate } from "@/components/login-gate";

const links = [
  { to: "/", label: "Categorias", icon: Layers },
  { to: "/compartilhadas", label: "Compartilhadas", icon: Share2 },
  { to: "/privadas", label: "Privadas", icon: Lock },
] as const;


export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <LoginGate>
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Boxes className="size-5" />
            </span>
            <span className="text-base font-semibold tracking-tight">Estoque de Contas</span>
          </Link>
          <nav className="flex items-center gap-1">
            {links.map((l) => {
              const active = l.to === "/" ? pathname === "/" : pathname.startsWith(l.to);
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary/60"
                  }`}
                >
                  <l.icon className="size-4" />
                  <span className="hidden sm:inline">{l.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
    </LoginGate>
  );
}
