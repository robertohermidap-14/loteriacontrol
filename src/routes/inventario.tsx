import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, ChevronDown, Loader2, Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ListaVirtual } from "@/components/ListaVirtual";
import { PageTitle } from "@/components/AppShell";
import { EntradaForm } from "@/components/EntradaForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { actions, CENTRAL, nombreUbicacion, useStore, type Decimo } from "@/lib/store";

export const Route = createFileRoute("/inventario")({
  head: () => ({
    meta: [
      { title: "Inventario · Gestión Lotería" },
      { name: "description", content: "Stock general por número y desglose por ubicación." },
      { property: "og:title", content: "Inventario · Gestión Lotería" },
      { property: "og:description", content: "Stock general por número y desglose por ubicación." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Inventario,
});

const suma = (l: Decimo[]) => l.reduce((s, d) => s + d.cantidad, 0);

function Inventario() {
  const { decimos, locales } = useStore();
  const [nuevo, setNuevo] = useState("");
  const [alta, setAlta] = useState<string | null>(null);
  const [venta, setVenta] = useState<Record<string,number>>({});
  const [q, setQ] = useState("");
  const [abierto, setAbierto] = useState<string | null>(null);
  const [activando,setActivando]=useState<string|null>(null);
  const [progreso,setProgreso]=useState(0);
  const [activado,setActivado]=useState<string|null>(null);
  const activar=async(key:string,items:Decimo[])=>{setActivando(key);setProgreso(0);setActivado(null);try{for(let i=0;i<items.length;i++){await actions.ponerEnVenta(items[i].id,items[i].cantidad);setProgreso(i+1);}setActivado(key);toast.success("Series activadas para la venta");}catch(e){toast.error(e instanceof Error?e.message:"No se pudo activar");}finally{setActivando(null);}};

  const grupos = new Map<string, Decimo[]>();
  for (const d of decimos) if (d.numero.includes(q)) grupos.set(d.numero, [...(grupos.get(d.numero) ?? []), d]);
  const numeros = [...grupos.keys()].sort();

  return (
    <>
      <PageTitle sub={`${suma(decimos)} décimos en total · ${suma(decimos.filter((d) => d.estado === "recepcion"))} en recepción`}>Inventario</PageTitle>
      <form className="mb-6 flex flex-wrap gap-2 border-y border-border py-4"
        onSubmit={(e) => { e.preventDefault(); if (/^\d{5}$/.test(nuevo)) { setAlta(nuevo); setNuevo(""); } }}>
        <Input className="h-12 min-w-0 flex-1" placeholder="Número (5 dígitos)" maxLength={5} inputMode="numeric" value={nuevo} onChange={(e) => setNuevo(e.target.value.replace(/\D/g, ""))} />
        <Button>Añadir entrada</Button>
      </form>
      <Input className="mb-4" placeholder="Buscar número…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="space-y-2">
        {numeros.map((num) => {
          const items = grupos.get(num) ?? [];
          const central = items.filter((d) => d.ubicacion === CENTRAL);
          const open = abierto === num;
          return (
            <div key={num} className="rounded-xl border border-border bg-card">
              <Button variant="ghost" aria-expanded={open} className="h-auto w-full flex-wrap justify-start gap-3 whitespace-normal p-3 text-left" onClick={() => setAbierto(open ? null : num)}>
                <span className="font-mono text-2xl font-bold text-primary">{num}</span>
                <span className="flex-1 text-sm text-muted-foreground">Admin: {suma(central)} · Locales: {suma(items) - suma(central)}</span>
                <span className="text-xl font-bold">{suma(items)}</span>
                <ChevronDown className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`} />
              </Button>
              {open && (
                <div className="space-y-2 border-t border-border p-3">
                  <Button disabled={!!activando} variant="secondary" className="w-full whitespace-normal" onClick={()=>activar(num,central.filter(d=>d.estado==="recepcion"))}>{activando===num?<Loader2 className="motion-safe:animate-spin"/>:activado===num?<Check className="motion-safe:animate-in"/>:null}{activando===num?`Activando ${progreso}/${central.filter(d=>d.estado==="recepcion").length+progreso}`:activado===num?"Activado":"Poner todas las series en venta"}</Button>
                  <ListaVirtual items={[...items].sort((a, b) => a.ubicacion.localeCompare(b.ubicacion) || a.serie.localeCompare(b.serie, undefined, { numeric: true }) || Number(a.fraccion)-Number(b.fraccion))} getKey={d=>d.id} render={(d) => (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-secondary/50 p-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{nombreUbicacion(d.ubicacion, locales)}</div>
                        <div className="text-xs text-muted-foreground">Serie {d.serie || "—"} · Fracción {d.fraccion || "—"}
                          {d.ubicacion === CENTRAL && <span className={`ml-2 rounded px-1.5 py-0.5 font-semibold ${d.estado === "venta" ? "bg-accent text-accent-foreground" : "bg-muted"}`}>{d.estado === "venta" ? "EN VENTA" : "RECEPCIÓN"}</span>}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-1">
                         {d.estado === "recepcion" && <><Button disabled={!!activando} size="sm" variant="secondary" onClick={()=>activar(`${num}-${d.serie}`,central.filter(x=>x.serie===d.serie&&x.estado==="recepcion"))}>{activando===`${num}-${d.serie}`?<Loader2 className="motion-safe:animate-spin"/>:activado===`${num}-${d.serie}`?<Check/>:null}Serie {d.serie} en venta</Button><Input aria-label={`Cantidad a poner en venta ${d.serie} ${d.fraccion}`} className="h-12 w-16" type="number" inputMode="numeric" min={1} max={d.cantidad} value={venta[d.id] ?? d.cantidad} onChange={e=>setVenta({...venta,[d.id]:+e.target.value})} /><Button disabled={!!activando} size="sm" onClick={() => activar(d.id,[{...d,cantidad:venta[d.id] ?? d.cantidad}])}>En venta</Button></>}
                         <Button size="icon" variant="secondary" aria-label="Restar décimo" onClick={() => actions.restar(d.id, 1)}><Minus/></Button>
                        <span className="w-8 text-center font-semibold">{d.cantidad}</span>
                         <Button size="icon" variant="secondary" aria-label="Sumar décimo" onClick={() => actions.sumar(d.id, 1)}><Plus/></Button>
                         <Button size="icon" variant="ghost" aria-label="Eliminar décimo" onClick={() => actions.eliminarDecimo(d.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  )}/>
                  <Button variant="secondary" className="w-full" onClick={() => setAlta(num)}>Añadir más series de {num}</Button>
                </div>
              )}
            </div>
          );
        })}
        {!numeros.length && <p className="text-muted-foreground">Sin décimos.</p>}
      </div>
      {alta && <EntradaForm numero={alta} onClose={() => setAlta(null)} />}
    </>
  );
}
