-- H1 (CRÍTICO): la policy anterior comparaba perfiles.rol con 'medico/enfermero/paramedico',
-- valores que NO existen (rol solo es 'admin'/'profesional'; la profesión está en perfiles.profesion).
-- Efecto: médicos/enfermeros/paramédicos veían 0 carros clínicos y no podían editar stock.
-- Fix: usar fn_tiene_rol, que ya contempla rol='admin' OR profesion IN (...).

DROP POLICY IF EXISTS "Permitir todo a staff médico" ON public.contenedores_medicamentos;

CREATE POLICY "staff_clinico_lee_contenedores" ON public.contenedores_medicamentos
  FOR SELECT TO authenticated
  USING ( public.fn_tiene_rol(ARRAY['Médico','Enfermero/a','Paramédico']) );

CREATE POLICY "staff_clinico_escribe_contenedores" ON public.contenedores_medicamentos
  FOR ALL TO authenticated
  USING ( public.fn_tiene_rol(ARRAY['Médico','Enfermero/a','Paramédico']) )
  WITH CHECK ( public.fn_tiene_rol(ARRAY['Médico','Enfermero/a','Paramédico']) );
