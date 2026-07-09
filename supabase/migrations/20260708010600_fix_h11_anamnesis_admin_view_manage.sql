-- H11 (anamnesis): mismo patrón roto. Los admins no podían ni siquiera VER las anamnesis
-- porque el metadata está NULL. Se corrige SELECT/UPDATE/DELETE con fn_es_admin().
-- El INSERT se deja pendiente de decisión (depende de si el formulario es público o admin).
DROP POLICY IF EXISTS "Admins can view all anamnesis" ON public.anamnesis_nutricion;
CREATE POLICY "anamnesis_admin_select" ON public.anamnesis_nutricion
  FOR SELECT TO authenticated USING ( public.fn_es_admin() );

DROP POLICY IF EXISTS "Admins can update anamnesis" ON public.anamnesis_nutricion;
CREATE POLICY "anamnesis_admin_update" ON public.anamnesis_nutricion
  FOR UPDATE TO authenticated USING ( public.fn_es_admin() ) WITH CHECK ( public.fn_es_admin() );

DROP POLICY IF EXISTS "Admins can delete anamnesis" ON public.anamnesis_nutricion;
CREATE POLICY "anamnesis_admin_delete" ON public.anamnesis_nutricion
  FOR DELETE TO authenticated USING ( public.fn_es_admin() );
