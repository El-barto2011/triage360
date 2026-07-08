-- H5 (MEDIO): el match difuso por substring podía asociar un nombre corto/genérico del catálogo
-- a un ítem equivocado y traer un precio incorrecto. Se mantiene la prioridad por alias exacto
-- y se agregan guardas: longitud mínima de 4 y, para el match inverso, que el nombre ingresado
-- también tenga largo suficiente. Mantiene "order by length desc limit 1" (prefiere el más específico).
CREATE OR REPLACE FUNCTION public.fn_match_item(p_nombre text)
 RETURNS TABLE(medicamento_id bigint, insumo_id bigint, insumo_kine_id bigint, precio numeric)
 LANGUAGE sql
 STABLE
 SET search_path TO 'public'
AS $function$
  select
    coalesce(al.medicamento_id, m.id),
    coalesce(al.insumo_id, ci.id),
    coalesce(al.insumo_kine_id, cik.id),
    coalesce(mal.precio_unitario, cial.precio_unitario, cikal.precio_unitario,
             m.precio_unitario, ci.precio_unitario, cik.precio_unitario)
  from (select 1) x
  left join catalogo_alias al on al.alias = lower(trim(p_nombre))
  left join medicamentos mal on mal.id = al.medicamento_id
  left join catalogo_insumos cial on cial.id = al.insumo_id
  left join catalogo_insumos_kines cikal on cikal.id = al.insumo_kine_id
  left join lateral (
    select id, precio_unitario from medicamentos
    where al.id is null
      and length(trim(nombre)) >= 4
      and lower(p_nombre) like '%' || lower(nombre) || '%'
    order by length(nombre) desc limit 1) m on true
  left join lateral (
    select id, precio_unitario from catalogo_insumos
    where al.id is null
      and length(trim(nombre)) >= 4
      and ( lower(p_nombre) like '%' || lower(nombre) || '%'
            or (length(trim(p_nombre)) >= 4 and lower(nombre) like '%' || lower(p_nombre) || '%') )
    order by length(nombre) desc limit 1) ci on true
  left join lateral (
    select id, precio_unitario from catalogo_insumos_kines
    where al.id is null
      and length(trim(nombre)) >= 4
      and ( lower(p_nombre) like '%' || lower(nombre) || '%'
            or (length(trim(p_nombre)) >= 4 and lower(nombre) like '%' || lower(p_nombre) || '%') )
    order by length(nombre) desc limit 1) cik on true
$function$;
