-- Ficha clínica ampliada (ya aplicado en producción el 22-nov-2026; idempotente)
ALTER TABLE atenciones_medicas
  ADD COLUMN IF NOT EXISTS estado_general    text,
  ADD COLUMN IF NOT EXISTS examen_fisico     text,
  ADD COLUMN IF NOT EXISTS indicaciones_alta text,
  ADD COLUMN IF NOT EXISTS glicemia_capilar  numeric;  -- mg/dL

-- Registro de descargas de reportes (logs_auditoria no tiene INSERT para clientes)
CREATE OR REPLACE FUNCTION public.fn_registrar_descarga(p_evento text, p_tipo text, p_detalle jsonb DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_nombre text;
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  SELECT COALESCE(nombre, email) INTO v_nombre FROM perfiles WHERE id = auth.uid() OR user_id = auth.uid() LIMIT 1;
  INSERT INTO logs_auditoria (tabla, accion, datos_nuevos, usuario_id, usuario_nombre)
  VALUES ('reportes', 'DESCARGA_' || upper(left(coalesce(p_tipo,'?'), 40)),
          jsonb_build_object('evento', p_evento) || coalesce(p_detalle, '{}'::jsonb),
          auth.uid(), v_nombre);
END $$;
REVOKE ALL ON FUNCTION public.fn_registrar_descarga(text, text, jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.fn_registrar_descarga(text, text, jsonb) TO authenticated;
