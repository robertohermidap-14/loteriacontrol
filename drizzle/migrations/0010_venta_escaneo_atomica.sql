CREATE OR REPLACE FUNCTION public.vender_decimo(p_numero text, p_loteria text, p_solicitud uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d public.decimos%ROWTYPE; resultado jsonb;
BEGIN
 IF auth.uid() IS NULL OR NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'comercial')) THEN RAISE EXCEPTION 'Sin permiso'; END IF;
 IF p_numero !~ '^[0-9]{5}$' OR p_loteria NOT IN ('navidad','reyes','nacional') OR p_solicitud IS NULL THEN RAISE EXCEPTION 'Venta no válida'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext(p_solicitud::text));
 SELECT v.resultado INTO resultado FROM public.ventas_escaneo v WHERE v.solicitud=p_solicitud AND v.usuario_id=auth.uid();
 IF FOUND THEN RETURN resultado; END IF;
 SELECT * INTO d FROM public.decimos WHERE numero=p_numero AND ubicacion='central' AND estado='venta' AND loteria=p_loteria AND cantidad>0 ORDER BY serie,fraccion,id LIMIT 1 FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'No queda stock en venta de este número en administración'; END IF;
 UPDATE public.decimos SET cantidad=decimos.cantidad-1 WHERE id=d.id;
 resultado:=jsonb_build_object('numero',d.numero,'serie',d.serie,'fraccion',d.fraccion);
 INSERT INTO public.ventas_escaneo(solicitud,usuario_id,numero,loteria,resultado) VALUES(p_solicitud,auth.uid(),p_numero,p_loteria,resultado);
 RETURN resultado;
END $$;
REVOKE ALL ON FUNCTION public.vender_decimo(text,text,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.vender_decimo(text,text,uuid) TO authenticated;
CREATE INDEX IF NOT EXISTS decimos_venta_busqueda ON public.decimos(numero,loteria,serie,fraccion) WHERE ubicacion='central' AND estado='venta' AND cantidad>0;