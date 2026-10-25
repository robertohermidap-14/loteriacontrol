ALTER TABLE public.albaranes ADD COLUMN entregado_por text NOT NULL DEFAULT '';
UPDATE public.albaranes a SET entregado_por=trim(p.nombre || ' ' || p.apellidos) || ' · CAMINODESANTIAGOLOTERIA · Administración Nº 8 - Ferrol' FROM public.stock_solicitudes s JOIN public.profiles p ON p.id=s.usuario_id WHERE s.resultado->>'id'=a.id AND trim(p.nombre || ' ' || p.apellidos)<>'';
CREATE FUNCTION public.identificar_entrega() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE nombre_usuario text;
BEGIN
 IF TG_OP='INSERT' THEN
  IF auth.uid() IS NULL OR NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'comercial')) THEN RAISE EXCEPTION 'Sin permiso para entregar'; END IF;
  SELECT trim(nombre || ' ' || apellidos) INTO nombre_usuario FROM public.profiles WHERE id=auth.uid();
  IF coalesce(nombre_usuario,'')='' THEN RAISE EXCEPTION 'Completa tu nombre y apellidos antes de entregar'; END IF;
  NEW.entregado_por:=nombre_usuario || ' · CAMINODESANTIAGOLOTERIA · Administración Nº 8 - Ferrol';
 ELSE NEW.entregado_por:=OLD.entregado_por;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.identificar_entrega() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER identidad_entrega BEFORE INSERT OR UPDATE ON public.albaranes FOR EACH ROW EXECUTE FUNCTION public.identificar_entrega();
CREATE OR REPLACE FUNCTION public.leer_copia_albaran(p_hash text) RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT jsonb_build_object('id',a.id,'fecha',a.fecha,'estado',a.estado,'tipo',a.tipo,'loteria',a.loteria,'lineas',a.lineas,'total',a.total,'fechaPago',a.fecha_pago,'receptorNombre',a.receptor_nombre,'receptorDni',a.receptor_dni,'firma',a.firma,'entregadoPor',a.entregado_por,'cobradoPor',a.cobrado_por,'firmaCobro',a.firma_cobro,'localNombre',l.nombre,'localDireccion',l.direccion,'localTelefono',l.telefono,'localPersona',l.persona,'localDni',l.dni,'localEmail',l.email,'codigoCliente',l.codigo_cliente,'administracion',(SELECT jsonb_build_object('nombre',nombre,'razon_social',razon_social,'nif',nif,'direccion',direccion,'telefono',telefono,'email',email,'logo',logo) FROM public.configuracion WHERE id=1))
 FROM public.albaran_copias c JOIN public.albaranes a ON a.id=c.albaran_id JOIN public.locales l ON l.id=a.local_id WHERE c.token_hash=p_hash AND c.expires_at>now() AND length(p_hash)=64 LIMIT 1;
$$;