import type { Tables, Json } from "@/integrations/supabase/types";
import type { PagoCaja, MetodoPago } from "@/lib/contabilidad";
import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

export const CENTRAL = "central";
export const PRECIO_DECIMO = 20;

export type Decimo = { id: string; numero: string; serie: string; fraccion: string; cantidad: number; ubicacion: string; estado: "recepcion" | "venta" };
export type Local = { id: string; nombre: string; direccion: string; telefono: string; codigoCliente?: number };
export type Linea = { numero: string; serie: string; fraccion: string; cantidad: number; devueltos: number; pagados: number };
export type Albaran = { id: string; localId: string; fecha: string; lineas: Linea[]; estado: "pendiente" | "parcial" | "pagado"; total: number; fechaPago?: string | undefined; tipo: "entrega" | "deposito"; receptorNombre: string; receptorDni: string; firma: string; cobradoPor: string; firmaCobro: string };
export type Cobro = { cobradoPor: string; firmaCobro: string; importe: number; metodo: MetodoPago; solicitud: string };
export type Deposito = { tipo: "entrega" | "deposito"; receptorNombre: string; receptorDni: string; firma: string };
type State = { decimos: Decimo[]; locales: Local[]; albaranes: Albaran[]; pagos: PagoCaja[]; cierres: Tables<"cierres_caja">[]; cargado: boolean };

const empty: State = { decimos: [], locales: [], albaranes: [], pagos: [], cierres: [], cargado: false };
let state: State = empty;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export async function recargar() {
  const [d, l, a, p, c] = await Promise.all([
    supabase.from("decimos").select("*"),
    supabase.from("locales").select("*").order("nombre"),
    supabase.from("albaranes").select("*").order("fecha", { ascending: false }),
    supabase.from("pagos").select("*").order("fecha", {ascending:false}),
    supabase.from("cierres_caja").select("*").order("dia", {ascending:false}),
  ]);
  for (const result of [d,l,a,p,c]) if(result.error) throw new Error(result.error.message);
  state = {
    pagos: (p.data ?? []).map(x=>({...x,importe:Number(x.importe)})),
    cierres: c.data ?? [],
    cargado: true,
    decimos: (d.data ?? []).map((x) => ({ id: x.id, numero: x.numero, serie: x.serie, fraccion: x.fraccion, cantidad: x.cantidad, ubicacion: x.ubicacion, estado: (x.estado as Decimo["estado"]) ?? "venta" })),
    locales: (l.data ?? []).map((x) => ({ id: x.id, nombre: x.nombre, direccion: x.direccion, telefono: x.telefono, codigoCliente: x.codigo_cliente })),
    albaranes: (a.data ?? []).map((x) => ({ id: x.id, localId: x.local_id, fecha: x.fecha, lineas: x.lineas as unknown as Linea[], estado: x.estado as Albaran["estado"], total: Number(x.total), fechaPago: x.fecha_pago ?? undefined, tipo: (x.tipo as Albaran["tipo"]) ?? "entrega", receptorNombre: x.receptor_nombre, receptorDni: x.receptor_dni, firma: x.firma, cobradoPor: x.cobrado_por, firmaCobro: x.firma_cobro })),
  };
  emit();
}

let channel: ReturnType<typeof supabase.channel> | null = null;
export function conectar() {
  if (channel) return;
  recargar();
  let t: ReturnType<typeof setTimeout> | undefined;
  const debounce = () => { clearTimeout(t); t = setTimeout(recargar, 200); };
  channel = supabase.channel("loteria")
    .on("postgres_changes", { event: "*", schema: "public", table: "decimos" }, debounce)
    .on("postgres_changes", { event: "*", schema: "public", table: "locales" }, debounce)
    .on("postgres_changes", { event: "*", schema: "public", table: "albaranes" }, debounce)
    .on("postgres_changes", { event: "*", schema: "public", table: "pagos" }, debounce)
    .on("postgres_changes", { event: "*", schema: "public", table: "cierres_caja" }, debounce)
    .subscribe();
}
export function desconectar() {
  if (channel) supabase.removeChannel(channel);
  channel = null;
  state = empty;
  emit();
}

export function useStore(): State {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => state, () => empty);
}
export const getState = () => state;
export const uid = () => Math.random().toString(36).slice(2, 10).toUpperCase();

async function addStock(d: Omit<Decimo, "id">) {
  const { data } = await supabase.from("decimos").select("id,cantidad").match({ numero: d.numero, serie: d.serie, fraccion: d.fraccion, ubicacion: d.ubicacion, estado: d.estado }).maybeSingle();
  if (data) await supabase.from("decimos").update({ cantidad: data.cantidad + d.cantidad }).eq("id", data.id);
  else await supabase.from("decimos").insert({ ...d, id: uid() });
}
async function subStock(id: string, n: number) {
  const { data } = await supabase.from("decimos").select("cantidad").eq("id", id).maybeSingle();
  if (!data) return;
  const c = data.cantidad - n;
  if (c > 0) await supabase.from("decimos").update({ cantidad: c }).eq("id", id);
  else await supabase.from("decimos").delete().eq("id", id);
}
const done = async <T,>(p: PromiseLike<T>) => { const r = await p; await recargar(); return r; };

export const actions = {
  altaDecimo: (d: Omit<Decimo, "id">) => done(addStock(d)),
  altaBloque: (items: Omit<Decimo, "id">[]) => done((async () => { for (const d of items) await addStock(d); })()),
  ponerEnVenta: (id: string, cantidad?: number) => done((async () => {
    const d = state.decimos.find((x) => x.id === id);
    if (!d || d.estado === "venta") return;
    const n = Math.min(d.cantidad, cantidad ?? d.cantidad);
    if (!Number.isInteger(n) || n<=0) throw new Error("Cantidad no válida");
    await subStock(id,n);
    const { id: _x, ...rest } = d; void _x;
    await addStock({ ...rest, cantidad:n, estado: "venta" });
  })()),
  sumar: (id: string, n: number) => done((async () => {
    const { data } = await supabase.from("decimos").select("cantidad").eq("id", id).maybeSingle();
    if (data) await supabase.from("decimos").update({ cantidad: data.cantidad + n }).eq("id", id);
  })()),
  restar: (id: string, n: number) => done(subStock(id, n)),
  eliminarDecimo: (id: string) => done(supabase.from("decimos").delete().eq("id", id).then(() => {})),
  guardarLocal: (l: Local) => done(supabase.from("locales").upsert({id:l.id,nombre:l.nombre,direccion:l.direccion,telefono:l.telefono}).then(() => {})),
  eliminarLocal: (id: string) => done(supabase.from("locales").delete().eq("id", id).then(() => {})),
  crearAlbaran: async (localId: string, items: { decimoId: string; cantidad: number }[], dep: Deposito = { tipo: "entrega", receptorNombre: "", receptorDni: "", firma: "" }): Promise<string> => {
    const id = "ALB-" + uid();
    const lineas: Linea[] = [];
    for (const it of items) {
      const d = state.decimos.find((x) => x.id === it.decimoId);
      if (!d || it.cantidad <= 0) continue;
      const n = Math.min(it.cantidad, d.cantidad);
      await subStock(d.id, n);
      await addStock({ numero: d.numero, serie: d.serie, fraccion: d.fraccion, cantidad: n, ubicacion: localId, estado: "venta" });
      lineas.push({ numero: d.numero, serie: d.serie, fraccion: d.fraccion, cantidad: n, devueltos: 0, pagados: 0 });
    }
    const {data: creado,error} = await supabase.from("albaranes").insert({ id, local_id: localId, lineas, tipo: dep.tipo, receptor_nombre: dep.receptorNombre, receptor_dni: dep.receptorDni, firma: dep.firma }).select("id").single();
    if(error || !creado) throw new Error(error?.message ?? "No se pudo crear el albarán");
    await recargar();
    return creado.id;
  },
  liquidar: (id: string, lineas: Linea[], cobro: Cobro) => done((async () => {
    const {error} = await supabase.rpc("registrar_cobro",{p_id:id,p_lineas:lineas as unknown as Json,p_importe:cobro.importe,p_metodo:cobro.metodo,p_firma:cobro.firmaCobro,p_solicitud:cobro.solicitud});
    if(error) throw new Error(error.message);
  })()),
};

export function nombreUbicacion(ub: string, locales: Local[]) {
  return ub === CENTRAL ? "Administración Central" : locales.find((l) => l.id === ub)?.nombre ?? "Local desconocido";
}
export const euros = (n: number) => n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
