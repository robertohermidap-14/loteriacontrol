import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageTitle } from "@/components/AppShell";
import { Scanner } from "@/components/Scanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extraerNumero } from "@/lib/barcode";
import { actions, CENTRAL, getState } from "@/lib/store";

export const Route = createFileRoute("/escaner")({
  head: () => ({
    meta: [
      { title: "Escáner · Gestión Lotería" },
      { name: "description", content: "Escanea décimos para dar entrada o venderlos." },
      { property: "og:title", content: "Escáner · Gestión Lotería" },
      { property: "og:description", content: "Escanea décimos para dar entrada o venderlos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Escaner,
});

function Escaner() {
  const [modo, setModo] = useState<"entrada" | "venta">("entrada");
  const [cant, setCant] = useState(1);
  const [alta, setAlta] = useState<{ numero: string; serie: string; fraccion: string; cantidad: number } | null>(null);
  const [manual, setManual] = useState("");

  function procesar(numero: string) {
    const d = getState().decimos.find((x) => x.numero === numero && x.ubicacion === CENTRAL);
    if (modo === "entrada") {
      if (d) { actions.sumar(d.id, cant); toast.success(`${numero}: +${cant} décimos`); }
      else setAlta({ numero, serie: "", fraccion: "", cantidad: cant });
    } else if (!d) {
      toast.error(`${numero} no está en stock de la Administración`);
    } else {
      actions.restar(d.id, 1); toast.success(`${numero}: vendido 1 décimo`);
    }
  }
  function onScan(code: string) {
    const n = extraerNumero(code);
    if (!n) { toast.error("Código no válido"); return; }
    if (!alta) procesar(n);
  }

  return (
    <>
      <PageTitle sub="Lee el número (5 dígitos desde la posición 12 del código)">Escáner de décimos</PageTitle>
      <div className="mb-4 grid grid-cols-2 gap-3">
        <Button size="lg" className="h-16 text-lg" variant={modo === "entrada" ? "default" : "secondary"} onClick={() => setModo("entrada")}>Entrada</Button>
        <Button size="lg" className="h-16 text-lg" variant={modo === "venta" ? "destructive" : "secondary"} onClick={() => setModo("venta")}>Venta / Baja</Button>
      </div>
      {modo === "entrada" && (
        <div className="mb-4 flex items-center gap-3">
          <Label>Cantidad por escaneo</Label>
          <Input type="number" min={1} className="w-24" value={cant} onChange={(e) => setCant(Math.max(1, +e.target.value))} />
        </div>
      )}
      <Scanner onScan={onScan} />
      <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); const n = /^\d{5}$/.test(manual) ? manual : extraerNumero(manual); if (n) procesar(n); else toast.error("Introduce 5 dígitos o el código completo"); setManual(""); }}>
        <Input placeholder="Número o código manual" value={manual} onChange={(e) => setManual(e.target.value)} inputMode="numeric" />
        <Button type="submit">Aplicar</Button>
      </form>

      {alta && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-background/80 p-4">
          <form className="w-full max-w-sm space-y-3 rounded-2xl border border-border bg-card p-6"
            onSubmit={(e) => { e.preventDefault(); actions.altaDecimo({ ...alta, ubicacion: CENTRAL }); toast.success(`Alta de ${alta.numero}`); setAlta(null); }}>
            <h2 className="text-lg font-semibold">Nuevo número: <span className="font-mono text-primary">{alta.numero}</span></h2>
            <div><Label>Serie</Label><Input value={alta.serie} onChange={(e) => setAlta({ ...alta, serie: e.target.value })} /></div>
            <div><Label>Fracción</Label><Input value={alta.fraccion} onChange={(e) => setAlta({ ...alta, fraccion: e.target.value })} /></div>
            <div><Label>Cantidad</Label><Input type="number" min={1} value={alta.cantidad} onChange={(e) => setAlta({ ...alta, cantidad: Math.max(1, +e.target.value) })} /></div>
            <div className="flex gap-2 pt-2"><Button type="button" variant="secondary" className="flex-1" onClick={() => setAlta(null)}>Cancelar</Button><Button className="flex-1">Dar de alta</Button></div>
          </form>
        </div>
      )}
    </>
  );
}
