import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ListaVirtual } from "@/components/ListaVirtual";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { agruparSeries, estadoSerie, serieSeleccionada } from "@/lib/seleccion-stock";
import { FRACCIONES } from "@/lib/fracciones";
import type { Decimo } from "@/lib/store";

export function SeleccionSeries({items,cantidades,onSeleccion,onEstado,soloLectura=false}: {items:Decimo[];cantidades?:Record<string,number>;onSeleccion?:((items:Decimo[],seleccionar:boolean)=>void);onEstado?:((desde:number,hasta:number,fracciones:string[],estado:Decimo["estado"])=>void);soloLectura?:boolean}) {
 const grupos=useMemo(()=>agruparSeries(items),[items]);
 const [serie,setSerie]=useState<string|null>(null);
 const [seleccionadas,setSeleccionadas]=useState<string[]>([]);
 const actual=grupos.find(g=>g.serie===serie);
 const filas=useMemo(()=>Array.from({length:Math.ceil(grupos.length/5)},(_,i)=>({id:String(i),series:grupos.slice(i*5,i*5+5)})),[grupos]);
 const tocar=(g:typeof grupos[number])=>{if(soloLectura){setSerie(g.serie);return;}if(onSeleccion)onSeleccion(g.items,!serieSeleccionada(g.items,cantidades ?? {}));else setSeleccionadas(s=>s.includes(g.serie)?s.filter(x=>x!==g.serie):[...s,g.serie]);setSerie(g.serie);};
 return <div className="space-y-3">
  <ListaVirtual compact items={filas} getKey={f=>f.id} render={fila=><div className="grid grid-cols-5 gap-2">{fila.series.map(g=>{const estado=estadoSerie(g.items);const elegido=onSeleccion?g.items.some(d=>(cantidades?.[d.id] ?? 0)>0):seleccionadas.includes(g.serie);return <Button key={g.serie} size="icon" aria-label={`Serie ${g.serie}`} aria-pressed={!soloLectura?elegido:undefined} variant={elegido?"default":"secondary"} className={`h-14 w-full min-w-12 flex-col gap-0 px-1 ${!elegido && estado.activas===10?"bg-accent text-accent-foreground":""}`} onClick={()=>tocar(g)}><span className="font-mono text-lg font-bold">{g.serie || "—"}</span><span className="text-[10px]">{g.items.reduce((s,d)=>s+d.cantidad,0)} disp.</span></Button>})}</div>}/>
  {onEstado && <div className="flex flex-wrap gap-2"><Button disabled={!seleccionadas.length} onClick={()=>seleccionadas.forEach(s=>onEstado(Number(s),Number(s),[...FRACCIONES],"venta"))}>Activar seleccionadas</Button><Button variant="outline" disabled={!seleccionadas.length} onClick={()=>seleccionadas.forEach(s=>onEstado(Number(s),Number(s),[...FRACCIONES],"recepcion"))}>Desactivar</Button></div>}
  <Drawer open={serie!==null} onOpenChange={v=>{if(!v)setSerie(null)}}><DrawerContent className="mx-auto max-h-[85dvh] max-w-md"><DrawerHeader><DrawerTitle>Serie {serie || "—"}</DrawerTitle><DrawerDescription>{actual?.items.reduce((s,d)=>s+d.cantidad,0) ?? 0} décimos disponibles</DrawerDescription></DrawerHeader><div className="space-y-3 overflow-y-auto px-4 pb-5">
   <div className="grid grid-cols-5 gap-2">{FRACCIONES.map(f=>{const ds=actual?.items.filter(d=>d.fraccion===f) ?? [];const activa=onSeleccion?ds.some(d=>(cantidades?.[d.id] ?? 0)>0):ds.some(d=>d.estado==="venta");return <Button key={f} size="icon" className="h-12 w-full" aria-label={`Fracción ${f}`} aria-pressed={activa} variant={activa?"default":"secondary"} disabled={soloLectura || !ds.length} onClick={()=>{if(onSeleccion)onSeleccion(ds,!activa);else if(onEstado && actual)onEstado(Number(actual.serie),Number(actual.serie),[f],activa?"recepcion":"venta")}}>{f}</Button>})}</div>
   {actual?.items.some(d=>!d.fraccion) && <p className="text-sm text-muted-foreground">Sin fracciones detalladas · {actual.items.filter(d=>!d.fraccion).reduce((s,d)=>s+d.cantidad,0)} décimos</p>}
   {actual && onSeleccion && <Button variant="outline" className="w-full" onClick={()=>onSeleccion(actual.items,!serieSeleccionada(actual.items,cantidades ?? {}))}>{serieSeleccionada(actual.items,cantidades ?? {})?"Quitar serie":"Serie completa"}</Button>}
   <Button className="w-full" onClick={()=>setSerie(null)}>Continuar</Button>
  </div></DrawerContent></Drawer>
 </div>;
}
