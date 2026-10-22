import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
export const cerrarCaja = createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator((d:unknown) => z.object({usuario:z.string().uuid(),dia:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),efectivo:z.number().nonnegative(),tarjeta:z.number().nonnegative(),bizum:z.number().nonnegative(),notas:z.string().max(1000)}).parse(d)).handler(async({data,context}) => {
  const {error} = await context.supabase.rpc("cerrar_caja",{p_usuario:data.usuario,p_dia:data.dia,p_efectivo:data.efectivo,p_tarjeta:data.tarjeta,p_bizum:data.bizum,p_notas:data.notas});
  if(error) throw new Error(error.message);
});