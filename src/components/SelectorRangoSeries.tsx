import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SelectorRangoSeries({desde,hasta,onDesde,onHasta}:{desde:string;hasta:string;onDesde:(v:string)=>void;onHasta:(v:string)=>void}) {
  return <fieldset className="space-y-3"><legend className="mb-2 font-semibold">Rango de series</legend>
    {([{label:"Serie desde",value:desde,change:onDesde},{label:"Serie hasta",value:hasta,change:onHasta}] as const).map(({label,value,change})=><div key={label}><Label htmlFor={label}>{label}</Label><div className="mt-1 flex gap-2"><Button type="button" variant="secondary" aria-label={`Reducir ${label.toLowerCase()}`} onClick={()=>change(String(Math.max(1,Number(value || desde || 1)-1)))}><Minus/></Button><Input id={label} className="h-12 min-w-0 text-lg" type="number" inputMode="numeric" pattern="[0-9]*" min={1} step={1} placeholder={label==="Serie hasta"?"Opcional":"1"} value={value} onChange={e=>change(e.target.value)}/><Button type="button" variant="secondary" aria-label={`Incrementar ${label.toLowerCase()}`} onClick={()=>change(String(Number(value || desde || 0)+1))}><Plus/></Button></div></div>)}
    <div className="flex flex-wrap gap-2">{[10,25,50].map(n=><Button key={n} type="button" variant="outline" onClick={()=>{const start=Math.max(1,Number(desde)||1);onDesde(String(start));onHasta(String(start+n-1));}}>{n} series</Button>)}</div>
  </fieldset>;
}