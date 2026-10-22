CREATE TABLE public.albaran_copias (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 albaran_id text NOT NULL REFERENCES public.albaranes(id),
 token_hash text NOT NULL UNIQUE,
 creado_por uuid NOT NULL,
 creado_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL DEFAULT (now() + interval '1 year')
);
GRANT SELECT, INSERT, DELETE ON public.albaran_copias TO authenticated;
GRANT ALL ON public.albaran_copias TO service_role;
ALTER TABLE public.albaran_copias ENABLE ROW LEVEL SECURITY;
CREATE POLICY equipo_copias ON public.albaran_copias FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'comercial'));
CREATE POLICY crear_copia ON public.albaran_copias FOR INSERT TO authenticated WITH CHECK (creado_por = auth.uid() AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'comercial')));
CREATE POLICY revocar_copia ON public.albaran_copias FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'comercial'));
CREATE OR REPLACE FUNCTION public.leer_copia_albaran(p_hash text) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT jsonb_build_object('id', a.id, 'fecha', a.fecha, 'estado', a.estado, 'tipo', a.tipo, 'lineas', a.lineas, 'total', a.total, 'fechaPago', a.fecha_pago, 'receptorNombre', a.receptor_nombre, 'firma', a.firma, 'cobradoPor', a.cobrado_por, 'firmaCobro', a.firma_cobro, 'localNombre', l.nombre, 'localDireccion', l.direccion)
 FROM public.albaran_copias c JOIN public.albaranes a ON a.id = c.albaran_id JOIN public.locales l ON l.id = a.local_id
 WHERE c.token_hash = p_hash AND c.expires_at > now() AND length(p_hash) = 64 LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.leer_copia_albaran(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.leer_copia_albaran(text) TO anon, authenticated, service_role;