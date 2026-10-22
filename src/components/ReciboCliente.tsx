import { useEffect, useState } from "react";
import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Recibo } from "@/lib/recibo";
import { generarPdf, descargarPdf } from "@/lib/recibo-pdf";
import { EMPRESA } from "@/lib/sesion";
import { euros } from "@/lib/store";

export function ReciboCliente({ recibo: r }: { recibo: Recibo }) {
  const [pdf, setPdf] = useState<Blob | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    generarPdf(r).then((b) => { if (alive) setPdf(b); }).catch(() => { if (alive) setError("No se pudo preparar el PDF. Puedes imprimir el albarán."); });
    return () => { alive = false; };
  }, [r]);
  const paid = r.estado === "pagado";
  return <main className="mx-auto max-w-3xl px-4 py-6">
    <div className="no-print mb-6 flex flex-wrap gap-3">
      <Button disabled={!pdf} onClick={() => { if (pdf) descargarPdf(pdf, `${r.id}.pdf`); }}><Download />{pdf ? "Descargar PDF" : error ? "PDF no disponible" : "Preparando PDF…"}</Button>
      <Button variant="secondary" onClick={() => window.print()}><Printer />Imprimir</Button>
    </div>
    {error && <p role="alert" className="no-print mb-4 text-destructive">{error}</p>}
    <article className="print-sheet space-y-6">
      <header className="border-b border-border pb-6">
        <p className="mb-3 font-semibold">{EMPRESA}</p>
        <h1 className="text-2xl font-bold">{paid ? "Recibo de cobro" : r.tipo === "deposito" ? "Albarán de depósito" : "Albarán de entrega"}</h1>
        <p className="mt-2 font-mono text-lg">{r.id}</p>
        <p className={`mt-4 text-2xl font-extrabold ${paid ? "text-accent" : "text-destructive"}`}>{paid ? "COBRADO" : "PENDIENTE DE COBRO"}</p>
      </header>
      <section><h2 className="text-xl font-bold">{r.localNombre}</h2><p className="text-muted-foreground">{r.localDireccion}</p><p className="mt-2">Entrega: {new Date(r.fecha).toLocaleString("es-ES")}</p></section>
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border text-left"><th className="py-3">Número / serie</th><th>Entregados</th><th>Devueltos</th>{paid && <th>Pagados</th>}<th className="text-right">Importe</th></tr></thead><tbody>{r.lineas.map((l, i) => <tr key={i} className="border-b border-border"><td className="py-3"><b className="font-mono">{l.numero}</b><span className="block text-muted-foreground">{l.serie || "—"} / {l.fraccion || "—"}</span></td><td>{l.cantidad}</td><td>{l.devueltos}</td>{paid && <td>{l.pagados}</td>}<td className="text-right whitespace-nowrap">{euros((paid ? l.pagados : l.cantidad) * 20)}</td></tr>)}</tbody></table></div>
      <div className="flex flex-wrap justify-between gap-3 text-xl font-bold"><span>{paid ? "TOTAL COBRADO" : r.tipo === "deposito" ? "TOTAL EN DEPÓSITO" : "TOTAL ENTREGADO"}</span><span>{euros(paid ? r.total : r.lineas.reduce((sum, l) => sum + l.cantidad * 20, 0))}</span></div>
      {r.receptorNombre && <section><p><b>Recoge:</b> {r.receptorNombre}</p>{r.firma && <img className="receipt-signature mt-3 h-24 max-w-full object-contain" src={r.firma} alt="Firma de quien recoge" />}</section>}
      {paid && <section className="border-t border-border pt-5"><p><b>Cobrado por:</b> {r.cobradoPor}</p><p className="mt-2"><b>Fecha y hora:</b> {new Date(r.fechaPago ?? r.fecha).toLocaleString("es-ES")}</p>{r.firmaCobro && <img className="receipt-signature mt-3 h-24 max-w-full object-contain" src={r.firmaCobro} alt="Firma de quien cobra" />}</section>}
    </article>
  </main>;
}