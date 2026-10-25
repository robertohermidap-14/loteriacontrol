import { Link } from "@tanstack/react-router";
import { Grid3x3, ScanLine, Package, Store, Truck, Users, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import { AuthGate, salir } from "@/components/AuthGate";
import { useSesion } from "@/lib/sesion";
import { useConfig } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { LOTERIAS, seleccionarLoteria, useLoteria } from "@/lib/loteria";

const nav = [
  { to: "/", label: "Stock", icon: Grid3x3 },
  { to: "/escaner", label: "Vender", icon: ScanLine },
  { to: "/inventario", label: "Entradas", icon: Package },
  { to: "/locales", label: "Depósitos", icon: Store },
  { to: "/asignar", label: "Entregar", icon: Truck },
  { to: "/caja", label: "Caja", icon: Wallet },
];

export function AppShell({ children }: { children: ReactNode }) {
  return <AuthGate><Shell>{children}</Shell></AuthGate>;
}

function Shell({ children }: { children: ReactNode }) {
  const sesion = useSesion();
  const config = useConfig();
  const loteria=useLoteria();
  const items = sesion.esAdmin ? [...nav, { to: "/usuarios", label: "Admin", icon: Users }] : nav;
  return (
    <>
    <div className="min-h-screen bg-background pb-24">
      <header className="no-print sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          {config?.logo
            ? <img src={config.logo} alt="Logo" className="h-9 w-9 shrink-0 rounded-lg object-contain" />
            : <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary font-mono text-lg font-bold text-primary-foreground">L</div>}
          <span className="flex-1 truncate font-semibold ">{config?.nombre || "Gestión Lotería"}</span>
          <Button variant="ghost" onClick={()=>{seleccionarLoteria(null);salir();}}>Salir</Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{loteria ? <><div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4"><p className="text-lg font-semibold">{LOTERIAS.find(l=>l.id===loteria)?.nombre}</p><Button variant="secondary" onClick={()=>seleccionarLoteria(null)}>Cambiar lotería</Button></div><div key={loteria}>{children}</div></> : <section className="py-8"><h1 className="mb-8 text-3xl font-bold">Seleccionar lotería</h1><div className="grid gap-4 sm:grid-cols-3">{LOTERIAS.map(l=><Button key={l.id} variant="secondary" className="h-32 whitespace-normal text-xl" onClick={()=>seleccionarLoteria(l.id)}>{l.nombre}</Button>)}</div></section>}</main>
      {loteria && <nav className="no-print fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card">
        <div className="mx-auto grid max-w-6xl" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
          {items.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} activeOptions={{ exact: to === "/" }}
              className="flex flex-col items-center min-h-16 gap-1 px-1 py-3 text-xs text-muted-foreground data-[status=active]:text-primary">
              <Icon className="h-6 w-6" />
              <span className="truncate">{label}</span>
            </Link>
          ))}
        </div>
      </nav>}
    </div>
    </>
  );
}

export function PageTitle({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold  sm:text-3xl">{children}</h1>
      {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
    </div>
  );
}
