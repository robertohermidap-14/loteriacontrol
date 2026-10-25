import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Firma } from "@/components/Firma";
import { actions, euros, useStore, type Local } from "@/lib/store";
import { nombreCobrador, useSesion } from "@/lib/sesion";
import { agruparLineas } from "@/lib/albaran-compacto";

export function EntregaStock({local,cant,onCancelar}:{local:Local;cant:Record<string,number>;onCancelar:()=>void}) {
 const nav=useNavigate();const sesion=useSesion();const {decimos}=useStore();
 const resumen=agruparLineas(decimos.filter(d=>(cant[d.id] ?? 0)>0).map(d=>({...d,cantidad:cant[d.id] ?? 0,pagados:0,devueltos:0})));
 const [tipo,setTipo]=useState<"deposito"|"entrega">("deposito");const [nombre,setNombre]=useState(local.persona || "");const [dni,setDni]=useState(local.dni || "");const [firma,setFirma]=useState("");const [busy,setBusy]=useState(false);
 const total=Object.values(cant).reduce((s,n)=>s+n,0);const request=useRef({key:"",id:""});
 const entregar=async()=>{
  setBusy(true);const key=JSON.stringify({cant,tipo,nombre,dni,firma});if(request.current.key!==key)request.current={key,id:crypto.randomUUID()};
  try {const id=await actions.crearAlbaran(local.id,Object.entries(cant).map(([decimoId,cantidad])=>({decimoId,cantidad})),{tipo,receptorNombre:nombre,receptorDni:dni,firma},request.current.id);toast.success("Entrega registrada; stock actualizado");await nav({to:"/albaran/$id",params:{id}});}
  catch(e){toast.error(e instanceof Error?e.message:"No se pudo entregar");}finally{setBusy(false);}
 };
 return <section className="mt-5 space-y-3 border-t border-border pt-4">
  <div className="flex items-center justify-between gap-2"><h3 className="font-semibold">{local.nombre} · {total} décimos</h3><Button variant="ghost" disabled={busy} onClick={onCancelar}>Cancelar</Button></div>
  <div className="flex gap-2"><Button disabled={busy} variant={tipo==="deposito"?"default":"secondary"} onClick={()=>setTipo("deposito")}>Depósito</Button><Button disabled={busy} variant={tipo==="entrega"?"default":"secondary"} onClick={()=>setTipo("entrega")}>Entrega</Button></div>
  <p className="text-sm">Entrega: <b>{nombreCobrador(sesion)}</b></p>
  {resumen.map(g=><div key={g.numero}><b>{g.numero} · {g.cantidad} décimos</b><p className="text-sm">{g.series}</p>{g.sueltas.map(x=><p key={x} className="text-xs text-muted-foreground">{x}</p>)}</div>)}
  <p className="font-bold">Importe entregado: {euros(total*20)}</p>
  <div className="grid gap-3 sm:grid-cols-2"><Label>Persona que recoge<Input disabled={busy} className="mt-2 h-12" value={nombre} onChange={e=>setNombre(e.target.value)}/></Label><Label>DNI<Input disabled={busy} className="mt-2 h-12" value={dni} onChange={e=>setDni(e.target.value)}/></Label></div>
  <Label>Firma</Label><Firma onChange={setFirma}/>
  <Button className="h-14 w-full whitespace-normal" disabled={busy || !total || !nombre.trim() || !dni.trim() || !firma || sesion.cargando} onClick={entregar}>{busy && <Loader2 className="motion-safe:animate-spin"/>}{busy?"Registrando…":`Generar albarán · ${total} décimos`}</Button>
 </section>;
}
