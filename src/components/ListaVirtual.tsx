import { useRef, type ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

export function ListaVirtual<T>({items,render,getKey}:{items:T[];render:(item:T)=>ReactNode;getKey:(item:T)=>string}) {
 const parent=useRef<HTMLDivElement>(null);
 const virtual=useVirtualizer({count:items.length,getScrollElement:()=>parent.current,estimateSize:()=>100,overscan:4,getItemKey:index=>getKey(items[index])});
 return <div ref={parent} className="h-[min(60dvh,560px)] overflow-y-auto overscroll-contain" aria-label="Series y fracciones disponibles"><div className="relative w-full" style={{height:virtual.getTotalSize()}}>{virtual.getVirtualItems().map(row=><div key={row.key} data-index={row.index} ref={virtual.measureElement} className="absolute left-0 top-0 w-full pb-2" style={{transform:`translateY(${row.start}px)`}}>{render(items[row.index])}</div>)}</div></div>;
}