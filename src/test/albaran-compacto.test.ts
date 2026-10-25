import {describe,it,expect} from "vitest";
import {agruparLineas,editarCantidadAgrupada} from "@/lib/albaran-compacto";
import {importePorPagados,saldoAlbaran} from "@/lib/contabilidad";
import type {Linea} from "@/lib/store";
const lineas:Linea[]=Array.from({length:10},(_,i)=>({numero:"96458",serie:"1",fraccion:String(i+1),cantidad:1,pagados:0,devueltos:0}));
describe("albaranes compactos",()=>{
 it("conserva diez fracciones en una serie agrupada y dos sueltas",()=>{const g=agruparLineas([...lineas,...lineas.slice(2,4).map(l=>({...l,serie:"2"}))]);expect(g).toHaveLength(1);expect(g[0]).toMatchObject({cantidad:12,series:"Series 1",sueltas:["Serie 2 · fracciones 3–4"]});});
 it("ocho pagados y dos devueltos agrupados calculan 160 euros y saldo cero",()=>{let l=editarCantidadAgrupada(lineas,lineas,"96458","pagados",8);l=editarCantidadAgrupada(lineas,l,"96458","devueltos",2);expect(l.reduce((s,l)=>s+l.pagados,0)).toBe(8);expect(l.reduce((s,l)=>s+l.devueltos,0)).toBe(2);expect(importePorPagados({total:0,lineas},l)).toBe(160);expect(saldoAlbaran({total:160,lineas:l}).pendiente).toBe(0);});
 it("mantiene pagos anteriores e índices sin duplicar el cobro",()=>{const original=editarCantidadAgrupada(lineas,lineas,"96458","pagados",3);const l=editarCantidadAgrupada(original,original,"96458","pagados",5);expect(importePorPagados({total:60,lineas:original},l)).toBe(40);expect(l.map(x=>x.fraccion)).toEqual(lineas.map(x=>x.fraccion));expect(editarCantidadAgrupada(original,l,"96458","pagados",0).reduce((s,l)=>s+l.pagados,0)).toBe(3);});
});
