import { Link, useNavigate } from "@tanstack/react-router";
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
import { useSesion } from "@/lib/sesion";
import { saldoAlbaran, pagosVisibles, diaMadrid } from "@/lib/contabilidad";
import { filtrarAlbaranes, type FiltrosCobro } from "@/lib/recibo";

const vacios: FiltrosCobro = { desde: "", hasta: "", localId: "", numero: "", estado: "" };

export function CobrosView() {
  const { albaranes, locales, cargado, pagos } = useStore();
  const nav = useNavigate();
  const sesion = useSesion();
  const [f, setF] = useState(vacios);
  const upd = (key: keyof FiltrosCobro, value: string) => setF((prev) => ({ ...prev, [key]: value }));
  const rows = filtrarAlbaranes(albaranes, f);
  const entregados = rows.reduce((s, a) => s + a.lineas.reduce((t, l) => t + l.cantidad, 0), 0);
  const cobrado = pagosVisibles(pagos,sesion.esAdmin,sesion.userId,diaMadrid()).filter(p=>rows.some(a=>a.id===p.albaran_id) && (!f.desde || diaMadrid(p.fecha)>=f.desde) && (!f.hasta || diaMadrid(p.fecha)<=f.hasta)).reduce((s,p)=>s+p.importe,0);
  const pendiente = rows.reduce((s,a)=>s+saldoAlbaran(a).pendiente,0);
  return <>
    <div className="mb-6 grid grid-cols-1 divide-y divide-border border-y border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      {sesion.esAdmin && <div className="py-4 sm:pr-5"><p className="text-sm text-muted-foreground">Décimos entregados</p><p className="mt-1 text-2xl font-bold">{entregados}</p></div>}
      <div className="py-4 sm:px-5"><p className="text-sm text-muted-foreground">{sesion.esAdmin ? "Cobrado" : "Mi cobro de hoy"}</p><p className="mt-1 text-2xl font-bold text-accent">{euros(cobrado)}</p></div>
      {sesion.esAdmin && <div className="py-4 sm:pl-5"><p className="text-sm text-muted-foreground">Pendiente de cobro</p><p className="mt-1 text-2xl font-bold text-primary">{euros(pendiente)}</p></div>}
    </div>
    <Tabs value={f.estado || "todos"} onValueChange={(v) => upd("estado", v === "todos" ? "" : v)}><TabsList className="mb-4"><TabsTrigger value="todos">Todos</TabsTrigger><TabsTrigger value="pendiente">Entregados</TabsTrigger><TabsTrigger value="parcial">Parciales</TabsTrigger><TabsTrigger value="pagado">Cobrados</TabsTrigger></TabsList></Tabs>
    <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <div><Label htmlFor="desde">Desde</Label><Input id="desde" type="date" value={f.desde} onChange={(e) => upd("desde", e.target.value)} /></div>
      <div><Label htmlFor="hasta">Hasta</Label><Input id="hasta" type="date" value={f.hasta} onChange={(e) => upd("hasta", e.target.value)} /></div>
      <div><Label htmlFor="cliente">Cliente</Label><Select value={f.localId || "todos"} onValueChange={(v) => upd("localId", v === "todos" ? "" : v)}><SelectTrigger id="cliente"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="todos">Todos los clientes</SelectItem>{locales.map((l) => <SelectItem key={l.id} value={l.id}>{l.nombre}</SelectItem>)}</SelectContent></Select></div>
      <div><Label htmlFor="numero">Número</Label><Input id="numero" inputMode="numeric" maxLength={5} value={f.numero} placeholder="00000" onChange={(e) => upd("numero", e.target.value.replace(/\D/g, ""))} /></div>
      <Button className="self-end" variant="secondary" onClick={() => setF(vacios)}><RotateCcw />Limpiar filtros</Button>
    </div>
    <div className="mb-8 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border text-left text-muted-foreground"><th className="py-3">Fecha / albarán</th><th>Cliente</th><th>Números</th><th className="text-right">Entregados</th><th className="text-right">Importe</th><th className="text-right text-destructive">Pendiente</th><th className="pl-4">Estado</th></tr></thead><tbody>{rows.map((a) => <tr key={a.id} className="border-b border-border"><td className="py-4 pr-4"><Link className="font-mono font-bold text-primary underline underline-offset-4" to="/albaran/$id" params={{ id: a.id }}>{a.id}</Link><p className="mt-1 whitespace-nowrap text-muted-foreground">{new Date(a.fechaPago ?? a.fecha).toLocaleDateString("es-ES")}</p></td><td className="pr-4">{locales.find((l) => l.id === a.localId)?.nombre}</td><td className="pr-4 font-mono">{[...new Set(a.lineas.map((l) => l.numero))].join(", ")}</td><td className="text-right">{a.lineas.reduce((s, l) => s + l.cantidad, 0)}</td><td className="pl-4 text-right whitespace-nowrap">{euros(a.total)}</td><td className="pl-4 text-right text-destructive whitespace-nowrap">{euros(saldoAlbaran(a).pendiente)}</td><td className={`pl-4 font-semibold ${saldoAlbaran(a).estado === "pagado" ? "text-accent" : "text-destructive"}`}>{saldoAlbaran(a).texto}</td></tr>)}</tbody></table></div>
    {!cargado && <p>Cargando albaranes…</p>}
    {cargado && !rows.length && <p className="mb-6 text-muted-foreground">No hay albaranes con estos filtros.</p>}
    <h2 className="mb-3 text-lg font-bold">Cobro por QR</h2>
    <Scanner qrOnly onScan={(t) => { const m = t.match(/(?:ALB-[A-Z0-9]+|MHL-\d+-\d+)/); if (!m) { toast.error("QR no reconocido"); return; } nav({ to: "/albaran/$id", params: { id: m[0] } }); }} />
  </>;
}