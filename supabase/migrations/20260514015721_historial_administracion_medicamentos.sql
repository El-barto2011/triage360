-- Historial de cambios en administración de medicamentos
-- Captura INSERT, UPDATE y DELETE automáticamente vía trigger

-- 1. Columnas de auditoría en tabla principal
ALTER TABLE administracion_medicamentos
  ADD COLUMN IF NOT EXISTS updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);

-- 2. Tabla de historial
CREATE TABLE IF NOT EXISTS historial_administracion_medicamentos (
  id                bigserial PRIMARY KEY,
  administracion_id bigint NOT NULL,
  atencion_id       bigint,
  accion            text NOT NULL CHECK (accion IN ('INSERT','UPDATE','DELETE')),
  datos_anteriores  jsonb,
  datos_nuevos      jsonb,
  usuario_id        uuid,
  usuario_nombre    text,
  created_at        timestamptz DEFAULT now() NOT NULL
);

-- 3. RLS: solo admins pueden SELECT; INSERT lo hace el trigger (SECURITY DEFINER)
ALTER TABLE historial_administracion_medicamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "historial_meds_admins_select" ON historial_administracion_medicamentos
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM perfiles
      WHERE user_id = auth.uid() AND rol = 'admin'
    )
  );

-- 4. Trigger BEFORE UPDATE: mantiene updated_at y updated_by
CREATE OR REPLACE FUNCTION fn_set_updated_medicamentos()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  NEW.updated_by := auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_updated_medicamentos ON administracion_medicamentos;
CREATE TRIGGER trg_set_updated_medicamentos
  BEFORE UPDATE ON administracion_medicamentos
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_medicamentos();

-- 5. Trigger AFTER INSERT/UPDATE/DELETE: escribe en historial
CREATE OR REPLACE FUNCTION fn_historial_medicamentos()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_uid    uuid;
  v_nombre text;
  v_row_id bigint;
  v_ate_id bigint;
BEGIN
  v_uid := auth.uid();
  SELECT nombre INTO v_nombre FROM perfiles WHERE user_id = v_uid LIMIT 1;

  IF TG_OP = 'DELETE' THEN
    v_row_id := OLD.id;
    v_ate_id := OLD.atencion_id;
  ELSE
    v_row_id := NEW.id;
    v_ate_id := NEW.atencion_id;
  END IF;

  INSERT INTO historial_administracion_medicamentos
    (administracion_id, atencion_id, accion, datos_anteriores, datos_nuevos, usuario_id, usuario_nombre)
  VALUES (
    v_row_id,
    v_ate_id,
    TG_OP,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
    v_uid,
    v_nombre
  );

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_historial_medicamentos ON administracion_medicamentos;
CREATE TRIGGER trg_historial_medicamentos
  AFTER INSERT OR UPDATE OR DELETE ON administracion_medicamentos
  FOR EACH ROW EXECUTE FUNCTION fn_historial_medicamentos();
