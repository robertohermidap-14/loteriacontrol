import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type NuevoUsuario = { email: string; password: string; nombre: string; apellidos: string; rol: "admin" | "comercial" };

export const crearUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: NuevoUsuario) => {
    if (!d?.email?.includes("@")) throw new Error("Email no válido");
    if (!d?.password || d.password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres");
    if (!d?.nombre?.trim()) throw new Error("Falta el nombre");
    if (d.rol !== "admin" && d.rol !== "comercial") throw new Error("Rol no válido");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { data: esAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!esAdmin) throw new Error("Solo el administrador puede crear usuarios");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: u, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { nombre: data.nombre.trim(), apellidos: (data.apellidos ?? "").trim() },
    });
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("user_roles").insert({ user_id: u.user.id, role: data.rol });
    return { id: u.user.id };
  });

export const listarUsuarios = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: esAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!esAdmin) throw new Error("Solo el administrador puede ver los usuarios");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: perfiles }, { data: roles }, { data: auth }] = await Promise.all([
      supabaseAdmin.from("profiles").select("*"),
      supabaseAdmin.from("user_roles").select("*"),
      supabaseAdmin.auth.admin.listUsers(),
    ]);
    const emails = new Map((auth?.users ?? []).map((u) => [u.id, u.email ?? ""]));
    return (perfiles ?? []).map((p) => ({
      id: p.id,
      nombre: p.nombre,
      apellidos: p.apellidos,
      email: emails.get(p.id) ?? "",
      roles: (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role as string),
    }));
  });
