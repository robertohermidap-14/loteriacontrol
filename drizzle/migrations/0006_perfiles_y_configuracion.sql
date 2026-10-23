ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telefono text NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS codigo text NOT NULL DEFAULT '';
CREATE TABLE public.configuracion (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  nombre text NOT NULL DEFAULT '',
  razon_social text NOT NULL DEFAULT '',
  nif text NOT NULL DEFAULT '',
  direccion text NOT NULL DEFAULT '',
  telefono text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  logo text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.configuracion TO authenticated;
GRANT ALL ON public.configuracion TO service_role;
ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;
CREATE POLICY leer_config ON public.configuracion FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'comercial'));
CREATE POLICY crear_config ON public.configuracion FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY editar_config ON public.configuracion FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.configuracion (id, nombre) VALUES (1, 'CAMINODESANTIAGOLOTERIA · Administración Nº 8 - Ferrol') ON CONFLICT DO NOTHING;