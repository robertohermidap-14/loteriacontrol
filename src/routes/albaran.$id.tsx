import { createFileRoute } from "@tanstack/react-router";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Firma } from "@/components/Firma";
import { actions, euros, PRECIO_DECIMO, useStore, type Linea } from "@/lib/store";
import { EMPRESA, nombreCobrador, useSesion } from "@/lib/sesion";
import { crearEnlaceRecibo } from "@/lib/recibos.functions";
import { reciboDeAlbaran, telefonoWhatsApp } from "@/lib/recibo";
import { generarPdf, descargarPdf } from "@/lib/recibo-pdf";
import { Download, Share2 } from "lucide-react";

export const Route = createFileRoute("/albaran/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Albarán ${params.id} · Gestión Lotería` },
      { name: "description", content: "Albarán de entrega y liquidación de décimos." },
      { property: "og:title", content: `Albarán ${params.id}` },
      { property: "og:description", content: "Albarán de entrega y liquidación de décimos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AlbaranPage,
});

function AlbaranPage() {
  const { id } = Route.useParams();
  const { albaranes, locales } = useStore();
  const sesion = useSesion();
  const a = albaranes.find((x) => x.id === id);
  const local = locales.find((l) => l.id === a?.localId);
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [url, setUrl] = useState("");
  const [cobrando, setCobrando] = useState(false);
  const [firmaCobro, setFirmaCobro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [pdf, setPdf] = useState<Blob | null>(null);
  const [puedeCompartir, setPuedeCompartir] = useState(false);
  useEffect(() => { if (a) setLineas(a.lineas); }, [a]);
  useEffect(() => { setUrl(`${window.location.origin}/albaran/${id}`); }, [id]);
  useEffect(() => {
    let alive = true;
    setPdf(null);
    if (a) generarPdf(reciboDeAlbaran(a, local)).then((b) => {
      if (!alive) return;
      setPdf(b);
      setPuedeCompartir(Boolean(navigator.canShare?.({ files: [new File([b], `${a.id}.pdf`, { type: "application/pdf" })] })));
    }).catch(() => { if (alive) toast.error("No se pudo generar el PDF; puedes imprimir el albarán."); });
    return () => { alive = false; };
  }, [a, local]);

  if (!a) return <p className="text-muted-foreground">Albarán no encontrado.</p>;
  const pagado = a.estado === "pagado";
  const total = lineas.reduce((s, l) => s + l.pagados * PRECIO_DECIMO, 0);
  const upd = (i: number, k: "devueltos" | "pagados", v: number) =>
    setLineas(lineas.map((l, j) => {
      if (j !== i) return l;
      const n = Math.max(0, Math.min(l.cantidad, v));
      return k === "devueltos" ? { ...l, devueltos: n, pagados: Math.min(l.pagados, l.cantidad - n) } : { ...l, pagados: Math.min(n, l.cantidad - l.devueltos) };
    }));

  const wa = async () => {
    let telefono: string;
    try { telefono = telefonoWhatsApp(local?.telefono ?? ""); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Revisa el teléfono del local."); return; }
    // Reserve the tab during the click, before the async request loses user activation.
    const tab = window.open("about:blank", "_blank");
    if (tab) tab.opener = null;
    setEnviando(true);
    try {
      const { token } = await crearEnlaceRecibo({ data: { id: a.id } });
      const copia = `https://pinpoint-code-slice.lovable.app/recibo/${token}`;
      const txt = [pagado ? `*Recibo de pago - ${a.id}*` : `*Albarán - ${a.id}*`,
        EMPRESA, `Local: ${local?.nombre ?? ""}`,
        pagado ? `TOTAL COBRADO: ${euros(a.total)}` : `${a.tipo === "deposito" ? "TOTAL EN DEPÓSITO" : "TOTAL ENTREGADO"}: ${euros(a.lineas.reduce((s, l) => s + l.cantidad * PRECIO_DECIMO, 0))}`,
        `Ver, descargar PDF o imprimir: ${copia}`].join("\n");
      const destino = `https://wa.me/${telefono}?text=${encodeURIComponent(txt)}`;
      if (tab) tab.location.href = destino;
      else window.location.assign(destino);
    } catch (err) {
      tab?.close();
      toast.error(err instanceof Error ? err.message : "No se pudo preparar el envío.");
    } finally { setEnviando(false); }
  };

  const compartirPdf = async () => {
    if (!pdf) return;
    try { await navigator.share({ files: [new File([pdf], `${a.id}.pdf`, { type: "application/pdf" })], title: a.id }); }
    catch (err) { if (!(err instanceof DOMException && err.name === "AbortError")) toast.error("No se pudo compartir el PDF. Descárgalo para adjuntarlo en WhatsApp."); }
  };

  const confirmarCobro = async () => {
    if (!firmaCobro) { toast.error("Falta la firma de quien cobra"); return; }
    await actions.liquidar(a.id, lineas, { cobradoPor: nombreCobrador(sesion), firmaCobro });
    setCobrando(false);
    toast.success("Albarán saldado como cobrado");
  };

  return (
    <div className="print-sheet mx-auto max-w-2xl rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{a.tipo === "deposito" ? "Albarán de depósito" : "Albarán de entrega"}</p>
          <h1 className="font-mono text-2xl font-bold">{a.id}</h1>
          <p className="mt-2 font-semibold">{local?.nombre}</p>
          <p className="text-sm text-muted-foreground">{local?.direccion}</p>
          <p className="text-sm text-muted-foreground">{new Date(a.fecha).toLocaleString("es-ES")}</p>
          <span className={`mt-3 inline-block rounded-lg px-4 py-2 text-xl font-extrabold tracking-wide sm:text-2xl ${pagado ? "bg-accent text-accent-foreground" : "bg-destructive text-destructive-foreground"}`}>
            {pagado ? "COBRADO" : "PENDIENTE DE COBRO"}
          </span>
        </div>
        <div className="shrink-0 rounded-lg bg-foreground p-2"><QRCodeSVG value={url || a.id} size={120} /></div>
      </div>

      <table className="mt-6 w-full text-sm">
        <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="py-2">Número</th><th>Entreg.</th><th>Devuelve</th><th>Paga</th><th className="text-right">Importe</th></tr></thead>
        <tbody>
          {lineas.map((l, i) => (
            <tr key={i} className="border-b border-border">
              <td className="py-2 font-mono text-lg font-bold text-primary">{l.numero}</td>
              <td>{l.cantidad}</td>
              {(["devueltos", "pagados"] as const).map((k) => (
                <td key={k}>
                  {pagado ? l[k] : (
                    <div className="no-print flex items-center gap-1">
                      <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => upd(i, k, l[k] - 1)}>−</Button>
                      <span className="w-6 text-center">{l[k]}</span>
                      <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => upd(i, k, l[k] + 1)}>+</Button>
                    </div>
                  )}
                </td>
              ))}
              <td className="text-right">{euros(l.pagados * PRECIO_DECIMO)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex justify-between text-xl font-bold">
        <span>{a.tipo === "deposito" ? "TOTAL EN DEPÓSITO" : "Total a cobrar"}</span>
        <span className="text-primary">{euros(pagado ? a.total : total)}</span>
      </div>

      {a.tipo === "deposito" && (
        <div className="mt-6 rounded-xl border border-border p-4 text-sm">
          <p><b>Recoge:</b> {a.receptorNombre} · <b>DNI:</b> {a.receptorDni}</p>
          <p><b>Fecha del depósito:</b> {new Date(a.fecha).toLocaleDateString("es-ES")}</p>
          {a.firma && <img src={a.firma} alt="Firma de quien recoge" className="mt-2 h-28 rounded-lg border border-border bg-white" />}
        </div>
      )}

      {pagado && (
        <div className="mt-6 rounded-xl border border-accent p-4 text-sm">
          <p><b>Cobrado por:</b> {a.cobradoPor}</p>
          <p><b>Fecha y hora del cobro:</b> {new Date(a.fechaPago ?? "").toLocaleString("es-ES")}</p>
          {a.firmaCobro && <img src={a.firmaCobro} alt="Firma de quien cobra" className="mt-2 h-28 rounded-lg border border-border bg-white" />}
        </div>
      )}

      {!pagado && cobrando && (
        <div className="no-print mt-6 space-y-3 rounded-2xl border border-primary p-4">
          <p className="text-sm">Cobra: <b>{nombreCobrador(sesion)}</b></p>
          <Firma onChange={setFirmaCobro} />
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setCobrando(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={confirmarCobro}>Confirmar cobro de {euros(total)}</Button>
          </div>
        </div>
      )}

      <div className="no-print mt-6 grid gap-2 sm:grid-cols-3">
        <Button variant="secondary" size="lg" onClick={() => window.print()}>Imprimir albarán</Button>
        {!pagado && !cobrando && <Button size="lg" onClick={() => setCobrando(true)}>Saldar como cobrado</Button>}
        <Button size="lg" variant="default" disabled={enviando} onClick={wa}>{enviando ? "Preparando envío…" : "Enviar por WhatsApp"}</Button>
        <Button size="lg" variant="secondary" disabled={!pdf} onClick={() => { if (pdf) descargarPdf(pdf, `${a.id}.pdf`); }}><Download />Descargar PDF</Button>
        {puedeCompartir && <Button size="lg" variant="secondary" disabled={!pdf} onClick={compartirPdf}><Share2 />Compartir PDF</Button>}
      </div>
    </div>
  );
}
