import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectorFracciones } from "@/components/SelectorFracciones";
import { SelectorRangoSeries } from "@/components/SelectorRangoSeries";
import { ListaVirtual } from "@/components/ListaVirtual";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { agruparSeries, seleccionarRango, estadoSerie } from "@/lib/seleccion-stock";
import { FRACCIONES } from "@/lib/fracciones";
import type { Decimo } from "@/lib/store";

export function SeleccionSeries({items, cantidades, onSeleccion, onEstado, soloLectura=false}: {items:Decimo[]; cantidades?:Record<string,number> | undefined; onSeleccion?:((items:Decimo[],seleccionar:boolean)=>void) | undefined; onEstado?:((desde:number,hasta:number,fracciones:string[],estado:Decimo["estado"])=>void) | undefined; soloLectura?:boolean}) {
  const grupos=useMemo(()=>agruparSeries(items),[items]);
  const [desde,setDesde]=useState(grupos[0]?.serie || "1");
  const [hasta,setHasta]=useState("");
  const [fracciones,setFracciones]=useState<string[]>([...FRACCIONES]);
  const [serie,setSerie]=useState<string|null>(null);
  const [error,setError]=useState("");
  const filas=useMemo(()=>Array.from({length:Math.ceil(grupos.length/4)},(_,i)=>({id:String(i),series:grupos.slice(i*4,i*4+4)})),[grupos]);
  const actual=grupos.find(g=>g.serie===serie);
  const rango=(fn:(d:Decimo[])=>void)=>{try{const d=seleccionarRango(items,Number(desde),Number(hasta || desde),fracciones); if(!d.length)throw new Error("No hay décimos disponibles en esta selección");setError("");fn(d);}catch(e){setError(e instanceof Error?e.message:"Rango no válido");}};
  return <div className="space-y-4">
    {!soloLectura && <><SelectorRangoSeries desde={desde} hasta={hasta} onDesde={setDesde} onHasta={setHasta}/><Button variant="outline" className="w-full" onClick={()=>{setDesde(grupos[0]?.serie || "1");setHasta(grupos.at(-1)?.serie || "1");setFracciones([...FRACCIONES]);}}>Todas las series</Button><details><summary className="flex min-h-12 cursor-pointer items-center gap-2 font-medium"><ChevronDown/>Fracciones · {fracciones.length}/10</summary><SelectorFracciones value={fracciones} onChange={setFracciones}/></details></>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <ListaVirtual compact items={filas} getKey={f=>f.id} render={fila=><div className="grid grid-cols-4 gap-2">{fila.series.map(g=>{const estado=estadoSerie(g.items);const elegidos=g.items.reduce((s,d)=>s+(cantidades?.[d.id] ?? 0),0); return <Button key={g.serie} variant="secondary" aria-label={`Serie ${g.serie}`} aria-pressed={cantidades?elegidos>0:undefined} className={`h-20 min-w-0 flex-col gap-1 px-1 ${cantidades?(elegidos>0?"bg-primary text-primary-foreground":""):estado.activas===10?"bg-accent text-accent-foreground":estado.activas>0?"bg-stock-partial text-stock-partial-foreground":""}`} onClick={()=>setSerie(g.serie)}><span className="text-lg font-bold">{g.serie || "—"}</span><span className="text-xs">{cantidades?`${elegidos}/${g.items.reduce((s,d)=>s+d.cantidad,0)}`:`${estado.activas}/10`}</span></Button>;})}</div>}/>
    {!soloLectura && <div className="sticky bottom-20 z-10 grid grid-cols-2 gap-2 border-t border-border bg-background py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
      {onEstado && <><Button className="bg-accent text-accent-foreground" onClick={()=>rango(()=>onEstado(Number(desde),Number(hasta || desde),fracciones,"venta"))}>Activar rango</Button><Button variant="destructive" onClick={()=>rango(()=>onEstado(Number(desde),Number(hasta || desde),fracciones,"recepcion"))}>Desactivar rango</Button><Button variant="secondary" className="col-span-2" onClick={()=>onEstado(Number(grupos[0]?.serie || 1),Number(grupos.at(-1)?.serie || 1),[...FRACCIONES],"venta")}>Activar todo el número</Button></>}
      {onSeleccion && <><Button onClick={()=>rango(d=>onSeleccion(d,true))}>Seleccionar rango</Button><Button variant="outline" onClick={()=>rango(d=>onSeleccion(d,false))}>Quitar rango</Button></>}
    </div>}
    <Drawer open={serie!==null} onOpenChange={v=>{if(!v)setSerie(null)}}><DrawerContent className="mx-auto max-h-[85dvh] max-w-xl"><DrawerHeader><DrawerTitle>Serie {serie || "—"}</DrawerTitle><DrawerDescription>{actual?.items.reduce((s,d)=>s+d.cantidad,0) ?? 0} décimos disponibles</DrawerDescription></DrawerHeader><div className="space-y-2 overflow-y-auto px-4 pb-6">
      {actual && onSeleccion && <Button className="w-full" onClick={()=>onSeleccion(actual.items,!actual.items.every(d=>(cantidades?.[d.id] ?? 0)===d.cantidad))}>Seleccionar / quitar serie completa</Button>}
      {actual?.items.map(d=><div key={d.id} className="flex min-h-14 items-center justify-between gap-2 border-b border-border"><span className="text-sm">{d.fraccion?`Fracción ${d.fraccion}`:"Sin fracciones detalladas"} · {d.cantidad}</span>{soloLectura?<span className="text-sm">En depósito</span>:onEstado?<Button role="switch" aria-checked={d.estado==="venta"} aria-label={`Activar fracción ${d.fraccion || "sin detalle"}`} variant={d.estado==="venta"?"default":"secondary"} onClick={()=>onEstado(Number(d.serie),Number(d.serie),d.fraccion?[d.fraccion]:[...FRACCIONES],d.estado==="venta"?"recepcion":"venta")}>{d.estado==="venta"?"Activa":"Inactiva"}</Button>:<Input aria-label={`Asignar serie ${d.serie} fracción ${d.fraccion || "sin detalle"}`} className="h-12 w-24" type="number" inputMode="numeric" min={0} max={d.cantidad} value={cantidades?.[d.id] ?? 0} onChange={e=>onSeleccion?.([{...d,cantidad:Math.max(0,Math.min(d.cantidad,Math.trunc(Number(e.target.value))))}],true)}/>}</div>)}
      <Button variant="outline" className="w-full" onClick={()=>setSerie(null)}>Cerrar</Button>
    </div></DrawerContent></Drawer>
  </div>;
}