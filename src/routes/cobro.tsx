import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageTitle } from "@/components/AppShell";
import { Scanner } from "@/components/Scanner";
import { euros, useStore } from "@/lib/store";

export const Route = createFileRoute("/cobro")({
  head: () => ({
    meta: [
      { title: "Cobro en ruta · Gestión Lotería" },
      { name: "description", content: "Escanea el QR del albarán para liquidar la entrega." },
      { property: "og:title", content: "Cobro en ruta · Gestión Lotería" },
      { property: "og:description", content: "Escanea el QR del albarán para liquidar la entrega." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Cobro,
});

function Cobro() {
  const { albaranes, locales } = useStore();
  const nav = useNavigate();
  const pend = albaranes.filter((a) => a.estado === "pendiente");

  return (
    <>
      <PageTitle sub="Escanea el QR del albarán impreso">Cobro en ruta</PageTitle>
      <Scanner qrOnly onScan={(t) => {
        const m = t.match(/ALB-[A-Z0-9]+/);
        if (!m) { toast.error("QR no reconocido"); return; }
        nav({ to: "/albaran/$id", params: { id: m[0] } });
      }} />
      <h2 className="mb-2 mt-8 text-lg font-semibold">Albaranes pendientes</h2>
      <div className="space-y-2">
        {pend.map((a) => (
          <Link key={a.id} to="/albaran/$id" params={{ id: a.id }} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 hover:border-primary">
            <span className="min-w-0 truncate">{locales.find((l) => l.id === a.localId)?.nombre} · <span className="font-mono text-sm text-muted-foreground">{a.id}</span></span>
            <span className="shrink-0 text-sm">{a.lineas.reduce((s, l) => s + l.cantidad, 0)} déc.</span>
          </Link>
        ))}
        {!pend.length && <p className="text-muted-foreground">No hay albaranes pendientes.</p>}
      </div>
      <h2 className="mb-2 mt-8 text-lg font-semibold">Pagados</h2>
      <div className="space-y-2">
        {albaranes.filter((a) => a.estado === "pagado").map((a) => (
          <Link key={a.id} to="/albaran/$id" params={{ id: a.id }} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 opacity-80">
            <span className="min-w-0 truncate">{locales.find((l) => l.id === a.localId)?.nombre}</span>
            <span className="shrink-0 text-accent">{euros(a.total)}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
