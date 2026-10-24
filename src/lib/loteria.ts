import { useSyncExternalStore } from "react";
export const LOTERIAS = [{id:"navidad",nombre:"Lotería de Navidad"},{id:"reyes",nombre:"Lotería de Reyes"},{id:"nacional",nombre:"Lotería Nacional semanal"}] as const;
export type Loteria = typeof LOTERIAS[number]["id"];
let seleccion: Loteria | null = null;
const listeners = new Set<() => void>();
export const loteriaActual = () => seleccion ?? "navidad";
export function seleccionarLoteria(loteria: Loteria | null) { seleccion=loteria; listeners.forEach(l=>l()); }
export const useLoteria = () => useSyncExternalStore(l=>{listeners.add(l);return()=>{listeners.delete(l);};},()=>seleccion,()=>null);
export function deLoteria<T extends {loteria?: string}>(rows:T[], loteria:Loteria):T[] {return rows.filter(r=>(r.loteria ?? "navidad")===loteria);}