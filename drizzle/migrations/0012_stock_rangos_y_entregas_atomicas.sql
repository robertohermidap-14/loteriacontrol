CREATE TABLE public.stock_solicitudes (solicitud uuid PRIMARY KEY, usuario_id uuid NOT NULL, resultado jsonb NOT NULL, fecha timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.stock_solicitudes TO authenticated;
GRANT ALL ON public.stock_solicitudes TO service_role;
ALTER TABLE public.stock_solicitudes ENABLE ROW LEVEL SECURITY;
CREATE POLICY stock_solicitudes_propias ON public.stock_solicitudes FOR SELECT TO authenticated USING (usuario_id = auth.uid());
CREATE OR REPLACE FUNCTION public.guardar_rangos_stock(p_numero text, p_loteria text, p_rangos jsonb) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r jsonb; afectados integer:=0; n integer;
BEGIN
 IF auth.uid() IS NULL OR NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'comercial')) THEN RAISE EXCEPTION 'Sin permiso'; END IF;
 IF p_numero !~ '^[0-9]{5}$' OR p_loteria NOT IN ('navidad','reyes','nacional') OR jsonb_typeof(p_rangos) IS DISTINCT FROM 'array' OR jsonb_array_length(p_rangos) NOT BETWEEN 1 AND 1000 THEN RAISE EXCEPTION 'Selección no válida'; END IF;
 PERFORM id FROM public.decimos WHERE numero=p_numero AND loteria=p_loteria AND ubicacion='central' ORDER BY id FOR UPDATE;
 FOR r IN SELECT value FROM jsonb_array_elements(p_rangos) LOOP
  IF (r->>'desde')::int<1 OR (r->>'hasta')::int<(r->>'desde')::int OR r->>'estado' NOT IN ('venta','recepcion') OR jsonb_typeof(r->'fracciones') IS DISTINCT FROM 'array' OR jsonb_array_length(r->'fracciones') NOT BETWEEN 1 AND 10 OR EXISTS (SELECT 1 FROM jsonb_array_elements_text(r->'fracciones') f WHERE f !~ '^(10|[1-9])$') THEN RAISE EXCEPTION 'Rango no válido'; END IF;
  UPDATE public.decimos d SET estado=r->>'estado' WHERE d.numero=p_numero AND d.loteria=p_loteria AND d.ubicacion='central' AND d.cantidad>0 AND d.serie ~ '^[0-9]+$' AND d.serie::numeric BETWEEN (r->>'desde')::int AND (r->>'hasta')::int AND ((r->'fracciones') ? d.fraccion OR (d.fraccion='' AND (r->'fracciones') @> '["1","2","3","4","5","6","7","8","9","10"]'::jsonb));
  GET DIAGNOSTICS n=ROW_COUNT; afectados:=afectados+n;
 END LOOP;
 RETURN afectados;
END $$;
REVOKE ALL ON FUNCTION public.guardar_rangos_stock(text,text,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.guardar_rangos_stock(text,text,jsonb) TO authenticated;
CREATE OR REPLACE FUNCTION public.entregar_stock(p_local text,p_loteria text,p_items jsonb,p_deposito jsonb,p_solicitud uuid) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE it jsonb; d public.decimos%ROWTYPE; destino public.decimos%ROWTYPE; n integer; lineas jsonb:='[]'; recibo text; anterior jsonb;
BEGIN
 IF auth.uid() IS NULL OR NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'comercial')) THEN RAISE EXCEPTION 'Sin permiso'; END IF;
 IF p_solicitud IS NULL OR p_loteria NOT IN ('navidad','reyes','nacional') OR jsonb_typeof(p_items) IS DISTINCT FROM 'array' OR jsonb_array_length(p_items) NOT BETWEEN 1 AND 10000 OR p_deposito->>'tipo' NOT IN ('entrega','deposito') THEN RAISE EXCEPTION 'Entrega no válida'; END IF;
 IF p_deposito->>'tipo'='deposito' AND (coalesce(trim(p_deposito->>'receptorNombre'),'')='' OR coalesce(trim(p_deposito->>'receptorDni'),'')='' OR coalesce(p_deposito->>'firma','')='') THEN RAISE EXCEPTION 'Completa persona, DNI y firma'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext(p_solicitud::text));
 SELECT resultado INTO anterior FROM public.stock_solicitudes WHERE solicitud=p_solicitud AND usuario_id=auth.uid();
 IF FOUND THEN RETURN anterior->>'id'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.locales WHERE id=p_local) THEN RAISE EXCEPTION 'Local no válido'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_items) x GROUP BY x->>'decimoId' HAVING count(*)>1) THEN RAISE EXCEPTION 'Selección duplicada'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext('entrega:'||p_local||':'||p_loteria));
 PERFORM id FROM public.decimos WHERE id IN (SELECT x->>'decimoId' FROM jsonb_array_elements(p_items) x) ORDER BY id FOR UPDATE;
 FOR it IN SELECT value FROM jsonb_array_elements(p_items) ORDER BY value->>'decimoId' LOOP
  n:=(it->>'cantidad')::int;
  SELECT * INTO d FROM public.decimos WHERE id=it->>'decimoId' AND ubicacion='central' AND loteria=p_loteria;
  IF NOT FOUND OR n IS NULL OR n<=0 OR n>d.cantidad THEN RAISE EXCEPTION 'El stock ha cambiado; revisa la selección antes de entregar'; END IF;
  UPDATE public.decimos s SET cantidad=s.cantidad-n WHERE id=d.id;
  SELECT * INTO destino FROM public.decimos WHERE numero=d.numero AND serie=d.serie AND fraccion=d.fraccion AND ubicacion=p_local AND loteria=p_loteria ORDER BY id LIMIT 1 FOR UPDATE;
  IF FOUND THEN UPDATE public.decimos s SET cantidad=s.cantidad+n, estado='venta' WHERE id=destino.id;
  ELSE INSERT INTO public.decimos(id,numero,serie,fraccion,cantidad,ubicacion,estado,loteria) VALUES(gen_random_uuid()::text,d.numero,d.serie,d.fraccion,n,p_local,'venta',p_loteria); END IF;
  lineas:=lineas||jsonb_build_array(jsonb_build_object('numero',d.numero,'serie',d.serie,'fraccion',d.fraccion,'cantidad',n,'pagados',0,'devueltos',0));
 END LOOP;
 INSERT INTO public.albaranes(local_id,loteria,lineas,tipo,receptor_nombre,receptor_dni,firma) VALUES(p_local,p_loteria,lineas,p_deposito->>'tipo',coalesce(p_deposito->>'receptorNombre',''),coalesce(p_deposito->>'receptorDni',''),coalesce(p_deposito->>'firma','')) RETURNING id INTO recibo;
 INSERT INTO public.stock_solicitudes(solicitud,usuario_id,resultado) VALUES(p_solicitud,auth.uid(),jsonb_build_object('id',recibo));
 RETURN recibo;
END $$;
REVOKE ALL ON FUNCTION public.entregar_stock(text,text,jsonb,jsonb,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.entregar_stock(text,text,jsonb,jsonb,uuid) TO authenticated;