import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageTitle } from "@/components/AppShell";
import { CENTRAL, nombreUbicacion, useStore } from "@/lib/store";

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

function Index() {
  const { decimos, locales } = useStore();
  const [t, setT] = useState<number | null>(null);
  const res = t === null ? [] : decimos.filter((d) => d.numero.endsWith(String(t))).sort((a, b) => a.numero.localeCompare(b.numero));

  return (
    <>
      <PageTitle sub="Pulsa una terminación para ver los números en stock">Panel de terminaciones</PageTitle>
      <div className="grid grid-cols-5 gap-3">
        {Array.from({ length: 10 }, (_, i) => (
          <button key={i} onClick={() => setT(i)}
            className={`aspect-square rounded-2xl border font-mono text-4xl font-bold transition sm:text-6xl ${t === i ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary"}`}>
            {i}
          </button>
        ))}
      </div>
      {t !== null && (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">Terminados en {t} · {res.reduce((s, d) => s + d.cantidad, 0)} décimos</h2>
          {res.length === 0 ? <p className="text-muted-foreground">No hay números en stock con esta terminación.</p> : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {res.map((d) => (
                <div key={d.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="font-mono text-3xl font-bold tracking-wider text-primary">{d.numero}</div>
                  <div className="text-xs text-muted-foreground">Serie {d.serie} · Fracción {d.fraccion}</div>
                  <div className="mt-2 text-xl font-semibold">{d.cantidad} déc.</div>
                  <div className={`mt-1 truncate text-sm ${d.ubicacion === CENTRAL ? "text-accent" : "text-foreground"}`}>📍 {nombreUbicacion(d.ubicacion, locales)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
