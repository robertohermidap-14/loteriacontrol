import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, Search, ScanBarcode, Package, Store, Wallet } from "lucide-react";
import { PageTitle } from "@/components/AppShell";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { actions, CENTRAL, nombreUbicacion, useStore, type Decimo, type Local } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { euros } from "@/lib/store";
import { ListaVirtual } from "@/components/ListaVirtual";
import { saldoAlbaran, stockLocales } from "@/lib/contabilidad";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Stock · Lotería Control" },
      { name: "description", content: "Busca décimos en stock por terminación y mira dónde están." },
      { property: "og:title", content: "Stock · Lotería Control" },
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
 const {decimos,locales,albaranes,cargado}=useStore();
 const [t,setT]=useState<number|null>(null);
 const [q,setQ]=useState("");
 const [abierto,setAbierto]=useState<string|null>(null);
 const disponibles=decimos.filter(d=>d.cantidad>0);
 const central=disponibles.filter(d=>d.ubicacion===CENTRAL);
 const depositos=disponibles.filter(d=>d.ubicacion!==CENTRAL);
 const grupos=new Map<string,Decimo[]>();
 for(const d of disponibles) if(d.numero.includes(q) && (t===null || d.numero.endsWith(String(t)))) grupos.set(d.numero,[...(grupos.get(d.numero) ?? []),d]);
 const numeros=[...grupos.keys()].sort();
 const pendiente=albaranes.reduce((s,a)=>s+saldoAlbaran(a).pendiente,0);
 return <>
  <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><PageTitle>Control de stock</PageTitle><Button asChild><Link to="/escaner"><ScanBarcode/>Vender por escaneo</Link></Button></div>
  <div className="mb-7 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-border py-5 sm:grid-cols-3">
   <div><p className="flex items-center gap-2 text-sm text-muted-foreground"><Package className="h-4 w-4"/>En administración</p><p className="mt-2 text-3xl font-bold">{suma(central)}<span className="ml-2 text-sm font-normal text-muted-foreground">décimos</span></p></div>
   <div><p className="flex items-center gap-2 text-sm text-muted-foreground"><Store className="h-4 w-4"/>En depósito</p><p className="mt-2 text-3xl font-bold">{suma(depositos)}<span className="ml-2 text-sm font-normal text-muted-foreground">décimos</span></p></div>
   <div><p className="flex items-center gap-2 text-sm text-muted-foreground"><Wallet className="h-4 w-4"/>Pendiente de cobro</p><p className="mt-2 text-2xl font-bold text-destructive">{euros(pendiente)}</p></div>
  </div>
  <div className="relative mb-4"><Search className="absolute left-3 top-4 h-4 w-4 text-muted-foreground"/><Input aria-label="Buscar número en stock" className="h-12 pl-10" placeholder="Buscar número…" inputMode="numeric" value={q} onChange={e=>setQ(e.target.value.replace(/\D/g,""))}/></div>
  <div className="mb-6 flex flex-wrap gap-2"><Button variant={t===null?"default":"secondary"} onClick={()=>setT(null)}>Todos</Button>{Array.from({length:10},(_,i)=><Button key={i} size="icon" className="font-mono text-lg" aria-label={`Terminación ${i}`} variant={t===i?"default":"secondary"} onClick={()=>{setT(i);setAbierto(null)}}>{i}</Button>)}</div>
  <div className="mb-2 grid grid-cols-[1fr_auto] border-b border-border px-3 pb-3 text-sm font-semibold text-muted-foreground"><span>Número / ubicación</span><span>Stock administración</span></div>
  <div className="divide-y divide-border">{numeros.map(num=>{
   const items=grupos.get(num) ?? [];const centrales=items.filter(d=>d.ubicacion===CENTRAL);const porLocal=stockLocales(items,albaranes,num);const open=abierto===num;
   return <div key={num}><Button variant="ghost" className="h-auto w-full justify-start gap-3 rounded-none px-3 py-4 text-left" aria-expanded={open} onClick={()=>setAbierto(open?null:num)}><span className="font-mono text-2xl font-bold">{num}</span><span className="flex-1 text-sm font-normal text-muted-foreground">{porLocal.size>0?`${porLocal.size} locales`:"Administración"}</span><span className="text-xl font-bold">{suma(centrales)}</span><ChevronDown className={open?"rotate-180":""}/></Button>
    {open && <div className="space-y-3 border-t border-border px-3 py-4"><p className="font-semibold">Administración · {suma(centrales)} décimos</p><ListaVirtual items={series(centrales)} getKey={s=>s.clave} render={s=><SerieFila {...s} locales={locales}/>}/>{[...porLocal].map(([id,stock])=><div key={id} className="flex flex-wrap items-center justify-between gap-2 border-l-2 border-primary bg-secondary/50 p-3"><span className="font-medium">{nombreUbicacion(id,locales)}</span><span className="font-bold">{stock.disponible} en depósito</span></div>)}<div className="flex flex-wrap gap-2"><Button asChild variant="outline"><Link to="/asignar">Entregar a un local</Link></Button><Button asChild variant="outline"><Link to="/caja">Cobrar / devolver</Link></Button></div></div>}
   </div>;
  })}</div>
  {!cargado && <p className="py-6 text-muted-foreground">Cargando stock…</p>}
  {cargado && !numeros.length && <p className="py-6 text-muted-foreground">No hay stock para esta búsqueda.</p>}
 </>;
}
