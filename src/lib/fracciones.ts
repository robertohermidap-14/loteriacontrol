export const FRACCIONES = Array.from({ length: 10 }, (_, i) => String(i + 1));
export function crearEntrada(numero: string, desde: number, hasta: number, fracciones: string[]) {
  if (!/^\d{5}$/.test(numero) || !Number.isInteger(desde) || !Number.isInteger(hasta) || desde < 1 || hasta < desde || hasta-desde >= 500 || !fracciones.length || new Set(fracciones).size !== fracciones.length || fracciones.some(f => !FRACCIONES.includes(f))) throw new Error("Selecciona series válidas y fracciones del 1 al 10");
  return Array.from({length: hasta-desde+1},(_,i) => fracciones.map(fraccion => ({ numero, serie: String(desde+i), fraccion, cantidad: 1, ubicacion: "central", estado: "recepcion" as const }))).flat();
}