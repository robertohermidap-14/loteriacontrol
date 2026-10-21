import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { PageTitle } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Firma } from "@/components/Firma";
import { actions, CENTRAL, useStore, type Decimo } from "@/lib/store";

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

const suma = (l: Decimo[]) => l.reduce((s, d) => s + d.cantidad, 0);

function Asignar() {
  const { locales, decimos } = useStore();
  const nav = useNavigate();
  const [localId, setLocalId] = useState("");
  const [cant, setCant] = useState<Record<string, number>>({});
  const [abierto, setAbierto] = useState<string | null>(null);
  const [tipo, setTipo] = useState<"entrega" | "deposito">("entrega");
  const [nombre, setNombre] = useState("");
  const [dni, setDni] = useState("");
  const [firma, setFirma] = useState("");
  const total = Object.values(cant).reduce((s, n) => s + n, 0);

  const grupos = new Map<string, Decimo[]>();
  for (const d of decimos) if (d.ubicacion === CENTRAL) grupos.set(d.numero, [...(grupos.get(d.numero) ?? []), d]);
  const numeros = [...grupos.keys()].sort();

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
        {numeros.map((num) => {
          const items = grupos.get(num)!;
          const open = abierto === num;
          const elegidos = items.reduce((s, d) => s + (cant[d.id] ?? 0), 0);
          return (
            <div key={num} className="rounded-xl border border-border bg-card">
              <button className="flex w-full items-center gap-3 p-3 text-left" onClick={() => setAbierto(open ? null : num)}>
                <span className="font-mono text-2xl font-bold text-primary">{num}</span>
                <span className="flex-1 text-sm text-muted-foreground">{items.length} {items.length === 1 ? "serie" : "series"} · Disp: {suma(items)}</span>
                {elegidos > 0 && <span className="rounded-md bg-primary px-2 py-1 text-sm font-bold text-primary-foreground">{elegidos}</span>}
                <ChevronDown className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`} />
              </button>
              {open && (
                <div className="space-y-2 border-t border-border p-3">
                  {items.sort((a, b) => a.serie.localeCompare(b.serie, undefined, { numeric: true })).map((d) => (
                    <div key={d.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg bg-secondary/50 p-2">
                      <div className="min-w-0 text-sm">
                        Serie {d.serie || "—"} · Fracción {d.fraccion || "—"}
                        {d.estado === "recepcion" && <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs font-semibold">RECEPCIÓN</span>}
                        <span className="ml-2 text-muted-foreground">Disp: {d.cantidad}</span>
                      </div>
                      <Input type="number" min={0} max={d.cantidad} className="w-24" value={cant[d.id] ?? 0}
                        onChange={(e) => setCant({ ...cant, [d.id]: Math.min(d.cantidad, Math.max(0, +e.target.value)) })} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {!numeros.length && <p className="text-muted-foreground">No hay stock en la Administración.</p>}
      </div>
      <div className="mt-6 grid grid-cols-2 gap-2">
        <Button variant={tipo === "entrega" ? "default" : "secondary"} onClick={() => setTipo("entrega")}>Entrega</Button>
        <Button variant={tipo === "deposito" ? "default" : "secondary"} onClick={() => setTipo("deposito")}>Depósito</Button>
      </div>
      {tipo === "deposito" && (
        <div className="mt-4 space-y-3 rounded-2xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Fecha del depósito: <b>{new Date().toLocaleDateString("es-ES")}</b></p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div><Label>Nombre de quien recoge</Label><Input value={nombre} onChange={(e) => setNombre(e.target.value)} /></div>
            <div><Label>DNI</Label><Input value={dni} onChange={(e) => setDni(e.target.value.toUpperCase())} /></div>
          </div>
          <div><Label>Firma</Label><Firma onChange={setFirma} /></div>
        </div>
      )}
      <Button size="lg" className="mt-6 h-14 w-full text-lg" disabled={!localId || !total || (tipo === "deposito" && (!nombre || !dni || !firma))}
        onClick={async () => { const id = await actions.crearAlbaran(localId, Object.entries(cant).map(([decimoId, cantidad]) => ({ decimoId, cantidad })), { tipo, receptorNombre: nombre, receptorDni: dni, firma }); nav({ to: "/albaran/$id", params: { id } }); }}>
        Generar albarán {tipo === "deposito" ? "de depósito " : ""}({total} décimos)
      </Button>
    </>
  );
}
