-- H3 (MEDIO): INSERT/UPDATE estaban abiertos a cualquier autenticado (auth.uid() IS NOT NULL),
-- lo que permitía a kinesiólogos/masoterapeutas insertar o editar atenciones médicas vía API.
-- Fix: limitar la escritura al staff clínico (admin/médico/enfermero/paramédico) usando fn_tiene_rol.
-- El SELECT (que ya restringe por asignación/autoría) NO se toca aquí.

DROP POLICY IF EXISTS atenciones_medicas_insert ON public.atenciones_medicas;
CREATE POLICY atenciones_medicas_insert ON public.atenciones_medicas
  FOR INSERT TO authenticated
  WITH CHECK ( public.fn_tiene_rol(ARRAY['Médico','Enfermero/a','Paramédico']) );

DROP POLICY IF EXISTS atenciones_medicas_update ON public.atenciones_medicas;
CREATE POLICY atenciones_medicas_update ON public.atenciones_medicas
  FOR UPDATE TO authenticated
  USING ( public.fn_tiene_rol(ARRAY['Médico','Enfermero/a','Paramédico']) )
  WITH CHECK ( public.fn_tiene_rol(ARRAY['Médico','Enfermero/a','Paramédico']) );

-- Alinear el DELETE (solo admin) a fn_es_admin(), en vez de raw_user_meta_data
-- (que no necesariamente contiene el rol y podía impedir el borrado a admins reales).
DROP POLICY IF EXISTS "Solo admins pueden eliminar atenciones medicas" ON public.atenciones_medicas;
CREATE POLICY atenciones_medicas_delete ON public.atenciones_medicas
  FOR DELETE TO authenticated
  USING ( public.fn_es_admin() );
