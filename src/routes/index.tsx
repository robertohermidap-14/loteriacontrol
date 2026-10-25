import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { PageTitle } from "@/components/AppShell";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { actions, CENTRAL, nombreUbicacion, useStore, type Decimo, type Local } from "@/lib/store";
import { stockLocales } from "@/lib/contabilidad";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Terminaciones · Gestión Lotería" },
      { name: "description", content: "Busca décimos en stock por terminación y mira dónde están." },
      { property: "og:title", content: "Terminaciones · Gestión Lotería" },
      { property: "og:description", content: "Busca décimos en stock por terminación y mira dónde están." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const suma = (l: Decimo[]) => l.reduce((s, d) => s + d.cantidad, 0);

type Serie = { clave: string; serie: string; ubicacion: string; items: Decimo[] };
function series(items: Decimo[]): Serie[] {
  const m = new Map<string, Serie>();
  for (const d of items) {
    const clave = `${d.ubicacion}|${d.serie}`;
    const s = m.get(clave) ?? { clave, serie: d.serie, ubicacion: d.ubicacion, items: [] };
    s.items.push(d); m.set(clave, s);
  }
  return [...m.values()].sort((a, b) => a.serie.localeCompare(b.serie, undefined, { numeric: true }));
}

function SerieFila({ serie, ubicacion, items, locales }: Serie & { locales: Local[] }) {
  const [abierta, setAbierta] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const enRecepcion = items.filter((d) => d.estado === "recepcion");
  const enVenta = suma(items.filter((d) => d.estado === "venta"));
  const puedeVender = ubicacion === CENTRAL && enRecepcion.length > 0;
  const activar = async (ids: string[]) => {
    setOcupado(true);
    try { for (const id of ids) await actions.ponerEnVenta(id); toast.success("Puesto en venta"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "No se pudo poner en venta"); }
    finally { setOcupado(false); }
  };
  const fracs = [...items].sort((a, b) => a.fraccion.localeCompare(b.fraccion, undefined, { numeric: true }));
  return (
    <div className="rounded-lg bg-secondary/50">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2">
        <span className="font-semibold">Serie {serie || "—"}</span>
        <span className="text-sm">{suma(items)} déc.</span>
        <span className="text-xs text-muted-foreground">{enVenta} en venta{enRecepcion.length ? ` · ${suma(enRecepcion)} en recepción` : ""}</span>
        <span className={`flex-1 truncate text-right text-sm ${ubicacion === CENTRAL ? "text-accent" : "text-foreground"}`}>📍 {nombreUbicacion(ubicacion, locales)}</span>
        {puedeVender && <Button size="sm" disabled={ocupado} onClick={() => activar(enRecepcion.map((d) => d.id))}>Poner serie en venta</Button>}
        <Button size="sm" variant="ghost" aria-label="Ver fracciones" onClick={() => setAbierta(!abierta)}>
          Fracciones <ChevronDown className={`h-4 w-4 transition-transform ${abierta ? "rotate-180" : ""}`} />
        </Button>
      </div>
      {abierta && (
        <div className="grid grid-cols-2 gap-1 border-t border-border p-2 sm:grid-cols-5">
          {fracs.map((d) => (
            <div key={d.id} className="flex items-center justify-between gap-1 rounded-md bg-card px-2 py-1 text-sm">
              <span>Fr. {d.fraccion || "—"} · {d.cantidad}</span>
              {d.estado === "venta"
                ? <span className="text-xs font-semibold text-primary">Venta</span>
                : ubicacion === CENTRAL
                  ? <Button size="sm" variant="secondary" className="h-7 px-2 text-xs" disabled={ocupado} onClick={() => activar([d.id])}>Activar</Button>
                  : <span className="text-xs text-muted-foreground">Recep.</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Index() {
  const { decimos, locales, albaranes } = useStore();
  const [t, setT] = useState<number | null>(null);
  const [abierto, setAbierto] = useState<string | null>(null);

  const grupos = new Map<string, Decimo[]>();
  if (t !== null) for (const d of decimos) if (d.numero.endsWith(String(t))) grupos.set(d.numero, [...(grupos.get(d.numero) ?? []), d]);
  const numeros = [...grupos.keys()].sort();

  return (
    <>
      <PageTitle sub="Pulsa una terminación para ver los números en stock">Panel de terminaciones</PageTitle>
      <div className="grid grid-cols-5 gap-3">
        {Array.from({ length: 10 }, (_, i) => (
          <button key={i} onClick={() => { setT(i); setAbierto(null); }}
            className={`aspect-square rounded-2xl border font-mono text-4xl font-bold transition sm:text-6xl ${t === i ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary"}`}>
            {i}
          </button>
        ))}
      </div>
      {t !== null && (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">Terminados en {t} · {numeros.reduce((s, n) => s + suma(grupos.get(n)!.filter((d) => d.ubicacion === CENTRAL)), 0)} décimos en administración</h2>
          {numeros.length === 0 ? <p className="text-muted-foreground">No hay números en stock con esta terminación.</p> : (
            <div className="space-y-2">
              {numeros.map((num) => {
                const items = grupos.get(num)!;
                const centrales = items.filter((d) => d.ubicacion === CENTRAL);
                const porLocal = stockLocales(items, albaranes, num);
                const open = abierto === num;
                return (
                  <div key={num} className="rounded-xl border border-border bg-card">
                    <button className="flex w-full items-center gap-3 p-4 text-left" onClick={() => setAbierto(open ? null : num)}>
                      <span className="font-mono text-3xl font-bold tracking-wider text-primary">{num}</span>
                      <span className="flex-1 text-sm text-muted-foreground">{series(centrales).length} {series(centrales).length === 1 ? "serie" : "series"} en administración{porLocal.size ? ` · ${porLocal.size} ${porLocal.size === 1 ? "local" : "locales"}` : ""}</span>
                      <span className="text-xl font-semibold">{suma(centrales)} déc.</span>
                      <ChevronDown className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`} />
                    </button>
                    {open && (
                      <div className="space-y-3 border-t border-border p-3">
                        <p className="text-sm font-semibold">Administración · {suma(centrales)} disponibles</p>
                        {series(centrales).map((s) => <SerieFila key={s.clave} {...s} locales={locales} />)}
                        {porLocal.size > 0 && (
                          <div className="space-y-1 pt-1">
                            <p className="text-sm font-semibold">Locales asignados</p>
                            {[...porLocal].map(([id, s]) => (
                              <div key={id} className="flex flex-wrap items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2 text-sm">
                                <span className="min-w-0 flex-1 truncate font-medium">📍 {nombreUbicacion(id, locales)}</span>
                                <span className="text-muted-foreground">Asignados {s.asignado} · Cobrados {s.cobrado}</span>
                                <span className="font-bold">{s.disponible} disp.</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
}
