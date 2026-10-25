import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SelectorFracciones } from "@/components/SelectorFracciones";
import { crearEntrada, FRACCIONES } from "@/lib/fracciones";
import { actions } from "@/lib/store";
import { SelectorRangoSeries } from "@/components/SelectorRangoSeries";
import { Loader2 } from "lucide-react";

/** Alta de stock en recepción. Permite un bloque de series (desde–hasta) con N décimos por serie. */
export function EntradaForm({ numero, onClose }: { numero: string; onClose: () => void }) {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [fracciones, setFracciones] = useState<string[]>([...FRACCIONES]);
  const [guardando, setGuardando] = useState(false);
  const a = parseInt(desde, 10), b = parseInt(hasta, 10);
  const bloque = !isNaN(a) && !isNaN(b) && b >= a ? b - a + 1 : 0;
  const series = bloque ? Array.from({ length: bloque }, (_, i) => String(a + i)) : [desde];
  const total = series.length * fracciones.length;

  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-background/80 p-4">
      <form className="max-h-[90dvh] w-full max-w-sm space-y-3 overflow-y-auto rounded-lg border border-border bg-card p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          if (bloque > 500) { toast.error("Máximo 500 series por bloque"); return; }
          setGuardando(true);
          try { await actions.altaBloque(crearEntrada(numero,a, hasta ? b : a,fracciones)); toast.success(`${numero}: +${total} décimos en recepción`); onClose(); } catch(err) { toast.error(err instanceof Error ? err.message : "No se pudo añadir"); } finally {setGuardando(false);}
        }}>
        <h2 className="text-lg font-semibold">Entrada del número <span className="font-mono text-primary">{numero}</span></h2>
        <SelectorRangoSeries desde={desde} hasta={hasta} onDesde={setDesde} onHasta={setHasta}/>
        <div><Label>Bloques rápidos de series</Label><div className="mt-1 flex flex-wrap gap-2">{[1,5,10,15,20,50].map(n=><Button key={n} type="button" size="icon" className="h-12 w-12 font-mono text-lg" aria-label={`Bloque de ${n} series`} variant={bloque===n?"default":"secondary"} onClick={()=>{const inicio=Math.max(1,Number(desde)||1);setDesde(String(inicio));setHasta(n>1?String(inicio+n-1):"");}}>{n}</Button>)}</div></div>
        <div><Label>Fracciones por serie</Label><SelectorFracciones value={fracciones} onChange={setFracciones} /></div>
        <p className="rounded-lg bg-secondary p-3 text-center text-lg font-semibold">Total: {total} décimos{bloque > 1 ? ` (${bloque} series)` : ""}</p>
        <div className="flex flex-wrap gap-2 pt-2"><Button disabled={guardando} type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancelar</Button><Button disabled={guardando || !fracciones.length || !desde} className="flex-1">{guardando && <Loader2 className="motion-safe:animate-spin"/>}{guardando?"Añadiendo…":"Añadir al stock"}</Button></div>
      </form>
    </div>
  );
}
