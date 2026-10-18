import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

export const CENTRAL = "central";
export const PRECIO_DECIMO = 20;

export type Decimo = { id: string; numero: string; serie: string; fraccion: string; cantidad: number; ubicacion: string };
export type Local = { id: string; nombre: string; direccion: string; telefono: string };
export type Linea = { numero: string; serie: string; fraccion: string; cantidad: number; devueltos: number; pagados: number };
export type Albaran = { id: string; localId: string; fecha: string; lineas: Linea[]; estado: "pendiente" | "pagado"; total: number; fechaPago?: string };
type State = { decimos: Decimo[]; locales: Local[]; albaranes: Albaran[]; cargado: boolean };

const empty: State = { decimos: [], locales: [], albaranes: [], cargado: false };
let state: State = empty;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export async function recargar() {
  const [d, l, a] = await Promise.all([
    supabase.from("decimos").select("*"),
    supabase.from("locales").select("*").order("nombre"),
    supabase.from("albaranes").select("*").order("fecha", { ascending: false }),
  ]);
  state = {
    cargado: true,
    decimos: (d.data ?? []).map((x) => ({ id: x.id, numero: x.numero, serie: x.serie, fraccion: x.fraccion, cantidad: x.cantidad, ubicacion: x.ubicacion })),
    locales: (l.data ?? []).map((x) => ({ id: x.id, nombre: x.nombre, direccion: x.direccion, telefono: x.telefono })),
    albaranes: (a.data ?? []).map((x) => ({ id: x.id, localId: x.local_id, fecha: x.fecha, lineas: x.lineas as unknown as Linea[], estado: x.estado as Albaran["estado"], total: Number(x.total), fechaPago: x.fecha_pago ?? undefined })),
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
  const { data } = await supabase.from("decimos").select("id,cantidad").match({ numero: d.numero, serie: d.serie, fraccion: d.fraccion, ubicacion: d.ubicacion }).maybeSingle();
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
  sumar: (id: string, n: number) => done((async () => {
    const { data } = await supabase.from("decimos").select("cantidad").eq("id", id).maybeSingle();
    if (data) await supabase.from("decimos").update({ cantidad: data.cantidad + n }).eq("id", id);
  })()),
  restar: (id: string, n: number) => done(subStock(id, n)),
  eliminarDecimo: (id: string) => done(supabase.from("decimos").delete().eq("id", id).then(() => {})),
  guardarLocal: (l: Local) => done(supabase.from("locales").upsert(l).then(() => {})),
  eliminarLocal: (id: string) => done(supabase.from("locales").delete().eq("id", id).then(() => {})),
  crearAlbaran: async (localId: string, items: { decimoId: string; cantidad: number }[]): Promise<string> => {
    const id = "ALB-" + uid();
    const lineas: Linea[] = [];
    for (const it of items) {
      const d = state.decimos.find((x) => x.id === it.decimoId);
      if (!d || it.cantidad <= 0) continue;
      const n = Math.min(it.cantidad, d.cantidad);
      await subStock(d.id, n);
      await addStock({ numero: d.numero, serie: d.serie, fraccion: d.fraccion, cantidad: n, ubicacion: localId });
      lineas.push({ numero: d.numero, serie: d.serie, fraccion: d.fraccion, cantidad: n, devueltos: 0, pagados: n });
    }
    await supabase.from("albaranes").insert({ id, local_id: localId, lineas });
    await recargar();
    return id;
  },
  liquidar: (id: string, lineas: Linea[]) => done((async () => {
    const a = state.albaranes.find((x) => x.id === id);
    if (!a || a.estado === "pagado") return;
    for (const l of lineas) {
      const d = state.decimos.find((x) => x.numero === l.numero && x.serie === l.serie && x.fraccion === l.fraccion && x.ubicacion === a.localId);
      if (d) await subStock(d.id, l.devueltos + l.pagados);
      if (l.devueltos > 0) await addStock({ numero: l.numero, serie: l.serie, fraccion: l.fraccion, cantidad: l.devueltos, ubicacion: CENTRAL });
    }
    const total = lineas.reduce((t, l) => t + l.pagados * PRECIO_DECIMO, 0);
    await supabase.from("albaranes").update({ lineas, estado: "pagado", total, fecha_pago: new Date().toISOString() }).eq("id", id);
  })()),
};

export function nombreUbicacion(ub: string, locales: Local[]) {
  return ub === CENTRAL ? "Administración Central" : locales.find((l) => l.id === ub)?.nombre ?? "Local desconocido";
}
export const euros = (n: number) => n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
