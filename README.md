# TRIAGE360

Plataforma SaaS de gestión clínica para eventos deportivos y masivos.

**Producción:** https://triage360.vercel.app  
**Landing:** https://triage360.cl  
**Empresa:** SGTRUMAO SpA

## Stack

- React (src/App.js + 45 componentes en src/components/)
- Supabase (project ID: dnlvzwrujosuckdzmffx)
- Vercel (auto-deploy desde main)
- Cloudflare DNS
- Resend (emails, dominio sgtrumao.cl, región sa-east-1)

## Estructura
## Tablas Supabase principales

| Tabla | Descripción |
|-------|-------------|
| perfiles | Usuarios (auth.uid()) |
| equipos_evento | Eventos con equipo asignado |
| atenciones_medicas | Fichas clínicas médicas |
| atenciones_kinesiologia | Fichas kinesiológicas |
| fichas_masoterapia | Fichas de masoterapia individual |
| atenciones_masoterapia_masiva | Contador masoterapia masiva |
| contenedores_medicamentos | Carros clínicos (7 carros × 97 insumos) |
| medicamentos | Catálogo de medicamentos |
| administracion_medicamentos | Administración de meds prescritos |
| logs_auditoria | Auditoría de acciones críticas |
| historial_administracion_medicamentos | Historial de cambios en meds |
| catalogo_insumos | Insumos generales (123 items) |
| catalogo_insumos_kines | Insumos kinesiología |
| insumos_kinesiologia | Stock bolso kinesiólogo |

## Historial de migraciones relevantes

- **2026-05-02:** Tabla `atenciones` eliminada y migrada a `atenciones_medicas`
- **2026-06-04:** Campo `evento` (TEXT legacy) eliminado de payloads, se usa solo `evento_id` (FK)
- **2026-06-04:** Columnas `updated_at` y `deleted_at` agregadas a `contenedores_medicamentos`
- **2026-06-04:** Refactorización completa App.js → 45 componentes .jsx separados

## Deploy

```bash
git add . && git commit -m "descripción" && git push
# Vercel auto-deploya desde main
```

## Admins

- Alfredo Jara (alfredo.jara@sgtrumao.cl)
- Francia Muñoz López (francia.munoz@sgtrumao.cl)
