import { useRef, type ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

export function ListaVirtual<T>({items,render,getKey,compact=false}:{items:T[];render:(item:T)=>ReactNode;getKey:(item:T)=>string;compact?:boolean}) {
 const parent=useRef<HTMLDivElement>(null);
  const virtual=useVirtualizer({count:items.length,getScrollElement:()=>parent.current,estimateSize:()=>compact?64:100,overscan:4,getItemKey:index=>{const item=items[index];return item===undefined?index:getKey(item);}});
   return <div ref={parent} className="h-[min(60dvh,560px)] overflow-y-auto overscroll-contain" style={compact?{height:`min(40dvh, ${Math.max(64,Math.min(400,items.length*64))}px)`}:undefined} aria-label="Series y fracciones disponibles"><div className="relative w-full" style={{height:virtual.getTotalSize()}}>{virtual.getVirtualItems().map(row=>{const item=items[row.index];if(item===undefined)return null;return <div key={row.key} data-index={row.index} ref={virtual.measureElement} className="absolute left-0 top-0 w-full pb-2" style={{transform:`translateY(${row.start}px)`}}>{render(item)}</div>;})}</div></div>;
}