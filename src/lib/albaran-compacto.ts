import type { Linea } from "@/lib/store";

export function rangosNumericos(values: string[]) {
  const numbers = [...new Set(values)].filter(v => /^\d+$/.test(v)).map(Number).sort((a,b)=>a-b);
  const ranges: string[]=[];
  for(let i=0;i<numbers.length;i++) {
    const start=numbers[i]; let end=start;
    while(i+1<numbers.length && numbers[i+1]===Number(end)+1){i++;end=numbers[i];}
    ranges.push(start===end?String(start):`${start}–${end}`);
  }
  return [...ranges,...new Set(values.filter(v=>!/^\d+$/.test(v)))].join(", ");
}
export function agruparLineas(lineas: Linea[]) {
  const numeros=[...new Set(lineas.map(l=>l.numero))].sort();
  return numeros.map(numero=>{
    const items=lineas.filter(l=>l.numero===numero);
    const series=[...new Set(items.map(l=>l.serie))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
    const completas: string[]=[]; const sueltas: string[]=[];
    for(const serie of series){
      const filas=items.filter(l=>l.serie===serie);
      const fracciones=new Set(filas.map(l=>l.fraccion));
      if(Array.from({length:10},(_,i)=>String(i+1)).every(f=>fracciones.has(f)))completas.push(serie);
      else sueltas.push(`Serie ${serie || "—"} · ${filas.every(l=>/^\d+$/.test(l.fraccion))?`fracciones ${rangosNumericos(filas.map(l=>l.fraccion))}`:"sin fracciones detalladas"}`);
    }
    return {numero,series:completas.length?`Series ${rangosNumericos(completas)}`:"",sueltas,cantidad:items.reduce((s,l)=>s+l.cantidad,0),pagados:items.reduce((s,l)=>s+l.pagados,0),devueltos:items.reduce((s,l)=>s+l.devueltos,0)};
  });
}
/** Preserve original row order and immutable prior settlement; allocate only newly paid/returned units. */
export function editarCantidadAgrupada(original: Linea[], actuales: Linea[], numero:string, campo:"pagados"|"devueltos", valor:number): Linea[] {
  const otro=campo==="pagados"?"devueltos":"pagados";
  const minimo=original.filter(l=>l.numero===numero).reduce((s,l)=>s+l[campo],0);
  const maximo=actuales.filter(l=>l.numero===numero).reduce((s,l)=>s+l.cantidad-l[otro],0);
  let restantes=Math.max(0,Math.max(minimo,Math.min(maximo,Math.trunc(Number.isFinite(valor)?valor:0)))-minimo);
  return actuales.map((l,i)=>{
    if(l.numero!==numero)return l;
    const previo=original[i]?.[campo] ?? 0;
    const incremento=Math.min(restantes,Math.max(0,l.cantidad-l[otro]-previo));
    restantes-=incremento;
    return {...l,[campo]:previo+incremento};
  });
}
