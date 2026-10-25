import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { StockNumero } from "@/components/StockNumero";
import { PageTitle } from "@/components/AppShell";
import { EntradaForm } from "@/components/EntradaForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CENTRAL, useStore, type Decimo } from "@/lib/store";

export const Route = createFileRoute("/inventario")({
  head: () => ({
    meta: [
      { title: "Inventario · Gestión Lotería" },
      { name: "description", content: "Stock general por número y desglose por ubicación." },
      { property: "og:title", content: "Inventario · Gestión Lotería" },
      { property: "og:description", content: "Stock general por número y desglose por ubicación." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Inventario,
});

const suma = (l: Decimo[]) => l.reduce((s, d) => s + d.cantidad, 0);

function Inventario() {
  const { decimos, locales } = useStore();
  const [nuevo, setNuevo] = useState("");
  const [alta, setAlta] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [abierto, setAbierto] = useState<string | null>(null);

  const grupos = new Map<string, Decimo[]>();
  for (const d of decimos) if (d.numero.includes(q)) grupos.set(d.numero, [...(grupos.get(d.numero) ?? []), d]);
  const numeros = [...grupos.keys()].sort();

  return (
    <>
      <PageTitle sub={`${suma(decimos)} décimos en total · ${suma(decimos.filter((d) => d.estado === "recepcion"))} en recepción`}>Inventario</PageTitle>
      <form className="mb-6 flex flex-wrap gap-2 border-y border-border py-4"
        onSubmit={(e) => { e.preventDefault(); if (/^\d{5}$/.test(nuevo)) { setAlta(nuevo); setNuevo(""); } }}>
        <Input className="h-12 min-w-0 flex-1" placeholder="Número (5 dígitos)" maxLength={5} inputMode="numeric" value={nuevo} onChange={(e) => setNuevo(e.target.value.replace(/\D/g, ""))} />
        <Button>Añadir entrada</Button>
      </form>
      <Input className="mb-4" placeholder="Buscar número…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="space-y-2">
        {numeros.map((num) => {
          const items = grupos.get(num) ?? [];
          const central = items.filter((d) => d.ubicacion === CENTRAL);
          const open = abierto === num;
          return (
            <div key={num} className="rounded-xl border border-border bg-card">
              <Button variant="ghost" aria-expanded={open} className="h-auto w-full flex-wrap justify-start gap-3 whitespace-normal p-3 text-left" onClick={() => setAbierto(open ? null : num)}>
                <span className="font-mono text-2xl font-bold text-primary">{num}</span>
                <span className="flex-1 text-sm text-muted-foreground">Admin: {suma(central)} · Locales: {suma(items) - suma(central)}</span>
                <span className="text-xl font-bold">{suma(items)}</span>
                <ChevronDown className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`} />
              </Button>
              {open && (
                <><StockNumero numero={num} items={items} locales={locales}/><Button variant="secondary" className="w-full" onClick={() => setAlta(num)}>Añadir más series de {num}</Button></>
              )}
            </div>
          );
        })}
        {!numeros.length && <p className="text-muted-foreground">Sin décimos.</p>}
      </div>
      {alta && <EntradaForm numero={alta} onClose={() => setAlta(null)} />}
    </>
  );
}
