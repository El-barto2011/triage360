-- H9 (MENOR/rendimiento): índices en FKs usadas en joins + optimización de policies SELECT.

-- H9a: índices en FKs (evita seq scans a medida que crecen los datos)
CREATE INDEX IF NOT EXISTS idx_admin_meds_updated_by       ON public.administracion_medicamentos(updated_by);
CREATE INDEX IF NOT EXISTS idx_maso_masiva_evento          ON public.atenciones_masoterapia_masiva(evento_id);
CREATE INDEX IF NOT EXISTS idx_maso_masiva_masoterapeuta   ON public.atenciones_masoterapia_masiva(masoterapeuta_id);
CREATE INDEX IF NOT EXISTS idx_equipos_evento_cerrado_por  ON public.equipos_evento(cerrado_por);

-- H9b: envolver auth.uid() en (select auth.uid()) dentro de las policies SELECT marcadas
-- por el linter (auth_rls_initplan). Mismo comportamiento, se evalúa una vez por consulta.
DROP POLICY IF EXISTS atenciones_medicas_select ON public.atenciones_medicas;
CREATE POLICY atenciones_medicas_select ON public.atenciones_medicas
  FOR SELECT TO authenticated
  USING (
    public.fn_es_admin()
    OR public.fn_asignado_evento(evento_id)
    OR medico_id      = (select auth.uid())
    OR enfermero_id   = (select auth.uid())
    OR paramedico_id  = (select auth.uid())
    OR kinesiologo_id = (select auth.uid())
  );

DROP POLICY IF EXISTS atenciones_kine_select ON public.atenciones_kinesiologia;
CREATE POLICY atenciones_kine_select ON public.atenciones_kinesiologia
  FOR SELECT TO authenticated
  USING (
    public.fn_es_admin()
    OR public.fn_asignado_evento(evento_id)
    OR kinesiologo_id = (select auth.uid())
  );

DROP POLICY IF EXISTS fichas_maso_select ON public.fichas_masoterapia;
CREATE POLICY fichas_maso_select ON public.fichas_masoterapia
  FOR SELECT TO authenticated
  USING (
    public.fn_es_admin()
    OR public.fn_asignado_evento(evento_id)
    OR masoterapeuta_id = (select auth.uid())
  );

DROP POLICY IF EXISTS maso_masiva_select ON public.atenciones_masoterapia_masiva;
CREATE POLICY maso_masiva_select ON public.atenciones_masoterapia_masiva
  FOR SELECT TO authenticated
  USING (
    public.fn_es_admin()
    OR public.fn_asignado_evento(evento_id)
    OR masoterapeuta_id = (select auth.uid())
  );
