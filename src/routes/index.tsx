import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { PageTitle } from "@/components/AppShell";
import { CENTRAL, nombreUbicacion, useStore, type Decimo } from "@/lib/store";

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

function Index() {
  const { decimos, locales } = useStore();
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
          <h2 className="mb-3 text-lg font-semibold">Terminados en {t} · {numeros.reduce((s, n) => s + suma(grupos.get(n)!), 0)} décimos</h2>
          {numeros.length === 0 ? <p className="text-muted-foreground">No hay números en stock con esta terminación.</p> : (
            <div className="space-y-2">
              {numeros.map((num) => {
                const items = grupos.get(num)!;
                const open = abierto === num;
                return (
                  <div key={num} className="rounded-xl border border-border bg-card">
                    <button className="flex w-full items-center gap-3 p-4 text-left" onClick={() => setAbierto(open ? null : num)}>
                      <span className="font-mono text-3xl font-bold tracking-wider text-primary">{num}</span>
                      <span className="flex-1 text-sm text-muted-foreground">{items.length} {items.length === 1 ? "serie" : "series"}</span>
                      <span className="text-xl font-semibold">{suma(items)} déc.</span>
                      <ChevronDown className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`} />
                    </button>
                    {open && (
                      <div className="space-y-1 border-t border-border p-3">
                        {items.sort((a, b) => a.serie.localeCompare(b.serie, undefined, { numeric: true })).map((d) => (
                          <div key={d.id} className="flex items-center justify-between gap-2 rounded-lg bg-secondary/50 px-3 py-2">
                            <span className="text-sm">Serie {d.serie || "—"} · Fracción {d.fraccion || "—"}</span>
                            <span className="text-sm font-semibold">{d.cantidad} déc.</span>
                            <span className={`truncate text-sm ${d.ubicacion === CENTRAL ? "text-accent" : "text-foreground"}`}>📍 {nombreUbicacion(d.ubicacion, locales)}</span>
                          </div>
                        ))}
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
