import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageTitle } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { actions, CENTRAL, useStore } from "@/lib/store";

export const Route = createFileRoute("/asignar")({
  head: () => ({
    meta: [
      { title: "Asignar a local · Gestión Lotería" },
      { name: "description", content: "Asigna décimos a un local y genera el albarán de entrega." },
      { property: "og:title", content: "Asignar a local · Gestión Lotería" },
      { property: "og:description", content: "Asigna décimos a un local y genera el albarán de entrega." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Asignar,
});

function Asignar() {
  const { locales, decimos } = useStore();
  const nav = useNavigate();
  const [localId, setLocalId] = useState("");
  const [cant, setCant] = useState<Record<string, number>>({});
  const stock = decimos.filter((d) => d.ubicacion === CENTRAL).sort((a, b) => a.numero.localeCompare(b.numero));
  const total = Object.values(cant).reduce((s, n) => s + n, 0);

  return (
    <>
      <PageTitle sub="Elige el local y los décimos a entregar">Asignar lotería a local</PageTitle>
      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {locales.map((l) => (
          <Button key={l.id} variant={localId === l.id ? "default" : "secondary"} className="h-14 truncate" onClick={() => setLocalId(l.id)}>{l.nombre}</Button>
        ))}
        {!locales.length && <p className="col-span-full text-muted-foreground">Primero crea un local.</p>}
      </div>
      <div className="space-y-2">
        {stock.map((d) => (
          <div key={d.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border bg-card p-3">
            <div className="min-w-0"><span className="font-mono text-xl font-bold text-primary">{d.numero}</span><span className="ml-2 text-sm text-muted-foreground">Disp: {d.cantidad}</span></div>
            <Input type="number" min={0} max={d.cantidad} className="w-24" value={cant[d.id] ?? 0}
              onChange={(e) => setCant({ ...cant, [d.id]: Math.min(d.cantidad, Math.max(0, +e.target.value)) })} />
          </div>
        ))}
        {!stock.length && <p className="text-muted-foreground">No hay stock en la Administración.</p>}
      </div>
      <Button size="lg" className="mt-6 h-14 w-full text-lg" disabled={!localId || !total}
        onClick={() => { const id = actions.crearAlbaran(localId, Object.entries(cant).map(([decimoId, cantidad]) => ({ decimoId, cantidad }))); nav({ to: "/albaran/$id", params: { id } }); }}>
        Generar albarán ({total} décimos)
      </Button>
    </>
  );
}
