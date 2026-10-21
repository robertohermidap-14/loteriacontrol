import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageTitle } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSesion } from "@/lib/sesion";
import { crearUsuario, listarUsuarios } from "@/lib/usuarios.functions";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuarios · Gestión Lotería" },
      { name: "description", content: "Alta de comerciales y administradores." },
      { property: "og:title", content: "Usuarios · Gestión Lotería" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Usuarios,
});

function Usuarios() {
  const sesion = useSesion();
  const qc = useQueryClient();
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<"comercial" | "admin">("comercial");
  const [enviando, setEnviando] = useState(false);

  const { data: usuarios } = useQuery({
    queryKey: ["usuarios"],
    queryFn: () => listarUsuarios(),
    enabled: sesion.esAdmin,
  });

  if (sesion.cargando) return <p className="text-muted-foreground">Cargando…</p>;
  if (!sesion.esAdmin) return <p className="text-muted-foreground">Esta sección es solo para el administrador.</p>;

  return (
    <>
      <PageTitle sub="Crea las cuentas de los comerciales. Cada uno cobra con su propio nombre.">Usuarios del equipo</PageTitle>
      <form className="mb-8 grid gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setEnviando(true);
          try {
            await crearUsuario({ data: { email, password, nombre, apellidos, rol } });
            toast.success(`Usuario ${email} creado`);
            setNombre(""); setApellidos(""); setEmail(""); setPassword(""); setRol("comercial");
            qc.invalidateQueries({ queryKey: ["usuarios"] });
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "No se pudo crear el usuario");
          } finally { setEnviando(false); }
        }}>
        <div><Label>Nombre</Label><Input value={nombre} onChange={(e) => setNombre(e.target.value)} required /></div>
        <div><Label>Apellidos</Label><Input value={apellidos} onChange={(e) => setApellidos(e.target.value)} /></div>
        <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        <div><Label>Contraseña</Label><Input type="text" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} /></div>
        <div className="sm:col-span-2 grid grid-cols-2 gap-2">
          <Button type="button" variant={rol === "comercial" ? "default" : "secondary"} onClick={() => setRol("comercial")}>Comercial</Button>
          <Button type="button" variant={rol === "admin" ? "default" : "secondary"} onClick={() => setRol("admin")}>Administrador</Button>
        </div>
        <Button size="lg" className="sm:col-span-2" disabled={enviando}>{enviando ? "Creando…" : "Crear usuario"}</Button>
      </form>
      <div className="space-y-2">
        {(usuarios ?? []).map((u) => (
          <div key={u.id} className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card p-3">
            <div className="min-w-0">
              <p className="truncate font-semibold">{u.nombre} {u.apellidos}</p>
              <p className="truncate text-sm text-muted-foreground">{u.email}</p>
            </div>
            <span className="shrink-0 rounded-md bg-secondary px-2 py-1 text-xs font-semibold">
              {u.roles.includes("admin") ? "Administrador" : "Comercial"}
            </span>
          </div>
        ))}
        {usuarios && !usuarios.length && <p className="text-muted-foreground">Sin usuarios.</p>}
      </div>
    </>
  );
}
