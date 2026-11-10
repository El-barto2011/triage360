-- 2026-11-10 · Endurecimiento de permisos (aprobado por Alfredo)

-- 1) perfiles: solo un administrador edita o crea perfiles.
--    (Antes: cualquier usuario con sesión podía editar cualquier perfil, incluido su rol.)
drop policy if exists perfiles_update on public.perfiles;
drop policy if exists perfiles_update_admin on public.perfiles;
create policy perfiles_update_admin on public.perfiles
  for update to authenticated
  using (public.fn_es_admin())
  with check (public.fn_es_admin());

drop policy if exists perfiles_insert on public.perfiles;
drop policy if exists perfiles_insert_admin on public.perfiles;
create policy perfiles_insert_admin on public.perfiles
  for insert to authenticated
  with check (public.fn_es_admin());

-- 2) medicamentos: todos leen; personal clínico ajusta; solo admin crea y borra.
drop policy if exists "Autenticados pueden gestionar medicamentos" on public.medicamentos;
drop policy if exists medicamentos_select on public.medicamentos;
drop policy if exists medicamentos_update_clinico on public.medicamentos;
drop policy if exists medicamentos_insert_admin on public.medicamentos;
drop policy if exists medicamentos_delete_admin on public.medicamentos;
create policy medicamentos_select on public.medicamentos
  for select to authenticated using (true);
create policy medicamentos_update_clinico on public.medicamentos
  for update to authenticated
  using (public.fn_tiene_rol(array['Médico','Enfermero/a','Paramédico']))
  with check (public.fn_tiene_rol(array['Médico','Enfermero/a','Paramédico']));
create policy medicamentos_insert_admin on public.medicamentos
  for insert to authenticated with check (public.fn_es_admin());
create policy medicamentos_delete_admin on public.medicamentos
  for delete to authenticated using (public.fn_es_admin());

-- 3) pacientes: la ficha la edita solo un profesional con perfil activo.
drop policy if exists pacientes_update on public.pacientes;
drop policy if exists pacientes_update_activo on public.pacientes;
create policy pacientes_update_activo on public.pacientes
  for update to authenticated
  using (public.fn_tiene_rol(array['Médico','Enfermero/a','Paramédico','Kinesiólogo/a','Masoterapeuta']))
  with check (public.fn_tiene_rol(array['Médico','Enfermero/a','Paramédico','Kinesiólogo/a','Masoterapeuta']));

-- 4) Alta de usuarios: el trigger insertaba en una columna inexistente (evento_asignado),
--    fallaba en silencio y dejaba al usuario nuevo sin perfil. Además asignaba 'Médico'
--    por defecto. Ahora crea el perfil sin profesión: el admin la asigna en "Usuarios".
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  insert into public.perfiles (id, user_id, email, nombre, profesion, rol, created_at)
  values (new.id, new.id, new.email, new.email, null, 'profesional', now())
  on conflict (id) do nothing;
  return new;
exception when others then
  raise log 'Error en handle_new_user: %', sqlerrm;
  return new;
end;
$function$;

-- 5) fn_descontar_stock: exige rol clínico, mínimo 3 letras y prefiere coincidencia EXACTA
--    de nombre antes de caer a la coincidencia parcial.
create or replace function public.fn_descontar_stock(p_evento_id bigint, p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  it jsonb;
  v_nombre text;
  v_patron text;
  v_cant numeric;
  v_restante numeric;
  v_desc numeric;
  v_total numeric;
  v_exacto boolean;
  r record;
  v_asignados text[];
  v_out jsonb := '[]'::jsonb;
begin
  if not public.fn_tiene_rol(array['Médico','Enfermero/a','Paramédico']) then
    raise exception 'Sin permiso para descontar stock' using errcode = '42501';
  end if;

  -- Contenedores asignados al evento: carros (text[]) + bolsos (jsonb array)
  select coalesce(carros_asignados, '{}'::text[])
         || coalesce(array(select jsonb_array_elements_text(coalesce(bolsos_asignados, '[]'::jsonb))), '{}'::text[])
    into v_asignados
  from equipos_evento where id = p_evento_id;
  v_asignados := coalesce(v_asignados, '{}'::text[]);

  for it in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    v_nombre := trim(coalesce(it->>'nombre', ''));
    v_cant   := coalesce(nullif(it->>'cantidad', '')::numeric, 1);
    if v_nombre = '' or v_cant <= 0 then continue; end if;

    v_restante := v_cant;
    v_total    := 0;

    if length(v_nombre) >= 3 then
      v_patron := '%' || replace(replace(replace(v_nombre, '\', '\\'), '%', '\%'), '_', '\_') || '%';
      v_exacto := exists (
        select 1 from contenedores_medicamentos
        where deleted_at is null and lower(trim(nombre_insumo)) = lower(v_nombre)
      );

      for r in
        select id, stock from contenedores_medicamentos
        where deleted_at is null
          and stock > 0
          and ( (v_exacto and lower(trim(nombre_insumo)) = lower(v_nombre))
             or (not v_exacto and nombre_insumo ilike v_patron) )
        order by (nombre = any(v_asignados)) desc, stock desc
        for update
      loop
        exit when v_restante <= 0;
        v_desc := least(r.stock, v_restante);
        update contenedores_medicamentos
          set stock = stock - v_desc, updated_at = now()
          where id = r.id;
        v_restante := v_restante - v_desc;
        v_total    := v_total + v_desc;
      end loop;
    end if;

    v_out := v_out || jsonb_build_object(
      'item', v_nombre, 'solicitado', v_cant,
      'descontado', v_total, 'faltante', greatest(v_restante, 0)
    );
  end loop;

  return v_out;
end $function$;
