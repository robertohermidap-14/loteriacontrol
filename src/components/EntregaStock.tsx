import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Firma } from "@/components/Firma";
import { actions, type Local } from "@/lib/store";
export function EntregaStock({local,cant,onCancelar}:{local:Local;cant:Record<string,number>;onCancelar:()=>void}) {
 const nav=useNavigate();const [tipo,setTipo]=useState<"deposito"|"entrega">("deposito");const [nombre,setNombre]=useState(local.persona || "");const [dni,setDni]=useState(local.dni || "");const [firma,setFirma]=useState("");const [busy,setBusy]=useState(false);
 const total=Object.values(cant).reduce((s,n)=>s+n,0);
 const request=useRef({key:"",id:""});
 return <section className="mt-5 space-y-4 border-t border-border pt-4"><div className="flex items-center justify-between gap-2"><h3 className="font-semibold">{local.nombre} · {total} décimos</h3><Button variant="ghost" disabled={busy} onClick={onCancelar}>Cancelar</Button></div><div className="grid grid-cols-2 gap-2"><Button variant={tipo==="deposito"?"default":"secondary"} onClick={()=>setTipo("deposito")}>Depósito</Button><Button variant={tipo==="entrega"?"default":"secondary"} onClick={()=>setTipo("entrega")}>Entrega</Button></div>{tipo==="deposito" && <><div className="grid gap-3 sm:grid-cols-2"><Label>Persona que recoge<Input className="mt-2 h-12" value={nombre} onChange={e=>setNombre(e.target.value)}/></Label><Label>DNI<Input className="mt-2 h-12" value={dni} onChange={e=>setDni(e.target.value)}/></Label></div><Label>Firma</Label><Firma onChange={setFirma}/></>}<Button className="h-14 w-full whitespace-normal" disabled={busy || !total || (tipo==="deposito" && (!nombre.trim() || !dni.trim() || !firma))} onClick={async()=>{setBusy(true);try{const id=await actions.crearAlbaran(local.id,Object.entries(cant).map(([decimoId,cantidad])=>({decimoId,cantidad})),{tipo,receptorNombre:nombre,receptorDni:dni,firma});toast.success("Entrega registrada; stock actualizado");await nav({to:"/albaran/$id",params:{id}});}catch(e){toast.error(e instanceof Error?e.message:"No se pudo entregar");}finally{setBusy(false);}}}>{busy?<Loader2 className="motion-safe:animate-spin"/>:null}{busy?"Registrando…":`Generar albarán · ${total} décimos`}</Button></section>;
}