import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { Recibo } from "@/lib/recibo";
import QRCode from "qrcode";
import { saldoAlbaran } from "@/lib/contabilidad";
import { EMPRESA } from "@/lib/sesion";
import { LOTERIAS } from "@/lib/loteria";
import { agruparLineas } from "@/lib/albaran-compacto";
import { enlaceAlbaran } from "@/lib/enlaces";

export async function generarPdf(r: Recibo): Promise<Blob> {
  const saldo = saldoAlbaran(r);
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([595.28, 841.89]);
  let y = 790;
  const safe = (s: string) => Array.from(s).map((c) => { try { regular.encodeText(c); return c; } catch { return "?"; } }).join("");
  const text = (value: string, size = 11, strong = false, pendiente = false) => {
    const font = strong ? bold : regular;
    const words = safe(value).split(/\s+/);
    let line = "";
    const draw = () => {
      if (y < 65) { page = pdf.addPage([595.28, 841.89]); y = 790; }
      page.drawText(line, { x: 40, y, size, font, color: pendiente ? rgb(0.8,0.1,0.1) : rgb(0.12, 0.12, 0.12) });
      y -= size + 8;
    };
    for (const word of words) {
      if (line && font.widthOfTextAtSize(`${line} ${word}`, size) > 510) { draw(); line = ""; }
      line = line ? `${line} ${word}` : word;
    }
    draw();
  };
  const money = (n: number) => `${n.toFixed(2)} EUR`;
  const config=r.administracion;
  if(config?.logo){
    const source=config.logo;
    if(!/^data:image\/(png|jpeg);base64,/i.test(source)) throw new Error("Logo no compatible: utiliza PNG o JPG");
    const image=source.startsWith("data:image/png")?await pdf.embedPng(source):await pdf.embedJpg(source);
    const scale=Math.min(130/image.width,65/image.height);
    page.drawImage(image,{x:40,y:y-image.height*scale,width:image.width*scale,height:image.height*scale});y-=image.height*scale+15;
  }
  text(config?.nombre || EMPRESA, 12, true);
  if(config?.razon_social)text(config.razon_social);
  if(config?.nif)text(`NIF: ${config.nif}`);
  if(config?.direccion)text(config.direccion);
  if(config?.telefono || config?.email)text([config.telefono,config.email].filter(Boolean).join(" · "));
  text(LOTERIAS.find(l=>l.id===(r.loteria ?? "navidad"))?.nombre ?? "Lotería de Navidad",12,true);
  text(`${r.estado === "pagado" ? "RECIBO DE COBRO" : r.tipo === "deposito" ? "ALBARÁN DE DEPÓSITO" : "ALBARÁN DE ENTREGA"} · ${r.id}`, 17, true);
  text(saldo.texto, 20, true, saldo.estado!=="pagado");
  text(`Local: ${r.localNombre}`, 13, true);
  text(r.localDireccion);
  text(`Cliente: ${r.codigoCliente ?? "—"} · Teléfono: ${r.localTelefono ?? "—"}`);
  if(r.localPersona || r.localDni)text(`Persona: ${r.localPersona || "—"} · DNI: ${r.localDni || "—"}`);
  if(r.localEmail)text(r.localEmail);
  if(y<180){page=pdf.addPage([595.28,841.89]);y=790;}
  const qr = await pdf.embedPng(await QRCode.toDataURL(r.cobroUrl ?? enlaceAlbaran(r.id),{margin:4,width:300,errorCorrectionLevel:"M"}));
  page.drawImage(qr,{x:445,y: y-105,width:100,height:100}); y-=115;
  text(`Entrega: ${new Date(r.fecha).toLocaleString("es-ES")}`);
  y -= 10;
  for (const g of agruparLineas(r.lineas)) {
    text(`${g.numero} · ${g.cantidad} décimos`, 12, true);
    if(g.series)text(g.series,11);
    for(const detalle of g.sueltas)text(detalle,9);
    if(g.pagados || g.devueltos)text(`Pagados: ${g.pagados} · Devueltos: ${g.devueltos}`,10);
  }
  text(`Entrega: ${r.entregadoPor || "Sin identidad registrada en el albarán anterior"}`,10);
  text(`${r.tipo === "deposito" ? "TOTAL EN DEPÓSITO" : "TOTAL ENTREGADO"}: ${money(r.lineas.reduce((sum, l) => sum + l.cantidad * 20, 0))}`, 16, true);
  text(`TOTAL COBRADO: ${money(r.total)}`,14,true);
  text(`PENDIENTE DE COBRO: ${money(saldo.pendiente)}`,16,true,true);
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
  if (r.receptorNombre) await signature(`Recoge: ${r.receptorNombre} · DNI: ${r.receptorDni ?? "—"}`, r.firma);
  if (r.total > 0) {
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