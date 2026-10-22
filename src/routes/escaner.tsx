import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageTitle } from "@/components/AppShell";
import { Scanner } from "@/components/Scanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EntradaForm } from "@/components/EntradaForm";
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
  const [alta, setAlta] = useState<string | null>(null);
  const [ventaNumero,setVentaNumero]=useState("");
  const [manual, setManual] = useState("");

  function procesar(numero: string) {
    if (modo === "entrada") { setAlta(numero); return; }
    const d = getState().decimos.find((x) => x.numero === numero && x.ubicacion === CENTRAL && x.estado === "venta");
    if (!d) toast.error(`${numero} no tiene stock en venta en la Administración`);
    else { setVentaNumero(numero); }
  }
  function onScan(code: string) {
    const n = extraerNumero(code);
    if (!n) { toast.error("Código no válido"); return; }
    if (!alta && !ventaNumero) procesar(n);
  }

  return (
    <>
      <PageTitle sub="Lee el número (5 dígitos desde la posición 12 del código)">Escáner de décimos</PageTitle>
      <div className="mb-4 grid grid-cols-2 gap-3">
        <Button size="lg" className="h-16 text-lg" variant={modo === "entrada" ? "default" : "secondary"} onClick={() => setModo("entrada")}>Entrada (recepción)</Button>
        <Button size="lg" className="h-16 text-lg" variant={modo === "venta" ? "destructive" : "secondary"} onClick={() => setModo("venta")}>Venta / Baja</Button>
      </div>
      <Scanner onScan={onScan} />
      <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); const n = /^\d{5}$/.test(manual) ? manual : extraerNumero(manual); if (n) procesar(n); else toast.error("Introduce 5 dígitos o el código completo"); setManual(""); }}>
        <Input placeholder="Número o código manual" value={manual} onChange={(e) => setManual(e.target.value)} inputMode="numeric" />
        <Button type="submit">Aplicar</Button>
      </form>
      {ventaNumero && <section className="mt-5 space-y-3"><h2 className="font-bold">Vender {ventaNumero} · serie y fracción</h2>{getState().decimos.filter(d=>d.numero===ventaNumero && d.ubicacion===CENTRAL && d.estado==="venta" && d.cantidad>0).map(d=><Button key={d.id} variant="secondary" className="mr-2" onClick={async()=>{await actions.restar(d.id,1);toast.success(`Vendido: serie ${d.serie}, fracción ${d.fraccion || "sin detallar"}`);setVentaNumero("")}}>Serie {d.serie} · F {d.fraccion || "—"}</Button>)}<Button variant="ghost" onClick={()=>setVentaNumero("")}>Cancelar</Button></section>}
      {alta && <EntradaForm numero={alta} onClose={() => setAlta(null)} />}
    </>
  );
}
