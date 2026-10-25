import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectorFracciones } from "@/components/SelectorFracciones";
import { crearEntrada, FRACCIONES } from "@/lib/fracciones";
import { actions } from "@/lib/store";
import { Loader2 } from "lucide-react";

export function EntradaForm({numero,onClose}:{numero:string;onClose:()=>void}) {
 const [series,setSeries]=useState<number[]>([]);const [inicio,setInicio]=useState(1);const [fracciones,setFracciones]=useState<string[]>([...FRACCIONES]);const [guardando,setGuardando]=useState(false);
 return <div className="fixed inset-0 z-30 grid place-items-center bg-background/80 p-4"><form className="max-h-[90dvh] w-full max-w-md space-y-4 overflow-y-auto rounded-lg border border-border bg-card p-4" onSubmit={async e=>{e.preventDefault();setGuardando(true);try{await actions.altaBloque([...series].sort((a,b)=>a-b).flatMap(s=>crearEntrada(numero,s,s,fracciones)));toast.success(`${numero}: +${series.length*fracciones.length} décimos en recepción`);onClose();}catch(err){toast.error(err instanceof Error?err.message:"No se pudo añadir");}finally{setGuardando(false);}}}>
 <h2 className="text-lg font-semibold">Entrada · <span className="font-mono">{numero}</span></h2>
 <Label>Series</Label><div className="flex items-center gap-2"><Button type="button" variant="outline" disabled={inicio<=1} onClick={()=>setInicio(n=>Math.max(1,n-25))}>Anterior</Button><Input aria-label="Primera serie visible" className="h-12 w-24" type="number" inputMode="numeric" min={1} value={inicio} onChange={e=>setInicio(Math.max(1,Math.trunc(Number(e.target.value)||1)))}/><Button type="button" variant="outline" onClick={()=>setInicio(n=>n+25)}>Siguiente</Button></div>
 <div className="grid grid-cols-5 gap-2">{Array.from({length:25},(_,i)=>inicio+i).map(s=><Button key={s} type="button" size="icon" className="h-12 w-full font-mono" aria-label={`Añadir serie ${s}`} aria-pressed={series.includes(s)} variant={series.includes(s)?"default":"secondary"} onClick={()=>setSeries(prev=>prev.includes(s)?prev.filter(n=>n!==s):[...prev,s])}>{s}</Button>)}</div>
 <div><Label>Fracciones por serie</Label><SelectorFracciones value={fracciones} onChange={setFracciones}/></div>
 <p className="font-semibold">{series.length} series · {series.length*fracciones.length} décimos</p><div className="flex gap-2"><Button type="button" variant="secondary" disabled={guardando} onClick={onClose}>Cancelar</Button><Button className="flex-1" disabled={guardando || !series.length || !fracciones.length}>{guardando && <Loader2 className="motion-safe:animate-spin"/>}{guardando?"Añadiendo…":"Añadir al stock"}</Button></div>
 </form></div>;
}
