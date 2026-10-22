import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import type { Recibo } from "@/lib/recibo";
import { hashToken } from "@/lib/recibo";

export const crearEnlaceRecibo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().min(1).max(100) }).parse(input))
  .handler(async ({ data, context }) => {
    // The caller must be able to read this receipt under the existing team RLS.
    const { data: a, error } = await context.supabase.from("albaranes").select("id").eq("id", data.id).single();
    if (error || !a) throw new Error("No tienes acceso a este albarán.");
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) => b.toString(16).padStart(2, "0")).join("");
    const { error: saveError } = await context.supabase.from("albaran_copias").insert({ albaran_id: a.id, creado_por: context.userId, token_hash: await hashToken(token) });
    if (saveError) throw new Error("No se pudo preparar la copia del cliente.");
    return { token };
  });

export const leerRecibo = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ token: z.string().regex(/^[a-f0-9]{64}$/) }).parse(input))
  .handler(async ({ data }) => {
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    const url = process.env["SUPABASE_URL"];
    if (!key || !url) throw new Error("No se puede consultar el albarán en este momento.");
    const client = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      } },
    });
    const { data: receipt, error } = await client.rpc("leer_copia_albaran", { p_hash: await hashToken(data.token) });
    if (error) throw new Error("No se pudo consultar el albarán. Inténtalo de nuevo.");
    return receipt as unknown as Recibo | null;
  });