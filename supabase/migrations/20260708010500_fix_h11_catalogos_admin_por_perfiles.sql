-- H11: mismo patrón roto que H1. Las policies de escritura de los catálogos validaban admin por
-- auth.users.raw_user_meta_data->>'rol'='admin', pero ese metadata está NULL para los admins
-- (y authenticated ni siquiera puede leer auth.users). Efecto: los admins NO podían editar
-- insumos generales ni el bolso kines maestro. Fix: usar fn_es_admin() (basado en perfiles.rol).

-- catalogo_insumos (escritura)
DROP POLICY IF EXISTS "Only admins can insert catalogo_insumos" ON public.catalogo_insumos;
DROP POLICY IF EXISTS "Only admins can update catalogo_insumos" ON public.catalogo_insumos;
DROP POLICY IF EXISTS "Only admins can delete catalogo_insumos" ON public.catalogo_insumos;
CREATE POLICY "catalogo_insumos_admin_insert" ON public.catalogo_insumos
  FOR INSERT TO authenticated WITH CHECK ( public.fn_es_admin() );
CREATE POLICY "catalogo_insumos_admin_update" ON public.catalogo_insumos
  FOR UPDATE TO authenticated USING ( public.fn_es_admin() ) WITH CHECK ( public.fn_es_admin() );
CREATE POLICY "catalogo_insumos_admin_delete" ON public.catalogo_insumos
  FOR DELETE TO authenticated USING ( public.fn_es_admin() );

-- catalogo_insumos_kines (escritura)
DROP POLICY IF EXISTS "Only admins can insert catalogo_insumos_kines" ON public.catalogo_insumos_kines;
DROP POLICY IF EXISTS "Only admins can update catalogo_insumos_kines" ON public.catalogo_insumos_kines;
DROP POLICY IF EXISTS "Only admins can delete catalogo_insumos_kines" ON public.catalogo_insumos_kines;
CREATE POLICY "catalogo_kines_admin_insert" ON public.catalogo_insumos_kines
  FOR INSERT TO authenticated WITH CHECK ( public.fn_es_admin() );
CREATE POLICY "catalogo_kines_admin_update" ON public.catalogo_insumos_kines
  FOR UPDATE TO authenticated USING ( public.fn_es_admin() ) WITH CHECK ( public.fn_es_admin() );
CREATE POLICY "catalogo_kines_admin_delete" ON public.catalogo_insumos_kines
  FOR DELETE TO authenticated USING ( public.fn_es_admin() );
