import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageTitle } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { actions, uid, useStore, type Local } from "@/lib/store";

export const Route = createFileRoute("/locales")({
  head: () => ({
    meta: [
      { title: "Locales · Gestión Lotería" },
      { name: "description", content: "Bares y quioscos del segundo canal." },
      { property: "og:title", content: "Locales · Gestión Lotería" },
      { property: "og:description", content: "Bares y quioscos del segundo canal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Locales,
});

const vacio: Local = { id: "", nombre: "", direccion: "", telefono: "" };

function Locales() {
  const { locales, decimos } = useStore();
  const [f, setF] = useState<Local>(vacio);

  return (
    <>
      <PageTitle sub="Bares, quioscos y demás puntos de venta">Locales de segundo canal</PageTitle>
      <form className="mb-6 grid gap-2 rounded-2xl border border-border bg-card p-4 sm:grid-cols-4"
        onSubmit={(e) => { e.preventDefault(); if (!f.nombre) return; actions.guardarLocal({ ...f, id: f.id || uid() }); setF(vacio); }}>
        <Input placeholder="Nombre" value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} />
        <Input placeholder="Dirección" value={f.direccion} onChange={(e) => setF({ ...f, direccion: e.target.value })} />
        <Input placeholder="Teléfono (ej. 34600111222)" inputMode="tel" value={f.telefono} onChange={(e) => setF({ ...f, telefono: e.target.value })} />
        <Button>{f.id ? "Guardar cambios" : "Añadir local"}</Button>
      </form>
      <div className="grid gap-3 sm:grid-cols-2">
        {locales.map((l) => {
          const asig = decimos.filter((d) => d.ubicacion === l.id);
          return (
            <div key={l.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-semibold">{l.nombre}</h3>
                  <p className="text-sm text-muted-foreground">{l.direccion} · {l.telefono}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button size="sm" variant="secondary" onClick={() => setF(l)}>Editar</Button>
                  <Button size="sm" variant="ghost" onClick={() => actions.eliminarLocal(l.id)}>Borrar</Button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {asig.map((d) => <span key={d.id} className="rounded-md bg-secondary px-2 py-1 font-mono text-sm">{d.numero} ×{d.cantidad}</span>)}
                {!asig.length && <span className="text-sm text-muted-foreground">Sin décimos asignados</span>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
