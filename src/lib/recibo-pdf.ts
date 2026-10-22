import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { Recibo } from "@/lib/recibo";
import { EMPRESA } from "@/lib/sesion";

export async function generarPdf(r: Recibo): Promise<Blob> {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([595.28, 841.89]);
  let y = 790;
  const safe = (s: string) => Array.from(s).map((c) => { try { regular.encodeText(c); return c; } catch { return "?"; } }).join("");
  const text = (value: string, size = 11, strong = false) => {
    const font = strong ? bold : regular;
    const words = safe(value).split(/\s+/);
    let line = "";
    const draw = () => {
      if (y < 65) { page = pdf.addPage([595.28, 841.89]); y = 790; }
      page.drawText(line, { x: 40, y, size, font, color: rgb(0.12, 0.12, 0.12) });
      y -= size + 8;
    };
    for (const word of words) {
      if (line && font.widthOfTextAtSize(`${line} ${word}`, size) > 510) { draw(); line = ""; }
      line = line ? `${line} ${word}` : word;
    }
    draw();
  };
  const money = (n: number) => `${n.toFixed(2)} EUR`;
  text(EMPRESA, 12, true);
  text(`${r.estado === "pagado" ? "RECIBO DE COBRO" : r.tipo === "deposito" ? "ALBARÁN DE DEPÓSITO" : "ALBARÁN DE ENTREGA"} · ${r.id}`, 17, true);
  text(r.estado === "pagado" ? "COBRADO" : "PENDIENTE DE COBRO", 20, true);
  text(`Local: ${r.localNombre}`, 13, true);
  text(r.localDireccion);
  text(`Entrega: ${new Date(r.fecha).toLocaleString("es-ES")}`);
  y -= 10;
  for (const l of r.lineas) {
    text(`${l.numero} · Serie ${l.serie || "—"} · Fracción ${l.fraccion || "—"}`, 12, true);
    text(`Entregados: ${l.cantidad} · Devueltos: ${l.devueltos}${r.estado === "pagado" ? ` · Pagados: ${l.pagados}` : ""} · ${money((r.estado === "pagado" ? l.pagados : l.cantidad) * 20)}`);
  }
  text(`${r.estado === "pagado" ? "TOTAL COBRADO" : r.tipo === "deposito" ? "TOTAL EN DEPÓSITO" : "TOTAL ENTREGADO"}: ${money(r.estado === "pagado" ? r.total : r.lineas.reduce((sum, l) => sum + l.cantidad * 20, 0))}`, 16, true);
  const signature = async (label: string, src: string) => {
    text(label, 11, true);
    if (!src) return;
    if (y < 165) { page = pdf.addPage([595.28, 841.89]); y = 790; }
    const image = await pdf.embedPng(src);
    const scale = Math.min(260 / image.width, 90 / image.height);
    const height = image.height * scale;
    page.drawImage(image, { x: 40, y: y - height, width: image.width * scale, height });
    y -= height + 18;
  };
  if (r.receptorNombre) await signature(`Recoge: ${r.receptorNombre}`, r.firma);
  if (r.estado === "pagado") {
    text(`Cobrado por: ${r.cobradoPor}`);
    text(`Fecha y hora del cobro: ${new Date(r.fechaPago ?? r.fecha).toLocaleString("es-ES")}`);
    await signature("Firma de quien cobra", r.firmaCobro);
  }
  const bytes = await pdf.save();
  return new Blob([new Uint8Array(bytes).buffer], { type: "application/pdf" });
}

export function descargarPdf(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}