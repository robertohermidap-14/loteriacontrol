import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Sesion = { userId: string; nombre: string; apellidos: string; esAdmin: boolean; cargando: boolean };

const vacia: Sesion = { userId: "", nombre: "", apellidos: "", esAdmin: false, cargando: true };

/** Datos del usuario conectado: nombre, apellidos y si es administrador. */
export function useSesion(): Sesion {
  const [s, setS] = useState<Sesion>(vacia);
  useEffect(() => {
    let vivo = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (vivo) setS({ ...vacia, cargando: false }); return; }
      const [p, r] = await Promise.all([
        supabase.from("profiles").select("nombre,apellidos").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);
      if (!vivo) return;
      setS({
        userId: user.id,
        nombre: p.data?.nombre ?? "",
        apellidos: p.data?.apellidos ?? "",
        esAdmin: (r.data ?? []).some((x) => x.role === "admin"),
        cargando: false,
      });
    })();
    return () => { vivo = false; };
  }, []);
  return s;
}

export const EMPRESA = "CAMINODESANTIAGOLOTERIA · Administración Nº 8 - Ferrol";

/** Nombre que queda registrado en el cobro: el del comercial conectado + la administración. */
export const nombreCobrador = (s: Sesion) =>
  `${[s.nombre, s.apellidos].filter(Boolean).join(" ") || "Comercial"} · ${EMPRESA}`;
