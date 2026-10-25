import { useEffect, useState } from "react";
import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Recibo } from "@/lib/recibo";
import { generarPdf, descargarPdf } from "@/lib/recibo-pdf";
import { EMPRESA } from "@/lib/sesion";
import { QRCodeSVG } from "qrcode.react";
import { saldoAlbaran } from "@/lib/contabilidad";
import { euros } from "@/lib/store";
import { LOTERIAS } from "@/lib/loteria";
import { agruparLineas } from "@/lib/albaran-compacto";
import { enlaceAlbaran } from "@/lib/enlaces";

export function ReciboCliente({ recibo: r, controles = true }: { recibo: Recibo; controles?: boolean }) {
  const [pdf, setPdf] = useState<Blob | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    setPdf(null);setError("");
    generarPdf(r).then((b) => { if (alive) setPdf(b); }).catch(() => { if (alive) setError("No se pudo preparar el PDF. Puedes imprimir el albarán."); });
    return () => { alive = false; };
  }, [r]);
  const saldo = saldoAlbaran(r);
  const paid = saldo.estado === "pagado";
  return <main className="mx-auto max-w-3xl px-4 py-6">
    {controles && <div className="no-print mb-6 flex flex-wrap gap-3">
      <Button disabled={!pdf} onClick={() => { if (pdf) descargarPdf(pdf, `${r.id}.pdf`); }}><Download />{pdf ? "Descargar PDF" : error ? "PDF no disponible" : "Preparando PDF…"}</Button>
      <Button variant="secondary" onClick={() => window.print()}><Printer />Imprimir</Button>
    </div>}
    {error && <p role="alert" className="no-print mb-4 text-destructive">{error}</p>}
    <article className="print-sheet space-y-6">
      <header className="border-b border-border pb-6">
        {r.administracion?.logo && <img src={r.administracion.logo} alt="Logo de la administración" className="mb-4 h-20 max-w-48 object-contain"/>}
        <p className="font-bold">{r.administracion?.nombre || EMPRESA}</p>
        <p>{r.administracion?.razon_social}</p><p>{r.administracion?.nif && `NIF: ${r.administracion.nif}`}</p><p>{r.administracion?.direccion}</p><p>{[r.administracion?.telefono,r.administracion?.email].filter(Boolean).join(" · ")}</p>
        <p className="my-3 font-semibold">{LOTERIAS.find(l=>l.id===(r.loteria ?? "navidad"))?.nombre}</p>
        <div className="float-right ml-3 bg-card p-2"><QRCodeSVG value={r.cobroUrl ?? enlaceAlbaran(r.id)} size={120} marginSize={4} bgColor="white" fgColor="black" /></div>
        <h2 className="text-xl font-bold">{r.localNombre}</h2><p>Cliente {String(r.codigoCliente ?? "—").padStart(4,"0")}</p><p>{r.localDireccion}</p><p>{r.localTelefono}</p>
        <p>{r.localPersona}{r.localDni && ` · DNI: ${r.localDni}`}</p><p className="mb-3">{r.localEmail}</p>
        <h1 className="text-2xl font-bold">{paid ? "Recibo de cobro" : r.tipo === "deposito" ? "Albarán de depósito" : "Albarán de entrega"}</h1>
        <p className="mt-2 font-mono text-lg">{r.id}</p>
        <p className={`mt-4 text-2xl font-extrabold ${paid ? "text-accent" : "text-destructive"}`}>{saldo.texto}</p>
      </header>
      <section><h2 className="text-xl font-bold">{r.localNombre}</h2><p className="text-muted-foreground">{r.localDireccion}</p><p className="mt-2">Entrega: {new Date(r.fecha).toLocaleString("es-ES")}</p></section>
      <section className="space-y-3">{agruparLineas(r.lineas).map(g=><div key={g.numero} className="border-b border-border pb-3"><div className="flex justify-between gap-2"><b className="font-mono text-xl">{g.numero}</b><span>{g.cantidad} décimos</span></div>{g.series && <p className="text-sm">{g.series}</p>}{g.sueltas.map(x=><p key={x} className="text-xs text-muted-foreground">{x}</p>)}{(g.pagados>0 || g.devueltos>0) && <p className="text-sm">Pagados: {g.pagados} · Devueltos: {g.devueltos}</p>}</div>)}</section>
      <p className="text-sm"><b>Entrega:</b> {r.entregadoPor || "Sin identidad registrada en el albarán anterior"}</p>
      <div className="flex flex-wrap justify-between gap-3 text-xl font-bold"><span>{r.tipo === "deposito" ? "TOTAL EN DEPÓSITO" : "TOTAL ENTREGADO"}</span><span>{euros(saldo.entregado)}</span></div>
      <div className="flex justify-between font-bold"><span>Total cobrado</span><span>{euros(r.total)}</span></div><div className="flex justify-between text-xl font-bold text-destructive"><span>Pendiente de cobro</span><span>{euros(saldo.pendiente)}</span></div>
      {r.receptorNombre && <section><p><b>Recoge:</b> {r.receptorNombre} · DNI: {r.receptorDni || "—"}</p>{r.firma && <img className="receipt-signature mt-3 h-24 max-w-full object-contain" src={r.firma} alt="Firma de quien recoge" />}</section>}
      {(r.total>0 || r.firmaCobro) && <section className="border-t border-border pt-5"><p><b>Cobrado por:</b> {r.cobradoPor}</p><p className="mt-2"><b>Fecha y hora:</b> {new Date(r.fechaPago ?? r.fecha).toLocaleString("es-ES")}</p>{r.firmaCobro && <img className="receipt-signature mt-3 h-24 max-w-full object-contain" src={r.firmaCobro} alt="Firma de quien cobra" />}</section>}
    </article>
  </main>;
}