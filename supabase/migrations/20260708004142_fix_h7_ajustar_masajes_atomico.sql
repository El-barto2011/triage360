-- H7 (MENOR): el contador de masoterapia masiva hacía read-modify-write (leer y reescribir n+1),
-- lo que puede perder cuentas con dos dispositivos simultáneos. Esta RPC hace el ajuste
-- atómico en la BD y nunca baja de 0. El masoterapeuta solo puede ajustar sus propios registros.
CREATE OR REPLACE FUNCTION public.fn_ajustar_masajes(p_id bigint, p_delta integer)
 RETURNS public.atenciones_masoterapia_masiva
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE r public.atenciones_masoterapia_masiva;
BEGIN
  UPDATE atenciones_masoterapia_masiva
     SET masajes_realizados = GREATEST(coalesce(masajes_realizados,0) + p_delta, 0),
         updated_at = now()
   WHERE id = p_id
     AND ( masoterapeuta_id = auth.uid() OR public.fn_es_admin() )
  RETURNING * INTO r;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Registro no encontrado o sin permiso';
  END IF;
  RETURN r;
END $function$;

REVOKE ALL ON FUNCTION public.fn_ajustar_masajes(bigint, integer) FROM public;
GRANT EXECUTE ON FUNCTION public.fn_ajustar_masajes(bigint, integer) TO authenticated;
