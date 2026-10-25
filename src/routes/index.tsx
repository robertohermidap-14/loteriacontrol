import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, Search, ScanBarcode, Package, Store } from "lucide-react";
import { PageTitle } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { CENTRAL, useStore, type Decimo } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { StockNumero } from "@/components/StockNumero";
import { stockLocales } from "@/lib/contabilidad";

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
 return <>
  <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><PageTitle>Control de stock</PageTitle><Button asChild><Link to="/escaner"><ScanBarcode/>Vender por escaneo</Link></Button></div>
  <div className="mb-7 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-border py-5 sm:grid-cols-2">
   <div><p className="flex items-center gap-2 text-sm text-muted-foreground"><Package className="h-4 w-4"/>En administración</p><p className="mt-2 text-3xl font-bold">{suma(central)}<span className="ml-2 text-sm font-normal text-muted-foreground">décimos</span></p></div>
   <div><p className="flex items-center gap-2 text-sm text-muted-foreground"><Store className="h-4 w-4"/>En depósito</p><p className="mt-2 text-3xl font-bold">{suma(depositos)}<span className="ml-2 text-sm font-normal text-muted-foreground">décimos</span></p></div>
  </div>
  <div className="relative mb-4"><Search className="absolute left-3 top-4 h-4 w-4 text-muted-foreground"/><Input aria-label="Buscar número en stock" className="h-12 pl-10" placeholder="Buscar número…" inputMode="numeric" value={q} onChange={e=>setQ(e.target.value.replace(/\D/g,""))}/></div>
  <div className="mb-6 flex flex-wrap gap-2"><Button variant={t===null?"default":"secondary"} onClick={()=>setT(null)}>Todos</Button>{Array.from({length:10},(_,i)=><Button key={i} size="icon" className="font-mono text-lg" aria-label={`Terminación ${i}`} variant={t===i?"default":"secondary"} onClick={()=>{setT(i);setAbierto(null)}}>{i}</Button>)}</div>
  <div className="mb-2 grid grid-cols-[1fr_auto] border-b border-border px-3 pb-3 text-sm font-semibold text-muted-foreground"><span>Número / ubicación</span><span>Stock administración</span></div>
  <div className="divide-y divide-border">{numeros.map(num=>{
   const items=grupos.get(num) ?? [];const centrales=items.filter(d=>d.ubicacion===CENTRAL);const porLocal=stockLocales(items,albaranes,num);const open=abierto===num;
   return <div key={num}><Button variant="ghost" className="h-auto w-full justify-start gap-3 rounded-none px-3 py-4 text-left" aria-expanded={open} onClick={()=>setAbierto(open?null:num)}><span className="font-mono text-2xl font-bold">{num}</span><span className="flex-1 text-sm font-normal text-muted-foreground">{porLocal.size>0?`${porLocal.size} locales`:"Administración"}</span><span className="text-xl font-bold">{suma(centrales)}</span><ChevronDown className={open?"rotate-180":""}/></Button>
    {open && <StockNumero numero={num} items={items} locales={locales}/>}
   </div>;
  })}</div>
  {!cargado && <p className="py-6 text-muted-foreground">Cargando stock…</p>}
  {cargado && !numeros.length && <p className="py-6 text-muted-foreground">No hay stock para esta búsqueda.</p>}
 </>;
}
