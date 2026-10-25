import {describe,it,expect} from "vitest";
import {deLoteria, seleccionarLoteria, loteriaActual} from "@/lib/loteria";
import {qrCliente} from "@/lib/cliente";
describe("Separación de loterías y ficha de cliente",()=>{
 const rows=[{id:1},{id:2,loteria:"navidad"},{id:3,loteria:"reyes"},{id:4,loteria:"nacional"}];
 it("los datos actuales pertenecen a Navidad",()=>expect(deLoteria(rows,"navidad").map(r=>r.id)).toEqual([1,2]));
 it("Reyes no incluye operaciones de Navidad ni Nacional",()=>expect(deLoteria(rows,"reyes").map(r=>r.id)).toEqual([3]));
 it("Nacional no incluye operaciones de Navidad ni Reyes",()=>expect(deLoteria(rows,"nacional").map(r=>r.id)).toEqual([4]));
 it("las nuevas entradas utilizan la lotería seleccionada",()=>{seleccionarLoteria("reyes");expect(loteriaActual()).toBe("reyes");seleccionarLoteria(null);});
 it("el QR contiene los datos editables del cliente",()=>{expect(JSON.parse(qrCliente({id:"c1",codigoCliente:8,nombre:"Local",persona:"Ana",dni:"12345678Z",telefono:"600111222",email:"ana@example.org",direccion:"Ferrol"}))).toMatchObject({id:"c1",codigo:8,nombre:"Local",persona:"Ana",dni:"12345678Z",telefono:"600111222",email:"ana@example.org"});});
});
