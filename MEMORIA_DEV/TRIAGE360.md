# Memoria Técnica — TRIAGE360
Última actualización: 2026-07-09 · Última operación: Fase 1 seguridad — H1 (.env) parchado y verificado en producción
Próximo paso sugerido: Alfredo activa leaked password protection + evalúa repo privado → luego Fase 2: bug A (CRUD tabla `atenciones` inexistente)

## Mapa funcional (Analista)
- **Qué es**: SaaS de gestión clínica para eventos deportivos/masivos. Producción: triage360.vercel.app · Supabase `dnlvzwrujosuckdzmffx` · Vercel auto-deploy desde main · Resend (sa-east-1, sgtrumao.cl).
- **Roles**: admin + profesiones (Médico, Enfermero/a, Paramédico, Kinesiólogo/a, Masoterapeuta). Permisos por tab en `PERMISOS_TAB` (App.js) + `config/permisos.js`.
- **Multi-industria** (config/permisos.js): eventos / minería / educación / emergencias — tipos de atención y campos extra por industria. La visión SaaS ya está codificada.
- **24 vistas en 6 grupos**: General (Dashboard), Operación (Atenciones, Prescripción, Cola Triaje 30s, Mis Atenciones, Administración Meds, Kinesiología, Masoterapia), Inventario (Carros 7×97, Bolsos Meds 3×26, Bolso Kine), Finanzas (Reportes, Rentabilidad, Valorización, Precios Meds/Kine, Insumos 123), Pacientes (Historial por RUT, Fusión duplicados), Admin (Eventos, Usuarios, Historial Meds, Logs Auditoría, Config).
- **Infra de calidad ya presente**: modo offline con cola (offlineQueue), restauración de sesión con refresh automático, ErrorBoundary, toasts, realtime, mobile bottom-nav, tests en config/.
- **API serverless** (Vercel /api): send-email.js (Resend), check-events.js y check-stock.js (crons de alertas).
- **Features fantasma detectadas**: `VistaCarros.jsx` y `VistaBolsoNaranja.jsx` (legacy, reemplazadas por versiones DB), estado `carros=CARROS_INICIALES` estático aún se pasa a 4 componentes, `alertBolso` se calcula desde constantes estáticas y no desde BD.

## Mapa estructural (Arquitecto)
- **Refactor 2026-06-04**: App.js 625 líneas (router + nav + permisos) + ~45 componentes en `src/components/{admin,atenciones,auth,common,dashboard,eventos,inventario,kinesiologia,masoterapia,pacientes,reportes,ui}` + `src/config/` (constants, permisos, supabase, offlineQueue, realtime, theme, pacientes) + tests. Total ~13.5k líneas sin backup.
- ⚠️ La skill `triage360-dev` está DESACTUALIZADA (describe monolito de 6.033 líneas y lista de tablas vieja). El README está al día.
- **Acceso a datos**: wrapper REST propio `sb()` en config/supabase.js (fetch + PostgREST) con manejo de sesión, cola offline y reintentos — NO usa el cliente supabase-js para queries (aunque está en package.json).
- **Componentes más grandes**: VistaReportes 790, VistaAtencionesMedicas 702, VistaGestionEventos 659, VistaGestionCostos 622, Dashboard 582.
- **Esquema real Supabase (22 tablas, RLS 100%)**: perfiles(17), equipos_evento(13=eventos), asignaciones_evento(24), atenciones_medicas(41), atenciones_kinesiologia(19), fichas_masoterapia(42), atenciones_masoterapia_masiva(6), administracion_medicamentos(1), historial_administracion_medicamentos(1), pacientes(28), contenedores_medicamentos(757), medicamentos(26), insumos_kinesiologia(270), catalogo_insumos(123), catalogo_insumos_kines(30), catalogo_alias(17), consumos_evento(75), ingresos_evento(1), gastos_evento(0), logs_auditoria(51), anamnesis_nutricion(2) ⚠️ producto distinto en mismo proyecto.
- **Vistas SQL existentes**: v_rentabilidad_evento, vista_bolso_kines_maestro, vista_resumen_bolso_kines, vista_resumen_general, vista_stats_por_evento, vista_valor_inventario_completo_v3.
- **Deuda estructural**: 🟡 App.js.backup (253KB) en src/ (ya hay regla en .gitignore para `*.backup` pero este está commiteado desde antes); 🟡 skill de dev desactualizada; 🟢 componentes >600 líneas candidatos a dividir cuando duelan.

## Mapa de relaciones (Cartógrafo)
- **Tablas más acopladas**: equipos_evento (15 refs — eje del sistema: todo cuelga del evento), atenciones_medicas (11), insumos_kinesiologia (9), medicamentos (8), contenedores_medicamentos (6).
- **Cadena crítica de atención**: SelectorEvento (contexto global evento) → Vistas de atención → tablas atenciones_* → consumos/stock vía RPCs SECURITY DEFINER (fn_descontar_stock) → alertas cron.
- **RPCs usadas por el front**: fn_descontar_stock, fn_fusionar_pacientes, fn_historial_paciente, fn_ajustar_masajes, fn_asignado_evento, fn_es_admin, fn_tiene_rol.
- **🔴 VACÍO/ROTURA A: escrituras a tabla inexistente `atenciones`** — VistaAtenciones.jsx líneas ~106 (POST), ~114 (PATCH), ~129 (DELETE). La tabla fue eliminada 2026-05-02. Crear/editar/borrar desde "Atenciones Mensuales" debe fallar hoy. Lectura OK (lee las 3 tablas nuevas).
- **🔴 VACÍO/ROTURA B: Valorización/Reportes consultan relaciones inexistentes** — tabla `costos_insumos` (5 refs) y vistas `vista_costos_medicamentos_por_evento`, `vista_resumen_costos_medicamentos`, `vista_top_medicamentos_costosos`, `vista_valor_completo_por_contenedor` NO existen en la BD. Afecta VistaGestionCostos.jsx y VistaReportes.jsx. Hipótesis: vistas nunca migradas o renombradas (existe v3 del inventario).
- **Vacíos pendientes (para Ejecutor)**: confirmar en producción qué muestra la pestaña Valorización; cómo se insertan logs_auditoria (solo hay política SELECT — ¿trigger?); si la cola offline reintenta correctamente escrituras fallidas por tabla inexistente (riesgo de cola atascada).

## Seguridad (Auditor)
| Fecha | Hallazgo | Severidad | Estado |
|---|---|---|---|
| 2026-07-08 | `.env` commiteado en GitHub — RECLASIFICADO 🔴→🟡: contenía solo URL + anon key (pública por diseño) y flag ESLint; sin secretos reales. RESEND_API_KEY/SERVICE_ROLE/CRON_SECRET viven solo en Vercel. No requiere rotación | 🟡 | ✅ VERIFICADO: push hecho, deploy dpl_J5Mjbvg READY en producción (app.triage360.cl) 2026-07-09 |
| 2026-07-09 | Repo GitHub El-barto2011/triage360 es PÚBLICO — código fuente completo del SaaS comercial expuesto (lógica, migraciones, historial). Recomendación: hacerlo privado (GitHub → Settings → Danger Zone → Change visibility); Vercel sigue funcionando igual | 🟡 | abierto |
| 2026-07-08 | RLS habilitado en 22/22 tablas con políticas — muy buen estado general | ✅ | — |
| 2026-07-08 | 7 funciones SECURITY DEFINER ejecutables por authenticated (advisors WARN): fn_descontar_stock, fn_fusionar_pacientes, fn_ajustar_masajes, fn_historial_paciente, fn_asignado_evento, fn_es_admin, fn_tiene_rol — varias son intencionales; revisar validaciones internas de las 3 primeras (mutan datos) | 🟡 | abierto |
| 2026-07-08 | Protección de contraseñas filtradas (HaveIBeenPwned) desactivada en Auth | 🟡 | abierto |
| 2026-07-08 | logs_auditoria solo tiene política SELECT — verificar mecanismo de inserción (trigger/definer) o los logs no se están escribiendo | 🟡 | abierto |
| 2026-07-08 | anamnesis_nutricion (producto Nutri de Cami) vive en el MISMO proyecto Supabase que datos clínicos TRIAGE360 | 🟡 | abierto |
| 2026-07-08 | Rol/permisos de UI se leen de localStorage (client-side) — aceptable porque RLS es la barrera real, pero mantener esa disciplina | 🟢 | — |

## Pruebas (Ejecutor)
- Pendiente primera batería (próxima operación). Prioridades: flujo "Atenciones Mensuales" crear/editar/borrar (rotura A), pestaña Valorización (rotura B), cola offline con escritura fallida, inserción de logs de auditoría.

| Bug | Severidad | Estado | Detectado | Cerrado |
|---|---|---|---|---|
| A: CRUD de VistaAtenciones escribe a tabla `atenciones` inexistente | 🟡 (reclasif. de 🔴) | ✅ VERIFICADO — era CÓDIGO MUERTO: abrirNueva/guardar/eliminar y el modal nunca se invocaban (sin botón). La vista es solo-lectura; la creación real ocurre en las vistas por especialidad. Eliminado. | 2026-07-08 | 2026-07-09 |
| B: Valorización/Reportes consultan `costos_insumos` + 4 vistas inexistentes | 🔴 | abierto (ídem) | 2026-07-08 | |
| C: Imports muertos (VistaCarros en App.js) y componentes legacy sin uso | 🟢 | abierto | 2026-07-08 | |
| D: alertBolso calculado desde constantes estáticas, no refleja stock real | 🟡 | abierto | 2026-07-08 | |

## UX clínica (Revisor)
- Pendiente primera pasada (próxima operación, tras arreglos 🔴).

## Decisiones técnicas
| Fecha | Decisión | Por qué | Agente |
|---|---|---|---|
| 2026-07-08 | Memoria técnica creada; reconocimiento etapas 1-4 completado; pruebas/UX difereridas a operación 2 | Primera operación priorizó mapa + seguridad | Comandante |

## Changelog de la app (cambios hechos por el batallón)
| Fecha | Cambio | Archivos | Verificado con |
|---|---|---|---|
| 2026-07-08 | H1: `.env` limpiado (solo flag de build, sin credenciales) + advertencia anti-secretos. Verificado: nadie usa REACT_APP_SUPABASE_* en src/ ni api/; build no cambia | .env (commit 8cde152, pusheado + deploy READY) | grep de referencias + Vercel READY |
| 2026-07-09 | Bug A: eliminado código muerto de VistaAtenciones (crear/editar/borrar + modal, ~177 líneas) que apuntaba a la tabla inexistente `atenciones`. Vista queda solo-lectura (comportamiento real ya vigente). Props `carros`/`permisos` quitadas de la llamada en App.js | src/components/atenciones/VistaAtenciones.jsx (566→389), src/App.js | babel parse OK en ambos + grep confirma 0 refs a tabla `atenciones` en código vivo |
