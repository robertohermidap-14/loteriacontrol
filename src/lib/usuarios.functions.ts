import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Rol = "admin" | "comercial";
type DatosUsuario = { email: string; nombre: string; apellidos: string; telefono: string; codigo: string; rol: Rol };
type NuevoUsuario = DatosUsuario & { password: string };
type EdicionUsuario = DatosUsuario & { id: string; password?: string };

function validar<T extends DatosUsuario>(d: T): T {
  if (!d?.email?.includes("@")) throw new Error("Email no válido");
  if (!d?.nombre?.trim()) throw new Error("Falta el nombre");
  if (d.rol !== "admin" && d.rol !== "comercial") throw new Error("Rol no válido");
  if ((d.telefono ?? "").length > 30 || (d.codigo ?? "").length > 30) throw new Error("Teléfono o código demasiado largo");
  return d;
}

async function soloAdmin(context: { supabase: any; userId: string }) {
  const { data: esAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (!esAdmin) throw new Error("Solo el administrador puede gestionar usuarios");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const crearUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: NuevoUsuario) => {
    if (!d?.password || d.password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres");
    return validar(d);
  })
  .handler(async ({ data, context }) => {
    const admin = await soloAdmin(context);
    const { data: u, error } = await admin.auth.admin.createUser({
      email: data.email.trim(),
      password: data.password,
      email_confirm: true,
      user_metadata: { nombre: data.nombre.trim(), apellidos: (data.apellidos ?? "").trim() },
    });
    if (error) throw new Error(error.message);
    await admin.from("profiles").upsert({ id: u.user.id, nombre: data.nombre.trim(), apellidos: (data.apellidos ?? "").trim(), telefono: (data.telefono ?? "").trim(), codigo: (data.codigo ?? "").trim() });
    await admin.from("user_roles").insert({ user_id: u.user.id, role: data.rol });
    return { id: u.user.id };
  });

export const editarUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: EdicionUsuario) => {
    if (!d?.id) throw new Error("Falta el usuario");
    if (d.password && d.password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres");
    return validar(d);
  })
  .handler(async ({ data, context }) => {
    const admin = await soloAdmin(context);
    if (data.id === context.userId && data.rol !== "admin") throw new Error("No puedes quitarte el rol de administrador");
    const { error } = await admin.auth.admin.updateUserById(data.id, {
      email: data.email.trim(),
      email_confirm: true,
      ...(data.password ? { password: data.password } : {}),
    });
    if (error) throw new Error(error.message);
    const p = await admin.from("profiles").update({ nombre: data.nombre.trim(), apellidos: (data.apellidos ?? "").trim(), telefono: (data.telefono ?? "").trim(), codigo: (data.codigo ?? "").trim() }).eq("id", data.id);
    if (p.error) throw new Error(p.error.message);
    await admin.from("user_roles").delete().eq("user_id", data.id);
    await admin.from("user_roles").insert({ user_id: data.id, role: data.rol });
    return { ok: true };
  });

export const listarUsuarios = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await soloAdmin(context);
    const [{ data: perfiles }, { data: roles }, { data: auth }] = await Promise.all([
      admin.from("profiles").select("*"),
      admin.from("user_roles").select("*"),
      admin.auth.admin.listUsers(),
    ]);
    const emails = new Map((auth?.users ?? []).map((u) => [u.id, u.email ?? ""]));
    return (perfiles ?? []).map((p) => ({
      id: p.id,
      nombre: p.nombre,
      apellidos: p.apellidos,
      telefono: p.telefono,
      codigo: p.codigo,
      email: emails.get(p.id) ?? "",
      roles: (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role as string),
    }));
  });
