-- 2026-11-10 · Estado del paciente en la cola + identificador único para sincronización offline

-- Estado de la atención médica. Las atenciones ya registradas quedan como 'alta'.
alter table public.atenciones_medicas
  add column if not exists estado_atencion text not null default 'alta'
    check (estado_atencion in ('en_espera', 'en_atencion', 'alta', 'derivado')),
  add column if not exists estado_cambio_at timestamptz;

-- Identificador generado en el dispositivo: si una atención guardada sin conexión se
-- reenvía dos veces, la segunda se ignora en vez de duplicarse.
alter table public.atenciones_medicas      add column if not exists client_uuid uuid;
alter table public.atenciones_kinesiologia add column if not exists client_uuid uuid;
alter table public.fichas_masoterapia      add column if not exists client_uuid uuid;

create unique index if not exists atenciones_medicas_client_uuid_key      on public.atenciones_medicas (client_uuid);
create unique index if not exists atenciones_kinesiologia_client_uuid_key on public.atenciones_kinesiologia (client_uuid);
create unique index if not exists fichas_masoterapia_client_uuid_key      on public.fichas_masoterapia (client_uuid);
