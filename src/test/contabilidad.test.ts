import { describe,it,expect } from "vitest";
import { liquidacionValida, saldoAlbaran, pagosVisibles, sumarMetodos, diferenciaCaja, codigoAlbaran, diaMadrid, stockLocales, type PagoCaja } from "@/lib/contabilidad";
import { crearEntrada } from "@/lib/fracciones";
describe("Reglas de lotería y caja",()=>{
 it("el ejemplo de 360 de 400 queda parcial y con 40 pendientes",()=>{expect(saldoAlbaran({total:360,lineas:[{cantidad:10,devueltos:0},{cantidad:10,devueltos:0}]})).toMatchObject({estado:"parcial",pendiente:40});});
 it("solo se salda al completar el importe neto de devoluciones",()=>{expect(saldoAlbaran({total:360,lineas:[{cantidad:20,devueltos:2}]})).toMatchObject({estado:"pagado",pendiente:0});});
 it("permite confirmar los dos décimos devueltos de ALB-3LZXHNOY sin cobrar más",()=>{const a={total:360,lineas:[{cantidad:10,pagados:8,devueltos:0},{cantidad:10,pagados:10,devueltos:0}]};const l=[{cantidad:10,pagados:8,devueltos:2},{cantidad:10,pagados:10,devueltos:0}];expect(liquidacionValida(a,l,0)).toBe(true);expect(liquidacionValida(a,l,40)).toBe(false);expect(liquidacionValida(a,a.lineas,0)).toBe(false);});
 it("las nuevas referencias incluyen MHL y el código de cliente",()=>{expect(codigoAlbaran(8,15)).toBe("MHL-0008-000015");});
 it("una serie completa tiene 10 fracciones del 1 al 10",()=>{const r=crearEntrada("10000",1,2,Array.from({length:10},(_,i)=>String(i+1)));expect(r).toHaveLength(20);expect(r.filter(x=>x.serie==="1").map(x=>x.fraccion)).toEqual(["1","2","3","4","5","6","7","8","9","10"]);});
 it("los décimos sueltos conservan fracción y serie",()=>{expect(crearEntrada("10000",7,7,["2","9"]).map(x=>[x.serie,x.fraccion,x.cantidad])).toEqual([["7","2",1],["7","9",1]]);expect(()=>crearEntrada("10000",1,1,["11"])).toThrow();});
 const p:PagoCaja={id:"1",albaran_id:"a",usuario_id:"u",importe:20,metodo:"efectivo",fecha:"2026-10-22T10:00:00Z",nombre:"Ana",historico:false};
 it("el comercial solo suma sus cobros del día",()=>{expect(pagosVisibles([p,{...p,id:"2",usuario_id:"otro"},{...p,id:"3",fecha:"2026-10-21T10:00:00Z"}],false,"u","2026-10-22").map(x=>x.id)).toEqual(["1"]);});
 it("el administrador puede sumar todos los días y usuarios",()=>{expect(pagosVisibles([p,{...p,usuario_id:"otro"}],true,"u","2026-10-22")).toHaveLength(2);});
 it("separa efectivo tarjeta y bizum y calcula el descuadre",()=>{expect(sumarMetodos([p,{...p,importe:40,metodo:"tarjeta"},{...p,importe:60,metodo:"bizum"}])).toMatchObject({efectivo:20,tarjeta:40,bizum:60});expect(diferenciaCaja(120,115)).toBe(-5);});
 it("el día de caja usa la hora española",()=>{expect(diaMadrid("2026-10-21T22:30:00Z")).toBe("2026-10-22");});
 it("el stock del local descuenta lo cobrado y excluye la administración",()=>{
  const decimos=[{numero:"10000",ubicacion:"central",cantidad:50},{numero:"10000",ubicacion:"L1",cantidad:20},{numero:"10000",ubicacion:"L2",cantidad:10},{numero:"99999",ubicacion:"L1",cantidad:5}];
  const albaranes=[{localId:"L1",lineas:[{numero:"10000",pagados:8},{numero:"99999",pagados:5}]}];
  const m=stockLocales(decimos,albaranes,"10000");
  expect(m.get("L1")).toEqual({asignado:20,cobrado:8,disponible:12});
  expect(m.get("L2")).toEqual({asignado:10,cobrado:0,disponible:10});
  expect(m.has("central")).toBe(false);
 });
});