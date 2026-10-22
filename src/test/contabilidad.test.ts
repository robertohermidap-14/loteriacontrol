import { describe,it,expect } from "vitest";
import { saldoAlbaran, pagosVisibles, sumarMetodos, diferenciaCaja, codigoAlbaran, diaMadrid, type PagoCaja } from "@/lib/contabilidad";
import { crearEntrada } from "@/lib/fracciones";
describe("Reglas de lotería y caja",()=>{
 it("el ejemplo de 360 de 400 queda parcial y con 40 pendientes",()=>{expect(saldoAlbaran({total:360,lineas:[{cantidad:10,devueltos:0},{cantidad:10,devueltos:0}]})).toMatchObject({estado:"parcial",pendiente:40});});
 it("solo se salda al completar el importe neto de devoluciones",()=>{expect(saldoAlbaran({total:360,lineas:[{cantidad:20,devueltos:2}]})).toMatchObject({estado:"pagado",pendiente:0});});
 it("las nuevas referencias incluyen MHL y el código de cliente",()=>{expect(codigoAlbaran(8,15)).toBe("MHL-0008-000015");});
 it("una serie completa tiene 10 fracciones del 1 al 10",()=>{const r=crearEntrada("10000",1,2,Array.from({length:10},(_,i)=>String(i+1)));expect(r).toHaveLength(20);expect(r.filter(x=>x.serie==="1").map(x=>x.fraccion)).toEqual(["1","2","3","4","5","6","7","8","9","10"]);});
 it("los décimos sueltos conservan fracción y serie",()=>{expect(crearEntrada("10000",7,7,["2","9"]).map(x=>[x.serie,x.fraccion,x.cantidad])).toEqual([["7","2",1],["7","9",1]]);expect(()=>crearEntrada("10000",1,1,["11"])).toThrow();});
 const p:PagoCaja={id:"1",albaran_id:"a",usuario_id:"u",importe:20,metodo:"efectivo",fecha:"2026-10-22T10:00:00Z",nombre:"Ana",historico:false};
 it("el comercial solo suma sus cobros del día",()=>{expect(pagosVisibles([p,{...p,id:"2",usuario_id:"otro"},{...p,id:"3",fecha:"2026-10-21T10:00:00Z"}],false,"u","2026-10-22").map(x=>x.id)).toEqual(["1"]);});
 it("el administrador puede sumar todos los días y usuarios",()=>{expect(pagosVisibles([p,{...p,usuario_id:"otro"}],true,"u","2026-10-22")).toHaveLength(2);});
 it("separa efectivo tarjeta y bizum y calcula el descuadre",()=>{expect(sumarMetodos([p,{...p,importe:40,metodo:"tarjeta"},{...p,importe:60,metodo:"bizum"}])).toMatchObject({efectivo:20,tarjeta:40,bizum:60});expect(diferenciaCaja(120,115)).toBe(-5);});
 it("el día de caja usa la hora española",()=>{expect(diaMadrid("2026-10-21T22:30:00Z")).toBe("2026-10-22");});
});