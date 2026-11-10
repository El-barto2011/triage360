# Memoria Técnica — TRIAGE360
Última actualización: 2026-11-10 · Última operación: Reconocimiento #2 + arreglos publicados (fechas, cron, alertas, reportes, permisos BD, estado de paciente en cola, sincronización offline sin duplicados, pasaporte, selector de insumos)
Próximo paso sugerido: Alfredo prueba en un evento real el flujo "En espera → Atender → Alta" · hacer el repo privado · siguiente mejora: completar una atención en espera desde la cola (hoy el médico crea una nueva) y app instalable (service worker)

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
- ⚠️ La skill `triage360-dev` está DESACTUALIZADA (describe monolito de 6.033 líneas, lista de tablas vieja y da por pendiente el form de eventos con fecha_fin/hora_inicio/hora_fin/observaciones, que YA está implementado). El README está al día.
- **2026-11-10**: 25 tablas (se sumaron `costos_insumos` y 3 tablas `masajes_anglo_*` de otro producto), 10 vistas (todas con security_invoker), 52 tests, build OK. Bundle principal ~2 MB sin comprimir (sin code-splitting). No hay service worker: el "modo offline" solo funciona mientras la pestaña siga abierta.
- **Uso real (BD)**: 13 eventos, todos cerrados; última atención clínica registrada en junio 2026. 41 atenciones médicas (40 sin signos vitales), 19 kine, 42 fichas maso. 0 pacientes con alergias registradas (solo se pueden cargar desde Historial Paciente, no al atender).
- **`components/common/CamposAtencion.jsx`** (nuevo): `EstadoPaciente`, `IdentificacionPaciente` (RUT/pasaporte), `useInsumosEvento` + `DatalistInsumos`. Reutilizar en cualquier formulario de atención nuevo.
- **`src/config/fechas.js`** (nuevo): única fuente de "hoy" en hora local. NO volver a usar `new Date().toISOString().split("T")[0]` para "hoy" (es UTC: en Chile cambia de día a las 20–21 h).
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
| 2026-11-10 | Políticas RLS endurecidas (migración `20261110120000`): `perfiles` solo admin edita/crea; `medicamentos` lectura para todos, ajuste clínico, alta/baja admin; `pacientes` edición solo perfil activo; `fn_descontar_stock` exige rol clínico y ≥3 letras | 🔴→✅ | ✅ VERIFICADO simulando en BD a un no-admin (0 filas modificadas, RPC bloqueado) y a un admin (sigue pudiendo); transacción revertida |
| 2026-11-10 | `/api/send-email`: cualquier usuario logueado podía enviar correos de asignación a cualquier destinatario con HTML sin escapar | 🟡 | ✅ en rama — solo admin para asignación/reporte, HTML escapado, destinatario y evento_id validados |
| 2026-11-10 | Repo sigue PÚBLICO (verificado por API). Tablas `masajes_anglo_*`: 6 funciones SECURITY DEFINER ejecutables por anon (por diseño, protegidas con clave) — revisar fortaleza de la clave | 🟡 | abierto |
| 2026-11-10 | Sin recuperación/cambio de contraseña en la app; login no verificaba `activo` | 🟡 | parcial — login ahora bloquea perfiles desactivados (rama); reset de contraseña pendiente |
| 2026-11-10 | Ley 21.719 (datos personales, salud = dato sensible) entra en vigencia el 1-dic-2026 (hay proyecto para postergarla a oct-2027, aún no es ley). Falta: registro de consentimiento, log de LECTURAS de ficha, política de retención | 🟡 | abierto |

## Pruebas (Ejecutor)
- Pendiente primera batería (próxima operación). Prioridades: flujo "Atenciones Mensuales" crear/editar/borrar (rotura A), pestaña Valorización (rotura B), cola offline con escritura fallida, inserción de logs de auditoría.

| Bug | Severidad | Estado | Detectado | Cerrado |
|---|---|---|---|---|
| A: CRUD de VistaAtenciones escribe a tabla `atenciones` inexistente | 🟡 (reclasif. de 🔴) | ✅ VERIFICADO — era CÓDIGO MUERTO: abrirNueva/guardar/eliminar y el modal nunca se invocaban (sin botón). La vista es solo-lectura; la creación real ocurre en las vistas por especialidad. Eliminado. | 2026-07-08 | 2026-07-09 |
| B: Valorización/Reportes consultan `costos_insumos` + 4 vistas inexistentes | 🟢 (reclasif.) | ✅ Las 4 vistas y la tabla YA EXISTEN en la BD (verificado 2026-11-10). `costos_insumos` tiene 0 filas: la valorización de insumos sale vacía hasta cargar costos. Dashboard aún tiene `costos = null` hardcodeado (pendiente reconectar). | 2026-07-08 | 2026-11-10 |
| C: Imports muertos (VistaCarros en App.js) y componentes legacy sin uso | 🟢 | parcial — import de App.js quitado (rama); `VistaCarros.jsx`/`VistaBolsoNaranja.jsx` siguen en el repo sin uso | 2026-07-08 | |
| D: alertBolso calculado desde constantes estáticas, no refleja stock real | 🟡 | ✅ en rama — App.js y Dashboard leen bolsos reales de `contenedores_medicamentos` | 2026-07-08 | 2026-11-10 |
| E: "Hoy" calculado en UTC en 11 vistas — desde las 20–21 h (Chile) la Cola de Triaje se vaciaba, "Atenciones de hoy" se partía y la fecha por defecto era la de mañana | 🔴 | ✅ en rama — helper `config/fechas.js` + 8 tests (también corridos con TZ=America/Santiago) | 2026-11-10 | 2026-11-10 |
| F: cron `check-events` cerraba el evento ~04:30 AM de su ÚLTIMO día (`fecha_fin=lte.hoy`). Evidencia BD: eventos 15, 16, 17, 19 y 27 cerrados en la madrugada del día en que terminaban | 🔴 | ✅ en rama — ahora `lt` + fecha de Chile + ignora eliminados | 2026-11-10 | 2026-11-10 |
| G: Dashboard "Alertas Críticas" marcaba como VENCIDO todo insumo SIN fecha de vencimiento (`new Date(null)` = 1970): ~589 falsas alertas que tapaban las 13 reales | 🔴 | ✅ en rama — `estadoVenc` seguro ante nulos + test | 2026-11-10 | 2026-11-10 |
| H: Reportes filtraban por NOMBRE de evento (11 atenciones kine/maso con texto desfasado quedaban fuera), incluían eliminadas y consultaban `administracion_medicamentos?evento=` (columna inexistente → error en cada reporte) | 🟡 | ✅ en rama — filtra por `evento_id`, excluye eliminadas, administraciones por `atencion_id` | 2026-11-10 | 2026-11-10 |
| I: Email de asignación no incluía horario, fecha fin ni observaciones (la plantilla los soportaba, el front no los enviaba) | 🟡 | ✅ en rama | 2026-11-10 | 2026-11-10 |
| J: Kinesiólogos ven "Mis Atenciones" pero el RLS de INSERT en `atenciones_medicas` no los incluye → "No tienes permiso" al guardar | 🟡 | ✅ Decisión de Alfredo: se les quitó la pestaña (registran solo en Kinesiología) | 2026-11-10 | 2026-11-10 |
| K: Atención guardada offline no descuenta stock al sincronizar, y sin clave de idempotencia puede duplicarse si la respuesta se pierde | 🟡 | ✅ `client_uuid` único en las 3 tablas de atención + reenvío con `on_conflict=client_uuid` (ignore-duplicates) + el RPC de stock se encola detrás de su atención. Verificado en BD con transacción revertida | 2026-11-10 | 2026-11-10 |
| L: Cola de Triaje no tiene estado de paciente (en espera / en atención / alta): todo paciente del día termina en "TIEMPO EXCEDIDO" aunque ya fue atendido | 🟡 | ✅ parcial — columna `estado_atencion` (en_espera/en_atencion/alta/derivado, default alta) + selector "¿Cómo queda el paciente?" en los 2 formularios + botones Atender/Alta/Derivar en la cola. FALTA: completar la atención en espera desde la cola (hoy el médico crea una atención nueva) | 2026-11-10 | |
| M: `handle_new_user` insertaba en columna inexistente (`evento_asignado`) y fallaba en silencio → usuario nuevo sin perfil; además asignaba 'Médico' por defecto | 🟡 | ✅ corregido en BD: crea perfil con user_id y SIN profesión (el admin la asigna en Usuarios). No probado creando un usuario real | 2026-11-10 | 2026-11-10 |
| N: Formularios médico y de enfermería solo aceptaban RUT; insumos en texto libre con descuento por coincidencia parcial | 🟡 | ✅ selector RUT/Pasaporte + autocompletar insumos del evento con stock + `fn_descontar_stock` prefiere coincidencia exacta | 2026-11-10 | 2026-11-10 |

## UX clínica (Revisor)
- Primera pasada 2026-11-10 (lectura de código + datos de uso, sin sesión en la app):
  - 🔴 Triaje e ingreso son el mismo formulario: no existe "ingreso rápido" (nombre + color en 10 s) separado de la atención completa. La cola muestra pacientes ya atendidos.
  - 🟡 40 de 41 atenciones sin signos vitales → el bloque no se usa; evaluar plegarlo o hacerlo obligatorio solo en ROJO/AMARILLO.
  - 🟡 Alergias no se preguntan al atender (0 registradas) → el chequeo alergia-medicamento nunca se activa.
  - 🟡 Formulario médico solo acepta RUT (sin pasaporte), aunque la BD y las otras vistas sí lo soportan.
  - 🟡 Insumos se escriben a mano (texto libre) y se descuentan por coincidencia parcial de nombre → riesgo de descontar el ítem equivocado.
  - 🟢 Login mostraba "usuarios se crean en Supabase → Authentication" (texto interno) → reemplazado en rama.

## Decisiones técnicas
| Fecha | Decisión | Por qué | Agente |
|---|---|---|---|
| 2026-07-08 | Memoria técnica creada; reconocimiento etapas 1-4 completado; pruebas/UX difereridas a operación 2 | Primera operación priorizó mapa + seguridad | Comandante |

## Changelog de la app (cambios hechos por el batallón)
| Fecha | Cambio | Archivos | Verificado con |
|---|---|---|---|
| 2026-07-08 | H1: `.env` limpiado (solo flag de build, sin credenciales) + advertencia anti-secretos. Verificado: nadie usa REACT_APP_SUPABASE_* en src/ ni api/; build no cambia | .env (commit 8cde152, pusheado + deploy READY) | grep de referencias + Vercel READY |
| 2026-11-10 | Migraciones aplicadas en producción: `seguridad_perfiles_medicamentos_stock` y `estado_atencion_y_client_uuid` (columnas aditivas, sin tocar datos existentes) | supabase/migrations/20261110120000_*.sql, 20261110121000_*.sql | Simulaciones con rol `authenticated` en bloque DO revertido: permisos, insert idempotente, cola, alta, vínculo de paciente por pasaporte, descuento exacto (19→17) |
| 2026-11-10 | Estado de paciente + cola con acciones; idempotencia offline + stock encolado; pasaporte e insumos con autocompletar en formularios médico y enfermería; pestaña "Mis Atenciones" fuera para kinesiólogos; costo mensual de medicamentos reconectado en Dashboard | components/common/CamposAtencion.jsx (nuevo), ColaTriaje, VistaAtencionesMedicas, VistaAtencionesEnfermeria, config/offlineQueue.js, config/supabase.js, App.js, Dashboard | 57/57 tests + build OK + eslint 0 errores. UI NO probada con sesión real |
| 2026-11-10 | Rama `claude/mejoras-app-2026-11`: bugs E, F, G, H, I, D + endurecimiento send-email + login bloquea desactivados + manifest PWA con nombre real + `evento` en atención médica + nombre real del administrador de medicamentos | src/config/fechas.js(+test), constants.js, App.js, Dashboard, ColaTriaje, 6 vistas de atención, VistaReportes, VistaGestionEventos, Login, api/check-events.js, api/send-email.js, public/manifest.json | 52/52 tests (UTC y America/Santiago) + `npm run build` OK + eslint 0 errores. NO probado con sesión real en la app |
| 2026-07-09 | Bug A: eliminado código muerto de VistaAtenciones (crear/editar/borrar + modal, ~177 líneas) que apuntaba a la tabla inexistente `atenciones`. Vista queda solo-lectura (comportamiento real ya vigente). Props `carros`/`permisos` quitadas de la llamada en App.js | src/components/atenciones/VistaAtenciones.jsx (566→389), src/App.js | babel parse OK en ambos + grep confirma 0 refs a tabla `atenciones` en código vivo |
