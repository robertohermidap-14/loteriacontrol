CREATE TABLE public.ventas_escaneo (solicitud uuid PRIMARY KEY, usuario_id uuid NOT NULL, numero text NOT NULL, loteria text NOT NULL, resultado jsonb NOT NULL, fecha timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.ventas_escaneo TO authenticated;
GRANT ALL ON public.ventas_escaneo TO service_role;
ALTER TABLE public.ventas_escaneo ENABLE ROW LEVEL SECURITY;
CREATE POLICY leer_ventas ON public.ventas_escaneo FOR SELECT TO authenticated USING (usuario_id=auth.uid() OR public.has_role(auth.uid(),'admin'));