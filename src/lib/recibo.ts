import { saldoAlbaran } from "@/lib/contabilidad";
import type { Albaran, Local } from "@/lib/store";
import type { Config } from "@/lib/config";

export type Recibo = Pick<Albaran, "id" | "fecha" | "estado" | "tipo" | "lineas" | "total" | "fechaPago" | "receptorNombre" | "firma" | "cobradoPor" | "firmaCobro" | "loteria"> & { administracion?: Config | null; localPersona?: string; localDni?: string; localEmail?: string; localNombre: string; localDireccion: string; localTelefono?: string | undefined; codigoCliente?: number | undefined; receptorDni?: string | undefined; cobroUrl?: string | undefined };
export const reciboDeAlbaran = (a: Albaran, local?: Local, administracion?: Config | null): Recibo => ({ ...a, administracion:administracion ?? null, localPersona:local?.persona ?? "",localDni:local?.dni ?? "",localEmail:local?.email ?? "",localNombre: local?.nombre ?? "", localDireccion: local?.direccion ?? "", localTelefono: local?.telefono, codigoCliente: local?.codigoCliente, cobroUrl: `https://pinpoint-code-slice.lovable.app/albaran/${a.id}` });

export function telefonoWhatsApp(telefono: string) {
  let digits = telefono.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (/^[6789]\d{8}$/.test(digits)) digits = `34${digits}`;
  if (!/^[1-9]\d{7,14}$/.test(digits)) throw new Error("El teléfono del local no es válido. Añade el prefijo de país.");
  return digits;
}

export async function hashToken(token: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
}

export type FiltrosCobro = { desde: string; hasta: string; localId: string; numero: string; estado: string };
export function filtrarAlbaranes(albaranes: Albaran[], f: FiltrosCobro) {
  return albaranes.filter((a) => {
    const date = new Date(a.fechaPago ?? a.fecha);
    const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return (!f.desde || day >= f.desde) && (!f.hasta || day <= f.hasta)
      && (!f.localId || a.localId === f.localId) && (!f.estado || saldoAlbaran(a).estado === f.estado)
      && (!f.numero || a.lineas.some((l) => l.numero.includes(f.numero)));
  });
}