import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Camera, CheckCircle2, Loader2, ScanBarcode } from "lucide-react";
import { PageTitle } from "@/components/AppShell";
import { Scanner } from "@/components/Scanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EntradaForm } from "@/components/EntradaForm";
import { extraerNumero } from "@/lib/barcode";
import { actions, CENTRAL, useStore } from "@/lib/store";

export const Route = createFileRoute("/escaner")({
 head:()=>({meta:[{title:"Venta y entrada por escaneo · Lotería Control"},{name:"description",content:"Venta inmediata de décimos y entrada de stock con cámara o lector."},{property:"og:title",content:"Venta por escaneo · Lotería Control"},{property:"og:description",content:"Stock de administración actualizado con cada venta."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary"}]}),component:Escaner,
});
function Escaner(){
 const {decimos}=useStore();
 const [modo,setModo]=useState<"entrada"|"venta">("venta");
 const [alta,setAlta]=useState<string|null>(null);
 const [manual,setManual]=useState("");
 const [camara,setCamara]=useState(false);
 const [busy,setBusy]=useState(false);
 const [ultima,setUltima]=useState<{numero:string;serie:string;fraccion:string}|null>(null);
 const lock=useRef(false);const input=useRef<HTMLInputElement>(null);
 const stock=decimos.filter(d=>d.ubicacion===CENTRAL && d.estado==="venta").reduce((s,d)=>s+d.cantidad,0);
 async function procesar(code:string){
  if(lock.current || alta)return;
  const numero=/^\d{5}$/.test(code.trim())?code.trim():extraerNumero(code);
  if(!numero){toast.error("Código no válido: introduce el código completo o 5 dígitos");return;}
  if(modo==="entrada"){setAlta(numero);return;}
  lock.current=true;setBusy(true);
  try{const venta=await actions.venderNumero(numero,crypto.randomUUID());setUltima(venta);toast.success(`Vendido ${numero} · stock actualizado`);}
  catch(e){toast.error(e instanceof Error?e.message:"No se pudo registrar la venta");}
  finally{setBusy(false);lock.current=false;input.current?.focus();}
 }
 return <>
  <PageTitle sub={`${stock} décimos disponibles para venta en administración`}>Venta por escaneo</PageTitle>
  <div className="mb-6 flex gap-2"><Button variant={modo==="venta"?"default":"secondary"} onClick={()=>{setModo("venta");setUltima(null)}}><ScanBarcode/>Vender décimo</Button><Button variant={modo==="entrada"?"default":"secondary"} onClick={()=>{setModo("entrada");setUltima(null)}}>Entrada de stock</Button></div>
  <section className="border-y border-border py-6">
   <form className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]" onSubmit={e=>{e.preventDefault();const code=manual;setManual("");void procesar(code)}}>
    <Input ref={input} aria-label="Código de barras o número" autoFocus className="h-16 min-w-0 flex-1 font-mono text-xl" placeholder="Código de barras o número" value={manual} onChange={e=>setManual(e.target.value)} autoComplete="off"/>
    <Button className="h-16" disabled={busy || !manual} type="submit">{busy?<Loader2 className="motion-safe:animate-spin"/>:<ScanBarcode/>}{modo==="venta"?"Registrar venta":"Añadir stock"}</Button>
   </form>
   <Button variant="outline" className="mt-4" onClick={()=>setCamara(!camara)}><Camera/>{camara?"Cerrar cámara":"Usar cámara"}</Button>
  </section>
  {busy && <p role="status" className="my-4 flex items-center gap-2"><Loader2 className="motion-safe:animate-spin"/>Registrando venta…</p>}
  {ultima && <div role="status" className="mt-5 flex items-center gap-4 border-l-4 border-accent bg-accent/10 p-4"><CheckCircle2 className="text-accent"/><div><p className="font-mono text-2xl font-bold">{ultima.numero}</p><p className="text-sm">Vendido · serie {ultima.serie || "—"} · fracción {ultima.fraccion || "sin detallar"}</p></div><span className="ml-auto text-sm font-semibold text-accent">Stock actualizado</span></div>}
  {camara && <div className="mt-5 max-w-xl"><Scanner onScan={code=>void procesar(code)}/></div>}
  {alta && <EntradaForm numero={alta} onClose={()=>{setAlta(null);input.current?.focus()}}/>}
 </>;
}
