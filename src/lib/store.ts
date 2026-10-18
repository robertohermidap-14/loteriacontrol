import { useSyncExternalStore } from "react";

export const CENTRAL = "central";
export const PRECIO_DECIMO = 20;

export type Decimo = { id: string; numero: string; serie: string; fraccion: string; cantidad: number; ubicacion: string };
export type Local = { id: string; nombre: string; direccion: string; telefono: string };
export type Linea = { numero: string; serie: string; fraccion: string; cantidad: number; devueltos: number; pagados: number };
export type Albaran = { id: string; localId: string; fecha: string; lineas: Linea[]; estado: "pendiente" | "pagado"; total: number; fechaPago?: string };
type State = { decimos: Decimo[]; locales: Local[]; albaranes: Albaran[] };

const KEY = "loteria-gestion-v1";
const empty: State = { decimos: [], locales: [], albaranes: [] };
let state: State = empty;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try { const raw = localStorage.getItem(KEY); if (raw) state = { ...empty, ...JSON.parse(raw) }; } catch { /* ignore */ }
}
function set(fn: (s: State) => State) {
  load();
  state = fn(state);
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}
export const uid = () => Math.random().toString(36).slice(2, 10).toUpperCase();

export function useStore(): State {
  return useSyncExternalStore(
    (l) => { load(); listeners.add(l); return () => listeners.delete(l); },
    () => { load(); return state; },
    () => empty,
  );
}
export const getState = () => { load(); return state; };

function addStock(s: State, d: Omit<Decimo, "id">): Decimo[] {
  const ex = s.decimos.find((x) => x.numero === d.numero && x.serie === d.serie && x.fraccion === d.fraccion && x.ubicacion === d.ubicacion);
  if (ex) return s.decimos.map((x) => (x === ex ? { ...x, cantidad: x.cantidad + d.cantidad } : x));
  return [...s.decimos, { ...d, id: uid() }];
}
function subStock(s: State, match: (x: Decimo) => boolean, n: number): Decimo[] {
  return s.decimos.map((x) => (match(x) ? { ...x, cantidad: Math.max(0, x.cantidad - n) } : x)).filter((x) => x.cantidad > 0);
}

export const actions = {
  altaDecimo: (d: Omit<Decimo, "id">) => set((s) => ({ ...s, decimos: addStock(s, d) })),
  sumar: (id: string, n: number) => set((s) => ({ ...s, decimos: s.decimos.map((x) => (x.id === id ? { ...x, cantidad: x.cantidad + n } : x)) })),
  restar: (id: string, n: number) => set((s) => ({ ...s, decimos: subStock(s, (x) => x.id === id, n) })),
  eliminarDecimo: (id: string) => set((s) => ({ ...s, decimos: s.decimos.filter((x) => x.id !== id) })),
  guardarLocal: (l: Local) => set((s) => ({ ...s, locales: s.locales.some((x) => x.id === l.id) ? s.locales.map((x) => (x.id === l.id ? l : x)) : [...s.locales, l] })),
  eliminarLocal: (id: string) => set((s) => ({ ...s, locales: s.locales.filter((x) => x.id !== id) })),
  crearAlbaran: (localId: string, items: { decimoId: string; cantidad: number }[]): string => {
    const id = "ALB-" + uid();
    set((s) => {
      let st = s;
      const lineas: Linea[] = [];
      for (const it of items) {
        const d = st.decimos.find((x) => x.id === it.decimoId);
        if (!d || it.cantidad <= 0) continue;
        const n = Math.min(it.cantidad, d.cantidad);
        st = { ...st, decimos: subStock(st, (x) => x.id === d.id, n) };
        st = { ...st, decimos: addStock(st, { numero: d.numero, serie: d.serie, fraccion: d.fraccion, cantidad: n, ubicacion: localId }) };
        lineas.push({ numero: d.numero, serie: d.serie, fraccion: d.fraccion, cantidad: n, devueltos: 0, pagados: n });
      }
      return { ...st, albaranes: [...st.albaranes, { id, localId, fecha: new Date().toISOString(), lineas, estado: "pendiente", total: 0 }] };
    });
    return id;
  },
  liquidar: (id: string, lineas: Linea[]) => set((s) => {
    const a = s.albaranes.find((x) => x.id === id);
    if (!a || a.estado === "pagado") return s;
    let st = s;
    for (const l of lineas) {
      const m = (x: Decimo) => x.numero === l.numero && x.serie === l.serie && x.fraccion === l.fraccion && x.ubicacion === a.localId;
      st = { ...st, decimos: subStock(st, m, l.devueltos + l.pagados) };
      if (l.devueltos > 0) st = { ...st, decimos: addStock(st, { numero: l.numero, serie: l.serie, fraccion: l.fraccion, cantidad: l.devueltos, ubicacion: CENTRAL }) };
    }
    const total = lineas.reduce((t, l) => t + l.pagados * PRECIO_DECIMO, 0);
    return { ...st, albaranes: st.albaranes.map((x) => (x.id === id ? { ...x, lineas, estado: "pagado", total, fechaPago: new Date().toISOString() } : x)) };
  }),
};

export function nombreUbicacion(ub: string, locales: Local[]) {
  return ub === CENTRAL ? "Administración Central" : locales.find((l) => l.id === ub)?.nombre ?? "Local desconocido";
}
export const euros = (n: number) => n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
