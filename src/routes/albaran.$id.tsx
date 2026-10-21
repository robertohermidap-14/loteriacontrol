import { createFileRoute } from "@tanstack/react-router";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { actions, euros, PRECIO_DECIMO, useStore, type Linea } from "@/lib/store";

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
  const a = albaranes.find((x) => x.id === id);
  const local = locales.find((l) => l.id === a?.localId);
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [url, setUrl] = useState("");
  useEffect(() => { if (a) setLineas(a.lineas); }, [a]);
  useEffect(() => { setUrl(`${window.location.origin}/albaran/${id}`); }, [id]);

  if (!a) return <p className="text-muted-foreground">Albarán no encontrado.</p>;
  const pagado = a.estado === "pagado";
  const total = lineas.reduce((s, l) => s + l.pagados * PRECIO_DECIMO, 0);
  const upd = (i: number, k: "devueltos" | "pagados", v: number) =>
    setLineas(lineas.map((l, j) => {
      if (j !== i) return l;
      const n = Math.max(0, Math.min(l.cantidad, v));
      return k === "devueltos" ? { ...l, devueltos: n, pagados: Math.min(l.pagados, l.cantidad - n) } : { ...l, pagados: Math.min(n, l.cantidad - l.devueltos) };
    }));

  const wa = () => {
    const txt = [`*Recibo de pago - ${a.id}*`, `Local: ${local?.nombre ?? ""}`, `Fecha: ${new Date(a.fechaPago ?? "").toLocaleString("es-ES")}`, "",
      ...a.lineas.map((l) => `${l.numero} · entregados ${l.cantidad} · devueltos ${l.devueltos} · pagados ${l.pagados} = ${euros(l.pagados * PRECIO_DECIMO)}`),
      "", `*TOTAL PAGADO: ${euros(a.total)}*`, "", `Albarán digital: ${url}`].join("\n");
    window.open(`https://wa.me/${(local?.telefono ?? "").replace(/\D/g, "")}?text=${encodeURIComponent(txt)}`, "_blank");
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
          <span className={`mt-2 inline-block rounded-md px-2 py-1 text-xs font-semibold ${pagado ? "bg-accent text-accent-foreground" : "bg-secondary"}`}>{pagado ? "COBRADO" : "PENDIENTE DE COBRO"}</span>
        </div>
        <div className="shrink-0 rounded-lg bg-foreground p-2"><QRCodeSVG value={a.id} size={120} /></div>
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
      <div className="mt-4 flex justify-between text-xl font-bold"><span>Total a cobrar</span><span className="text-primary">{euros(pagado ? a.total : total)}</span></div>

      {a.tipo === "deposito" && (
        <div className="mt-6 rounded-xl border border-border p-4 text-sm">
          <p><b>Recoge:</b> {a.receptorNombre} · <b>DNI:</b> {a.receptorDni}</p>
          <p><b>Fecha del depósito:</b> {new Date(a.fecha).toLocaleDateString("es-ES")}</p>
          {a.firma && <img src={a.firma} alt="Firma de quien recoge" className="mt-2 h-28 rounded-lg border border-border bg-white" />}
        </div>
      )}
      <div className="no-print mt-6 grid gap-2 sm:grid-cols-2">
        <Button variant="secondary" size="lg" onClick={() => window.print()}>Imprimir albarán</Button>
        {pagado
          ? <Button size="lg" variant="default" onClick={wa}>Enviar albarán de pago por WhatsApp</Button>
          : <Button size="lg" onClick={() => actions.liquidar(a.id, lineas)}>Saldar como cobrado</Button>}
      </div>
    </div>
  );
}
