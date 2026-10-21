import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { actions, CENTRAL } from "@/lib/store";

/** Alta de stock en recepción. Permite un bloque de series (desde–hasta) con N décimos por serie. */
export function EntradaForm({ numero, onClose }: { numero: string; onClose: () => void }) {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [fraccion, setFraccion] = useState("");
  const [cant, setCant] = useState(1);
  const a = parseInt(desde, 10), b = parseInt(hasta, 10);
  const bloque = !isNaN(a) && !isNaN(b) && b >= a ? b - a + 1 : 0;
  const series = bloque ? Array.from({ length: bloque }, (_, i) => String(a + i)) : [desde];
  const total = series.length * cant;

  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-background/80 p-4">
      <form className="w-full max-w-sm space-y-3 rounded-2xl border border-border bg-card p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          if (bloque > 500) { toast.error("Máximo 500 series por bloque"); return; }
          await actions.altaBloque(series.map((serie) => ({ numero, serie, fraccion, cantidad: cant, ubicacion: CENTRAL, estado: "recepcion" })));
          toast.success(`${numero}: +${total} décimos en recepción`);
          onClose();
        }}>
        <h2 className="text-lg font-semibold">Entrada del número <span className="font-mono text-primary">{numero}</span></h2>
        <div className="grid grid-cols-2 gap-2">
          <div><Label>Serie desde</Label><Input inputMode="numeric" value={desde} onChange={(e) => setDesde(e.target.value)} /></div>
          <div><Label>Serie hasta</Label><Input inputMode="numeric" placeholder="(opcional)" value={hasta} onChange={(e) => setHasta(e.target.value)} /></div>
        </div>
        <div><Label>Fracción</Label><Input value={fraccion} onChange={(e) => setFraccion(e.target.value)} /></div>
        <div><Label>Décimos por serie</Label><Input type="number" min={1} value={cant} onChange={(e) => setCant(Math.max(1, +e.target.value))} /></div>
        <p className="rounded-lg bg-secondary p-3 text-center text-lg font-semibold">Total: {total} décimos{bloque > 1 ? ` (${bloque} series)` : ""}</p>
        <div className="flex gap-2 pt-2"><Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancelar</Button><Button className="flex-1">Añadir al stock</Button></div>
      </form>
    </div>
  );
}
