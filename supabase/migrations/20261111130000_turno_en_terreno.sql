-- 2026-11-11 · Turno en terreno: campos por industria, alergias en el ingreso,
-- derivación estructurada y plantillas de atención. Todo aditivo.

alter table public.atenciones_medicas
  add column if not exists datos_extra jsonb not null default '{}'::jsonb,  -- dorsal, disciplina y otros campos por industria
  add column if not exists alergias   text,                                 -- lo declarado al ingresar
  add column if not exists derivacion jsonb;                                -- { destino, hora_salida, medio, acompanante }

comment on column public.atenciones_medicas.datos_extra is 'Campos extra según industria (p. ej. "Número de dorsal", "Disciplina deportiva")';
comment on column public.atenciones_medicas.derivacion  is 'Derivación: destino, hora_salida, medio, acompanante';

-- Plantillas de atención: las define el equipo clínico (médico o admin) a partir de casos reales.
create table if not exists public.plantillas_atencion (
  id              bigint generated always as identity primary key,
  nombre          text not null check (length(trim(nombre)) between 2 and 60),
  motivo_consulta text,
  diagnostico     text,
  tratamiento     text,
  observaciones   text,
  insumos         jsonb not null default '[]'::jsonb,
  activa          boolean not null default true,
  creado_por      uuid default auth.uid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
alter table public.plantillas_atencion enable row level security;

drop policy if exists plantillas_select on public.plantillas_atencion;
create policy plantillas_select on public.plantillas_atencion
  for select to authenticated using (true);
drop policy if exists plantillas_insert on public.plantillas_atencion;
create policy plantillas_insert on public.plantillas_atencion
  for insert to authenticated with check (public.fn_tiene_rol(array['Médico']));
drop policy if exists plantillas_update on public.plantillas_atencion;
create policy plantillas_update on public.plantillas_atencion
  for update to authenticated
  using (public.fn_tiene_rol(array['Médico'])) with check (public.fn_tiene_rol(array['Médico']));
drop policy if exists plantillas_delete on public.plantillas_atencion;
create policy plantillas_delete on public.plantillas_atencion
  for delete to authenticated using (public.fn_tiene_rol(array['Médico']));

revoke all on public.plantillas_atencion from anon;

-- Ficha única del paciente: si la atención trae alergias, quedan en su ficha
-- (sin borrar las que ya tenía). to_jsonb(new) permite que el mismo trigger siga
-- sirviendo a las tablas que no tienen la columna alergias.
create or replace function public.fn_vincular_paciente()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_tipo     text;
  v_ident    text;
  v_pid      bigint;
  v_alergias text;
begin
  v_tipo  := upper(coalesce(nullif(trim(new.tipo_identificacion), ''), 'RUT'));
  v_ident := fn_norm_ident(case when v_tipo = 'PASAPORTE' then new.paciente_pasaporte else new.paciente_rut end);
  if v_ident = '' then return new; end if;

  v_alergias := nullif(trim(coalesce(to_jsonb(new)->>'alergias', '')), '');
  -- "Sin alergias conocidas" queda en la atención (consta que se preguntó) pero no se
  -- copia a la ficha: ahí solo van alergias reales.
  if lower(coalesce(v_alergias, '')) like 'sin alergias%' then v_alergias := null; end if;

  insert into pacientes (tipo_identificacion, identificacion, nombre, edad, alergias)
  values (v_tipo, v_ident, coalesce(new.paciente_nombre, ''), new.paciente_edad, v_alergias)
  on conflict (identificacion) do update
    set nombre     = coalesce(nullif(excluded.nombre, ''), pacientes.nombre),
        edad       = coalesce(excluded.edad, pacientes.edad),
        alergias   = coalesce(excluded.alergias, pacientes.alergias),
        updated_at = now()
  returning id into v_pid;

  new.paciente_id := v_pid;
  return new;
end $function$;
