import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { PageTitle } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { actions, CENTRAL, nombreUbicacion, useStore } from "@/lib/store";

export const Route = createFileRoute("/inventario")({
  head: () => ({
    meta: [
      { title: "Inventario · Gestión Lotería" },
      { name: "description", content: "Stock completo de décimos y su ubicación." },
      { property: "og:title", content: "Inventario · Gestión Lotería" },
      { property: "og:description", content: "Stock completo de décimos y su ubicación." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Inventario,
});

function Inventario() {
  const { decimos, locales } = useStore();
  const [f, setF] = useState({ numero: "", serie: "", fraccion: "", cantidad: 1 });
  const [q, setQ] = useState("");
  const lista = decimos.filter((d) => d.numero.includes(q)).sort((a, b) => a.numero.localeCompare(b.numero));

  return (
    <>
      <PageTitle sub={`${decimos.reduce((s, d) => s + d.cantidad, 0)} décimos en total`}>Inventario</PageTitle>
      <form className="mb-6 grid grid-cols-2 gap-2 rounded-2xl border border-border bg-card p-4 sm:grid-cols-5"
        onSubmit={(e) => { e.preventDefault(); if (!/^\d{5}$/.test(f.numero)) return; actions.altaDecimo({ ...f, ubicacion: CENTRAL }); setF({ numero: "", serie: "", fraccion: "", cantidad: 1 }); }}>
        <Input placeholder="Número (5)" maxLength={5} inputMode="numeric" value={f.numero} onChange={(e) => setF({ ...f, numero: e.target.value.replace(/\D/g, "") })} />
        <Input placeholder="Serie" value={f.serie} onChange={(e) => setF({ ...f, serie: e.target.value })} />
        <Input placeholder="Fracción" value={f.fraccion} onChange={(e) => setF({ ...f, fraccion: e.target.value })} />
        <Input type="number" min={1} value={f.cantidad} onChange={(e) => setF({ ...f, cantidad: Math.max(1, +e.target.value) })} />
        <Button className="col-span-2 sm:col-span-1">Añadir</Button>
      </form>
      <Input className="mb-4" placeholder="Buscar número…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="space-y-2">
        {lista.map((d) => (
          <div key={d.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-card p-3">
            <div className="min-w-0">
              <span className="font-mono text-xl font-bold text-primary">{d.numero}</span>
              <span className="ml-2 text-xs text-muted-foreground">S{d.serie} F{d.fraccion}</span>
              <div className="truncate text-sm text-muted-foreground">{nombreUbicacion(d.ubicacion, locales)}</div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="icon" variant="secondary" onClick={() => actions.restar(d.id, 1)}>−</Button>
              <span className="w-8 text-center font-semibold">{d.cantidad}</span>
              <Button size="icon" variant="secondary" onClick={() => actions.sumar(d.id, 1)}>+</Button>
              <Button size="icon" variant="ghost" onClick={() => actions.eliminarDecimo(d.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
        {!lista.length && <p className="text-muted-foreground">Sin décimos.</p>}
      </div>
    </>
  );
}
