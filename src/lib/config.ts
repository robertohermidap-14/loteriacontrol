import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Config = { nombre: string; razon_social: string; nif: string; direccion: string; telefono: string; email: string; logo: string };
const vacia: Config = { nombre: "", razon_social: "", nif: "", direccion: "", telefono: "", email: "", logo: "" };

let cache: Config | null = null;
const subs = new Set<(c: Config) => void>();

async function cargar() {
  const { data } = await supabase.from("configuracion").select("nombre,razon_social,nif,direccion,telefono,email,logo").eq("id", 1).maybeSingle();
  cache = data ?? vacia;
  subs.forEach((s) => s(cache!));
}

/** Datos de la administración (logo y facturación), compartidos por todo el equipo. */
export function useConfig(): Config | null {
  const [c, setC] = useState<Config | null>(cache);
  useEffect(() => {
    subs.add(setC);
    if (!cache) cargar();
    return () => { subs.delete(setC); };
  }, []);
  return c;
}

export async function guardarConfig(c: Config) {
  const { error } = await supabase.from("configuracion").upsert({ id: 1, ...c, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
  await cargar();
}
