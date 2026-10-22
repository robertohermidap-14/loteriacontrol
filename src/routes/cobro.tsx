import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";
import { PageTitle } from "@/components/AppShell";
import { Scanner } from "@/components/Scanner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { euros, PRECIO_DECIMO, useStore } from "@/lib/store";
import { filtrarAlbaranes, type FiltrosCobro } from "@/lib/recibo";

export const Route = createFileRoute("/cobro")({
  head: () => ({ meta: [
    { title: "Entregas y cobros · Gestión Lotería" },
    { name: "description", content: "Registro de albaranes entregados y cobrados por fecha, cliente y número." },
    { property: "og:title", content: "Entregas y cobros · Gestión Lotería" },
    { property: "og:description", content: "Registro de entregas, depósitos y pagos del segundo canal." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: Cobro,
});
const vacios: FiltrosCobro = { desde: "", hasta: "", localId: "", numero: "", estado: "" };

function Cobro() {
  const { albaranes, locales, cargado } = useStore();
  const nav = useNavigate();
  const [f, setF] = useState(vacios);
  const upd = (key: keyof FiltrosCobro, value: string) => setF((prev) => ({ ...prev, [key]: value }));
  const rows = filtrarAlbaranes(albaranes, f);
  const entregados = rows.reduce((s, a) => s + a.lineas.reduce((t, l) => t + l.cantidad, 0), 0);
  const cobrado = rows.filter((a) => a.estado === "pagado").reduce((s, a) => s + a.total, 0);
  const pendiente = rows.filter((a) => a.estado === "pendiente").reduce((s, a) => s + a.lineas.reduce((t, l) => t + (l.cantidad - l.devueltos) * PRECIO_DECIMO, 0), 0);
  return <>
    <PageTitle>Entregas y cobros</PageTitle>
    <div className="mb-6 grid grid-cols-1 divide-y divide-border border-y border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      <div className="py-4 sm:pr-5"><p className="text-sm text-muted-foreground">Décimos entregados</p><p className="mt-1 text-2xl font-bold">{entregados}</p></div>
      <div className="py-4 sm:px-5"><p className="text-sm text-muted-foreground">Cobrado</p><p className="mt-1 text-2xl font-bold text-accent">{euros(cobrado)}</p></div>
      <div className="py-4 sm:pl-5"><p className="text-sm text-muted-foreground">Pendiente de cobro</p><p className="mt-1 text-2xl font-bold text-primary">{euros(pendiente)}</p></div>
    </div>
    <Tabs value={f.estado || "todos"} onValueChange={(v) => upd("estado", v === "todos" ? "" : v)}><TabsList className="mb-4"><TabsTrigger value="todos">Todos</TabsTrigger><TabsTrigger value="pendiente">Entregados</TabsTrigger><TabsTrigger value="pagado">Cobrados</TabsTrigger></TabsList></Tabs>
    <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <div><Label htmlFor="desde">Desde</Label><Input id="desde" type="date" value={f.desde} onChange={(e) => upd("desde", e.target.value)} /></div>
      <div><Label htmlFor="hasta">Hasta</Label><Input id="hasta" type="date" value={f.hasta} onChange={(e) => upd("hasta", e.target.value)} /></div>
      <div><Label htmlFor="cliente">Cliente</Label><Select value={f.localId || "todos"} onValueChange={(v) => upd("localId", v === "todos" ? "" : v)}><SelectTrigger id="cliente"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos los clientes</SelectItem>{locales.map((l) => <SelectItem key={l.id} value={l.id}>{l.nombre}</SelectItem>)}</SelectContent></Select></div>
      <div><Label htmlFor="numero">Número</Label><Input id="numero" inputMode="numeric" maxLength={5} value={f.numero} placeholder="00000" onChange={(e) => upd("numero", e.target.value.replace(/\D/g, ""))} /></div>
      <Button className="self-end" variant="secondary" onClick={() => setF(vacios)}><RotateCcw />Limpiar filtros</Button>
    </div>
    <div className="mb-8 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border text-left text-muted-foreground"><th className="py-3">Fecha / albarán</th><th>Cliente</th><th>Números</th><th className="text-right">Entregados</th><th className="text-right">Importe</th><th className="pl-4">Estado</th></tr></thead><tbody>{rows.map((a) => <tr key={a.id} className="border-b border-border"><td className="py-4 pr-4"><Link className="font-mono font-bold text-primary underline underline-offset-4" to="/albaran/$id" params={{ id: a.id }}>{a.id}</Link><p className="mt-1 whitespace-nowrap text-muted-foreground">{new Date(a.fechaPago ?? a.fecha).toLocaleDateString("es-ES")}</p></td><td className="pr-4">{locales.find((l) => l.id === a.localId)?.nombre}</td><td className="pr-4 font-mono">{[...new Set(a.lineas.map((l) => l.numero))].join(", ")}</td><td className="text-right">{a.lineas.reduce((s, l) => s + l.cantidad, 0)}</td><td className="pl-4 text-right whitespace-nowrap">{euros(a.estado === "pagado" ? a.total : a.lineas.reduce((s, l) => s + (l.cantidad - l.devueltos) * PRECIO_DECIMO, 0))}</td><td className={`pl-4 font-semibold ${a.estado === "pagado" ? "text-accent" : "text-primary"}`}>{a.estado === "pagado" ? "COBRADO" : a.tipo === "deposito" ? "EN DEPÓSITO" : "ENTREGADO"}</td></tr>)}</tbody></table></div>
    {!cargado && <p>Cargando albaranes…</p>}
    {cargado && !rows.length && <p className="mb-6 text-muted-foreground">No hay albaranes con estos filtros.</p>}
    <h2 className="mb-3 text-lg font-bold">Cobro por QR</h2>
    <Scanner qrOnly onScan={(t) => { const m = t.match(/ALB-[A-Z0-9]+/); if (!m) { toast.error("QR no reconocido"); return; } nav({ to: "/albaran/$id", params: { id: m[0] } }); }} />
  </>;
}