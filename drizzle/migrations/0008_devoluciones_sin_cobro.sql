CREATE TABLE public.liquidacion_solicitudes (solicitud uuid PRIMARY KEY, albaran_id text NOT NULL REFERENCES public.albaranes(id), usuario_id uuid NOT NULL, fecha timestamptz NOT NULL DEFAULT now(), firma text NOT NULL, importe numeric(12,2) NOT NULL, lineas jsonb NOT NULL);
GRANT SELECT ON public.liquidacion_solicitudes TO authenticated;
GRANT ALL ON public.liquidacion_solicitudes TO service_role;
ALTER TABLE public.liquidacion_solicitudes ENABLE ROW LEVEL SECURITY;
CREATE POLICY leer_solicitudes ON public.liquidacion_solicitudes FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'admin') OR (public.has_role(auth.uid(),'comercial') AND usuario_id=auth.uid()));
CREATE OR REPLACE FUNCTION public.registrar_cobro(p_id text,p_lineas jsonb,p_importe numeric,p_metodo text,p_firma text,p_solicitud uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE a public.albaranes%ROWTYPE; l jsonb; old jsonb; idx integer; delta integer; ret integer; stock public.decimos%ROWTYPE; nombre_usuario text; debido numeric:=0; cantidad integer; pag integer; dev integer; devoluciones integer:=0;
BEGIN
 IF auth.uid() IS NULL OR NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'comercial')) THEN RAISE EXCEPTION 'Sin permiso'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext(auth.uid()::text));
 IF EXISTS(SELECT 1 FROM public.liquidacion_solicitudes WHERE solicitud=p_solicitud AND usuario_id=auth.uid() AND albaran_id=p_id) OR EXISTS(SELECT 1 FROM public.pagos WHERE solicitud=p_solicitud AND usuario_id=auth.uid() AND albaran_id=p_id) THEN RETURN; END IF;
 SELECT * INTO a FROM public.albaranes WHERE id=p_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Albarán no encontrado'; END IF;
 IF EXISTS(SELECT 1 FROM public.cierres_loteria WHERE usuario_id=auth.uid() AND dia=(now() AT TIME ZONE 'Europe/Madrid')::date AND loteria=a.loteria) THEN RAISE EXCEPTION 'Tu caja de esta lotería ya está cerrada'; END IF;
 IF p_solicitud IS NULL OR p_importe IS NULL OR p_importe<0 OR p_importe<>round(p_importe,2) OR p_metodo IS NULL OR p_metodo NOT IN ('efectivo','tarjeta','bizum') OR p_firma IS NULL OR length(p_firma)<20 THEN RAISE EXCEPTION 'Importe, método o firma no válido'; END IF;
 SELECT trim(nombre || ' ' || apellidos) INTO nombre_usuario FROM public.profiles WHERE id=auth.uid();
 IF coalesce(nombre_usuario,'')='' THEN RAISE EXCEPTION 'Completa tu nombre y apellidos antes de cobrar'; END IF;
 nombre_usuario:=nombre_usuario || ' · CAMINODESANTIAGOLOTERIA · Administración Nº 8 - Ferrol';
 IF p_lineas IS NULL OR jsonb_typeof(p_lineas)<>'array' OR jsonb_array_length(p_lineas)<>jsonb_array_length(a.lineas) THEN RAISE EXCEPTION 'Líneas no válidas'; END IF;
 FOR l,idx IN SELECT value,(ordinality-1)::integer FROM jsonb_array_elements(p_lineas) WITH ORDINALITY LOOP
  old:=a.lineas->idx;cantidad:=(old->>'cantidad')::integer;pag:=(l->>'pagados')::integer;dev:=(l->>'devueltos')::integer;
  IF l->>'numero' IS DISTINCT FROM old->>'numero' OR l->>'serie' IS DISTINCT FROM old->>'serie' OR l->>'fraccion' IS DISTINCT FROM old->>'fraccion' OR l->>'cantidad' IS DISTINCT FROM old->>'cantidad' OR pag IS NULL OR dev IS NULL OR pag<coalesce((old->>'pagados')::integer,0) OR dev<coalesce((old->>'devueltos')::integer,0) OR pag+dev>cantidad THEN RAISE EXCEPTION 'Cantidades no válidas'; END IF;
  IF p_importe=0 AND pag IS DISTINCT FROM (old->>'pagados')::integer THEN RAISE EXCEPTION 'Una devolución sin cobro no puede modificar los décimos pagados'; END IF;
  devoluciones:=devoluciones+dev-coalesce((old->>'devueltos')::integer,0);debido:=debido+(cantidad-dev)*20;
 END LOOP;
 IF p_importe=0 AND devoluciones=0 THEN RAISE EXCEPTION 'No hay devoluciones nuevas que confirmar'; END IF;
 IF a.total+p_importe>debido THEN RAISE EXCEPTION 'El importe supera el pendiente tras las devoluciones'; END IF;
 FOR l,idx IN SELECT value,(ordinality-1)::integer FROM jsonb_array_elements(p_lineas) WITH ORDINALITY LOOP
  old:=a.lineas->idx;delta:=(l->>'pagados')::integer+(l->>'devueltos')::integer-(old->>'pagados')::integer-(old->>'devueltos')::integer;ret:=(l->>'devueltos')::integer-(old->>'devueltos')::integer;
  IF delta>0 THEN
   SELECT * INTO stock FROM public.decimos WHERE numero=l->>'numero' AND serie=l->>'serie' AND fraccion=l->>'fraccion' AND ubicacion=a.local_id AND loteria=a.loteria ORDER BY id LIMIT 1 FOR UPDATE;
   IF NOT FOUND OR stock.cantidad<delta THEN RAISE EXCEPTION 'Stock insuficiente para liquidar esta línea'; END IF;
   UPDATE public.decimos SET cantidad=cantidad-delta WHERE id=stock.id;
   IF ret>0 THEN INSERT INTO public.decimos(id,numero,serie,fraccion,cantidad,ubicacion,estado,loteria) VALUES(gen_random_uuid()::text,l->>'numero',l->>'serie',l->>'fraccion',ret,'central','venta',a.loteria); END IF;
  END IF;
 END LOOP;
 INSERT INTO public.liquidacion_solicitudes(solicitud,albaran_id,usuario_id,firma,importe,lineas) VALUES(p_solicitud,p_id,auth.uid(),p_firma,p_importe,p_lineas);
 IF p_importe>0 THEN INSERT INTO public.pagos(albaran_id,usuario_id,importe,metodo,nombre,firma,solicitud) VALUES(p_id,auth.uid(),p_importe,p_metodo,nombre_usuario,p_firma,p_solicitud); END IF;
 UPDATE public.albaranes SET lineas=p_lineas,total=total+p_importe,estado=CASE WHEN total+p_importe>=debido THEN 'pagado' WHEN total+p_importe>0 THEN 'parcial' ELSE 'pendiente' END,fecha_pago=CASE WHEN p_importe>0 THEN now() ELSE fecha_pago END,cobrado_por=CASE WHEN p_importe>0 THEN nombre_usuario ELSE cobrado_por END,firma_cobro=CASE WHEN p_importe>0 THEN p_firma ELSE firma_cobro END WHERE id=p_id;
END; $$;
REVOKE ALL ON FUNCTION public.registrar_cobro(text,jsonb,numeric,text,text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registrar_cobro(text,jsonb,numeric,text,text,uuid) TO authenticated;