export type MetodoPago = "efectivo" | "tarjeta" | "bizum";
export type PagoCaja = { loteria?: string; id: string; albaran_id: string; usuario_id: string | null; importe: number; metodo: string; fecha: string; nombre: string; historico: boolean };
export type SaldoDocumento = { total: number; lineas: { cantidad: number; devueltos: number }[] };
export function saldoAlbaran(a: SaldoDocumento) {
  const entregado = a.lineas.reduce((s, l) => s + l.cantidad * 20, 0);
  const debido = a.lineas.reduce((s, l) => s + (l.cantidad - l.devueltos) * 20, 0);
  const pendiente = Math.max(0, Math.round((debido - a.total) * 100) / 100);
  const estado = pendiente === 0 ? "pagado" : a.total > 0 ? "parcial" : "pendiente";
  return { entregado, debido, cobrado: a.total, pendiente, estado, texto: estado === "pagado" ? "COBRADO" : estado === "parcial" ? "COBRADO PARCIAL" : "PENDIENTE DE COBRO" };
}
export const diaMadrid = (fecha: string | Date = new Date()) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(fecha));
export function pagosVisibles(pagos: PagoCaja[], esAdmin: boolean, usuario: string, hoy: string) {
  return esAdmin ? pagos : pagos.filter((p) => p.usuario_id === usuario && diaMadrid(p.fecha) === hoy);
}
export function sumarMetodos(pagos: PagoCaja[]) {
  return { efectivo: pagos.filter(p => p.metodo === "efectivo").reduce((s,p) => s+p.importe,0), tarjeta: pagos.filter(p => p.metodo === "tarjeta").reduce((s,p) => s+p.importe,0), bizum: pagos.filter(p => p.metodo === "bizum").reduce((s,p) => s+p.importe,0), sinClasificar: pagos.filter(p => p.metodo === "sin_clasificar").reduce((s,p) => s+p.importe,0) };
}
export const diferenciaCaja = (esperado: number, real: number) => Math.round((real-esperado)*100)/100;
export const codigoAlbaran = (cliente: number, secuencia: number) => `MHL-${String(cliente).padStart(4,"0")}-${String(secuencia).padStart(6,"0")}`;