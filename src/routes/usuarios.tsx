import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageTitle } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSesion } from "@/lib/sesion";
import { crearUsuario, editarUsuario, listarUsuarios } from "@/lib/usuarios.functions";
import { guardarConfig, useConfig, type Config } from "@/lib/config";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/usuarios")({
  head: () => ({
    meta: [
      { title: "Administración · Gestión Lotería" },
      { name: "description", content: "Usuarios del equipo, logo y datos de facturación de la administración." },
      { property: "og:title", content: "Administración · Gestión Lotería" },
      { property: "og:description", content: "Usuarios del equipo, logo y datos de facturación de la administración." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

type Form = { id?: string; nombre: string; apellidos: string; email: string; telefono: string; codigo: string; password: string; rol: "comercial" | "admin" };
const vacio: Form = { nombre: "", apellidos: "", email: "", telefono: "", codigo: "", password: "", rol: "comercial" };

function Admin() {
  const sesion = useSesion();
  const [tab, setTab] = useState<"usuarios" | "admin">("usuarios");
  if (sesion.cargando) return <p className="text-muted-foreground">Cargando…</p>;
  if (!sesion.esAdmin) return <p className="text-muted-foreground">Esta sección es solo para el administrador.</p>;
  return (
    <>
      <PageTitle sub="Gestiona el equipo y los datos de tu administración">Administración</PageTitle>
      <div className="mb-6 grid grid-cols-2 gap-2">
        <Button variant={tab === "usuarios" ? "default" : "secondary"} onClick={() => setTab("usuarios")}>Usuarios</Button>
        <Button variant={tab === "admin" ? "default" : "secondary"} onClick={() => setTab("admin")}>Datos y logo</Button>
      </div>
      {tab === "usuarios" ? <Usuarios /> : <DatosAdmin />}
    </>
  );
}

function Usuarios() {
  const qc = useQueryClient();
  const [f, setF] = useState<Form>(vacio);
  const [enviando, setEnviando] = useState(false);
  const { data: usuarios } = useQuery({ queryKey: ["usuarios"], queryFn: () => listarUsuarios() });
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const editando = !!f.id;

  return (
    <>
      <form className="mb-8 grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setEnviando(true);
          try {
            if (f.id) await editarUsuario({ data: { ...f, id: f.id, password: f.password || undefined } });
            else await crearUsuario({ data: f });
            toast.success(editando ? "Usuario actualizado" : `Usuario ${f.email} creado`);
            setF(vacio);
            qc.invalidateQueries({ queryKey: ["usuarios"] });
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "No se pudo guardar el usuario");
          } finally { setEnviando(false); }
        }}>
        <h2 className="font-semibold sm:col-span-2">{editando ? "Editar usuario" : "Nuevo usuario"}</h2>
        <div><Label>Nombre</Label><Input value={f.nombre} onChange={set("nombre")} required /></div>
        <div><Label>Apellidos</Label><Input value={f.apellidos} onChange={set("apellidos")} /></div>
        <div><Label>Correo</Label><Input type="email" value={f.email} onChange={set("email")} required /></div>
        <div><Label>Teléfono</Label><Input type="tel" value={f.telefono} onChange={set("telefono")} /></div>
        <div><Label>Código de usuario</Label><Input value={f.codigo} onChange={set("codigo")} placeholder="Ej. COM01" /></div>
        <div><Label>{editando ? "Nueva contraseña (opcional)" : "Contraseña"}</Label><Input type="text" value={f.password} onChange={set("password")} required={!editando} minLength={6} /></div>
        <div className="grid grid-cols-2 gap-2 sm:col-span-2">
          <Button type="button" variant={f.rol === "comercial" ? "default" : "secondary"} onClick={() => setF({ ...f, rol: "comercial" })}>Comercial</Button>
          <Button type="button" variant={f.rol === "admin" ? "default" : "secondary"} onClick={() => setF({ ...f, rol: "admin" })}>Administrador</Button>
        </div>
        <div className="flex gap-2 sm:col-span-2">
          <Button size="lg" className="flex-1" disabled={enviando}>{enviando ? "Guardando…" : editando ? "Guardar cambios" : "Crear usuario"}</Button>
          {editando && <Button type="button" size="lg" variant="ghost" onClick={() => setF(vacio)}>Cancelar</Button>}
        </div>
      </form>
      <div className="space-y-2">
        {(usuarios ?? []).map((u) => (
          <div key={u.id} className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card p-3">
            <div className="min-w-0">
              <p className="truncate font-semibold">{u.codigo && <span className="mr-2 font-mono text-primary">{u.codigo}</span>}{u.nombre} {u.apellidos}</p>
              <p className="truncate text-sm text-muted-foreground">{u.email}{u.telefono && ` · ${u.telefono}`}</p>
            </div>
            <span className="shrink-0 rounded-md bg-secondary px-2 py-1 text-xs font-semibold">{u.roles.includes("admin") ? "Administrador" : "Comercial"}</span>
            <Button size="sm" variant="secondary" onClick={() => { setF({ id: u.id, nombre: u.nombre, apellidos: u.apellidos, email: u.email, telefono: u.telefono, codigo: u.codigo, password: "", rol: u.roles.includes("admin") ? "admin" : "comercial" }); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Editar</Button>
          </div>
        ))}
        {usuarios && !usuarios.length && <p className="text-muted-foreground">Sin usuarios.</p>}
      </div>
    </>
  );
}

async function reducirLogo(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  const img = new Image();
  await new Promise((ok, ko) => { img.onload = ok; img.onerror = ko; img.src = url; });
  const escala = Math.min(1, 400 / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * escala); c.height = Math.round(img.height * escala);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  URL.revokeObjectURL(url);
  return c.toDataURL("image/png");
}

function DatosAdmin() {
  const config = useConfig();
  const [c, setC] = useState<Config | null>(null);
  const [guardando, setGuardando] = useState(false);
  useEffect(() => { if (config && !c) setC(config); }, [config, c]);
  if (!c) return <p className="text-muted-foreground">Cargando…</p>;
  const set = (k: keyof Config) => (e: React.ChangeEvent<HTMLInputElement>) => setC({ ...c, [k]: e.target.value });
  return (
    <form className="grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault(); setGuardando(true);
        try { await guardarConfig(c); toast.success("Datos guardados"); }
        catch (err) { toast.error(err instanceof Error ? err.message : "No se pudo guardar"); }
        finally { setGuardando(false); }
      }}>
      <div className="flex items-center gap-4 sm:col-span-2">
        <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-background">
          {c.logo ? <img src={c.logo} alt="Logo de la administración" className="max-h-full max-w-full object-contain" /> : <span className="text-xs text-muted-foreground">Sin logo</span>}
        </div>
        <div className="space-y-2">
          <Label>Logo</Label>
          <Input type="file" accept="image/*" onChange={async (e) => { const file = e.target.files?.[0]; if (file) setC({ ...c, logo: await reducirLogo(file) }); }} />
          {c.logo && <Button type="button" size="sm" variant="ghost" onClick={() => setC({ ...c, logo: "" })}>Quitar logo</Button>}
        </div>
      </div>
      <div className="sm:col-span-2"><Label>Nombre comercial</Label><Input value={c.nombre} onChange={set("nombre")} /></div>
      <div><Label>Razón social</Label><Input value={c.razon_social} onChange={set("razon_social")} /></div>
      <div><Label>NIF / CIF</Label><Input value={c.nif} onChange={set("nif")} /></div>
      <div className="sm:col-span-2"><Label>Dirección fiscal</Label><Input value={c.direccion} onChange={set("direccion")} /></div>
      <div><Label>Teléfono</Label><Input type="tel" value={c.telefono} onChange={set("telefono")} /></div>
      <div><Label>Correo</Label><Input type="email" value={c.email} onChange={set("email")} /></div>
      <Button size="lg" className="sm:col-span-2" disabled={guardando}>{guardando ? "Guardando…" : "Guardar datos"}</Button>
    </form>
  );
}
