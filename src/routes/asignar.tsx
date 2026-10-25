import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { PageTitle } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SeleccionSeries } from "@/components/SeleccionSeries";
import { EntregaStock } from "@/components/EntregaStock";
import { CENTRAL, useStore, type Decimo } from "@/lib/store";

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
 const {locales,decimos}=useStore();const [localId,setLocalId]=useState("");const [busca,setBusca]=useState("");const [numero,setNumero]=useState<string|null>(null);const [cant,setCant]=useState<Record<string,number>>({});const local=locales.find(l=>l.id===localId);
 const grupos=new Map<string,Decimo[]>();for(const d of decimos)if(d.ubicacion===CENTRAL && d.cantidad>0)grupos.set(d.numero,[...(grupos.get(d.numero) ?? []),d]);
 return <><PageTitle>Asignar lotería a local</PageTitle>{!local?<><Input className="mb-4 h-12" placeholder="Buscar local…" value={busca} onChange={e=>setBusca(e.target.value)}/><div className="space-y-2">{locales.filter(l=>`${l.nombre} ${l.codigoCliente ?? ""}`.toLowerCase().includes(busca.toLowerCase())).map(l=><Button key={l.id} variant="outline" className="h-auto min-h-16 w-full justify-start gap-3 whitespace-normal py-3 text-left" onClick={()=>{setLocalId(l.id);setCant({});}}><span className="font-mono text-primary">{l.codigoCliente}</span><span className="flex-1">{l.nombre}</span><ChevronRight/></Button>)}{!locales.length && <p>No hay locales.</p>}</div></>:<><div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4"><h2 className="text-xl font-semibold">{local.nombre}</h2><Button variant="outline" onClick={()=>{setLocalId("");setCant({});}}>Cambiar local</Button></div><div className="divide-y divide-border">{[...grupos].sort(([a],[b])=>a.localeCompare(b)).map(([num,items])=><section key={num}><Button variant="ghost" aria-expanded={numero===num} className="h-auto min-h-16 w-full justify-start gap-3 whitespace-normal text-left" onClick={()=>setNumero(numero===num?null:num)}><span className="font-mono text-2xl font-bold">{num}</span><span className="flex-1 text-sm">{new Set(items.map(d=>d.serie)).size} series · {items.reduce((s,d)=>s+d.cantidad,0)} décimos</span><span>{items.reduce((s,d)=>s+(cant[d.id] ?? 0),0)} seleccionados</span><ChevronDown/></Button>{numero===num && <div className="py-4"><SeleccionSeries items={items} cantidades={cant} onSeleccion={(d,v)=>setCant(c=>({...c,...Object.fromEntries(d.map(x=>[x.id,v?x.cantidad:0]))}))}/></div>}</section>)}</div>{!grupos.size && <p>No hay stock en administración.</p>}<EntregaStock local={local} cant={cant} onCancelar={()=>{setLocalId("");setCant({});}}/></>}</>;
}
