import { describe, it, expect } from "vitest";
import { agruparSeries, seleccionarRango, aplicarRangos, estadoSerie } from "@/lib/seleccion-stock";
import { crearEntrada } from "@/lib/fracciones";
const items = crearEntrada("96458", 1, 200, Array.from({length: 10}, (_, i) => String(i + 1))).map((d, i) => ({...d, id: String(i)}));
describe("Selección táctil de stock", () => {
  it("agrupa 2000 décimos en 200 series", () => { expect(agruparSeries(items)).toHaveLength(200); expect(agruparSeries(items)[0]?.items).toHaveLength(10); });
  it("selecciona las fracciones 1 y 2 de diez series", () => { expect(seleccionarRango(items, 11, 20, ["1", "2"])).toHaveLength(20); });
  it("activar un rango no altera otras series ni fracciones", () => { const r=aplicarRangos(items,[{desde:11,hasta:20,fracciones:["1","2"],estado:"venta"}]); expect(r.filter(d=>d.estado==="venta")).toHaveLength(20); expect(r.find(d=>d.serie==="11" && d.fraccion==="3")?.estado).toBe("recepcion"); });
  it("desactiva un rango ya activado conservando las cantidades", () => { const r=aplicarRangos(items,[{desde:1,hasta:200,fracciones:Array.from({length:10},(_,i)=>String(i+1)),estado:"venta"},{desde:1,hasta:10,fracciones:["1"],estado:"recepcion"}]); expect(r.filter(d=>d.estado==="venta")).toHaveLength(1990); expect(r.reduce((s,d)=>s+d.cantidad,0)).toBe(2000); });
  it("no inventa fracciones en stock antiguo sin detalle", () => { const legacy=[{...items[0], id:"old", numero:"96458", serie:"1", fraccion:"", cantidad:10, ubicacion:"central", estado:"recepcion" as const}]; expect(seleccionarRango(legacy,1,1,["1"])).toHaveLength(0); expect(seleccionarRango(legacy,1,1,Array.from({length:10},(_,i)=>String(i+1)))[0]?.cantidad).toBe(10); });
  it("el indicador distingue 0, 2 y 10 fracciones activas", () => { const s=items.filter(d=>d.serie==="1"); expect(estadoSerie(s).activas).toBe(0); expect(estadoSerie(aplicarRangos(s,[{desde:1,hasta:1,fracciones:["1","2"],estado:"venta"}])).activas).toBe(2); expect(estadoSerie(s.map(d=>({...d,estado:"venta"})) ).activas).toBe(10); });
});