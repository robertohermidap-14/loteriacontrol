import type { Decimo } from "@/lib/store";

export type RangoStock = { desde: number; hasta: number; fracciones: string[]; estado: "recepcion" | "venta" };
export type GrupoSerie = { serie: string; items: Decimo[] };
export function agruparSeries(items: Decimo[]): GrupoSerie[] {
  const grupos = new Map<string, Decimo[]>();
  for (const item of items) if (item.cantidad > 0) grupos.set(item.serie, [...(grupos.get(item.serie) ?? []), item]);
  return [...grupos].sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true })).map(([serie, items]) => ({ serie, items }));
}
export function seleccionarRango(items: Decimo[], desde: number, hasta: number, fracciones: string[]) {
  if (!Number.isInteger(desde) || !Number.isInteger(hasta) || desde < 1 || hasta < desde) throw new Error("Selecciona un rango de series válido");
  return items.filter(d => d.cantidad > 0 && Number(d.serie) >= desde && Number(d.serie) <= hasta && (fracciones.includes(d.fraccion) || (!d.fraccion && fracciones.length === 10)));
}
export function aplicarRangos(items: Decimo[], rangos: RangoStock[]): Decimo[] {
  const cambios = new Map<string, Decimo["estado"]>();
  for (const rango of rangos) for (const d of seleccionarRango(items, rango.desde, rango.hasta, rango.fracciones)) cambios.set(d.id, rango.estado);
  return items.map(d => cambios.has(d.id) ? { ...d, estado: cambios.get(d.id) ?? d.estado } : d);
}
export function estadoSerie(items: Decimo[]) {
  const activas = new Set(items.filter(d => d.estado === "venta" && d.cantidad > 0).map(d => d.fraccion));
  const cantidad = items.filter(d => d.estado === "venta").reduce((s, d) => s + d.cantidad, 0);
  return { activas: activas.has("") ? Math.min(10, cantidad) : activas.size, cantidad };
}