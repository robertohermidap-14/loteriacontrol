import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { conectar, desconectar } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AuthGate({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<"cargando" | "fuera" | "dentro">("cargando");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setEstado(data.session ? "dentro" : "fuera"));
    const { data } = supabase.auth.onAuthStateChange((ev, s) => {
      if (ev === "SIGNED_IN" || ev === "SIGNED_OUT" || ev === "INITIAL_SESSION") setEstado(s ? "dentro" : "fuera");
    });
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => { if (estado === "dentro") conectar(); if (estado === "fuera") desconectar(); }, [estado]);

  if (estado === "cargando") return <div className="grid min-h-screen place-items-center text-muted-foreground">Cargando…</div>;
  if (estado === "dentro") return <>{children}</>;
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <form className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-6"
        onSubmit={async (e) => {
          e.preventDefault(); setError("");
          const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
          if (error) setError("Email o contraseña incorrectos");
        }}>
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary font-mono text-2xl font-bold text-primary-foreground">L</div>
        <h1 className="text-2xl font-bold">Gestión Lotería</h1>
        <p className="text-sm text-muted-foreground">Acceso solo para el equipo.</p>
        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input type="password" placeholder="Contraseña" value={pass} onChange={(e) => setPass(e.target.value)} required />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button size="lg" className="w-full">Entrar</Button>
      </form>
    </div>
  );
}

export const salir = () => supabase.auth.signOut();
