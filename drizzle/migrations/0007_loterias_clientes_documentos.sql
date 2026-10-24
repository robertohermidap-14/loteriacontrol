ALTER TABLE public.locales ADD COLUMN persona text NOT NULL DEFAULT '', ADD COLUMN dni text NOT NULL DEFAULT '', ADD COLUMN email text NOT NULL DEFAULT '';
ALTER TABLE public.decimos ADD COLUMN loteria text NOT NULL DEFAULT 'navidad' CHECK (loteria IN ('navidad','reyes','nacional'));
ALTER TABLE public.albaranes ADD COLUMN loteria text NOT NULL DEFAULT 'navidad' CHECK (loteria IN ('navidad','reyes','nacional'));
ALTER TABLE public.pagos ADD COLUMN loteria text NOT NULL DEFAULT 'navidad' CHECK (loteria IN ('navidad','reyes','nacional'));
CREATE TABLE public.cierres_loteria (LIKE public.cierres_caja INCLUDING DEFAULTS INCLUDING CONSTRAINTS);
ALTER TABLE public.cierres_loteria ADD COLUMN loteria text NOT NULL DEFAULT 'navidad' CHECK (loteria IN ('navidad','reyes','nacional'));
ALTER TABLE public.cierres_loteria ADD PRIMARY KEY(id), ADD UNIQUE(usuario_id,dia,loteria);
GRANT SELECT ON public.cierres_loteria TO authenticated;
GRANT ALL ON public.cierres_loteria TO service_role;
ALTER TABLE public.cierres_loteria ENABLE ROW LEVEL SECURITY;
CREATE POLICY leer_cierres ON public.cierres_loteria FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'admin') OR (public.has_role(auth.uid(),'comercial') AND usuario_id=auth.uid() AND dia=(now() AT TIME ZONE 'Europe/Madrid')::date));
INSERT INTO public.cierres_loteria SELECT c.*, 'navidad' FROM public.cierres_caja c;
COMMENT ON TABLE public.cierres_caja IS 'DEPRECATED: replaced by cierres_loteria for lottery-specific closures';
CREATE INDEX stock_loteria ON public.decimos(loteria,numero,ubicacion);
CREATE INDEX albaranes_loteria ON public.albaranes(loteria,fecha);
CREATE OR REPLACE FUNCTION public.clasificar_pago_loteria() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN SELECT loteria INTO NEW.loteria FROM public.albaranes WHERE id=NEW.albaran_id; RETURN NEW; END; $$;
CREATE TRIGGER clasificar_pago BEFORE INSERT ON public.pagos FOR EACH ROW EXECUTE FUNCTION public.clasificar_pago_loteria();
DO $$ DECLARE definition text; BEGIN
SELECT pg_get_functiondef('public.registrar_cobro(text,jsonb,numeric,text,text,uuid)'::regprocedure) INTO definition;
definition:=replace(definition, ' IF EXISTS(SELECT 1 FROM public.cierres_caja WHERE usuario_id=auth.uid() AND dia=(now() AT TIME ZONE ''Europe/Madrid'')::date) THEN RAISE EXCEPTION ''Tu caja de hoy ya está cerrada''; END IF;', '');
definition:=replace(definition, ' IF NOT FOUND THEN RAISE EXCEPTION ''Albarán no encontrado''; END IF;', ' IF NOT FOUND THEN RAISE EXCEPTION ''Albarán no encontrado''; END IF; IF EXISTS(SELECT 1 FROM public.cierres_loteria WHERE usuario_id=auth.uid() AND dia=(now() AT TIME ZONE ''Europe/Madrid'')::date AND loteria=a.loteria) THEN RAISE EXCEPTION ''Tu caja de esta lotería ya está cerrada''; END IF;');
definition:=replace(definition, 'AND ubicacion=a.local_id ORDER BY', 'AND ubicacion=a.local_id AND loteria=a.loteria ORDER BY');
definition:=replace(definition, 'INSERT INTO public.decimos(id,numero,serie,fraccion,cantidad,ubicacion,estado)', 'INSERT INTO public.decimos(id,numero,serie,fraccion,cantidad,ubicacion,estado,loteria)');
definition:=replace(definition, 'ret,''central'',''venta'');', 'ret,''central'',''venta'',a.loteria);');
EXECUTE definition;
END; $$;
CREATE OR REPLACE FUNCTION public.cerrar_caja_loteria(p_usuario uuid,p_dia date,p_efectivo numeric,p_tarjeta numeric,p_bizum numeric,p_notas text,p_loteria text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE ef numeric; ta numeric; bi numeric;
BEGIN
 IF auth.uid() IS NULL OR NOT (public.has_role(auth.uid(),'admin') OR (public.has_role(auth.uid(),'comercial') AND p_usuario=auth.uid() AND p_dia=(now() AT TIME ZONE 'Europe/Madrid')::date)) THEN RAISE EXCEPTION 'Sin permiso para cerrar esta caja'; END IF;
 IF p_loteria NOT IN ('navidad','reyes','nacional') OR p_dia>(now() AT TIME ZONE 'Europe/Madrid')::date OR NOT (public.has_role(p_usuario,'admin') OR public.has_role(p_usuario,'comercial')) OR p_efectivo IS NULL OR p_tarjeta IS NULL OR p_bizum IS NULL OR least(p_efectivo,p_tarjeta,p_bizum)<0 OR length(p_notas)>1000 THEN RAISE EXCEPTION 'Datos de cierre no válidos'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext(p_usuario::text));
 SELECT coalesce(sum(importe) FILTER(WHERE metodo='efectivo'),0),coalesce(sum(importe) FILTER(WHERE metodo='tarjeta'),0),coalesce(sum(importe) FILTER(WHERE metodo='bizum'),0) INTO ef,ta,bi FROM public.pagos WHERE usuario_id=p_usuario AND loteria=p_loteria AND (fecha AT TIME ZONE 'Europe/Madrid')::date=p_dia;
 INSERT INTO public.cierres_loteria(usuario_id,dia,creado_por,esperado_efectivo,esperado_tarjeta,esperado_bizum,real_efectivo,real_tarjeta,real_bizum,notas,loteria) VALUES(p_usuario,p_dia,auth.uid(),ef,ta,bi,p_efectivo,p_tarjeta,p_bizum,p_notas,p_loteria);
END; $$;
REVOKE ALL ON FUNCTION public.cerrar_caja_loteria(uuid,date,numeric,numeric,numeric,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cerrar_caja_loteria(uuid,date,numeric,numeric,numeric,text,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.leer_copia_albaran(p_hash text) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT jsonb_build_object('id',a.id,'fecha',a.fecha,'estado',a.estado,'tipo',a.tipo,'loteria',a.loteria,'lineas',a.lineas,'total',a.total,'fechaPago',a.fecha_pago,'receptorNombre',a.receptor_nombre,'receptorDni',a.receptor_dni,'firma',a.firma,'cobradoPor',a.cobrado_por,'firmaCobro',a.firma_cobro,'localNombre',l.nombre,'localDireccion',l.direccion,'localTelefono',l.telefono,'localPersona',l.persona,'localDni',l.dni,'localEmail',l.email,'codigoCliente',l.codigo_cliente,'administracion',(SELECT jsonb_build_object('nombre',nombre,'razon_social',razon_social,'nif',nif,'direccion',direccion,'telefono',telefono,'email',email,'logo',logo) FROM public.configuracion WHERE id=1))
 FROM public.albaran_copias c JOIN public.albaranes a ON a.id=c.albaran_id JOIN public.locales l ON l.id=a.local_id WHERE c.token_hash=p_hash AND c.expires_at>now() AND length(p_hash)=64 LIMIT 1;
$$;
CREATE OR REPLACE FUNCTION public.validar_local() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN IF length(trim(NEW.nombre))=0 OR length(NEW.nombre)>200 OR length(NEW.persona)>200 OR length(NEW.dni)>30 OR length(NEW.telefono)>40 OR length(NEW.direccion)>500 OR length(NEW.email)>254 OR (NEW.email<>'' AND NEW.email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') THEN RAISE EXCEPTION 'Datos del cliente no válidos'; END IF; RETURN NEW; END; $$;
CREATE TRIGGER validar_datos_local BEFORE INSERT OR UPDATE ON public.locales FOR EACH ROW EXECUTE FUNCTION public.validar_local();