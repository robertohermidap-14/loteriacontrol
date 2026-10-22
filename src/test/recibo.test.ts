// @vitest-environment node
import { describe, expect, it } from "vitest";
import { telefonoWhatsApp, filtrarAlbaranes, hashToken, type Recibo } from "@/lib/recibo";
import type { Albaran } from "@/lib/store";
import { generarPdf } from "@/lib/recibo-pdf";
import { PDFDocument } from "pdf-lib";

const a: Albaran = { id: "ALB-TEST", localId: "local-a", fecha: "2026-10-21T10:00:00Z", estado: "pendiente", total: 0, tipo: "deposito", receptorNombre: "Ana", receptorDni: "", firma: "", cobradoPor: "", firmaCobro: "", lineas: [{ numero: "96458", serie: "1", fraccion: "1", cantidad: 10, devueltos: 0, pagados: 10 }] };
const f = { desde: "", hasta: "", localId: "", numero: "", estado: "" };
describe("Copias y filtros de albaranes", () => {
  it("normaliza los teléfonos españoles y preserva el prefijo internacional", () => {
    expect(telefonoWhatsApp("612 345 678")).toBe("34612345678");
    expect(telefonoWhatsApp("00351 912345678")).toBe("351912345678");
    expect(() => telefonoWhatsApp("")).toThrow();
  });
  it("filtra por fecha de entrega y de cobro inclusive", () => {
    const paid = { ...a, id: "ALB-PAID", estado: "pagado" as const, fechaPago: "2026-10-22T12:00:00Z" };
    expect(filtrarAlbaranes([a, paid], { ...f, desde: "2026-10-22", hasta: "2026-10-22" }).map((r) => r.id)).toEqual(["ALB-PAID"]);
  });
  it("filtra por cliente sin mezclar otros locales", () => {
    expect(filtrarAlbaranes([a, { ...a, localId: "local-b" }], { ...f, localId: "local-a" })).toEqual([a]);
  });
  it("filtra por número y estado", () => {
    expect(filtrarAlbaranes([a], { ...f, numero: "96458" })).toEqual([a]);
    expect(filtrarAlbaranes([a], { ...f, numero: "12345" })).toEqual([]);
    expect(filtrarAlbaranes([a], { ...f, estado: "pagado" })).toEqual([]);
  });
  it("guarda el hash y no el token de acceso", async () => {
    const hash = await hashToken("a".repeat(64));
    expect(hash).toHaveLength(64); expect(hash).not.toBe("a".repeat(64));
    expect(await hashToken("b".repeat(64))).not.toBe(hash);
  });
  it("genera un PDF real para descargar", async () => {
    const r: Recibo = { ...a, localNombre: "Local prueba", localDireccion: "Ferrol" };
    const blob = await generarPdf(r);
    expect(blob.type).toBe("application/pdf");
    const pdf = await PDFDocument.load(await blob.arrayBuffer());
    expect(pdf.getPageCount()).toBe(1);
  });
});