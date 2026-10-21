import { Link } from "@tanstack/react-router";
import { Grid3x3, ScanLine, Package, Store, Truck, Users, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import { AuthGate, salir } from "@/components/AuthGate";
import { useSesion } from "@/lib/sesion";

const nav = [
  { to: "/", label: "Terminaciones", icon: Grid3x3 },
  { to: "/escaner", label: "Escáner", icon: ScanLine },
  { to: "/inventario", label: "Inventario", icon: Package },
  { to: "/locales", label: "Locales", icon: Store },
  { to: "/asignar", label: "Asignar", icon: Truck },
  { to: "/cobro", label: "Cobro", icon: Wallet },
];

export function AppShell({ children }: { children: ReactNode }) {
  const sesion = useSesion();
  const items = sesion.esAdmin ? [...nav, { to: "/usuarios", label: "Usuarios", icon: Users }] : nav;
  return (
    <AuthGate>
    <div className="min-h-screen bg-background pb-24">
      <header className="no-print sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary font-mono text-lg font-bold text-primary-foreground">L</div>
          <span className="flex-1 truncate font-semibold tracking-tight">Gestión Lotería</span>
          <button onClick={salir} className="shrink-0 text-sm text-muted-foreground hover:text-foreground">Salir</button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      <nav className="no-print fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card">
        <div className="mx-auto grid max-w-6xl" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
          {items.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} activeOptions={{ exact: to === "/" }}
              className="flex flex-col items-center gap-1 py-3 text-[11px] text-muted-foreground data-[status=active]:text-primary">
              <Icon className="h-6 w-6" />
              <span className="truncate">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
    </AuthGate>
  );
}

export function PageTitle({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{children}</h1>
      {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
    </div>
  );
}
